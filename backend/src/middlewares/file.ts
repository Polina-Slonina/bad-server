import { Request, Express } from 'express'
import multer, { FileFilterCallback } from 'multer'
import { join } from 'path'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

const storage = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: DestinationCallback
    ) => {
        cb(
            null,
            join(
                __dirname,
                process.env.UPLOAD_PATH_TEMP
                    ? `../public/${process.env.UPLOAD_PATH_TEMP}`
                    : '../public'
            )
        )
    },

    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileNameCallback
    ) => {
        // Генерируем безопасное имя
        const ext = file.originalname.split('.').pop();
        const safeName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        cb(null, safeName)
    },
})

const types = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
]

// Проверка на опасные символы в имени
const dangerousPattern = /[<>:"\\|?*\x00-\x1F]/g;

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    // if (!types.includes(file.mimetype)) {
    //     return cb(null, false)
    // }
    // Проверка на опасные символы в имени
    if (dangerousPattern.test(file.originalname)) {
        console.log(' Dangerous characters in filename:', file.originalname);
        return cb(new Error('Имя файла содержит недопустимые символы'));
    }

    // Проверка MIME типа
    if (!types.includes(file.mimetype)) {
        console.log('Invalid MIME type:', file.mimetype);
        return cb(new Error('Недопустимый тип файла'));
    }

    // Проверка минимального размера (2KB)
    const MIN_SIZE = 2 * 1024;
    if (file.size < MIN_SIZE) {
        console.log('File too small:', file.size);
        return cb(new Error('Файл слишком маленький (мин 2KB)'));
    }

    // Проверка максимального размера (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        console.log('File too large:', file.size);
        return cb(new Error('Файл слишком большой (макс 10MB)'));
    }


    console.log('📁 File filter - allowing all files:', file.mimetype);
    return cb(null, true)
}

export default multer({ 
    storage, 
    fileFilter
})
