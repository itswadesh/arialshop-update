import { GOOGLE_CLIENT_ID } from '../config'
import { googleLogIn } from '../utils'

const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(GOOGLE_CLIENT_ID)
async function googleOTap(req, res) {
  // console.log('zzzzzzzzzzzzzzzzzzzzzzzzzzz', req.body)
  if (req.body)
    if (!req.body.credential) throw new Error('credential not provided')
  // console.log('calling googleOTap')
  const ticket = await client.verifyIdToken({
    idToken: req.body.credential,
    audience: GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  })
  const payload = ticket.getPayload()
  // console.log('payload', payload)
  const userid = payload['sub']
  // If request specified a G Suite domain:
  // const domain = payload['hd'];
  if (payload) {
    const user = await googleLogIn(req, payload)
    return user
  }
}
export default async function googleOneTap(req, res) {
  // console.log('req.body.............', req.body)
  const user = await googleOTap(req, res).catch(console.error)

  res.status(200).send(user)
}
