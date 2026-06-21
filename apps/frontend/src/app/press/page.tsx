'use client'

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { useSelectedClub } from '@/lib/useSelectedClub';
import { playRawClick } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Stat';
import { getOfflineClub, getOfflineNews, OFFLINE_CLUBS } from '@/lib/game-data';
import { Mic, Newspaper, TrendingUp, TrendingDown, Quote, ChevronRight, Star } from 'lucide-react';

const PRESS_QUESTIONS = [
  {
    id: 1,
    question: 'How are you feeling about the upcoming match?',
    options: [
      { text: 'Confident. The squad is ready.', morale: +5, fans: +3, style: 'positive' },
      { text: 'Cautiously optimistic. We respect our opponents.', morale: +2, fans: +1, style: 'diplomatic' },
      { text: 'We will dominate. No doubt about it.', morale: +3, fans: +5, style: 'aggressive' },
      { text: 'No comment. We focus on the pitch.', morale: -2, fans: -3, style: 'evasive' },
    ],
  },
  {
    id: 2,
    question: 'Your star striker has been linked with a transfer. What is your response?',
    options: [
      { text: 'He is not for sale at any price.', morale: +3, fans: +4, style: 'defiant' },
      { text: 'Every player has his price, but we want to keep him.', morale: +1, fans: 0, style: 'pragmatic' },
      { text: 'If he wants to leave, the door is open.', morale: -5, fans: -4, style: 'honest' },
      { text: 'I will not discuss individual players.', morale: 0, fans: -1, style: 'evasive' },
    ],
  },
  {
    id: 3,
    question: 'The board expects a top-4 finish. Is that realistic?',
    options: [
      { text: 'Absolutely. That is the minimum target.', morale: +4, fans: +5, style: 'ambitious' },
      { text: 'It will be tough, but we will fight for it.', morale: +2, fans: +2, style: 'realistic' },
      { text: 'We are building for the long term.', morale: -1, fans: -2, style: 'patient' },
      { text: 'I do not set targets. I just win.', morale: +1, fans: +3, style: 'confident' },
    ],
  },
];

export default function PressPage() {
  const { club, hydrated } = useSelectedClub();
  const news = useMemo(() => club ? getOfflineNews(club.id) : [], [club]);

  const [currentQ, setCurrentQ] = useState(0);
  const [morale, setMorale] = useState(70);
  const [fanSentiment, setFanSentiment] = useState(65);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const handleAnswer = (optIdx: number) => {
    const opt = PRESS_QUESTIONS[currentQ].options[optIdx];
    setMorale((m) => Math.max(0, Math.min(100, m + opt.morale)));
    setFanSentiment((f) => Math.max(0, Math.min(100, f + opt.fans)));
    setAnswers((a) => [...a, optIdx]);
    playRawClick(0.2);

    if (currentQ < PRESS_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ((q) => q + 1), 500);
    } else {
      setTimeout(() => setDone(true), 500);
    }
  };


  // ---------- HYDRATION GUARD — prevent SSR crash when club is null ----------
  if (!hydrated || !club) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center h-full p-12 gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-gold-soft border-t-gold-300 animate-spin" />
          <p className="text-xs text-tertiary-c font-mono tracking-widest">LOADING…</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="px-4 sm:px-6 lg:px-8 py-6 pb-12 max-w-4xl mx-auto">
        <StaggerContainer className="mb-6" stagger={0.05}>
          <StaggerItem>
            <div className="section-header !mb-1">Media Center</div>
            <h1 className="font-headline text-3xl lg:text-4xl font-bold tracking-tight text-primary-c">Press Conference</h1>
            <p className="text-tertiary-c text-sm mt-1">{club!.name} · Pre-Match Briefing</p>
          </StaggerItem>
        </StaggerContainer>

        {/* Sentiment meters */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-tertiary-c font-mono uppercase tracking-widest">Squad Morale</span>
                <span className="text-sm font-mono font-bold text-gold-300 tabular-nums">{morale}%</span>
              </div>
              <ProgressBar value={morale} tone={morale >= 70 ? 'success' : morale >= 50 ? 'gold' : 'danger'} />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-tertiary-c font-mono uppercase tracking-widest">Fan Sentiment</span>
                <span className="text-sm font-mono font-bold text-gold-300 tabular-nums">{fanSentiment}%</span>
              </div>
              <ProgressBar value={fanSentiment} tone={fanSentiment >= 70 ? 'success' : fanSentiment >= 50 ? 'gold' : 'danger'} />
            </CardContent>
          </Card>
        </div>

        {/* Press Conference or Results */}
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div key={`q-${currentQ}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-gold-300" />
                    <CardTitle>Question {currentQ + 1} of {PRESS_QUESTIONS.length}</CardTitle>
                  </div>
                  <CardDescription>Choose your response carefully — it affects morale and fan sentiment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-md bg-surface-2/50 border-l-2 border-gold-300">
                    <Quote className="w-4 h-4 text-gold-300 mb-2" />
                    <p className="text-sm text-primary-c font-medium italic">
                      "{PRESS_QUESTIONS[currentQ].question}"
                    </p>
                  </div>

                  <div className="space-y-2">
                    {PRESS_QUESTIONS[currentQ].options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        className="w-full p-3 rounded-md border border-white/5 bg-surface-2 hover:border-gold-soft hover:bg-surface-3 transition-all text-left group"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-primary-c group-hover:text-gold-200 transition-colors flex-1">{opt.text}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {opt.morale !== 0 && (
                              <span className={cn('text-[10px] font-mono font-bold', opt.morale > 0 ? 'text-success' : 'text-danger')}>
                                {opt.morale > 0 ? '+' : ''}{opt.morale} M
                              </span>
                            )}
                            {opt.fans !== 0 && (
                              <span className={cn('text-[10px] font-mono font-bold', opt.fans > 0 ? 'text-success' : 'text-danger')}>
                                {opt.fans > 0 ? '+' : ''}{opt.fans} F
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-gold-300" />
                    <CardTitle>Press Conference Complete</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-center py-6">
                  <p className="text-sm text-secondary-c mb-4">
                    Your responses have been recorded. The media will react, players will take notice, and fans will judge.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 rounded-md bg-surface-2/50">
                      <div className="text-[10px] text-tertiary-c font-mono uppercase tracking-widest">Final Morale</div>
                      <div className="text-2xl font-mono font-bold text-gold-300">{morale}%</div>
                    </div>
                    <div className="p-3 rounded-md bg-surface-2/50">
                      <div className="text-[10px] text-tertiary-c font-mono uppercase tracking-widest">Fan Sentiment</div>
                      <div className="text-2xl font-mono font-bold text-gold-300">{fanSentiment}%</div>
                    </div>
                  </div>
                  <Button variant="gold" onClick={() => { playRawClick(0.2); window.history.back(); }}>
                    <ChevronRight className="w-4 h-4" /> Return to Dashboard
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Latest News */}
        <div className="mt-6">
          <div className="section-header">Media Buzz</div>
          <Card>
            <CardContent className="!p-0">
              <div className="divide-y divide-white/3">
                {news.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="px-4 py-3 hover:bg-white/3 cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <Badge variant={item.category === 'transfer' ? 'info' : item.category === 'injury' ? 'danger' : item.category === 'rumor' ? 'warning' : 'default'} size="sm">
                        {item.source}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-primary-c group-hover:text-gold-200 transition-colors text-truncate-2">{item.headline}</p>
                        <p className="text-[10px] text-tertiary-c font-mono mt-1">{item.time} ago · {item.category}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
