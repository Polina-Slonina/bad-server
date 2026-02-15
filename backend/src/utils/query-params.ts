// Функция для безопасного получения строки из query
export const getStringQueryParam = (param: any): string | undefined => {
    if (typeof param === 'string') return param
    if (typeof param === 'object') return undefined
    return undefined
}

// Функция для безопасного получения числа из query
export const getNumberQueryParam = (param: any): number | undefined => {
    // eslint-disable-next-line no-restricted-globals
    if (typeof param === 'string' && !isNaN(Number(param))) {
        return Number(param)
    }
    return undefined
}

// Функция для безопасного получения даты из query
export const getDateQueryParam = (param: any): Date | undefined => {
    if (typeof param === 'string') {
        const date = new Date(param)
        // eslint-disable-next-line no-restricted-globals
        if (!isNaN(date.getTime())) {
            return date
        }
    }
    return undefined
}
