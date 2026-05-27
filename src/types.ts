export interface DoctrinalFrictionPoint {
  pillar: string;
  conflict: string;
  precedent: string;
  critique: string;
}

export interface TimelineEvent {
  yearOrEra: string;
  shiftType: "Paradigm Shift" | "Legislative Catalyst" | "Judicial Milestone" | "Doctrinal Pivot";
  title: string;
  description: string;
}

export interface ActivityMetric {
  year: number;
  index_score: number;
  volume: number;
}

export interface JurisdictionMetric {
  jurisdiction: string;
  winRate: number; // percentage
  litigationVolume: number;
  complianceCostIndex: number; // 1 - 100
}

export interface TopicBreakdownMetric {
  category: string;
  percentage: number;
  caseCount: number;
}

export interface EmpiricalData {
  trendLine: ActivityMetric[];
  jurisdictionMetrics: JurisdictionMetric[];
  topicBreakdown: TopicBreakdownMetric[];
}

export interface ComparativeJurisdiction {
  jurisdictionName: string;
  regulatoryFramework: string;
  extraterritorialReach: "Low" | "Medium" | "High";
  fundamentalPhilosophy: string;
  modernFriction: string;
}

export interface EmergingFrictionPoint {
  title: string;
  category: string;
  scholarlyThesis: string;
  disruptionLevel: "Critical" | "High" | "Medium";
  hypotheticalScenario: string;
}

export interface LegalDossier {
  topic: string;
  taxonomy: string;
  jurisprudentialNexus: string;
  doctrinalFrictionPoints: DoctrinalFrictionPoint[];
  chronologicalEvolution: TimelineEvent[];
  empiricalData: EmpiricalData;
  comparativeJurisdictions: ComparativeJurisdiction[];
  emergingFrictionPoints: EmergingFrictionPoint[];
  academicSyntheses: string; // Additional meta commentary or research question ideas
}

export interface ChatMessage {
  id: string;
  sender: "user" | "scholar";
  text: string;
  timestamp: string;
  relatedDossierSection?: string;
}

export interface PresetTopic {
  title: string;
  category: string;
  abstract: string;
}
