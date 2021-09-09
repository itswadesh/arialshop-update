import mongoose, { Schema } from 'mongoose'
import { generateSlugShopNx, sliceByWord } from '../utils'
import { object } from '@hapi/joi'
const { ObjectId } = Schema.Types

var amazonPriceChart = new Schema(
  {
    id: { type: String, default: '' },
    name: { type: String, default: '' },
    url: { type: String, default: '' },
    brand: { type: String, default: '' },
    attributes: [{ type: String }],
    keySpecs: [{ type: String }],
    model: { type: String, default: '' },
    color: { type: String, default: '' },
    resolution: { type: String, default: '' },
    display: { type: String, default: '' },
    storage: { type: String, default: '' },
    ram: { type: String, default: '' },
    keywords: { type: String, default: '' },
    description: { type: String, default: '' },
    slug: { type: String, default: '' },
    category: { type: String, default: '' },
    launchDate: { type: String, default: '' },
    mrp: { type: Number },
    price: { type: Number },
    amazon_url: { type: String, default: '' },
    amazon_mrp: { type: Number },
    amazon_price: { type: Number },
    inStockA: { type: Boolean, default: false },
    offerPrice: { type: Number },
    img: { type: Object },
    active: { type: Boolean, default: true },
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'AmazonPriceChart',
  }
)

amazonPriceChart.index({
  '$**': 'text',
})

export const AmazonPriceChart = mongoose.model(
  'AmazonPriceChart',
  amazonPriceChart
)
