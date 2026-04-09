export default async function handler(req, res) {
  // CORS 헤더
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

    const fetchOpts = {
      method: req.method === 'POST' ? 'POST' : 'GET',
      headers: {
        ...customHeaders,
        'Host': new URL(targetUrl).hostname,
      },
    };

    // POST: 본문 전달 (DataLab 등)
    if (req.method === 'POST') {
      let body;
      if (typeof req.body === 'string') {
        body = req.body;
      } else if (req.body && Object.keys(req.body).length > 0) {
        body = JSON.stringify(req.body);
      } else {
        // 원본 body를 직접 읽어오기
        body = await new Promise((resolve, reject) => {
          let data = '';
          req.on('data', chunk => { data += chunk; });
          req.on('end', () => resolve(data));
          req.on('error', reject);
        });
      }
      fetchOpts.body = body;
      if (!fetchOpts.headers['Content-Type'] && !fetchOpts.headers['content-type']) {
        fetchOpts.headers['Content-Type'] = 'application/json';
      }
    }

    const response = await fetch(targetUrl, fetchOpts);
    const contentType = response.headers.get('content-type') || 'application/json';
    const bodyText = await response.text();

    res.setHeader('Content-Type', contentType);
    res.status(response.status).send(bodyText);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
