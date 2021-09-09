import mongoose, { Schema } from 'mongoose'
import { generateSlug } from '../utils'
const { ObjectId } = Schema.Types

var productSchema = new Schema(
  {
    id: { type: String, default: '' },
    name: { type: String, default: '' },
    slug: { type: String, default: '' },
    url: { type: String, default: '' },
    img: { type: String, default: '' },
    images: [String],
    keywords: { type: String, default: '' },
    category: { type: String, default: '' },
    description: { type: String, default: '' },
    features: [{ type: String }],
    keyFeatures: [{ type: String }],
    brandImages: [{ type: String }],
    amazon_affiliate_url: { type: String },
    metaDescription: { type: String, default: '' },
    ratings: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    brand: { type: String, default: '' },
    date: { type: String, default: '' },
    time: { type: String, default: '' },
    created: { type: Date },
    author: { type: ObjectId, ref: 'Author' },
    post: { type: ObjectId, ref: 'Post' },
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'product',
  }
)

productSchema.pre('save', async function () {
  var doc: any = this
  if (!doc.slug) doc.slug = await generateSlug(doc.name)
})

productSchema.index({
  '$**': 'text',
})

productSchema.pre('save', async function () {
  var doc: any = this
  if (!doc.slug) doc.slug = await generateSlug(doc.name)
})

export const Product = mongoose.model('Product', productSchema)
