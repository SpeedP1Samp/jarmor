const axios = require("axios");

const REPO = "SpeedP1Samp/db";
const FILE_PATH = "keys.json";
const BRANCH = "main";
const TOKEN = "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";

const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Authorization: `token ${TOKEN}`,
    Accept: "application/vnd.github+json"
  }
});

async function getKeys() {
  const res = await githubApi.get(`/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`);
  const content = Buffer.from(res.data.content, "base64").toString("utf-8");
  const sha = res.data.sha;
  return { keys: JSON.parse(content), sha };
}

async function updateKeys(keys, sha, message = "Update keys") {
  const content = Buffer.from(JSON.stringify(keys, null, 2)).toString("base64");
  const res = await githubApi.put(`/repos/${REPO}/contents/${FILE_PATH}`, {
    message,
    content,
    sha,
    branch: BRANCH
  });
  return res.data;
}

module.exports = { getKeys, updateKeys };
