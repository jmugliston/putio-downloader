import { describe, it, beforeEach, afterEach, mock } from 'node:test'
import { equal } from 'node:assert'
import fastq from 'fastq'

import { build } from '../app.js'
import queue from '../../src/plugins/queue.js'

describe('Queue plugin', () => {
  let app

  beforeEach(() => {
    app = build()
  })

  afterEach(() => {
    app.close()
  })

  it('Adds an item to the queue', async () => {
    const testQueue = []

    mock.method(fastq, 'promise', () => ({
      push: (item) => {
        testQueue.push(item)
      },
    }))

    await app.register(queue)

    app.queue('test_file_id')

    equal(testQueue[0], 'test_file_id')
  })
})
