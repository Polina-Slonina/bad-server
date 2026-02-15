import { Request, Response, NextFunction } from 'express'

// Защита от медленных запросов (Slowloris атака)
export const slowlorisProtection = (req: Request, res: Response, next: NextFunction) => {
    // Таймаут на получение заголовков
    req.setTimeout(5000, () => {
        console.warn('Request timeout - possible Slowloris attack')
        res.status(408).json({ message: 'Request timeout' })
    })
    
    // Ограничение на размер заголовков
    const headerSize = JSON.stringify(req.headers).length
    if (headerSize > 8000) { // 8KB максимум
        console.warn(`Large headers detected: ${headerSize} bytes`)
        return res.status(431).json({ message: 'Headers too large' })
    }
    
    next()
}
