import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const response = {
    service: "intelligent_routing",
    status: "operational",
    description: "Routes user requests to the appropriate Kaspa community agent",
    available_agents: [
      "blablakas_ops",
      "kascomodation_ops", 
      "social_manager",
      "product_builder"
    ],
    routing_examples: [
      {
        input_example: "Créer une FAQ pour les annulations BlablaKAS",
        agent: "blablakas_ops",
        confidence: 0.95,
        reasoning: "Keywords detected: FAQ, annulations, BlablaKAS"
      },
      {
        input_example: "Planifier des réservations d'hébergement pour Berlin", 
        agent: "kascomodation_ops",
        confidence: 0.92,
        reasoning: "Keywords detected: planifier, réservations, hébergement"
      },
      {
        input_example: "Campagne social media pour nouveau feature Kaspa",
        agent: "social_manager", 
        confidence: 0.88,
        reasoning: "Keywords detected: campagne, social media, communication"
      },
      {
        input_example: "Spécifier un système de notation communautaire",
        agent: "product_builder",
        confidence: 0.90,
        reasoning: "Keywords detected: spécifier, système, développement"
      }
    ],
    usage: {
      method: "POST",
      endpoint: "/api/route",
      body_format: { text: "your request here" },
      response_format: { agent: "agent_name", confidence: 0.95 }
    }
  };

  res.status(200).json(response);
}