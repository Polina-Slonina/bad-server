import { Router } from 'express'
import {
    deleteCustomer,
    getCustomerById,
    getCustomers,
    updateCustomer,
} from '../controllers/customers'
import auth from '../middlewares/auth'
import { roleGuard } from '../middlewares/role-guard'
import { Role } from '../models/user'

const customerRouter = Router()

customerRouter.get('/', auth, roleGuard(Role.Admin), getCustomers)
customerRouter.get('/:id', auth, roleGuard(Role.Admin), getCustomerById)
customerRouter.patch('/:id', auth, roleGuard(Role.Admin), updateCustomer)
customerRouter.delete('/:id', auth, roleGuard(Role.Admin), deleteCustomer)

export default customerRouter
