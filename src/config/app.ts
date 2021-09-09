export const {
  NODE_ENV = 'development',

  APP_PORT = 3330,
  APP_HOSTNAME = 'localhost',
  APP_PROTOCOL = 'http',

  APP_SECRET = '4d2ca599b4189f74a771f44b8a8d06f572208b5649f5ae216f8e94612a267ff0',
} = process.env

export const APP_ORIGIN = `${APP_PROTOCOL}://${APP_HOSTNAME}:${APP_PORT}`

export const IN_PROD = NODE_ENV === 'production'

export const STATIC_PATH = './../automation-assets'

export const UPLOAD_DIR = '/images/'

export const API_URL = IN_PROD
  ? 'https://automation.litekart.in'
  : 'http://localhost:3330'

export const SHOPNX_ORIGIN = IN_PROD
  ? 'https://shopnx.in'
  : 'http://localhost:3003'

export const WWW_URL = 'https://www.frontendfun.com'

export const SHOP_URL = 'https://shopnx.in'

export const PAGE_SIZE = 20
