'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import {
  Timer, Zap, Flame, Brain, BookOpen, Target,
  Sparkles, Clock, ChevronUp, ChevronDown, X,
  Loader2, Calendar, Play, ArrowRight, RotateCcw,
  AlertTriangle, Lightbulb, Compass, Rocket, Coffee,
  CheckCircle2, Pause,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { WabiSabiCard } from './WabiSabiCard';

// ===== TYPES =====
interface EmergencyViewProps {
  onNavigate: (tab: string) => void;
}

type ActivityType = 'flashcard' | 'question' | 'review';

interface SessionActivity {
  id: string;
  type: ActivityType;
  title: string;
  topic: string;
  duration: number;
  completed: boolean;
}

interface ReviewCard {
  id: string;
  topic: string;
  concept: string;
  question: string;
  answer: string;
}

interface AutopilotPlan {
  title: string;
  summary: string;
  totalDays: number;
  dailyHours: number;
  phases: Array<{ name: string; days: string; focus: string; activities: string[]; subjects: string[] }>;
  weeklySchedule: Array<{ day: string; blocks: Array<{ time: string; subject: string; activity: string }> }>;
  milestones: Array<{ day: number; description: string }>;
  tips: string[];
  estimatedCoverage: string;
}

// ===== CONSTANTS =====
const TIME_OPTIONS = [
  { label: '5 min', minutes: 5 },
  { label: '10 min', minutes: 10 },
  { label: '20 min', minutes: 20 },
  { label: '30 min', minutes: 30 },
  { label: '1 hora', minutes: 60 },
];

const MOCK_REVIEW_CARDS: ReviewCard[] = [
  { id: '1', topic: 'Funcoes', concept: 'Funcoes de primeira ordem recebem funcoes como argumento ou retornam funcoes.', question: 'O que e uma funcao de alta ordem?', answer: 'Uma funcao que recebe outra funcao como parametro ou a retorna como resultado.' },
  { id: '2', topic: 'Arrays', concept: 'Os metodos map, filter e reduce sao os pilares da programacao funcional com arrays.', question: 'Qual a diferenca entre map e forEach?', answer: 'map retorna um novo array transformado; forEach executa a funcao sem retornar nada.' },
  { id: '3', topic: 'SQL', concept: 'JOIN combina linhas de duas tabelas baseado em colunas relacionadas.', question: 'Qual a diferenca entre INNER JOIN e LEFT JOIN?', answer: 'INNER JOIN retorna apenas registros que combinam em ambas as tabelas. LEFT JOIN retorna todos da tabela esquerda.' },
  { id: '4', topic: 'HTTP', concept: 'Codigos de status: 2xx sucesso, 4xx erro do cliente, 5xx erro do servidor.', question: 'O que significa status 403?', answer: 'Forbidden — o servidor entendeu a requisicao mas se recusa a autoriza-la.' },
  { id: '5', topic: 'Git', concept: 'Branches permitem trabalhar em funcionalidades isoladas sem afetar o codigo principal.', question: 'Para que serve o git rebase?', answer: 'Reaplica commits de uma branch sobre outra, criando um historico linear mais limpo.' },
  { id: '6', topic: 'OOP', concept: 'Os 4 pilares sao: Encapsulamento, Heranca, Polimorfismo e Abstracao.', question: 'O que e polimorfismo?', answer: 'A capacidade de objetos de classes diferentes responderem ao mesmo metodo de formas diferentes.' },
];

