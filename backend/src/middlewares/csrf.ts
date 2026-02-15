import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

const tokenStore = new Map<string, { token: string, expires: number }>()

setInterval(() => {
    const now = Date.now()
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, data] of tokenStore.entries()) {
        if (data.expires < now) tokenStore.delete(key)
    }
}, 10 * 60 * 1000)

// Генерация CSRF токена
export const csrfTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Для неавторизованных используем IP
        const userId = res.locals.user?._id?.toString() || req.ip || 'anonymous'
        
        let storedData = tokenStore.get(userId)
        
        if (!storedData || storedData.expires < Date.now()) {
            const token = crypto.randomBytes(32).toString('hex')
            storedData = { token, expires: Date.now() + 60 * 60 * 1000 }
            tokenStore.set(userId, storedData)
        }
        
        res.cookie('XSRF-TOKEN', storedData.token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000
        })
        
        res.locals.csrfToken = storedData.token
        next()
    } catch (error) {
        console.error('CSRF Token Error:', error)
        next() // Пропускаем даже при ошибке
    }
}

// Проверка CSRF токена
export const csrfProtectionMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = res.locals.user?._id?.toString() || req.ip || 'anonymous'
        // eslint-disable-next-line no-underscore-dangle
        const tokenFromRequest = req.headers['x-csrf-token'] || req.body._csrf
        
        const storedData = tokenStore.get(userId)
        
        if (!storedData) {
            console.warn(`CSRF: No token for ${userId}`)
            return res.status(403).json({ message: 'CSRF token missing' })
        }
        
        if (storedData.expires < Date.now()) {
            console.warn(`CSRF: Token expired for ${userId}`)
            tokenStore.delete(userId)
            return res.status(403).json({ message: 'CSRF token expired' })
        }
        
        if (tokenFromRequest !== storedData.token) {
            console.warn(`CSRF: Invalid token for ${userId}`)
            return res.status(403).json({ message: 'Invalid CSRF token' })
        }
        
        storedData.expires = Date.now() + 60 * 60 * 1000
        next()
    } catch (error) {
        console.error('CSRF Protection Error:', error)
        res.status(403).json({ message: 'CSRF protection error' })
    }
}

// Очистка CSRF токена
export const clearCsrfToken = (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = res.locals.user?._id?.toString() || req.ip || 'anonymous'
        tokenStore.delete(userId)
        res.clearCookie('XSRF-TOKEN')
        console.log(`CSRF token cleared for ${userId}`)
    } catch (error) {
        console.error('Error clearing CSRF token:', error)
    }
    next()
}
