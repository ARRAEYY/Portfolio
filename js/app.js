/* ═══════════════════════════════════════════════════════════════
   ADIL REYAZ_ — interaction layer
   parallax world · dino gaze · tabs · filters · reveals · nav
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const lerp = (a, b, t) => a + (b - a) * t;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const body = document.body;

  /* reveal the world */
  requestAnimationFrame(() => requestAnimationFrame(() => body.classList.remove('is-booting')));

  /* ── scroll reveals ──────────────────────────────────────────── */
  const revealIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal]').forEach((el, i) => {
    el.style.setProperty('--rd', `${Math.min(i % 4, 3) * 70}ms`);
    revealIO.observe(el);
  });

  /* ── world parallax + dino gaze ──────────────────────────────── */
  const layers = $$('[data-depth]');
  const moonWrap = $('.moon-wrap');
  const heroDino = $('.hero__dino');
  const heroDinoSvg = $('.hero__dino-svg');
  // the square eye lives in the shared <defs> — every dinosaur looks where you look
  const dinoEye = document.querySelector('#px-dino .dino-eye');
  const dinoPupil = document.querySelector('#px-dino .dino-pupil');

  let mx = 0, my = 0, smx = 0, smy = 0, sy = 0, ssy = 0;

  if (finePointer && !reduced) {
    addEventListener('pointermove', (e) => {
      mx = (e.clientX / innerWidth) * 2 - 1;
      my = (e.clientY / innerHeight) * 2 - 1;
      mouseX = e.clientX;
    }, { passive: true });
  }

  const frame = () => {
    sy = scrollY;
    ssy = lerp(ssy, sy, 0.09);
    smx = lerp(smx, mx, 0.06);
    smy = lerp(smy, my, 0.06);

    if (!reduced) {
      for (const el of layers) {
        const d = parseFloat(el.dataset.depth) || 1;
        const dx = parseFloat(el.dataset.depthX) || d;
        const x = smx * dx * 7;
        const y = smy * d * 4 + Math.min(ssy, 2600) * 0.012 * d;
        el.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
      }

      // the moon belongs to the first and last scenes — it dims mid-journey
      const max = document.documentElement.scrollHeight - innerHeight;
      const near = max > 0 ? scrollY / max : 0;
      const dip = Math.min(1, Math.max(0, (near - 0.16) / 0.14)) * Math.min(1, Math.max(0, (0.72 - near) / 0.14));
      if (moonWrap) moonWrap.style.opacity = (1 - dip * 0.82).toFixed(3);

      if (finePointer) {
        // dinosaur faces the cursor
        if (heroDinoSvg && heroDinoSvg.isConnected) {
          const r = heroDinoSvg.getBoundingClientRect();
          if (r.bottom > -80 && r.top < innerHeight + 80) {
            heroDino.style.transform = r.left + r.width / 2 > innerWidth / 2 ? '' : 'scaleX(-1)';
          }
        }
        // shared gaze — the square eye drifts toward the cursor
        if (dinoEye) {
          const gx = Math.max(-0.9, Math.min(0.9, (mouseX / innerWidth - 0.5) * 3.4));
          const gy = Math.max(-0.6, Math.min(0.6, smy * 0.7));
          dinoEye.setAttribute('transform', `translate(${gx.toFixed(2)} ${gy.toFixed(2)})`);
          if (dinoPupil) dinoPupil.setAttribute('transform', `translate(${gx.toFixed(2)} ${gy.toFixed(2)})`);
        }
      }
    }
    requestAnimationFrame(frame);
  };
  let mouseX = innerWidth / 2;
  requestAnimationFrame(frame);

  /* ── nav ─────────────────────────────────────────────────────── */
  const nav = $('#siteNav');
  const onScrollNav = () => nav.classList.toggle('is-scrolled', scrollY > 16);
  addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  const links = $$('[data-navlink]');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === `#${e.target.id}`));
    });
  }, { rootMargin: '-38% 0px -55% 0px' });
  ['home', 'about', 'projects', 'journey', 'contact'].forEach((id) => {
    const sec = document.getElementById(id);
    if (sec) spy.observe(sec);
  });

  const burger = $('#navBurger');
  const menu = $('#mobileMenu');
  const setMenu = (open) => {
    burger.classList.toggle('is-open', open);
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ── ambient light toggle ────────────────────────────────────── */
  const themeBtn = $('#themeToggle');
  themeBtn.addEventListener('click', () => {
    const lit = body.classList.toggle('lit');
    themeBtn.setAttribute('aria-pressed', String(lit));
  });

  /* ── project filters ─────────────────────────────────────────── */
  const filterBtns = $$('.filter');
  const cards = $$('.project');
  const empty = $('#projectsEmpty');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });
      const f = btn.dataset.filter;
      let shown = 0;
      cards.forEach((c) => {
        const show = f === 'all' || (c.dataset.cat || '').split(' ').includes(f);
        c.classList.toggle('is-hidden', !show);
        if (show) shown++;
      });
      empty.hidden = shown > 0;
    });
  });

  /* ── skills tabs ─────────────────────────────────────────────── */
  const tabs = $$('.tab');
  const panes = { skills: $('#panel-skills'), interests: $('#panel-interests'), timeline: $('#panel-timeline') };
  const timelinePanel = $('.timeline');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
      });
      Object.entries(panes).forEach(([key, pane]) => {
        if (!pane) return;
        const on = key === tab.dataset.tab;
        pane.hidden = !on;
        pane.classList.toggle('is-active', on);
      });
      // on wide screens the timeline aside is always visible — just pulse it
      if (tab.dataset.tab === 'timeline' && innerWidth > 1150 && timelinePanel) {
        timelinePanel.style.borderColor = 'rgba(177, 0, 53, 0.6)';
        setTimeout(() => { timelinePanel.style.borderColor = ''; }, 900);
      }
    });
  });

  /* ── try-hint (easter egg) ───────────────────────────────────── */
  const hint = $('#tryHint');
  if (hint && !reduced) {
    setTimeout(() => hint.classList.add('show'), 2200);
    const dismiss = () => hint.classList.add('hide');
    addEventListener('scroll', dismiss, { once: true, passive: true });
    addEventListener('pointerdown', dismiss, { once: true });
  }

  /* ── misc ────────────────────────────────────────────────────── */
  $('#year').textContent = new Date().getFullYear();
})();
