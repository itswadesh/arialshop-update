import mongoose, { Schema } from 'mongoose'
import { generateSlug } from '../utils'

// Schema
var categorySchema = new Schema(
  {
    name: String,
    slug: String,
    description: String,
    category: {
      type: String,
      default: 'Website Templates',
    },
    sort: String,
    popularity: String,
    avatar: String,
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'categories',
  }
)

categorySchema.pre('save', async function () {
  var doc: any = this
  if (!doc.slug) doc.slug = await generateSlug(doc.name)
  doc.q = doc.name ? doc.name.toLowerCase() + ' ' : ''
  doc.q = doc.category ? doc.category.toLowerCase() + ' ' : ''
  doc.q += doc.description ? doc.description.toLowerCase() + ' ' : ''
  doc.q += ' '
  doc.q = doc.q.trim()
})

categorySchema.index({
  '$**': 'text',
})

export const Category = mongoose.model('Category', categorySchema)
