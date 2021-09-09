import express from 'express'
import cors from 'cors'
import session, { Store } from 'express-session'
import { GithubCategories } from './models'
import cron from 'node-cron'
import oAuthRoutes from './oauth'

import { SESSION_OPTIONS } from './config'
import {
  home,
  login,
  register,
  verify,
  reset,
  lessons,
  litekart,
  ff,
  tags,
  categories,
  posts,
  products,
  authors,
  flipkart,
  youtube,
  user,
  tech,
  cheerio,
} from './routes'
import passport from 'passport'
import { notFound, serverError, active } from './middleware'
import Axios from 'axios'
import { sleep, sysdate } from './utils'
export const createApp = (store: Store) => {
  const app = express()

  const sessionHandler = session({ ...SESSION_OPTIONS, store })

  // Setup Passport
  app.use(sessionHandler)
  app.use(passport.initialize())
  app.use(passport.session())

  app.use(express.json())
  app.use(cors())

  oAuthRoutes(app)

  app.use(active)

  app.use(user)
  app.use(posts)
  app.use(products)
  app.use(authors)
  app.use(ff)
  app.use(tech)
  app.use(flipkart)
  app.use(youtube)
  app.use(tags)
  app.use(categories)
  app.use(cheerio)

  app.use(lessons)

  app.use(litekart)

  app.use(home)

  app.use(login)

  app.use(register)

  app.use(verify)

  app.use(reset)

  app.use(notFound)

  app.use(serverError)
  // To backup a database
  // cron.schedule('21 21 * * *', async function () {
  //   var now = Date.now(),
  //     oneDay = 1000 * 60 * 60 * 24,
  //     today = new Date(now - (now % oneDay)),
  //     tomorrow = new Date(today.valueOf() + oneDay)
  //   const dateTimeFormat = new Intl.DateTimeFormat('en', {
  //     year: 'numeric',
  //     month: 'short',
  //     day: '2-digit',
  //   })
  //   const [
  //     { value: month },
  //     ,
  //     { value: day },
  //     ,
  //     { value: year },
  //   ] = dateTimeFormat.formatToParts(now)

  //   console.log('---------------------')
  //   console.log('Running Cron Job', `${day}-${month}-${year}`)

  //   // Generate Sitemps first
  //   await Axios.get(`https://api.litekart.in/api/envato/generate-sitemap`)
  //   await Axios.get(`https://automation.litekart.in/api/github/sitemap`)
  //   await Axios.get(`https://automation.litekart.in/api/litekart/sitemap`)
  //   await Axios.get(`https://automation.litekart.in/api/lessons/sitemap`)
  //   await Axios.get(`https://api.litekart.in/api/envato/grab`)

  //   const cats: any = await GithubCategories.find({
  //     date: { $gte: today, $lt: tomorrow },
  //   }).select('name path')
  //   for (let c of cats) {
  //     await Axios.get(c.lessons)
  //     await Axios.get(c.litekart)
  //     await Axios.get(c.github)
  //     await sleep(3000)
  //   }

  //   console.log('Cron Job Finished')
  //   console.log('---------------------')
  // })

  return app
}
