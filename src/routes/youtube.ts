import { Post, Author, Category } from '../models'
import { Router } from 'express'
import { catchAsync } from '../middleware'
import { sendMail, sleep, sysdate } from '../utils'
import { createProductFromUrl, geturl } from './flipkart'
import { MAIL_FROM } from '../config'
import { youtubeResult } from '../models/youtubeResult'
require('dotenv').config()
const axios = require('axios')
const sgMail = require('@sendgrid/mail')
import colors from 'colors/safe'
import { categories } from './categories'
const YOUTUBE_MAX_RESULTS = 10
const DELAY_IN_MS = 10000 // 10 sec
const EMAIL_BATCH_SIZE = 20
const searchQueries = [
  'flipkart haul',
  'myntra haul',
  'nykaa',
  'ajio haul',
  // 'amazon haul',
  'zivame',
  'purplle',
]
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const router = Router()
// Error =  "Possible EventEmitter memory leak detected. 11 SIGINT listeners added" solutions
process.setMaxListeners(Infinity)
router.post(
  '/api/email/contactus',
  catchAsync(async (req, res) => {
    const { from, subject, text } = req.body
    try {
      const msg = { to: MAIL_FROM, from, subject, text }
      await sgMail.send(msg)
      res.status(200).json({ message: 'Contact email sent successfully' })
    } catch (err) {
      res.status(500).send(err.toString())
    }
  })
)
router.get(
  '/api/email',
  catchAsync(async (req, res) => {
    try {
      let slug: any = req.query.url
      await emailYoutubeAuthor(slug)
      return res.send('success')
    } catch (e) {
      console.log('Send Email Err::: ', e)
      return res.status(420).send(e)
    }
  })
)
router.get(
  '/api/email/daily',
  catchAsync(async (req, res) => {
    try {
      const authors = await Author.find({
        active: true,
        emailed: false,
        email: /^[\s\S]{10,}$/, // name.length >= 40
        // 'products.0': { $exists: true },
      }).limit(EMAIL_BATCH_SIZE)
      let success = [],
        error = []
      for (let a of authors) {
        // if (!a) throw 'No pending authors'
        const p = await Post.findOne({
          active: true,
          author: a._id,
          'products.0': { $exists: true },
        })
        const post: any = p
        if (!post) continue
        try {
          await emailYoutubeAuthor(post.slug)
          success.push(post.slug)
        } catch (e) {
          error.push(`${e} - ${post.slug}`)
          console.log('Send Email Err::: ', e, post.slug)
        }
        await sleep(Math.random() * DELAY_IN_MS)
      }
      return res.json({ success, error })
    } catch (e) {
      return res.status(420).send(e)
    }
  })
)
const emailYoutubeAuthor = async (slug: string) => {
  if (!slug) throw 'url not specified'
  const post: any = await Post.findOne({ slug }).populate('author')
  if (!post) throw 'Post not found'
  if (post.author.emailed) throw 'Already emailed'
  if (post.products.length < 1) throw 'No product found'
  if (
    !post.author.email ||
    post.author.email == null ||
    post.author.email == 'null' ||
    post.author.email == ''
  )
    throw 'No email id'

  const authorName = post.author.firstName
  const authorSlug = post.author.slug
  const name = post.title
  const to = post.author.email //'2lessons@gmail.com'
  const greetings = (authorName ? 'Hello ' + authorName : 'Hi') + ','
  sendMail({
    to,
    subject: 'Regarding Collaboration',
    template: 'user/promo',
    context: {
      greetings,
      postUrl: `https://shopnx.in/${authorSlug}/${slug}`,
      authorUrl: `https://shopnx.in/${authorSlug}`,
      videoUrl: post.video,
      name,
    },
  })
  return await Author.updateOne(
    { _id: post.author._id },
    { $set: { emailed: true } }
  )
}
router.get(
  '/api/youtube/profile',
  catchAsync(async (req, res) => {
    let { url, category = 'fashion' }: any = req.query
    if (!url) return res.status(404).send('url not specified')
    const id = url.split('/').pop()
    // console.log('..................', id)
    const author: any = await getProfileFromYoutube(id, category)
    return res.status(201).json(author)
  })
)

