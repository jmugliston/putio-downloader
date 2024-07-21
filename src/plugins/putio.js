/**
 * A Fastify plugin for interacting with the Put.io API.
 *
 * @param {import('fastify').FastifyInstance} fastify - The Fastify instance.
 * @param {Object} opts - The plugin options.
 * @param {string} opts.accessToken - The access token for the Put.io API.
 */
const fp = require('fastify-plugin')
const axios = require('axios')
const qs = require('querystring')

async function putio(fastify, opts) {
  const axiosInstance = axios.create({
    baseURL: 'https://api.put.io/v2',
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
    },
  })

  axiosInstance.interceptors.response.use((res) => res.data)

  /**
   * Get a list of files from the Put.io API.
   *
   * @returns {Promise<Object>} The response data containing the list of files.
   */
  async function getFiles() {
    return axiosInstance.get('/files/list')
  }

  /**
   * Get information about a specific file from the Put.io API.
   *
   * @param {number} fileId - The ID of the file.
   * @returns {Promise<Object>} The response data containing the file information.
   */
  async function getFileInfo(fileId) {
    return axiosInstance.get(`/files/${fileId}`)
  }

  /**
   * Create a zip file containing the specified file.
   *
   * @param {number} fileId - The ID of the file to include in the zip.
   * @returns {Promise<Object>} The response data containing the created zip information.
   */
  async function createZip(fileId) {
    return axiosInstance.post(
      '/zips/create',
      qs.stringify({ file_ids: fileId }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )
  }

  /**
   * Check the status of a zip file creation.
   *
   * @param {number} zipId - The ID of the zip file.
   * @returns {Promise<Object>} The response data containing the zip status information.
   */
  async function checkZipStatus(zipId) {
    return axiosInstance.get(`/zips/${zipId}`)
  }

  /**
   * Get a readable stream for downloading a file from the specified URL.
   *
   * @param {string} url - The URL of the file to download.
   * @returns {Promise<Object>} The response data containing the download stream.
   */
  async function getDownloadStream(url) {
    return axiosInstance.get(url, {
      responseType: 'stream',
    })
  }

  /**
   * Delete a file from the Put.io API.
   *
   * @param {number} fileId - The ID of the file to delete.
   * @returns {Promise<Object>} The response data indicating the success of the deletion.
   */
  async function deleteFile(fileId) {
    return axiosInstance.post(
      '/files/delete',
      qs.stringify({ file_ids: fileId }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )
  }

  fastify.decorate('putio', {
    getFiles,
    getFileInfo,
    createZip,
    checkZipStatus,
    getDownloadStream,
    deleteFile,
  })
}

module.exports = fp(putio)
