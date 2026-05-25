  // ============ View switcher (Overview <-> App) ============
  const VIEW_KEY = 'squad-playbook-view';
  const STATE_KEY_FRESH = false; // restore previous view on refresh

  function setView(view, opts) {
    opts = opts || {};
    if (view === 'app') {
      document.body.classList.add('in-app');
      try { localStorage.setItem(VIEW_KEY, 'app'); } catch(e){}
    } else {
      document.body.classList.remove('in-app');
      try { localStorage.setItem(VIEW_KEY, 'overview'); } catch(e){}
    }
    if (!opts.silent) window.scrollTo({ top: 0, behavior: 'auto' });
  }

  // restore previous view
  try {
    if (localStorage.getItem(VIEW_KEY) === 'app') {
      setView('app', { silent: true });
    }
  } catch(e) {}

  const startBtns = document.querySelectorAll('#start-setup, #start-setup-hero');
  startBtns.forEach(btn => btn.addEventListener('click', () => { setView('app'); setTimeout(setActive, 0); }));

  const backLink = document.getElementById('back-to-overview');
  if (backLink) backLink.addEventListener('click', (e) => { e.preventDefault(); setView('overview'); });

  // ============ Logo (.brand) → volta pra overview quando em app ============
  document.querySelectorAll('.brand').forEach(logo => {
    logo.addEventListener('click', (e) => {
      if (document.body.classList.contains('in-app')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setView('overview');
      }
    });
  });

  // (Progresso por checkboxes removido — a página é instrucional;
  //  o tracker agora é preenchido por scroll, ver abaixo.)

  // ============ Progress Tracker (preenchido por SCROLL, não por checkbox) ============
  const tracker = document.getElementById('progress-tracker');
  if (tracker) {
    const trackerPct = document.getElementById('tracker-pct');
    const stageEls = [...document.querySelectorAll('#setup .stage[id]')];

    // Clicar num node rola até a etapa correspondente
    tracker.querySelectorAll('.tracker-node').forEach(node => {
      const btn = node.querySelector('.node-circle');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const target = stageEls[parseInt(node.dataset.stage, 10) - 1];
        if (!target) return;
        const isMobile = window.matchMedia('(max-width: 900px)').matches;
        const offset = isMobile ? 130 : 80;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
      });
    });

    // Linha de leitura = base do tracker fixo. A etapa "preenche" conforme passa por ela.
    const READ = () => tracker.getBoundingClientRect().bottom + 24;
    const stageProgress = (el) => {
      const r = el.getBoundingClientRect();
      return Math.max(0, Math.min(1, (READ() - r.top) / Math.max(1, r.height)));
    };

    // Node ativo = etapa no centro da tela
    let activeStage = 1;
    const applyActive = () => {
      tracker.querySelectorAll('.tracker-node').forEach(n => n.classList.remove('is-active'));
      const n = tracker.querySelector('.tracker-node[data-stage="' + activeStage + '"]');
      if (n) n.classList.add('is-active');
    };
    if ('IntersectionObserver' in window && stageEls.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          const id = parseInt(e.target.id.replace('stage-', ''), 10);
          if (id) { activeStage = id; applyActive(); }
        });
      }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
      stageEls.forEach(el => io.observe(el));
    }

    const updateTrackerScroll = () => {
      stageEls.forEach((el, i) => {
        const stageId = i + 1;
        const p = stageProgress(el);
        const node = tracker.querySelector('.tracker-node[data-stage="' + stageId + '"]');
        const lineFill = tracker.querySelector('.tracker-line[data-stage="' + stageId + '"] .tracker-line-fill');
        if (lineFill) lineFill.style.width = (p * 100) + '%';      // linha entre etapas
        if (node) node.classList.toggle('is-done', p >= 0.999);    // etapa já percorrida
      });
      if (trackerPct && stageEls.length) {
        const first = stageEls[0].getBoundingClientRect();
        const last = stageEls[stageEls.length - 1].getBoundingClientRect();
        const total = Math.max(1, last.bottom - first.top);
        const pct = Math.max(0, Math.min(1, (READ() - first.top) / total));
        trackerPct.textContent = Math.round(pct * 100) + '%';
      }
    };
    window.addEventListener('scroll', updateTrackerScroll, { passive: true });
    window.addEventListener('resize', updateTrackerScroll);
    window.addEventListener('load', updateTrackerScroll);
    // recalcula quando o layout muda (vídeos carregando, app aparecendo, etc.)
    if ('ResizeObserver' in window) {
      const content = document.querySelector('.content');
      if (content) new ResizeObserver(updateTrackerScroll).observe(content);
    }
    updateTrackerScroll();
    applyActive();
  }

  // ============ Sidebar sub-nav (scroll spy — destaca a etapa visível) ============
  {
    const stageEls = document.querySelectorAll('.stage[id]');
    if (stageEls.length && 'IntersectionObserver' in window) {
      const stageIO = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const stageId = entry.target.id.replace('stage-', '');
          document.querySelectorAll('.nav-sub.is-viewing').forEach(s => s.classList.remove('is-viewing'));
          const sub = document.querySelector('.nav-sub[data-nav-stage="' + stageId + '"]');
          if (sub) sub.classList.add('is-viewing');
        });
      }, { rootMargin: '-100px 0px -50% 0px', threshold: 0 });
      stageEls.forEach(el => stageIO.observe(el));
    }
  }

  // ============ Sidebar active state on scroll ============
  const navLinks = document.querySelectorAll('.sidebar .nav-link');
  const sections = [...document.querySelectorAll('.doc .section')];

  function setActive() {
    const y = window.scrollY + 120;
    let current = sections[0];
    for (const s of sections) { if (s.offsetTop <= y) current = s; }
    navLinks.forEach(a => {
      const id = a.getAttribute('href').slice(1);
      a.classList.toggle('active', current && current.id === id);
    });
  }
  setActive();
  window.addEventListener('scroll', setActive, { passive: true });
  window.addEventListener('resize', setActive);

  // ============ Mobile dropdown nav ============
  const mobileNav = document.getElementById('mobile-nav');
  if (mobileNav) {
    mobileNav.addEventListener('change', () => {
      const el = document.querySelector(mobileNav.value);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  }

  // ============ Smooth-scroll offset for in-page anchors ============
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (ev) => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      ev.preventDefault();
      const isMobile = window.matchMedia('(max-width: 900px)').matches;
      const offset = isMobile ? 70 : 12;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ============ Mobile phone toggle (injetado em cada .task-row.with-phone) ============
  document.querySelectorAll('.task-row.with-phone .task-main').forEach(taskMain => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'phone-toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg class="toggle-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="4" y="2" width="8" height="12" rx="1.5" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="12" r="0.7" fill="currentColor"/></svg><span class="toggle-text">Ver tela de exemplo</span>';
    taskMain.appendChild(btn);
    btn.addEventListener('click', () => {
      const taskRow = btn.closest('.task-row');
      const isOpen = taskRow.classList.toggle('phone-visible');
      btn.classList.toggle('is-open', isOpen);
      btn.setAttribute('aria-expanded', String(isOpen));
      const textEl = btn.querySelector('.toggle-text');
      if (textEl) textEl.textContent = isOpen ? 'Esconder tela' : 'Ver tela de exemplo';
    });
  });

  // ============ Wizard: treinamento guiado de agentes ============
  const wizardQuestions = [
    // ===== PARTE 1: SOBRE SEU NEGÓCIO =====
    {
      block: 'Sobre seu negócio',
      sectionIntro: 'Vamos começar com o básico. Essas informações ajudam o Waz a responder suas clientes com precisão.',
      key: 'horario',
      pdfLabel: 'Horário',
      q: 'Qual o horário de funcionamento do seu negócio?',
      hint: 'Ex: "Segunda a sábado, 9h às 18h" ou "Todos os dias, 10h às 22h"',
      type: 'text',
      placeholder: 'Seg a Sáb, 9h às 18h',
      recommended: true,
    },
    {
      block: 'Sobre seu negócio',
      key: 'localizacao',
      pdfLabel: 'Localização e entrega',
      q: 'Onde fica seu negócio? Você faz entrega?',
      hint: 'Endereço, bairro/região, se faz entrega e pra onde, valor do frete.',
      type: 'textarea',
      placeholder: 'Rua dos Doces, 42 — Vila Mariana, SP. Entrego na Zona Sul, frete R$ 10.',
      recommended: true,
    },
    {
      block: 'Sobre seu negócio',
      key: 'regras',
      pdfLabel: 'Regras',
      q: 'Quais são as regras do seu negócio que os clientes precisam saber?',
      hint: 'Prazos de encomenda, restrições, pedido mínimo, o que você NÃO faz...',
      type: 'textarea',
      placeholder: 'Encomendas com 48h de antecedência. Não faço sem glúten. Pedido mínimo pra entrega: R$ 50.',
    },
    {
      block: 'Sobre seu negócio',
      key: 'pagamento',
      pdfLabel: 'Pagamento',
      q: 'Quais formas de pagamento você aceita?',
      hint: 'Pix, cartão de crédito/débito, dinheiro, parcelamento...',
      type: 'text',
      placeholder: 'Pix, cartão (até 3x sem juros) e dinheiro',
    },
    {
      block: 'Sobre seu negócio',
      key: 'tom_voz',
      pdfLabel: 'Tom de voz',
      q: 'Qual tom de voz combina mais com seu negócio?',
      hint: 'Escolha o estilo que mais parece com a forma que você fala com suas clientes.',
      type: 'single-choice',
      options: [
        {
          value: 'carinhoso',
          label: '🤗 Carinhoso e próximo',
          desc: 'Chama pelo nome, pode usar termos como "querida", "flor", tom de conversa entre amigas.',
        },
        {
          value: 'simpatico',
          label: '😁 Simpático e profissional',
          desc: 'Educado e atencioso, mas sem intimidade excessiva. O mais escolhido por confeitarias.',
          recommended: true,
        },
        {
          value: 'direto',
          label: '📋 Direto e objetivo',
          desc: 'Responde rápido, sem enrolação. Informação clara e prática.',
        },
        {
          value: 'descolado',
          label: '😎 Descolado e informal',
          desc: 'Usa gírias leves, tom jovem, linguagem de rede social.',
        },
        {
          value: 'elegante',
          label: '✨ Elegante e formal',
          desc: 'Linguagem cuidada, tom premium. Pra marcas mais exclusivas.',
        },
      ],
    },
    {
      block: 'Sobre seu negócio',
      key: 'uso_emojis',
      pdfLabel: 'Uso de emojis',
      q: 'Com que frequência o Waz deve usar emojis?',
      hint: 'Emojis deixam a conversa mais leve, mas nem todo negócio combina.',
      type: 'choice-with-followup',
      recommended: false,
      options: [
        {
          value: 'sempre',
          label: 'Sempre',
          desc: 'Em quase toda mensagem.',
          followup: true,
        },
        {
          value: 'as_vezes',
          label: 'Às vezes',
          desc: 'Só pra dar um tom simpático, sem exagerar.',
          followup: true,
          recommended: true,
        },
        {
          value: 'nunca',
          label: 'Nunca',
          desc: 'Prefiro texto limpo, sem emojis.',
          followup: false,
        },
      ],
      followupKey: 'emojis_preferidos',
      followupHint: 'Quais emojis combinam com seu negócio? Ex: 🎂💕🍫😊✨',
      followupPlaceholder: '🎂💕😊',
    },
    {
      block: 'Sobre seu negócio',
      key: 'produto_top',
      pdfLabel: 'Produto mais vendido',
      q: 'Me conta sobre seu produto ou serviço mais vendido.',
      hint: 'Nome, preço, o que tem de especial, por que as clientes amam.',
      type: 'textarea',
      placeholder: 'Bolo Red Velvet (R$ 95) — é o mais pedido, a cobertura de cream cheese é feita na hora. As clientes pedem pra aniversário e casamento.',
    },
    {
      block: 'Sobre seu negócio',
      key: 'perguntas_frequentes',
      pdfLabel: 'Perguntas frequentes dos clientes',
      q: 'Quais dessas perguntas suas clientes mais fazem?',
      hint: 'Selecione todas que se aplicam. O Waz vai preparar respostas pra cada uma.',
      type: 'multi-choice',
      recommended: true,
      options: [
        { value: 'cardapio',         label: 'Quais sabores / opções vocês têm?' },
        { value: 'entrega',          label: 'Vocês fazem entrega? Pra onde?' },
        { value: 'prazo_encomenda',  label: 'Qual o prazo pra encomenda?' },
        { value: 'pagamento',        label: 'Quais formas de pagamento?' },
        { value: 'personalizado',    label: 'Fazem bolo personalizado / temático?' },
        { value: 'sem_restricao',    label: 'Tem opção sem glúten / sem lactose / vegano?' },
        { value: 'festa',            label: 'Fazem encomenda pra festa / evento?' },
        { value: 'desconto',         label: 'Tem desconto pra quantidade grande?' },
        { value: 'frete',            label: 'Quanto custa o frete / entrega?' },
        { value: 'disponibilidade',  label: 'Tem disponível pra hoje / amanhã?' },
      ],
      otherKey: 'perguntas_frequentes_outras',
      otherLabel: 'Outras perguntas que recebo',
      otherPlaceholder: 'Escreva outras perguntas que suas clientes fazem e não apareceram na lista acima...',
    },
    {
      block: 'Sobre seu negócio',
      key: 'extra_negocio',
      pdfLabel: 'Extra',
      q: 'Tem mais alguma coisa que você acha importante o Waz saber?',
      hint: 'Qualquer detalhe que não coube nas perguntas anteriores. Se não tiver nada, pode pular.',
      type: 'textarea',
      placeholder: 'A gente fecha em feriados. Em dezembro o prazo de encomenda sobe pra 5 dias.',
    },

    // ===== PARTE 2: COMO A IA PODE TE AJUDAR =====
    {
      block: 'Como a IA pode te ajudar',
      sectionIntro: 'Agora vamos entender sua rotina. Isso ajuda os agentes a priorizarem o que mais importa pra você.',
      key: 'gasta_tempo',
      pdfLabel: 'O que mais toma tempo',
      q: 'O que te toma mais tempo no dia a dia?',
      hint: 'Selecione tudo que pesa na sua rotina. Seus agentes vão focar nisso primeiro.',
      type: 'multi-choice',
      recommended: true,
      options: [
        { value: 'responder_whatsapp',     label: 'Responder mensagens no WhatsApp' },
        { value: 'responder_instagram',    label: 'Responder DMs e comentários no Instagram' },
        { value: 'criar_conteudo',         label: 'Criar posts e conteúdo pro Instagram' },
        { value: 'cobrar_clientes',        label: 'Cobrar clientes / correr atrás de pagamento' },
        { value: 'controle_financeiro',    label: 'Organizar o financeiro (fluxo de caixa, notas)' },
        { value: 'agendar_entregas',       label: 'Organizar entregas e agendamentos' },
        { value: 'mesmas_perguntas',       label: 'Responder as mesmas perguntas toda hora' },
        { value: 'orcamentos',             label: 'Fazer orçamentos e montar propostas' },
        { value: 'reativar_clientes',      label: 'Lembrar de clientes que sumiram' },
        { value: 'marketing_geral',        label: 'Pensar em promoções e campanhas' },
      ],
      otherKey: 'gasta_tempo_outros',
      otherLabel: 'Outra coisa que toma meu tempo',
      otherPlaceholder: 'Descreva o que mais consome seu tempo e não apareceu na lista...',
    },
    {
      block: 'Como a IA pode te ajudar',
      key: 'ia_ajuda',
      pdfLabel: 'Como a IA ajuda',
      q: 'Como você imagina que a IA poderia te ajudar?',
      hint: 'Não precisa ser técnico. Descreva o resultado que quer, como se tivesse contratando um assistente.',
      type: 'textarea',
      placeholder: 'Queria que respondesse o WhatsApp com as informações certas e só me chamasse quando fosse algo que eu preciso resolver pessoalmente.',
    },
    {
      block: 'Como a IA pode te ajudar',
      key: 'nao_delegar',
      pdfLabel: 'Não delegar pra IA',
      q: 'Quais tarefas você acha que NÃO dá pra delegar?',
      hint: 'Selecione tudo que só você pode fazer. Seus agentes vão respeitar esses limites.',
      type: 'multi-choice',
      recommended: false,
      options: [
        { value: 'precificar_grandes',    label: 'Decidir preço de encomendas grandes / personalizadas' },
        { value: 'reclamacoes',           label: 'Resolver reclamações e problemas' },
        { value: 'negociar_desconto',     label: 'Negociar descontos com clientes' },
        { value: 'fornecedores',          label: 'Negociar com fornecedores' },
        { value: 'clientes_vip',          label: 'Atender clientes especiais / VIP' },
        { value: 'decisoes_negocio',      label: 'Decisões estratégicas do negócio' },
      ],
      otherKey: 'nao_delegar_outros',
      otherLabel: 'Outra tarefa que só eu faço',
      otherPlaceholder: 'Descreva outras tarefas que você não quer que a IA faça...',
    },

 
    {
      block: 'Quando chamar você',
      key: 'extra_agentes',
      pdfLabel: 'Observações extras',
      q: 'Última pergunta: tem algo mais que queira dizer pros seus agentes?',
      hint: 'Campo livre. Qualquer coisa que não foi coberta. Se não tiver, pode finalizar.',
      type: 'textarea',
      placeholder: '',
    },
  ];

  // Ordem das partes (pra "Parte X de N" nas telas de transição)
  const wizardSections = wizardQuestions
    .filter(q => q.sectionIntro)
    .map(q => q.block);

  const WIZARD_STORAGE_KEY = 'squad-wizard-answers-v3';
  const wizard = document.getElementById('wizard');
  const wizardCard = document.getElementById('wizard-card');
  const wizardFill = document.getElementById('wizard-progress-fill');
  const wizardProgressText = document.getElementById('wizard-progress-text');
  const wizardCloseBtn = document.getElementById('wizard-close');
  const wizardSkipBtn = document.getElementById('wizard-skip');
  const startWizardBtn = document.getElementById('start-wizard-btn');

  const wizardState = {
    answers: {},
    currentIndex: 0,
    completed: false,
  };

  function wizardLoad() {
    try {
      const raw = localStorage.getItem(WIZARD_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        wizardState.answers = parsed.answers || {};
        wizardState.currentIndex = Math.min(parsed.currentIndex || 0, wizardQuestions.length);
        wizardState.completed = !!parsed.completed;
      }
    } catch (e) {}
  }
  function wizardSave() {
    try {
      localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(wizardState));
    } catch (e) {}
  }

  function wizardOpen() {
    wizardLoad();
    if (wizardState.completed) {
      renderDone(true);
    } else {
      renderQuestion(wizardState.currentIndex, 'forward');
    }
    document.body.classList.add('in-wizard');
    wizard.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      const input = wizardCard.querySelector('.wizard-input, .wizard-textarea');
      if (input) input.focus();
    }, 350);
  }
  function wizardClose() {
    document.body.classList.remove('in-wizard');
    wizard.setAttribute('aria-hidden', 'true');
  }

  function updateWizardProgress() {
    const total = wizardQuestions.length;
    const current = Math.min(wizardState.currentIndex + 1, total);
    const pct = wizardState.completed ? 100 : Math.round((current - 1) / total * 100);
    wizardFill.style.width = pct + '%';
    wizardProgressText.textContent = wizardState.completed ? 'Concluído' : current + ' de ' + total;
    wizardSkipBtn.style.visibility = wizardState.completed ? 'hidden' : 'visible';
  }

  function hasAnswer(q) {
    const ans = wizardState.answers[q.key];
    if (q.type === 'multi-choice') return Array.isArray(ans) && ans.length > 0;
    if (q.type === 'single-choice' || q.type === 'choice-with-followup') return !!ans;
    return typeof ans === 'string' && ans.trim().length > 0;
  }
  function updateNextButton() {
    const nextBtn = document.getElementById('wizard-next');
    if (!nextBtn) return;
    const q = wizardQuestions[wizardState.currentIndex];
    if (!q) return;
    nextBtn.disabled = !hasAnswer(q);
  }

  function renderQuestion(index, direction, opts) {
    direction = direction || 'forward';
    opts = opts || {};
    const leavingClass = direction === 'back' ? 'is-leaving-back' : 'is-leaving-forward';
    const enteringClass = direction === 'back' ? 'is-entering-back' : 'is-entering-forward';

    // Tela de transição entre partes: ao chegar (indo pra frente) na 1ª pergunta
    // de uma parte, mostra a intro da seção antes da pergunta em si.
    const sectionStart = wizardQuestions[index];
    if (direction === 'forward' && sectionStart && sectionStart.sectionIntro && !opts.skipIntro) {
      renderSectionIntro(index, direction);
      return;
    }

    const buildAndShow = () => {
      const q = wizardQuestions[index];
      const isText = q.type === 'text' || q.type === 'textarea';
      const isSingle = q.type === 'single-choice';
      const isMulti = q.type === 'multi-choice';
      const isFollowup = q.type === 'choice-with-followup';

      const introHtml = q.intro ? '<p class="wizard-intro">' + escapeHtml(q.intro) + '</p>' : '';

      let bodyHtml = '';
      if (isText) {
        const value = escapeAttr(wizardState.answers[q.key] || '');
        const ph = escapeAttr(q.placeholder || '');
        bodyHtml = q.type === 'textarea'
          ? '<textarea class="wizard-textarea" id="wizard-current-input" placeholder="' + ph + '" rows="2">' + value + '</textarea>'
          : '<input type="text" class="wizard-input" id="wizard-current-input" placeholder="' + ph + '" value="' + value + '" />';

        // Chips de sugestão rápida (se a pergunta tiver examples)
        if (Array.isArray(q.examples) && q.examples.length) {
          const splitRe = q.type === 'textarea' ? /\n+/ : /,\s*/;
          const savedTokens = (wizardState.answers[q.key] || '')
            .split(splitRe).map(s => s.trim()).filter(Boolean);
          bodyHtml += '<div class="wizard-examples">' +
            '<span class="wizard-examples-label">Sugestões rápidas:</span>' +
            '<div class="wizard-chips">';
          q.examples.forEach(ex => {
            const isSel = savedTokens.includes(ex);
            bodyHtml += '<button type="button" class="wizard-chip' + (isSel ? ' is-selected' : '') + '">' +
              escapeHtml(ex) + '</button>';
          });
          bodyHtml += '</div></div>';
        }
      } else if (isSingle || isFollowup) {
        const selectedValue = wizardState.answers[q.key] || '';
        bodyHtml = '<div class="wizard-options" role="radiogroup">';
        q.options.forEach(opt => {
          const isSelected = selectedValue === opt.value;
          bodyHtml += '<button type="button" class="wizard-option' + (isSelected ? ' is-selected' : '') + '" role="radio" aria-checked="' + isSelected + '" data-value="' + escapeAttr(opt.value) + '">' +
            '<span class="wizard-option-marker"></span>' +
            '<span class="wizard-option-text">' +
              '<strong>' + escapeHtml(opt.label) + '</strong>' +
              (opt.desc ? '<span>' + escapeHtml(opt.desc) + '</span>' : '') +
            '</span>' +
            (opt.recommended ? '<span class="tag-recommended wizard-option-rec">recomendado</span>' : '') +
          '</button>';
        });
        if (isFollowup) {
          const selectedOpt = q.options.find(o => o.value === selectedValue);
          const showFollowup = selectedOpt && selectedOpt.followup;
          const fpValue = escapeAttr(wizardState.answers[q.followupKey] || '');
          bodyHtml += '<div class="wizard-followup' + (showFollowup ? '' : ' is-hidden') + '">';
          if (q.followupHint) bodyHtml += '<p class="wizard-followup-hint">' + escapeHtml(q.followupHint) + '</p>';
          bodyHtml += '<input type="text" class="wizard-input wizard-followup-input" placeholder="' + escapeAttr(q.followupPlaceholder || '') + '" value="' + fpValue + '" />';
          bodyHtml += '</div>';
        }
        bodyHtml += '</div>';
      } else if (isMulti) {
        const selectedValues = Array.isArray(wizardState.answers[q.key]) ? wizardState.answers[q.key] : [];
        bodyHtml = '<div class="wizard-options">';
        q.options.forEach(opt => {
          const isSelected = selectedValues.includes(opt.value);
          bodyHtml += '<button type="button" class="wizard-option is-multi' + (isSelected ? ' is-selected' : '') + '" aria-pressed="' + isSelected + '" data-value="' + escapeAttr(opt.value) + '">' +
            '<span class="wizard-option-marker"></span>' +
            '<span class="wizard-option-text"><strong>' + escapeHtml(opt.label) + '</strong></span>' +
          '</button>';
        });
        if (q.otherKey) {
          const otherSelected = selectedValues.includes('__other__');
          const otherValue = escapeAttr(wizardState.answers[q.otherKey] || '');
          bodyHtml += '<button type="button" class="wizard-option is-multi' + (otherSelected ? ' is-selected' : '') + '" aria-pressed="' + otherSelected + '" data-value="__other__">' +
            '<span class="wizard-option-marker"></span>' +
            '<span class="wizard-option-text"><strong>' + escapeHtml(q.otherLabel || 'Outros') + '</strong></span>' +
          '</button>';
          bodyHtml += '<div class="wizard-other' + (otherSelected ? '' : ' is-hidden') + '">';
          bodyHtml += '<textarea class="wizard-textarea wizard-other-input" placeholder="' + escapeAttr(q.otherPlaceholder || '') + '" rows="2">' + otherValue + '</textarea>';
          bodyHtml += '</div>';
        }
        bodyHtml += '</div>';
      }

      wizardCard.innerHTML =
        '<div class="wizard-eyebrow">' + escapeHtml(q.block) + '</div>' +
        '<h1 class="wizard-q" id="wizard-question-text">' + escapeHtml(q.q) +
          (q.recommended ? ' <span class="tag-recommended">recomendado</span>' : '') +
        '</h1>' +
        (q.hint ? '<p class="wizard-hint">' + escapeHtml(q.hint) + '</p>' : '') +
        introHtml +
        bodyHtml +
        '<div class="wizard-actions">' +
          '<button class="wizard-back" type="button" id="wizard-back"' + (index === 0 ? ' disabled' : '') + '>' +
            '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 3l-4 4 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            'Voltar' +
          '</button>' +
          '<div class="wizard-actions-right">' +
            '<button class="wizard-next-skip" type="button">Pular</button>' +
            '<button class="wizard-next" type="button" id="wizard-next" disabled>' +
              (index === wizardQuestions.length - 1 ? 'Finalizar' : 'Próximo') +
              '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>';

      wizardCard.classList.remove('is-leaving-forward', 'is-leaving-back');
      wizardCard.classList.add(enteringClass);
      setTimeout(() => wizardCard.classList.remove(enteringClass), 360);

      // Text/textarea handlers
      const input = document.getElementById('wizard-current-input');
      if (input) {
        input.addEventListener('input', () => {
          wizardState.answers[q.key] = input.value.trim();
          wizardSave();
          updateNextButton();
          if (q.type === 'textarea') {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 180) + 'px';
          }
        });
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && (q.type !== 'textarea' || (e.metaKey || e.ctrlKey))) {
            e.preventDefault();
            advance();
          }
        });
        if (q.type === 'textarea' && input.value) {
          input.style.height = 'auto';
          input.style.height = Math.min(input.scrollHeight, 180) + 'px';
        }
        setTimeout(() => input.focus(), 50);
      }

      // Chips de sugestão: adicionam/removem o texto no campo, preservando o que foi digitado
      if (input && Array.isArray(q.examples) && q.examples.length) {
        const sep = q.type === 'textarea' ? '\n' : ', ';
        const splitRe = q.type === 'textarea' ? /\n+/ : /,\s*/;
        wizardCard.querySelectorAll('.wizard-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            chip.classList.toggle('is-selected');
            const selectedChips = Array.from(wizardCard.querySelectorAll('.wizard-chip.is-selected'))
              .map(c => c.textContent);
            // Mantém o texto livre (tokens que não são chips) e reanexa os chips selecionados
            const tokens = input.value.split(splitRe).map(s => s.trim()).filter(Boolean);
            const freeTokens = tokens.filter(t => !q.examples.includes(t));
            input.value = freeTokens.concat(selectedChips).join(sep);
            input.dispatchEvent(new Event('input'));
            if (q.type === 'textarea') {
              input.style.height = 'auto';
              input.style.height = Math.min(input.scrollHeight, 180) + 'px';
            }
          });
        });
      }

      // Option handlers (single/multi/followup)
      const opts = wizardCard.querySelectorAll('.wizard-option');
      opts.forEach(opt => {
        opt.addEventListener('click', () => {
          const value = opt.dataset.value;
          if (isMulti) {
            let arr = Array.isArray(wizardState.answers[q.key]) ? wizardState.answers[q.key].slice() : [];
            const idx = arr.indexOf(value);
            if (idx >= 0) {
              arr.splice(idx, 1);
              opt.classList.remove('is-selected');
              opt.setAttribute('aria-pressed', 'false');
            } else {
              arr.push(value);
              opt.classList.add('is-selected');
              opt.setAttribute('aria-pressed', 'true');
            }
            wizardState.answers[q.key] = arr;
            if (value === '__other__') {
              const otherDiv = wizardCard.querySelector('.wizard-other');
              if (otherDiv) {
                const showing = arr.includes('__other__');
                otherDiv.classList.toggle('is-hidden', !showing);
                if (showing) {
                  const ta = otherDiv.querySelector('textarea');
                  if (ta) setTimeout(() => ta.focus(), 50);
                }
              }
            }
          } else {
            opts.forEach(o => { o.classList.remove('is-selected'); o.setAttribute('aria-checked', 'false'); });
            opt.classList.add('is-selected');
            opt.setAttribute('aria-checked', 'true');
            wizardState.answers[q.key] = value;
            if (isFollowup) {
              const selectedOpt = q.options.find(o => o.value === value);
              const followupDiv = wizardCard.querySelector('.wizard-followup');
              if (followupDiv) {
                const showFollowup = selectedOpt && selectedOpt.followup;
                followupDiv.classList.toggle('is-hidden', !showFollowup);
                if (showFollowup) {
                  const inp = followupDiv.querySelector('input');
                  if (inp) setTimeout(() => inp.focus(), 50);
                } else if (q.followupKey) {
                  delete wizardState.answers[q.followupKey];
                }
              }
            }
          }
          wizardSave();
          updateNextButton();
        });
      });

      // Followup input
      const followupInput = wizardCard.querySelector('.wizard-followup-input');
      if (followupInput) {
        followupInput.addEventListener('input', () => {
          wizardState.answers[q.followupKey] = followupInput.value.trim();
          wizardSave();
        });
        followupInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); advance(); }
        });
      }

      // Other (multi) input
      const otherInput = wizardCard.querySelector('.wizard-other-input');
      if (otherInput) {
        otherInput.addEventListener('input', () => {
          wizardState.answers[q.otherKey] = otherInput.value.trim();
          wizardSave();
          otherInput.style.height = 'auto';
          otherInput.style.height = Math.min(otherInput.scrollHeight, 180) + 'px';
        });
        if (otherInput.value) {
          otherInput.style.height = 'auto';
          otherInput.style.height = Math.min(otherInput.scrollHeight, 180) + 'px';
        }
      }

      document.getElementById('wizard-next').addEventListener('click', advance);
      document.getElementById('wizard-back').addEventListener('click', goBack);
      const inlineSkip = wizardCard.querySelector('.wizard-next-skip');
      if (inlineSkip) inlineSkip.addEventListener('click', skip);

      wizardState.currentIndex = index;
      wizardSave();
      updateWizardProgress();
      updateNextButton();
    };

    if (wizardCard.children.length) {
      wizardCard.classList.add(leavingClass);
      setTimeout(buildAndShow, 220);
    } else {
      buildAndShow();
    }
  }

  // Tela de transição entre as partes do wizard
  function renderSectionIntro(index, direction) {
    direction = direction || 'forward';
    const leavingClass = direction === 'back' ? 'is-leaving-back' : 'is-leaving-forward';
    const enteringClass = direction === 'back' ? 'is-entering-back' : 'is-entering-forward';

    const buildAndShow = () => {
      const q = wizardQuestions[index];
      const partNum = wizardSections.indexOf(q.block) + 1;
      const totalParts = wizardSections.length;

      wizardCard.innerHTML =
        '<div class="wizard-section-intro">' +
          '<span class="wizard-section-label">Parte ' + partNum + ' de ' + totalParts + '</span>' +
          '<h2 class="wizard-section-title" id="wizard-question-text">' + escapeHtml(q.block) + '</h2>' +
          '<p class="wizard-section-desc">' + escapeHtml(q.sectionIntro) + '</p>' +
          '<button class="wizard-section-continue" type="button" id="wizard-section-continue">Continuar →</button>' +
        '</div>';

      wizardCard.classList.remove('is-leaving-forward', 'is-leaving-back');
      wizardCard.classList.add(enteringClass);
      setTimeout(() => wizardCard.classList.remove(enteringClass), 360);

      const continueBtn = document.getElementById('wizard-section-continue');
      if (continueBtn) {
        continueBtn.addEventListener('click', () => renderQuestion(index, 'forward', { skipIntro: true }));
        setTimeout(() => continueBtn.focus(), 50);
      }

      wizardState.currentIndex = index;
      wizardSave();
      updateWizardProgress();
    };

    if (wizardCard.children.length) {
      wizardCard.classList.add(leavingClass);
      setTimeout(buildAndShow, 220);
    } else {
      buildAndShow();
    }
  }

  function advance() {
    const idx = wizardState.currentIndex;
    if (idx >= wizardQuestions.length - 1) {
      wizardState.completed = true;
      wizardSave();
      renderDone(false);
    } else {
      renderQuestion(idx + 1, 'forward');
    }
  }
  function goBack() {
    const idx = wizardState.currentIndex;
    if (idx <= 0) return;
    renderQuestion(idx - 1, 'back');
  }
  function skip() {
    if (wizardState.completed) return;
    advance();
  }

  function renderDone(isResume) {
    wizardCard.classList.remove('is-leaving-forward', 'is-leaving-back');
    const direction = isResume ? 'forward' : 'forward';
    wizardCard.classList.add('is-entering-' + direction);
    setTimeout(() => wizardCard.classList.remove('is-entering-' + direction), 360);

    // Build summary grouped by block
    const blocks = [];
    const blockMap = {};
    wizardQuestions.forEach(q => {
      if (!blockMap[q.block]) {
        blockMap[q.block] = { name: q.block, rows: [] };
        blocks.push(blockMap[q.block]);
      }
      blockMap[q.block].rows.push(q);
    });
    let summaryHtml = '';
    blocks.forEach(b => {
      summaryHtml += '<div class="wizard-summary-block">';
      summaryHtml += '<div class="wizard-summary-eyebrow">' + b.name + '</div>';
      b.rows.forEach(q => {
        const formatted = formatAnswer(q);
        const aHtml = formatted ? '<span class="a">' + escapeHtml(formatted) + '</span>' : '<span class="a empty">não respondida</span>';
        const qIdx = wizardQuestions.indexOf(q);
        summaryHtml += '<div class="wizard-summary-row">' +
          '<span class="q">' + escapeHtml(q.q) + '</span>' +
          aHtml +
          '<button class="edit" type="button" data-edit="' + qIdx + '" aria-label="Editar resposta">editar</button>' +
        '</div>';
      });
      summaryHtml += '</div>';
    });

    wizardCard.innerHTML =
      '<div class="wizard-done">' +
        '<div class="wizard-done-mark" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</div>' +
        '<h1 id="wizard-question-text">Pronto. Seu time já tem o briefing.</h1>' +
        '<p class="wizard-done-sub">A gente organizou suas respostas num PDF estruturado pra alimentar o Waz, a Maky e o Fin de uma vez só.</p>' +
        '<div class="wizard-summary">' + summaryHtml + '</div>' +
        '<div class="wizard-done-actions">' +
          '<button class="wizard-download" type="button" id="wizard-download">' +
            '<svg viewBox="0 0 16 16" fill="none"><path d="M8 2v9m0 0l-3-3m3 3l3-3M3 14h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            'Baixar PDF' +
          '</button>' +
          '<button class="wizard-review" type="button" id="wizard-review">Revisar respostas</button>' +
        '</div>' +
        '<p class="wizard-done-aux">Agora envie esse PDF na conversa com o <b>Waz</b> em <b>Assistentes</b>. Ele lê e distribui as informações pra Maky e Fin automaticamente.</p>' +
      '</div>';

    document.getElementById('wizard-download').addEventListener('click', downloadPDF);
    document.getElementById('wizard-review').addEventListener('click', () => {
      wizardState.completed = false;
      wizardState.currentIndex = 0;
      wizardSave();
      renderQuestion(0, 'back');
    });
    wizardCard.querySelectorAll('button[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.edit, 10);
        wizardState.completed = false;
        wizardSave();
        renderQuestion(idx, 'back');
      });
    });

    // (Auto-check de t-1-3 acontece no downloadPDF — quando o usuário baixa o PDF)

    updateWizardProgress();
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function formatAnswer(q) {
    const ans = wizardState.answers[q.key];
    if (q.type === 'multi-choice') {
      const arr = Array.isArray(ans) ? ans : [];
      if (!arr.length) return '';
      const labels = arr.filter(v => v !== '__other__').map(v => {
        const opt = q.options.find(o => o.value === v);
        return opt ? opt.label : v;
      });
      if (arr.includes('__other__')) {
        const otherText = wizardState.answers[q.otherKey];
        labels.push((q.otherLabel || 'Outros') + (otherText ? ': ' + otherText : ''));
      }
      return labels.join('; ');
    }
    if (q.type === 'single-choice' || q.type === 'choice-with-followup') {
      if (!ans) return '';
      const opt = q.options.find(o => o.value === ans);
      let label = opt ? opt.label : String(ans);
      if (q.type === 'choice-with-followup') {
        const fp = wizardState.answers[q.followupKey];
        if (fp) label += ' — ' + fp;
      }
      return label;
    }
    return ans ? String(ans) : '';
  }

  // O font padrão do jsPDF não suporta emoji — remove pra não quebrar o texto do PDF
  function pdfSafe(str) {
    return String(str == null ? '' : str)
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu, '')
      .replace(/\s{2,}/g, ' ')          // colapsa espaços
      .replace(/\s+([—/:])\s*$/, '')    // remove separador solto no fim
      .trim();
  }

  function downloadPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('PDF ainda carregando — tenta de novo em 1 segundo.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(17, 24, 39);
    doc.text('Perfil do Negócio', margin, y);
    y += 24;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128);
    doc.text('Gerado pelo Playbook Squad', margin, y);
    y += 22;
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 26;

    // Mini-prompt pro Waz (instrução no topo do documento)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    const promptLines = doc.splitTextToSize(
      'Waz, preciso que siga essas diretrizes para atender os clientes do meu negócio:',
      maxWidth
    );
    promptLines.forEach(line => {
      if (y > pageHeight - margin) { doc.addPage(); y = margin; }
      doc.text(line, margin, y); y += 16;
    });
    y += 14;

    const blocks = [];
    const blockMap = {};
    wizardQuestions.forEach(q => {
      if (!blockMap[q.block]) {
        blockMap[q.block] = { name: q.block, rows: [] };
        blocks.push(blockMap[q.block]);
      }
      blockMap[q.block].rows.push(q);
    });

    blocks.forEach(block => {
      // Só inclui no PDF as perguntas respondidas; pula a parte inteira se vazia
      const filledRows = block.rows.filter(q => !!formatAnswer(q));
      if (!filledRows.length) return;

      if (y > pageHeight - 120) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(17, 24, 39);
      doc.text(block.name.toUpperCase(), margin, y);
      y += 16;
      doc.setDrawColor(17, 24, 39);
      doc.setLineWidth(1.4);
      doc.line(margin, y - 4, margin + 32, y - 4);
      doc.setLineWidth(0.5);
      y += 12;

      filledRows.forEach(q => {
        const label = q.pdfLabel || q.q;
        const answer = formatAnswer(q).replace(/\s*\n\s*/g, ' / ');
        const bullet = pdfSafe('•  ' + label + ': ' + answer);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(17, 24, 39);
        const lines = doc.splitTextToSize(bullet, maxWidth - 10);
        lines.forEach((line, i) => {
          if (y > pageHeight - margin) { doc.addPage(); y = margin; }
          doc.text(line, margin + (i === 0 ? 0 : 12), y);
          y += 15;
        });
        y += 6;
      });
      y += 14;
    });

    const totalPages = doc.internal.getNumberOfPages();
    const today = new Date().toLocaleDateString('pt-BR');
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.text('Gerado em ' + today + '  ·  Squad', margin, pageHeight - 24);
      doc.text(i + '/' + totalPages, pageWidth - margin, pageHeight - 24, { align: 'right' });
    }

    doc.save('perfil-negocio-squad.pdf');

    const tWazDoc = document.getElementById('t-1-3'); // "Enviei o documento pro Waz" (Etapa 1: Treinamento)
    if (tWazDoc && !tWazDoc.checked) {
      tWazDoc.checked = true;
      tWazDoc.dispatchEvent(new Event('change'));
    }
  }

  if (startWizardBtn) startWizardBtn.addEventListener('click', wizardOpen);
  if (wizardCloseBtn) wizardCloseBtn.addEventListener('click', wizardClose);
  if (wizardSkipBtn) wizardSkipBtn.addEventListener('click', skip);

  document.addEventListener('keydown', (e) => {
    if (!document.body.classList.contains('in-wizard')) return;
    if (e.key === 'Escape') wizardClose();
  });

  /* ---- Testimonial Card Expand/Collapse ---- */
  const tcardOverlay = document.getElementById('tcard-overlay');
  const tcardClose = document.getElementById('tcard-close');

  if (tcardOverlay) {
    const testimonialData = [
      {
        name: 'Brigadayros',
        role: 'Confeitaria artesanal · São Paulo',
        quote: '"Antes do Squad, eu passava 4 horas por dia só respondendo WhatsApp. Agora o Waz cuida de tudo e eu consigo focar na produção. As vendas aumentaram porque nenhuma cliente fica sem resposta, mesmo de madrugada." (placeholder)',
        agents: ['Maky', 'Waz', 'Fin'],
        agentColors: ['#E91E8C', '#2DB67D', '#2563EB'],
        result: '-4h/dia no WhatsApp (placeholder)',
      },
      {
        name: 'Doguh Confeitaria',
        role: 'Doces finos & bolos · São Paulo',
        quote: '"A Maky mudou meu Instagram completamente. Eu não tinha tempo pra criar conteúdo e postava uma vez por semana, quando lembrava. Agora tenho posts profissionais saindo toda semana e meus seguidores estão virando clientes." (placeholder)',
        agents: ['Maky', 'Waz'],
        agentColors: ['#E91E8C', '#2DB67D'],
        result: '+3x posts por semana (placeholder)',
      },
      {
        name: 'Oito Oitenta',
        role: 'Cookies artesanais · São Paulo',
        quote: '"O Fin me salvou. Eu não sabia quanto tava lucrando de verdade porque não controlava nada. Agora tenho fluxo de caixa atualizado, sei exatamente quem pagou e quem não pagou, e os links de Pix vão direto pelo WhatsApp." (placeholder)',
        agents: ['Waz', 'Fin'],
        agentColors: ['#2DB67D', '#2563EB'],
        result: '100% controle financeiro (placeholder)',
      }
    ];

    let scrollYBeforeOpen = 0;

    function openTestimonial(index) {
      const data = testimonialData[index];
      if (!data) return;

      document.getElementById('tcard-o-role').textContent = data.role;
      document.getElementById('tcard-o-name').textContent = data.name.toLowerCase() + '.';
      document.getElementById('tcard-o-text').textContent = data.quote;

      const agentsEl = document.getElementById('tcard-o-agents');
      if (agentsEl) {
        agentsEl.innerHTML = data.agents.map((name, i) =>
          '<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + data.agentColors[i] + ';margin-right:4px;vertical-align:middle;"></span>' + name + '</span>'
        ).join('');
      }

      const resultEl = document.getElementById('tcard-o-result');
      if (resultEl) resultEl.textContent = data.result;

      scrollYBeforeOpen = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + scrollYBeforeOpen + 'px';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      tcardOverlay.classList.add('is-open');
      tcardOverlay.setAttribute('aria-hidden', 'false');
    }

    function closeTestimonial() {
      tcardOverlay.classList.remove('is-open');
      tcardOverlay.setAttribute('aria-hidden', 'true');

      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo({ top: scrollYBeforeOpen, behavior: 'instant' });
    }

    document.querySelectorAll('.tcard').forEach(card => {
      card.addEventListener('click', () => {
        const index = parseInt(card.dataset.index, 10);
        openTestimonial(index);
      });
    });

    if (tcardClose) {
      tcardClose.addEventListener('click', closeTestimonial);
    }

    tcardOverlay.querySelector('.tcard-overlay-backdrop').addEventListener('click', closeTestimonial);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && tcardOverlay.classList.contains('is-open')) {
        closeTestimonial();
      }
    });
  }

  /* ---- Situation Question (Catálogo: já tem arquivo vs criar do zero) ---- */
  function showSituationContent(scope, targetId) {
    // Atualiza seleção das opções
    scope.querySelectorAll('.situation-opt').forEach(o => {
      o.classList.toggle('is-selected', o.dataset.shows === targetId);
    });
    // Troca o conteúdo visível
    scope.querySelectorAll('.situation-content').forEach(c => {
      c.classList.remove('is-visible');
    });
    const target = document.getElementById(targetId);
    if (target) {
      target.classList.add('is-visible');
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  document.querySelectorAll('.situation-opt, .situation-switch').forEach(el => {
    el.addEventListener('click', () => {
      const scope = el.closest('.stage') || document;
      showSituationContent(scope, el.dataset.shows);
    });
  });

  // ============ Flow Explorer (training section spotlight) ============
  const flowExplorer = document.querySelector('.flow-explorer');
  if (flowExplorer) {
    const flowItems = Array.from(flowExplorer.querySelectorAll('.flow-item'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let flowActiveIndex = 0;
    let flowInView = false;

    const setFlowActive = (idx) => {
      flowActiveIndex = idx;
      flowItems.forEach((it, i) => {
        const active = i === idx;
        it.classList.toggle('is-active', active);
        it.classList.remove('is-running');
        it.setAttribute('aria-selected', String(active));
      });
      if (flowInView && !reducedMotion) {
        void flowItems[idx].offsetWidth; // reflow to restart bar animation
        flowItems[idx].classList.add('is-running');
      }
    };

    // Pausa: hover (temporária) OU clique (travada). A barra congela em qualquer um.
    let flowHoverPause = false;
    let flowClickLock = false;
    const syncFlowPause = () => {
      flowExplorer.classList.toggle('is-paused', flowHoverPause || flowClickLock);
    };

    flowItems.forEach((item, idx) => {
      const fill = item.querySelector('.flow-bar-fill');
      if (fill) {
        fill.addEventListener('animationend', (e) => {
          // Só avança quando a barra de preenchimento completa (não no loop do gradiente)
          if (e.animationName !== 'flow-fill') return;
          if (flowExplorer.classList.contains('is-paused')) return;
          if (idx === flowActiveIndex && flowInView && !reducedMotion) {
            setFlowActive((flowActiveIndex + 1) % flowItems.length);
          }
        });
      }
      // Clicar num card seleciona ele e trava a pausa (tempo pra ler).
      // Clicar de novo no card ativo alterna pausa/retomada.
      item.addEventListener('click', () => {
        if (idx !== flowActiveIndex) {
          flowClickLock = true;
          setFlowActive(idx);
        } else {
          flowClickLock = !flowClickLock;
          if (!flowClickLock) setFlowActive(idx); // retoma com barra nova
        }
        syncFlowPause();
      });
      // Passar o mouse num card o destaca (vira o card em foco), além de pausar.
      item.addEventListener('mouseenter', () => {
        if (idx !== flowActiveIndex) setFlowActive(idx);
      });
      item.addEventListener('focus', () => {
        if (idx !== flowActiveIndex) setFlowActive(idx);
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
      });
    });

    // Hover no explorer pausa; sair retoma (a não ser que tenha travado por clique).
    flowExplorer.addEventListener('mouseenter', () => { flowHoverPause = true; syncFlowPause(); });
    flowExplorer.addEventListener('mouseleave', () => { flowHoverPause = false; syncFlowPause(); });

    const flowIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        flowInView = e.isIntersecting;
        if (flowInView) {
          setFlowActive(flowActiveIndex);
        } else {
          flowItems.forEach(i => i.classList.remove('is-running'));
        }
      });
    }, { threshold: 0.2 });
    flowIO.observe(flowExplorer);
  }

  // ============ Spotlight nos CTAs (Etapa 2 e Etapa 3) ============
  // Quando o alvo entra na faixa central da tela, esmaece todo o resto
  // (menos a sidebar) pra focar no botão. Reverte ao sair da faixa.
  [
    { sel: '.training-cta-block', cls: 'spotlight-training' },
    { sel: '.integration-hero',   cls: 'spotlight-integration' },
  ].forEach(({ sel, cls }) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        document.body.classList.toggle(cls, e.isIntersecting);
      });
    }, { rootMargin: '-30% 0px -30% 0px', threshold: 0 });
    io.observe(el);
  });

  // ============ Fluxo de integração (Etapa 3): intro -> checklist -> agendar ============
  const intStage = document.getElementById('integration-stage');
  if (intStage) {
    const introSlide = intStage.querySelector('.slide-intro');
    const checklistSlide = intStage.querySelector('.slide-checklist');
    const startBtn = document.getElementById('integration-start');
    const checks = Array.from(intStage.querySelectorAll('.int-check-box'));
    const schedule = document.getElementById('integration-schedule');
    const hint = document.getElementById('integration-locked-hint');

    const setStageHeight = (el) => { if (el) intStage.style.height = el.offsetHeight + 'px'; };

    // Clicar no gatilho: swipe da intro pro checklist
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        setStageHeight(introSlide);            // congela a altura atual (pra transicionar)
        requestAnimationFrame(() => {
          intStage.classList.add('show');
          setStageHeight(checklistSlide);
        });
      });
    }

    // Libera o botão de agendar só quando todos os itens estão marcados
    const syncChecklist = () => {
      const all = checks.length > 0 && checks.every(c => c.checked);
      if (schedule) schedule.classList.toggle('is-locked', !all);
      if (hint) hint.style.display = all ? 'none' : '';
      if (intStage.classList.contains('show')) setStageHeight(checklistSlide); // botão apareceu/sumiu
    };
    checks.forEach(c => c.addEventListener('change', syncChecklist));
    syncChecklist();

    window.addEventListener('resize', () => {
      setStageHeight(intStage.classList.contains('show') ? checklistSlide : introSlide);
    });
  }

  // ============ Personagens espiando (Waz e Maky) alinhados ao .training-cta-block ============
  // Ficam nas bordas (Waz na sidebar/esquerda, Maky na direita) e rolam junto com a seção.
  const wazPeek = document.querySelector('.waz-peek');
  const makyPeek = document.querySelector('.maky-peek');
  const finPeek = document.querySelector('.fin-peek');
  const peekApp = document.querySelector('.app');
  const peekCta = document.querySelector('.training-cta-block');
  if (peekApp && peekCta && (wazPeek || makyPeek || finPeek)) {
    const placePeeks = () => {
      const a = peekApp.getBoundingClientRect();
      const c = peekCta.getBoundingClientRect();
      if (!c.height) return; // app escondido / sem layout ainda
      const centerInApp = (c.top - a.top) + c.height / 2;
      if (wazPeek) {
        wazPeek.style.top = Math.round(centerInApp - wazPeek.offsetHeight / 2) + 'px';
      }
      if (makyPeek) {
        // Maky um pouco acima da linha do Waz
        makyPeek.style.top = Math.round(centerInApp - makyPeek.offsetHeight / 2 - 70) + 'px';
      }
      if (finPeek) {
        // Fin alinhado com a Maky (mesma borda), porém abaixo dela
        finPeek.style.top = Math.round(centerInApp - finPeek.offsetHeight / 2 + 150) + 'px';
      }
    };
    placePeeks();
    if (wazPeek) wazPeek.addEventListener('load', placePeeks);
    if (makyPeek) makyPeek.addEventListener('load', placePeeks);
    if (finPeek) finPeek.addEventListener('load', placePeeks);
    window.addEventListener('load', placePeeks);
    window.addEventListener('resize', placePeeks);
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(placePeeks);
      ro.observe(peekApp);
      const content = document.querySelector('.content');
      if (content) ro.observe(content);
    }
  }
