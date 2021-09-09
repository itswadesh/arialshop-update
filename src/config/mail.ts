import { Options } from 'nodemailer/lib/smtp-connection'
const sg = require('nodemailer-sendgrid-transport')

export const MAIL_FROM = `hi@shopnx.in`

export const { SENDGRID_API_KEY } = process.env
const options = { auth: { api_key: SENDGRID_API_KEY } }
export const SMTP_OPTIONS: Options = sg(options)
