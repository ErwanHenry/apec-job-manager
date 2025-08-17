import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const response = {
    status: "healthy",
    service: "kaspa-community-tool",
    platform: "vercel",
    runtime: "typescript",
    timestamp: new Date().toISOString(),
    version: "0.4.0",
    uptime: "operational"
  };

  res.status(200).json(response);
}