const getYoutubeVideoData = async (youtubeVideoId: any) => {
  // console.log('This method not required any more')
  // const { host, port }: any = await proxyGenerator()
  const axiosOptions = {
    url: 'https://www.googleapis.com/youtube/v3/videos',
    method: 'get',
    params: {
      id: youtubeVideoId,
      key: process.env.YOUTUBE_API_KEY,
      part: 'snippet,contentDetails,statistics,status',
    },
    // proxy: {
    //   host,
    //   port,
    // auth: {
    //   username: 'mikeymike',
    //   password: 'rapunz3l',
    // },
    // },
  }
  try {
    // const response = await request
    //   .get('https://www.googleapis.com/youtube/v3/videos')
    //   .query({ id: youtubeVideoId })
    //   .query({
    //     key: process.env.YOUTUBE_API_KEY,
    //   }) //used only when saving youtube videos
    //   .query({ part: 'snippet,contentDetails,statistics,status' })

    const response = await axios.request(axiosOptions)
    const data = response.data
    let title = data.items[0].snippet.title
    const tags = data.items[0].snippet.tags
    const description = data.items[0].snippet.description
    const publishedAt = data.items[0].snippet.publishedAt
    const publishedOn = publishedAt.substring(0, publishedAt.indexOf('T'))
    const videoDuration = formatDuration(data.items[0].contentDetails.duration)
    if (title.endsWith('- YouTube')) {
      title = title.replace('- YouTube', ' - ' + videoDuration)
    } else {
      title = title + ' - ' + videoDuration
    }
    let webpageData: any = {
      title,
      description,
      publishedAt,
      publishedOn,
      videoDuration,
    }

    if (tags) {
      webpageData.tags = tags
        .slice(0, 8)
        .map((tag: any) => tag.trim().replace(/\s+/g, '-'))
    }

    return webpageData
  } catch (e) {
    console.log('ERR:: ', e)
    return e
  }
}
function formatDuration(duration: string) {
  duration = duration.substring(2) // get rid of 'PT'
  if (duration.indexOf('M') >= 0 && duration.indexOf('H') == -1) {
    return duration.substring(0, duration.indexOf('M')) + 'min'
  }

  if (duration.indexOf('M') >= 0 && duration.indexOf('H') >= 0) {
    const hours = duration.substring(0, duration.indexOf('H')) + 'h'
    const minutes =
      duration.substring(duration.indexOf('H') + 1, duration.indexOf('M')) +
      'min'
    return hours + ':' + minutes
  }

  return null
}

router.get(
  '/api/youtube/emailtest',
  catchAsync(async (req, res) => {
    const email = '2lessons@gmail.com'
    console.log('Email::: ', email)
  })
)

