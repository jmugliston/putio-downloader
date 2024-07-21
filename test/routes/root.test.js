const { describe, it, beforeEach, afterEach } = require('node:test')
const { equal, deepEqual } = require('node:assert')

const { build } = require('../app')

describe('/', () => {
  let app

  beforeEach(() => {
    app = build()
  })

  afterEach(() => {
    app.close()
  })

  it('GET (200)', async () => {
    const response = await app.inject({
      url: '/',
    })

    equal(response.statusCode, 200)
    deepEqual(response.payload, 'Put.io downloader API')
  })
})
