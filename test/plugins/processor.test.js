const { describe, it, mock, before, after } = require('node:test')
const { equal, strictEqual } = require('node:assert')
const fs = require('fs')
const fp = require('fastify-plugin')

const { build } = require('../app')
const processor = require('../../src/plugins/processor')
const utils = require('../../src/utils/utils')

describe('Processor plugin', () => {
  let app

  before(async () => {
    app = build()

    await app.register(processor, {
      processingDir: 'test-processing-dir',
      downloadDir: 'test-download-dir',
    })

    // mock putio plugin
    await app.register(
      fp(async (fastify) => {
        fastify.decorate('putio', {
          getFileInfo: async () => ({ file: { name: 'test-item' } }),
          createZip: async () => ({ zip_id: '12345' }),
          checkZipStatus: async () => ({
            url: 'https://example.com/zipfile.zip',
          }),
          getDownloadStream: async () => {
            return 'test-stream'
          },
          deleteFile: async () => {},
        })
      })
    )
  })

  after(() => {
    app.close()
  })

  it('process files', async (t) => {
    const mockRenameSync = mock.method(fs, 'renameSync', () => {})
    const mockWaitForZip = mock.method(utils, 'waitForZip', async () => {})
    const mockDownloadAndUnzip = mock.method(
      utils,
      'downloadAndUnzip',
      async () => ['test-file']
    )

    const res = await app.processor('test-item')

    strictEqual(res, true)

    equal(mockWaitForZip.mock.calls.length, 1)
    equal(mockDownloadAndUnzip.mock.calls.length, 1)
    equal(mockRenameSync.mock.calls.length, 1)
  })

  it('process files with error', async (t) => {
    mock.method(fs, 'renameSync', () => {})
    mock.method(utils, 'waitForZip', async () => Promise.reject('test fail'))
    mock.method(utils, 'downloadAndUnzip', async () => ['test-file'])
    mockLogError = mock.method(app.log, 'error', () => {})

    await app.processor('test-item')

    equal(mockLogError.mock.calls.length, 1)
    equal(mockLogError.mock.calls[0].arguments[0], 'test fail')
  })

  it('process files with (axios) error', async (t) => {
    mock.method(fs, 'renameSync', () => {})
    mock.method(utils, 'waitForZip', async () => {})
    mock.method(utils, 'downloadAndUnzip', async () =>
      Promise.reject({ isAxiosError: true, toJSON: () => 'test fail' })
    )
    mockLogError = mock.method(app.log, 'error', () => {})

    await app.processor('test-item')

    equal(mockLogError.mock.calls.length, 1)
    equal(mockLogError.mock.calls[0].arguments[0], 'test fail')
  })
})
