import { UPLOAD_DIR, STATIC_PATH, WWW_URL } from '../config'
const multipart = require('connect-multiparty')
import mkdirp from 'mkdirp'
import fsx from 'fs-extra'
const cheerio = require('cheerio')
const puppeteer = require('puppeteer')

const uploadDir = STATIC_PATH + UPLOAD_DIR + 'tmp'
mkdirp(uploadDir)

const multipartyMiddleware = multipart({ uploadDir })

import { Router } from 'express'
import { auth, catchAsync } from '../middleware'
import { User, Github } from '../models'
import axios from 'axios'
import {
  generateSlug,
  takeScreenshot,
  sliceByWord,
  uploadToCloudinary,
  generateGithubSitemap,
  toJson,
  sysdate,
  sleep,
  deleteFromCloudinary,
} from '../utils'
var Xray = require('x-ray')
var x = Xray()
const router = Router()
const filename = 'sitemap-ff-free.xml'
import colors from 'colors/safe'

router.get(
  '/api/github/email',
  catchAsync(async (req, res) => {
    const browser: any = await puppeteer.launch({
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
      ],
    })
    try {
      const page: any = await browser.newPage()
      page.setExtraHTTPHeaders({
        Cookie:
          '_octo=GH1.1.1480860503.1581396799; _ga=GA1.2.682361381.1581396800; _device_id=bb1c458972cb9d07ee3d63f4271ad607; experiment:homepage_signup_flow=eyJ2ZXJzaW9uIjoiMSIsInJvbGxPdXRQbGFjZW1lbnQiOjI2LjY1NDgyMDA4MDUzMzM0OCwic3ViZ3JvdXAiOiJjb250cm9sIiwiY3JlYXRlZEF0IjoiMjAyMC0wNC0yMFQwMTo1NTowNC4xNzFaIiwidXBkYXRlZEF0IjoiMjAyMC0wNC0yMFQwMTo1NTowNC4xNzFaIn0=; user_session=mTZJMpfFXE2tgIP9sNp_c_I0Jv8k-vRzij1ZdNrht0reib-3; __Host-user_session_same_site=mTZJMpfFXE2tgIP9sNp_c_I0Jv8k-vRzij1ZdNrht0reib-3; dotcom_user=itswadesh; logged_in=yes; tz=Asia%2FCalcutta; has_recent_activity=1; _gid=GA1.2.981401119.1602161509; _gh_sess=N%2B2Ax8NJvXbK61irpnVDG8YtNh3K9MCqVftEjPOVlWJxOwEyrgHcGlnVO17%2Byaqoa2eNA5XJnQSbMk8xtr9NguygI42JbbK5nPWOuY2H3SE820gmFYatGNe3R0HUWzY8zgjuLMsErweaP3glQBTbsBgX%2BArrRPt9CFV3%2Fn19FvQVYsVvPNUrcZrjyNExJoBkZ%2B9cQEvxljhhquc%2FFpfbHvhNpTnpThOW75EjXJCIGRznJ8ZDxmq1DEXiIbE5dl2%2FVb49d7T0EyXtaTdzt7NkV%2B6Emdm1bfoc1%2BUA3Gnl6zaMBpQJKQA8ywy4FNxmOHVQWXCXKph6rUU7%2BkW0edHt1j3vcCI4CgjOKP0LlIrxEV2gBw4XfOtH2H8UgG9Sg4xrDp1aplYBphBO2OGSinxQPCdHl%2B27a5bHZ8inzajlyWHR7CNONUdVbnnNyscgRmHahAc4rOQgKn4lGrWdjm7uNx95tpD5Kd1%2FeN5%2B4RmI%2BW%2FVnQjoQlSo%2F8dS6s%2F1qQiB3iCa%2Fgcah18sistt7l80SgyuTlLGGyduB4fIZZKHbJbI9CvcdfmPZZVQfKMpt2doBV4ttHD1GtPwBirVLPmFAifm95%2BbJ3ZxLpVYzhrc4JIEo3cTFvX1DSgqvhXJtnuMcu4MqDrPKX5BZ69r7ZG3wg2RwsNBYXRflgHz1RCEgUty7Hnyp9ZKKTMSxx5fbJ1DXlKjtG871eOghUGqYH978kp6HjuBcjJB5QTVjXNtbu3JTFP8mxFPX%2Bn35%2Bsyd1%2BTgs%2BFCa8cBXADcqXBkn7c8KUmZepIx%2FmRcls%2B%2FnXJ659Pdmi6nQqlMh66YFC4FyG%2B6ZtcgRsFT0dcX34J77wjECx%2FZd%2BKVBYg--OzZrYHadYJq0QDzW--EASXqhxdLLnwpArVPGtSnw%3D%3D',
      })
      await page.setViewport({ width: 1280, height: 800 })
      const username = 'jashion'
      let limit = 1000
      // let skip = (+req.params.page - 1) * limit
      let g1: any = await Github.find({ 'owner.email': null })
        // .skip(skip)
        .limit(limit)
      let emails = []
      for (let g of g1) {
        const url = `https://github.com/${g.owner.login}`
        const r = await page.goto(url, { timeout: 15000 })
        const content = await page.content()
        const $ = cheerio.load(content)
        let email = $('.vcard-details .u-email').text().trim()
        g.owner.email = email
        await g.save()
        emails.push(g.owner.email)
      }
      res.send(emails)
    } catch (err) {
      console.log('Err grabbing Amazon::: ', err.toString())
      await sleep(Math.random() * 60000)
      return
    } finally {
      await browser.close()
    }
  })
)
router.get(
  '/api/github',
  catchAsync(async (req, res) => {
    const search: any = req.query.search
    const category: any = req.query.category
    const limit = +req.query.limit || 12
    const page = !req.query.page && +req.query.page != 0 ? 1 : +req.query.page
    const sort = req.query.sort || '-popularity -featured -createdAt'
    const skip = (page - 1) * limit
    const from = req.query.fromStar
    const to = req.query.toStar
    // const select = toJson(req.query.select);
    // const populate = toJson(req.query.populate);
    delete req.query.page
    delete req.query.sort
    delete req.query.search
    delete req.query.category
    delete req.query.select
    delete req.query.populate
    delete req.query.limit
    delete req.query.fromStar
    delete req.query.toStar
    let where: any = req.query
    for (let k in where) {
      if (
        where[k] == '' ||
        where[k] == 'null' ||
        where[k] == 'undefined' ||
        where[k] == undefined
      )
        delete where[k]
      if (where[k] == 'blank') where[k] = null
    }
    where = toJson(where) || {}
    if (from || to)
      where.stargazers_count = { $gte: +(from || 0), $lte: +(to || 100000) }
    where.active = true
    if (category) where.category = category
    let searchString = where
    if (search != 'null' && !!search && search != 'undefined')
      searchString = { ...where, q: { $regex: new RegExp(search, 'ig') } }

    const data = await Github.find(searchString)
      .select('-content')
      .sort(sort)
      .limit(limit)
      .skip(skip)
    const count = await Github.countDocuments(searchString)
    res.json({ data, page, count, pageSize: limit })
  })
)

