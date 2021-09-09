const { ObjectId } = require('mongodb')
import Axios from 'axios'
import {
  STATIC_PATH,
  WWW_URL,
  isFlipkart,
  isAmazon,
  isNykaa,
  isZivame,
  isMyntra,
  isAjio,
  isPurplle,
} from '../config'
import Envato from '../models/envato'
import {
  Blog,
  Product,
  Post,
  Author,
  PriceChart,
  AmazonPriceChart,
} from '../models'
import { generateSlug, generateSlugShopNx, sleep } from '../utils'
import { esQuery } from '../utils/envato'
import { Router } from 'express'
import { catchAsync } from '../middleware'
import { products } from './products'
require('dotenv').config()
const { ENVATO_KEY, FLIPKART_ID, FLIPKART_TOKEN } = process.env
const { createSitemap } = require('sitemap')
const fsx = require('fs-extra')
const zlib = require('zlib')
const path = require('path')
const axios = require('axios')
const cheerio = require('cheerio')
const request = require('superagent')
const request1 = require('request')
const router = Router()
const puppeteer = require('puppeteer')
import colors from 'colors/safe'
const DELAY_IN_MS = 1000 // 5 sec
// @ts-ignore
import { tall } from 'tall'
const client = require('flipkart-api-affiliate-client')
const fkClient = client(
  {
    trackingId: process.env.FLIPKART_ID,
    token: process.env.FLIPKART_TOKEN,
  },
  'json'
)

// @ts-ignore
import UserAgent from 'user-agents'
// Error =  "Possible EventEmitter memory leak detected. 11 SIGINT listeners added" solutions
process.setMaxListeners(Infinity)

router.get(
  '/api/amazon/url',
  catchAsync(async (req, res) => {
    const url: any = req.query.url
    try {
      const a = await getOneProductFromAmazon(url, '')
      res.send(a)
    } catch (e) {}
  })
)

router.get(
  '/api/amazon/fhd',
  catchAsync(async (req, res) => {
    try {
      const products: any = await PriceChart.find()
      for (let p of products) {
        const display_size =
          p.resolution && p.resolution.trim().includes('1080') ? 'FHD+' : 'HD+'
        await PriceChart.updateOne({ _id: p._id }, { $set: { display_size } })
      }
      res.send('success')
    } catch (e) {}
  })
)
// router.get(
//   '/api/amazon',
//   catchAsync(async (req, res) => {
//     try {
//       const { OperationHelper } = require('apac')

//       const opHelper = new OperationHelper({
//         awsId: 'AKIAJZN77UGLXD3UJZIA',
//         awsSecret: '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',
//         assocId: 'swadesh0d-21',
//       })

