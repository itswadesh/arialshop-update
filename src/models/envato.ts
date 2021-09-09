import { Schema, model } from 'mongoose'
// import { generateSlug } from '../lib';
var schemaOptions = {
  versionKey: false,
  timestamps: true,
  collection: 'envato',
}
let EnvatoSchema = new Schema(
  {
    id: { type: String, es_indexed: true, unique: true },
    name: { type: String, es_indexed: true },
    slug: { type: String, es_indexed: true },
    type: { type: String, es_indexed: true },
    number_of_sales: { type: Number, es_indexed: true },
    author_username: { type: String, es_indexed: true },
    author_url: { type: String, es_indexed: true },
    url: { type: String, es_indexed: true },
    updated_at: { type: Date, es_indexed: true },
    attributes: { type: Array, es_indexed: true },
    description: { type: String, es_indexed: true },
    site: { type: String, es_indexed: true },
    classification: { type: String, es_indexed: true },
    classification_url: { type: String },
    price_cents: { type: Number, es_indexed: true },
    author_image: { type: String, es_indexed: true },
    summary: { type: String, es_indexed: true },
    rating: { type: Number, es_indexed: true },
    rating_count: { type: Number, es_indexed: true },
    published_at: { type: Date, es_indexed: true },
    trending: { type: Boolean, es_indexed: true },
    tags: { type: Array, es_indexed: true },
    previews: { type: Object, es_indexed: true },
  },
  schemaOptions
)
// CodecanyonSchema.virtual('url').get(function () {
//   return `${WWW_URL}/${this.slug}/?id=${this.id}`;
// });
let mexp = require('mongoose-elasticsearch-xp')
EnvatoSchema.plugin(mexp, { hosts: [process.env.ELASTIC_SEARCH] })
const Envato = model('Envato', EnvatoSchema)

export default Envato
