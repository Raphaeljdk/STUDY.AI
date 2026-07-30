'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { EnsoCircle } from './EnsoCircle';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const welcomeMessages: Message[] = [
  {
    role: 'assistant',
    content:
      'Konnichiwa! Sou o Sensei AI, seu tutor pessoal. Estou aqui para ajudá-lo em sua jornada de aprendizado. O que gostaria de estudar hoje?',
  },
];

export function AIChatPanel() {
  const [messages, setMessages] = useState<Message[]>(welcomeMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const userMsg = input.trim();
    if (!userMsg || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/sensei-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Desculpe, ocorreu um erro. Por favor, tente novamente.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="ai-chat" className="bg-[var(--ws-bg)] py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-24">
        {/* Section Title */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="mb-4 inline-block font-serif-jp text-sm tracking-[0.3em] text-[var(--ws-accent)]">
            先生
          </span>
          <h2 className="font-serif-jp text-3xl font-bold text-[var(--ws-text-primary)] lg:text-5xl">
            Converse com o Sensei
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-[var(--ws-text-secondary)]">
            Seu tutor de IA está sempre pronto para explicar conceitos, tirar dúvidas e guiar seus estudos.
          </p>
        </motion.div>

        {/* Chat Container */}
        <motion.div
          className="mx-auto max-w-3xl overflow-hidden rounded-ws-organic border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] shadow-[var(--ws-shadow-medium)] backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Chat Header */}
          <div className="flex items-center gap-4 border-b border-[var(--ws-glass-border)] px-6 py-4">
            <EnsoCircle size={36} strokeWidth={2} color="var(--ws-accent)" imperfection={0.1} animate={false} />
            <div>
              <h3 className="font-serif-jp text-base font-bold text-[var(--ws-text-primary)]">
                Sensei AI
              </h3>
              <p className="text-xs text-[var(--ws-text-tertiary)]">Seu tutor pessoal</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--ws-verdigris)]" />
              <span className="text-xs text-[var(--ws-text-tertiary)]">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="h-96 overflow-y-auto p-6">
            <div className="space-y-6">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {msg.role === 'assistant' && (
                      <EnsoCircle size={28} strokeWidth={1.5} color="var(--ws-accent)" imperfection={0.08} animate={false} />
                    )}
                    <div
                      className={`max-w-[80%] rounded-ws-organic px-5 py-3 ${
                        msg.role === 'user'
                          ? 'bg-[var(--ws-ink)] text-[var(--ws-text-on-dark)]'
                          : 'border border-[var(--ws-glass-border)] bg-white/60 text-[var(--ws-text-primary)]'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <EnsoCircle size={28} strokeWidth={1.5} color="var(--ws-accent)" imperfection={0.08} animate={false} />
                  <div className="flex items-center gap-1.5 rounded-ws-organic border border-[var(--ws-glass-border)] bg-white/60 px-5 py-3">
                    {[0, 1, 2].map((j) => (
                      <motion.div
                        key={j}
                        className="h-2 w-2 rounded-full bg-[var(--ws-text-tertiary)]"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: j * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-[var(--ws-glass-border)] p-4">
            <div className="flex items-center gap-3 rounded-ws-organic border border-[var(--ws-glass-border)] bg-white/60 px-4 py-3">
              <input
                ref={inputRef}
                type="text"
                placeholder="Faça uma pergunta sobre seus estudos..."
                className="flex-1 bg-transparent text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ws-accent)] text-[var(--ws-text-on-dark)] transition-colors hover:bg-[var(--ws-accent-hover)] disabled:opacity-50"
                aria-label="Enviar"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
