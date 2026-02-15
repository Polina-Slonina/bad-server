import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import BadRequestError from '../errors/bad-request-error'

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }

    try {
        // Проверка на опасные символы в имени
        // eslint-disable-next-line no-control-regex
        const dangerousPattern = /[<>:"\\|?*\x00-\x1F]/g
        if (dangerousPattern.test(req.file.originalname)) {
            return next(new BadRequestError('Имя файла содержит недопустимые символы'))
        }

        // Проверка MIME типа
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedMimes.includes(req.file.mimetype)) {
            return next(new BadRequestError('Недопустимый тип файла'))
        }
            
        // Проверка размера
        if (req.file.size > 5 * 1024 * 1024) {
            return next(new BadRequestError('Файл слишком большой (макс 5MB)'))
        }

        const fileName = process.env.UPLOAD_PATH
            ? `/${process.env.UPLOAD_PATH}/${req.file.filename}`
            : `/${req.file?.filename}`
        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
            originalName: req.file?.originalname,
        })
    } catch (error) {
        return next(error)
    }
}

export default {}
