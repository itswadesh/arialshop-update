import { Router } from 'express'
import { catchAsync } from '../middleware'
import { Author } from '../models'
const router = Router()

router.post(
  '/api/authors',
  catchAsync(async (req, res) => {
    try {
      const title = req.body.title
      const _id = req.body._id
      // if (!title || title == '')
      //   return res.status(500).send('title not provided')
      let doc: any
      if (_id) {
        doc = await Author.findOneAndUpdate({ _id }, req.body, {
          new: true,
        })
      } else {
        doc = await Author.create(req.body)
      }
      await doc.save()
      return res.status(201).json(doc)
    } catch (err) {
      return res.status(500).send(err)
    }
  })
)
// router.get(
//   '/api/authors',
//   catchAsync(async (req, res) => {
//     try {
//       const limit = +req.query.limit || 10
//       const page = +req.query.page || 1
//       const sort = req.query.sort || '-createdAt'
//       const skip = (page - 1) * limit
//       const data = await Author.find().limit(limit).skip(skip).sort(sort)
//       const count = await Author.countDocuments()
//       return res.json({ data, page, count, pageSize: limit })
//     } catch (err) {
//       return res.status(500).send(err)
//     }
//   })
// )

// router.get(
//   '/api/authors/:slug',
//   catchAsync(async (req, res) => {
//     try {
//       const slug = req.params.slug
//       const data = await Author.findOne({
//         slug,
//       })
//       return res.json(data)
//     } catch (err) {
//       return res.status(500).send(err)
//     }
//   })
// )

export { router as authors }
