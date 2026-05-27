import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in your Vercel Project Environment Variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-vercel',
        }
      }
    });
  }
  return aiClient;
}

export default async function handler(req: any, res: any) {
  // Allow and handle CORS preflight
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  try {
    const { topic, query, dossierContext, chatHistory } = req.body;
    if (!query || typeof query !== "string" || !query.trim()) {
      res.status(400).json({ error: "A valid philosophical or statutory query is required." });
      return;
    }

    const ai = getGeminiClient();

    const compiledContext = dossierContext ? `
You are an Elite Academic Advisor. Here is the active Legal Research Dossier being analyzed:
---
TOPIC: ${dossierContext.topic}
TAXONOMY: ${dossierContext.taxonomy}
JURISPRUDENTIAL NEXUS: ${dossierContext.jurisprudentialNexus}
ACADEMIC BLUEPRINTS: ${dossierContext.academicSyntheses}
---` : "";

    const systemInstruction = `Vous êtes un éminent avocat à la Cour de cassation / Conseil d'État, professeur agrégé et conseiller de thèse de doctorat.
Vous devez impérativement répondre aux questions du candidat en FRANÇAIS très soutenu, universitaire et rigoureux, en citant les théories fondamentales, traités, lois ou grands arrêts d'autorité (ex. dualité juridictionnelle, arrêt Blanco, théorie de la Grundnorm de Kelsen, contrôle de proportionnalité, principes de common law si applicable, etc.).
Gardez vos réponses concises mais exceptionnellement analytiques (environ 2 ou 3 paragraphes denses), avec une profondeur clinique et académique maximale. Évitez les formules de politesse superficielles ou le remplissage conversationnel.
${compiledContext}`;

    const formattedHistory = (chatHistory || [])
      .filter((msg: any) => msg.id !== "welcome")
      .map((msg: any) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...formattedHistory,
        { role: "user", parts: [{ text: `Candidate Query: "${query.trim()}"` }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.status(200).json({ text: response.text });
  } catch (error: any) {
    console.error("Error in deep-dive dialog on Vercel:", error);
    res.status(500).json({
      error: error.message || "An error occurred during academic research deep-dive.",
      raw: error.toString()
    });
  }
}
