import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import path from 'path'
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
        const fileExt = path.extname(req.file.originalname)
        const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`

        // Проверка на опасные символы в имени
        // eslint-disable-next-line no-control-regex
        const dangerousPattern = /[<>:"\\|?*\x00-\x1F]/g
        if (dangerousPattern.test(req.file.originalname)) {
            return next(new BadRequestError('Имя файла содержит недопустимые символы'))
        }

        // Проверка MIME типа
        // const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        // if (!allowedMimes.includes(req.file.mimetype)) {
        //     return next(new BadRequestError('Недопустимый тип файла'))
        // }
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimes.includes(req.file.mimetype)) {
            console.log('Invalid MIME type - returning 400');
            // ВАЖНО: возвращаем 400
            return res.status(400).json({ 
                message: 'Invalid file type',
                details: `Expected image, got ${req.file.mimetype}`
            });
        }
            
        // Проверка размера
        if (req.file.size < 2048) { // 2KB
            return res.status(400).json({ message: 'File too small' });
        }

        const fileName = process.env.UPLOAD_PATH
            ? `/${process.env.UPLOAD_PATH}/${safeFileName}`
            : `/${safeFileName}`
        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
            originalName: req.file?.originalname,
        })
    } catch (error) {
        return next(error)
    }
}

export default {}
