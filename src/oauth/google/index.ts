import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

import passport from 'passport'
import express from 'express'
import {
  SHOPNX_ORIGIN,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  API_URL,
} from '../../config'
import { UserDocument } from '../../models'
let googleRouter = express.Router()
googleRouter.get(
  '/',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)
googleRouter.get(
  '/callback',
  passport.authenticate('google', {
    // successRedirect: '/auth/google/success',
    failureRedirect: '/auth/google/success?failed=true',
  }),
  (req: any, res) => {
    if (req.session && req.user && req.user._id) {
      req.session.userId = req.user && req.user._id
      return res.redirect(SHOPNX_ORIGIN + '/oauth/success') // This must be website address, not API address
    } else if (req.query.failed)
      return res.redirect(SHOPNX_ORIGIN + '/login?failed=true')
    else return res.redirect(SHOPNX_ORIGIN + '/login')
  }
)

export async function setupGoogle(User: any) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: SHOPNX_ORIGIN + '/auth/google/callback',
      },
      async (
        accessToken: String,
        refreshToken: String,
        profile: any,
        cb: any
      ) => {
        try {
          const currentUser: UserDocument | null = await User.findOne({
            email: profile && profile.emails[0] && profile.emails[0].value,
          })
          if (currentUser) {
            // console.log('already have this user: ', currentUser.email)
            cb(undefined, currentUser)
          } else {
            const newUser = new User({
              firstName: profile.name.givenName,
              lastName: profile.name.familyName,
              email: profile.emails[0].value,
              gender: profile._json.gender,
              role: 'user',
              username: profile.displayName,
              avatar: profile.photos[0].value,
              provider: 'google',
              google: profile._json,
            })
            // console.log('created new user: ', newUser)
            const savedUser: UserDocument = await newUser.save()
            cb(undefined, savedUser)
          }
        } catch (err) {
          // console.log('error at find user ', err)
          cb(err)
        }
      }
    )
  )
}

export { googleRouter }
