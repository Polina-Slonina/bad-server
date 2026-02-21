import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import mongoose from 'mongoose'
import path from 'path'
// eslint-disable-next-line import/no-extraneous-dependencies
// import helmet from 'helmet';
import { DB_ADDRESS, ORIGIN_ALLOW } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'
// import { slowlorisProtection } from './middlewares/slowloris-protection'
// import { globalLimiter } from './middlewares/rate-limit'
// import { csrfProtectionMiddleware, csrfTokenMiddleware } from './middlewares/csrf'

const { PORT = 3000 } = process.env

// Увеличиваем лимиты
// process.setMaxListeners(0);
// require('events').EventEmitter.defaultMaxListeners = 0;

const app = express()

// Настройка таймаутов
app.use((req, res, next) => {
    req.setTimeout(60000); // 60 секунд
    res.setTimeout(60000);
    next();
});

// app.use(slowlorisProtection)

app.use(cookieParser())

// app.use(cors())
app.use(cors({ origin: ORIGIN_ALLOW, credentials: true }));
// app.use(express.static(path.join(__dirname, 'public')));
// app.use(helmet({
//     // Настройка CSP
//     contentSecurityPolicy: {
//         directives: {
//             defaultSrc: ["'self'"],
//             styleSrc: ["'self'", "'unsafe-inline'"],
//             scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
//             imgSrc: ["'self'", "data:", "blob:", "http://localhost"],
//             connectSrc: ["'self'", "http://localhost"],
//             fontSrc: ["'self'"],
//             objectSrc: ["'none'"],
//             mediaSrc: ["'self'"],
//             frameSrc: ["'self'"],
//         },
//     },
//     // Разрешаем кросс-доменные запросы к ресурсам
//     crossOriginResourcePolicy: { policy: "cross-origin" },
//     // Отключаем COEP для совместимости
//     crossOriginEmbedderPolicy: false,
//     // Настройка HSTS (для production)
//     hsts: process.env.NODE_ENV === 'production' ? {
//         maxAge: 31536000,
//         includeSubDomains: true,
//         preload: true
//     } : false,
//     // Отключаем ненужные заголовки для разработки
//     referrerPolicy: { policy: "strict-origin-when-cross-origin" },
// }))

app.use(serveStatic(path.join(__dirname, 'public')))

app.use(urlencoded({ extended: true }))
app.use(json())
// app.use(globalLimiter)

app.options('*', cors())

// const publicPaths = ['/auth', '/orders'];  // Добавили /orders
// app.use((req, res, next) => {
//     // Пропускаем /auth без CSRF
//     const isPublicPath = publicPaths.some(path => req.path.startsWith(path));
    
//     if (isPublicPath) {
//         return next();
//     }
    
//     // Для всех остальных путей - генерируем токен
//     csrfTokenMiddleware(req, res, next)
// })

// // CSRF ПРОВЕРКА ДЛЯ ВСЕХ КРОМЕ /auth
// app.use((req, res, next) => {
//     // Пропускаем /auth и безопасные методы
//     const isPublicPath = publicPaths.some(path => req.path.startsWith(path));
    
//     if (isPublicPath || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
//         return next();
//     }
    
//     // Проверяем CSRF для остальных
//     csrfProtectionMiddleware(req, res, next)
// })

// Редирект для теста
app.use('/api/upload', (req, _res, next) => {
    console.log('🔄 Redirecting /api/upload to /upload');
    req.url = '/upload';
    next();
});

app.use(routes)
app.use(errors())
app.use(errorHandler)

// eslint-disable-next-line no-console
const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        await app.listen(PORT, () => console.log('ok'))
    } catch (error) {
        console.error(error)
    }
}

bootstrap()
