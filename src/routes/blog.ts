import { Router } from 'express'
import Axios from 'axios'
import { Blog } from '../models'
import { generateSlug, takeScreenshot } from '../utils'
import { STATIC_PATH } from '../config'
import { catchAsync, auth } from '../middleware'
const { ObjectId } = require('mongodb')
const fsx = require('fs-extra')
require('dotenv').config()
const { ENVATO_KEY } = process.env
const router = Router()

router.get(
  '/api/blog',
  catchAsync(async (req, res) => {
    return Blog.find()
      .select(
        `name slug metaDescription banner items.previews items.tags items.author_image date createdAt`
      )
      .limit(10)
  })
)
router.get(
  '/api/blog/scan',
  catchAsync(async (req, res) => {
    const {
      slug,
      site,
      term,
      qty,
      rating,
      price,
      tags,
      sort_by,
      sort_direction,
    } = req.query
    if (!slug) {
      return res.status(500).json('Please specify slug')
    }
    if (!term) {
      return res.status(500).json('Please specify search term')
    }

    const found: any = await Blog.findOne({ slug })
    if (!found)
      // If post is not created
      return res.status(400).send('Post not created')

    let result: any = []

    try {
      const url = `https://api.envato.com/v1/discovery/search/search/item?site=${
        site || 'themeforest.net'
      }&term=${term}&tags=${tags}&price_max=${price || 10000000}&sort_by=${
        sort_by || 'relevance'
      }&sort_direction=${sort_direction || 'desc'}`
      result = await Axios({
        method: 'GET',
        headers: { Authorization: 'Bearer ' + ENVATO_KEY },
        url,
      })
    } catch (e) {
      return res.status(500).json(e)
    }
    let items = []
    console.log('Documents count......', result.data.matches.length)
    for (let i in result.data.matches) {
      let item = result.data.matches[i]
      if (parseInt(i) > (qty || 5)) break
      let fItems = found.items || []
      let iFound = fItems.filter((o: any) => o.id == item.id)
      if (!iFound) {
        // If item is not added into post
        item.demo = item.attributes.find((o: any) => o.name == 'demo-url').value
        item.img = await takeScreenshot(item.demo, slug, item.id)
      }
      if (item.img) items.push(item)
    }
    await Blog.updateOne({ slug }, { $set: { items } })
    return res.status(200).json({ slug, items })
  })
)
router.get(
  '/api/blog/post',
  catchAsync(async (req, res) => {
    const { slug, id } = req.query
    if (!slug) {
      return res.status(500).json('Please specify slug')
    }
    try {
      const url = `https://api.envato.com/v3/market/catalog/item?id=${id}`
      let item: any = await Axios({
        method: 'GET',
        headers: { Authorization: 'Bearer ' + ENVATO_KEY },
        url,
      })
      item = item.data
      const found: any = await Blog.findOne({ slug })
      if (!found)
        // If post is not created
        res.status(400).send('Post not created')
      let items = found.items || []
      let iFound = items.find((o: any) => o.id == id)
      if (!iFound) {
        // If item is not added into post
        item.demo = item.attributes.find((o: any) => o.name == 'demo-url').value
        item.img = await takeScreenshot(item.demo, slug, id)
        items.push(item)
        await Blog.updateOne({ slug }, { $set: { items } })
      }
      return res.status(200).json({ slug, items })
    } catch (e) {
      return res.status(500).json(e)
    }
  })
)
router.get(
  '/api/blog/:id',
  catchAsync(async (req, res) => {
    try {
      let item: any = await Blog.findOne({ slug: req.params.id })
      // item = item.data
      return res.status(200).json(item)
    } catch (e) {
      return res.status(500).json(e)
    }
  })
)
router.post(
  '/api/blog',
  catchAsync(async (req, res) => {
    const name = req.body.name
    if (!name || name == '') return res.status(500).send('Name not provided')
    let newSlug = name
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, '')
    const foundSlug: any = await Blog.findOne({ slug: newSlug })
    if (foundSlug) return res.status(500).send('Post already exists')
    req.body.slug = newSlug
    try {
      let result: any = await Blog.create(req.body)
      return res.status(201).json(result)
    } catch (err) {
      return res.status(500).send(err)
    }
  })
)
router.get(
  '/api/blog/grab/:id',
  catchAsync(async (req, res) => {
    try {
      const url = `https://api.envato.com/v3/market/catalog/item?id=${req.params.id}`
      let item: any = await Axios({
        method: 'GET',
        headers: { Authorization: 'Bearer ' + ENVATO_KEY },
        url,
      })
      item = item.data
      return res.status(200).json(item)
    } catch (e) {
      return res.status(500).json(e)
    }
  })
)
router.get(
  '/api/blog/sync',
  catchAsync(async (req, res) => {
    try {
      let count = 0
      Blog.on('es-bulk-sent', function (doc) {
        count += doc
        console.log('Indexed: ', count)
      })

      Blog.on('es-bulk-data', function (doc) {})

      Blog.on('es-bulk-error', function (err) {
        console.error(err)
        return res.status(500).send(err)
      })
      // @ts-ignore
      await Blog.esSynchronize().then(function (doc) {
        console.log('end.', doc)
        return res.send('indexed ' + doc._shards.successful + ' documents!')
      })
    } catch (e) {
      return res.status(500).json(e)
    }
  })
)
router.put(
  '/api/blog/:id',
  catchAsync(async (req, res) => {
    if (req.body._id) {
      //delete req.body._id
      Reflect.deleteProperty(req.body, '_id')
    }
    if (!req.params) {
      res
        .status(406)
        .send('Record id missing. Please specify which ID to be updated.')
      return
    }
    let product: any = await Blog.findById(req.params.id)
    if (!product || product == 0) {
      return res
        .status(401)
        .json({ message: 'The resource belongs to a different owner' })
    }
    if (!req.body.slug && req.body.name) {
      try {
        req.body.slug = await generateSlug(req.body.name) // Generate unique slug by adding -en at end if exists
      } catch (e) {
        res.status(422).json(e)
      }
    }
    try {
      await Blog.findByIdAndUpdate(req.params.id, {
        $set: req.body,
      })
      res.send('success')
    } catch (err) {
      res.status(500).send(err)
    }
  })
)
router.delete(
  '/api/blog/:id',
  auth,
  catchAsync(async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
      res.status(404).send('Item not found')
      return
    }
    try {
      await Blog.remove({ _id: req.params.id }).exec()
      // apicache.clear('products')
      res.status(202).json({ msg: 'Item deleted' })
    } catch (err) {
      res.status(500).send(err)
    }
  })
)
router.delete(
  '/api/blog/search',
  catchAsync(async (req, res) => {
    const url = `https://api.envato.com/v1/market/random-new-files:codecanyon.json`
    const options = {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + ENVATO_KEY },
      url,
    }
    try {
      // @ts-ignore
      const pr: any = await Axios(options)
      const p = pr.data.products
      res.status(200).json(p)
      await Blog.insertMany(p)
    } catch (e) {
      res.status(422).send(e.toString())
    }
  })
)
// const takeScreenshot = async (
//   url: string,
//   dir: string,
//   name: string,
//   transparent = false
// ) => {
//   // Non transparent
//   console.log('processing screenshot ...', name, url)
//   try {
//     const browser: any = await puppeteer.launch({
//       args: [
//         '--disable-gpu',
//         '--disable-dev-shm-usage',
//         '--disable-setuid-sandbox',
//         '--no-first-run',
//         '--no-sandbox',
//         '--no-zygote',
//       ],
//     })
//     const page: any = await browser.newPage()
//     await page.setViewport({ width: 1280, height: 800 })
//     if (!fsx.existsSync(`${STATIC_PATH}/screenshots/${dir}`))
//       fsx.ensureDirSync(`${STATIC_PATH}/screenshots/${dir}`)
//     const options = {
//       path: `${STATIC_PATH}/screenshots/${dir}/${name}.png`,
//       omitBackground: transparent,
//     }
//     await page.goto(url, { timeout: 180000, waitUntil: 'networkidle2' })
//     await page.screenshot(options)
//     await browser.close()
//     return `${dir}/${name}.png`
//   } catch (e) {
//     console.log('screenshot err...', name, url, e.toString())
//     return
//   }
// }
