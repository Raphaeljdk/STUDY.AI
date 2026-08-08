'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Search, Loader2, ChevronDown, ChevronUp,
  Play, RotateCcw, Sparkles, Clock, Zap, Shield,
  Target, TrendingDown, AlertTriangle, CheckCircle2,
  BookOpen, Timer, RefreshCw, ArrowRight, Lightbulb,
  Battery, BarChart3, Heart, Link2, Eye,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { WabiSabiCard } from './WabiSabiCard';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// ===== TYPES =====
interface BrainViewProps {
  onNavigate: (tab: string) => void;
}

interface BrainData {
  overview: {
    totalSubjects: number;
    totalTopics: number;
    avgMastery: number;
    activeMissions: number;
    recentBattleAvg: number | null;
    recentPreTestAvg: number | null;
  };
  weakTopics: Array<{
    topic: string;
    subject: string;
    mastery: number;
    questions: number;
    accuracy: number;
  }>;
  strongTopics: Array<{
    topic: string;
    subject: string;
    mastery: number;
    questions: number;
    accuracy: number;
  }>;
  topicMastery: Array<{
    topic: string;
    subject: string;
    mastery: number;
    questions: number;
    accuracy: number;
  }>;
  analysis: {
    summary: string;
    weakPoints: Array<{ topic: string; reason: string; suggestion: string }>;
    strengths: Array<{ topic: string; praise: string }>;
    recommendations: Array<{ priority: string; action: string; reason: string }>;
    nextSteps: string[];
  } | null;
}

interface PreTestQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface Subject {
  id: string;
  name: string;
  emoji: string;
}

interface DNA_METRIC {
  key: string;
  label: string;
  icon: React.ReactNode;
  value: number;
  color: string;
}

// ===== HELPERS =====
function getMasteryColor(mastery: number): string {
  if (mastery >= 70) return 'var(--ws-verdigris)';
  if (mastery >= 40) return 'var(--ws-gold)';
  return 'var(--ws-accent)';
}

function getMasteryLabel(mastery: number): string {
  if (mastery >= 80) return 'Dominado';
  if (mastery >= 60) return 'Bom';
  if (mastery >= 40) return 'Medio';
  if (mastery >= 20) return 'Fraco';
  return 'Critico';
}

function getPriorityBadge(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'alta': return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Alta' };
    case 'media': return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', label: 'Media' };
    default: return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Baixa' };
  }
}

