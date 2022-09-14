import axios from 'axios';
import express from 'express';
import { getCacheItem, setCacheItem } from './cache';
import { getPort } from './utils/env';

const app = express();
const port = getPort();

app.get('/*', async (req, res) => {
  const remoteUrl = new URL(
    req.url.toLowerCase(),
    `${req.protocol}://developers.buymeacoffee.com/`
  );

  // Make sure the URL points to an API endpoint
  if (!remoteUrl.pathname.startsWith('/api/v1')) {
    res.status(400).end('Invalid path');
    return;
  }

  // Fetch cached response
  const cachedResponse = await getCacheItem(remoteUrl.pathname);
  if (cachedResponse) {
    res.status(200).end(cachedResponse);
    return;
  }

  // Fetch remote response
  const response = await axios.get(remoteUrl.href, {
    // Copy headers over from the request
    headers: Object.fromEntries(
      Object.entries(req.headers)
        .map(([key, value]) => (typeof value !== 'object' ? [key, value] : [key, value[0]]))
        .filter(([, value]) => !!value)
    ),
    validateStatus: () => true
  });

  // Update cache
  if (response.status >= 200 && response.status < 300) {
    await setCacheItem(remoteUrl.pathname, response.data);
  }

  // Proxy headers
  for (const [key, value] of Object.entries(response.headers)) {
    res.setHeader(key, value);
  }

  res.status(response.status).end(response.data);
  console.log('Request completed:', { remoteUrl, status: response.status });
});

app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`);
});
