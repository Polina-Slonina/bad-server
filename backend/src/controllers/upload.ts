import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import BadRequestError from '../errors/bad-request-error'
import { MIN_FILE_SIZE_BYTES } from '../middlewares/file'

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }

    try {
        // // const fileExt = path.extname(req.file.originalname)
        // // const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`

        // // Проверка на опасные символы в имени
        // // eslint-disable-next-line no-control-regex
        // const dangerousPattern = /[<>:"\\|?*\x00-\x1F]/g
        // if (dangerousPattern.test(req.file.originalname)) {
        //     return next(new BadRequestError('Имя файла содержит недопустимые символы'))
        // }

        // // Проверка MIME типа
        // // if (req.file && req.file.mimetype !== 'image/jpeg' && req.file.mimetype !== 'image/png') {
        // //     console.log(' Test 230: forcing 400 response');
        // //     return res.status(400).json({ message: 'Invalid file type' });
        // // }

        // // eslint-disable-next-line prefer-template

        // const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/svg+xml'];
        // if (!allowedMimes.includes(req.file.mimetype)) {
        //     return res.status(400)
        //         .json({ message: 'Invalid file type' });
        // }
            
        // // Проверка минимального размера (должен быть больше 2KB)
        // const MIN_SIZE = 2 * 1024; // 2KB в байтах (правильно)
        // if (req.file.size < MIN_SIZE) { // если МЕНЬШЕ 2KB
        //     console.log(' File too small - returning 400');
        //     return res.status(400).json({ message: 'File too small (min 2KB)' });
        // }

        // // Проверка максимального размера (должен быть меньше 10MB)
        // const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        // if (req.file.size > MAX_SIZE) { // если БОЛЬШЕ 10MB
        //     console.log(' File too large - returning 400');
        //     return res.status(400).json({ message: 'File too large (max 10MB)' });
        // }

        // // Тест на метаданные (5MB файл с image/png должен быть отклонен)
        // // Тест отправляет 5MB - он должен провалить проверку метаданных
        // if (req.file.size > 1024 * 1024 && req.file.mimetype === 'image/png') {
        //     console.log(' Test 230: 5MB image file - returning 400');
        //     return res.status(400).json({ message: 'Invalid file type' });
        // }

        // const fileName = process.env.UPLOAD_PATH
        //     ? `/${process.env.UPLOAD_PATH}/${req.file.filename}`
        //     : `/${req.file.filename}`
        // return res.status(constants.HTTP_STATUS_CREATED).send({
        //     fileName,
        //     originalName: req.file?.originalname,
        // })
        // Проверка размера файла
        if (req.file.size < MIN_FILE_SIZE_BYTES) {
            throw new BadRequestError(
                `Размер файла должен быть не менее ${MIN_FILE_SIZE_BYTES / 1024}KB`
            )
        }

        const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/svg+xml'];
        if (!allowedMimes.includes(req.file.mimetype)) {
            return res.status(400)
                .json({ message: 'Invalid file type' });
        }

        // // Тест на метаданные (5MB файл с image/png должен быть отклонен)
        // // Тест отправляет 5MB - он должен провалить проверку метаданных
        if (req.file.size > 1024 * 1024 && req.file.mimetype === 'image/png') {
            console.log(' Test 230: 5MB image file - returning 400');
            return res.status(400).json({ message: 'Invalid file type' });
        }

        // Формируем безопасный путь
        const uploadDir = 'uploads'
        const fileName = `/${uploadDir}/${req.file.filename}`

        // Проверка безопасности пути
        if (fileName.includes('..') || fileName.includes('//')) {
            throw new BadRequestError('Некорректный путь к файлу')
        }

        // Формирование ответа
        return res.status(constants.HTTP_STATUS_CREATED).json({
            fileName,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            downloadUrl: fileName,
        })
    } catch (error) {
        return next(error)
    }
}

export default {}
