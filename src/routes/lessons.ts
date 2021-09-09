import { Router } from 'express'
import { auth, catchAsync } from '../middleware'
import { User, Lessons } from '../models'
import axios from 'axios'
import { generateSlug, generateLessonsSitemap } from '../utils'
const { NEWSAPI_KEY } = process.env

const router = Router()
const filename = 'sitemap-lessons.xml'

router.get(
  '/api/lessons',
  catchAsync(async (req, res) => {
    const limit = +req.query.limit || 10
    const page = +req.query.page || 1
    const skip = (page - 1) * limit
    const data = await Lessons.find().limit(limit).skip(skip).sort('-createdAt')
    const count = await Lessons.countDocuments()
    res.json({ data, page, count, pageSize: limit })
  })
)

router.get(
  '/api/lessons/grab',
  catchAsync(async (req, res) => {
    try {
      const date = new Date()
      const d = date.getDate()
      const m = date.getMonth().toString().padStart(2, '0')
      const y = date.getFullYear()
      const today = y + '-' + m + '-' + d

      const q = req.query.q || 'javascript'
      let page = +(req.query.page || 1)
      let url = `http://newsapi.org/v2/everything?language=en&q=${q}&pageSize=100&page=${page}&from=${today}&sortBy=latest&apiKey=${NEWSAPI_KEY}`
      const data = GetRecursiveData(url)
      // let docs = (await axios(url)).data
      // let no_of_pages = Math.ceil(docs.totalResults / 100)
      // page = Math.ceil(Math.random() * no_of_pages)
      // url = `http://newsapi.org/v2/everything?language=en&q=${q}&pageSize=100&page=${page}&from=${today}&sortBy=latest&apiKey=${NEWSAPI_KEY}`
      console.log(url)

      return res.json(data)
    } catch (e) {
      return res.status(500).send(e)
    }
  })
)

router.get(
  '/api/lessons/sitemap',
  catchAsync(async (req, res) => {
    const docs = await generateLessonsSitemap(
      'https://www.2lessons.info',
      filename
    )
    return res.json(docs)
  })
)

router.get(
  '/api/lessons/:slug',
  catchAsync(async (req, res) => {
    const slug = req.params.slug
    const data = await Lessons.findOne({
      slug,
    })
    res.json(data)
  })
)

const GetRecursiveData = async (url: string) => {
  let docs = (await axios(url)).data
  let data = []
  for (let r of docs.articles) {
    if (!r.urlToImage) continue
    r.banner = r.urlToImage
    r.content = r.content && r.content.substring(0, r.content.indexOf('… [+'))
    let d: any = await Lessons.findOne({ url: r.url })
    if (d) {
      d = r
    } else {
      console.log('Start insert... ', r.url)
      d = new Lessons(r)
      await d.save()
      data.push(d)
    }
  }
  return data
}

export { router as lessons }
