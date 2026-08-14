export type Plan = 'FREE' | 'SAMURAI' | 'SENSEI';

export type PlanFeature = keyof typeof PLAN_LIMITS.FREE;

export const PLAN_LIMITS = {
  FREE: {
    notebooks: 3,
    chatMessagesPerDay: 20,
    flashcards: true,
    flashcardsAI: false,
    pomodoro: true,
    dashboardFull: false,
    tasks: true,
    goals: true,
    calendar: true,
    battle: false,
    preTest: false,
    microLesson: false,
    teach: false,
    roadmapAI: false,
    missions: false,
    discover: false,
    brain: false,
    spacedRepetition: false,
    exportNotes: false,
    autoSummaries: false,
    statsAdvanced: false,
  },
  SAMURAI: {
    notebooks: Infinity,
    chatMessagesPerDay: Infinity,
    flashcards: true,
    flashcardsAI: true,
    pomodoro: true,
    dashboardFull: true,
    tasks: true,
    goals: true,
    calendar: true,
    battle: true,
    preTest: true,
    microLesson: true,
    teach: true,
    roadmapAI: true,
    missions: true,
    discover: true,
    brain: true,
    spacedRepetition: true,
    exportNotes: true,
    autoSummaries: true,
    statsAdvanced: false,
  },
  SENSEI: {
    notebooks: Infinity,
    chatMessagesPerDay: Infinity,
    flashcards: true,
    flashcardsAI: true,
    pomodoro: true,
    dashboardFull: true,
    tasks: true,
    goals: true,
    calendar: true,
    battle: true,
    preTest: true,
    microLesson: true,
    teach: true,
    roadmapAI: true,
    missions: true,
    discover: true,
    brain: true,
    spacedRepetition: true,
    exportNotes: true,
    autoSummaries: true,
    statsAdvanced: true,
  },
} as const;

/** Which features map to which sidebar tabs (for lock icon display) */
export const TAB_FEATURE_MAP: Record<string, PlanFeature> = {
  battle: 'battle',
  microlesson: 'microLesson',
  missions: 'missions',
  teach: 'teach',
  brain: 'brain',
  discover: 'discover',
  roadmap: 'roadmapAI',
  progress: 'dashboardFull',
};

/** Minimum plan required for each feature */
export const FEATURE_MIN_PLAN: Record<string, Plan> = {
  battle: 'SAMURAI',
  preTest: 'SAMURAI',
  microLesson: 'SAMURAI',
  teach: 'SAMURAI',
  roadmapAI: 'SAMURAI',
  missions: 'SAMURAI',
  discover: 'SAMURAI',
  brain: 'SAMURAI',
  spacedRepetition: 'SAMURAI',
  exportNotes: 'SAMURAI',
  autoSummaries: 'SAMURAI',
  flashcardsAI: 'SAMURAI',
  dashboardFull: 'SAMURAI',
  statsAdvanced: 'SENSEI',
};

export function canAccess(plan: Plan, feature: string): boolean {
  return !!PLAN_LIMITS[plan]?.[feature as PlanFeature];
}

export function getRequiredPlan(feature: string): Plan | null {
  return FEATURE_MIN_PLAN[feature] || null;
}

export const PLAN_LABELS: Record<Plan, string> = {
  FREE: 'Shojin',
  SAMURAI: 'Samurai',
  SENSEI: 'Sensei',
};

export const PLAN_PRICES: Record<Plan, string> = {
  FREE: 'Grátis',
  SAMURAI: 'R$ 19,90',
  SENSEI: 'R$ 34,90',
};

export const PLAN_PRICES_ANNUAL: Record<Exclude<Plan, 'FREE'>, string> = {
  SAMURAI: 'R$ 199,00',
  SENSEI: 'R$ 349,00',
};

export const PLAN_MONTHLY_EQUIVALENT: Record<Exclude<Plan, 'FREE'>, string> = {
  SAMURAI: 'R$ 16,58',
  SENSEI: 'R$ 29,08',
};

export const PLAN_DISPLAY_NAMES: Record<Plan, string> = {
  FREE: 'Shojin',
  SAMURAI: 'Samurai',
  SENSEI: 'Sensei',
};

export const PLAN_DESCRIPTIONS: Record<Exclude<Plan, 'FREE'>, string> = {
  SAMURAI: 'Para quem quer evoluir nos estudos.',
  SENSEI: 'Para quem quer levar os estudos ao próximo nível.',
};

export const PLAN_BADGES: Record<Exclude<Plan, 'FREE'>, string> = {
  SAMURAI: 'Mais popular',
  SENSEI: 'Experiência completa',
};
