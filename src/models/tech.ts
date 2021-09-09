import mongoose, { Schema } from 'mongoose'
const { ObjectId } = Schema.Types

var techSchema = new Schema(
  {
    id: { type: String, default: '' },
    count: { type: String, default: '' },
    title: { type: String, default: '' },
    trimmer: { type: String, default: '' },
    description: { type: String, default: '' },
    description1: { type: String, default: '' },
    intro: { type: String, default: '' },
    banner: { type: String, default: '' },
    video: { type: String, default: '' },
    slug: { type: String, default: '' },
    category: { type: String, default: '' },
    publishedAt: { type: String, default: '' },
    publishedOn: { type: String, default: '' },
    publishDate: { type: String, default: '' },
    date: { type: String, default: '' },
    time: { type: String, default: '' },
    videoDuration: { type: String, default: '' },
    views: { type: Number, default: 0 },
    metaDescription: { type: String, default: '' },
    keywords: { type: String, default: '' },
    tags: [{ type: String, default: '' }],
    urls: [{ type: String, default: '' }],
    products: [{ type: ObjectId, ref: 'Product' }],
    author: { type: ObjectId, ref: 'User' },
    author_name: { type: String, default: '' },
    author_slug: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'tech',
  }
)

techSchema.index({
  '$**': 'text',
})

export const Tech = mongoose.model('Tech', techSchema)
