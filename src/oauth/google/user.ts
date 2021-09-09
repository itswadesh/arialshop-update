import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { UserDocument } from '../../types'

import passport from 'passport'
import express from 'express'
import { WWW_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '../../config'
const googleRouter = express.Router()
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
    if (req.session && req.user && req.user.id) {
      req.session.userId = req.user && req.user.id
      return res.redirect(WWW_URL + '/') // This must be website address, not API address
    } else if (req.query.failed)
      return res.redirect(WWW_URL + 'login?failed=true')
    else return res.redirect(WWW_URL + 'login')
  }
)

export async function setupGoogle(User: any) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: WWW_URL + '/auth/google/callback',
      },
      async (accessToken: string, refreshToken: string, profile: any, cb) => {
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
