import axios from 'axios';
import express from 'express';
import { getCacheItem, setCacheItem } from './cache';
import { getPort } from './utils/env';

const app = express();
const port = getPort();

app.get('/*', async (req, res) => {
  const protocol = req.header('x-forwarded-proto') || req.protocol;
  const remoteUrl = new URL(req.url.toLowerCase(), `${protocol}://developers.buymeacoffee.com/`);

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

  // Fetch cached response
  const cachedData = await getCacheItem(remoteUrl.pathname);
  if (cachedData) {
    res.status(200).end(cachedData);

    console.log('Served cached data:', {
      data: cachedData
    });

    return;
  }

  // Fetch remote response
  const liveResponse = await axios.get(remoteUrl.href, {
    headers: {
      authorization: req.header('authorization') || ''
    },
    validateStatus: () => true
  });

  const liveData =
    typeof liveResponse.data === 'string' ? liveResponse.data : JSON.stringify(liveResponse.data);

  console.log('Received live response:', {
    status: liveResponse.status,
    headers: liveResponse.headers,
    data: liveData
  });

  // Update cache
  if (liveResponse.status >= 200 && liveResponse.status < 300) {
    await setCacheItem(remoteUrl.pathname, liveData);
  }

  res.status(liveResponse.status).end(liveData);
  console.log('Served live data');
});

app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`);
});
