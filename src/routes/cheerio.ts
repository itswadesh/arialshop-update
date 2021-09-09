import { Router } from 'express'
var request = require('request')
import { catchAsync } from '../middleware'
var cheerio = require('cheerio')
const router = Router()

router.get(
  '/api/scrap',
  catchAsync(async (req: any, res: any) => {
    var URL = 'https://www.toysrus.co.za/barbie/'
    request(URL, function (error: any, response: any, body: any) {
      if (!error) {
        var $ = cheerio.load(body)
        $('.products .product-item a').each((i, el) => {
          const link = $(el).attr('href')
          console.log(link)
        })
      } else {
        console.log('There was an error!')
      }
      return res.send('success')
    })
  })
)

export { router as cheerio }
