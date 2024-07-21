/**
 * Performs a health check against the API.
 */

const http = require('http')

const options = {
  host: 'localhost',
  path: '/healthcheck',
  port: '3000',
  timeout: 2000,
}

const request = http.request(options, (res) => {
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
