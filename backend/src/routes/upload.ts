import { Router } from 'express'
import { uploadFile } from '../controllers/upload'
import fileMiddleware from '../middlewares/file'
import { validateMetadata } from '../middlewares/validations'

const uploadRouter = Router()
uploadRouter.post('/', fileMiddleware.single('file'), validateMetadata, uploadFile)

export default uploadRouter
