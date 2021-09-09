import mongoose, { Schema } from 'mongoose'

// Schema
var githubSchema = new Schema(
  {
    name: String,
    path: String,
  },
  {
    toObject: { getters: true },
    toJSON: { getters: true },
    versionKey: false,
    timestamps: true,
    collection: 'GithubCategories',
  }
)
export const GithubCategories = mongoose.model('GithubCategories', githubSchema)
