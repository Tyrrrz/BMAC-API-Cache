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
  const cachedResponse = await getCacheItem(remoteUrl.pathname);
  if (cachedResponse) {
    res.status(200).end(cachedResponse);

    console.log('Served cached response', {
      remoteUrl: remoteUrl.href,
      data: cachedResponse
    });

    return;
  }

  // Fetch remote response
  const response = await axios.get(remoteUrl.href, {
    headers: {
      authorization: req.header('authorization') || ''
    },
    validateStatus: () => true
  });

  // Update cache
  if (response.status >= 200 && response.status < 300) {
    await setCacheItem(remoteUrl.pathname, response.data);
  }

  res.status(response.status).end(response.data);

  console.log('Served live response:', {
    remoteUrl: remoteUrl.href,
    status: response.status,
    headers: response.headers,
    data: response.data
  });
});

app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`);
});
