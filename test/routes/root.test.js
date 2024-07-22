import { describe, it, beforeEach, afterEach } from 'node:test'
import { equal, deepEqual } from 'node:assert'

import { build } from '../app.js'

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
