import { Router } from 'express'
import { catchAsync, auth } from '../middleware'
import { Post, Product, Author, slugShopNx } from '../models'
import { products } from './products'
import puppeteer from 'puppeteer'
import axios from 'axios'
import createSitemap from 'sitemap'
var Xray = require('x-ray')
var x = Xray()
import fsx from 'fs-extra'
const path = require('path')
import { STATIC_PATH, SHOP_URL } from '../config'
import { index } from '../utils'

const router = Router()
router.get(
  '/api/myntra/:id',
  catchAsync(async (req, res) => {
    try {
      const id: string = req.params.id
      const postId: any = req.query.postId
      if (!id) return res.status(404).send('Myntra product id not specified')
      if (!postId) return res.status(404).send('postId not specified')

      const post = await Post.findById(postId)
      if (!post) return res.status(404).json('Post not found')
      const p = await Product.findOne({ id })
      if (p) return res.json(p)
      const m = (
        await axios.get(
          `https://www.myntra.com/proxy-pr/apify/v2/product/${id}`
        )
      ).data.style
      const myntra = {
        id: m.id,
        name: m.name,
        mrp: m.mrp,
        price: m.price,
        img: m.img,
        images: m.images,
        brand: m.brand && m.brand.name,
        color: m.baseColour,
        ratings: m.ratings.averageRating,
        slug: `https://myntra.com/${id}`,
      }
      const images = m.media.albums[0].images.map((i: any) => i.imageURL)
      const style = m.sizes.find((i: any) => {
        if (i.styleId == id) {
          return i.sizeSellerData[0].discountedPrice
        }
      })
      myntra.price = style.sizeSellerData[0].discountedPrice
      myntra.images = images
      myntra.img = images[0]
      const product = await Product.create(myntra)
      await product.save()
      await Post.updateOne(
        { _id: postId },
        { $addToSet: { products: product._id } }
      )
      return res.status(201).json(product)
      // return res.json(myntra)
    } catch (err) {
      // console.log('Err::: ', err)
      return res.status(500).send(err)
    }
  })
)
router.delete(
  '/api/products/:id',
  catchAsync(async (req, res) => {
    try {
      const id = req.params.id
      const p: any = await Post.findOne({ products: id })
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
  '/api/products',
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
      await Post.updateOne(
        { _id: req.body.postId },
        { $addToSet: { products: product._id } }
      )
      return res.status(201).json(product)
    } catch (err) {
      return res.status(500).send(err)
    }
  })
)

router.post(
  '/api/posts',
  catchAsync(async (req, res) => {
    try {
      const title = req.body.title
      const _id = req.body._id
      if (!title || title == '')
        return res.status(500).send('title not provided')
      let post: any
      if (_id) {
        post = await Post.findOneAndUpdate({ _id }, req.body, {
          new: true,
        })
      } else {
        post = await Post.create(req.body)
      }
      await post.save()
      await Author.updateOne(
        { _id: req.body.author },
        { $addToSet: { posts: post._id } }
      )
      return res.status(201).json(post)
    } catch (err) {
      return res.status(500).send(err)
    }
  })
)
router.get(
  '/api/authors',
  catchAsync(async (req, res) => {
    try {
      // @ts-ignore
      req.query['products.1'] = { $exists: true }
      const r = await index({
        model: Author,
        args: req.query,
      })
      return res.json(r)
    } catch (err) {
      return res.status(500).send(err)
    }
  })
)
router.get(
  '/api/authors/:slug',
  catchAsync(async (req, res) => {
    try {
      const limit = +req.query.limit || 10
      const page = +req.query.page || 1
      const sort = req.query.sort || '-createdAt'
      const skip = (page - 1) * limit
      const data = await Author.findOne({ slug: req.params.slug })
        .sort(sort)
        .populate({
          path: 'posts',
          options: { sort },
          populate: {
            path: 'products',
          },
        })
      return res.json(data)
    } catch (err) {
      return res.status(500).send(err)
    }
  })
)
// Required to generate route
router.get(
  '/api/posts',
  catchAsync(async (req, res) => {
    try {
      // @ts-ignore
      req.query['products.3'] = { $exists: true }
      req.query.populate = 'author products'
      const r = await index({
        model: Post,
        args: req.query,
      })
      return res.json(r)
    } catch (err) {
      return res.status(500).send(err)
    }
    // try {
    //   const limit = +req.query.limit || 10
    //   const page = +req.query.page || 1
    //   const skip = (page - 1) * limit
    //   const data = await Post.find({})
    //     .limit(limit)
    //     .skip(skip)
    //     .sort('-createdAt')
    //     .populate('author')
    //     .populate('products')
    //   const count = await Post.countDocuments()
    //   return res.json({ data, page, count, pageSize: limit })
    // } catch (err) {
    //   return res.status(500).send(err)
    // }
  })
)

router.get(
  '/api/posts/:slug',
  catchAsync(async (req, res) => {
    try {
      const data = await Post.findOne({ slug: req.params.slug })
        .populate('author')
        .populate('products')
      return res.json(data)
    } catch (err) {
      return res.status(500).send(err)
    }
  })
)

router.get(
  '/api/shopnx/generate-sitemap',
  catchAsync(async (req, res) => {
    try {
      let urls: any = []
      const authors = await Author.find({}).select('slug').populate('posts')
      for (let au of authors) {
        let a: any = au
        if (a.slug) {
          urls.push({
            url: `/${a.slug}`,
            changefreq: 'daily',
            priority: 0.8,
          })
          for (let p of a.posts) {
            if (p.slug)
              urls.push({
                url: `/${a.slug}/${p.slug}`,
                changefreq: 'daily',
                priority: 0.5,
              })
          }
        }
      }
      const sitemap = createSitemap({
        hostname: SHOP_URL,
        cacheTime: 600000, // 600 sec - cache purge period
        urls,
      })
      fsx.writeFileSync(
        path.resolve(STATIC_PATH + '/sitemap-shopnx.xml'),
        sitemap.toString()
      )
      res.send('Sitemap generated ' + urls.length + ' records...')
    } catch (e) {
      res.status(500).end()
    }
  })
)

router.get(
  '/sitemap',
  catchAsync(async (req, res) => {
    try {
      res.header('Content-Type', 'application/xml')
      res.send(
        fsx.readFileSync(
          path.resolve(STATIC_PATH + '/sitemap-shopnx.xml'),
          'utf8'
        )
      )
    } catch (e) {
      res.end()
    }
  })
)

export { router as posts }
