import { Litekart, Github, Lessons } from '../models'
import fs from 'fs-extra'
import path from 'path'
import { tmpdir } from 'os'
import { createSitemap, ISitemapOptions } from 'sitemap'
import { STATIC_PATH } from '../config'

export const generateGithubSitemap = async (
  www_url: string,
  filename: string
) => {
  try {
    let urls: any = []
    const stream = Github.find({}).select('slug').cursor()
    stream
      .on('data', async (p) => {
        if (p.slug)
          urls.push({
            url: `/free/${p.slug}`,
            changefreq: 'daily',
            priority: 0.5,
          })
      })
      .on('close', async () => {
        const sitemap = createSitemap({
          hostname: www_url,
          cacheTime: 600000, // 600 sec - cache purge period
          urls,
        })
        fs.writeFileSync(
          path.resolve(path.join(STATIC_PATH, filename)),
          sitemap.toString()
        )
      })
    return 'Sitemap generated...'
  } catch (e) {
    throw e
  }
}

export const generateLitekartSitemap = async (
  www_url: string,
  filename: string
) => {
  try {
    let urls: any = []
    const docs: any = await Litekart.find().select('slug')
    for (let d of docs) {
      urls.push({
        url: `/blog/${d.slug}`,
        changefreq: 'daily',
        priority: 0.5,
      })
    }
    const sitemap = createSitemap({
      hostname: www_url,
      cacheTime: 600000, // 600 sec - cache purge period
      urls,
    })
    const dir = process.env.NODE_ENV == 'development' ? process.cwd() : tmpdir()
    const p = path.resolve(dir, filename) // process.cwd()
    await fs.outputFileSync(p, sitemap.toString())
    fs.writeFileSync(
      path.resolve(STATIC_PATH + '/' + filename),
      sitemap.toString()
    )
    // await s3Upload(p, filename)
    return 'Sitemap generated ' + urls.length + ' records...'
  } catch (e) {
    console.log('Sitemap error....', e)
    throw e
  }
}

export const generateLessonsSitemap = async (
  www_url: string,
  filename: string
) => {
  try {
    let urls: any = []
    const docs: any = await Lessons.find().select('slug')
    for (let d of docs) {
      urls.push({
        url: `/blog/${d.slug}`,
        changefreq: 'daily',
        priority: 0.5,
      })
    }
    const sitemap = createSitemap({
      hostname: www_url,
      cacheTime: 600000, // 600 sec - cache purge period
      urls,
    })
    const dir = process.env.NODE_ENV == 'development' ? process.cwd() : tmpdir()
    const p = path.resolve(dir, filename) // process.cwd()
    await fs.outputFileSync(p, sitemap.toString())
    fs.writeFileSync(
      path.resolve(STATIC_PATH + '/' + filename),
      sitemap.toString()
    )
    // await s3Upload(p, filename)
    return 'Sitemap generated ' + urls.length + ' records...'
  } catch (e) {
    console.log('Sitemap error....', e)
    throw e
  }
}
