import axios from 'axios';
import express from 'express';
import { getCacheItem, setCacheItem } from './cache';
import { getSha256Hash } from './hash';
import { delay } from './utils/async';
import { getPort } from './utils/env';

const app = express();
const port = getPort();

let lastRequestTimestamp: Date | null = null;

app.get('/*', async (req, res) => {
  const protocol = req.header('x-forwarded-proto') || req.protocol;
  const remoteUrl = new URL(req.url.toLowerCase(), `${protocol}://developers.buymeacoffee.com/`);

  const authorization = req.header('authorization') || '';

  // Make sure the URL points to an API endpoint
  if (!remoteUrl.pathname.startsWith('/api/v1')) {
    res.status(400).end('Path must start with /api/v1');
    return;
  }

  console.log('Received request:', {
    remoteUrl: remoteUrl.href,
    headers: req.headers,
    data: req.body
  });

  // Build the cache key based on the URL and the authorization header
  const key = getSha256Hash([remoteUrl.pathname, authorization].join());
  console.log('Cache key:', key);

  // Fetch cached response
  const cachedData = await getCacheItem(key);
  if (cachedData) {
    res.status(200).end(cachedData);

    console.log('Served cached data:', {
      data: cachedData
    });

    return;
  }

  // Maintain 15 req/min rate limit against the API
  if (lastRequestTimestamp) {
    const diff = new Date().getTime() - lastRequestTimestamp.getTime();
    if (diff < 4000) {
      await delay(4000 - diff);
    }
  }

  // Fetch remote response
  const liveResponse = await axios.get(remoteUrl.href, {
    headers: {
      authorization
    },
    validateStatus: () => true
  });

  const liveData =
    typeof liveResponse.data === 'string' ? liveResponse.data : JSON.stringify(liveResponse.data);

  lastRequestTimestamp = new Date();

  console.log('Received live response:', {
    status: liveResponse.status,
    headers: liveResponse.headers,
    data: liveData
  });

  // Update cache
  if (liveResponse.status >= 200 && liveResponse.status < 300) {
    await setCacheItem(key, liveData);
  }

  res.status(liveResponse.status).end(liveData);
  console.log('Served live data');
});

app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`);
});
