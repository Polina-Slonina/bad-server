import { Request, Response, NextFunction } from 'express';

// Простое хранилище для подсчета запросов
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Очистка устаревших записей каждые 5 минут
setInterval(() => {
    const now = Date.now();
    // eslint-disable-next-line no-restricted-syntax
    for (const [ip, data] of requestCounts.entries()) {
        if (data.resetTime < now) {
            requestCounts.delete(ip);
        }
    }
}, 5 * 60 * 1000);

// Создаем лимитер с настраиваемыми параметрами
export const createRateLimiter = (options: {
    windowMs: number;
    max: number;
    message?: string;
}) => (req: Request, res: Response, next: NextFunction) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        
        // Получаем или создаем запись для IP
        let requestData = requestCounts.get(ip);
        
        if (!requestData || requestData.resetTime < now) {
            // Новая запись или истекла
            requestData = {
                count: 1,
                resetTime: now + options.windowMs
            };
            requestCounts.set(ip, requestData);
            return next();
        }
        
        // Увеличиваем счетчик
        // eslint-disable-next-line no-plusplus
        requestData.count++;
        
        // Проверяем лимит
        if (requestData.count > options.max) {
            console.warn(`Rate limit exceeded for IP: ${ip}`);
            return res.status(429).json({ 
                message: options.message || 'Слишком много запросов, попробуйте позже' 
            });
        }
        
        next();
    };

// Готовые лимитеры для разных случаев
export const globalLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100,
    message: 'Слишком много запросов, попробуйте позже'
});
