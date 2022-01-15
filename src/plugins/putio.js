const fp = require("fastify-plugin");
const axios = require("axios");
const qs = require("querystring");

async function putio(fastify, opts) {
  const axiosInstance = axios.create({
    baseURL: "https://api.put.io/v2",
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
    },
  });

  axiosInstance.interceptors.response.use((res) => res.data);

  async function getFiles() {
    return axiosInstance.get("/files/list");
  }

  async function createZip(fileId) {
    return axiosInstance.post(
      "/zips/create",
      qs.stringify({ file_ids: fileId }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
  }

  async function checkZipStatus(zipId) {
    return axiosInstance.get(`/zips/${zipId}`);
  }

  async function getDownloadStream(url) {
    return axiosInstance.get({
      url,
      responseType: "stream",
    });
  }

  async function deleteFile(fileId) {
    return axiosInstance.post(
      "/files/delete",
      qs.stringify({ file_ids: fileId }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
  }

  fastify.decorate("putio", {
    getFiles,
    createZip,
    checkZipStatus,
    getDownloadStream,
    deleteFile,
  });
}

module.exports = fp(putio);