//       opHelper
//         .execute('ItemSearch', {
//           SearchIndex: 'Books',
//           Keywords: 'harry potter',
//           ResponseGroup: 'ItemAttributes,Offers',
//         })
//         .then((response) => {
//           res.send(response)
//         })
//         .catch((err) => {
//           console.error('Something went wrong! ', err)
//         })
//     } catch (e) {
//       throw e
//     }
//   })
// )
export const getDetailsFromAmazonPuppeteer = async (id: string) => {
  const url = `https://www.amazon.in/gp/product/${id}`
  // const response = await axios.get(url)
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
    await page.setViewport({ width: 1280, height: 800 })
    const r = await page.goto(url, { timeout: 15000 })
    const content = await page.content()
    const $ = cheerio.load(content)
    // let weight: string,
    //   color: string,
    //   battery: string,
    //   model: string,
    //   ram: string,
    //   display: string,
    //   launchDate: string,
    //   id: string
    let inStock = $('#availability').text().trim() === 'In stock.'
    const seller_price = $('#olp-upd-new .a-color-price')
      .text()
      .trim()
      .replace('₹ ', '')
      .replace(',', '')
      .replace('.00', '')
      .match(/\d+/g)
    const deal =
      $('#priceblock_dealprice')
        .text()
        .trim()
        .replace('₹ ', '')
        .replace(',', '')
        .replace('.00', '')
        .match(/\d+/g) || seller_price
    const sale =
      $('#priceblock_saleprice')
        .text()
        .trim()
        .replace('₹ ', '')
        .replace(',', '')
        .replace('.00', '')
        .match(/\d+/g) || deal
    let price =
      $('#priceblock_ourprice')
        .text()
        .trim()
        .replace('₹ ', '')
        .replace(',', '')
        .replace('.00', '')
        .match(/\d+/g) || sale
    let mrp =
      $('#price .a-text-strike')
        .text()
        .trim()
        .replace('₹ ', '')
        .replace(',', '')
        .replace('.00', '')
        .match(/\d+/g) || price
    console.log('ID::: ', id, inStock, price, mrp)
    price = price || [null]
    mrp = mrp || [null]
    if (price[0]) {
      console.log('Insert data...')
      await PriceChart.updateOne(
        { id },
        { $set: { inStock, price: +price[0], mrp: +mrp[0] } }
      )
    }
    $('#prodDetails tr ').each(async (i: number, el: any) => {
      let k = await $(el).find('th').text().trim()
      let v = await $(el).find('td').text().trim()
      if (k == 'Resolution') {
        const display_size = v && v.trim().includes('1080') ? 'FHD+' : 'HD+'
        await PriceChart.updateOne(
          { id },
          { $set: { display_size, resolution: v.trim() } }
        )
      }
      if (k == 'Item Weight') {
        await PriceChart.updateOne(
          { id },
          { $set: { weight: v.replace(' g', '') } }
        )
      } else if (k == 'Colour') {
        await PriceChart.updateOne({ id }, { $set: { color: v } })
      } else if (k == 'Battery Power Rating') {
        await PriceChart.updateOne({ id }, { $set: { battery: v } })
      } else if (k == 'Item model number') {
        await PriceChart.updateOne({ id }, { $set: { model: v } })
      } else if (k == 'RAM') {
        await PriceChart.updateOne({ id }, { $set: { ram: v } })
      } else if (k == 'Display technology') {
        await PriceChart.updateOne({ id }, { $set: { display: v } })
      } else if (k == 'Date First Available') {
        await PriceChart.updateOne({ id }, { $set: { launchDate: v } })
      }
    })
    return {}
  } catch (e) {
    throw e
  } finally {
    await browser.close()
  }
}
router.get(
  '/api/amazon',
  catchAsync(async (req, res) => {
    const data = await AmazonPriceChart.find()
    res.send(data)
  })
)
router.get(
  '/api/grab/amazondetail',
  catchAsync(async (req, res) => {
    const products = await PriceChart.find({
      source: 'amazon.in',
      mrp: null,
    })
    for (let p of products) {
      await getDetailsFromAmazonPuppeteer(p.id)
    }
    res.send('success')
  })
)
router.get(
  '/api/grab/amazon',
  catchAsync(async (req, res) => {
    try {
      const response = await axios.get('http://localhost:5000')
      const $ = await cheerio.load(response.data)
      let p: any = []
      $('.search-result-item').each(async function (i: number, el: any) {
        const name = $(el).find('a').text()
        const id = $(el).find('img').attr('alt')
        const img = $(el).find('img').attr('src')
        const price = $(el)
          .find('.product-price')
          .text()
          .replace('₹', '')
          .replace(',', '')
          .replace('.00', '')
          .trim()
        const brand = $(el)
          .find('.ac-product-merchant')
          .text()
          .toLowerCase()
          .replace('by ', '')
          .trim()
          .replace('redmi', 'mi')
          .replace('xiaomi', 'mi')
          .replace('huawei', 'honor')
          .replace('oppo mobiles india pvt. ltd.', 'oppo')
          .replace('oppo mobiles india private limited', 'oppo')
          .replace('oppo mobiles india pvt ltd', 'oppo')
          .replace('samsung india private limited', 'samsung')
          .replace('samsung india pvt ltd', 'samsung')
        // const a = $(el).find('a').attr('href')
        const amazon_url = `https://www.amazon.in/gp/product/${id}/ref=as_li_qf_asin_il_tl?ie=UTF8&tag=swadesh0d-21&creative=24630&linkCode=as2&creativeASIN=${id}`
        let prod = {
          id,
          name,
          brand,
          price,
          url: amazon_url,
          img: { '200x200': img },
          resolution: 'HD',
          inStock: true,
          active: true,
        }
        p.push(prod)
      })
      const amazon = await AmazonPriceChart.insertMany(p)
      res.send(amazon)
    } catch (e) {
      throw e
    }
  })
)
router.put(
  '/api/fk/:id',
  catchAsync(async (req, res) => {
    try {
      const { id } = req.params
      const { amazon_url } = req.body
      // console.log('zzzzzzzzzzzzzzzzzzzzzzzzzzz', id, amazon_url)
      const prod = await PriceChart.updateOne(
        { _id: id },
        { $set: { amazon_url } }
      )
      res.send(prod)
    } catch (e) {
      throw e
    }
  })
)
router.delete(
  '/api/fk/:id',
  catchAsync(async (req, res) => {
    try {
      const del = await PriceChart.updateOne(
        { _id: req.params.id },
        { active: false }
      )
      res.send('success')
    } catch (e) {
      throw e
    }
  })
)
router.get(
  '/api/fk/search',
  catchAsync(async (req, res) => {
    try {
      fkClient.doKeywordSearch('mobiles', 100).then(function (value: any) {
        const products = JSON.parse(value.body).products
        for (let p of products) {
          saveOneFlipkartProduct(p)
        }
        res.send(products)
      })
    } catch (e) {}
  })
)
router.get(
  '/api/fk/feed',
  catchAsync(async (req, res) => {
    try {
      fkClient.getProductsFeedListing().then(async function (value: any) {
        const data = JSON.parse(value.body)
        const get =
          data.apiGroups.affiliate.apiListings.mobiles.availableVariants[
            'v1.1.0'
          ].get
        const delta =
          data.apiGroups.affiliate.apiListings.mobiles.availableVariants[
            'v1.1.0'
          ].deltaGet
        await getProducts(get)
        res.send()
      })
    } catch (e) {}
  })
)
export const getProducts = async (url: string) => {
  return fkClient.getProductsFeed(url).then(async function (v: any) {
    const prod = JSON.parse(v.body)
    for (let p of prod.products) {
      await saveOneFlipkartProduct(p)
    }
    // console.log('zzzzzzzzzzzzzzzzzzzzzzzzzzz', prod.nextUrl)
    await getProducts(prod.nextUrl)
  })
}
router.get(
  '/api/fk',
  catchAsync(async (req, res) => {
    try {
      const { brand, inStock, display_size, sort }: any = req.query
      let where: any = { active: true }
      if (brand) where.brand = brand
      else
        where.brand = {
          $in: ['mi', 'realme', 'oppo', 'vivo', 'samsung', 'motorola'],
        }
      if (inStock) where.inStock = inStock
      if (display_size) where.display_size = display_size
      // console.log('zzzzzzzzzzzzzzzzzzzzzzzzzzz', where)
      let products: any = await PriceChart.find(where).sort(sort)
      return res.status(201).json(products)
    } catch (e) {
      return res.status(500).json(e)
    }
  })
)
router.post(
  '/api/fk',
  catchAsync(async (req, res) => {
    try {
      const { url }: any = req.body
      let params = new URL(url).searchParams
      const id = params.get('pid')
      let html = await fkClient.doIdSearch(id)
      const body = JSON.parse(html.body)
      const pc = saveOneFlipkartProduct(body)
      return res.status(201).json(pc)
    } catch (e) {
      return res.status(500).json(e)
    }
  })
)
// router.get(
//   '/api/flipkart/search',
//   catchAsync(async (req, res) => {
//     const url = `https://affiliate-api.flipkart.net/affiliate/1.0/search.json?query=${req.query.q}&resultCount=10`
//     const options = {
//       method: 'GET',
//       headers: {
//         'Fk-Affiliate-Id': FLIPKART_ID || '',
//         'Fk-Affiliate-Token': FLIPKART_TOKEN || '',
//       },
//       url,
//     }
//     try {
//       // @ts-ignore
//       const pr: any = await Axios(options)
//       res.status(200).json(pr.data.products)
//     } catch (e) {
//       res.status(422).send(e.toString())
//     }
//   })
// )
// router.get(
//   '/api/axios',
//   catchAsync(async (req, res) => {
//     const url = `https://mlpl.link/INFrES4u`
//     // const data = await fetch(url)
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
//     const r = await page.goto(url, {
//       timeout: 15000,
//     })
//     await browser.close()
//     res.json(r._url)
//   })
// )
router.post(
  '/api/flipkart/one',
  catchAsync(async (req, res) => {
    try {
      let { url, postId, category }: any = req.body
      const prod = createProductFromUrl({ url, postId, category })
      return res.status(201).json(prod)
    } catch (e) {
      return res.status(500).json(e)
    }
  })
)
// axios.interceptors.response.use(
//   (response) => {
//     console.log('rrrrrrrrrrrrrrrrrr', response.data)
//     return response
//   },
//   (error) => {
//     if (error.response && error.response.data && error.response.data.location) {
//       window.location = error.response.data.location
//     } else {
//       return Promise.reject(error)
//     }
//   }
// )
export const saveOneFlipkartProduct = async (body: any) => {
  const base = body.productBaseInfoV1
  const specs = body.categorySpecificInfoV1
  let model, color, resolution, display, storage, ram
  for (let spec in specs) {
    const s: any = spec
    if (s == 'specificationList') {
      for (let k of specs[s]) {
        const f = k.values
        for (let v of f) {
          if (v.key == 'Model Name') model = v.value[0]
          else if (v.key == 'Color') color = v.value[0]
          else if (v.key == 'Resolution') resolution = v.value[0]
          else if (v.key == 'Display Type') display = v.value[0]
          else if (v.key == 'Internal Storage') storage = v.value[0]
          else if (v.key == 'RAM') ram = v.value[0]
        }
      }
    }
  }
  const price = base.flipkartSpecialPrice
    ? base.flipkartSpecialPrice.amount
    : base.flipkartSellingPrice.amount
  const data = {
    id: base.productId,
    name: base.title,
    img: base.imageUrls,
    mrp: base.maximumRetailPrice.amount,
    price,
    url: base.productUrl,
    brand: base.productBrand.toLowerCase(),
    inStock: base.inStock,
    model,
    color,
    resolution,
    display,
    storage,
    ram,
  }
  let pc: any = await PriceChart.findOne({ id: data.id })
  if (!pc) {
    pc = await PriceChart.create(data)
  } else {
    pc = await PriceChart.findOneAndUpdate({ id: data.id }, data)
  }
  await pc.save()
  return pc
}
export const geturl = async (url: string) => {
  try {
    // fetch(url, {
    //   redirect: 'manual',
    // }).then((res) => {
    //   if (res.type === 'opaqueredirect') {
    //     console.log('zzzzzzzzzzzzzzzzzzzzzzzzzzz', res.url)
    //     // redirect to login page
    //     // window.location.href = response.url
    //   } else {
    //     console.log('22222222222222222222', res)
    //     // handle normally / pass on to next handler
    //   }
    // })
    // const url1 = require('url')

    // axios(url).then((response) => {
    //   console.log('zzzzzzzzzzzzzzzzzzz', response.url)
    // })
    // const res = await request.get(url)
    // console.log(r.uri.href)
    // console.log('zzzzzzzzzzzzzzzzzzzzzzzzzzz', res.request.uri.href)
    // return res
    // console.log('hhhhhhhhhhhhhhhhhhhhhhhhhhhh', res)

    // return req
    // return await tall(url)
    // let data = await fetch(url)
    // data = await fetch(data.url)
    // return data.url

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
      await page.setViewport({ width: 1280, height: 800 })
      const r = await page.goto(url, { timeout: 15000 })
      return r._url
    } catch (e) {
      throw e
    } finally {
      await browser.close()
    }
  } catch (e) {
    try {
      return await tall(url)
    } catch (e) {
      return url
    }
  }
}
export const createProductFromUrl = async ({ url, postId, category }: any) => {
  if (!postId) return 'postId not specified'
  const post: any = await Post.findById(postId)
  if (!post) return 'Post not found'
  url = await geturl(url)
  let product: any = await Product.findOne({ url })
  if (!product) {
    // console.log(colors.red('Product Not found...........'))
    let prod: any = null
    const userAgent =
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    // const userAgent = new UserAgent()
    // console.log(userAgent.toString())
    if (isFlipkart(url)) {
      prod = await getOneProductFromFlipkart(url, userAgent)
    } else if (isAmazon(url)) {
      prod = await getOneProductFromAmazon(url, userAgent)
    } else if (isNykaa(url)) {
      prod = await getOneProductFromNyka(url, userAgent)
    } else if (isZivame(url)) {
      prod = await getOneProductFromZivame(url, userAgent)
    } else if (isMyntra(url)) {
      // Not working on server
      prod = await getOneProductFromMyntraPuppeteer(url, userAgent)
    } else if (isAjio(url)) {
      // Not collecting images
      prod = await getOneProductFromAjio(url, userAgent)
    } else if (isPurplle(url)) {
      // Not collecting images
      prod = await getOneProductFromPurplle(url, userAgent)
    } else {
      return 'Not found in flipkart, amazon, nykaa, purplle, zivame, ajio'
    }
    if (!prod)
      return 'Not found in flipkart, amazon, nykaa, purplle, zivame, ajio'
    prod.category = category
    // const p: any = await Product.findOne({ id: prod.id })
    product = await Product.findOneAndUpdate({ id: prod.id }, prod, {
      upsert: true,
      new: true,
    })
  }
  await Post.updateOne(
    { _id: postId },
    { $addToSet: { products: product._id } }
  )
  await Author.updateOne(
    { _id: post.author },
    { $addToSet: { products: product._id } }
  )
  product.author = post.author
  product.post = postId
  await product.save()
  // console.log('Products grabbing complete... ', postId)
  return product
}
const getOneProductFromMyntraPuppeteer = async (
  url: string,
  userAgent: string
) => {
  const browser = await puppeteer.launch({
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
    // const url =
    //   'https://www.myntra.com/jeans/only/only-women-black-skinny-fit-mid-rise-low-distress-stretchable-cropped-jeans/10973332/buy'

    const page = await browser.newPage()
    await page.setExtraHTTPHeaders({
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36',
    })
    await page.goto(url)
    const id = await page.evaluate(() => {
      return document.querySelector('.supplier-styleId')!.textContent
    })
    // const urlArr = url.split('/')
    // const UrlId = urlArr[urlArr.length - 2]
    const u = `https://www.myntra.com/proxy-pr/apify/v2/product/${id}`
    const response = await page.goto(u)
    let data = await response.text()
    // await page.goto(url)
    // const jsonLd = await page.$$('[type="application/ld+json"]')

    // const body = await page.evaluate(() => {
    //   const id = document.querySelector('.supplier-styleId')!.textContent
    //   const brand = document.querySelector('.pdp-title')!.textContent
    //   const name = document.querySelector('.pdp-name')!.textContent
    //   // let price = document.querySelector('.pdp-price')!.textContent || ''
    //   // price = price.replace('Rs. ', '').trim()
    //   // let mrp = document.querySelector('.pdp-mrp')!.textContent || ''
    //   // mrp = mrp.replace('Rs. ', '').trim()

    //   const images = Array.from(
    //     document.querySelectorAll('.image-grid-image'),
    //     (e) =>
    //       // @ts-ignore
    //       e
    //         .getAttribute('style')
    //         .replace('background-image: url("', '')
    //         .replace('");', '')
    //   )
    //   const obj: any = Array.from(
    //     document.querySelectorAll("script[type='application/ld+json']"),
    //     (e: any) => {
    //       let $ = cheerio.load(obj)
    //       return e.innerText
    //     }
    //   )
    //   console.log('zzzzzzzzzzzzzzzzzzzzzzzzzzz', obj)
    //   // for (var i in obj) {
    //   //   for (var j in obj[i].children) {
    //   //     var data = obj[i].children[j].data
    //   //     if (data) {
    //   //       try {
    //   //         data = JSON.parse(data)
    //   //         if (data['@type'] == 'Product') {
    //   //           id = data.mpn
    //   //           name = data.name
    //   //           img = data.image
    //   //           brand = data.brand.name
    //   //           price = data.offers.price
    //   //           mrp = data.offers.price
    //   //           availability = data.offers.availability
    //   //         }
    //   //       } catch (e) {}
    //   //     }
    //   //   }
    //   // }
    //   let details = {
    //     id,
    //     name,
    //     brand,
    //     ratings: 0,
    //     availability: 'Available',
    //     // price: +price,
    //     // mrp: +mrp,
    //     images,
    //     img: images[0],
    //     obj,
    //   }
    //   return details
    // })
    data = JSON.parse(data)
    const { name, ratings, brand, media, sizes, mrp, descriptors } = data.style
    const images = media.albums[0].images.map((i: any) =>
      i.imageURL.replace('http://', 'https://')
    )
    const style = sizes.find((i: any) => i.styleId == id)
    const price = style.sizeSellerData[0]
      ? style.sizeSellerData[0].discountedPrice
      : 0
    const description = descriptors.map((d: any) => d.description).join('. ')
    const currentDate = new Date()
    let details = {
      id,
      name,
      brand: brand.name,
      ratings: Math.round((ratings && ratings.averageRating) * 10) / 10,
      availability: 'Available',
      price: +(price || mrp),
      mrp: +mrp,
      images,
      img: images[0],
      url,
      description,
      created: currentDate,
      date: `${currentDate.getDate()}/${
        currentDate.getMonth() + 1
      }/${currentDate.getFullYear()}`,
      time: `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`,
    }
    console.log(colors.green('Sleeping after myntra scrap::: '), details.id)
    await sleep(Math.random() * DELAY_IN_MS)
    return details
  } catch (error) {
    console.log(error)
  } finally {
    await browser.close()
  }
}
const getOneProductFromMyntra = async (url: string, userAgent: string) => {
  try {
    // let id = url.split('/')[5]
    const currentDate = new Date()
    const response = await axios.get(url)
    const $ = await cheerio.load(response.data)
    const ratings = 0
    const keywords = $("meta[name='keywords']").attr('content')
    const description = $("meta[name='description']").attr('content')
    let id, name, brand, price, mrp, availability, img
    var obj = $("script[type='application/ld+json']")
    for (var i in obj) {
      for (var j in obj[i].children) {
        var data = obj[i].children[j].data
        if (data) {
          try {
            data = JSON.parse(data)
            if (data['@type'] == 'Product') {
              id = data.mpn
              name = data.name
              img = data.image
              brand = data.brand.name
              price = data.offers.price
              mrp = data.offers.price
              availability = data.offers.availability
            }
          } catch (e) {}
        }
      }
    }
    console.log('Grabbing from myntra... ', id)
    const images: any = []
    const details = {
      id,
      created: currentDate,
      date: `${currentDate.getDate()}/${
        currentDate.getMonth() + 1
      }/${currentDate.getFullYear()}`,
      time: `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`,
      url: url,
      name,
      brand,
      keywords,
      description,
      ratings: +ratings,
      availability,
      price: +price.replace('₹', '').replace(',', ''),
      mrp: +mrp.replace('₹', '').replace(',', ''),
      images,
      img,
    }
    return details
  } catch (err) {
    console.log(err.toString())
  }
}
const getOneProductFromMyntra0 = async (url: string, userAgent: string) => {
  try {
    const currentDate = new Date()
    const id = '8254653'
    const url = `https://www.myntra.com/proxy-pr/apify/v2/product/${id}`
    // console.log('zzzzzzzzzzzzzzzzzzzzzzzzzzz', url)
    axios.interceptors.request.use((request: any) => {
      console.log('Starting Request', request)
      return request
    })
    axios.interceptors.response.use((response: any) => {
      // console.log('Response:', response)
      return response
    })
    const response = await axios.get(url, {
      headers: {
        authority: 'www.myntra.com',
        method: 'GET',
        path: '/proxy-pr/apify/v2/product/1946689/offers/4027',
        scheme: 'https',
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-US,en;q=0.9,vi;q=0.8,fr;q=0.7',
        'cache-control': 'no-cache',
        cookie:
          '_abck=B91A3285BF1B9FFB7145767732473FAA~0~YAAQzv3UFwU+RqdyAQAAn1t2ygSb2qOpF/85nuyDO4uBKeptUuAktJc3BeeiACf/8YN78IRLuDAFXAtgvppLFkxio4PyIMWcZDF86HIQVSwzAkg0d5Uzo2+Z9I8/ilLbSHpRvFdhtlj0gdlJNXSjhEMLlh9NJCQdiMpOfbczCBbGVv+u01ZCVjTqR/rdNnH+4OTnLvY/+nMbPOIBL5LFCdUN0E0J8rEGIqYmN26bck8GAi/h9zRM1Cq0MHHwFTf6wkIbxlC9fBiuXn+IaMGXP+vtsDothsN5rROdV+/4Nz+GEw1FQa8TIGIUoiKY57ZR+w40hkIRkA==~-1~-1~-1; at=ZXlKaGJHY2lPaUpJVXpJMU5pSXNJbXRwWkNJNklqRWlMQ0owZVhBaU9pSktWMVFpZlEuZXlKdWFXUjRJam9pWkRKaE5qY3lNamN0WTJabU5DMHhNV1ZoTFRnME56Z3RNREF3WkROaFpqSTROVFl4SWl3aVkybGtlQ0k2SW0xNWJuUnlZUzB3TW1RM1pHVmpOUzA0WVRBd0xUUmpOelF0T1dObU55MDVaRFl5WkdKbFlUVmxOakVpTENKaGNIQk9ZVzFsSWpvaWJYbHVkSEpoSWl3aWMzUnZjbVZKWkNJNklqSXlPVGNpTENKbGVIQWlPakUyTVRFek9UZ3hNREFzSW1semN5STZJa2xFUlVFaWZRLkg1QUltemY5WVV1R2RaUlE2Q1FNRjFoX0VEWlJUVGpQd3JLeC1kS1RtRk0=; xid=d2a67227-cff4-11ea-8478-000d3af28561; _ga=GA1.2.871234513.1595846133; _d_id=c1d68b7b-11c5-4da9-a619-791464a1a2cd; mynt-eupv=1; _gcl_au=1.1.1660459033.1595846227; tvc_VID=1; mynt-ulc-api=pincode%3A751030; utm_track_1=a%3A7%3A%7Bs%3A10%3A%22utm_source%22%3Bs%3A6%3A%22direct%22%3Bs%3A10%3A%22utm_medium%22%3Bs%3A6%3A%22direct%22%3Bs%3A12%3A%22utm_campaign%22%3BN%3Bs%3A11%3A%22campaign_id%22%3BN%3Bs%3A12%3A%22octane_email%22%3BN%3Bs%3A10%3A%22trackstart%22%3Bi%3A1598595015%3Bs%3A8%3A%22trackend%22%3Bi%3A1599199815%3B%7D; AKA_A2=A; bm_sz=A6DF1D89C2C1F8D629C91C79CB3A04F3~YAAQjI0sMSrYc+ZzAQAAxf1iOQgmIRKj/g9fqBgwIjR+fIgzCip8C8E+1RFR6XVjtMmUVcUd4ygahQ1LCAliya4ErbybGJr58bNJw6QwU4USmoKLj82Ohxe3fIcVfysCjvS8v39946wOVlCswDGsz8AZLMG+nV2HgMK5SH43KRBqHZrkjVWyRz3i8fDZ+yPN; AMP_TOKEN=%24NOT_FOUND; _gid=GA1.2.1775057428.1598690625; ismd=1; _mxab_=config.bucket%3Dregular%3Bweb.xceleratorTags%3Denabled%3Bproductclusters%3Dcontrol; _pv=regular; dp=m; microsessid=786; lt_timeout=1; lt_session=1; utrid=uuid-15958461001412; ak_bmsc=29FDF21056A8DBCF8F980F1E9CE15988312C8D8C473B00003E154A5F838C7E6B~plOp/qFAM5crYADX1iek1ZJCtdWq3h8f4SsElP2mgMHCjSSHRxlK1Z2HrRTkEJrqkiGJ4oF4B8d4WsaXrIi4v3DrjMzcgbMz5eWtrqVYF81uuL1bQ9X1lnRadHjhvef4UktYwKV1o7y1EgVN6rOhRAqCfFrh+/ZFgiPDc9UNdcjOG9byMPJXKBLSlPP0GzK+pEaTgmJk47fnGGOqiXOGLAVLTl7dm9WioqyYALHwv8BCV1U2JoqXv/kkcu81jGmJHYUmEMjmoI5YKHegWZDWHd+g==; _ma_sid=cdac70d5-3bd5-43a7-907b-3f5e378853b2-c1d68b7b-11c5-4da9-a619-791464a1a2cd; _gat=1; _xsrf=WgNGflisdnUp08tmoHFw621YIBIRfXn8; mynt-loc-src=expiry%3A1598694297561%7Csource%3AIP; user_session=PsCbAVf-NAO8euOyLAuG-Q.ZTlmhWVO--Seh74-g6U1lW2ULZ449erG2FGbGN_rcgPtO1kMSndsUCl0MoSY2aAP7S_fqgRHSb5Wm0PZp2Y6n5cRuZ9IUw2iRMzSgRhLsDOBvUsN6e7Bxmc_yG3LwyMrxjJHwlhiqaWNcHakuzlPyA.1598692856879.86400000.wZYkA8hmsps7c0keU9pvoZXKyItpNXPIdIRaJSbgqDE; G_ENABLED_IDPS=google; akaas_myntra_SegmentationLabel=1601284875~rv=78~id=aec7bb9950da7f590fd52ce74562379b~rn=PWA; bm_sv=D22A94A8E1A727DC06711F0805F344AA~8yuC7wWU9KKeeeztgEYyRTm4+okPsuWNX07EBbmt43UqhvoFx2JRWaeAlRU+K/Hf/rkwQiRRI8cmAVROnzQESOZ8LEramZElYUEHAp1b1662u1Chpi8y7JDATnJGaAnQYSJBAhHxPEek5QlepxqZmamwe95F1ttKnqgtPgew6EY=; ak_RT="z=1&dm=myntra.com&si=a2470101-0610-446a-8d58-cbc293cbdcd0&ss=keff4809&sl=3&tt=fq4&bcn=%2F%2F684d0d3c.akstat.io%2F"',
        pragma: 'no-cache',
        referer:
          'https://www.myntra.com/sweatshirts/hrx-by-hrithik-roshan/hrx-by-hrithik-roshan-men-teal-blue-solid-sweatshirt/1946689/buy',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent':
          'Mozilla/5.0 (Linux; Android 6.0.1; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Mobile Safari/537.36',
        'x-location-context': 'pincode=751030;source=IP',
        'x-meta-app': 'channel=web',
        'x-myntra-network': 'yes',
        'x-myntraweb': 'Yes',
        'x-requested-with': 'browser',
      },
    })
    // console.log('zzzzzzzzzzzzzzzzzzzzzzzzzzz', response)
    // const details = {
    //   id: m.id,
    //   created: currentDate,
    //   date: `${currentDate.getDate()}/${
    //     currentDate.getMonth() + 1
    //   }/${currentDate.getFullYear()}`,
    //   time: `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`,
    //   name: m.name,
    //   mrp: m.mrp || m.price,
    //   price: m.price,
    //   img: m.img,
    //   images: m.images,
    //   brand: m.brand && m.brand.name,
    //   color: m.baseColour,
    //   ratings: m.ratings.averageRating,
    //   // slug: `https://myntra.com/${id}`,
    //   url,
    // }
    // const images = m.media.albums[0].images.map((i: any) => i.imageURL)
    // const style = m.sizes.find((i: any) => {
    //   if (i.styleId == id) {
    //     return i.sizeSellerData[0].discountedPrice
    //   }
    // })
    // details.price = style.sizeSellerData[0].discountedPrice
    // details.images = images
    // details.img = images[0]

    // const $ = await cheerio.load(response.data)
    // const id = $('.supplier-styleId').text()
    // const brand = $('.pdp-price-info .pdp-title').text()
    // const name = $('.pdp-price-info .pdp-name').text()
    // const description = $("meta[name='description']").attr('content')
    // const keywords = $("meta[name='keywords']").attr('content')
    // const ratings = 0
    // const availability = 'In Stock'
    // const price = $('.pdp-price-info .pdp-price').text()
    // const mrp = $('.pdp-price-info .pdp-mrp').text() || price
    // const images: any = []
    // $('.image-grid-container .image-grid-col50').each(function (
    //   i: number,
    //   elem: any
    // ) {
    //   console.log('zzzzzzzzzzzzzzzzzzzzzzzzzzz', elem)
    //   images[i] = elem.attribs['style']
    //     .replace('background-image:url("', '')
    //     .replace('")', '')
    // })
    // let details = {
    //   id,
    //   created: currentDate,
    //   date: `${currentDate.getDate()}/${
    //     currentDate.getMonth() + 1
    //   }/${currentDate.getFullYear()}`,
    //   time: `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`,
    //   url,
    // name,
    // brand,
    // description,
    // keywords,
    // ratings,
    // availability,
    // price: +price.replace('₹', '').replace(',', ''),
    // mrp: +mrp.replace('₹', '').replace(',', ''),
    // images,
    // img: images[0],
    // }
    // return details
  } catch (err) {
    console.log(err.toString())
  }
}
export const getOneProductFromAmazon = async (u: string, userAgent: string) => {
  let url = u
  const currentDate = new Date()
  // const { host, port }: any = await proxyGenerator()
  // const axiosOptions = {
  //   url,
  //   method: 'get',
  //   headers: {
  //     'user-agent':
  //       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36',
  //   },
  //   // proxy: {
  //   //   host,
  //   //   port,
  //   // auth: {
  //   //   username: 'mikeymike',
  //   //   password: 'rapunz3l',
  //   // },
  //   // },
  // }
  // const response = await axios.request(axiosOptions)
  console.log(colors.bgYellow('Amazon URL::: '), url)
  // const url = `https://www.amazon.in/gp/product/${id}`
  // const response = await axios.get(url)
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
    await page.setViewport({ width: 1280, height: 800 })
    const r = await page.goto(url, { timeout: 15000 })
    const content = await page.content()
    const $ = cheerio.load(content)
    // var scraperapiClient = require('scraperapi-sdk')(process.env.SCRAPER_API)
    // var response = await scraperapiClient.get(url)
    // const $ = await cheerio.load(response)
    const id = $('input#ASIN').attr('value')
    console.log('Grabbing from amazon... ', id)
    if (!id) throw `Product not found at Amazon: ${url}`
    const name = $('#productTitle').text().trim()
    const ratings = 0 //$('.reviewCountTextLinkedHistogram').attr('title')
    const availability = $('#availability').text()
    const description = $('#productDescription p').text().trim()
    const features = $('#productDetails_techSpec_section_1').html()
    const seller_price = $('#olp-upd-new .a-color-price')
      .text()
      .trim()
      .replace('₹ ', '')
      .replace(',', '')
      .replace('.00', '')
      .match(/\d+/g)
    const deal =
      $('#priceblock_dealprice')
        .text()
        .trim()
        .replace('₹ ', '')
        .replace(',', '')
        .replace('.00', '')
        .match(/\d+/g) || seller_price
    const sale =
      $('#priceblock_saleprice')
        .text()
        .trim()
        .replace('₹ ', '')
        .replace(',', '')
        .replace('.00', '')
        .match(/\d+/g) || deal
    let price =
      $('#priceblock_ourprice')
        .text()
        .trim()
        .replace('₹ ', '')
        .replace(',', '')
        .replace('.00', '')
        .match(/\d+/g) ||
      sale ||
      ''
    let mrp =
      $('#price .a-text-strike')
        .text()
        .trim()
        .replace('₹ ', '')
        .replace(',', '')
        .replace('.00', '')
        .match(/\d+/g) ||
      price ||
      ''

    let keyFeatures: any = [],
      brandImages: any = []
    // $('#aplus .aplus-v2 img').each(function (i: number, el: any) {
    //   const img = el.attribs['src']
    //   brandImages.push(img)
    // })
    $('#feature-bullets ul li').each(function (i: number, el: any) {
      const f = $(el).find('.a-list-item').text().trim()
      keyFeatures.push(f)
    })
    const images: any = []
    $('#altImages ul>li span span span span img').each(function (
      i: number,
      elem: any
    ) {
      let img = elem.attribs['src']

      if (
        img &&
        !img.includes('/images/G/31/HomeCustomProduct/360_icon_73x73v2')
      ) {
        const ins = img.substring(
          img.lastIndexOf('._') + 1,
          img.lastIndexOf('_.jpg')
        )
        // console.log('zzzzzzzzzzzzzzzzzzzzzzzzzzz', img, ins)
        img = img.replace(ins, '_SR450')
        images.push(img)
      }
    })
    // Amazon price range
    if (price.includes(' - ')) {
      const sp = price.split(' - ')
      price = sp[0]
      mrp = sp[1]
    }
    price = parseInt(price || mrp || 0)
    // let features: any = []
    // $('#prodDetails tr ').each(async (i: number, el: any) => {
    //   let display_size, resolution, weight, color, battery, model, ram,
    //   let k = await $(el).find('th').text().trim()
    //   let v = await $(el).find('td').text().trim()
    //   if (k == 'Resolution') {
    //     const display_size = v && v.trim().includes('1080') ? 'FHD+' : 'HD+'
    //     const resolution = v.trim()
    //   } else if (k == 'Item Weight') {
    //     const weight = v.replace(' g', '')
    //   } else if (k == 'Colour') {
    //     const color = v
    //   } else if (k == 'Battery Power Rating') {
    //     const battery = v
    //   } else if (k == 'Item model number') {
    //     const model = v
    //   } else if (k == 'RAM') {
    //     const ram = v
    //   } else if (k == 'Display technology') {
    //     const display = v
    //   } else if (k == 'Date First Available') {
    //     const launchDate = v
    //   }
    // })
    const amazon_affiliate_url = `https://www.amazon.in/gp/product/${id}/ref=as_li_qf_asin_il_tl?ie=UTF8&tag=swadesh0d-21&creative=24630&linkCode=as2&creativeASIN=${id}`
    let details = {
      id,
      created: currentDate,
      date: `${currentDate.getDate()}/${
        currentDate.getMonth() + 1
      }/${currentDate.getFullYear()}`,
      time: `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`,
      url,
      amazon_affiliate_url,
      name,
      description,
      features,
      keyFeatures,
      brandImages,
      ratings,
      availability,
      price,
      mrp: parseInt(mrp || price || 0),
      images,
      img: images[0],
    }
    console.log(colors.dim('Sleeping after amazon scrap::: '), id)
    // await sleep(Math.random() * DELAY_IN_MS)
    return details
  } catch (err) {
    console.log('Err grabbing Amazon::: ', err.toString())
    await sleep(Math.random() * 60000)
    return
  } finally {
    await browser.close()
  }
}
const getOneProductFromNyka = async (url: string, userAgent: string) => {
  try {
    console.log(colors.yellow('Grabbing from nykaa... '), url)
    let id = url.split('/')[5]
    const ix = id.indexOf('?')
    id = ix > 0 ? id.substring(0, ix) : id
    const currentDate = new Date()
    const response = await axios.get(url)
    const $ = await cheerio.load(response.data)
    const name = $("h1[itemprop='name']").text()
    let ratings = $("meta[itemprop='ratingValue']").attr('content')
    const price = $("meta[itemprop='price']").attr('content')
    let mrp = $(
      ".price-info .post-card__content-price-price span[class='mrp-price']"
    ).text()
    mrp = mrp ? mrp.split('₹')[1] : price
    if (!ratings) ratings = 0
    const availability = 'Available'
    const images: any = []
    $('.slick-slide div img').each(function (i: number, elem: any) {
      let img = elem.attribs['src']
      if (img)
        images.push(
          img.replace('?q=70', '').replace('tr:w-50,h-50', 'tr:w-500,h-500')
        )
    })
    const details = {
      id,
      created: currentDate,
      date: `${currentDate.getDate()}/${
        currentDate.getMonth() + 1
      }/${currentDate.getFullYear()}`,
      time: `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`,
      url,
      name,
      ratings: +ratings,
      availability,
      price: +price.replace('₹', '').replace(',', ''),
      mrp: +mrp.replace('₹', '').replace(',', ''),
      images: images,
      img: images[0],
    }
    return details
  } catch (err) {
    console.log(err.toString())
  }
}
const getOneProductFromAjio = async (url: string, userAgent: string) => {
  try {
    // const url =
    //   'https://www.ajio.com/network-pack-of-5-assorted-socks/p/440675810_assorted'
    const browser = await puppeteer.launch({
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
      ],
    })
    let images
    try {
      const page = await browser.newPage()
      await page.setExtraHTTPHeaders({
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36',
      })
      await page.setViewport({
        width: 360,
        height: 640,
      })
      await page.goto(url)
      images = await page.evaluate(() => {
        // const id = document.querySelector('.supplier-styleId').textContent
        // const brand = document.querySelector('.brand-name').textContent
        // const name = document.querySelector('.pdp-name').textContent
        const images = Array.from(
          document.querySelectorAll('.slick-track .slick-slide img'),
          (e) => e.getAttribute('src')
        )
        return images
      })
    } catch (e) {
    } finally {
      await browser.close()
    }
    const currentDate = new Date()
    const response = await axios.get(url)
    const $ = await cheerio.load(response.data)
    const ratings = 0
    const keywords = $("meta[name='keywords']").attr('content')
    const description = $("meta[name='description']").attr('content')
    let id, name, brand, price, mrp
    var obj = $("script[type='application/ld+json']")
    for (var i in obj) {
      for (var j in obj[i].children) {
        var data = obj[i].children[j].data
        if (data) {
          try {
            data = JSON.parse(data)
            if (data['@type'] == 'Product') {
              id = data.mpn
              name = data.name
              brand = data.brand.name
              price = data.offers.lowPrice
              mrp = data.offers.highPrice
            }
          } catch (e) {}
        }
      }
    }
    const details = {
      id,
      created: currentDate,
      date: `${currentDate.getDate()}/${
        currentDate.getMonth() + 1
      }/${currentDate.getFullYear()}`,
      time: `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`,
      url,
      name,
      keywords,
      description,
      ratings: +ratings,
      availability: 'Available',
      price: +price.replace('₹', '').replace(',', ''),
      mrp: +mrp.replace('₹', '').replace(',', ''),
      images,
      img: images.pop(),
    }
    console.log(colors.dim('Sleeping after ajio scrap::: '), details.id)
    await sleep(Math.random() * DELAY_IN_MS)
    return details
  } catch (err) {
    console.log(err.toString())
  }
}
const getOneProductFromZivame = async (url: string, userAgent: string) => {
  try {
    const currentDate = new Date()
    const response = await axios.get(url)
    const $ = await cheerio.load(response.data)
    const keywords = $("meta[name='keywords']").attr('content')
    const description = $("meta[name='description']").attr('content')
    let id, name, brand, price, mrp, ratings, img
    var obj = $("script[type='application/ld+json']")
    for (var i in obj) {
      for (var j in obj[i].children) {
        var data = obj[i].children[j].data
        if (data) {
          try {
            data = JSON.parse(data)
            if (data['@type'] == 'Product') {
              id = data.sku
              name = data.name
              brand = data.brand.name
              price = data.offers.price
              mrp = data.offers.price
              ratings = data.aggregateRating.ratingValue
              img = data.image
            }
          } catch (e) {}
        }
      }
    }
    console.log('Grabbing from zivame... ', id)
    const images: any = []
    const details = {
      id,
      created: currentDate,
      date: `${currentDate.getDate()}/${
        currentDate.getMonth() + 1
      }/${currentDate.getFullYear()}`,
      time: `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`,
      url,
      brand,
      name,
      keywords,
      description,
      ratings: +(ratings || 0),
      availability: 'Available',
      price: +price.replace('₹', '').replace(',', ''),
      mrp: +mrp.replace('₹', '').replace(',', ''),
      images,
      img,
    }
    return details
  } catch (err) {
    console.log(err.toString())
  }
}
const getOneProductFromPurplle = async (url: string, userAgent: string) => {
  try {
    // console.log('Request URL:....................... ', url)
    const urlArr = url.split('?')[0]
    let url1 = urlArr.replace(
      'https://www.purplle.com/product/',
      // 'https://www.purplle.com/api/shop/itemdetails?item_type=product&item_type_id='
      'https://www.purplle.com/neo/catalog/basicinfo?mode_device=mobile&user_fragment=null&video_enable=1&product_id='
    )
    // console.log('zzzzzzzzzzzzzzzzzzzzzzzzzzz', url1)
    const currentDate = new Date()
    const response = await axios.get(url1, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36',
        cookie:
          ' __cfduid=dfec0f907dac4f50028701779b6870f8a1601441654; mode_device=desktop; visitorppl=5OmWYIG1qXvLx0utnF130211081599411464; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXZpY2VfaWQiOiJ2S1huYTNPR2lYbTIwRm1mZTEzMDIxMTA4MTU5OTQxMTQ2NCIsIm1vZGVfZGV2aWNlIjoiZGVza3RvcCIsIm1vZGVfZGV2aWNlX3R5cGUiOiJ3ZWIiLCJpYXQiOjE1OTk0MTE0NjQsImV4cCI6MTYwNzE4NzQ2NCwiYXVkIjoid2ViIiwiaXNzIjoidG9rZW5taWNyb3NlcnZpY2UifQ.t1jgIxrbr71yKSodTLtDxsy48U-rBB4klwpDHp6DN-w; session_initiated=Direct; client_ip=2409%3A4062%3A2395%3A2aa2%3A71ac%3Ab26a%3A4735%3Ac4b1; environment=prod; __cfruid=125d0f69ac6858e7a5e1c485dfc9e42ecf8b5f3d-1598687543; sessionCreatedTime=1598687545; g_state={}; beautyProfilePopup=1; isSessionDetails=true; _ga=GA1.2.79526620.1598687556; _gid=GA1.2.1514518808.1598687556; _gcl_marco=1.1244736391.1598687572; session_id=ad24a3209f058fa5d38455c188bb545b; sessionExpiryTime=1598689761; _gat_UA-28132362-1=1; _tmpsess=zdstGo1LNQUWrVxQ9V_1598687988',
        // cookie:
        //   '__cfduid=df19869a49a7793b408c659ff137645921598269741; mode_device=desktop; visitorppl=4NqAnc5YhaoNP1noN3; client_ip=125.16.88.162; environment=prod; beautyProfilePopup=1; isSessionDetails=true; _ga=GA1.2.1897542155.1598269746; _gcl_marco=1.1833434983.1598269754; _lutms24=Blogger; _gid=GA1.2.974763043.1598642312; sessionCreatedTime=1598715254; _tmpsess=4NqAnc5YhaoNP1noN3_1598715254; session_initiated=Direct; session_id=9397cc851814b57621bbc3eb34d84fe2; _gat_UA-28132362-1=1; sessionExpiryTime=1598717068; g_state={"i_p":1598722470747,"i_l":1}; __cfruid=abbef13ff9119a7576894385119a44e522870d93-1598715279',
      },
    })
    const data = response.data
    const id = data.item.itemId
    const name = data.item.name
    const description = data.meta.detail_markup.description
    const metaDescription = data.meta.meta_description
    const brand = data.item.itembrand
    const mrp = data.item.availability.mrp
    const price = data.item.availability.offerPrice
    const keywords = data.meta.meta_keywords
    const title = data.meta.metatitle
    const ratings = data.item.avgRating
    const images = data.item.images.map((i: any) => i.primaryImage)

    const details = {
      id,
      created: currentDate,
      date: `${currentDate.getDate()}/${
        currentDate.getMonth() + 1
      }/${currentDate.getFullYear()}`,
      time: `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`,
      url,
      brand,
      name,
      keywords,
      metaDescription,
      description,
      ratings: +(ratings || 0),
      availability: 'Available',
      price: +price,
      mrp: +mrp,
      images,
      img: images[0],
    }
    // console.log('URL::: ', details.url)
    return details
  } catch (err) {
    console.log(err.toString())
  }
}
export const getOneProductFromFlipkart = async (
  url: string,
  userAgent: string
) => {
  try {
    let params = new URL(url).searchParams
    const id = params.get('pid')
    // const id = url.split('?')[1] && url.split('?')[1].replace('pid=', '')
    console.log('Grabbing from flipkart... ', id)
    const currentDate = new Date()
    const response = await axios.get(url)
    const $ = await cheerio.load(response.data)
    const productName = $('._35KyD6')
    const rating = $('.hGSR34')
    const availability = $('._9-sL7L')
    const price = $('._3qQ9m1')
    const mrp = $('._1POkHg')
    const im = $('._2VtE5i._3c2Xi9 img').attr('src')
    const images: any = []
    $('.LzhdeS li div div').each(function (i: number, elem: any) {
      const img = elem.attribs['style']
      if (img)
        images.push(
          img
            .replace('background-image:url(', '')
            .replace(')', '')
            .replace('?q=70', '')
            .replace('128/128', '300/450')
        )
    })
    if (images.length < 1 && im) {
      images.push(im.replace('?q=50', '').replace('180/180', '300/450'))
    }
    let availabilityStatus
    if (availability.text() == '') {
      availabilityStatus = 'InStock'
    } else {
      availabilityStatus = availability.text()
    }
    const details = {
      id,
      created: currentDate,
      date: `${currentDate.getDate()}/${
        currentDate.getMonth() + 1
      }/${currentDate.getFullYear()}`,
      time: `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`,
      url,
      name: productName.text(),
      ratings: +rating.text().slice(0, 3),
      availability: availabilityStatus,
      price: +price.text().replace('₹', '').replace(',', ''),
      mrp: +mrp.text().replace('₹', '').replace(',', ''),
      images: images,
      img: images[0],
    }
    console.log(colors.dim('Sleeping after flipkart scrap::: '), details.id)
    // await sleep(Math.random() * DELAY_IN_MS)
    return details
  } catch (err) {
    console.log(err.toString())
  }
}
const proxyGenerator = async () => {
  let ip_addresses: any = []
  let port_numbers: any = []
  let host, port
  const response = await axios.get('https://sslproxies.org/')
  const $ = await cheerio.load(response.data)
  $('td:nth-child(1)').each(function (index: any, value: any) {
    // @ts-ignore
    ip_addresses[index] = $(this).text()
  })

  $('td:nth-child(2)').each(function (index: any, value: any) {
    // @ts-ignore
    port_numbers[index] = $(this).text()
  })

  let random_number = Math.floor(Math.random() * 100)
  host = 'http://' + ip_addresses[random_number]
  port = port_numbers[random_number]
  let proxy = `http://${host}:${port}`
  console.log(proxy)
  return { host, port }
}
export { router as flipkart }
