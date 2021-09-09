import Handlebars, { helpers } from 'handlebars'
import {
  SMTP_OPTIONS,
  MAIL_FROM,
  SENDGRID_API_KEY,
  STATIC_PATH,
} from '../config'
const nodemailer = require('nodemailer')
const hbs = require('nodemailer-express-handlebars')
const hbsOptions = {
  viewEngine: {
    extname: '.hbs',
    layoutsDir: `${STATIC_PATH}/templates/`,
    defaultLayout: 'default',
    partialsDir: `${STATIC_PATH}/templates/partials/`,
    helpers,
  },
  viewPath: `${STATIC_PATH}/templates/`,
  extName: '.hbs',
}

var transporter = nodemailer.createTransport(SMTP_OPTIONS)
transporter.use('compile', hbs(hbsOptions))

export const sendMail = async ({
  to,
  cc = null,
  bcc = '2lessons@gmail.com',
  subject,
  template,
  context,
  attachments = [],
}: any) => {
  if (!SENDGRID_API_KEY) {
    return 'Sendgrid API key not set at .env'
  }
  try {
    const info = await transporter.sendMail({
      from: MAIL_FROM,
      to,
      cc,
      bcc,
      subject,
      template,
      context,
      attachments,
    })
    console.log('email sent...', info)
    return info
  } catch (e) {
    console.log('email err..', e.toString())
    return false
  }
}