router.get(
  '/api/github/list',
  catchAsync(async (req, res) => {
    try {
      const q = req.query.q || 'svelte+ecommerce'
      const stars = +req.query.stars || 0
      const pageSize = 100
      let page = +req.query.page || 1
      let url = `https://api.github.com/search/repositories?q=${q}+stars:>${stars}&per_page=${pageSize}&page=1`
      let docs = (await axios(url)).data
      let data = []
      for (let r of docs.items) {
        let d: any = {}
        // if (!r.homepage || r.homepage == null || r.homepage == 'null') continue
        // Get the content
        // d.content = await x(`${r.html_url}`, '#readme article@html')
        d.id = r.id
        d.name = r.name
        d.full_name = r.full_name
        d.description = r.description
        d.url = r.url
        d.html_url = r.html_url
        d.homepage = r.homepage
        d.size = r.size
        d.stargazers_count = r.stargazers_count
        d.owner = {
          login: r.owner.login,
          id: r.owner.id,
          avatar_url: r.owner.avatar_url,
          gravatar_id: r.owner.gravatar_id,
          url: r.owner.url,
          html_url: r.owner.html_url,
        }
        d.banner = r.banner
        d.content = r.content
        data.push(d)
      }
      return res.json({ pageSize, page, count: docs.total_count, data })
    } catch (e) {
      return res.status(500).send(e)
    }
  })
)

