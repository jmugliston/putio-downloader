const { describe, it, beforeEach, afterEach, mock } = require('node:test')
const { deepEqual } = require('node:assert')
const axios = require('axios')

const { build } = require('../app')
const putio = require('../../src/plugins/putio')

describe('Putio plugin', () => {
  let app

  beforeEach(async () => {
    app = build()
    await app.register(putio)
  })

  afterEach(() => {
    app.close()
  })

  mock.method(axios, 'create', () => ({
    interceptors: {
      response: {
        use: () => {},
      },
    },
    get: (req) => {
      if (req === '/files/list') {
        return [{ id: 'test-list-item' }]
      }
      if (req === '/files/test') {
        return { id: 'test-item' }
      }
      if (req === '/zips/test') {
        return { id: 'test-zip-item' }
      }
      if (req === '/download-stream') {
        return 'download-stream'
      }
    },
    post: (item) => {
      if (item === '/zips/create') {
        return { zip_id: 'test-zip-create' }
      }
      if (item === '/files/delete') {
        return {}
      }
    },
  }))

  it('Get files', async () => {
    const files = await app.putio.getFiles()

    deepEqual(files, [{ id: 'test-list-item' }])
  })

  it('Get file info', async () => {
    const file = await app.putio.getFileInfo('test')

    deepEqual(file, { id: 'test-item' })
  })

  it('Get download stream', async () => {
    const stream = await app.putio.getDownloadStream('/download-stream')

    deepEqual(stream, 'download-stream')
  })

  it('Create zip', async () => {
    const zip = await app.putio.createZip('test')

    deepEqual(zip, { zip_id: 'test-zip-create' })
  })

  it('Check zip status', async () => {
    const zip = await app.putio.checkZipStatus('test')

    deepEqual(zip, { id: 'test-zip-item' })
  })

  it('Delete file', async () => {
    const file = await app.putio.deleteFile('test')

    deepEqual(file, {})
  })
})
