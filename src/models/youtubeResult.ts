import mongoose, { Schema } from 'mongoose'

var youtubeResultSchema = new Schema(
  {
    query: { type: String, default: '' },
    limit: { type: Number, default: 0 },
    publishedAfter: { type: Date },
    category: { type: String, default: 'fashion' },
    kind: { type: String, default: '' },
    etag: { type: String, default: '' },
    nextPageToken: { type: String, default: '' },
    regionCode: { type: String, default: '' },
    pageInfo: Object,
    items: Array,
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'youtubeResult',
  }
)

youtubeResultSchema.index({
  '$**': 'text',
})

export const youtubeResult = mongoose.model(
  'youtubeResult',
  youtubeResultSchema
)
