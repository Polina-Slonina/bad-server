import { existsSync, rename } from 'fs'
import { basename, join, normalize } from 'path'
import BadRequestError from '../errors/bad-request-error'

function movingFile(imagePath: string, from: string, to: string) {
    // Защита от path traversal
    if (imagePath.includes('..') || imagePath.includes('./') || imagePath.includes('.\\')) {
        throw new BadRequestError('Обнаружена попытка path traversal')
    }
    
    // Нормализация пути
    const normalizedFrom = normalize(from)
    const normalizedTo = normalize(to)

    const fileName = basename(imagePath)

    // Проверка длины имени файла
    if (fileName.length > 255) {
        throw new BadRequestError('Имя файла слишком длинное')
    }
    
    // Проверка на опасные символы в имени
    // eslint-disable-next-line no-control-regex
    if (/[<>:"\\|?*\x00-\x1F]/g.test(fileName)) {
        throw new BadRequestError('Имя файла содержит недопустимые символы')
    }

    const imagePathTemp = join(normalizedFrom, fileName)
    const imagePathPermanent = join(normalizedTo, fileName)
    
    if (!existsSync(imagePathTemp)) {
        throw new Error('Ошибка при сохранении файла')
    }

    rename(imagePathTemp, imagePathPermanent, (err) => {
        if (err) {
            throw new Error('Ошибка при сохранении файла')
        }
    })
}

export default movingFile
