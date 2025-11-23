const axios = require('axios')

async function verifyUrl (url, timeout = 5000) {
  if (!url || typeof url !== 'string') return false
  try {
    // Some sites block HEAD requests; use GET but limit response size via maxContentLength
    const resp = await axios.get(url, { timeout, maxContentLength: 50 * 1024 })
    return resp && resp.status && resp.status < 400
  } catch (err) {
    return false
  }
}

function isBestEverUrl (url) {
  if (!url || typeof url !== 'string') return false
  return url.includes('besteveralbums.com')
}

module.exports = { verifyUrl, isBestEverUrl }
