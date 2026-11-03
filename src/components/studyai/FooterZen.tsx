const footerLinks = [
  {
    title: 'Plataforma',
    links: [
      { label: 'Recursos', href: '#features' },
      { label: 'Como funciona', href: '#how-it-works' },
      { label: 'Planos', href: '#pricing' },
    ],
  },
  {
    title: 'Ajuda',
    links: [
      { label: 'Perguntas frequentes', href: '#faq' },
      { label: 'Voltar ao início', href: '#main-content' },
    ],
  },
];

export function FooterZen() {
  return (
    <footer className="border-t border-[var(--ws-glass-border)] bg-[var(--ws-bg-dark)]">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-14 md:grid-cols-2 lg:grid-cols-4 lg:px-24">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <img src="/studyai-logo.png" alt="" width={36} height={36} className="rounded-full object-cover" />
            <span className="font-serif-jp text-xl font-bold text-[var(--ws-text-primary)]">StudyAI</span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-[var(--ws-text-secondary)]">
            Um espaço para organizar, aprender e evoluir com apoio da inteligência artificial, respeitando seu ritmo.
          </p>
        </div>
        {footerLinks.map(({ title, links }) => (
          <nav key={title} aria-label={title}>
            <h2 className="mb-4 text-sm font-semibold text-[var(--ws-text-primary)]">{title}</h2>
            <ul className="space-y-3">
              {links.map(({ label, href }) => (
                <li key={href}>
                  <a href={href} className="text-sm text-[var(--ws-text-tertiary)] transition-colors hover:text-[var(--ws-accent)] hover:underline">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto flex max-w-[1440px] flex-wrap justify-between gap-4 border-t border-[var(--ws-glass-border)] px-6 py-6 lg:px-24">
        <p className="text-xs text-[var(--ws-text-tertiary)]">© {new Date().getFullYear()} StudyAI. Todos os direitos reservados.</p>
        <p className="font-serif-jp text-xs text-[var(--ws-text-tertiary)]">一期一会 — Cada encontro é único</p>
      </div>
    </footer>
  );
}
