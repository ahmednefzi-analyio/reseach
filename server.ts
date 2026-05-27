import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with lazy check and User-Agent telemetry
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it under Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. API: Generate Complete PhD Research Dossier
app.post("/api/generate-dossier", async (req: Request, res: Response) => {
  try {
    const { topic } = req.body;
    if (!topic || typeof topic !== "string" || !topic.trim()) {
      res.status(400).json({ error: "A valid legal topic, doctrine, or case title is required." });
      return;
    }

    const ai = getGeminiClient();

    const systemPrompt = `Vous êtes un universitaire éminent en droit, un scientifique des données juridiques et un analyste chevronné des cours suprêmes.
Générez un dossier académique extrêmement rigoureux et approfondi sur le sujet de recherche fourni.
IMPORTANT : L'intégralité du contenu généré (les descriptions, analyses, scénarios hypothétiques, titres de conflits, etc.) DOIT être rédigée en FRANÇAIS littéraire, académique et très soutenu, adapté à un candidat en doctorat (Ph.D.).
Conservez strictement la structure et les clés JSON de l'objet en anglais comme requis par le schéma, mais toutes les explications textuelles et les valeurs de chaînes de caractères complexes doivent être formulées en français juridique de haut niveau.
Fournissez des données empiriques et synthétiques réalistes qui illustrent parfaitement le sujet sous forme de tendances et de mesures régionales. (Note : les clés du schéma JSON doivent rester en anglais pour des raisons de conformité technique).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Perform a comprehensive, multi-dimensional doctoral analysis on the following topic/doctrine/case: "${topic.trim()}".`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: [
            "topic",
            "taxonomy",
            "jurisprudentialNexus",
            "doctrinalFrictionPoints",
            "chronologicalEvolution",
            "empiricalData",
            "comparativeJurisdictions",
            "emergingFrictionPoints",
            "academicSyntheses"
          ],
          properties: {
            topic: {
              type: Type.STRING,
              description: "The full formal title of the legal topic or doctrine."
            },
            taxonomy: {
              type: Type.STRING,
              description: "High-level index classification, e.g., 'Antitrust & Computational Law', 'Public International Law & Digital Sovereignty'."
            },
            jurisprudentialNexus: {
              type: Type.STRING,
              description: "A highly sophisticated, rigorous 2-paragraph analysis of the philosophical, jurisprudential (e.g., positivism, realism, critical legal studies) and constitutional underpinnings of the topic."
            },
            doctrinalFrictionPoints: {
              type: Type.ARRAY,
              description: "Key structural and statutory friction points.",
              items: {
                type: Type.OBJECT,
                required: ["pillar", "conflict", "precedent", "critique"],
                properties: {
                  pillar: { type: Type.STRING, description: "Doctrinal pillar or governing statute." },
                  conflict: { type: Type.STRING, description: "Detailed structural tension or split of authority." },
                  precedent: { type: Type.STRING, description: "Leading judicial precedent(s) or administrative rules." },
                  critique: { type: Type.STRING, description: "Advanced academic/PhD scholarly critiques of this tension." }
                }
              }
            },
            chronologicalEvolution: {
              type: Type.ARRAY,
              description: "Important timeline milestones detailing judicial or legislative paradigm shifts.",
              items: {
                type: Type.OBJECT,
                required: ["yearOrEra", "shiftType", "title", "description"],
                properties: {
                  yearOrEra: { type: Type.STRING, description: "E.g., '1984', '2018', 'Post-COVID Era'." },
                  shiftType: {
                    type: Type.STRING,
                    description: "Specific type of paradigm shift.",
                    enum: ["Paradigm Shift", "Legislative Catalyst", "Judicial Milestone", "Doctrinal Pivot"]
                  },
                  title: { type: Type.STRING, description: "Brief title of the evolution step/shift." },
                  description: { type: Type.STRING, description: "A rigorous explanation of the legal transition and its structural effect on compliance/jurisprudence." }
                }
              }
            },
            empiricalData: {
              type: Type.OBJECT,
              required: ["trendLine", "jurisdictionMetrics", "topicBreakdown"],
              properties: {
                trendLine: {
                  type: Type.ARRAY,
                  description: "10-year periodic metrics showing volume and index score. Must generate realistic, academically aligned synthetic data values representing litigation and enforcement density.",
                  items: {
                    type: Type.OBJECT,
                    required: ["year", "index_score", "volume"],
                    properties: {
                      year: { type: Type.INTEGER, description: "E.g. 2017, 2019, 2021, etc." },
                      index_score: { type: Type.NUMBER, description: "Relative systemic friction score from 1 (Low) to 100 (Max)." },
                      volume: { type: Type.NUMBER, description: "Estimated total scholarly/litigated case count." }
                    }
                  }
                },
                jurisdictionMetrics: {
                  type: Type.ARRAY,
                  description: "Compare critical metrics across major global jurisdictions.",
                  items: {
                    type: Type.OBJECT,
                    required: ["jurisdiction", "winRate", "litigationVolume", "complianceCostIndex"],
                    properties: {
                      jurisdiction: { type: Type.STRING, description: "Jurisdiction name (e.g., 'United States', 'European Union', 'United Kingdom', 'Global South / China')." },
                      winRate: { type: Type.NUMBER, description: "Average successful claim/enforcement rate (0-100%)." },
                      litigationVolume: { type: Type.NUMBER, description: "Representative index of case activity in the jurisdiction." },
                      complianceCostIndex: { type: Type.NUMBER, description: "Perceived regulatory barrier/compliance friction index (1 to 100)." }
                    }
                  }
                },
                topicBreakdown: {
                  type: Type.ARRAY,
                  description: "Percentage distribution of legal arguments or sub-topics within recent court disputes.",
                  items: {
                    type: Type.OBJECT,
                    required: ["category", "percentage", "caseCount"],
                    properties: {
                      category: { type: Type.STRING, description: "Sub-doctrinal category or core legal argument." },
                      percentage: { type: Type.NUMBER, description: "Percentage of reviewed litigation (0-100)." },
                      caseCount: { type: Type.NUMBER, description: "Representative case/scholarly density volume." }
                    }
                  }
                }
              }
            },
            comparativeJurisdictions: {
              type: Type.ARRAY,
              description: "Rigorous global comparison table matching statutory frameworks, reach, philosophy, and compliance bottlenecks.",
              items: {
                type: Type.OBJECT,
                required: ["jurisdictionName", "regulatoryFramework", "extraterritorialReach", "fundamentalPhilosophy", "modernFriction"],
                properties: {
                  jurisdictionName: { type: Type.STRING, description: "E.g., 'United States (Delaware/Federal)', 'EU (Council/Parliament)'." },
                  regulatoryFramework: { type: Type.STRING, description: "Leading statutes, directives, or constitutional provisions." },
                  extraterritorialReach: {
                    type: Type.STRING,
                    description: "Level of external claim of authority.",
                    enum: ["Low", "Medium", "High"]
                  },
                  fundamentalPhilosophy: { type: Type.STRING, description: "Jurisprudential doctrine (e.g. Rights-centric, laissez-faire, state interventionist)." },
                  modernFriction: { type: Type.STRING, description: "The single most potent modern compliance hurdle or corporate pain point." }
                }
              }
            },
            emergingFrictionPoints: {
              type: Type.ARRAY,
              description: "Forward-looking risks, disruptive tech triggers, unexamined gaps, and Supreme Court dockets.",
              items: {
                type: Type.OBJECT,
                required: ["title", "category", "scholarlyThesis", "disruptionLevel", "hypotheticalScenario"],
                properties: {
                  title: { type: Type.STRING, description: "E.g., 'The Smart-Contract Sovereignty Crisis' or 'Quantum-Era Cryptographic Standard Disputes'." },
                  category: { type: Type.STRING, description: "E.g., 'Computational Autonomy', 'Statutory Obsolescence'." },
                  scholarlyThesis: { type: Type.STRING, description: "An open research thesis prompt suited for a doctoral dissertation." },
                  disruptionLevel: {
                    type: Type.STRING,
                    description: "Urgency and level of system-wide disruption.",
                    enum: ["Critical", "High", "Medium"]
                  },
                  hypotheticalScenario: { type: Type.STRING, description: "A concrete hypothetical litigation scenario modeling this clash of law." }
                }
              }
            },
            academicSyntheses: {
              type: Type.STRING,
              description: "A summary meta-analysis suggesting three (3) highly innovative academic research methodology blueprints for a PhD dissertation on this topic."
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No payload returned from the Google GenAI Engine.");
    }

    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Error generating dossier:", error);
    res.status(500).json({
      error: error.message || "An error occurred while generating the legal research dossier.",
      raw: error.toString()
    });
  }
});

// 2. API: Scholar Dialogue / Deep-Dive Assistant
app.post("/api/deep-dive", async (req: Request, res: Response) => {
  try {
    const { topic, query, dossierContext, chatHistory } = req.body;
    if (!query || typeof query !== "string" || !query.trim()) {
      res.status(400).json({ error: "A valid philosophical or statutory query is required." });
      return;
    }

    const ai = getGeminiClient();

    // Prepare history and system instruction
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

    const formattedHistory = (chatHistory || []).map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    // Generate non-streaming response
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...formattedHistory,
        { text: `Candidate Query: "${query.trim()}"` }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in deep-dive dialog:", error);
    res.status(500).json({
      error: error.message || "An error occurred during academic research deep-dive.",
      raw: error.toString()
    });
  }
});

// Serve frontend assets based on environment
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Core Intelligence Engine active on port ${PORT}`);
  });
}

initServer().catch((err) => {
  console.error("Critical: Failed to boot Legal Scholar full-stack server.", err);
});
