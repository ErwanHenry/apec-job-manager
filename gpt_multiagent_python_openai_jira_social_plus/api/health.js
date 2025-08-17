export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const response = {
    status: "healthy",
    service: "kaspa-community-tool",
    platform: "vercel",
    runtime: "node.js",
    timestamp: new Date().toISOString(),
    version: "0.4.0"
  };

  res.status(200).json(response);
}