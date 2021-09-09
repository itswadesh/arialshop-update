import mongoose, { Schema } from 'mongoose'

// Schema
var ffSchema = new Schema(
  {
    id: {
      type: String,
      index: true,
      unique: true,
    },
    name: String,
    full_name: String,
    slug: String,
    description: String,
    url: String,
    html_url: String,
    homepage: String,
    size: String,
    stargazers_count: Number,
    license: Object,
    author: {
      login: String,
      id: String,
      avatar_url: String,
      gravatar_id: String,
      url: String,
      html_url: String,
    },
    banner: String,
    created_at: Date,
    updated_at: Date,
    content: String,
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'frontendfun',
  }
)

export const Frontendfun = mongoose.model('Frontendfun', ffSchema)
