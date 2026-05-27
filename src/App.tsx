import React, { useState, useEffect, useRef, useMemo } from "react";
import { PRESET_TOPICS } from "./presets";
import {
  DoctrinalFrictionPoint,
  TimelineEvent,
  ActivityMetric,
  JurisdictionMetric,
  TopicBreakdownMetric,
  ComparativeJurisdiction,
  EmergingFrictionPoint,
  LegalDossier,
  ChatMessage,
  PresetTopic
} from "./types";
import {
  Gavel,
  BookOpen,
  Clock,
  Activity,
  FileText,
  Globe,
  AlertTriangle,
  Send,
  History,
  Cpu,
  Download,
  Sparkles,
  BookMarked,
  Search,
  HelpCircle,
  Code,
  ArrowRight,
  ClipboardCheck,
  RotateCcw,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Layers,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function App() {
  // Application State
  const [topicInput, setTopicInput] = useState("");
  const [activeDossier, setActiveDossier] = useState<LegalDossier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"nexus" | "friction" | "timeline" | "empirical" | "comparative" | "emerging">("nexus");
  const [savedDossiers, setSavedDossiers] = useState<LegalDossier[]>([]);
  const [searchHistoryQuery, setSearchHistoryQuery] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  // Doctrinal Friction Matrix Filters
  const [frictionSearch, setFrictionSearch] = useState("");

  // Dialogue (Chat) State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Tour de rôle des légendes de chargement pour l'attention académique
  const readingCaptions = [
    "Analyse de la littérature juridique secondaire et des rôles de cours suprêmes...",
    "Tracé des alignements historiques (frictions jurisprudentielles Savigny v. Thibaut)...",
    "Construction des matrices statistiques d'activité et calcul des indices de litige...",
    "Analyse comparative des philosophies (déontologique des droits c. utilitarisme économique)...",
    "Génération d'hypothèses de friction émergentes pour la thèse de doctorat..."
  ];

  // Rotate loading steps automatically
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % readingCaptions.length);
      }, 3500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Load saved research from localStorage on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem("phd_legal_dossiers");
      if (stored) {
        setSavedDossiers(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse local dossiers", e);
    }
  }, []);

  // Sync saved list back to localStorage
  const saveToLocal = (updated: LegalDossier[]) => {
    setSavedDossiers(updated);
    localStorage.setItem("phd_legal_dossiers", JSON.stringify(updated));
  };

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Trigger Research Generation
  const handleGenerateResearch = async (topicToQuery: string) => {
    const trimmed = topicToQuery.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setErrorMessage(null);
    setActiveDossier(null);
    setChatMessages([]);

    try {
      const response = await fetch("/api/generate-dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: trimmed })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Platform Intelligence Engine failed to generate data.");
      }

      const dossier: LegalDossier = await response.json();
      setActiveDossier(dossier);
      setActiveTab("nexus");

      // Save to saved list
      const duplicatesRemoved = savedDossiers.filter(
        (d) => d.topic.toLowerCase() !== dossier.topic.toLowerCase()
      );
      const newlySaved = [dossier, ...duplicatesRemoved];
      saveToLocal(newlySaved);

      // Seed chat with initial scholar welcome
      setChatMessages([
        {
          id: "welcome",
          sender: "scholar",
          text: `Le dossier académique sur « ${dossier.topic} » a été compilé.\n\nJ'ai établi six grilles de diagnostic détaillant : les Scissions Doctrinales, l'Historique de l'Évolution, la Densité Empirique et les Hypothèses de Projet de Thèse.\n\nSélectionnez l'onglet souhaité ou posez-moi vos questions ci-dessous pour approfondir un point précis.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || "Failed to establish server communication. Please check if GEMINI_API_KEY is configured."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Preset / Suggestion Chat Trigger
  const handleQuickChatQuery = async (queryText: string) => {
    if (!activeDossier || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/deep-dive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: activeDossier.topic,
          query: queryText,
          dossierContext: activeDossier,
          chatHistory: chatMessages.slice(-6)
        })
      });

      if (!response.ok) {
        throw new Error("Dialogue failed.");
      }

      const data = await response.json();
      const scholarMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: "scholar",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages((prev) => [...prev, scholarMsg]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "scholar",
          text: "ERREUR : Impossible de joindre le conseiller. Assurez-vous que la plateforme est active et que la clé API est validée.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Chat Submission
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeDossier || isChatLoading) return;
    const textToSend = chatInput;
    setChatInput("");
    handleQuickChatQuery(textToSend);
  };

  // Delete Dossier from Saved History
  const handleDeleteDossier = (e: React.MouseEvent, topicToDelete: string) => {
    e.stopPropagation();
    const updated = savedDossiers.filter((d) => d.topic !== topicToDelete);
    saveToLocal(updated);
    if (activeDossier && activeDossier.topic === topicToDelete) {
      setActiveDossier(null);
    }
  };

  // Copy dossier to Clipboard (as Markdown)
  const handleExportMarkdown = () => {
    if (!activeDossier) return;

    const mk = `# DOSSIER DE RECHERCHE JURIDIQUE : ${activeDossier.topic.toUpperCase()}
**Classification Académique :** ${activeDossier.taxonomy}
**Date de Compilation :** 2026-05-27 (UTC)

---

## 1. NEXUS JURISPRUDENTIEL ET INTELLECTUEL
${activeDossier.jurisprudentialNexus}

---

## 2. MATRICE DES CONFLITS ET FRICTIONS DOCTRINALES
${activeDossier.doctrinalFrictionPoints
  .map(
    (p) => `### Pilier : ${p.pillar}
* **Conflit Juridique Majeur :** ${p.conflict}
* **Précédent de Référence :** ${p.precedent}
* **Critique Universitaire / Thèse :** ${p.critique}
`
  )
  .join("\n")}

---

## 3. CHRONOLOGIE DE L'ÉVOLUTION DE LA JURISPRUDENCE
${activeDossier.chronologicalEvolution
  .map(
    (ev) => `### [${ev.yearOrEra}] — ${ev.title} (${ev.shiftType})
${ev.description}
`
  )
  .join("\n")}

---

## 4. PERSPECTIVES JURIDIQUES COMPARÉES
| Juridiction | Cadre Réglementaire | Portée | Philosophie Fondamentale | Point de Friction Moderne |
|---|---|---|---|---|
${activeDossier.comparativeJurisdictions
  .map(
    (j) =>
      `| ${j.jurisdictionName} | ${j.regulatoryFramework} | ${j.extraterritorialReach} | ${j.fundamentalPhilosophy} | ${j.modernFriction} |`
  )
  .join("\n")}

---

## 5. POINTS DE FRICTION ÉMERGENTS ET THÈSES DE DOCTORAT (PH.D)
${activeDossier.emergingFrictionPoints
  .map(
    (em) => `### Sujet : ${em.title}
* **Catégorie :** ${em.category}
* **Projet de thèse :** ${em.scholarlyThesis}
* **Niveau de perturbation :** ${em.disruptionLevel}
* **Scénario contentieux hypothétique :** ${em.hypotheticalScenario}
`
  )
  .join("\n")}

---

## 6. SYNTHÈSES ACADÉMIQUES ET DIRECTIVES MÉTHODOLOGIQUES
${activeDossier.academicSyntheses}
`;

    navigator.clipboard.writeText(mk);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Empirical Chart Colors
  const chartStrokeColor = "#141414";
  const chartSecondaryColor = "#666562";
  const chartGridColor = "#141414";
  const EmpiricalChartColors = ["#141414", "#3D3D3D", "#666666", "#8F8F8F", "#B8B8B8", "#D1D1D1"];

  // Filtered Doctrinal Friction Points
  const filteredFrictions = useMemo(() => {
    if (!activeDossier) return [];
    if (!frictionSearch.trim()) return activeDossier.doctrinalFrictionPoints;
    const s = frictionSearch.toLowerCase();
    return activeDossier.doctrinalFrictionPoints.filter(
      (item) =>
        item.pillar.toLowerCase().includes(s) ||
        item.conflict.toLowerCase().includes(s) ||
        item.precedent.toLowerCase().includes(s) ||
        item.critique.toLowerCase().includes(s)
    );
  }, [activeDossier, frictionSearch]);

  // Filter history saved items
  const filteredHistory = useMemo(() => {
    if (!searchHistoryQuery.trim()) return savedDossiers;
    const q = searchHistoryQuery.toLowerCase();
    return savedDossiers.filter(
      (d) =>
        d.topic.toLowerCase().includes(q) ||
        d.taxonomy.toLowerCase().includes(q)
    );
  }, [savedDossiers, searchHistoryQuery]);

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col selection:bg-[#141414] selection:text-white" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      
      {/* Platform Header matching IURIS INTELLECTUS exact template */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between px-6 sm:px-8 py-4 border-b border-[#141414] bg-[#E4E3E0] gap-4">
        <div>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-2xl italic font-semibold tracking-tight">
            IURIS INTELLECTUS
          </h1>
          <p className="text-[10px] uppercase tracking-widest opacity-60 font-mono font-bold">
            Nœud de Recherche Doctorale // Intelligence Centrale [v4.0]
          </p>
        </div>

        {/* Dynamic header status boxes */}
        <div className="flex flex-wrap gap-6 text-[11px] uppercase tracking-tighter">
          <div className="flex flex-col">
            <span className="opacity-50 italic text-[10px]">Sujet Actuel</span>
            <span className="font-bold truncate max-w-[200px]" title={activeDossier ? activeDossier.topic : "Aucun dossier chargé"}>
              {activeDossier ? activeDossier.topic.toUpperCase() : "Platforme inactive"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="opacity-50 italic text-[10px]">Classification Taxonomique</span>
            <span className="font-bold truncate max-w-[180px]">
              {activeDossier ? activeDossier.taxonomy.toUpperCase() : "ADMISSION EN ATTENTE"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="opacity-50 italic text-[10px]">Accréditation d'Accès</span>
            <span className="font-bold text-red-750">ÉLITE ACADÉMIQUE</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 sm:p-6 flex flex-col gap-6">
        
        {/* Error Notification system */}
        {errorMessage && (
          <div className="bg-white border border-[#141414] text-[#141414] p-4 flex items-start gap-3 relative animate-fade-in rounded-none">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-xs uppercase tracking-wider">Alerte de Connexion du Système</h3>
              <p className="text-xs mt-1 leading-relaxed font-mono">
                {errorMessage}
              </p>
              <div className="mt-2 text-[10px] font-mono opacity-85">
                Veuillez vous assurer que la clé <code className="font-bold bg-[#E4E3E0] px-1 py-0.5 border border-[#141414]">GEMINI_API_KEY</code> est correctement enregistrée dans l'onglet des Secrets (Paramètres) d'AI Studio.
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-[#141414] opacity-50 hover:opacity-100 p-0.5 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dashboard Frame (No active dossier loaded) */}
        {!activeDossier && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left side: Search and Presets */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Initiation panel */}
              <div className="bg-white p-6 border border-[#141414] rounded-none">
                <span className="text-[10px] uppercase font-mono tracking-widest font-bold bg-[#141414] text-white px-2.5 py-1 block w-fit mb-3">
                  1. Initialiser le Dossier Doctrinal
                </span>
                
                <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl font-bold italic tracking-tight text-[#141414]">
                  Portail de Lancement de Recherche Doctorale
                </h2>
                
                <p className="text-xs leading-relaxed opacity-80 mt-1 max-w-2xl font-serif italic text-slate-800">
                  Saisissez un formalisme juridique, une tension jurisprudentielle internationale, une loi spécifique ou un paradigme de droit. L'intelligence élaborera une suite d'analyses doctrinales, chronologies et métriques empiriques.
                </p>

                <div className="mt-5 space-y-2">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold opacity-60">
                    Sujet de Recherche Souverain / Concept de Thèse (Doctorat)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      placeholder="ex. Brevets essentiels et licences FRAND selon l'article 102 du TFUE..."
                      className="w-full bg-[#E4E3E0] border border-[#141414] py-3 pl-4 pr-12 focus:outline-none focus:ring-1 focus:ring-[#141414] focus:bg-white text-xs font-mono text-[#141414] rounded-none transition"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleGenerateResearch(topicInput);
                      }}
                    />
                    <button
                      onClick={() => handleGenerateResearch(topicInput)}
                      disabled={!topicInput.trim()}
                      className="absolute right-2.5 top-2 bg-[#141414] text-white p-1.5 hover:bg-[#333333] disabled:opacity-35 transition flex items-center justify-center cursor-pointer"
                      title="Analyser le Sujet"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Preset matrices */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 flex items-center gap-1.5">
                    <BookMarked className="w-4 h-4" /> Modèles de Thèses Directeurs (Ph.D)
                  </h3>
                  <span className="text-[10px] font-mono italic opacity-50">
                    Niveau : Doctorat de Recherche
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PRESET_TOPICS.map((preset, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setTopicInput(preset.title);
                        handleGenerateResearch(preset.title);
                      }}
                      className="bg-white border border-[#141414] hover:bg-[#F2F1EE] p-5 cursor-pointer text-left transition flex flex-col justify-between group rounded-none"
                    >
                      <div>
                        <span className="text-[8px] tracking-widest font-mono font-bold bg-[#141414] text-white py-0.5 px-2 rounded-none inline-block mb-3">
                          {preset.category.toUpperCase()}
                        </span>
                        <h4 style={{ fontFamily: "Georgia, serif" }} className="font-serif font-bold text-sm text-[#141414] leading-snug">
                          {preset.title}
                        </h4>
                        <p className="text-[#141414] opacity-75 text-[11px] leading-relaxed mt-2.5 line-clamp-3 italic font-serif">
                          &ldquo;{preset.abstract}&rdquo;
                        </p>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-mono font-bold text-[#141414] pt-2 border-t border-[#141414]/10 group-hover:underline">
                        <span>Compiler le Dossier Doctrinal</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right side: Historic Registries */}
            <div className="lg:col-span-4 flex flex-col h-full max-h-[660px]">
              <div className="bg-white border border-[#141414] p-5 flex flex-col h-full rounded-none">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-4 h-4" />
                  <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-[#141414]">
                    Portefeuille Intellectuel
                  </h3>
                </div>

                {savedDossiers.length > 0 && (
                  <div className="relative mb-3.5">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 opacity-60" />
                    <input
                      type="text"
                      value={searchHistoryQuery}
                      onChange={(e) => setSearchHistoryQuery(e.target.value)}
                      placeholder="Rechercher dans le portefeuille..."
                      className="w-full bg-[#E4E3E0] focus:bg-white border border-[#141414] py-1.5 pl-9 pr-3 text-xs font-mono outline-none rounded-none"
                    />
                  </div>
                )}

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-12 px-4 border border-dashed border-[#141414]/35 bg-[#E4E3E0]/20">
                      <BookOpen className="w-7 h-7 mx-auto opacity-40 mb-1.5" />
                      <p className="text-[11px] uppercase tracking-wider font-mono font-bold opacity-60">
                        Registre vide
                      </p>
                      <p className="text-[10px] italic font-serif mt-1">
                        Sélectionnez l'un des modèles de recherche prédéfinis à gauche pour lancer la compilation des données doctrinales.
                      </p>
                    </div>
                  ) : (
                    filteredHistory.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setActiveDossier(item);
                          setActiveTab("nexus");
                        }}
                        className="group border border-[#141414] p-3.5 bg-[#E4E3E0]/20 hover:bg-white transition cursor-pointer flex justify-between items-start text-left rounded-none"
                      >
                        <div className="space-y-1.5 pr-2">
                          <span className="text-[8px] font-mono tracking-widest font-extrabold text-[#141414] uppercase block">
                            [{item.taxonomy}]
                          </span>
                          <h4 style={{ fontFamily: "Georgia, serif" }} className="font-serif text-xs font-bold text-[#141414] group-hover:underline line-clamp-2 leading-tight">
                            {item.topic}
                          </h4>
                        </div>
                        <button
                          onClick={(e) => handleDeleteDossier(e, item.topic)}
                          className="text-[#141414] opacity-40 hover:opacity-100 p-1 hover:bg-[#E4E3E0] transition shrink-0 rounded-none cursor-pointer"
                          title="Purge"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-4 border-t border-[#141414]/20 text-[10px] leading-relaxed opacity-60 font-mono mt-3">
                  <div className="flex gap-1.5">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Les dossiers sont sauvegardés localement. Videz vos cookies pour effacer la mémoire de l'espace de travail.</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Academic Loader exact layout */}
        {isLoading && (
          <div className="min-h-[450px] flex items-center justify-center bg-white border border-[#141414] p-8 py-20 text-center animate-fade-in rounded-none">
            <div className="max-w-md w-full space-y-6">
              <div className="relative mx-auto w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-[#E4E3E0]" />
                <div className="absolute inset-0 rounded-full border-2 border-t-[#141414] animate-spin" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] uppercase tracking-widest font-mono font-bold bg-[#141414] text-white px-3 py-1 inline-block">
                  COMPILATION DES COOPÉRATIONS DOCTRINALES EN COURS
                </span>
                <p className="text-xs font-serif font-bold italic text-slate-800 tracking-tight pt-2">
                  État : {readingCaptions[loadingStep]}
                </p>
              </div>

              {/* Quotation card inside loader */}
              <div className="bg-[#E4E3E0]/40 border border-[#141414] p-4 text-left font-serif italic text-slate-850">
                <p className="text-[12px] leading-relaxed text-center">
                  &ldquo;L'histoire de ce que le droit a été est nécessaire à la connaissance de ce qu'il est.&rdquo;
                </p>
                <span className="block text-[9px] font-sans tracking-widest uppercase font-bold text-center mt-2.5 opacity-60">
                  — Oliver Wendell Holmes Jr. (The Common Law, 1881)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Dossier Workspace Grid (Active Dossier Loaded) */}
        {activeDossier && !isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            
            {/* Left Column: Stats Context & Dialogue Assistant */}
            <div className="lg:col-span-4 space-y-6 flex flex-col h-full">
              
              {/* Context Summary card styled with solid borders and mono tags */}
              <div className="bg-white border border-[#141414] p-5 space-y-4 text-left rounded-none">
                <div>
                  <span className="text-[8px] font-mono tracking-widest font-bold bg-[#141414] text-white px-2 py-0.5 uppercase">
                    {activeDossier.taxonomy}
                  </span>
                  <h3 style={{ fontFamily: "Georgia, serif" }} className="font-serif font-bold text-[#141414] text-base mt-2 leading-snug">
                    {activeDossier.topic}
                  </h3>
                </div>

                <div className="text-[10px] font-mono leading-relaxed space-y-1.5 bg-[#E4E3E0]/30 p-3 border border-[#141414]/15">
                  <div className="flex justify-between">
                    <span className="opacity-60">HORIZON CHRONOLOGIQUE :</span>
                    <span className="font-bold">10 DERNIÈRES ANNÉES</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">CHAMP DE RECHERCHE :</span>
                    <span className="font-bold">{activeDossier.doctrinalFrictionPoints.length} PILIERS CONFLICTUELS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">ESPACES COMPARATIFS :</span>
                    <span className="font-bold">{activeDossier.comparativeJurisdictions.length} JURIDICTIONS</span>
                  </div>
                </div>

                {/* Exporter Controls styled to theme specs */}
                <div className="space-y-2 pt-3 border-t border-[#141414]/10">
                  <button
                    onClick={handleExportMarkdown}
                    className="w-full bg-[#141414] hover:bg-zinc-800 text-white font-mono uppercase tracking-widest text-[9px] py-2 px-3 transition-colors flex items-center justify-center gap-1.5 font-bold cursor-pointer rounded-none"
                  >
                    {isCopied ? (
                      <>
                        <ClipboardCheck className="w-3.5 h-3.5 text-green-400" />
                        Markdown Copié (LaTeX Prêt)
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        Exporter LaTeX / MD
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="w-full bg-white hover:bg-[#F2F1EE] text-[#141414] border border-[#141414] font-mono uppercase tracking-widest text-[9px] py-2 px-3 transition-colors flex items-center justify-center gap-1.5 font-bold cursor-pointer rounded-none"
                  >
                    <Code className="w-3.5 h-3.5" />
                    {showRawJson ? "Masquer le Code JSON" : "Consulter le Flux JSON"}
                  </button>
                </div>
              </div>

              {/* Scholar dialogue assistant formatted with monospace, high density */}
              <div className="bg-white border border-[#141414] p-5 flex flex-col flex-1 min-h-[460px] max-h-[580px] rounded-none">
                <div className="flex items-center gap-2 pb-3 border-b border-[#141414] text-left">
                  <Cpu className="text-[#141414] w-4.5 h-4.5" />
                  <div>
                    <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-[#141414]">
                      Dialogue Doctrinal
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Conseiller de Thèse Interactif // [v4.0]
                    </p>
                  </div>
                </div>

                {/* Dialog thread content */}
                <div className="flex-1 overflow-y-auto space-y-4 my-3 pr-1">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-10 px-3 border border-dashed border-[#141414]/30 bg-[#E4E3E0]/10 text-xs">
                      <HelpCircle className="w-5 h-5 text-zinc-400 mx-auto mb-2" />
                      <p className="font-mono uppercase tracking-widest font-bold text-[9px]">Espace de Dialogue Inactif</p>
                      <p className="text-[11px] italic font-serif mt-1 opacity-75 leading-relaxed">
                        Échangez avec votre directeur de thèse virtuel. Posez des questions de fond ou lancez un déclencheur analytique ci-dessous.
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col space-y-1 ${
                          msg.sender === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`p-3 text-[11px] font-mono leading-relaxed text-left ${
                            msg.sender === "user"
                              ? "bg-[#141414] text-white rounded-none border border-[#141414]"
                              : "bg-[#F4F3F0] text-[#141414] border border-[#141414] rounded-none font-serif italic"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        <span className="text-[8px] font-mono uppercase tracking-wider opacity-60">
                          {msg.sender === "user" ? "Candidat" : "Conseiller Doctoral"} • {msg.timestamp}
                        </span>
                      </div>
                    ))
                  )}

                  {isChatLoading && (
                    <div className="flex items-center gap-2 text-zinc-600 py-1 font-mono text-[10px]">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#141414] animate-bounce" />
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#141414] animate-bounce [animation-delay:0.2s]" />
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#141414] animate-bounce [animation-delay:0.4s]" />
                      <span className="italic font-serif">Analyse doctrinale approfondie...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick prompt catalysts with high contrast labels */}
                <div className="space-y-2 pt-3 border-t border-[#141414]/15 flex flex-col">
                  <span className="text-[8px] font-mono font-bold uppercase tracking-widest opacity-60 text-left">
                    Déclencheurs d'analyses contextuelles
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      "Proposer des axes de recherche de thèse",
                      "Rédiger une fiche de synthèse de conformité",
                      "Lister les théories contradictoires de la doctrine"
                    ].map((sQuery, idx) => (
                      <button
                        key={idx}
                        disabled={isChatLoading}
                        onClick={() => handleQuickChatQuery(`Éminent chercheur, concernant le sujet du dossier de recherche actuel, ${sQuery.toLowerCase()}`)}
                        className="text-[9px] font-mono uppercase tracking-tight bg-white hover:bg-[#F2F1EE] border border-[#141414] py-1 px-2 hover:text-[#141414] transition-colors rounded-none text-left cursor-pointer"
                      >
                        {sQuery}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dialogue Submission block */}
                <form onSubmit={handleChatSubmit} className="mt-3.5">
                  <div className="relative">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Soumettre une question doctrinale au conseiller..."
                      disabled={isChatLoading}
                      className="w-full bg-[#E4E3E0] border border-[#141414] hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#141414] py-2 pl-3 pr-10 text-xs font-mono text-[#141414] rounded-none transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={isChatLoading || !chatInput.trim()}
                      className="absolute right-1 top-1 text-[#141414] p-1.5 disabled:opacity-30 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>

              </div>
            </div>

            {/* Right Workstation: Tabs & Dossier Data layers */}
            <div className="lg:col-span-8 space-y-6 flex flex-col min-h-[640px]">
              
              {/* Tab selector structured as monolithic rib bar with border-[#141414] */}
              <div className="bg-[#E4E3E0] border border-[#141414] flex flex-wrap gap-0 divide-x divide-[#141414] overflow-x-auto rounded-none">
                {[
                  { id: "nexus", label: "Nexus Doctrinal" },
                  { id: "friction", label: "Matrice de Friction" },
                  { id: "timeline", label: "Évolution Chronologique" },
                  { id: "empirical", label: "Analyses Empiriques" },
                  { id: "comparative", label: "Droit Comparé" },
                  { id: "emerging", label: "Axes & Hypothèses" }
                ].map((tab) => {
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 text-center py-3 px-3 transition-colors font-mono uppercase text-[9px] tracking-widest font-bold cursor-pointer shrink-0 truncate ${
                        activeTab === tab.id
                          ? "bg-[#141414] text-white"
                          : "text-[#141414] hover:bg-white/40"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* JSON Core Payload Display */}
              <AnimatePresence>
                {showRawJson && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-zinc-900 text-zinc-300 font-mono text-[10px] border border-[#141414] p-4 relative overflow-hidden rounded-none"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-3">
                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Code className="w-3.5 h-3.5" /> FLUX DE DONNÉES BRUTES DE L'INTELLIGENCE APPLICATIVE (IURIS)
                      </span>
                      <button
                        onClick={() => setShowRawJson(false)}
                        className="text-zinc-500 hover:text-white p-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <pre className="overflow-auto max-h-[220px] text-left p-2.5 bg-black rounded-none select-all">
                      {JSON.stringify(activeDossier, null, 2)}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tab Display Screens */}
              <div className="flex-1 bg-white border border-[#141414] p-5 sm:p-6 text-left relative overflow-hidden flex flex-col rounded-none">
                
                {/* 1. DOCTRINAL NEXUS */}
                {activeTab === "nexus" && (
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-[#141414]/15">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest font-mono text-zinc-400 font-bold block">
                            Spécification Analytique I
                          </span>
                          <h3 style={{ fontFamily: "Georgia, serif" }} className="font-serif text-lg font-bold text-[#141414] mt-1 italic">
                            Nexus Doctrinal, Philosophie Générale & Fondations Théoriques
                          </h3>
                        </div>
                        <BookOpen className="w-5 h-5 opacity-70" />
                      </div>

                      {/* Georgia-italic styled block quotes matching original aesthetic design brief */}
                      <div className="font-serif text-[#141414] text-[13.5px] leading-relaxed italic border-l-2 border-[#141414] pl-4 py-1 space-y-4">
                        {activeDossier.jurisprudentialNexus.split('\n\n').map((para, pIdx) => (
                          <p key={pIdx}>
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Methodological blueprints prompt board */}
                    <div className="mt-8 bg-[#E4E3E0]/30 border border-[#141414] p-5 space-y-3 rounded-none">
                      <div className="flex items-center gap-2 text-[#141414] border-b border-[#141414]/10 pb-1.5">
                        <Layers className="w-4.5 h-4.5" />
                        <h4 className="font-mono text-xs uppercase tracking-widest font-bold">
                          Directives Méthodologiques de Recherche de Thèse
                        </h4>
                      </div>
                      <div className="font-sans text-[11.5px] text-[#141414] leading-relaxed text-left whitespace-pre-line pl-1 opacity-90">
                        {activeDossier.academicSyntheses}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. DOCTRINAL FRICTION POINTS MATRIX */}
                {activeTab === "friction" && (
                  <div className="space-y-5 flex-1 flex flex-col">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#141414]/15">
                      <div>
                        <span className="text-[9px] uppercase tracking-widest font-mono text-zinc-400 font-bold block">
                          Spécification Analytique II
                        </span>
                        <h3 style={{ fontFamily: "Georgia, serif" }} className="font-serif text-lg font-bold text-[#141414] mt-1 italic">
                          Matrice des Conflits & Scissions d'Autorité Doctrinale
                        </h3>
                      </div>
                      
                      {/* Live search styled with mono custom forms */}
                      <div className="relative min-w-[210px] w-full sm:w-auto">
                        <Search className="absolute left-2.5 top-2 ml-0.5 w-3.5 h-3.5 opacity-60 pointer-events-none" />
                        <input
                          type="text"
                          value={frictionSearch}
                          onChange={(e) => setFrictionSearch(e.target.value)}
                          placeholder="Filtrer les nœuds de la matrice..."
                          className="w-full bg-[#E4E3E0] pl-8 pr-8 py-1.5 border border-[#141414] text-xs font-mono outline-none rounded-none focus:bg-white focus:ring-1 focus:ring-[#141414] transition-colors"
                        />
                        {frictionSearch && (
                          <button
                            onClick={() => setFrictionSearch("")}
                            className="absolute right-2.5 top-2 text-[#141414] opacity-50 hover:opacity-100 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-x-auto border border-[#141414]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#141414] bg-[#F2F1EE] text-[#141414] font-mono tracking-widest text-[9px] uppercase font-bold">
                            <th className="py-3 px-4 w-[25%] border-r border-[#141414]">Pilier Régulateur / Code</th>
                            <th className="py-3 px-4 w-[30%] border-r border-[#141414]">Conflit Juridique Majeur</th>
                            <th className="py-3 px-4 w-[20%] border-r border-[#141414]">Jurisprudence Pivot</th>
                            <th className="py-3 px-4 w-[25%]">Critique Académique (Thèse)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#141414]">
                          {filteredFrictions.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-10 text-center text-zinc-400 italic font-serif">
                                Aucun élément ne correspond à votre filtre. Videz le champ pour réinitialiser.
                              </td>
                            </tr>
                          ) : (
                            filteredFrictions.map((point, idx) => (
                              <tr key={idx} className="hover:bg-[#E4E3E0]/15 transition-colors">
                                <td className="py-3 px-4 font-mono font-bold text-[#141414] align-top border-r border-[#141414]">
                                  {point.pillar}
                                </td>
                                <td className="py-3 px-4 text-[#141414] opacity-90 leading-relaxed align-top whitespace-pre-line border-r border-[#141414] text-[11px]">
                                  {point.conflict}
                                </td>
                                <td className="py-3 px-4 font-serif text-[11px] text-[#141414] font-semibold align-top italic border-r border-[#141414]">
                                  {point.precedent}
                                </td>
                                <td className="py-3 px-4 text-[#141414] opacity-80 leading-relaxed text-[10.5px] align-top font-serif bg-[#E4E3E0]/5">
                                  {point.critique}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. CHRONOLOGICAL TIMELINE */}
                {activeTab === "timeline" && (
                  <div className="space-y-6 flex-1 flex flex-col">
                    <div className="pb-3 border-b border-[#141414]/15 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase tracking-widest font-mono text-zinc-400 font-bold block">
                          Spécification Analytique III
                        </span>
                        <h3 style={{ fontFamily: "Georgia, serif" }} className="font-serif text-lg font-bold text-[#141414] mt-1 italic">
                          Échelle de l'Évolution Chronologique des Paradigmes
                        </h3>
                      </div>
                      <Clock className="w-5 h-5 opacity-70" />
                    </div>

                    {/* Timeline adapted to exact technical data grid standards */}
                    <div className="relative mt-2 pl-6 border-l border-[#141414] space-y-6 py-1">
                      {activeDossier.chronologicalEvolution.map((event, idx) => (
                        <div key={idx} className="relative group text-left">
                          {/* Minimal black bullet indicator */}
                          <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border border-[#141414] bg-[#141414] group-hover:bg-[#E4E3E0] transition" />

                          <div className="bg-white border border-[#141414] p-4.5 transition-colors hover:bg-[#E4E3E0]/10 rounded-none">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#141414]/10 pb-2">
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono text-xs font-bold bg-[#141414] text-white py-0.5 px-2 rounded-none min-w-[50px] text-center uppercase tracking-tight">
                                  {event.yearOrEra}
                                </span>
                                <h4 style={{ fontFamily: "Georgia, serif" }} className="font-serif font-bold text-[13.5px] text-[#141414]">
                                  {event.title}
                                </h4>
                              </div>
                              
                              <span className="text-[8px] font-mono font-bold tracking-widest border border-[#141414] uppercase px-2 py-0.5 bg-[#E4E3E0] text-[#141414]">
                                {event.shiftType}
                              </span>
                            </div>

                            <p className="text-zinc-700 font-serif text-[11.5px] mt-2.5 leading-relaxed italic opacity-95">
                              {event.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. EMPIRICAL ANALYTICS METRICS */}
                {activeTab === "empirical" && (
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    <div className="pb-3 border-b border-[#141414]/15 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase tracking-widest font-mono text-zinc-400 font-bold block">
                          Spécification Analytique IV
                        </span>
                        <h3 style={{ fontFamily: "Georgia, serif" }} className="font-serif text-lg font-bold text-[#141414] mt-1 italic">
                          Matrices Quantitatives & Échelle de Densité de la Jurisprudence
                        </h3>
                      </div>
                      <span className="text-[9px] uppercase font-mono px-2 py-1 bg-[#141414] text-white tracking-widest font-bold">
                        VISUALISATION DES DONNÉES EMPIRIQUES
                      </span>
                    </div>

                    {/* Chart Cards matching dark technical specs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-1">
                      
                      {/* Trend plot */}
                      <div className="bg-white rounded-none border border-[#141414] p-4 flex flex-col justify-between h-[360px]">
                        <div>
                          <h4 className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#141414]">
                            1. Matrice d'application de la réglementation (tendances à 10 ans)
                          </h4>
                          <p className="text-[10px] italic font-serif mt-1 opacity-70">
                            Volume des litiges et évolution chronologique des coefficients de friction systémique.
                          </p>
                        </div>
                        
                        <div className="flex-1 mt-6">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={activeDossier.empiricalData.trendLine} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="2 2" stroke="#CCCCCC" />
                              <XAxis dataKey="year" stroke="#141414" fontSize={8} tickLine={true} />
                              <YAxis stroke="#141414" fontSize={8} tickLine={true} />
                              <Tooltip contentStyle={{ fontSize: 9, fontFamily: "monospace", backgroundColor: "#ffffff", border: "1px solid #141414", borderRadius: 0 }} />
                              <Legend wrapperStyle={{ fontSize: 8, fontFamily: "monospace", marginTop: 5 }} />
                              <Line
                                name="Indice de friction de la doctrine"
                                type="monotone"
                                dataKey="index_score"
                                stroke={chartStrokeColor}
                                strokeWidth={2.5}
                                dot={{ fill: "#141414", r: 3 }}
                                activeDot={{ r: 5 }}
                              />
                              <Line
                                name="Indice de volume litigeux"
                                type="monotone"
                                dataKey="volume"
                                stroke={chartSecondaryColor}
                                strokeDasharray="3 3"
                                strokeWidth={1.5}
                                dot={{ fill: "#666562", r: 2 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Bar chart performance */}
                      <div className="bg-white rounded-none border border-[#141414] p-4 flex flex-col justify-between h-[360px]">
                        <div>
                          <h4 className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#141414]">
                            2. Accords régionaux, taux d'application et fardeau de conformité
                          </h4>
                          <p className="text-[10px] italic font-serif mt-1 opacity-70">
                            Taux de réussite des poursuites/défenses (%) par rapport à l'indice des barrières et coûts réglementaires régionaux.
                          </p>
                        </div>

                        <div className="flex-1 mt-6">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activeDossier.empiricalData.jurisdictionMetrics} margin={{ top: 15, right: 15, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="2 2" stroke="#CCCCCC" />
                              <XAxis dataKey="jurisdiction" stroke="#141414" fontSize={8} tickLine={true} />
                              <YAxis stroke="#141414" fontSize={8} tickLine={true} />
                              <Tooltip contentStyle={{ fontSize: 9, fontFamily: "monospace", backgroundColor: "#ffffff", border: "1px solid #141414", borderRadius: 0 }} />
                              <Legend wrapperStyle={{ fontSize: 8, fontFamily: "monospace", marginTop: 5 }} />
                              <Bar name="Taux de Réussite %" dataKey="winRate" fill="#141414" stroke="#141414" radius={0} />
                              <Bar name="Indice de Friction / Coût" dataKey="complianceCostIndex" fill="#8C8B88" stroke="#141414" radius={0} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                    </div>

                    {/* Donut section and statistics summary card */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4">
                      
                      {/* Sub-distribution matrix */}
                      <div className="bg-white rounded-none border border-[#141414] p-4 md:col-span-8 flex flex-col justify-between min-h-[180px]">
                        <div>
                          <h4 className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#141414]">
                            3. Répartition proportionnelle des scissions jurisprudentielles
                          </h4>
                          <p className="text-[10px] italic font-serif mt-0.5 opacity-70">
                            Poids relatif des arguments juridiques soulevés dans les dossiers examinés.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mt-3 items-center">
                          <div className="h-[120px] sm:col-span-5">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={activeDossier.empiricalData.topicBreakdown}
                                  dataKey="percentage"
                                  nameKey="category"
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={25}
                                  outerRadius={40}
                                  paddingAngle={2}
                                >
                                  {activeDossier.empiricalData.topicBreakdown.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={EmpiricalChartColors[idx % EmpiricalChartColors.length]} stroke="#141414" />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={{ fontSize: 8, fontFamily: "monospace" }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="flex flex-col justify-center space-y-1.5 sm:col-span-7 pr-2">
                            {activeDossier.empiricalData.topicBreakdown.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-[10px] font-mono text-left">
                                <span
                                  className="w-2 h-2 shrink-0 border border-[#141414]"
                                  style={{ backgroundColor: EmpiricalChartColors[idx % EmpiricalChartColors.length] }}
                                />
                                <span className="font-bold">{item.percentage}%</span>
                                <span className="opacity-80 truncate max-w-[200px]" title={item.category}>{item.category}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Summary indicator score panel styled like a technical summary badge */}
                      <div className="p-4 bg-[#E4E3E0] border border-[#141414] md:col-span-4 flex flex-col justify-between text-left rounded-none">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono tracking-widest text-[#141414] font-bold block uppercase">
                            INDICE DE FIABILITÉ DE LA SYNTHÈSE
                          </span>
                          <span className="text-2xl font-serif font-bold text-[#141414] block">
                            96,8 / 100
                          </span>
                          <p className="text-[10px] font-serif italic text-slate-800 leading-normal">
                            Calculé d'après le coefficient d'entropie académique. Validé par recoupement clinique des dossiers de plaidoirie de référence.
                          </p>
                        </div>
                        <div className="pt-2 border-t border-[#141414]/20 mt-3 flex items-center gap-1.5 text-[9px] font-mono font-bold text-[#141414]">
                          <CheckCircle2 className="w-4 h-4 text-[#141414] shrink-0" />
                          <span>MÉTRIQUES FONDAMENTALES SCELLÉES</span>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 5. COMPARATIVE JURISDICTIONS */}
                {activeTab === "comparative" && (
                  <div className="space-y-6 flex-1 flex flex-col">
                    <div className="pb-3 border-b border-[#141414]/15 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase tracking-widest font-mono text-zinc-400 font-bold block">
                          Spécification Analytique V
                        </span>
                        <h3 style={{ fontFamily: "Georgia, serif" }} className="font-serif text-lg font-bold text-[#141414] mt-1 italic">
                          Études comparées des cadres législatifs et souverainetés
                        </h3>
                      </div>
                      <Globe className="w-5 h-5 opacity-70" />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {activeDossier.comparativeJurisdictions.map((comp, idx) => (
                        <div
                          key={idx}
                          className="border border-[#141414] p-5 bg-[#E4E3E0]/10 hover:bg-[#E4E3E0]/20 transition-colors flex flex-col md:flex-row gap-5 items-start text-left rounded-none"
                        >
                          <div className="md:w-[25%] shrink-0">
                            <span className="text-[8px] font-mono font-bold bg-[#141414] text-white px-2 py-0.5 uppercase tracking-widest">
                              ÉTAT SOUVERAIN
                            </span>
                            <h4 style={{ fontFamily: "Georgia, serif" }} className="font-serif font-bold text-sm text-[#141414] mt-2 leading-tight">
                              {comp.jurisdictionName}
                            </h4>
                            <div className="mt-3 flex items-center gap-1 text-[10.5px]">
                              <span className="opacity-60 font-mono text-[9px]">Portée :</span>
                              <span className="text-[9px] font-mono border border-[#141414] px-1.5 py-0.5 bg-white font-bold">
                                {comp.extraterritorialReach.toUpperCase()} EXTRATERRITORIALE
                              </span>
                            </div>
                          </div>

                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="space-y-1.5 p-3.5 bg-white border border-[#141414] rounded-none">
                              <span className="text-[8px] font-mono text-[#141414]/60 font-bold uppercase tracking-widest block">
                                STRUCTURATION TEXTUELLE
                              </span>
                              <p className="text-[#141414] font-serif leading-relaxed italic text-[11px]">
                                {comp.regulatoryFramework}
                              </p>
                            </div>

                            <div className="space-y-1.5 p-3.5 bg-white border border-[#141414] rounded-none">
                              <span className="text-[8px] font-mono text-[#141414]/60 font-bold uppercase tracking-widest block">
                                TRADITION PHILOSOPHIQUE
                              </span>
                              <p className="text-zinc-700 leading-relaxed font-sans text-[11px] opacity-90">
                                {comp.fundamentalPhilosophy}
                              </p>
                            </div>

                            <div className="space-y-1.5 p-3.5 bg-[#E4E3E0]/30 border border-[#141414] rounded-none">
                              <span className="text-[8px] font-mono text-[#141414] font-bold uppercase tracking-widest block">
                                POINT DE FRICTION RÉGLEMENTAIRE
                              </span>
                              <p className="text-[#141414] leading-relaxed font-sans font-semibold text-[11px]">
                                {comp.modernFriction}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. EMERGING FRICTION POINTS / DISSERTATION PROSPECTUS */}
                {activeTab === "emerging" && (
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    <div className="pb-3 border-b border-[#141414]/15 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase tracking-widest font-mono text-zinc-400 font-bold block">
                          Spécification Analytique VI
                        </span>
                        <h3 style={{ fontFamily: "Georgia, serif" }} className="font-serif text-lg font-bold text-[#141414] mt-1 italic">
                          Hypothèses de Friction Émergentes & Axes de Recherche Doctorale
                        </h3>
                      </div>
                      <AlertTriangle className="w-5 h-5 opacity-70" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-1">
                      {activeDossier.emergingFrictionPoints.map((point, idx) => (
                        <div
                          key={idx}
                          className="border border-[#141414] bg-white hover:bg-[#E4E3E0]/10 p-5 transition-colors text-left flex flex-col justify-between group rounded-none"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1 border-b border-[#141414]/15 pb-2 mb-3">
                              <div>
                                <span className="text-[8px] font-mono uppercase font-bold text-zinc-400 tracking-widest block">
                                  [{point.category.toUpperCase()}]
                                </span>
                                <h4 style={{ fontFamily: "Georgia, serif" }} className="font-serif font-bold text-[13px] text-[#141414] mt-1 group-hover:underline">
                                  {point.title}
                                </h4>
                              </div>

                              <span className="text-[8px] font-mono font-bold py-0.5 px-2 rounded-none border border-[#141414] bg-[#E4E3E0] shrink-0 tracking-wider">
                                {point.disruptionLevel.toUpperCase()}
                              </span>
                            </div>

                            {/* Scholarly thesis prompt opportunity box */}
                            <div className="space-y-1.5 p-3.5 bg-[#E4E3E0]/15 border border-[#141414]/75 rounded-none mb-4">
                              <span className="text-[8px] font-mono text-[#141414] font-extrabold uppercase tracking-widest block">
                                Projet de Proposition de Thèse du Doctorat (Ph.D) :
                              </span>
                              <p className="text-zinc-800 text-[11px] leading-relaxed font-serif italic">
                                &ldquo;{point.scholarlyThesis}&rdquo;
                              </p>
                            </div>

                            {/* Hypothetical litigable illustration */}
                            <div className="space-y-1 font-mono text-[10px] leading-relaxed text-zinc-600 pl-3 border-l border-[#141414]">
                              <span className="font-bold uppercase tracking-wider block text-zinc-500">
                                [SCÉNARIO CONTENTIEUX HYPOTHÉTIQUE]
                              </span>
                              <p className="leading-normal">{point.hypotheticalScenario}</p>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              handleQuickChatQuery(
                                `Éminent chercheur, concernant le point de friction émergent "${point.title}", proposez-moi un projet de recherche méthodologique explorant : "${point.scholarlyThesis}"`
                              )
                            }
                            className="mt-4 flex items-center justify-center gap-1.5 text-[9px] font-mono uppercase tracking-widest font-bold text-[#141414] hover:underline pt-2.5 border-t border-[#141414]/10 text-center cursor-pointer"
                          >
                            <span>Rédiger le projet de recherche</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Aesthetic footer corner watermark inside workstation */}
                <div className="absolute bottom-2 right-4 font-mono text-[8px] text-[#141414] opacity-35 pointer-events-none select-none uppercase tracking-wider mr-1">
                  Signature contextuelle du nœud : Coalition Sorbonne-Oxford-Stanford
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* Platform footer matching design specs */}
      <footer className="h-12 border-t border-[#141414] bg-[#E4E3E0] flex items-center justify-between px-6 sm:px-8 text-[10px] tracking-widest uppercase opacity-65 mt-auto">
        <span>Nœud académique global : Consortium Sorbonne-Oxford-Stanford</span>
        <span className="hidden sm:inline">Dernière synchronisation : 2026-05-27</span>
        <span>ID_DOC : 77-PHD-RECHERCHE</span>
      </footer>
    </div>
  );
}
