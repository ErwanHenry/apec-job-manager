export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const response = {
    message: "🚀 Kaspa Community Tool API",
    version: "0.4.0",
    status: "operational", 
    platform: "vercel",
    runtime: "node.js",
    services: ["BlablaKAS", "KAScomodation"],
    github: "https://github.com/ErwanHenry/kaspa-community-tool",
    endpoints: {
      health: "/api/health",
      social: "/api/social",
      route: "/api/route"
    }
  };

  res.status(200).json(response);
}