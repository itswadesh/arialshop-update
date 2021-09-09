import { Router } from 'express'
import { catchAsync } from '../middleware'
import { Tag } from '../models'
const router = Router()
router.get(
  '/api/tags',
  catchAsync(async (req, res) => {
    const data = await Tag.find()
    const count = await Tag.countDocuments()
    res.json({ data, count })
  })
)

router.get(
  '/api/tags/save',
  catchAsync(async (req, res) => {
    const docs = await Tag.find()
    for (let d of docs) {
      d.save()
    }
    return res.json(docs)
  })
)

router.get(
  '/api/tags/:slug',
  catchAsync(async (req, res) => {
    const tag = await Tag.findOne({ slug: req.params.slug })
    return res.json(tag)
  })
)

router.put(
  '/api/tags/:id',
  catchAsync(async (req, res) => {
    let g: any = await Tag.findById(req.params.id)
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
  '/api/tags/:id',
  catchAsync(async (req, res) => {
    let g = await Tag.findByIdAndRemove(req.params.id)
    return res.json(g)
  })
)

export { router as tags }
