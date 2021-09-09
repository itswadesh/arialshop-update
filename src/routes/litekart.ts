import { Router } from 'express'
import { auth, catchAsync } from '../middleware'
import { User, Litekart } from '../models'
import { generateLitekartSitemap, generateSlug, upload } from '../utils'
const filename = 'sitemap-litekart.xml'
import axios from 'axios'
var Xray = require('x-ray')
var x = Xray()

const router = Router()

router.get(
  '/api/litekart',
  catchAsync(async (req, res) => {
    const limit = +req.query.limit || 10
    const page = +req.query.page || 1
    const skip = (page - 1) * limit
    const data = await Litekart.find().limit(limit).skip(skip)
    const count = await Litekart.countDocuments()
    res.json({ data, page, count, pageSize: limit })
  })
)

router.get(
  '/api/litekart/grab',
  catchAsync(async (req, res) => {
    try {
      const q = req.query.q || 'ecommerce'
      let page = +req.query.page //|| Math.floor(Math.random() * 100)
      const pageSize = 200
      page = +page || 1
      let url = `https://dev.to/search/feed_content?per_page=${pageSize}&page=${page}&search_fields=${q}`
      let docs = (await axios(url)).data

      // if (!req.query.page) {
      //   const total = docs.result.length > 1000 ? 1000 : docs.result.length
      //   console.log('total...', total)
      //   let no_of_pages = Math.ceil(total / pageSize)
      //   page = Math.ceil(Math.random() * no_of_pages)
      //   console.log('page...', page)
      //   url = `https://dev.to/search/feed_content?per_page=${pageSize}&page=${page}&search_fields=${q}`
      // }
      // docs = (await axios.get(url)).data
      console.log(url)

      let data = []
      for (let r of docs.result) {
        if (!r.main_image) continue
        r.id = 'dev' + '-' + r.id
        r.name = r.user ? r.title + ' by ' + (r.user && r.user.name) : r.title
        r.highlight = r.highlight && r.highlight.body_text.join(',')
        r.tags = r.tag_list
        r.original_image = r.main_image
        r.category = r.class_name
        if (r.user)
          r.author = {
            id: r.user.id,
            name: r.user.name,
            avatar: r.user.profile_image_90,
            username: r.user.username,
          }
        let d: any = await Litekart.findOne({ id: r.id })
        if (d) {
          d = r
        } else {
          d = new Litekart(r)
          try {
            d.body = await x(`https://dev.to${r.path}`, '#article-body@html')
            await d.save()
            data.push(d)
          } catch (e) {}
        }
      }
      try {
        await upload()
      } catch (e) {
        console.log('Upload err at controller...', e.toString())
      }
      console.log('grabed litekart...........', data.length)
      return res.json(docs)
    } catch (e) {
      return res.status(500).send(e)
    }
  })
)

router.get(
  '/api/litekart/sitemap',
  catchAsync(async (req, res) => {
    const docs = await generateLitekartSitemap(
      'https://www.litekart.in',
      filename
    )
    return res.json(docs)
  })
)

router.get(
  '/api/litekart/:slug',
  catchAsync(async (req, res) => {
    const slug = req.params.slug
    const data = await Litekart.findOne({
      slug,
    })
    res.json(data)
  })
)

export { router as litekart }
