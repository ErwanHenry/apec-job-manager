import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const now = new Date();
  const scheduledTimes = {
    post1: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    post2: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(), 
    post3: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  };

  const response = {
    campaign: "kaspa_community_showcase",
    posts: [
      {
        platform: "x",
        text: "🚀 BlablaKAS révolutionne le covoiturage avec la blockchain #Kaspa ! Sécurité, transparence et communauté au cœur de chaque trajet. #BlablaKAS #KaspaCommunity #Web3",
        media_urls: [],
        scheduled_at: scheduledTimes.post1,
        requires_approval: false
      },
      {
        platform: "linkedin", 
        text: "KAScomodation transforme l'hébergement collaboratif grâce à la technologie Kaspa. Une nouvelle approche de l'économie du partage, basée sur la confiance et la décentralisation.",
        media_urls: [],
        scheduled_at: scheduledTimes.post2,
        requires_approval: false
      },
      {
        platform: "x",
        text: "🏠 Découvrez KAScomodation : l'hébergement entre particuliers réinventé ! Réservations sécurisées, paiements transparents, communauté Kaspa unie. #KAScomodation #Kaspa",
        media_urls: [],
        scheduled_at: scheduledTimes.post3,
        requires_approval: false
      }
    ],
    reports: [
      {
        period: "7d",
        kpis: ["impressions", "engagement", "ctr"]
      },
      {
        period: "30d", 
        kpis: ["impressions", "engagement", "subs"]
      }
    ]
  };

  res.status(200).json(response);
}