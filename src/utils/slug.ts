import { Slug, slugShopNx } from '../models'

export const generateSlug = async (str: string) => {
  if (!str) throw 'Slug generation error!'
  let rawSlug = str
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/_/g, '-') // Replace _ with -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '')
  try {
    let newSlug = rawSlug
    let foundSlug: any
    do {
      foundSlug = await Slug.findOne({ slug: newSlug })
      if (foundSlug) newSlug = newSlug + '-en'
    } while (foundSlug)
    await Slug.create({ slug: newSlug })
    return newSlug
  } catch (e) {
    throw e
  }
}

export const generateSlugShopNx = async (str: string) => {
  if (!str) throw 'Slug generation error!'
  let rawSlug = str
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/_/g, '-') // Replace _ with -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '')
  try {
    let newSlug = rawSlug
    let foundSlug: any
    do {
      foundSlug = await slugShopNx.findOne({ slug: newSlug })
      if (foundSlug) newSlug = newSlug + '-en'
    } while (foundSlug)
    await slugShopNx.create({ slug: newSlug })
    return newSlug
  } catch (e) {
    throw e
  }
}