router.get(
  '/api/github/grab',
  catchAsync(async (req, res) => {
    try {
      const q = req.query.q || 'svelte+ecommerce'
      const stars = +req.query.stars || 0
      let page = +req.query.page || 1
      const pageSize = 100
      let url = `https://api.github.com/search/repositories?q=${q}+stars:>${stars}&per_page=${pageSize}&page=${page}`
      let docs = (await axios(url)).data
      let no_of_pages = 1
      if (!req.query.page || req.query.page == 'undefined') {
        const total = docs.total_count > 1000 ? 1000 : docs.total_count
        no_of_pages = Math.ceil(total / pageSize)
        // page = Math.ceil(Math.random() * no_of_pages)
        // console.log('page...', page)
        // url = `https://api.github.com/search/repositories?q=${q}+stars:>${stars}&per_page=${pageSize}&page=${page}`
      }
      // url = `https://api.github.com/search/repositories?q=${q}+stars:>${stars}&per_page=${pageSize}&page=${page}`
      let data = [],
        indb = [],
        inserted = [],
        noimg = []
      console.log(
        '\x1b[36m%s\x1b[0m',
        `grab start... ${sysdate()} ${colors.yellow(docs.total_count)} ${url}`
      )
      for (let p = 1; p <= no_of_pages; p++) {
        const { d, idb, iserted, noi } = await startGrabbing(
          q,
          stars,
          p,
          pageSize
        )
        indb.push(idb)
        data.push(d)
        inserted.push(iserted)
        noimg.push(noi)
      }
      console.log(
        '\x1b[36m%s\x1b[0m',
        `grab complete... ${sysdate()} ${colors.cyan(
          data.length.toString()
        )} ${url}`
      )
      return res.json({ length: data.length, indb, inserted, noimg })
    } catch (e) {
      console.log('err... ', e)
      return res.status(500).send(e)
    }
  })
)

const startGrabbing = async (
  q: any,
  stars: number,
  page: number,
  pageSize: number
) => {
  let url = `https://api.github.com/search/repositories?q=${q}+stars:>${stars}&per_page=${pageSize}&page=${page}`

  console.log('\x1b[36m%s\x1b[0m', `grab page start... ${sysdate()} ${url}`)

  let data = [],
    indb = [],
    noimg = [],
    inserted = [],
    docs = (await axios(url)).data

  for (let r of docs.items) {
    // console.log('html_url... ', r.html_url)
    let d: any = await Github.findOne({ id: r.id })
    if (d) {
      indb.push(url)
      d = r
      continue
    } else {
      let img
      try {
        img = await x(`${r.html_url}`, '#readme article img@src')
      } catch (e) {}
      // console.log('grab img from readme ... ')
      if (!img && (!r.homepage || r.homepage == null || r.homepage == 'null')) {
        noimg.push(url)
        // console.log('No Image... ', url)
        continue
      }
      // console.log('Image found... ', url)

      // console.log('Not found in db ... ', url)
      inserted.push(url)
      d = new Github(r)
      // Generate slug here for better error handling
      if (!r.description || r.description == null || r.description == 'null')
        r.description = ''
      if (!r.slug)
        d.slug = await generateSlug(
          sliceByWord(r.name + ' ' + r.description, 50)
        )
      try {
        // Get the content
        d.content = await x(`${r.html_url}`, '#readme article@html')

        // If home page not defined grab image from readme
        if (!r.homepage || r.homepage == null || r.homepage == 'null')
          d.banner = await uploadToCloudinary(img, d.slug)
        // Go to homepage and download og:image or a screenshot
        else {
          try {
            d.banner = await x(
              `${d.homepage}`,
              'meta[property="og:image"]@content'
            )
          } catch (e) {}
          if (!d.banner)
            d.banner = await takeScreenshot(
              r.homepage,
              'screenshots/github',
              d.slug
            )
        }
      } catch (e) {
        console.log('Err::: ', e)
      }
      d.terms = { q, stars, page }
      await d.save()
      data.push(d)
    }
  }
  console.log(
    '\x1b[36m%s\x1b[0m',
    `grab page end... ${sysdate()} ${colors.cyan(
      docs.total_count
    )} ${colors.green(
      'inserted:' + inserted.length.toString()
    )} ${colors.yellow('noimg:' + noimg.length.toString())} ${colors.red(
      'indb:' + indb.length.toString()
    )} ${url}`
  )
  return {
    d: data,
    idb: indb,
    iserted: inserted,
    noi: noimg,
  }
}

