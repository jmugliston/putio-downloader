import fs from 'fs'
import path from 'path'
import stream from 'stream'
import unzip from 'unzip-stream'
import retry from 'retry'

import { pipeline } from 'stream/promises'

/**
 * Waits for a zip file to be created by put.io and return the URL.
 *
 * @param {string} zipId The ID of the zip file.
 * @param {Function} checkZipStatus The function to check the status of the zip file.
 * @param {Object} options The override options for the retry operation.
 * @returns {Promise<string>} A promise that resolves with the URL of the zip file.
 */
async function waitForZip(zipId, checkZipStatus, options) {
  const operation = retry.operation({
    retries: 10,
    factor: 4,
    minTimeout: 1 * 3000,
    maxTimeout: 120 * 1000,
    randomize: true,
    ...options,
  })

  return new Promise((resolve, reject) => {
    operation.attempt(async function () {
      const res = await checkZipStatus(zipId)

      const shouldRetry = !res.url

      if (operation.retry(shouldRetry)) {
        // Keep trying...
        return
      }

      if (!shouldRetry) {
        return resolve(res.url)
      }

      return reject('failed to create zip file')
    })
  })
}

/**
 * Downloads a zip file and extracts its contents to a specified directory.
 *
 * @param {ReadableStream} downloadStream The stream of the zip file to download.
 * @param {string} dir The directory where the extracted files will be stored.
 * @returns {Set<string>} A set of directories that were processed during the extraction.
 */
async function downloadAndUnzip(downloadStream, dir) {
  const processedItems = new Set()

  await pipeline(
    downloadStream,
    unzip.Parse(),
    stream.Transform({
      objectMode: true,
      transform: function (entry, e, cb) {
        const type = entry.type
        if (type === 'File') {
          const outputFilepath = path.join(dir, entry.path)
          const outputDir = path.dirname(outputFilepath)
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true })
          }
          processedItems.add(path.dirname(entry.path).split(path.sep)[0])
          entry.pipe(fs.createWriteStream(outputFilepath)).on('finish', cb)
        } else {
          entry.autodrain()
          cb()
        }
      },
    })
  )

  return processedItems
}

export default { waitForZip, downloadAndUnzip }

export { waitForZip, downloadAndUnzip }
