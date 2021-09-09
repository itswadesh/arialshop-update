const { ObjectId } = require('mongodb')
import Axios from 'axios'
import { STATIC_PATH, WWW_URL } from '../config'
import Envato from '../models/envato'
import { Blog } from '../models'
import { generateSlug } from '../utils'
import { esQuery } from '../utils/envato'
import { Router } from 'express'
import { catchAsync } from '../middleware'
require('dotenv').config()
const { createSitemap } = require('sitemap')
const fsx = require('fs-extra')
const zlib = require('zlib')
const path = require('path')
const { ENVATO_KEY } = process.env

// const HOST = 'https://www.frontendfun.com/'
const router = Router()

router.get(
  '/api/envato',
  catchAsync(async (req, res) => {
    const e = await Envato.find().select(
      '_id name slug previews price_cents url'
    )
    res.send(e)
  })
)
router.get(
  '/api/envato/featured',
  catchAsync(async (req, res) => {
    const url = `https://api.envato.com/v1/market/features:codecanyon.json`
    const options = {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + ENVATO_KEY },
      url,
    }
    try {
      // @ts-ignore
      const pr: any = await Axios(options)
      res.status(200).json(pr.data)
    } catch (e) {
      res.status(422).json(e)
    }
  })
)
router.get(
  '/api/envato/es',
  catchAsync(async (req, res) => {
    try {
      const s: any = { pageSize: 40 }
      const q: any = await esQuery(req.query)
      // console.log('q::: ', JSON.stringify(q))
      // @ts-ignore
      Envato.esSearch(q, (err, data) => {
        if (err) {
          res.status(500).json(err)
          return
        }
        if (data)
          return res.send({
            took: data.took,
            count: data.hits.total.value,
            pageSize: s.pageSize,
            data: data.hits.hits,
            facets: data.aggregations,
          })
        else
          return res.send({ took: 0, count: 0, pageSize: s.pageSize, data: [] })
      })
    } catch (e) {
      res.status(500).send(e)
    }
  })
)
router.get(
  '/api/envato/grab',
  catchAsync(async (req, res) => {
    const featured = `https://api.envato.com/v1/market/features:codecanyon.json`
    const random = `https://api.envato.com/v1/market/random-new-files:codecanyon.json`
    const popular = `https://api.envato.com/v1/market/popular:codecanyon.json`
    const newItems = `https://api.envato.com/v1/market/new-files:codecanyon,javascript.json`
    let r: any = [],
      p: any = [],
      n: any = [],
      f: any = {}
    try {
      r = await getEnvato(random, 'random-new-files')
      p = await getEnvato(popular, 'popular')
      n = await getEnvato(newItems, 'new-files')
      f = await getEnvato(featured, 'features')
      res.status(200).json({
        random: r.length,
        popular: p.length,
        new: n.length,
        features: 1,
      })
    } catch (e) {
      res.status(422).json(e)
    }
  })
)
router.get(
  '/api/envato/:id',
  catchAsync(async (req, res) => {
    try {
      const url = `https://api.envato.com/v3/market/catalog/item?id=${req.params.id}`
      // @ts-ignore
      let item: any = await Axios({
        method: 'GET',
        headers: { Authorization: 'Bearer ' + ENVATO_KEY },
        url,
      })
      item = item.data
      res.status(200).json(item)
    } catch (e) {
      throw e
    }
  })
)

const getEnvato = async (url: string, type: string) => {
  const options = {
    method: 'GET',
    headers: { Authorization: 'Bearer ' + ENVATO_KEY },
    url,
  }
  try {
    // @ts-ignore
    const pr: any = await Axios(options)
    let p = [],
      arr = pr.data[type]
    if (type == 'popular' && arr) {
      arr = arr['items_last_week']
    } else if (type == 'features' && arr) {
      arr = [arr['free_file']]
    }
    for (let i of arr) {
      try {
        const url = `https://api.envato.com/v3/market/catalog/item?id=${i.id}`
        // @ts-ignore
        let item: any = await Axios({
          method: 'GET',
          headers: { Authorization: 'Bearer ' + ENVATO_KEY },
          url,
        })
        item = item.data
        item.type = type
        item.slug = await generateSlug(item.name)
        p.push(item)
      } catch (e) {
        throw e
      }
    }
    await Envato.insertMany(p, { ordered: false })
    return p
  } catch (e) {
    return e // Don't throw err, else res.send will be fired and script will be stopped
  }
}

