import { Request, Express } from 'express'
import multer, { FileFilterCallback } from 'multer'
import { join } from 'path'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

export const MIN_FILE_SIZE_BYTES = 2 * 1024 // 2KB
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

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
        // // Генерируем безопасное имя
        // const ext = file.originalname.split('.').pop();
        // const safeName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        // cb(null, safeName)
        // Генерируем полностью новое имя файла без использования оригинального
            const timestamp = Date.now()
            const uniqueFileName = `${timestamp}-${randomUUID()}`

            // Получаем расширение файла из mimetype
            let extension = ''
            if (file.mimetype.includes('png')) extension = 'png'
            else if (
                file.mimetype.includes('jpeg') ||
                file.mimetype.includes('jpg')
            )
                extension = 'jpg'
            else if (file.mimetype.includes('gif')) extension = 'gif'
            else if (file.mimetype.includes('svg')) extension = 'svg'

            cb(
                null,
                extension ? `${uniqueFileName}.${extension}` : uniqueFileName
            )
    },
})

const types = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
]

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    if (!types.includes(file.mimetype)) {
        return cb(null, false)
    }

    console.log('📁 File filter - allowing all files:', file.mimetype);
    return cb(null, true)
}

export default multer({ 
    storage, 
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
        files: 1,
    },
})
function randomUUID() {
    throw new Error('Function not implemented.')
}

