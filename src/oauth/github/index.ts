import { Strategy as GithubStrategy } from 'passport-github'
// import { UserDocument } from '../../types';

import passport from 'passport'
import express from 'express'
import {
  APP_ORIGIN,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  WWW_URL,
  API_URL,
} from '../../config'
import { UserDocument } from '../../models'
let githubRouter = express.Router()
githubRouter.get(
  '/',
  passport.authenticate('github', { scope: ['user:email'] })
)
githubRouter.get(
  '/callback',
  passport.authenticate('github', {
    successRedirect: '/auth/github/success',
    failureRedirect: '/auth/github/success?failed=true',
  })
)
githubRouter.get('/success', (req: any, res) => {
  if (req.session && req.user && req.user._id) {
    req.session.userId = req.user && req.user._id
    return res.redirect(WWW_URL + '/submit')
  } else if (req.query.failed)
    return res.redirect(WWW_URL + '/login?failed=true')
  else return res.redirect(WWW_URL + '/login')
})

export async function setupGithub(User: any) {
  passport.use(
    new GithubStrategy(
      {
        clientID: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        callbackURL: WWW_URL + '/auth/github/callback', // This must be website address, not API address
        scope: 'user:email',
      },
      async (accessToken: String, refreshToken: String, profile: any, cb) => {
        try {
          const currentUser: any | null = await User.findOne({
            id: profile && profile.id,
          })
          if (currentUser) {
            // console.log('already have this user: ', currentUser.email)
            cb(null, currentUser)
          } else {
            const newUser = new User({
              id: profile.id,
              name: profile.displayName,
              username: profile.username,
              profileUrl: profile.profileUrl,
              email: profile.emails[0].value,
              emails: profile.emails,
              gender: profile._json.gender,
              role: 'user',
              avatar: profile.photos[0].value,
              photos: profile.photos,
              provider: profile.provider,
              github: profile._json,
            })
            // console.log('created new user: ', newUser)
            const savedUser: UserDocument = await newUser.save()
            cb(null, savedUser)
          }
        } catch (err) {
          // console.log('error at find user ', err)
          cb(err)
        }
      }
    )
  )
}

export { githubRouter }
