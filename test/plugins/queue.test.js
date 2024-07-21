const { describe, it, beforeEach, afterEach, mock } = require('node:test')
const { equal } = require('node:assert')
const fastq = require('fastq')

const { build } = require('../app')
const queue = require('../../src/plugins/queue')

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