router.get(
  '/api/github/sitemap',
  catchAsync(async (req, res) => {
    const docs = await generateGithubSitemap(WWW_URL, filename)
    return res.json(docs)
  })
)

router.get(
  '/api/github/save',
  catchAsync(async (req, res) => {
    const docs = await Github.find()
    for (let d of docs) {
      d.save()
    }
    return res.json(docs)
  })
)

router.put(
  '/api/github/:id',
  catchAsync(async (req, res) => {
    let g: any = await Github.findById(req.params.id)
    if (req.body.active != null && typeof req.body.active !== 'undefined') {
      g.active = req.body.active
    }
    if (req.body.featured != null && typeof req.body.featured !== 'undefined') {
      g.featured = req.body.featured
    }
    if (req.body.popularity) g.popularity = req.body.popularity
    if (req.body.banner) g.banner = req.body.banner
    if (req.body.homepage) g.homepage = req.body.homepage
    g.save()
    return res.json(g)
  })
)

router.delete(
  '/api/github/:id',
  catchAsync(async (req, res) => {
    let g = await Github.findByIdAndRemove(req.params.id)
    return res.json(g)
  })
)

router.post(
  '/api/github/saveBanner',
  multipartyMiddleware,
  catchAsync(async (req, res) => {
    //@ts-ignore
    const banner = req.files.files
    console.log('paths...........', banner)
    try {
      // const g = await Github.findOne({ slug: banner.name })
      // console.log('gggggggggggggg..........', g)
      // const cloudinaryD = await deleteFromCloudinary(banner.name)
      const cloudinary = await uploadToCloudinary(banner.path, banner.name)
      fsx.remove(banner.path)
      console.log('cloudinary...........', cloudinary)
      return res.status(200).send(cloudinary)
    } catch (e) {
      console.log('err... ', e)
      return res.status(500).send(e.toString())
    }
  })
)
router.post(
  '/api/github/fetch1',
  catchAsync(async (req, res) => {
    try {
      // var url = `https://api.github.com/users/itswadesh/repos`
      const userRepoUrl = req.body.html_url
      // const userRepoUrl = 'https://github.com/itswadesh/foodfire1'
      var url = `https://api.github.com/repos/${userRepoUrl.replace(
        'https://github.com/',
        ''
      )}`
      let repo = (await axios(url)).data
      repo.programming_language = repo.language
      repo.isUserSubmitted = true
      let d: any = await Github.findOne({ id: repo.id })
      if (d) {
        d.html_url = repo.html_url
        try {
          d.banner = await x(
            `${repo.html_url}`,
            'meta[property="og:image"]@content'
          )
        } catch (e) {}
        d.save()
        return res.json(d)
      } else {
        // Try catch required here but not required at /grab because we are manually sprcifying the banner
        try {
          repo.banner = await x(
            `${repo.html_url}`,
            'meta[property="og:image"]@content'
          )
          if (!repo.banner) {
            repo.banner = await x(`${repo.html_url}`, '#readme article img@src')
          }
        } catch (e) {}
        // Generate slug here for better error handling
        if (
          !repo.description ||
          repo.description == null ||
          repo.description == 'null'
        )
          repo.description = ''
        if (!repo.slug)
          repo.slug = await generateSlug(
            sliceByWord(repo.name + ' ' + repo.description, 50)
          )
        repo.content = await x(`${repo.html_url}`, '#readme article@html')
        d = new Github(repo)
        await d.save()
        return res.json(d)
      }
    } catch (e) {
      if (e.response && e.response.status === 404)
        return res.status(404).send('Invalid repo URL specified')
      else if (e.response) return res.status(500).send(e.response.data.message)
      else return res.status(500).send(e.toString())
    }
  })
)

router.get(
  '/api/github/grab/:id',
  catchAsync(async (req, res) => {
    try {
      var url = `https://api.github.com/repositories/213575283`
      const docs = (await axios(url)).data.items
      return res.json(docs)
    } catch (e) {
      return res.status(500).send(e)
    }
  })
)

router.get(
  '/api/github/:slug',
  catchAsync(async (req, res) => {
    const slug = req.params.slug
    const data = await Github.findOne({
      slug,
    })
    res.json(data)
  })
)

export { router as ff }
