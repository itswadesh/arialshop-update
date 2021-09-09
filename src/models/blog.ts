import { Schema, model } from 'mongoose'
import { generateSlug } from '../utils'
var schemaOptions = {
  versionKey: false,
  timestamps: true,
  collection: 'blog',
}
let BlogSchema = new Schema(
  {
    slug: { type: String, unique: true },
    name: { type: String },
    title: { type: String },
    metaDescription: { type: String },
    banner: { type: String },
    items: [],
    // items: [{
    //   id:String,
    //   name:String,
    //   img:String,
    //   number_of_sales:String,
    //   author_username:String,
    //   author_url:String,
    //   url:String,
    //   updated_at:String,
    //   attributes:[],
    //   description:String,
    //   site:String,
    //   classification:String,
    //   classification_url:String,
    //   price_cents:String,
    //   author_image:String,
    //   summary:String,
    //   rating:String,
    //   rating_count:String,
    //   published_at:String,
    //   trending:String,
    //   tags:[],
    //   previews:Object,
    // }],
    date: { type: Date, default: new Date() },
    published: { type: Boolean, default: false },
  },
  schemaOptions
)

BlogSchema.pre('save', async function () {
  var doc: any = this
  if (!doc.slug) doc.slug = await generateSlug(doc.name)
})

BlogSchema.index({
  '$**': 'text',
})

export const Blog = model('Blog', BlogSchema)
