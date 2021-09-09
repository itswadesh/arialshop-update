import mongoose, { Schema } from 'mongoose'

const { ObjectId } = Schema.Types

const slugSchema = new Schema(
  {
    slug: String,
    user: { type: ObjectId, ref: 'User' },
    q: String,
  },
  {
    versionKey: false,
    timestamps: true,
  }
)

export const Slug = mongoose.model('Slug', slugSchema)
