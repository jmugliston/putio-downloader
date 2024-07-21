import { describe, it, beforeEach, afterEach } from 'node:test'
import { equal, deepEqual } from 'node:assert'
import fp from 'fastify-plugin'

import { build } from '../../app.js'

describe('/file', () => {
  let app

  beforeEach(() => {
    app = build()
  })

  afterEach(() => {
    app.close()
  })

  it('POST (200)', async () => {
    const mockQueue = []

    // Mock queue plugin
    app.register(
      fp(async (fastify) => {
        fastify.decorate('queue', (id) => {
          mockQueue.push(id)
        })
      })
    )

    const response = await app.inject({
      method: 'POST',
      url: '/file',
      payload: {
        file_id: 'your_file_id_here',
      },
    })

    equal(response.statusCode, 200)
    deepEqual(response.payload, JSON.stringify({ received: true }))
    deepEqual(mockQueue, ['your_file_id_here'])
  })

  it('POST (400)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/file',
      payload: {},
    })

    equal(response.statusCode, 400)
    equal(
      response.payload,
      JSON.stringify({
        statusCode: 400,
        error: 'Bad Request',
        message: 'No file id in request',
      })
    )
  })
})
