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
    const { topic, query, dossierContext, chatHistory, afnorMode } = req.body;
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

    let systemInstruction = `Vous êtes un éminent avocat à la Cour de cassation / Conseil d'État, professeur agrégé et conseiller de thèse de doctorat.
Vous devez impérativement répondre aux questions du candidat en FRANÇAIS très soutenu, universitaire et rigoureux, en citant les théories fondamentales, traités, lois ou grands arrêts d'autorité (ex. dualité juridictionnelle, arrêt Blanco, théorie de la Grundnorm de Kelsen, contrôle de proportionnalité, principes de common law si applicable, etc.).
Gardez vos réponses concises mais exceptionnellement analytiques (environ 2 ou 3 paragraphes denses), avec une profondeur clinique et académique maximale. Évitez les formules de politesse superficielles ou le remplissage conversationnel.

[EXIGENCE CRITIQUE : SOURCES CLIQUABLES ET LIENS COMPLETS]
Pour TOUT concept juridique important, arrêt de jurisprudence, texte de loi, doctrine ou fait mentionné, vous devez UNIQUEMENT et SYSTÉMATIQUEMENT fournir des liens hypertexte de référence en format markdown cliquables standard [Titre ou Nom de la Source](URL).
- Ces liens doivent mener vers des plateformes d'autorité (telles que Légifrance, EUR-Lex, le Conseil d'État, la Cour de de cassation ou Google Scholar).
- Si l'URL statique spécifique n'est pas certaine à 100%, utilisez une URL de recherche académique d'autorité hautement ciblée pour garantir l'absence de liens morts (ex: de la forme "https://scholar.google.com/scholar?q=..." ou "https://www.legifrance.gouv.fr/search/all?tab_selection=all&query=...").
- Exemple : "...selon la théorie de la [Grundnorm de Kelsen](https://scholar.google.com/scholar?q=theorie+de+la+Grundnorm+Hans+Kelsen)..." ou "...établi par l'[Arrêt Blanco du Tribunal des conflits du 8 février 1873](https://www.legifrance.gouv.fr/search/juri?query=Tribunal+des+conflits+8+fevrier+1873+Blanco)..."
L'utilisateur doit pouvoir cliquer sur chaque référence importante pour l'ouvrir dans un nouvel onglet avec une précision de 100%.

${compiledContext}`;

    if (afnorMode) {
      systemInstruction += `

[EXIGENCE CRITIQUE : DIRECTION DE THÈSE SOUS LA NORME AFNOR NF Z 44-005]
Le candidat a configuré la plateforme en mode d'évaluation AFNOR et attend une rigueur absolue.
Veuillez formater TOUTES vos réponses, explications et vos suggestions de recherche selon la norme académique française AFNOR :
- Utilisez des références de doctrine, traités juridiques précis et arrêts de jurisprudence rédigés au format standardisé d'autorité (ex: "JÉZE, G. Les principes généraux du droit administratif. Paris : Dalloz, 1925, p. 45.").
- Vos réponses doivent être articulées de manière extrêmement lisible, ordonnée (ex: 1. Alinéa introductif, 2. Argumentation, 3. Synthèse), au ton digne de l'élite de la doctrine universitaire française.
- Bannissez tout jargon superficiel non étayé de références AFNOR d'autorité. Utilisez la typographie AFNOR avec des expressions formelles françaises.`;
    }

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
