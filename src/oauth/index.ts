import { User } from '../models'
import { facebookRouter, setupFacebook } from './facebook'
import { googleRouter, setupGoogle } from './google'
import googleOneTap from './googleOneTap'
import { Router } from 'express'
setupFacebook(User)
setupGoogle(User)

export default function (app: Router) {
  app.use('/auth/facebook', facebookRouter)
  app.use('/auth/google', googleRouter)
  app.use('/auth/google/onetap', googleOneTap) //not using anymore(replaced with resolver)
  // app.get('/api/auth/google/onetap', googleOneTap)
}
