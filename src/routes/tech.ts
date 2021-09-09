import { Router } from 'express'
import { catchAsync, auth } from '../middleware'
import { Tech, Product, Author, slugShopNx, Post } from '../models'
import createSitemap from 'sitemap'
import { index } from '../utils'
import { getOneProductFromAmazon } from './flipkart'
import { products } from './products'

const router = Router()
router.delete(
  '/api/tech/products/:id',
  catchAsync(async (req, res) => {
    try {
      const id = req.params.id
      const p: any = await Tech.findOne({ products: id })
      p.products.pull(id)
      await p.save()
      // This product could have been included for someone else
      // const product: any = await Product.findByIdAndRemove(id)
      // await slugShopNx.findOneAndRemove({ slug: product.slug })
      return res.send(p)
    } catch (err) {
      return res.status(500).send(err)
    }
  })
)
router.post(
  '/api/tech/products',
  catchAsync(async (req, res) => {
    try {
      const name = req.body.name
      if (!name || name == '') return res.status(500).send('name not provided')
      let product: any
      if (req.body._id) {
        product = await Product.findOneAndUpdate(
          { _id: req.body._id },
          req.body,
          {
            new: true,
          }
        )
      } else {
        product = await Product.create(req.body)
      }
      await product.save()
      await Tech.updateOne(
        { _id: req.body.techId },
        { $addToSet: { products: product._id } }
      )
      return res.status(201).json(product)
    } catch (err) {
      return res.status(500).send(err)
    }
  })
)
router.post(
  '/api/tech',
  catchAsync(async (req, res) => {
    try {
      const count = req.body.count
      const trimmer = req.body.trimmer
      const title = count + ' Best ' + req.body.title + ' ' + trimmer
      const _id = req.body._id
      const author = req.session!.userId
      req.body.author = author
      if (!title || title == '')
        return res.status(500).send('title not provided')
      let tech: any
      if (_id) {
        tech = await Tech.findOneAndUpdate({ _id }, req.body, {
          new: true,
        })
      } else {
        try {
          req.body.slug = await genSlug(title)
        } catch (e) {
          tech = await Tech.findOne({ title: req.body.title })
          return res.status(200).send(tech)
        }
        try {
          tech = await Tech.create(req.body)
          await Author.updateOne(
            { _id: author },
            { $addToSet: { techs: tech._id } }
          )
        } catch (e) {
          return res.status(500).send(e)
        }
      }
      await tech.save()
      return res.status(201).json(tech)
    } catch (err) {
      return res.status(500).send(err)
    }
  })
)
router.get(
  '/api/tech',
  catchAsync(async (req, res) => {
    try {
      // @ts-ignore
      req.query.populate = 'author products'
      const r = await index({
        model: Tech,
        args: req.query,
      })
      return res.json(r)
    } catch (err) {
      return res.status(500).send(err)
    }
  })
)
router.get(
  '/api/tech/slug/:slug',
  catchAsync(async (req, res) => {
    try {
      const data = await Tech.findOne({ slug: req.params.slug })
        .populate('author')
        .populate('products')
      return res.json(data)
    } catch (err) {
      return res.status(500).send(err)
    }
  })
)
router.get(
  '/api/tech/:id',
  catchAsync(async (req, res) => {
    try {
      const data = await Tech.findById(req.params.id)
        .populate('author')
        .populate('products')
      return res.json(data)
    } catch (err) {
      return res.status(500).send(err)
    }
  })
)
router.post(
  '/api/tech/oneProduct',
  catchAsync(async (req, res) => {
    try {
      let { url, postId, category }: any = req.body
      const pr: any = await getOneProductFromAmazon(url, '')
      let product: any = await Product.findOneAndUpdate({ id: pr.id }, pr, {
        upsert: true,
        new: true,
      })
      // console.log('ooooooooooooooooo', postId, product._id)
      const post: any = await Tech.findOneAndUpdate(
        { _id: postId },
        { $addToSet: { products: product._id } },
        { new: true }
      )
      if (!post) return res.status(500).json('Post not found!')
      // console.log('ppppppppppppppppp', post.author)
      await Author.updateOne(
        { _id: post.author },
        { $addToSet: { products: product._id } }
      )
      product.author = post.author
      product.post = postId
      // console.log('rrrrrrrrrrrrrrrrr', product._id)
      await product.save()
      return res.status(201).json(product)
    } catch (e) {
      // console.log('eeeeeeeeeeeeeeeeeee', e)
      return res.status(500).json(e)
    }
  })
)
const genSlug = async (str: string) => {
  if (!str) throw 'Slug generation error!'
  let slug = str
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/_/g, '-') // Replace _ with -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '')
  try {
    let foundSlug = await slugShopNx.findOne({ slug })
    if (foundSlug) throw 'Post exists'
    await slugShopNx.create({ slug })
    return slug
  } catch (e) {
    throw e
  }
}
export { router as tech }
