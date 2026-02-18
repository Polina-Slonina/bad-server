import { NextFunction, Request, Response } from 'express'
import { FilterQuery } from 'mongoose'
import NotFoundError from '../errors/not-found-error'
import Order from '../models/order'
import User, { IUser } from '../models/user'
import BadRequestError from '../errors/bad-request-error'
import escapeRegExp from '../utils/escapeRegExp'
import { getDateQueryParam, getNumberQueryParam, getStringQueryParam } from '../utils/query-params'

// TODO: Добавить guard admin
// eslint-disable-next-line max-len
// Get GET /customers?page=2&limit=5&sort=totalAmount&order=desc&registrationDateFrom=2023-01-01&registrationDateTo=2023-12-31&lastOrderDateFrom=2023-01-01&lastOrderDateTo=2023-12-31&totalAmountFrom=100&totalAmountTo=1000&orderCountFrom=1&orderCountTo=10
export const getCustomers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {
            page = getNumberQueryParam(req.query.page) || 1,
            limit = Math.min(getNumberQueryParam(req.query.limit) || 10, 10),
            sortField = getStringQueryParam(req.query.sortField) || 'createdAt',
            sortOrder = getStringQueryParam(req.query.sortOrder) || 'desc',
            registrationDateFrom = getDateQueryParam(req.query.registrationDateFrom),
            registrationDateTo = getDateQueryParam(req.query.registrationDateTo),
            lastOrderDateFrom = getDateQueryParam(req.query.lastOrderDateFrom),
            lastOrderDateTo = getDateQueryParam(req.query.lastOrderDateTo),
            totalAmountFrom = getNumberQueryParam(req.query.totalAmountFrom),
            totalAmountTo = getNumberQueryParam(req.query.totalAmountTo),
            orderCountFrom = getNumberQueryParam(req.query.orderCountFrom),
            orderCountTo = getNumberQueryParam(req.query.orderCountTo),
            search = getStringQueryParam(req.query.search),
        } = req.query

        const filters: FilterQuery<Partial<IUser>> = {}

        if (registrationDateFrom) {
            filters.createdAt = {
                ...filters.createdAt,
                $gte: new Date(registrationDateFrom as string),
            }
        }

        if (registrationDateTo) {
            const endOfDay = new Date(registrationDateTo as string)
            endOfDay.setHours(23, 59, 59, 999)
            filters.createdAt = {
                ...filters.createdAt,
                $lte: endOfDay,
            }
        }

        if (lastOrderDateFrom) {
            filters.lastOrderDate = {
                ...filters.lastOrderDate,
                $gte: new Date(lastOrderDateFrom as string),
            }
        }

        if (lastOrderDateTo) {
            const endOfDay = new Date(lastOrderDateTo as string)
            endOfDay.setHours(23, 59, 59, 999)
            filters.lastOrderDate = {
                ...filters.lastOrderDate,
                $lte: endOfDay,
            }
        }

        if (totalAmountFrom) {
            filters.totalAmount = {
                ...filters.totalAmount,
                $gte: Number(totalAmountFrom),
            }
        }

        if (totalAmountTo) {
            filters.totalAmount = {
                ...filters.totalAmount,
                $lte: Number(totalAmountTo),
            }
        }

        if (orderCountFrom) {
            filters.orderCount = {
                ...filters.orderCount,
                $gte: Number(orderCountFrom),
            }
        }

        if (orderCountTo) {
            filters.orderCount = {
                ...filters.orderCount,
                $lte: Number(orderCountTo),
            }
        }

        if (search) {
            const searchRegex = new RegExp(escapeRegExp(search as string), 'i')
            const orders = await Order.find(
                {
                    $or: [{ deliveryAddress: searchRegex }],
                },
                '_id'
            )

            const orderIds = orders.map((order) => order._id)

            filters.$or = [
                { name: searchRegex },
                { lastOrder: { $in: orderIds } },
            ]
        }

        const sort: { [key: string]: any } = {}

        if (sortField && sortOrder) {
            sort[sortField as string] = sortOrder === 'desc' ? -1 : 1
        }

        const options = {
            sort,
            skip: (Number(page) - 1) * Number(limit),
            limit: Number(limit),
        }

        const users = await User.find(filters, null, options).populate([
            'orders',
            {
                path: 'lastOrder',
                populate: {
                    path: 'products',
                },
            },
            {
                path: 'lastOrder',
                populate: {
                    path: 'customer',
                },
            },
        ])

        const totalUsers = await User.countDocuments(filters)
        const totalPages = Math.ceil(totalUsers / Number(limit))

        res.status(200).json({
            customers: users,   
            pagination: {
                totalUsers,
                totalPages,
                currentPage: Number(page),
                pageSize: Number(limit),
            },
        })
    } catch (error) {
        next(error)
    }
}

// TODO: Добавить guard admin
// Get /customers/:id
export const getCustomerById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Проверяем ID
        const userId = req.params.id
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            return next(new BadRequestError('Невалидный ID пользователя'))
        }

        const user = await User.findById(userId).populate([
            'orders',
            'lastOrder',
        ])

        if (!user) {
            return next(new NotFoundError('Пользователь не найден'))
        }

        res.status(200).json(user)
    } catch (error) {
        next(error)
    }
}

// TODO: Добавить guard admin
// Patch /customers/:id
export const updateCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Проверяем ID
        const userId = req.params.id
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            return next(new BadRequestError('Невалидный ID пользователя'))
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            req.body,
            {
                new: true,
            }
        )
            .orFail(
                () =>
                    new NotFoundError(
                        'Пользователь по заданному id отсутствует в базе'
                    )
            )
            .populate(['orders', 'lastOrder'])
        res.status(200).json(updatedUser)
    } catch (error) {
        next(error)
    }
}

// TODO: Добавить guard admin
// Delete /customers/:id
export const deleteCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Проверяем ID
        const userId = req.params.id
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            return next(new BadRequestError('Невалидный ID пользователя'))
        }

        const deletedUser = await User.findByIdAndDelete(userId).orFail(
            () =>
                new NotFoundError(
                    'Пользователь по заданному id отсутствует в базе'
                )
        )
        res.status(200).json(deletedUser)
    } catch (error) {
        next(error)
    }
}