// const getOne = async (req: Request, res: Response) => {
//   const url = `https://affiliate-api.flipkart.net/affiliate/1.0/product.json?id=${req.params.id}`
//   const options = {
//     method: 'GET',
//     headers: { Authorization: 'Bearer ' + ENVATO_KEY },
//     url,
//   }
//   // @ts-ignore
//   const pr: any = await Axios(options)
//   const p = pr.data

//   const Envato: any = {
//     id: p.id,
//     item: p.item,
//     url: p.url,
//     user: p.user,
//     thumbnail: p.thumbnail,
//     sales: p.sales,
//     rating: p.rating,
//     rating_decimal: p.rating_decimal,
//     cost: p.cost,
//   }
//   const prod: any = await Envato.findOne({ id: p.id })
//   if (prod) {
//     return res.status(200).json(prod)
//   } else {
//     if (!Envato.slug && Envato.name) {
//       try {
//         Envato.slug = await generateSlug(Envato.name) // Generate unique slug by adding -en at end if exists
//       } catch (e) {
//         res.status(422).json(e)
//       }
//     }
//     const prod: any = await Envato.create(Envato)
//     // p.esIndex();
//     return res.status(200).json(prod)
//   }
// }

router.get(
  '/api/envato/sync',
  catchAsync(async (req, res) => {
    try {
      let count = 0
      Envato.on('es-bulk-sent', function (doc) {
        count += doc
        console.log('Indexed: ', count)
      })

      Envato.on('es-bulk-data', function (doc) {})

      Envato.on('es-bulk-error', function (err) {
        console.error(err)
        return res.status(500).send(err)
      })
      // @ts-ignore
      await Envato.esSynchronize().then(function (doc) {
        console.log('end.', doc)
        return res.send('indexed ' + doc._shards.successful + ' documents!')
      })
    } catch (e) {
      return res.status(500).json(e)
    }
  })
)

router.patch(
  '/api/envato/:id',
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
    let product: any = await Envato.findById(req.params.id)
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
  })
)

router.delete(
  '/api/envato/:id',
  catchAsync(async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
      res.status(404).send('Item not found')
      return
    }
    try {
      await Envato.remove({ _id: req.params.id }).exec()
      // apicache.clear('products')
      res.status(202).json({ msg: 'Item deleted' })
    } catch (err) {
      res.status(500).send(err)
    }
  })
)

router.get(
  '/api/envato/search',
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
      await Envato.insertMany(p)
    } catch (e) {
      res.status(422).send(e.toString())
    }
  })
)

router.get(
  '/api/envato/generate-sitemap',
  catchAsync(async (req, res) => {
    try {
      let urls: any = []
      const stream = Blog.find({}).select('slug').cursor()
      stream
        .on('data', async (p) => {
          if (p.slug)
            urls.push({
              url: `/blog/${p.slug}`,
              changefreq: 'daily',
              priority: 0.5,
            })
        })
        .on('close', () => {
          const stream = Envato.find({}).select('slug').cursor()
          stream
            .on('data', async (p) => {
              if (p.slug)
                urls.push({
                  url: `${p.slug}?id=${p._id}`,
                  changefreq: 'daily',
                  priority: 0.5,
                })
            })
            .on('close', () => {
              const sitemap = createSitemap({
                hostname: WWW_URL,
                cacheTime: 600000, // 600 sec - cache purge period
                urls,
              })
              fsx.writeFileSync(
                path.resolve(STATIC_PATH + '/sitemap-ff.xml'),
                sitemap.toString()
              )
              res.send('Sitemap generated ' + urls.length + ' records...')
            })
        })
    } catch (e) {
      res.status(500).end()
    }
  })
)

router.get(
  '/api/envato/sitemap',
  catchAsync(async (req, res) => {
    try {
      res.header('Content-Type', 'application/xml')
      res.send(
        fsx.readFileSync(path.resolve(STATIC_PATH + '/sitemap-ff.xml'), 'utf8')
      )
    } catch (e) {
      res.end()
    }
  })
)

// const getGz = async (req, res) => {
//   try {
//     res.header('Content-Type: application/x-gzip')
//     res.header('Content-Encoding: gzip')
//     res.header('Content-Disposition: attachment; filename="sitemap.xml.gz"')
//     zlib.gzip(
//       new Buffer(
//         fsx.readFileSync(path.resolve(STATIC_PATH + '/sitemap.xml'), 'utf8'),
//         'utf8'
//       ),
//       function (error, data) {
//         res.send(data)
//       }
//     )
//   } catch (e) {
//     res.end()
//   }
// }