router.get(
  '/api/youtube/query',
  catchAsync(async (req, res) => {
    const { page, q, d = 1, limit, category = 'fashion' } = req.query
    if (!q) return res.send('query not specified.')
    let publishedAfter = new Date()
    publishedAfter.setDate(publishedAfter.getDate() - +d)
    const response = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          q, // boating|sailing -fishing
          type: 'video',
          publishedAfter,
          // order: 'viewCount', // date
          maxResults: +limit || YOUTUBE_MAX_RESULTS,
          regionCode: 'IN',
          part: 'snippet',
          pageToken: page,
          key: process.env.YOUTUBE_API_KEY,
        },
      }
    )
    response.data.query = q
    response.data.limit = +limit || YOUTUBE_MAX_RESULTS
    response.data.publishedAfter = publishedAfter
    response.data.category = category
    await youtubeResult.create(response.data)
    console.log(
      sysdate() + colors.blue(` [START] [YOUTUBE] [QUERY] ${q} .............`)
    )
    const items = response.data.items
    for (let ix in items) {
      const i = items[ix]
      if (!i) return
      const url = `https://www.youtube.com/watch?v=${i.id.videoId}`

      console.log(
        sysdate() + colors.red(` [START] [VIDEO] ${url} ...${ix}.............`)
      )
      await grabOneYoutube(url, category.toString()) // Random delay applied here
      console.log(
        sysdate() + colors.red(` [END] [VIDEO] ${url} ...${ix}.............`)
      )
    }
    console.log(
      sysdate() + colors.zebra(` [END] [YOUTUBE] [QUERY] ${q}.............`)
    )
    res.json(response.data)
  })
)
router.get(
  '/api/youtube/daily',
  catchAsync(async (req, res) => {
    let processed = []
    for (let searchIndex in searchQueries) {
      const q = searchQueries[searchIndex]
      try {
        // let a = new Date().toISOString().split('T')
        // a[1] = '00:00:00Z'
        // const today = a.join('T')
        let d = new Date()
        d.setDate(d.getDate() - 1)
        const response = await axios.get(
          'https://www.googleapis.com/youtube/v3/search',
          {
            params: {
              q, // boating|sailing -fishing
              type: 'video',
              publishedAfter: d,
              // order: 'viewCount', // date
              maxResults: YOUTUBE_MAX_RESULTS,
              regionCode: 'IN',
              // part: 'snippet',
              key: process.env.YOUTUBE_API_KEY,
            },
          }
        )
        await youtubeResult.create(response.data)
        console.log(
          sysdate() +
            colors.blue(
              ` [START] [YOUTUBE] [QUERY] ${q} ...${searchIndex}.............`
            )
        )
        const items = response.data.items
        for (let ix in items) {
          const i = items[ix]
          if (!i) return
          const url = `https://www.youtube.com/watch?v=${i.id.videoId}`

          console.log(
            sysdate() +
              colors.red(` [START] [VIDEO] ${url} ...${ix}.............`)
          )
          const post = await grabOneYoutube(url, '') // Random delay applied here
          console.log(
            sysdate() +
              colors.red(` [END] [VIDEO] ${url} ...${ix}.............`)
          )
        }
        // try {
        //   await emailYoutubeAuthor(post.url)
        // } catch (e) {}
        // })()
        console.log(
          sysdate() +
            colors.zebra(
              ` [END] [YOUTUBE] [QUERY] ${q} ...${searchIndex}.............`
            )
        )
        processed.push(response.data)
      } catch (e) {
        console.log('SearchQueries ERR::: ', e.toString())
        return res.status(429).send('Rate limited')
      }
    }
    return res.json(processed)
  })
)
router.get(
  '/api/xxx',
  catchAsync(async (req, res) => {
    const authors: any = await Author.find()
    for (let a of authors) {
      let products = []
      const posts: any = await Post.find({ author: a._id })
      for (let p of posts) {
        products.push(...p.products)
      }
      a.products = products
      await a.save()
    }
    return res.status(200).json('success')
  })
)
router.post(
  '/api/youtube/grab',
  catchAsync(async (req, res) => {
    let { urls, category = '' }: any = req.body
    if (!urls) return res.status(404).send('urls not specified')
    let videos = []
    for (let url of urls) {
      if (!url) continue
      const post = await grabOneYoutube(url, category)
      videos.push(post)
    }
    console.log('Grab Youtube complete...')
    return res.status(201).json(videos)
  })
)

router.get(
  '/api/youtube/one',
  catchAsync(async (req, res) => {
    let { url, author, category = '' }: any = req.query
    if (!url) return res.status(404).send('url not specified')
    if (!author) return res.status(404).send('author not specified')
    const video: any = await getVideoDataFromYoutubeAPI(url, category)
    if (!video) return res.status(404).send('Invalid video url')
    let post: any = await Post.findOne({ id: video.id })
    if (!post) {
      post = await Post.create(video)
    } else {
      post = await Post.findOneAndUpdate({ id: video.id }, video)
    }
    await post.save()
    await Author.updateOne(
      { _id: video.author },
      { $addToSet: { posts: post._id } }
    )
    return res.status(201).json(video)
  })
)

