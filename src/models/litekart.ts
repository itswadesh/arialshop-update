import mongoose, { Schema } from 'mongoose'
import { generateSlug, sliceByWord } from '../utils'

var litekartSchema = new Schema(
  {
    id: {
      type: String,
      index: true,
      unique: true,
    },
    banner: String,
    original_image: String,
    highlight: String,
    name: String,
    path: String,
    slug: String,
    body: String,
    category: String,
    author: Object,
    tags: Array,
    published_at: Date,
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'litekart',
  }
)

litekartSchema.pre('save', async function () {
  var doc: any = this
  if (!doc.slug)
    doc.slug = await generateSlug(
      sliceByWord(doc.name, 50) + '-' + doc.author.name
    )
  doc.q = doc.name ? doc.name.toLowerCase() + ' ' : ''
  doc.q += doc.highlight ? doc.highlight.toLowerCase() + ' ' : ''
  // doc.q += doc.content ? doc.content.toLowerCase() + ' ' : ''
  doc.q += ' '
  doc.q = doc.q.trim()
})
litekartSchema.index({
  '$**': 'text',
})

export const Litekart = mongoose.model('Litekart', litekartSchema)
