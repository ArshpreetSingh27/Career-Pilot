// Same-origin Vercel API. No app.listen(), local Ollama, or background timers.
module.exports = async function handler(req, res) {
  let app;
  let connectDatabase;
  try {
    app = require('../server/dist/app').default;
    connectDatabase = require('../server/dist/config/db').connectDatabase;
  } catch (error) {
    console.error('API startup failed:', error);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'The service is temporarily unavailable.' }));
    return;
  }
  const incoming = new URL(req.url, 'http://localhost');
  const route = req.query?.__route ?? incoming.searchParams.get('__route');
  if (typeof route === 'string') {
    incoming.searchParams.delete('__route');
    if (req.query) delete req.query.__route;
    req.url = `/api/${route.replace(/^\/+/, '')}${incoming.search}`;
    req.originalUrl = req.url;
  }
  try { await connectDatabase(); }
  catch { res.statusCode = 503; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ success: false, message: 'The service is temporarily unavailable.' })); return; }
  return app(req, res);
};