router.post(
  '/api/youtube/urls',
  catchAsync(async (req, res) => {
    const { urls, postId, category }: any = req.body
    const post: any = await Post.findById(postId).populate('products')
    if (!post) return res.status(404).send('Post not found')
    // if (post.products.length >= urls.length)
    // if (post.products.length >= 1) return res.status(201).json(post.products) // To correct purplle api mistake
    let products: any = []
    for (const u in urls) {
      let products = []
      const url = urls[u]
      if (!url) return res.status(404).send('url not specified')
      console.log(sysdate() + ` [START] [Create Product] ... ${u}`, url)
      const prod = await createProductFromUrl({
        url,
        postId,
        category,
      })
      console.log(sysdate() + ` [END] [Create Product] ... ${u}`, url)

      products.push(prod)
      // await sleep(Math.random() * DELAY_IN_MS)
    }
    return res.status(201).json(products)
    // if (!video) return res.status(404).send('Invalid video url')
    // let post: any = await Post.findOne({ id: video.id })
    // if (!post) {
    //   post = await Post.create(video)
    // } else {
    //   post = await Post.findOneAndUpdate({ id: video.id }, video)
    // }
    // const urls: any = await getUrlsFromDescription(video.description)
    // post.urls = urls
    // await post.save()
    // await Author.updateOne(
    //   { _id: video.author },
    //   { $addToSet: { posts: post._id } }
    // )
  })
)

router.get(
  '/api/youtube/home',
  catchAsync(async (req, res) => {
    let { url, category = '' }: any = req.query
    if (!url) return res.status(404).send('url not specified')
    const video: any = await getVideoDataFromYoutubeAPI(url, category)
    if (!video) return res.status(404).send('Invalid video url')
    let post: any = await Post.findOne({ id: video.id })
    if (!post) {
      post = await Post.create(video)
    } else {
      post = await Post.findOneAndUpdate({ id: video.id }, video)
    }
    await Author.updateOne(
      { _id: video.author },
      { $addToSet: { posts: post._id } }
    )
    const urls: any = await getUrlsFromDescription(video.description)
    post.urls = urls
    await post.save()
    return res.status(201).json(post)
  })
)

