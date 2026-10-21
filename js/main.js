// V.A.R Mart site. Motion ported from the esrbespoke replica (Desktop/esr/site/main.js).
gsap.registerPlugin(ScrollTrigger, SplitText);

const WHATSAPP = '919496534297';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s) => document.querySelector(s);
const $$ = (s) => gsap.utils.toArray(s);

// Smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in sync
const lenis = reduce ? null : new Lenis({ lerp: 0.1, anchors: true });
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

document.querySelectorAll('.year').forEach((el) => { el.textContent = new Date().getFullYear(); });
grains();
orderForm();

document.fonts.ready.then(() => {
  if (!intro()) pageIn();
  heroParallax();
  mediaParallax();
  revealLines();
  slider();
  departments();
  accordions();
  footerType();
  footerMap();
  menu();
  fixedControls();
  pageLinks();
});

// Home intro: the logo wipes in left to right, the tagline fades up, then the overlay slides away.
// Plays once per browser session; later visits get the green cover wipe instead.
function intro() {
  const el = $('.intro');
  if (!el) return false;
  let seen = false;
  try {
    seen = sessionStorage.getItem('intro-seen') === '1';
    sessionStorage.setItem('intro-seen', '1');
  } catch {}
  if (reduce || seen) {
    el.remove();
    return false;
  }
  gsap.set('.cover', { yPercent: -100 });
  lenis.stop();
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.intro .stripe', { scaleX: 0, transformOrigin: 'left center', duration: 1.2, ease: 'expo.inOut' })
    .from('.intro__logo', { clipPath: 'inset(0% 100% 0% 0%)', duration: 1.4, ease: 'expo.inOut' }, 0.1)
    .from('.intro .label', { opacity: 0, y: 12, duration: 0.8 }, '-=0.5')
    .to(el, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '+=0.5')
    .add(() => {
      el.remove();
      lenis.start();
    })
    .add(revealTitle(), '-=0.6');
  return true;
}

// Every other page load: the black cover wipes up, then the title rises in
function pageIn() {
  const tl = gsap.timeline();
  tl.to('.cover', { yPercent: -100, duration: reduce ? 0 : 1, ease: 'expo.inOut' });
  if (!reduce) tl.add(revealTitle(), '-=0.5');
}

function revealTitle() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  const title = $('.hero__title, .page-hero__title');
  if (title) {
    const split = SplitText.create(title, { type: 'lines', mask: 'lines' });
    tl.from(split.lines, { yPercent: 100, duration: 1.2, stagger: 0.1 });
  }
  const rest = $$('.hero__blurb, .hero__cta, .hero__foot > *, .page-hero > .pair, .page-hero > .label, .page-hero__arrow');
  if (rest.length) tl.from(rest, { opacity: 0, duration: 0.8, stagger: 0.05 }, title ? '-=0.9' : 0);
  return tl;
}

// Clicking a link to another page drops the cover back down before navigating
function pageLinks() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href$=".html"], a[href*=".html#"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
    const url = new URL(a.href);
    // Same-page anchors scroll instead
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    gsap.fromTo('.cover', { yPercent: 100 }, {
      yPercent: 0,
      duration: reduce ? 0 : 0.8,
      ease: 'expo.inOut',
      onComplete: () => { location.href = a.href; },
    });
  });
  // Coming back with the browser's back button restores the page with the cover down
  addEventListener('pageshow', (e) => {
    if (e.persisted) gsap.set('.cover', { yPercent: -100 });
  });
}

