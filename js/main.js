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
// Plays once per browser session; later visits get the cover instead.
// Its pieces start hidden in the CSS, so the logo never shows before it wipes in.
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
  coverOpen();
  lenis.stop();
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .to('.intro .stripe', { scaleX: 1, duration: 1.2, ease: 'expo.inOut' })
    .to('.intro__logo', { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' }, 0.1)
    .to('.intro .label', { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
    .to(el, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '+=0.4')
    // The logo lifts a little faster than the overlay, for depth
    .to('.intro__logo, .intro .label', { y: -80, duration: 1.1, ease: 'expo.inOut' }, '<')
    .add(() => {
      el.remove();
      lenis.start();
    })
    .add(revealTitle(), '-=0.6');
  return true;
}

// Page-change cover: orange "V.A.R" comes down from the top and green "Mart" up from the bottom,
// they meet while the next page loads, then carry on through and off the screen.
const coverOpen = () => {
  gsap.set('.cover__half--orange', { yPercent: 100 });
  gsap.set('.cover__half--green', { yPercent: -100 });
};

// Every other page load: the cover parts, then the title rises in
function pageIn() {
  const d = reduce ? 0 : 0.75;
  const tl = gsap.timeline({ defaults: { duration: d, ease: 'expo.inOut' } });
  tl.to('.cover__half--orange', { yPercent: 100 })
    .to('.cover__half--green', { yPercent: -100 }, d * 0.08);
  if (!reduce) tl.add(revealTitle(), '-=0.45');
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

// Clicking a link to another page closes the cover before navigating
function pageLinks() {
  const pageLink = 'a[href$=".html"], a[href*=".html#"]';
  document.addEventListener('click', (e) => {
    const a = e.target.closest(pageLink);
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
    const url = new URL(a.href);
    // Same-page anchors scroll instead
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    const d = reduce ? 0 : 0.55;
    gsap.timeline({ defaults: { duration: d, ease: 'expo.inOut' }, onComplete: () => { location.href = a.href; } })
      .fromTo('.cover__half--orange', { yPercent: -100 }, { yPercent: 0 })
      .fromTo('.cover__half--green', { yPercent: 100 }, { yPercent: 0 }, d * 0.08);
  });
  // Fetch a page as soon as the pointer or a finger is on its link, so it's ready when the cover closes
  const fetched = new Set([location.pathname]);
  const prefetch = (e) => {
    const a = e.target.closest?.(pageLink);
    if (!a) return;
    const { pathname } = new URL(a.href);
    if (fetched.has(pathname)) return;
    fetched.add(pathname);
    document.head.append(Object.assign(document.createElement('link'), { rel: 'prefetch', href: pathname }));
  };
  document.addEventListener('pointerover', prefetch);
  document.addEventListener('touchstart', prefetch, { passive: true });
  document.addEventListener('focusin', prefetch);
  // Coming back with the browser's back button restores the page with the cover closed
  addEventListener('pageshow', (e) => {
    if (e.persisted) coverOpen();
  });
}

// Hero background: rice grains falling at three depths, a nod to the rice counter.
// Mostly white rice with some golden paddy and red matta. They sway as they fall, a gust sweeps
// through every few seconds, and on desktop they part around the pointer and shift with it for depth.
function grains() {
  const canvas = $('.grains');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hero = canvas.closest('.hero');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  let w = 0;
  let h = 0;
  let dpr = 1;
  let running = false;
  let last = 0;
  let list = [];
  // Pointer in canvas pixels, and an eased -1..1 offset for the depth parallax
  const pointer = { x: -1e4, y: -1e4, tx: 0, ty: 0, px: 0, py: 0 };

  // One sprite per colour, drawn once: an ellipse with a soft top highlight so grains read as round
  const sprite = (rgb, blur = 0) => {
    const s = document.createElement('canvas');
    s.width = 40;
    s.height = 16;
    const g = s.getContext('2d');
    if (blur) g.filter = `blur(${blur}px)`;
    g.fillStyle = `rgb(${rgb})`;
    g.beginPath();
    g.ellipse(20, 8, 19, 7, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255, 255, 255, 0.55)';
    g.beginPath();
    g.ellipse(18, 5.5, 12, 2.4, 0, 0, Math.PI * 2);
    g.fill();
    return s;
  };
  const white = sprite('246, 239, 222');
  const paddy = sprite('236, 182, 70');
  const matta = sprite('190, 96, 60');
  // Out-of-focus grains passing close to the lens; the blur is baked into the sprite once
  const soft = sprite('246, 239, 222', 2.5);
  const pick = () => {
    const r = Math.random();
    return r < 0.64 ? white : r < 0.84 ? paddy : matta;
  };

  const make = (anyHeight) => {
    // Far grains outnumber near ones; about 1 in 20 is a big soft grain right in front
    const close = Math.random() < 0.05;
    const depth = close ? 1.3 + Math.random() * 0.4 : Math.random() ** 1.3;
    return {
      x: Math.random() * w,
      y: anyHeight ? Math.random() * h : -20 - Math.random() * 60,
      depth,
      len: 7 + depth * 14,
      wid: 2.6 + depth * 4,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.04,
      vy: 0.25 + depth * 1.15,
      phase: Math.random() * Math.PI * 2,
      sway: 0.12 + Math.random() * 0.3,
      kx: 0, // push from the pointer, fading out
      ky: 0,
      alpha: close ? 0.45 : 0.3 + depth * 0.65,
      img: close ? soft : pick(),
    };
  };

  const resize = () => {
    const nw = canvas.clientWidth;
    const nh = canvas.clientHeight;
    // Touch screens draw at 1.5x: falling grains don't need retina sharpness, and it keeps phones smooth
    dpr = Math.min(devicePixelRatio || 1, finePointer ? 2 : 1.5);
    canvas.width = nw * dpr;
    canvas.height = nh * dpr;
    // Phones resize on every address-bar show/hide; only reseed when the width really changes
    if (nw !== w || !list.length) {
      w = nw;
      h = nh;
      const count = Math.min(Math.round((w * h) / (finePointer ? 4200 : 5000)), 380);
      list = Array.from({ length: count }, () => make(true));
    }
    h = nh;
    draw();
  };

  const draw = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const g of list) {
      const x = g.x + pointer.px * g.depth * 24;
      const y = g.y + pointer.py * g.depth * 14;
      const c = Math.cos(g.angle) * dpr;
      const s = Math.sin(g.angle) * dpr;
      ctx.setTransform(c, s, -s, c, x * dpr, y * dpr);
      ctx.globalAlpha = g.alpha;
      ctx.drawImage(g.img, -g.len / 2, -g.wid / 2, g.len, g.wid);
    }
    ctx.globalAlpha = 1;
  };

  // A gust every 8 s: wind rises and falls over 3 s
  const gust = (sec) => {
    const p = (sec % 8) / 3;
    return p < 1 ? Math.sin(p * Math.PI) ** 2 : 0;
  };

  const tick = (now) => {
    if (!running) return;
    const dt = Math.min((now - last) / 16.67 || 1, 3);
    last = now;
    const sec = now / 1000;
    const wind = gust(sec) * 2.2;
    const fade = 0.92 ** dt;
    pointer.px += (pointer.tx - pointer.px) * 0.05 * dt;
    pointer.py += (pointer.ty - pointer.py) * 0.05 * dt;
    for (const g of list) {
      // Grains within 130px of the pointer get pushed outwards, near ones harder
      const dx = g.x + pointer.px * g.depth * 24 - pointer.x;
      const dy = g.y + pointer.py * g.depth * 14 - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 16900 && d2 > 1) {
        const d = Math.sqrt(d2);
        const f = (1 - d / 130) ** 2 * (0.4 + g.depth) * 0.9;
        g.kx += (dx / d) * f * dt;
        g.ky += (dy / d) * f * dt;
        g.spin += (dx > 0 ? 1 : -1) * f * 0.004;
      }
      g.kx *= fade;
      g.ky *= fade;
      g.x += (Math.sin(sec * 1.3 + g.phase) * g.sway + wind * (0.4 + g.depth) + g.kx) * dt;
      g.y += (g.vy + g.ky) * dt;
      g.angle += g.spin * dt;
      g.spin *= 0.995;
      if (g.y > h + 30) Object.assign(g, make(false));
      if (g.x > w + 30) g.x -= w + 60;
      if (g.x < -30) g.x += w + 60;
    }
    draw();
    requestAnimationFrame(tick);
  };

  resize();
  addEventListener('resize', resize);
  if (reduce) return;

  if (finePointer && hero) {
    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.tx = (e.clientX / innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / innerHeight) * 2 - 1;
    });
    hero.addEventListener('pointerleave', () => {
      pointer.x = pointer.y = -1e4;
      pointer.tx = pointer.ty = 0;
    });
  }

  // Only animate while the hero is on screen
  new IntersectionObserver(([entry]) => {
    const wasRunning = running;
    running = entry.isIntersecting;
    if (running && !wasRunning) {
      last = performance.now();
      requestAnimationFrame(tick);
    }
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
