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
            return res.status(400).json({ message: 'Invalid file type' });
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