// ===== COMPONENT =====
export function BrainView({ onNavigate }: BrainViewProps) {
  // State
  const [brainData, setBrainData] = useState<BrainData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tiredMode, setTiredMode] = useState(false);

  // Pre-test state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [preTestTopic, setPreTestTopic] = useState('');
  const [preTestSubjectId, setPreTestSubjectId] = useState('');
  const [preTestOpen, setPreTestOpen] = useState(false);
  const [preTestLoading, setPreTestLoading] = useState(false);
  const [preTestQuestions, setPreTestQuestions] = useState<PreTestQuestion[]>([]);
  const [preTestId, setPreTestId] = useState('');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [preTestFinished, setPreTestFinished] = useState(false);
  const [preTestScore, setPreTestScore] = useState(0);
  const [preTestCorrect, setPreTestCorrect] = useState(0);
  const [preTestTotal, setPreTestTotal] = useState(0);

  // Expanded state
  const [expandedGap, setExpandedGap] = useState<string | null>(null);
  const [expandedRec, setExpandedRec] = useState<string | null>(null);

  // Retention state
  const [retentionTopics, setRetentionTopics] = useState<BrainData['topicMastery']>([]);

  // Discover gaps
  const discoverGaps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/brain');
      if (!res.ok) throw new Error('Erro ao buscar dados');
      const data = await res.json();
      setBrainData(data);

      // Compute retention topics (low mastery = needs review)
      const lowMastery = (data.topicMastery || []).filter(t => t.mastery < 50);
      setRetentionTopics(lowMastery.slice(0, 5));

      toast({ title: 'Analise concluida', description: 'Seu cerebro foi mapeado com sucesso.' });
    } catch {
      toast({ title: 'Erro', description: 'Nao foi possivel analisar seus dados.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load subjects for pre-test
  useEffect(() => {
    async function fetchSubjects() {
      try {
        const res = await fetch('/api/subjects');
        if (res.ok) {
          const data = await res.json();
          setSubjects(data.subjects || []);
        }
      } catch { /* ignore */ }
    }
    fetchSubjects();
  }, []);

  // Start pre-test
  const startPreTest = async () => {
    if (!preTestTopic.trim()) {
      toast({ title: 'Informe o topico', description: 'Digite o topico para o pre-teste.', variant: 'destructive' });
      return;
    }
    setPreTestLoading(true);
    try {
      const res = await fetch('/api/pretest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: preTestTopic.trim(),
          subjectId: preTestSubjectId || undefined,
          numQuestions: 5,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPreTestQuestions(data.questions || []);
      setPreTestId(data.preTest?.id || '');
      setCurrentQIndex(0);
      setAnswers(new Array(data.questions?.length || 0).fill(null));
      setPreTestFinished(false);
      setPreTestOpen(true);
    } catch {
      toast({ title: 'Erro', description: 'Nao foi possivel gerar o pre-teste.', variant: 'destructive' });
    } finally {
      setPreTestLoading(false);
    }
  };

  // Finish pre-test
  const finishPreTest = async () => {
    if (!preTestId) return;
    setPreTestLoading(true);
    try {
      const res = await fetch('/api/pretest/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preTestId, answers }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPreTestScore(data.score);
      setPreTestCorrect(data.correct);
      setPreTestTotal(data.total);
      setPreTestFinished(true);
    } catch {
      toast({ title: 'Erro', description: 'Nao foi possivel finalizar o pre-teste.', variant: 'destructive' });
    } finally {
      setPreTestLoading(false);
    }
  };

  // Close pre-test
  const closePreTest = () => {
    setPreTestOpen(false);
    setPreTestQuestions([]);
    setPreTestId('');
    setCurrentQIndex(0);
    setAnswers([]);
    setPreTestFinished(false);
  };

  // DNA metrics computed from brain data
  const dnaMetrics: DNA_METRIC[] = brainData
    ? [
        {
          key: 'memoria',
          label: 'Memoria',
          icon: <Brain className="h-4 w-4" />,
          value: Math.min(100, Math.max(0, brainData.overview.recentPreTestAvg ?? brainData.overview.avgMastery)),
          color: 'var(--ws-accent)',
        },
        {
          key: 'raciocinio',
          label: 'Raciocinio',
          icon: <BarChart3 className="h-4 w-4" />,
          value: Math.min(100, Math.max(0, brainData.overview.recentBattleAvg ?? brainData.overview.avgMastery)),
          color: 'var(--ws-gold)',
        },
        {
          key: 'aplicacao',
          label: 'Aplicacao',
          value: Math.min(100, Math.max(0, Math.round(brainData.strongTopics.length / Math.max(1, brainData.topicMastery.length) * 100))),
          icon: <Zap className="h-4 w-4" />,
          color: 'var(--ws-verdigris)',
        },
        {
          key: 'retencao',
          label: 'Retencao',
          icon: <Target className="h-4 w-4" />,
          value: Math.min(100, Math.max(0, 100 - brainData.weakTopics.length * 15)),
          color: 'var(--ws-gold)',
        },
        {
          key: 'consistencia',
          label: 'Consistencia',
          icon: <Heart className="h-4 w-4" />,
          value: Math.min(100, Math.max(0, brainData.overview.avgMastery)),
          color: 'var(--ws-accent)',
        },
      ]
    : [
        { key: 'memoria', label: 'Memoria', icon: <Brain className="h-4 w-4" />, value: 0, color: 'var(--ws-accent)' },
        { key: 'raciocinio', label: 'Raciocinio', icon: <BarChart3 className="h-4 w-4" />, value: 0, color: 'var(--ws-gold)' },
        { key: 'aplicacao', label: 'Aplicacao', icon: <Zap className="h-4 w-4" />, value: 0, color: 'var(--ws-verdigris)' },
        { key: 'retencao', label: 'Retencao', icon: <Target className="h-4 w-4" />, value: 0, color: 'var(--ws-gold)' },
        { key: 'consistencia', label: 'Consistencia', icon: <Heart className="h-4 w-4" />, value: 0, color: 'var(--ws-accent)' },
      ];

  // Filtered recommendations
  const recommendations = brainData?.analysis?.recommendations || [];
  const filteredRecs = tiredMode
    ? recommendations.filter(r => r.priority?.toLowerCase() !== 'alta' && r.action?.toLowerCase().includes('revis'))
    : recommendations;

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="mx-auto max-w-2xl space-y-6 px-4 pb-8 pt-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] px-4 py-1.5 backdrop-blur-xl">
          <Brain className="h-4 w-4" style={{ color: 'var(--ws-accent)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--ws-text-secondary)' }}>StudyAI Brain</span>
        </div>
        <h1 className="font-serif-jp text-3xl font-bold" style={{ color: 'var(--ws-text-primary)' }}>
          Cerebro do Estudo
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--ws-text-tertiary)' }}>
          Mapeie seu conhecimento e descubra lacunas
        </p>
      </motion.div>

      {/* ===== SECTION 1: LEARNING DNA ===== */}
      <motion.div variants={itemVariants}>
        <WabiSabiCard hover={false} glass>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--ws-accent) 12%, transparent)' }}>
              <Sparkles className="h-4 w-4" style={{ color: 'var(--ws-accent)' }} />
            </div>
            <div>
              <h2 className="font-serif-jp text-lg font-semibold" style={{ color: 'var(--ws-text-primary)' }}>Learning DNA</h2>
              <p className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>Seu perfil unico de aprendizagem</p>
            </div>
          </div>

          <div className="space-y-4">
            {dnaMetrics.map((m) => (
              <div key={m.key} className="group">
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ color: m.color }}>{m.icon}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--ws-text-primary)' }}>{m.label}</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: m.color }}>{m.value}%</span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full" style={{ background: 'color-mix(in srgb, var(--ws-ink) 6%, transparent)' }}>
                  <motion.div
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{ background: m.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${m.value}%` }}
                    transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {brainData && brainData.analysis?.summary && (
            <div className="mt-4 rounded-lg border border-[var(--ws-glass-border)] p-3" style={{ background: 'color-mix(in srgb, var(--ws-gold) 6%, transparent)' }}>
              <p className="text-sm italic" style={{ color: 'var(--ws-text-secondary)' }}>
                &ldquo;{brainData.analysis.summary}&rdquo;
              </p>
            </div>
          )}
        </WabiSabiCard>
      </motion.div>

      {/* ===== DISCOVER GAPS BUTTON ===== */}
      <motion.div variants={itemVariants}>
        <Button
          onClick={discoverGaps}
          disabled={loading}
          className="w-full rounded-ws-button py-6 text-base font-semibold"
          style={{
            background: 'var(--ws-accent)',
            color: 'var(--ws-text-on-dark)',
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analisando...</>
          ) : (
            <><Search className="mr-2 h-5 w-5" /> Descobrir minhas lacunas</>
          )}
        </Button>
      </motion.div>

      {/* ===== SECTION 2: KNOWLEDGE GAPS ===== */}
      <AnimatePresence>
        {brainData && brainData.weakTopics.length > 0 && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <WabiSabiCard hover={false}>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--ws-accent) 12%, transparent)' }}>
                  <TrendingDown className="h-4 w-4" style={{ color: 'var(--ws-accent)' }} />
                </div>
                <div>
                  <h2 className="font-serif-jp text-lg font-semibold" style={{ color: 'var(--ws-text-primary)' }}>Lacunas de Conhecimento</h2>
                  <p className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>{brainData.weakTopics.length} topicos precisam de atencao</p>
                </div>
              </div>

              <div className="max-h-96 space-y-2 overflow-y-auto">
                {brainData.weakTopics.map((gap, idx) => {
                  const gapKey = `${gap.topic}-${gap.subject}`;
                  const isExpanded = expandedGap === gapKey;
                  const prereqChain = brainData.topicMastery
                    .filter(t => t.subject === gap.subject && t.mastery < gap.mastery + 25 && t.topic !== gap.topic)
                    .slice(0, 2);

                  return (
                    <motion.div
                      key={gapKey}
                      className="cursor-pointer rounded-lg border border-[var(--ws-glass-border)] p-3 transition-colors hover:border-[var(--ws-accent)]"
                      style={{ background: 'var(--ws-glass)' }}
                      onClick={() => setExpandedGap(isExpanded ? null : gapKey)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-3.5 w-3.5" style={{ color: getMasteryColor(gap.mastery) }} />
                            <span className="text-sm font-medium" style={{ color: 'var(--ws-text-primary)' }}>{gap.topic}</span>
                            <Badge variant="outline" className="text-xs" style={{ borderColor: 'var(--ws-glass-border)', color: 'var(--ws-text-tertiary)' }}>
                              {gap.subject}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold" style={{ color: getMasteryColor(gap.mastery) }}>{gap.mastery}%</span>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'color-mix(in srgb, var(--ws-ink) 6%, transparent)' }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${gap.mastery}%`, background: getMasteryColor(gap.mastery) }} />
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 space-y-2"
                          >
                            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ws-text-secondary)' }}>
                              <Eye className="h-3 w-3" />
                              <span>{gap.questions} questoes respondidas</span>
                              <span className="mx-1">·</span>
                              <span>{gap.accuracy}% acerto</span>
                            </div>

                            {/* Prerequisites chain */}
                            {prereqChain.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 rounded-md p-2 text-xs" style={{ background: 'color-mix(in srgb, var(--ws-gold) 8%, transparent)', color: 'var(--ws-text-secondary)' }}>
                                <Link2 className="h-3 w-3" />
                                <span className="font-medium">Prerequisitos:</span>
                                {prereqChain.map((p, i) => (
                                  <span key={i} className="flex items-center gap-1">
                                    {i > 0 && <span style={{ color: 'var(--ws-text-tertiary)' }}>←</span>}
                                    <span className="font-medium" style={{ color: getMasteryColor(p.mastery) }}>{p.topic} {p.mastery}%</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Recommended action from AI */}
                            {brainData.analysis?.weakPoints?.find(w => w.topic.toLowerCase().includes(gap.topic.toLowerCase()))?.suggestion && (
                              <div className="flex items-start gap-1.5 rounded-md p-2 text-xs" style={{ background: 'color-mix(in srgb, var(--ws-verdigris) 8%, transparent)' }}>
                                <Lightbulb className="mt-0.5 h-3 w-3 shrink-0" style={{ color: 'var(--ws-verdigris)' }} />
                                <span style={{ color: 'var(--ws-text-secondary)' }}>
                                  {brainData.analysis.weakPoints.find(w => w.topic.toLowerCase().includes(gap.topic.toLowerCase()))?.suggestion}
                                </span>
                              </div>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-1 rounded-ws-button text-xs"
                              style={{ borderColor: 'var(--ws-accent)', color: 'var(--ws-accent)' }}
                              onClick={(e) => { e.stopPropagation(); onNavigate('subjects'); }}
                            >
                              Estudar agora <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </WabiSabiCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== SECTION 3: RECOMMENDATIONS ===== */}
      <AnimatePresence>
        {brainData && recommendations.length > 0 && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <WabiSabiCard hover={false}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--ws-gold) 12%, transparent)' }}>
                    <Lightbulb className="h-4 w-4" style={{ color: 'var(--ws-gold)' }} />
                  </div>
                  <div>
                    <h2 className="font-serif-jp text-lg font-semibold" style={{ color: 'var(--ws-text-primary)' }}>Recomendacoes</h2>
                    <p className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>Baseadas no seu desempenho</p>
                  </div>
                </div>

                {/* Tired mode toggle */}
                <button
                  onClick={() => setTiredMode(!tiredMode)}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    borderColor: tiredMode ? 'var(--ws-accent)' : 'var(--ws-glass-border)',
                    background: tiredMode ? 'color-mix(in srgb, var(--ws-accent) 8%, transparent)' : 'transparent',
                    color: tiredMode ? 'var(--ws-accent)' : 'var(--ws-text-tertiary)',
                  }}
                >
                  <Battery className="h-3 w-3" />
                  Estou cansado
                </button>
              </div>

              {tiredMode && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-3 text-xs italic"
                  style={{ color: 'var(--ws-text-tertiary)' }}
                >
                  Modo leve ativado — apenas revisoes e atividades leves.
                </motion.p>
              )}

              <div className="max-h-96 space-y-2 overflow-y-auto">
                {(filteredRecs.length > 0 ? filteredRecs : recommendations).map((rec, idx) => {
                  const recKey = `rec-${idx}`;
                  const priority = getPriorityBadge(rec.priority);
                  const actionType = rec.action?.toLowerCase().includes('revis') ? 'review' : rec.action?.toLowerCase().includes('pratic') ? 'practice' : 'study';
                  const actionIcon = actionType === 'review' ? <RefreshCw className="h-3.5 w-3.5" /> : actionType === 'practice' ? <Play className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />;
                  const estimatedTime = tiredMode ? '~10 min' : actionType === 'review' ? '~15 min' : actionType === 'practice' ? '~25 min' : '~40 min';
                  const isExpanded = expandedRec === recKey;

                  return (
                    <motion.div
                      key={recKey}
                      className="cursor-pointer rounded-lg border border-[var(--ws-glass-border)] p-3 transition-colors hover:border-[var(--ws-gold)]"
                      style={{ background: 'var(--ws-glass)' }}
                      onClick={() => setExpandedRec(isExpanded ? null : recKey)}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--ws-gold) 10%, transparent)' }}>
                            {actionIcon}
                          </div>
                          <span className="text-sm font-medium" style={{ color: 'var(--ws-text-primary)' }}>{rec.action}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priority.bg} ${priority.text}`}>
                            {priority.label}
                          </span>
                          <Clock className="h-3 w-3" style={{ color: 'var(--ws-text-tertiary)' }} />
                          <span className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>{estimatedTime}</span>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2"
                          >
                            <p className="text-xs" style={{ color: 'var(--ws-text-secondary)' }}>{rec.reason}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </WabiSabiCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== SECTION 4: STRENGTHS ===== */}
      <AnimatePresence>
        {brainData && brainData.strongTopics.length > 0 && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <WabiSabiCard hover={false}>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--ws-verdigris) 12%, transparent)' }}>
                  <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--ws-verdigris)' }} />
                </div>
                <div>
                  <h2 className="font-serif-jp text-lg font-semibold" style={{ color: 'var(--ws-text-primary)' }}>Pontos Fortes</h2>
                  <p className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>Continue firme nestes topicos</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {brainData.strongTopics.map((s, idx) => (
                  <motion.div
                    key={s.topic}
                    className="flex items-center gap-2 rounded-full border border-[var(--ws-glass-border)] px-3 py-1.5"
                    style={{ background: 'var(--ws-glass)' }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Shield className="h-3.5 w-3.5" style={{ color: 'var(--ws-verdigris)' }} />
                    <span className="text-sm" style={{ color: 'var(--ws-text-primary)' }}>{s.topic}</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--ws-verdigris)' }}>{s.mastery}%</span>
                  </motion.div>
                ))}
              </div>

              {brainData.analysis?.strengths && brainData.analysis.strengths.length > 0 && (
                <div className="mt-3 space-y-1">
                  {brainData.analysis.strengths.map((s, i) => (
                    <p key={i} className="text-xs italic" style={{ color: 'var(--ws-text-secondary)' }}>
                      &ldquo;{s.praise}&rdquo; — {s.topic}
                    </p>
                  ))}
                </div>
              )}
            </WabiSabiCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== SECTION 5: PRE-TEST ===== */}
      <motion.div variants={itemVariants}>
        <WabiSabiCard hover={false}>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--ws-accent) 12%, transparent)' }}>
              <Play className="h-4 w-4" style={{ color: 'var(--ws-accent)' }} />
            </div>
            <div>
              <h2 className="font-serif-jp text-lg font-semibold" style={{ color: 'var(--ws-text-primary)' }}>Pre-Teste</h2>
              <p className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>Avalie seu conhecimento inicial</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--ws-text-secondary)' }}>Materia (opcional)</label>
              <select
                className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--ws-accent)]"
                style={{ color: 'var(--ws-text-primary)' }}
                value={preTestSubjectId}
                onChange={(e) => setPreTestSubjectId(e.target.value)}
              >
                <option value="">Todas as materias</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--ws-text-secondary)' }}>Topico</label>
              <Input
                placeholder="Ex: Spring Security, Calculo, Historia..."
                value={preTestTopic}
                onChange={(e) => setPreTestTopic(e.target.value)}
                className="rounded-ws-button border-[var(--ws-glass-border)] bg-[var(--ws-glass)]"
                style={{ color: 'var(--ws-text-primary)' }}
                onKeyDown={(e) => { if (e.key === 'Enter') startPreTest(); }}
              />
            </div>

            <Button
              onClick={startPreTest}
              disabled={preTestLoading || !preTestTopic.trim()}
              className="w-full rounded-ws-button"
              style={{ background: 'var(--ws-accent)', color: 'var(--ws-text-on-dark)' }}
            >
              {preTestLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : <><Play className="mr-2 h-4 w-4" /> Fazer pre-teste</>}
            </Button>
          </div>
        </WabiSabiCard>
      </motion.div>

      {/* ===== SECTION 6: RETENTION TRACKING ===== */}
      {brainData && retentionTopics.length > 0 && (
        <motion.div variants={itemVariants}>
          <WabiSabiCard hover={false}>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--ws-accent) 12%, transparent)' }}>
                <RefreshCw className="h-4 w-4" style={{ color: 'var(--ws-accent)' }} />
              </div>
              <div>
                <h2 className="font-serif-jp text-lg font-semibold" style={{ color: 'var(--ws-text-primary)' }}>Retencao</h2>
                <p className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>Topicos que precisam de revisao</p>
              </div>
            </div>

            <div className="space-y-2">
              {retentionTopics.map((t) => (
                <div key={t.topic} className="flex items-center justify-between rounded-lg border border-[var(--ws-glass-border)] p-3" style={{ background: 'var(--ws-glass)' }}>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--ws-text-primary)' }}>{t.topic}</span>
                    <span className="ml-2 text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>{t.subject}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold" style={{ color: getMasteryColor(t.mastery) }}>{t.mastery}%</span>
                    <Badge variant="outline" className="text-xs" style={{ borderColor: 'var(--ws-accent)', color: 'var(--ws-accent)' }}>
                      {getMasteryLabel(t.mastery)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="mt-4 w-full rounded-ws-button"
              style={{ borderColor: 'var(--ws-accent)', color: 'var(--ws-accent)' }}
              onClick={() => onNavigate('tasks')}
            >
              <Zap className="mr-2 h-4 w-4" /> Prova surpresa
            </Button>
          </WabiSabiCard>
        </motion.div>
      )}

      {/* ===== SECTION 7: NEXT STEPS ===== */}
      <AnimatePresence>
        {brainData?.analysis?.nextSteps && brainData.analysis.nextSteps.length > 0 && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <WabiSabiCard hover={false}>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--ws-gold) 12%, transparent)' }}>
                  <ArrowRight className="h-4 w-4" style={{ color: 'var(--ws-gold)' }} />
                </div>
                <h2 className="font-serif-jp text-lg font-semibold" style={{ color: 'var(--ws-text-primary)' }}>Proximos Passos</h2>
              </div>

              <div className="space-y-2">
                {brainData.analysis.nextSteps.map((step, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-center gap-3 rounded-lg p-2"
                    style={{ background: 'color-mix(in srgb, var(--ws-ink) 3%, transparent)' }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'color-mix(in srgb, var(--ws-gold) 15%, transparent)', color: 'var(--ws-gold)' }}>
                      {idx + 1}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--ws-text-secondary)' }}>{step}</span>
                  </motion.div>
                ))}
              </div>
            </WabiSabiCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== PRE-TEST DIALOG ===== */}
      <Dialog open={preTestOpen} onOpenChange={(open) => { if (!open) closePreTest(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" style={{ background: 'var(--ws-bg)', borderRadius: 'var(--ws-radius-card)' }}>
          <DialogHeader>
            <DialogTitle className="font-serif-jp" style={{ color: 'var(--ws-text-primary)' }}>
              {preTestFinished ? 'Resultado do Pre-Teste' : `Questao ${currentQIndex + 1} de ${preTestQuestions.length}`}
            </DialogTitle>
          </DialogHeader>

          {!preTestFinished && preTestQuestions.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-primary)' }}>
                {preTestQuestions[currentQIndex].question}
              </p>

              <div className="space-y-2">
                {preTestQuestions[currentQIndex].options.map((opt, idx) => (
                  <button
                    key={idx}
                    className="w-full rounded-ws-button border p-3 text-left text-sm transition-all"
                    style={{
                      borderColor: answers[currentQIndex] === idx ? 'var(--ws-accent)' : 'var(--ws-glass-border)',
                      background: answers[currentQIndex] === idx ? 'color-mix(in srgb, var(--ws-accent) 8%, transparent)' : 'var(--ws-glass)',
                      color: 'var(--ws-text-primary)',
                    }}
                    onClick={() => {
                      const newAnswers = [...answers];
                      newAnswers[currentQIndex] = idx;
                      setAnswers(newAnswers);
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5">
                {preTestQuestions.map((_, idx) => (
                  <div
                    key={idx}
                    className="h-2 w-2 rounded-full transition-colors"
                    style={{ background: idx <= currentQIndex && answers[idx] !== null ? 'var(--ws-accent)' : 'color-mix(in srgb, var(--ws-ink) 12%, transparent)' }}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {currentQIndex > 0 && (
                  <Button variant="outline" className="flex-1 rounded-ws-button" style={{ borderColor: 'var(--ws-glass-border)', color: 'var(--ws-text-secondary)' }} onClick={() => setCurrentQIndex(currentQIndex - 1)}>
                    Anterior
                  </Button>
                )}
                {currentQIndex < preTestQuestions.length - 1 ? (
                  <Button className="flex-1 rounded-ws-button" style={{ background: 'var(--ws-accent)', color: 'var(--ws-text-on-dark)' }} onClick={() => setCurrentQIndex(currentQIndex + 1)}>
                    Proxima
                  </Button>
                ) : (
                  <Button className="flex-1 rounded-ws-button" style={{ background: 'var(--ws-accent)', color: 'var(--ws-text-on-dark)' }} onClick={finishPreTest} disabled={preTestLoading}>
                    {preTestLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizando...</> : 'Finalizar'}
                  </Button>
                )}
              </div>
            </div>
          )}

          {preTestFinished && (
            <div className="space-y-4 text-center">
              <div className="py-4">
                <div className="text-5xl font-bold" style={{ color: getMasteryColor(preTestScore) }}>{preTestScore}%</div>
                <p className="mt-1 text-sm" style={{ color: 'var(--ws-text-secondary)' }}>
                  {preTestCorrect} de {preTestTotal} corretas
                </p>
              </div>

              <div className="rounded-lg p-4" style={{ background: 'color-mix(in srgb, var(--ws-gold) 6%, transparent)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--ws-text-primary)' }}>Conhecimento inicial: {preTestScore}%</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
                  Estude este topico e refaca o pre-teste para medir sua evolucao.
                </p>
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  variant="outline"
                  className="w-full rounded-ws-button"
                  style={{ borderColor: 'var(--ws-glass-border)', color: 'var(--ws-text-secondary)' }}
                  onClick={closePreTest}
                >
                  Fechar
                </Button>
                <Button
                  className="w-full rounded-ws-button"
                  style={{ background: 'var(--ws-accent)', color: 'var(--ws-text-on-dark)' }}
                  onClick={() => { closePreTest(); startPreTest(); }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Refazer pre-teste
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
