import { Router } from 'express'
import { catchAsync } from '../middleware'
import { Category } from '../models'
const router = Router()
router.get(
  '/api/categories',
  catchAsync(async (req, res) => {
    const data = await Category.find()
    const count = await Category.countDocuments()
    res.json({ data, count })
  })
)

router.get(
  '/api/categories/save',
  catchAsync(async (req, res) => {
    const docs = await Category.find()
    for (let d of docs) {
      d.save()
    }
    return res.json(docs)
  })
)

router.get(
  '/api/categories/:slug',
  catchAsync(async (req, res) => {
    const data = await Category.findOne({ slug: req.params.slug })
    return res.json(data)
  })
)

router.put(
  '/api/categories/:id',
  catchAsync(async (req, res) => {
    let g: any = await Category.findById(req.params.id)
    if (req.body.name) g.name = req.body.name
    if (req.body.description) g.description = req.body.description
    if (req.body.sort) g.sort = req.body.sort
    if (req.body.popularity) g.popularity = req.body.popularity
    if (req.body.avatar) g.avatar = req.body.avatar
    g.save()
    return res.json(g)
  })
)

router.delete(
  '/api/categories/:id',
  catchAsync(async (req, res) => {
    let g = await Category.findByIdAndRemove(req.params.id)
    return res.json(g)
  })
)

export { router as categories }
