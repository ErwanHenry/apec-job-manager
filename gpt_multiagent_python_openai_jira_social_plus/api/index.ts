import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const response = {
    message: "🚀 Kaspa Community Tool API",
    version: "0.4.0",
    status: "operational", 
    platform: "vercel",
    runtime: "typescript",
    services: ["BlablaKAS", "KAScomodation"],
    github: "https://github.com/ErwanHenry/kaspa-community-tool",
    endpoints: {
      health: "/api/health",
      social: "/api/social",
      route: "/api/route", 
      product: "/api/product"
    }
  };

  res.status(200).json(response);
}