export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const now = new Date();
  const response = {
    campaign: "kaspa_community_showcase",
    posts: [
      {
        platform: "x",
        text: "🚀 BlablaKAS révolutionne le covoiturage avec la blockchain #Kaspa !",
        scheduled_at: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        requires_approval: false
      },
      {
        platform: "linkedin", 
        text: "KAScomodation transforme l'hébergement collaboratif grâce à Kaspa.",
        scheduled_at: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
        requires_approval: false
      }
    ],
    status: "active"
  };

  res.status(200).json(response);
}