// Hero background: rice grains drifting down, a nod to the rice counter
function grains() {
  const canvas = $('.grains');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let running = false;
  let list = [];

  const make = (anyHeight) => {
    const depth = Math.random();
    return {
      x: Math.random() * w,
      y: anyHeight ? Math.random() * h : -20,
      len: 7 + depth * 7,
      wid: 2.6 + depth * 2,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.02,
      vy: 0.25 + depth * 0.9,
      vx: (Math.random() - 0.5) * 0.15,
      alpha: 0.15 + depth * 0.6,
    };
  };

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round((w * h) / 9000);
    list = Array.from({ length: count }, () => make(true));
    draw();
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    for (const g of list) {
      ctx.fillStyle = `rgba(246, 239, 222, ${g.alpha})`;
      ctx.beginPath();
      ctx.ellipse(g.x, g.y, g.len / 2, g.wid / 2, g.angle, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const tick = () => {
    if (!running) return;
    for (const g of list) {
      g.y += g.vy;
      g.x += g.vx;
      g.angle += g.spin;
      if (g.y > h + 20) Object.assign(g, make(false));
    }
    draw();
    requestAnimationFrame(tick);
  };

  resize();
  addEventListener('resize', resize);
  if (reduce) return;
  // Only animate while the hero is on screen
  new IntersectionObserver(([entry]) => {
    const wasRunning = running;
    running = entry.isIntersecting;
    if (running && !wasRunning) requestAnimationFrame(tick);
  }).observe(canvas);
}

function heroParallax() {
  if (reduce || !$('.hero')) return;
  const st = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('.hero__media', { yPercent: 12, ease: 'none', scrollTrigger: st });
  gsap.to('.hero__content', { yPercent: -30, ease: 'none', scrollTrigger: { ...st } });
}

// Full-bleed photo slots drift slightly slower than the page
function mediaParallax() {
  if (reduce) return;
  $$('.media').forEach((m) => {
    gsap.fromTo(m.querySelector('.media__img'), { yPercent: -8 }, {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

// Large paragraphs: lines slide up out of a mask as they scroll into view
function revealLines() {
  if (reduce) return;
  $$('.reveal-lines').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 100,
        duration: 1.2,
        stagger: 0.06,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      }),
    });
  });
}

// Full-bleed slider with a "next" preview square that follows the cursor
function slider() {
  const root = $('.slider');
  if (!root) return;
  const slides = [...root.querySelectorAll('.slide')];
  const cursor = $('.cursor');
  const thumb = cursor.querySelector('.cursor__thumb');
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.5, ease: 'expo.out' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.5, ease: 'expo.out' });
  let current = 0;
  let busy = false;

  const setThumb = () => {
    const next = slides[(current + 1) % slides.length];
    thumb.style.setProperty('--bg', getComputedStyle(next).getPropertyValue('--bg'));
  };

  root.addEventListener('pointerenter', (e) => {
    gsap.set(cursor, { x: e.clientX, y: e.clientY });
    gsap.to(cursor, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'expo.out' });
  });
  root.addEventListener('pointermove', (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
  });
  const hide = () => gsap.to(cursor, { autoAlpha: 0, scale: 0.8, duration: 0.3 });
  root.addEventListener('pointerleave', hide);
  // Scrolling moves the slider out from under a still pointer without firing
  // pointerleave, so check the last pointer position against the slider on scroll
  let px = -1;
  let py = -1;
  addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; }, { passive: true });
  addEventListener('scroll', () => {
    const r = root.getBoundingClientRect();
    if (px < r.left || px > r.right || py < r.top || py > r.bottom) hide();
  }, { passive: true });
  root.addEventListener('click', next);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      next();
    }
  });

  function next() {
    if (busy) return;
    busy = true;
    const prev = slides[current];
    current = (current + 1) % slides.length;
    const incoming = slides[current];
    incoming.classList.add('is-next');
    gsap.fromTo(incoming,
      { clipPath: 'inset(0% 0% 0% 100%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: reduce ? 0 : 1.1,
        ease: 'expo.inOut',
        onComplete() {
          prev.classList.remove('is-active');
          incoming.classList.replace('is-next', 'is-active');
          gsap.set(incoming, { clearProps: 'clipPath' });
          setThumb();
          busy = false;
        },
      });
  }

  gsap.set(cursor, { scale: 0.8 });
  setThumb();
}

// Departments: the name at screen centre turns green and the card swaps to match
function departments() {
  const items = $$('.depts__list li');
  if (!items.length) return;
  const frames = $$('.depts__frame');
  const setActive = (n) => {
    items.forEach((li, k) => li.classList.toggle('is-active', k === n));
    frames.forEach((f, k) => f.classList.toggle('is-active', k === n));
  };
  items.forEach((li, n) => {
    ScrollTrigger.create({
      trigger: li,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => self.isActive && setActive(n),
    });
  });
  setActive(0);
}

function accordions() {
  $$('.accordion__item').forEach((item) => {
    const btn = item.querySelector('button');
    const panel = item.querySelector('.accordion__panel');
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open);
      gsap.to(panel, {
        height: open ? 'auto' : 0,
        duration: reduce ? 0 : 0.6,
        ease: 'expo.out',
        onComplete: () => ScrollTrigger.refresh(),
      });
    });
  });
}

// Footer text types in letter by letter once most of the footer is uncovered.
// The footer is sticky, so the trigger is the end of <main> sliding away.
function footerType() {
  if (reduce) return;
  const split = SplitText.create('.footer .type', { type: 'words,chars' });
  gsap.from(split.chars, {
    opacity: 0,
    duration: 0.01,
    stagger: 0.012,
    scrollTrigger: { trigger: 'main', start: 'bottom 40%' },
  });
}

// Footer map: the Google embed is about 500 KB of script. The footer sits sticky behind <main>,
// so native lazy loading counts it as on screen at once; load it a screen before it's uncovered.
function footerMap() {
  const frame = $('.f-map iframe[data-src]');
  if (!frame) return;
  ScrollTrigger.create({
    trigger: 'main',
    start: 'bottom 200%',
    once: true,
    onEnter: () => { frame.src = frame.dataset.src; },
  });
}

function menu() {
  const btn = $('.burger');
  const panel = $('.menu');
  const links = panel.querySelectorAll('.menu__links a');
  let open = false;

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })
    .fromTo(panel,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' })
    .from(links, { yPercent: 100, duration: 1, stagger: 0.06 }, '-=0.4')
    .from('.menu__foot > *', { opacity: 0, duration: 0.6, stagger: 0.05 }, '<');

  const toggle = (state = !open) => {
    open = state;
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    panel.setAttribute('aria-hidden', !open);
    panel.inert = !open;
    document.body.classList.toggle('menu-open', open);
    if (open) {
      tl.timeScale(1).play();
      lenis?.stop();
    } else {
      tl.timeScale(1.6).reverse();
      lenis?.start();
    }
  };

  btn.addEventListener('click', () => toggle());
  links.forEach((a) => a.addEventListener('click', () => toggle(false)));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) toggle(false);
  });
}

// The header gains a hairline and soft shadow once the page scrolls
function fixedControls() {
  const header = $('.site-header');
  const update = () => header.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', update, { passive: true });
  update();
}

// Contact form: no server yet, so it hands the message to WhatsApp
function orderForm() {
  const form = $('.js-whatsapp-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const lines = [
      `Hi V.A.R Mart, this is ${data.get('name')}.`,
      data.get('message'),
      data.get('address') ? `Delivery address: ${data.get('address')}` : '',
    ].filter(Boolean);
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join('\n\n'))}`, '_blank', 'noopener');
  });
}
