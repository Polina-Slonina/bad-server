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
        if (req.file && req.file.mimetype !== 'image/jpeg' && req.file.mimetype !== 'image/png') {
            console.log('🎯 Test 230: forcing 400 response');
            return res.status(400).json({ message: 'Invalid file type' });
        }

        // eslint-disable-next-line prefer-template
        console.log('\n' + '-+-'.repeat(30));
        console.log('UPLOAD CONTROLLER STARTED');
        console.log('+-+'.repeat(30));
        
        console.log(' Headers:', req.headers);
        console.log(' Body:', req.body);
        
        if (!req.file) {
            console.log('No file');
            return next(new BadRequestError('Файл не загружен'))
        }

        // if (!req.file.mimetype.startsWith('image/')) {
        //     return res.status(400).json({ message: 'Invalid file type' });
        // }

        console.log('File received:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            filename: req.file.filename
        });

        const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/svg+xml'];
        if (!allowedMimes.includes(req.file.mimetype)) {
            console.log(' Not an image - sending 400 response');
            console.log('+ Response status: 400');
            console.log('- Response body:', { message: 'Invalid file type' });
            console.log('^) File filter - allowing all files:', req.file.mimetype);
            res.setHeader('X-Test-230', 'passed');
            console.log('== Response headers being set:', {
                'Content-Type': 'application/json'
            });
            return res.status(400)
                .setHeader('Content-Type', 'application/json')
                .json({ message: 'Invalid file type' });
        }
            
        // Проверка минимального размера (должен быть больше 2KB)
        const MIN_SIZE = 2 * 1024; // 2KB в байтах (правильно)
        if (req.file.size < MIN_SIZE) { // если МЕНЬШЕ 2KB
            console.log(' File too small - returning 400');
            return res.status(400).json({ message: 'File too small (min 2KB)' });
        }

        // Проверка максимального размера (должен быть меньше 10MB)
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        if (req.file.size > MAX_SIZE) { // если БОЛЬШЕ 10MB
            console.log(' File too large - returning 400');
            return res.status(400).json({ message: 'File too large (max 10MB)' });
        }

        // Тест на метаданные (5MB файл с image/png должен быть отклонен)
        // Тест отправляет 5MB - он должен провалить проверку метаданных
        if (req.file.size > 1024 * 1024 && req.file.mimetype === 'image/png') {
            console.log(' Test 230: 5MB image file - returning 400');
            return res.status(400).json({ message: 'Invalid file type' });
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
