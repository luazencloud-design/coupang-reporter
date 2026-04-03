/*  로컬 CORS 프록시 서버
 *  사용법:
 *    1) Node.js 설치 (https://nodejs.org)
 *    2) 이 파일을 index.html과 같은 폴더에 저장
 *    3) 터미널에서 실행:  node proxy.js
 *    4) "프록시 서버 선택"을 "로컬 (localhost:3100)"으로 변경
 *    5) 연결 테스트 클릭
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3100;

http.createServer((req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // /proxy?url=... 형태로 요청 받기
  const parsed = url.parse(req.url, true);
  if (parsed.pathname !== '/proxy' || !parsed.query.url) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '사용법: /proxy?url=<인코딩된URL>&headers=<인코딩된JSON헤더>' }));
    return;
  }

  const targetUrl = decodeURIComponent(parsed.query.url);
  const customHeaders = parsed.query.headers ? JSON.parse(decodeURIComponent(parsed.query.headers)) : {};

  const target = new URL(targetUrl);
  const options = {
    hostname: target.hostname,
    port: target.port || 443,
    path: target.pathname + target.search,
    method: req.method,
    headers: {
      ...customHeaders,
      'Host': target.hostname,
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      'Content-Type': proxyRes.headers['content-type'] || 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.message }));
  });

  proxyReq.end();
}).listen(PORT, () => {
  console.log(`✅ CORS 프록시 서버 실행 중: http://localhost:${PORT}`);
  console.log(`   index.html에서 "로컬 (localhost:3100)" 선택 후 테스트하세요`);
  console.log(`   종료: Ctrl+C`);
});
