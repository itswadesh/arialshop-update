import { Litekart } from '../models'
import { STATIC_PATH } from '../config'
import { sysdate } from './date'
const fileType = require('file-type')
const cloudinary = require('cloudinary').v2
const request = require('request-promise')
const path = require('path')
const fs = require('fs')
const fsx = require('fs-extra')
const puppeteer = require('puppeteer')
const AWS = require('aws-sdk')
const IMAGE_CDN = 'https://res.cloudinary.com/itswadesh/image/upload/'
const {
  CLOUDINARY_KEY,
  CLOUDINARY_SECRET,
  s3_bucket_name,
  s3_access_key,
  s3_secret,
  s3_region,
} = process.env
cloudinary.config({
  cloud_name: 'itswadesh',
  api_key: CLOUDINARY_KEY,
  api_secret: CLOUDINARY_SECRET,
})
const directory = 'litekart'
// const s3options = {
//   accessKeyId: s3_access_key,
//   secretAccessKey: s3_secret,
//   region: s3_region,
// }
// var s3 = new AWS.S3(s3options)
// const launch = puppeteer.launch({
//   args: [
//     '--disable-gpu',
//     '--disable-dev-shm-usage',
//     '--disable-setuid-sandbox',
//     '--no-first-run',
//     '--no-sandbox',
//     '--no-zygote',
//   ],
// })

export const takeScreenshot = async (
  url: string,
  dir: any,
  name: any,
  transparent = false
) => {
  // Non transparent
  console.log('start screenshot ... ', sysdate(), dir, name, url)
  try {
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
    const page: any = await browser.newPage()
    await page.setViewport({ width: 700, height: 509 })
    if (!fsx.existsSync(`${STATIC_PATH}/${dir}`))
      fsx.ensureDirSync(`${STATIC_PATH}/${dir}`)
    const options = {
      path: `${STATIC_PATH}/${dir}/${name}.png`,
      omitBackground: transparent,
    }
    // console.log('Screenshot options', options)
    await page.goto(url, { timeout: 15000, waitUntil: 'networkidle0' })
    // console.log('Reached page...........')
    await page.screenshot(options)
    console.log('done screenshot  ... ', sysdate(), dir, name, url)
    await browser.close()
    // console.log('page closed ... ')
    return `${dir}/${name}.png`
  } catch (e) {
    console.log('screenshot err...', sysdate(), name, url, e.toString())
    return
  }
}

export const uploadSync = async (docs: any) => {
  // Review this code
  // try {
  //   const uploadPromises = docs.map(async (d: any) => {
  //     // If home page not defined grab image from readme
  //     if (!d.homepage || d.homepage == null || d.homepage == 'null')
  //       d.banner = await uploadToCloudinary(d.img, d.slug)
  //     // Go to homepage and download a screenshot
  //     else
  //       d.banner = await takeScreenshot(
  //         d.homepage,
  //         'screenshots/github',
  //         d.slug
  //       )
  //     const filename =
  //           d.slug + '-' + Math.floor(new Date().valueOf() * Math.random())
  //         console.log('Sync Upload started... ', `${directory}/${filename}`)
  //         try {
  //           const c = await cloudinary.uploader.upload(d.original_image, {
  //             public_id: `${directory}/${filename}`,
  //           })
  //           d.banner = IMAGE_CDN + c.public_id
  //           await d.save()
  //           console.log('Sync Upload success... ', `${directory}/${filename}`)
  //         } catch (e) {
  //           console.log('Sync Upload err at lib...', e)
  //         }
  //       })
  //       return Promise.all(uploadPromises)
  //     } catch (e) {
  //   console.log('Sync Upload promise err at lib...', e)
  // }
}

export const upload = async () => {
  try {
    const docs = await Litekart.find({ banner: { $exists: false } }).select(
      'slug original_image'
    )
    const uploadPromises = docs.map(async (d: any) => {
      const filename =
        d.slug + '-' + Math.floor(new Date().valueOf() * Math.random())
      console.log('Upload started... ', `${directory}/${filename}`)
      try {
        const c = await cloudinary.uploader.upload(d.original_image, {
          public_id: `${directory}/${filename}`,
        })
        d.banner = IMAGE_CDN + c.public_id
        await d.save()
        console.log('Upload success... ', `${directory}/${filename}`)
      } catch (e) {
        console.log('Upload err at lib...', e)
      }
    })
    return Promise.all(uploadPromises)
  } catch (e) {
    throw e
  }
}

export const uploadToCloudinary = async (img: string, filename: string) => {
  try {
    const folder = 'github'
    // let ext = filename.split('.').pop()
    // const public_id = filename.replace('.' + ext, '')
    // console.log('iplaod............', public_id)
    const c = await cloudinary.uploader.upload(img, {
      folder,
      // public_id,
      // invalidate: true,
    })
    return IMAGE_CDN + c.public_id
  } catch (e) {
    throw e
  }
}
export const deleteFromCloudinary = async (name: string) => {
  try {
    const directory = 'github'
    console.log('destroy........', `${directory}/${name}`)
    const c = await cloudinary.uploader.destroy(`${directory}/${name}`)
    return c.public_id
  } catch (e) {
    throw e
  }
}
export const uploadSitemap = async (p: any, filename: string) => {
  try {
    await cloudinary.uploader.upload(p, {
      resource_type: 'raw',
      public_id: `${directory}/${filename}`,
    })
  } catch (e) {
    throw e
  }
}

const readFile = async (url: string) => {
  var pattern = /^((http|https|ftp):\/\/)/
  let isUrl = pattern.test(url)
  try {
    let stream
    if (isUrl) {
      stream = await request({ url, encoding: null })
    } else {
      stream = await fs.createReadStream(path.resolve(url))
      stream.on('error', function (err: Error) {})
    }
    return stream
  } catch (e) {
    console.log('readFileError...', e.toString())
    return
  }
}

// export const s3Upload = async (url: string, fileName: string) => {
//   var pattern = /^((http|https|ftp):\/\/)/
//   let isUrl = pattern.test(url)
//   let stream = await readFile(url)
//   let buffer
//   if (isUrl) {
//     buffer = stream
//   } else {
//     const readChunk = require('read-chunk')
//     try {
//       buffer = readChunk.sync(url, 0, fileType.minimumBytes)
//     } catch (e) {}
//   }
//   const stream1 = await fileType(buffer)
//   try {
//     var params = {
//       Bucket: s3_bucket_name,
//       Key: 'images/' + fileName,
//       Body: stream,
//       ContentType: stream1.mime, //'image/jpeg',
//       ContentDisposition: 'inline',
//       ACL: 'public-read',
//       CacheControl: 'public, max-age=31536000',
//     }
//     let data = await s3.upload(params).promise()
//     return data.Location
//   } catch (e) {
//     throw e.toString()
//   }
// }
