import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

export default function serveStatic(baseDir: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Защита от path traversal
        const safePath = path.normalize(req.path).replace(/^(\.\.[/\\])+/, '')
        
        // Разрешенные расширения файлов
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.json']
        const ext = path.extname(safePath).toLowerCase()
        
        if (!allowedExtensions.includes(ext)) {
            return next()
        }
        
        const filePath = path.join(baseDir, safePath)
        
        // Проверка, что путь ведет в разрешенную директорию
        const normalizedBase = path.normalize(baseDir)
        const normalizedFilePath = path.normalize(filePath)
        
        if (!normalizedFilePath.startsWith(normalizedBase)) {
            console.warn(`Path traversal attempt blocked: ${req.path}`)
            return res.status(403).json({ message: 'Доступ запрещен' })
        }

        // Определяем полный путь к запрашиваемому файлу
        // const filePath = path.join(baseDir, req.path)

        // Проверяем, существует ли файл
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                // Файл не существует отдаем дальше мидлварам
                return next()
            }
            // Файл существует, отправляем его клиенту
            // eslint-disable-next-line @typescript-eslint/no-shadow
            return res.sendFile(filePath, (err) => {
                if (err) {
                    next(err)
                }
            })
        })
    }
}
