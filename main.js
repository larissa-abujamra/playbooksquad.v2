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

  // ============ Setup progress (localStorage) ============
  const STORAGE_KEY = 'squad-playbook-confeitarias-v3';
  const taskInputs = document.querySelectorAll('[data-task]');
  const totalEl = document.getElementById('prog-total');
  const doneEl = document.getElementById('prog-done');
  const pctEl = document.getElementById('prog-pct');
  const fillEl = document.getElementById('prog-fill');
  const fillMobile = document.getElementById('prog-fill-m');
  if (totalEl) totalEl.textContent = taskInputs.length;

  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch(e) { return {}; }
  }
  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch(e) {}
  }

  function updateProgress() {
    const checked = [...taskInputs].filter(t => t.checked).length;
    const pct = taskInputs.length ? Math.round((checked / taskInputs.length) * 100) : 0;
    if (doneEl) doneEl.textContent = checked;
    if (pctEl) pctEl.textContent = pct + '%';
    if (fillEl) fillEl.style.width = pct + '%';
    if (fillMobile) fillMobile.style.width = pct + '%';
  }

  const stateLoaded = loadState();
  taskInputs.forEach(t => {
    if (stateLoaded[t.id]) t.checked = true;
    t.addEventListener('change', () => {
      const s = loadState();
      if (t.checked) s[t.id] = true;
      else delete s[t.id];
      saveState(s);
      updateProgress();
    });
  });
  updateProgress();

  // ============ Progress Tracker (sticky, gamified) ============
  const tracker = document.getElementById('progress-tracker');
  if (tracker) {
    const stages = [
      { id: 1, tasks: ['t-1-1','t-1-2','t-1-3'] },
      { id: 2, tasks: ['t-2-3'] },
      { id: 3, tasks: ['t-3-1','t-3-2','t-3-4'] },
      { id: 4, tasks: ['t-4-1','t-4-2','t-4-3'] },
    ];
    const totalTasks = stages.reduce((s, st) => s + st.tasks.length, 0);
    const wasComplete = new Map();
    let allWasComplete = false;
    let initialized = false;

    const trackerPct = document.getElementById('tracker-pct');
    const trackerDone = document.getElementById('tracker-done');
    const trackerToast = document.getElementById('tracker-toast');
    const trackerBanner = document.getElementById('tracker-banner');

    function calcStage(stage) {
      const done = stage.tasks.reduce((n, id) => {
        const cb = document.getElementById(id);
        return n + (cb && cb.checked ? 1 : 0);
      }, 0);
      return { done, total: stage.tasks.length, complete: done === stage.tasks.length };
    }

    function celebrateStage(node, stageId) {
      node.classList.add('just-completed');
      setTimeout(() => node.classList.remove('just-completed'), 700);
      if (!trackerToast) return;
      const color = getComputedStyle(node).getPropertyValue('--stage-color').trim();
      trackerToast.textContent = `Etapa ${stageId} completa ✓`;
      if (color) trackerToast.style.background = color;
      trackerToast.style.left = '';
      const nodeRect = node.getBoundingClientRect();
      const trackerRect = tracker.getBoundingClientRect();
      const centerX = nodeRect.left + nodeRect.width / 2 - trackerRect.left;
      trackerToast.style.left = centerX + 'px';
      trackerToast.classList.add('show');
      clearTimeout(trackerToast._t);
      trackerToast._t = setTimeout(() => trackerToast.classList.remove('show'), 2500);
    }

    function spawnConfetti() {
      const container = document.createElement('div');
      container.className = 'confetti-container';
      document.body.appendChild(container);
      const colors = ['#E91E8C', '#2DB67D', '#2563EB', '#F59E0B', '#8B5CF6'];
      for (let i = 0; i < 22; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = (Math.random() * 100) + '%';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = (Math.random() * 0.6) + 's';
        piece.style.animationDuration = (2 + Math.random() * 1.2) + 's';
        const size = 6 + Math.random() * 6;
        piece.style.width = size + 'px';
        piece.style.height = size + 'px';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        container.appendChild(piece);
      }
      setTimeout(() => container.remove(), 4500);
    }

    function celebrateAll() {
      if (trackerBanner) {
        trackerBanner.classList.add('show');
        setTimeout(() => {
          trackerBanner.style.transition = 'opacity .4s ease';
          trackerBanner.style.opacity = '0';
          setTimeout(() => {
            trackerBanner.classList.remove('show');
            trackerBanner.style.opacity = '';
            trackerBanner.style.transition = '';
          }, 400);
        }, 6000);
      }
      spawnConfetti();
    }

    function updateTracker() {
      let globalDone = 0;
      let firstIncomplete = null;

      stages.forEach(stage => {
        const node = tracker.querySelector('.tracker-node[data-stage="' + stage.id + '"]');
        const line = tracker.querySelector('.tracker-line[data-stage="' + stage.id + '"]');
        const lineFill = line ? line.querySelector('.tracker-line-fill') : null;
        const countEl = node.querySelector('.node-count');

        const { done, total, complete } = calcStage(stage);
        globalDone += done;
        countEl.textContent = done + '/' + total;

        node.classList.remove('is-active', 'is-done');

        if (complete) {
          node.classList.add('is-done');
          if (lineFill) lineFill.style.width = '100%';
        } else {
          if (lineFill) lineFill.style.width = ((done / total) * 100) + '%';
          if (firstIncomplete === null) firstIncomplete = stage.id;
        }

        if (initialized && complete && !wasComplete.get(stage.id)) {
          celebrateStage(node, stage.id);
        }
        wasComplete.set(stage.id, complete);
      });

      if (firstIncomplete !== null) {
        const activeNode = tracker.querySelector('.tracker-node[data-stage="' + firstIncomplete + '"]');
        if (activeNode) activeNode.classList.add('is-active');
      }

      if (trackerPct) trackerPct.textContent = Math.round((globalDone / totalTasks) * 100) + '%';
      if (trackerDone) trackerDone.textContent = globalDone;

      const allComplete = globalDone === totalTasks;
      if (initialized && allComplete && !allWasComplete) celebrateAll();
      allWasComplete = allComplete;
      initialized = true;
    }

    tracker.querySelectorAll('.tracker-node').forEach(node => {
      const btn = node.querySelector('.node-circle');
      btn.addEventListener('click', () => {
        const stageEls = document.querySelectorAll('#setup .stage');
        const target = stageEls[parseInt(node.dataset.stage, 10) - 1];
        if (!target) return;
        const isMobile = window.matchMedia('(max-width: 900px)').matches;
        const offset = isMobile ? 130 : 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });

    taskInputs.forEach(t => t.addEventListener('change', updateTracker));
    updateTracker();
  }

  // ============ Sidebar sub-nav (per-stage progress + scroll spy) ============
  const subNavEls = document.querySelectorAll('.nav-sub[data-nav-stage]');
  if (subNavEls.length) {
    const navStages = [
      { id: 1, tasks: ['t-1-1','t-1-2','t-1-3'] },
      { id: 2, tasks: ['t-2-3'] },
      { id: 3, tasks: ['t-3-1','t-3-2','t-3-4'] },
      { id: 4, tasks: ['t-4-1','t-4-2','t-4-3'] },
    ];
    const navTotalTasks = navStages.reduce((s, st) => s + st.tasks.length, 0);
    const navTotalEl = document.getElementById('nav-setup-total');

    function countDone(stage) {
      return stage.tasks.reduce((n, id) => {
        const cb = document.getElementById(id);
        return n + (cb && cb.checked ? 1 : 0);
      }, 0);
    }

    function updateSidebarNav() {
      let globalDone = 0;
      let firstIncomplete = null;

      navStages.forEach(stage => {
        const sub = document.querySelector('.nav-sub[data-nav-stage="' + stage.id + '"]');
        if (!sub) return;
        const statusDot = sub.querySelector('.nav-sub-status');
        const countEl = sub.querySelector('.nav-sub-count');

        const done = countDone(stage);
        const total = stage.tasks.length;
        globalDone += done;
        countEl.textContent = done + '/' + total;

        const isComplete = done === total;
        const hasProgress = done > 0 && !isComplete;

        sub.classList.remove('is-complete', 'has-progress', 'is-future');

        if (isComplete) {
          statusDot.dataset.status = 'done';
          sub.classList.add('is-complete');
        } else if (hasProgress) {
          statusDot.dataset.status = 'active';
          sub.classList.add('has-progress');
          if (firstIncomplete === null) firstIncomplete = stage.id;
        } else {
          statusDot.dataset.status = 'empty';
          if (firstIncomplete === null) firstIncomplete = stage.id;
        }
      });

      navStages.forEach(stage => {
        const sub = document.querySelector('.nav-sub[data-nav-stage="' + stage.id + '"]');
        if (!sub) return;
        const done = countDone(stage);
        if (done === 0 && firstIncomplete !== null && stage.id > firstIncomplete) {
          sub.classList.add('is-future');
        }
      });

      if (navTotalEl) navTotalEl.textContent = globalDone + '/' + navTotalTasks;

      const navGroup = document.getElementById('nav-setup-group');
      if (navGroup) navGroup.classList.toggle('all-complete', globalDone === navTotalTasks);
    }

    taskInputs.forEach(t => t.addEventListener('change', updateSidebarNav));
    updateSidebarNav();

    // Scroll-spy: marca a etapa visível com is-viewing
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
    // Seção 1 — Sobre sua empresa
    {
      block: 'Sobre sua empresa',
      key: 'business_description',
      q: 'O que sua empresa faz e para quem?',
      hint: 'Em 2-3 linhas: o que você oferece e quem é seu público.',
      type: 'textarea',
      placeholder: 'Ex: Confeitaria artesanal pra quem busca bolos sem corante, com atendimento próximo e personalizado.',
    },
    {
      block: 'Sobre sua empresa',
      key: 'business_rules',
      q: 'Quais são as regras do seu negócio que o assistente precisa saber?',
      hint: 'Pense em: prazo de entrega, formas de pagamento, política de troca…',
      type: 'textarea',
      placeholder: 'Ex: Encomendas com 48h de antecedência. Aceitamos Pix e cartão. Não fazemos troca, mas refazemos se houver problema.',
    },

    // Seção 2 — Tom de voz
    {
      block: 'Tom de voz',
      key: 'attendance_style',
      q: 'Como você quer que seu assistente atenda?',
      hint: 'Escolha o que mais combina com a marca.',
      type: 'single-choice',
      options: [
        { value: 'consultivo',  label: 'Consultivo',  desc: 'Ouve, entende e orienta antes de oferecer.' },
        { value: 'comercial',   label: 'Comercial',   desc: 'Focado em converter, direto e persuasivo.' },
        { value: 'acolhedor',   label: 'Acolhedor',   desc: 'Próximo, humano, cria vínculo antes de vender.' },
        { value: 'informativo', label: 'Informativo', desc: 'Objetivo, responde o que foi perguntado sem rodeios.' },
      ],
    },
    {
      block: 'Tom de voz',
      key: 'emoji_usage',
      q: 'Uso de emoji',
      hint: 'Como o assistente deve se comportar com emojis?',
      type: 'choice-with-followup',
      options: [
        { value: 'sempre',   label: 'Sempre',         desc: 'Faz parte da identidade.', followup: true },
        { value: 'moderado', label: 'Com moderação', desc: 'Só quando fizer sentido.', followup: true },
        { value: 'nunca',    label: 'Nunca',          desc: 'Sem emojis na comunicação.' },
      ],
      followupKey: 'emoji_examples',
      followupHint: 'Quais emojis combinam com a marca?',
      followupPlaceholder: 'Ex: 🎂 💕 ✨',
    },
    {
      block: 'Tom de voz',
      key: 'forbidden_words',
      q: 'Tem alguma palavra, expressão ou abordagem que seu assistente não deve usar?',
      hint: 'Pode dar exemplos.',
      type: 'textarea',
      placeholder: 'Ex: Nunca dizer "fofa". Evitar "barato" — prefiro "acessível".',
    },

    // Seção 3 — Situações pessoais
    {
      block: 'Situações pessoais',
      intro: 'Seu assistente vai atender a maioria das conversas. Mas algumas situações são importantes demais pra ficar no automático.',
      key: 'escalation_situations',
      q: 'Selecione abaixo o que você quer assumir.',
      hint: 'Marque todas que se aplicam.',
      type: 'multi-choice',
      options: [
        { value: 'negociacao',  label: 'Negociação de preço ou condições especiais' },
        { value: 'eventos',     label: 'Eventos corporativos ou pedidos em grande volume' },
        { value: 'reclamacoes', label: 'Clientes insatisfeitos ou reclamações' },
        { value: 'contratos',   label: 'Contratos ou parcerias' },
        { value: 'vip',         label: 'Clientes VIP ou recorrentes' },
      ],
      otherKey: 'escalation_other',
      otherLabel: 'Outros',
      otherPlaceholder: 'Descreva quais outras situações.',
    },
  ];

  const WIZARD_STORAGE_KEY = 'squad-wizard-answers-v2';
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

  function renderQuestion(index, direction) {
    direction = direction || 'forward';
    const leavingClass = direction === 'back' ? 'is-leaving-back' : 'is-leaving-forward';
    const enteringClass = direction === 'back' ? 'is-entering-back' : 'is-entering-forward';

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
        '<h1 class="wizard-q" id="wizard-question-text">' + escapeHtml(q.q) + '</h1>' +
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

    // (Auto-check de t-2-3 acontece no downloadPDF — quando o usuário baixa o PDF)

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
    doc.text('Treinamento de agentes', margin, y);
    y += 26;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    doc.text('Squad · perfil do negócio pra alimentar Waz, Maky e Fin', margin, y);
    y += 24;
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 24;

    const blocks = [];
    const blockMap = {};
    wizardQuestions.forEach(q => {
      if (!blockMap[q.block]) {
        blockMap[q.block] = { name: q.block, rows: [] };
        blocks.push(blockMap[q.block]);
      }
      blockMap[q.block].rows.push(q);
    });

    blocks.forEach((block, bIdx) => {
      if (y > pageHeight - 120) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(17, 24, 39);
      doc.text(String(bIdx + 1).padStart(2, '0') + '  ·  ' + block.name.toUpperCase(), margin, y);
      y += 18;
      doc.setDrawColor(17, 24, 39);
      doc.setLineWidth(1.4);
      doc.line(margin, y - 4, margin + 32, y - 4);
      doc.setLineWidth(0.5);
      y += 14;

      // Intro do bloco (se houver), aparece uma vez
      const firstWithIntro = block.rows.find(r => r.intro);
      if (firstWithIntro && firstWithIntro.intro) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10.5);
        doc.setTextColor(107, 114, 128);
        const introLines = doc.splitTextToSize(firstWithIntro.intro, maxWidth);
        introLines.forEach(line => {
          if (y > pageHeight - margin) { doc.addPage(); y = margin; }
          doc.text(line, margin, y); y += 13;
        });
        y += 8;
      }

      block.rows.forEach(q => {
        const formatted = formatAnswer(q);
        const isEmpty = !formatted;
        const answer = formatted || '(não respondida)';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(107, 114, 128);
        const qLines = doc.splitTextToSize(q.q, maxWidth);
        if (y + qLines.length * 13 > pageHeight - margin) { doc.addPage(); y = margin; }
        qLines.forEach(line => { doc.text(line, margin, y); y += 13; });
        y += 4;

        doc.setFont('helvetica', isEmpty ? 'italic' : 'normal');
        doc.setFontSize(11);
        doc.setTextColor(isEmpty ? 156 : 17, isEmpty ? 163 : 24, isEmpty ? 175 : 39);
        const aLines = doc.splitTextToSize(answer, maxWidth);
        aLines.forEach(line => {
          if (y > pageHeight - margin) { doc.addPage(); y = margin; }
          doc.text(line, margin, y);
          y += 15;
        });
        y += 14;
      });
      y += 8;
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

    doc.save('treinamento-agentes-squad.pdf');

    const t23 = document.getElementById('t-2-3');
    if (t23 && !t23.checked) {
      t23.checked = true;
      t23.dispatchEvent(new Event('change'));
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
        name: 'Cookies da Nola',
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
