import { Joi, celebrate } from 'celebrate'
import { Types } from 'mongoose'
// eslint-disable-next-line import/no-extraneous-dependencies
import xss from 'xss'
import { Request, Response, NextFunction } from 'express'
import fs from 'fs'
import { fileTypeFromBuffer } from 'file-type'
import BadRequestError from '../errors/bad-request-error'

// eslint-disable-next-line no-useless-escape
export const phoneRegExp = /^[\+\d\s\-\(\)]{7,20}$/

export enum PaymentType {
    Card = 'card',
    Online = 'online',
}

// Функция для санитизации XSS
const sanitizeXSS = (value: string, helpers: any) => {
    const sanitized = xss(value, {
        whiteList: {},          // Никаких тегов не разрешено
        stripIgnoreTag: true,   // Удалить опасные теги
        stripIgnoreTagBody: ['script', 'style'], // Удалить содержимое опасных тегов
    });
    
    // Если после санитизации значение изменилось - были опасные символы
    if (sanitized !== value) {
        return helpers.error('any.invalid', { message: 'Обнаружены опасные символы' });
    }
    return sanitized;
};

// валидация id
export const validateOrderBody = celebrate({
    body: Joi.object().keys({
        items: Joi.array()
            .items(
                Joi.string().custom((value, helpers) => {
                    if (Types.ObjectId.isValid(value)) {
                        return value
                    }
                    return helpers.message({ custom: 'Невалидный id' })
                })
            )
            .messages({
                'array.empty': 'Не указаны товары',
            }),
        payment: Joi.string()
            .valid(...Object.values(PaymentType))
            .required()
            .messages({
                'string.valid':
                    'Указано не валидное значение для способа оплаты, возможные значения - "card", "online"',
                'string.empty': 'Не указан способ оплаты',
            }),
        email: Joi.string().email().required().messages({
            'string.empty': 'Не указан email',
        }),
        phone: Joi.string().required().pattern(phoneRegExp).messages({
            'string.empty': 'Не указан телефон',
        }),
        address: Joi.string().required()
            .custom(sanitizeXSS)
            .messages({
                'string.empty': 'Не указан адрес',
            }),
        total: Joi.number().required().messages({
            'string.empty': 'Не указана сумма заказа',
        }),
        comment: Joi.string().optional().allow('').custom(sanitizeXSS),
    }),
})

// валидация товара.
// name и link - обязательные поля, name - от 2 до 30 символов, link - валидный url
export const validateProductBody = celebrate({
    body: Joi.object().keys({
        title: Joi.string().required().min(2).max(30)
            .custom(sanitizeXSS)
            .messages({
                'string.min': 'Минимальная длина поля "name" - 2',
                'string.max': 'Максимальная длина поля "name" - 30',
                'string.empty': 'Поле "title" должно быть заполнено',
            }),
        image: Joi.object().keys({
            fileName: Joi.string().required(),
            originalName: Joi.string().required(),
        }),
        category: Joi.string().required()
            .custom(sanitizeXSS)
            .messages({
                'string.empty': 'Поле "category" должно быть заполнено',
            }),
        description: Joi.string().required()
            .custom(sanitizeXSS)
            .messages({
                'string.empty': 'Поле "description" должно быть заполнено',
            }),
        price: Joi.number().allow(null),
    }),
})

export const validateProductUpdateBody = celebrate({
    body: Joi.object().keys({
        title: Joi.string().min(2).max(30)
        .custom(sanitizeXSS)
        .messages({
            'string.min': 'Минимальная длина поля "name" - 2',
            'string.max': 'Максимальная длина поля "name" - 30',
        }),
        image: Joi.object().keys({
            fileName: Joi.string().required(),
            originalName: Joi.string().required(),
        }),
        category: Joi.string().custom(sanitizeXSS),
        description: Joi.string().custom(sanitizeXSS),
        price: Joi.number().allow(null),
    }),
})

export const validateObjId = celebrate({
    params: Joi.object().keys({
        productId: Joi.string()
            .required()
            .custom((value, helpers) => {
                if (Types.ObjectId.isValid(value)) {
                    return value
                }
                return helpers.message({ any: 'Невалидный id' })
            }),
    }),
})

export const validateUserBody = celebrate({
    body: Joi.object().keys({
        name: Joi.string().min(2).max(30)
            .custom(sanitizeXSS)
            .messages({
                'string.min': 'Минимальная длина поля "name" - 2',
                'string.max': 'Максимальная длина поля "name" - 30',
            }),
        password: Joi.string().min(6).required().messages({
            'string.empty': 'Поле "password" должно быть заполнено',
        }),
        email: Joi.string()
            .required()
            .email()
            .custom(sanitizeXSS)
            .message('Поле "email" должно быть валидным email-адресом')
            .messages({
                'string.empty': 'Поле "email" должно быть заполнено',
            }),
    }),
})

export const validateAuthentication = celebrate({
    body: Joi.object().keys({
        email: Joi.string()
            .required()
            .email()
            .custom(sanitizeXSS)
            .message('Поле "email" должно быть валидным email-адресом')
            .messages({
                'string.required': 'Поле "email" должно быть заполнено',
            }),
        password: Joi.string().required().messages({
            'string.empty': 'Поле "password" должно быть заполнено',
        }),
    }),
})

const allowedTypes = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
]

export const validateMetadata = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next()
    }

    try {
        // Читаем первые байты файла для определения реального типа
        const buffer = Buffer.alloc(4100)
        const fd = fs.openSync(req.file.path, 'r')
        fs.readSync(fd, buffer, 0, buffer.length, 0)
        fs.closeSync(fd)

        const detectedType = await fileTypeFromBuffer(buffer)

        // Проверка метаданных - если тип не определен или не разрешен
        if (!detectedType || !allowedTypes.includes(detectedType.mime)) {
            // Удаляем файл
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path)
            }
            
            console.log(' Test 230: invalid metadata - returning 400');
            const error = new BadRequestError('Invalid file type');
            return next(error);
        }

        // Обновляем mimetype на реальный
        req.file.mimetype = detectedType.mime;
        next();
    } catch (error) {
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path)
        }
        next(new BadRequestError('File validation failed'));
    }
};