// ===== COMPONENT =====
export function EmergencyView({ onNavigate }: EmergencyViewProps) {
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionActivities, setSessionActivities] = useState<SessionActivity[]>([]);
  const [currentActivityIdx, setCurrentActivityIdx] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyPlan, setEmergencyPlan] = useState<SessionActivity[] | null>(null);

  const [reviewCards, setReviewCards] = useState<ReviewCard[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  const [autopilotExam, setAutopilotExam] = useState('');
  const [autopilotDate, setAutopilotDate] = useState('');
  const [autopilotHours, setAutopilotHours] = useState('3');
  const [autopilotLoading, setAutopilotLoading] = useState(false);
  const [autopilotPlan, setAutopilotPlan] = useState<AutopilotPlan | null>(null);

  const cardY = useMotionValue(0);
  const cardOpacity = useTransform(cardY, [-200, 0, 200], [0, 1, 0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  // Timer effect
  useEffect(() => {
    if (sessionActive && !sessionPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setSessionActive(false);
            toast({ title: 'Sessao finalizada!', description: `Voce ganhou ${sessionXp} XP.` });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionActive, sessionPaused, timeLeft, sessionXp]);

  const generateSession = useCallback((minutes: number): SessionActivity[] => {
    const totalSeconds = minutes * 60;
    const activities: SessionActivity[] = [];
    let remaining = totalSeconds;
    const topics = ['Funcoes', 'Arrays', 'SQL', 'HTTP', 'Git', 'OOP', 'React', 'CSS'];
    const types: ActivityType[] = ['flashcard', 'question', 'review'];
    let idx = 0;
    while (remaining > 0 && activities.length < 12) {
      const type = types[idx % 3];
      const duration = type === 'flashcard' ? Math.min(30, remaining) : type === 'question' ? Math.min(90, remaining) : Math.min(60, remaining);
      if (duration < 10) break;
      const topic = topics[idx % topics.length];
      activities.push({ id: `act-${idx}`, type, title: `${type === 'flashcard' ? 'Flashcard' : type === 'question' ? 'Questao' : 'Revisao'}: ${topic}`, topic, duration, completed: false });
      remaining -= duration;
      idx++;
    }
    return activities;
  }, []);

  const startSession = (minutes: number) => {
    setSelectedTime(minutes);
    const activities = generateSession(minutes);
    setSessionActivities(activities);
    setCurrentActivityIdx(0);
    setSessionXp(0);
    setSessionPaused(false);
    setTimeLeft(minutes * 60);
    setSessionActive(true);
  };

  const completeActivity = (idx: number) => {
    const updated = [...sessionActivities];
    if (updated[idx]) updated[idx].completed = true;
    setSessionActivities(updated);
    const xpGain = updated[idx]?.type === 'question' ? 15 : updated[idx]?.type === 'flashcard' ? 5 : 10;
    const newTotal = sessionXp + xpGain;
    setSessionXp(newTotal);
    if (idx + 1 < sessionActivities.length) {
      setTimeout(() => setCurrentActivityIdx(idx + 1), 400);
    } else {
      setSessionActive(false);
      toast({ title: 'Sessao completa!', description: `Voce ganhou ${newTotal} XP. Parabens!` });
    }
  };

  const startEmergency = async () => {
    setEmergencyLoading(true);
    try {
      const brainData = await apiFetch('/api/brain').catch(() => null);
        const weakTopics = brainData?.weakTopics?.slice(0, 5) || [];
        if (weakTopics.length > 0) {
          const activities: SessionActivity[] = weakTopics.map((t: { topic: string }, i: number) => ({
            id: `emerg-${i}`,
            type: (['question', 'review', 'flashcard'] as ActivityType[])[i % 3],
            title: `Emergencia: ${t.topic}`,
            topic: t.topic,
            duration: 90,
            completed: false,
          }));
          setEmergencyPlan(activities);
        } else {
          setEmergencyPlan(generateSession(30));
        }
    } catch {
      setEmergencyPlan(generateSession(30));
    } finally {
      setEmergencyLoading(false);
    }
  };

  const startReview = () => {
    setReviewCards(MOCK_REVIEW_CARDS);
    setCurrentCardIdx(0);
    setShowAnswer(false);
    setReviewMode(true);
  };

  const loadReviewCards = async () => {
    try {
      const data = await apiFetch('/api/brain').catch(() => null);
        if (data?.weakTopics && data.weakTopics.length > 0) {
          const cards: ReviewCard[] = data.weakTopics.slice(0, 5).map((t: { topic: string; mastery: number }, i: number) => ({
            id: `rc-${i}`, topic: t.topic,
            concept: `Revisao rapida sobre ${t.topic} (${t.mastery}% dominio). Foco nos conceitos fundamentais.`,
            question: `O que voce lembra sobre ${t.topic}?`,
            answer: `Revise seus apontamentos e tente explicar ${t.topic} em suas proprias palavras. Dominio atual: ${t.mastery}%.`,
          }));
          setReviewCards(cards);
          return;
        }
    } catch { /* fallback */ }
    setReviewCards(MOCK_REVIEW_CARDS);
  };

  const handleSwipeEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y < -80 && currentCardIdx < reviewCards.length - 1) {
      setCurrentCardIdx(prev => prev + 1);
      setShowAnswer(false);
      cardY.set(0);
    } else if (info.offset.y > 80 && currentCardIdx > 0) {
      setCurrentCardIdx(prev => prev - 1);
      setShowAnswer(false);
      cardY.set(0);
    } else {
      cardY.set(0);
    }
  };

  const generateAutopilot = async () => {
    if (!autopilotExam.trim()) {
      toast({ title: 'Informe a materia', description: 'Digite o nome da prova ou materia.', variant: 'destructive' });
      return;
    }
    setAutopilotLoading(true);
    try {
      const data = await apiFetch('/api/autopilot', {
        method: 'POST',
        body: JSON.stringify({ exam: autopilotExam.trim(), date: autopilotDate || undefined, studyHoursPerDay: parseInt(autopilotHours) || 3 }),
      });
      setAutopilotPlan(data.plan);
      toast({ title: 'Plano gerado!', description: 'Seu plano de estudo personalizado esta pronto.' });
    } catch {
      toast({ title: 'Erro', description: 'Nao foi possivel gerar o plano.', variant: 'destructive' });
    } finally {
      setAutopilotLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ===== RENDER: Review Shorts =====
  if (reviewMode && reviewCards.length > 0) {
    const card = reviewCards[currentCardIdx];
    return (
      <motion.div className="flex min-h-[80vh] flex-col items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6 flex w-full max-w-sm items-center justify-between">
          <button onClick={() => setReviewMode(false)} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--ws-text-tertiary)' }}>
            <X className="h-4 w-4" /> Sair
          </button>
          <span className="text-xs font-medium" style={{ color: 'var(--ws-text-tertiary)' }}>{currentCardIdx + 1}/{reviewCards.length}</span>
        </div>

        <div className="mb-4 flex gap-1">
          {reviewCards.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === currentCardIdx ? '24px' : '8px', background: i === currentCardIdx ? 'var(--ws-accent)' : 'color-mix(in srgb, var(--ws-ink) 12%, transparent)' }} />
          ))}
        </div>

        <motion.div className="relative w-full max-w-sm" style={{ opacity: cardOpacity }}>
          <motion.div className="cursor-grab active:cursor-grabbing" style={{ y: cardY }} drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.2} onDragEnd={handleSwipeEnd}>
            <WabiSabiCard hover={false} glass className="min-h-[360px]">
              <div className="flex flex-col items-center text-center">
                <Badge variant="outline" className="mb-4 text-xs" style={{ borderColor: 'var(--ws-accent)', color: 'var(--ws-accent)' }}>{card.topic}</Badge>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-primary)' }}>{card.concept}</p>
                <div className="mt-6 w-full border-t border-[var(--ws-glass-border)] pt-4">
                  <p className="text-sm font-medium" style={{ color: 'var(--ws-text-secondary)' }}>{card.question}</p>
                </div>
                <AnimatePresence>
                  {showAnswer && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 w-full">
                      <div className="rounded-lg p-3 text-left text-sm" style={{ background: 'color-mix(in srgb, var(--ws-verdigris) 8%, transparent)', color: 'var(--ws-text-secondary)' }}>{card.answer}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <button className="mt-4 rounded-ws-button px-4 py-2 text-sm font-medium transition-colors" style={{ background: showAnswer ? 'color-mix(in srgb, var(--ws-accent) 8%, transparent)' : 'var(--ws-accent)', color: showAnswer ? 'var(--ws-accent)' : 'var(--ws-text-on-dark)' }} onClick={() => setShowAnswer(!showAnswer)}>
                  {showAnswer ? 'Ocultar resposta' : 'Ver resposta'}
                </button>
              </div>
            </WabiSabiCard>
          </motion.div>
        </motion.div>

        <div className="mt-6 flex items-center gap-6 text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
          <button className="flex items-center gap-1 rounded-full border border-[var(--ws-glass-border)] px-3 py-1.5 transition-colors hover:border-[var(--ws-accent)]" style={{ background: 'var(--ws-glass)' }} onClick={() => { if (currentCardIdx > 0) { setCurrentCardIdx(p => p - 1); setShowAnswer(false); } }}>
            <ChevronUp className="h-3 w-3" /> Anterior
          </button>
          <button className="flex items-center gap-1 rounded-full border border-[var(--ws-glass-border)] px-3 py-1.5 transition-colors hover:border-[var(--ws-accent)]" style={{ background: 'var(--ws-glass)' }} onClick={() => { if (currentCardIdx < reviewCards.length - 1) { setCurrentCardIdx(p => p + 1); setShowAnswer(false); } }}>
            Proxima <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </motion.div>
    );
  }

  // ===== RENDER: Active Session =====
  if (sessionActive && sessionActivities.length > 0) {
    const current = sessionActivities[currentActivityIdx];
    const progress = sessionActivities.filter(a => a.completed).length;
    const total = sessionActivities.length;

    return (
      <motion.div className="mx-auto max-w-2xl space-y-6 px-4 pb-8 pt-4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <WabiSabiCard hover={false} glass>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5" style={{ color: 'var(--ws-accent)' }} />
              <span className="font-serif-jp text-lg font-bold" style={{ color: 'var(--ws-text-primary)' }}>Sessao Otimizada</span>
            </div>
            <Badge className="rounded-full px-2.5" style={{ background: 'color-mix(in srgb, var(--ws-accent) 12%, transparent)', color: 'var(--ws-accent)' }}>
              <Zap className="mr-1 h-3 w-3" /> {sessionXp} XP
            </Badge>
          </div>
          <div className="mt-4 text-center">
            <motion.div className="font-mono text-4xl font-bold tabular-nums" style={{ color: timeLeft < 60 ? 'var(--ws-accent)' : 'var(--ws-text-primary)' }} key={timeLeft} initial={{ scale: 1.05 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }}>{formatTime(timeLeft)}</motion.div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
            <span>{progress}/{total} atividades</span>
            <button onClick={() => setSessionPaused(!sessionPaused)} className="flex items-center gap-1 rounded-full px-2 py-1 transition-colors" style={{ background: 'color-mix(in srgb, var(--ws-gold) 10%, transparent)', color: 'var(--ws-gold)' }}>
              {sessionPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              {sessionPaused ? 'Retomar' : 'Pausar'}
            </button>
          </div>
          <div className="relative mt-1.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'color-mix(in srgb, var(--ws-ink) 6%, transparent)' }}>
            <motion.div className="h-full rounded-full" style={{ background: 'var(--ws-accent)' }} animate={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }} />
          </div>
        </WabiSabiCard>

        {current && !sessionPaused && (
          <AnimatePresence mode="wait">
            <motion.div key={current.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <WabiSabiCard hover={false} className="border-l-4" style={{ borderLeftColor: current.type === 'question' ? 'var(--ws-accent)' : current.type === 'flashcard' ? 'var(--ws-verdigris)' : 'var(--ws-gold)' }}>
                <div className="flex items-center gap-2">
                  {current.type === 'flashcard' && <BookOpen className="h-4 w-4" style={{ color: 'var(--ws-verdigris)' }} />}
                  {current.type === 'question' && <Target className="h-4 w-4" style={{ color: 'var(--ws-accent)' }} />}
                  {current.type === 'review' && <Brain className="h-4 w-4" style={{ color: 'var(--ws-gold)' }} />}
                  <span className="text-sm font-semibold" style={{ color: 'var(--ws-text-primary)' }}>{current.title}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
                  <Badge variant="outline" className="text-xs" style={{ borderColor: 'var(--ws-glass-border)', color: 'var(--ws-text-tertiary)' }}>{current.topic}</Badge>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> ~{Math.round(current.duration / 60)} min</span>
                </div>
                <div className="mt-4 flex items-center justify-center rounded-lg p-6" style={{ background: 'color-mix(in srgb, var(--ws-ink) 3%, transparent)' }}>
                  <p className="text-center text-sm italic" style={{ color: 'var(--ws-text-tertiary)' }}>
                    {current.type === 'flashcard' && 'Revise este conceito e marque como concluido quando se sentir confiante.'}
                    {current.type === 'question' && 'Resolva esta questao mentalmente e marque quando terminar.'}
                    {current.type === 'review' && 'Leia o resumo do topico e tente explicar em voz alta.'}
                  </p>
                </div>
                <Button className="mt-4 w-full rounded-ws-button" style={{ background: 'var(--ws-accent)', color: 'var(--ws-text-on-dark)' }} onClick={() => completeActivity(currentActivityIdx)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Concluir atividade
                </Button>
              </WabiSabiCard>
            </motion.div>
          </AnimatePresence>
        )}

        {sessionPaused && (
          <WabiSabiCard hover={false}>
            <div className="flex flex-col items-center py-8 text-center">
              <Coffee className="mb-3 h-10 w-10" style={{ color: 'var(--ws-gold)' }} />
              <p className="font-serif-jp text-lg font-semibold" style={{ color: 'var(--ws-text-primary)' }}>Sessao pausada</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--ws-text-tertiary)' }}>Tome um respiro. Estamos te esperando.</p>
              <Button className="mt-4 rounded-ws-button" style={{ background: 'var(--ws-accent)', color: 'var(--ws-text-on-dark)' }} onClick={() => setSessionPaused(false)}>
                <Play className="mr-2 h-4 w-4" /> Retomar
              </Button>
            </div>
          </WabiSabiCard>
        )}

        <div className="max-h-64 space-y-1.5 overflow-y-auto">
          {sessionActivities.map((act, idx) => (
            <div key={act.id} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: idx === currentActivityIdx ? 'color-mix(in srgb, var(--ws-accent) 6%, transparent)' : 'transparent', color: act.completed ? 'var(--ws-text-tertiary)' : 'var(--ws-text-secondary)' }}>
              {act.completed ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'var(--ws-verdigris)' }} /> : idx === currentActivityIdx ? <div className="h-3.5 w-3.5 animate-pulse rounded-full" style={{ background: 'var(--ws-accent)' }} /> : <div className="h-3.5 w-3.5 rounded-full border border-[var(--ws-glass-border)]" />}
              <span className={act.completed ? 'line-through' : ''}>{act.title}</span>
            </div>
          ))}
        </div>

        <Button variant="outline" className="w-full rounded-ws-button" style={{ borderColor: 'var(--ws-glass-border)', color: 'var(--ws-text-tertiary)' }} onClick={() => { setSessionActive(false); setSelectedTime(null); }}>Encerrar sessao</Button>
      </motion.div>
    );
  }

  // ===== RENDER: Emergency Plan =====
  if (emergencyPlan && emergencyPlan.length > 0 && !sessionActive) {
    return (
      <motion.div className="mx-auto max-w-2xl space-y-6 px-4 pb-8 pt-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        <button onClick={() => { setEmergencyPlan(null); setSelectedTime(null); }} className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70" style={{ color: 'var(--ws-accent)' }}>
          <ChevronUp className="h-4 w-4 rotate-180" /> Voltar
        </button>
        <WabiSabiCard hover={false} glass>
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" style={{ color: 'var(--ws-accent)' }} />
            <h1 className="font-serif-jp text-xl font-bold" style={{ color: 'var(--ws-text-primary)' }}>Plano de Emergencia</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--ws-text-secondary)' }}>Estudo priorizado para suas lacunas mais criticas.</p>
        </WabiSabiCard>
        <div className="space-y-2">
          {emergencyPlan.map((act, idx) => (
            <motion.div key={act.id} className="rounded-ws-card border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold" style={{ background: 'color-mix(in srgb, var(--ws-accent) 12%, transparent)', color: 'var(--ws-accent)' }}>{idx + 1}</div>
                <div className="flex-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--ws-text-primary)' }}>{act.title}</span>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
                    <Badge variant="outline" className="text-xs" style={{ borderColor: 'var(--ws-glass-border)', color: 'var(--ws-text-tertiary)' }}>{act.type}</Badge>
                    <span>{Math.round(act.duration / 60)} min</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <Button className="w-full rounded-ws-button py-6 text-base font-semibold" style={{ background: 'var(--ws-accent)', color: 'var(--ws-text-on-dark)' }} onClick={() => startSession(30)}>
          <Rocket className="mr-2 h-5 w-5" /> Iniciar sessao de emergencia (30 min)
        </Button>
      </motion.div>
    );
  }

  // ===== RENDER: Autopilot Plan =====
  if (autopilotPlan) {
    return (
      <motion.div className="mx-auto max-w-2xl space-y-6 px-4 pb-8 pt-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        <button onClick={() => setAutopilotPlan(null)} className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70" style={{ color: 'var(--ws-accent)' }}>
          <ChevronUp className="h-4 w-4 rotate-180" /> Voltar
        </button>
        <WabiSabiCard hover={false} glass>
          <div className="mb-3 flex items-center gap-2">
            <Compass className="h-5 w-5" style={{ color: 'var(--ws-accent)' }} />
            <h1 className="font-serif-jp text-xl font-bold" style={{ color: 'var(--ws-text-primary)' }}>{autopilotPlan.title}</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--ws-text-secondary)' }}>{autopilotPlan.summary}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {autopilotPlan.totalDays} dias</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {autopilotPlan.dailyHours}h/dia</span>
            <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {autopilotPlan.estimatedCoverage}</span>
          </div>
        </WabiSabiCard>

        {autopilotPlan.phases?.length > 0 && (
          <WabiSabiCard hover={false}>
            <h2 className="mb-3 font-serif-jp text-lg font-semibold" style={{ color: 'var(--ws-text-primary)' }}>Fases do Plano</h2>
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {autopilotPlan.phases.map((phase, idx) => (
                <motion.div key={idx} className="rounded-lg border border-[var(--ws-glass-border)] p-3" style={{ background: 'var(--ws-glass)' }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: 'var(--ws-text-primary)' }}>{phase.name}</span>
                    <Badge variant="outline" className="text-xs" style={{ borderColor: 'var(--ws-glass-border)', color: 'var(--ws-text-tertiary)' }}>{phase.days} dias</Badge>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: 'var(--ws-text-secondary)' }}>{phase.focus}</p>
                  {phase.activities?.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {phase.activities.map((act, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
                          <div className="h-1 w-1 rounded-full" style={{ background: 'var(--ws-gold)' }} />{act}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              ))}
            </div>
          </WabiSabiCard>
        )}

        {autopilotPlan.weeklySchedule?.length > 0 && (
          <WabiSabiCard hover={false}>
            <h2 className="mb-3 font-serif-jp text-lg font-semibold" style={{ color: 'var(--ws-text-primary)' }}>Rotina Semanal</h2>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {autopilotPlan.weeklySchedule.map((day, idx) => (
                <div key={idx} className="rounded-lg border border-[var(--ws-glass-border)] p-3" style={{ background: 'var(--ws-glass)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--ws-text-primary)' }}>{day.day}</span>
                  {day.blocks?.map((block, i) => (
                    <div key={i} className="mt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--ws-text-secondary)' }}>
                      <span className="font-mono font-medium" style={{ color: 'var(--ws-accent)' }}>{block.time}</span>
                      <span>{block.subject}</span>
                      <span style={{ color: 'var(--ws-text-tertiary)' }}>— {block.activity}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </WabiSabiCard>
        )}

        {autopilotPlan.milestones?.length > 0 && (
          <WabiSabiCard hover={false}>
            <h2 className="mb-3 font-serif-jp text-lg font-semibold" style={{ color: 'var(--ws-text-primary)' }}>Marcos</h2>
            <div className="space-y-2">
              {autopilotPlan.milestones.map((m, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-lg p-2" style={{ background: 'color-mix(in srgb, var(--ws-gold) 5%, transparent)' }}>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'color-mix(in srgb, var(--ws-gold) 15%, transparent)', color: 'var(--ws-gold)' }}>D{m.day}</div>
                  <span className="text-sm" style={{ color: 'var(--ws-text-secondary)' }}>{m.description}</span>
                </div>
              ))}
            </div>
          </WabiSabiCard>
        )}

        {autopilotPlan.tips?.length > 0 && (
          <WabiSabiCard hover={false}>
            <h2 className="mb-3 font-serif-jp text-lg font-semibold" style={{ color: 'var(--ws-text-primary)' }}>Dicas</h2>
            <div className="space-y-2">
              {autopilotPlan.tips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm" style={{ color: 'var(--ws-text-secondary)' }}>
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--ws-gold)' }} />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </WabiSabiCard>
        )}

        <Button className="w-full rounded-ws-button" style={{ background: 'var(--ws-accent)', color: 'var(--ws-text-on-dark)' }} onClick={() => { setAutopilotPlan(null); }}>
          <RotateCcw className="mr-2 h-4 w-4" /> Gerar novo plano
        </Button>
      </motion.div>
    );
  }

  // ===== MAIN VIEW =====
  return (
    <motion.div className="mx-auto max-w-2xl space-y-6 px-4 pb-8 pt-4" variants={containerVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants} className="text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] px-4 py-1.5 backdrop-blur-xl">
          <Zap className="h-4 w-4" style={{ color: 'var(--ws-accent)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--ws-text-secondary)' }}>Modo Emergencia</span>
        </div>
        <h1 className="font-serif-jp text-3xl font-bold" style={{ color: 'var(--ws-text-primary)' }}>Estudo Rapido</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--ws-text-tertiary)' }}>Maximize seu tempo com sessoes otimizadas</p>
      </motion.div>

      {/* Time Selector */}
      <motion.div variants={itemVariants}>
        <WabiSabiCard hover={false}>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--ws-accent) 12%, transparent)' }}>
              <Timer className="h-4 w-4" style={{ color: 'var(--ws-accent)' }} />
            </div>
            <div>
              <h2 className="font-serif-jp text-lg font-semibold" style={{ color: 'var(--ws-text-primary)' }}>Quanto tempo voce tem?</h2>
              <p className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>Escolha e receba uma sessao otimizada</p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {TIME_OPTIONS.map((opt) => (
              <motion.button key={opt.minutes} className="flex flex-col items-center gap-1 rounded-ws-button border p-3 transition-all" style={{ borderColor: selectedTime === opt.minutes ? 'var(--ws-accent)' : 'var(--ws-glass-border)', background: selectedTime === opt.minutes ? 'color-mix(in srgb, var(--ws-accent) 10%, transparent)' : 'var(--ws-glass)' }} onClick={() => startSession(opt.minutes)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Clock className="h-5 w-5" style={{ color: selectedTime === opt.minutes ? 'var(--ws-accent)' : 'var(--ws-text-tertiary)' }} />
                <span className="text-xs font-semibold" style={{ color: selectedTime === opt.minutes ? 'var(--ws-accent)' : 'var(--ws-text-primary)' }}>{opt.label}</span>
              </motion.button>
            ))}
          </div>
        </WabiSabiCard>
      </motion.div>

      {/* Emergency Mode */}
      <motion.div variants={itemVariants}>
        <WabiSabiCard hover={false} glass>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--ws-accent) 12%, transparent)' }}>
              <Flame className="h-5 w-5" style={{ color: 'var(--ws-accent)' }} />
            </div>
            <div className="flex-1">
              <h2 className="font-serif-jp text-lg font-semibold" style={{ color: 'var(--ws-text-primary)' }}>Modo Emergencia</h2>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>Analisa suas lacunas e cria um plano de estudo intensivo</p>
              <Button className="mt-3 rounded-ws-button" style={{ background: 'var(--ws-accent)', color: 'var(--ws-text-on-dark)' }} onClick={startEmergency} disabled={emergencyLoading}>
                {emergencyLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando...</> : <><AlertTriangle className="mr-2 h-4 w-4" /> Minha prova e amanha!</>}
              </Button>
            </div>
          </div>
        </WabiSabiCard>
      </motion.div>

      {/* Review Shorts */}
      <motion.div variants={itemVariants}>
        <WabiSabiCard hover={false}>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--ws-gold) 12%, transparent)' }}>
              <BookOpen className="h-4 w-4" style={{ color: 'var(--ws-gold)' }} />
            </div>
            <div>
              <h2 className="font-serif-jp text-lg font-semibold" style={{ color: 'var(--ws-text-primary)' }}>Review Shorts</h2>
              <p className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>Revise conceitos rapidamente, estilo TikTok</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg p-4" style={{ background: 'color-mix(in srgb, var(--ws-gold) 5%, transparent)' }}>
            <div className="flex-1">
              <p className="text-sm" style={{ color: 'var(--ws-text-secondary)' }}>Deslize por cards de revisao baseados nos seus topicos fracos. Perfeito para revisar em fila, no busao ou entre intervalos.</p>
            </div>
            <Button variant="outline" className="shrink-0 rounded-ws-button" style={{ borderColor: 'var(--ws-gold)', color: 'var(--ws-gold)' }} onClick={() => { loadReviewCards().then(() => startReview()); }}>
              <Play className="mr-1.5 h-4 w-4" /> Iniciar
            </Button>
          </div>
        </WabiSabiCard>
      </motion.div>

      {/* Autopilot */}
      <motion.div variants={itemVariants}>
        <WabiSabiCard hover={false} glass>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--ws-accent) 12%, transparent)' }}>
              <Compass className="h-4 w-4" style={{ color: 'var(--ws-accent)' }} />
            </div>
            <div>
              <h2 className="font-serif-jp text-lg font-semibold" style={{ color: 'var(--ws-text-primary)' }}>StudyAI Autopilot</h2>
              <p className="text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>Plano de estudo completo gerado por IA</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--ws-text-secondary)' }}>Prova / Materia</label>
              <Input placeholder="Ex: ENEM, Concurso Publico, Vestibular..." value={autopilotExam} onChange={(e) => setAutopilotExam(e.target.value)} className="rounded-ws-button border-[var(--ws-glass-border)] bg-[var(--ws-glass)]" style={{ color: 'var(--ws-text-primary)' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--ws-text-secondary)' }}>Data da prova (opcional)</label>
                <Input type="date" value={autopilotDate} onChange={(e) => setAutopilotDate(e.target.value)} className="rounded-ws-button border-[var(--ws-glass-border)] bg-[var(--ws-glass)]" style={{ color: 'var(--ws-text-primary)' }} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--ws-text-secondary)' }}>Horas/dia</label>
                <Input type="number" min="1" max="12" value={autopilotHours} onChange={(e) => setAutopilotHours(e.target.value)} className="rounded-ws-button border-[var(--ws-glass-border)] bg-[var(--ws-glass)]" style={{ color: 'var(--ws-text-primary)' }} />
              </div>
            </div>
            <Button className="w-full rounded-ws-button" style={{ background: 'var(--ws-accent)', color: 'var(--ws-text-on-dark)' }} onClick={generateAutopilot} disabled={autopilotLoading || !autopilotExam.trim()}>
              {autopilotLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando plano...</> : <><Rocket className="mr-2 h-4 w-4" /> Gerar plano automatico</>}
            </Button>
          </div>
        </WabiSabiCard>
      </motion.div>

      {/* Quick nav */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
        <button className="rounded-ws-card border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] p-4 text-left transition-all hover-lift" onClick={() => onNavigate('brain')}>
          <Brain className="mb-2 h-5 w-5" style={{ color: 'var(--ws-accent)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--ws-text-primary)' }}>Analise do Cerebro</span>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>Descubra suas lacunas</p>
        </button>
        <button className="rounded-ws-card border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] p-4 text-left transition-all hover-lift" onClick={() => onNavigate('roadmaps')}>
          <Sparkles className="mb-2 h-5 w-5" style={{ color: 'var(--ws-gold)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--ws-text-primary)' }}>Roadmaps</span>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>Planeje seu caminho</p>
        </button>
      </motion.div>
    </motion.div>
  );
}

export default EmergencyView;
