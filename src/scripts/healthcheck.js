/**
 * Performs a health check against the API.
 */

import { request as _request } from 'http'

const options = {
  host: 'localhost',
  path: '/healthcheck',
  port: '3000',
  timeout: 2000,
}

const request = _request(options, (res) => {
  if (res.statusCode == 200) {
    process.exit(0)
  } else {
    process.exit(1)
  }
})

request.on('error', function (err) {
  console.log('ERROR')
  process.exit(1)
})

request.end()
