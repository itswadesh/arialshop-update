import mongoose, { Schema } from 'mongoose'
import { generateSlug, sliceByWord, takeScreenshot } from '../utils'

// Schema
var lessonsSchema = new Schema(
  {
    source: Object,
    author: String,
    title: String,
    slug: String,
    description: String,
    url: {
      type: String,
      index: true,
      unique: true,
    },
    banner: String,
    publishedAt: Date,
    content: String,
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'lessons',
  }
)

lessonsSchema.pre('save', async function () {
  var doc: any = this
  if (!doc.slug) doc.slug = await generateSlug(sliceByWord(doc.title, 50))
  doc.q = doc.title ? doc.title.toLowerCase() + ' ' : ''
  doc.q += doc.description ? doc.description.toLowerCase() + ' ' : ''
  // doc.q += doc.content ? doc.content.toLowerCase() + ' ' : ''
  doc.q += ' '
  doc.q = doc.q.trim()
})
lessonsSchema.index({
  '$**': 'text',
})

export const Lessons = mongoose.model('Lessons', lessonsSchema)
