export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { url, headers } = req.query;

  if (!url) {
    return res.status(400).json({ error: '사용법: /api/proxy?url=<인코딩된URL>&headers=<인코딩된JSON헤더>' });
  }

  try {
    const targetUrl = decodeURIComponent(url);
    const customHeaders = headers ? JSON.parse(decodeURIComponent(headers)) : {};

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        ...customHeaders,
        'Host': new URL(targetUrl).hostname,
      },
    });

    const contentType = response.headers.get('content-type') || 'application/json';
    const body = await response.text();

    res.setHeader('Content-Type', contentType);
    res.status(response.status).send(body);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