const grabOneYoutube = async (url: string, category: string) => {
  // Author created here
  const video: any = await getVideoDataFromYoutubeAPI(url, category)
  if (!video) return { err: 'Invalid video url' }
  try {
    let post: any = await Post.findOne({ id: video.id })
    if (!post) {
      post = await Post.create(video)
    } else {
      post = await Post.findOneAndUpdate({ id: video.id }, video)
    }
    await post.save()
    await Author.updateOne(
      { _id: video.author },
      { $addToSet: { posts: post._id } }
    )

    post.products = await getProductData(
      video.description,
      post._id,
      video.category
    )
    return post
  } catch (e) {
    console.log(new Date() + ' Err @youtube.ts/grab::: ', e)
    return null
  }
}
const getProductData = async (
  description: string,
  postId: string,
  category: string
) => {
  const urls: any = await getUrlsFromDescription(description)
  let products = []
  for (const u in urls) {
    const url = urls[u]
    if (!url) continue
    console.log(sysdate() + ` [START] [Create Product] ... ${u}`, url)
    const prod = await createProductFromUrl({
      url,
      postId,
      category,
    })
    console.log(sysdate() + ` [END] [Create Product] ... ${u}`, url)

    products.push(prod._id)
    // await sleep(Math.random() * DELAY_IN_MS)
  }
  return products
}
const getUrlsFromDescription = async (description: string) => {
  const expression = /(https?:\/\/[^\s]+)/gi
  const regex = new RegExp(expression)
  let urls: any = description.match(regex)
  if (!urls) return []
  urls = urls.filter((url: string) => {
    return (
      url &&
      !(
        url.includes('youtu') ||
        url.includes('facebook') ||
        url.includes('instagram') ||
        url.includes('twitter') ||
        url.includes('google') ||
        url.includes('myhaulstore')
      )
    )
  })
  return urls
}
const saveEmailfromDescription = async (
  description: string,
  authorId: string
) => {
  let email: any = description.match(
    /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi
  )
  if (email) {
    email = email.filter(function (item: any, pos: number) {
      return email.indexOf(item) == pos
    })
    email = email.join(',')
    await Author.updateOne({ _id: authorId, email: '' }, { $set: { email } })
  }
}
const getVideoDataFromYoutubeAPI = async (url: string, category: string) => {
  try {
    url = await geturl(url)
    let params = new URL(url).searchParams
    const id = params.get('v')
    if (!id) return
    console.log(colors.bgYellow('youtube id................'), id)
    // const p = await Post.findOne({ id })
    // if (p) return p // Returning p here misses any update in the video description
    const response = await axios.get(
      'https://www.googleapis.com/youtube/v3/videos',
      {
        params: {
          id,
          key: process.env.YOUTUBE_API_KEY,
          part: 'snippet,contentDetails,statistics',
        },
      }
    )
    const item = response.data.items[0].snippet
    const contentDetails = response.data.items[0].contentDetails
    const views = response.data.items[0].statistics.viewCount
    let tags = item.tags
    // const data = response.data
    const authorData: any = await getProfileFromYoutube(
      item.channelId,
      category
    )

    const banner = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    const currentDate = new Date()
    // const video: any = await getOneVideoFromYoutube(url, id)
    const author = authorData._id
    const author_name = authorData.name
    const author_slug = authorData.slug
    const description = item.description
    const publishDate = item.publishedAt
    const publishedOn = publishDate.substring(0, publishDate.indexOf('T'))
    const videoDuration = formatDuration(contentDetails.duration)
    let title = item.title
    if (title.endsWith('- YouTube'))
      title = title.replace('- YouTube', ' - ' + videoDuration)

    if (tags) {
      tags = tags.slice(0, 8).map((tag: any) => tag.trim().replace(/\s+/g, '-'))
    }
    await saveEmailfromDescription(description, author._id)

    const details = {
      id,
      title,
      description,
      banner,
      video: url,
      category,
      publishedAt: publishDate,
      publishedOn,
      publishDate,
      videoDuration,
      views,
      metaDescription: null,
      keywords: null,
      tags,
      date: `${currentDate.getDate()}/${
        currentDate.getMonth() + 1
      }/${currentDate.getFullYear()}`,
      time: `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`,
      author,
      author_name,
      author_slug,
    }
    return details
  } catch (err) {
    console.log(err)
  }
}
const getProfileFromYoutube = async (id: string, category: string) => {
  try {
    const currentDate = new Date()
    // const response = await axios.get(url)
    // const $ = await cheerio.load(response.data)
    // let id = $("meta[itemprop='channelId']").attr('content')
    // let name = $("link[itemprop='name']").attr('content')
    // let avatar = $("link[itemprop='thumbnailUrl']").attr('href')
    // let description = $("link[itemprop='description']").attr('content')
    // let keywords = $("meta[name='keywords']").attr('content')
    const response = await axios.get(
      'https://www.googleapis.com/youtube/v3/channels',
      {
        params: {
          id,
          key: process.env.YOUTUBE_API_KEY,
          part: 'brandingSettings, snippet',
        },
      }
    )
    const snippet = response.data.items[0].snippet
    const branding = response.data.items[0].brandingSettings
    const url = `https://www.youtube.com/channel/${id}`

    // let email = snippet.description.match(
    //   /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi
    // )
    // if (email) {
    //   email = email.filter(function (item: any, pos: number) {
    //     return email.indexOf(item) == pos
    //   })
    //   email = email.join(',')
    //   await Author.updateOne({ id: id, email: '' }, { $set: { email } })
    // }
    let details = {
      created: currentDate,
      date: `${currentDate.getDate()}/${
        currentDate.getMonth() + 1
      }/${currentDate.getFullYear()}`,
      time: `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`,
      id,
      url,
      username: url,
      name: snippet.title,
      description: snippet.description,
      avatar: snippet.thumbnails.high.url,
      customUrl: snippet.customUrl,
      banner: branding.channel.bannerImageUrl,
      keywords: branding.channel.keywords,
      category,
    }
    const a = await Author.findOne({ id: details.id })
    if (a) return a
    const author: any = await Author.create(details)
    await saveEmailfromDescription(snippet.description, author._id)
    await author.save()
    return author
  } catch (err) {
    console.log(err)
  }
}

export { router as youtube }
