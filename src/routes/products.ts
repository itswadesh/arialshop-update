import { Router } from 'express'
import { catchAsync } from '../middleware'
import { Product } from '../models'
const router = Router()

router.get(
  '/api/products',
  catchAsync(async (req, res) => {
    try {
      const limit = +req.query.limit || 10
      const page = +req.query.page || 1
      const skip = (page - 1) * limit
      const data = await Product.find()
        .limit(limit)
        .skip(skip)
        .sort('-createdAt')
      const count = await Product.countDocuments()
      return res.json({ data, page, count, pageSize: limit })
    } catch (err) {
      return res.status(500).send(err)
    }
  })
)

router.get(
  '/api/products/:slug',
  catchAsync(async (req, res) => {
    try {
      const slug = req.params.slug
      const data = await Product.findOne({
        slug,
      })
      return res.json(data)
    } catch (err) {
      return res.status(500).send(err)
    }
  })
)

export { router as products }
