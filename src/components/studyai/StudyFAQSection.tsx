const questions = [
  {
    question: 'Posso começar sem pagar?',
    answer: 'Sim. O plano gratuito inclui até três cadernos, flashcards básicos e um limite diário de mensagens ao Sensei IA.',
  },
  {
    question: 'Preciso informar dados do cartão?',
    answer: 'Não. O plano gratuito não exige cartão. As assinaturas pagas estão em preparação.',
  },
  {
    question: 'Posso estudar no celular?',
    answer: 'Sim. Você pode acessar o StudyAI pelo navegador no computador ou celular.',
  },
  {
    question: 'Como a IA ajuda nos estudos?',
    answer: 'Use o Sensei para esclarecer dúvidas e apoiar sua revisão. Confira respostas e informações importantes em fontes confiáveis.',
  },
];

export function StudyFAQSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24 bg-[var(--ws-bg-dark)] py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ws-accent)]">Dúvidas frequentes</p>
        <h2 id="faq-title" className="mb-8 font-serif-jp text-3xl font-bold text-[var(--ws-text-primary)] sm:text-4xl">
          Tudo pronto para começar?
        </h2>
        <div className="space-y-3">
          {questions.map(({ question, answer }) => (
            <details key={question} className="group rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-surface)] px-5 py-4">
              <summary className="cursor-pointer pr-6 text-sm font-semibold text-[var(--ws-text-primary)]">{question}</summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ws-text-secondary)]">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
