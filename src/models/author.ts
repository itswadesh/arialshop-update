import mongoose, { Schema } from 'mongoose'
import { generateSlugShopNx, sliceByWord } from '../utils'
const { ObjectId } = Schema.Types

var authorSchema = new Schema(
  {
    id: { type: String, default: '' },
    avatar: { type: String, default: '' },
    banner: { type: String, default: '' },
    customUrl: { type: String, default: '' },
    url: { type: String, default: '' },
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    keywords: { type: String, default: '' },
    description: { type: String, default: '' },
    username: { type: String, default: '' },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    slug: { type: String, default: '' },
    category: { type: String, default: '' },
    created: { type: Date },
    date: { type: String, default: '' },
    time: { type: String, default: '' },
    posts: [{ type: ObjectId, ref: 'Post' }],
    products: [{ type: ObjectId, ref: 'Product' }],
    active: { type: Boolean, default: true },
    emailed: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'author',
  }
)

authorSchema.pre('save', async function () {
  var doc: any = this
  if (!doc.slug) doc.slug = await generateSlugShopNx(doc.name)
})

authorSchema.index({
  '$**': 'text',
})

export const Author = mongoose.model('Author', authorSchema)
