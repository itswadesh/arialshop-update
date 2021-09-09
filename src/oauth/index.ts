import { User } from '../models'
import {
  facebookRouter,
  facebookAdminRouter,
  setupFacebook,
  setupFacebookAdmin,
} from './facebook'
import {
  googleRouter,
  googleAdminRouter,
  setupGoogle,
  setupGoogleAdmin,
} from './google'
import googleOneTap from './googleOneTap'
import { Router } from 'express'
setupFacebook(User)
setupFacebookAdmin(User)
setupGoogle(User)
setupGoogleAdmin(User)

export default function (app: Router) {
  app.use('/auth/facebook', facebookRouter)
  app.use('/auth/facebook/admin', facebookAdminRouter)
  app.use('/auth/google', googleRouter)
  app.use('/auth/google/admin', googleAdminRouter)
  app.use('/auth/google/onetap', googleOneTap) //not using anymore(replaced with resolver)
  // app.get('/api/auth/google/onetap', googleOneTap)
}
