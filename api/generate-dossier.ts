import { GoogleGenAI, Type } from "@google/genai";

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

    res.status(200).json(JSON.parse(text));
  } catch (error: any) {
    console.error("Error generating dossier on Vercel:", error);
    res.status(500).json({
      error: error.message || "An error occurred while generating the legal research dossier.",
      raw: error.toString()
    });
  }
}
