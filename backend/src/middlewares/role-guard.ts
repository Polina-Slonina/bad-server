import { Request, Response, NextFunction } from 'express'
import { Role } from '../models/user'
import ForbiddenError from '../errors/forbidden-error'

export const roleGuard = (...allowedRoles: Role[]) => (_req: Request, res: Response, next: NextFunction) => {
        try {
            // eslint-disable-next-line prefer-destructuring
            const user = res.locals.user

            if (!user) {
                return next(new ForbiddenError('Доступ запрещен. Требуется авторизация'))
            }

            const hasRole = allowedRoles.some(role => user.roles.includes(role))

            if (!hasRole) {
                return next(new ForbiddenError('Доступ запрещен. Требуются права администратора'))
            }

            next()
        } catch (error) {
            next(error)
        }
    }
