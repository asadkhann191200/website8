(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Navbar: translucent on scroll */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 20);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  /* Mobile menu */
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = open => {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));

  /* Reveal on scroll */
  const items = $$('.rv:not(.hero .rv)');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    items.forEach(i => io.observe(i));
  } else items.forEach(i => i.classList.add('in'));

  /* Subtle parallax */
  const imgs = $$('[data-parallax]');
  if (!reduce && imgs.length) {
    let tick = false;
    const run = () => {
      imgs.forEach(img => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        img.style.transform = `translateY(${(-p * 22 - 6).toFixed(1)}px)`;
      });
      tick = false;
    };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(run); } }, { passive: true });
    run();
  }

  /* Form validation (no backend: opens a pre-filled email instead) */
  const form = $('#form'), status = $('#status');
  const date = $('#date');
  date.min = new Date().toISOString().split('T')[0];

  const rules = {
    name: v => v.trim().length >= 2 || 'Enter your full name.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Enter a valid email address.',
    phone: v => /^\+?[\d\s-]{10,15}$/.test(v.trim()) || 'Enter a valid phone number (10–15 digits).',
    date: v => (v && v >= date.min) || 'Choose a date from today onwards.',
    time: v => (v && v >= '10:00' && v <= '18:00') || 'Choose a time between 10:00 AM and 6:00 PM.',
    reason: v => !!v || 'Select a reason for consultation.'
  };
  const check = el => {
    const rule = rules[el.name]; if (!rule) return true;
    const res = rule(el.value), box = el.closest('.f');
    box.classList.toggle('bad', res !== true);
    $('.err', box).textContent = res === true ? '' : res;
    el.setAttribute('aria-invalid', res !== true);
    return res === true;
  };
  $$('input,select', form).forEach(el => {
    el.addEventListener('blur', () => check(el));
    el.addEventListener('input', () => el.closest('.f').classList.contains('bad') && check(el));
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fields = $$('input,select', form);
    const ok = fields.map(check).every(Boolean);
    if (!ok) {
      status.textContent = 'Please correct the highlighted fields.';
      fields.find(f => f.getAttribute('aria-invalid') === 'true')?.focus();
      return;
    }
    const submit = $('button[type="submit"]', form);
    submit.disabled = true;
    status.textContent = 'Sending your appointment request…';
    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) {
        status.textContent = `The request could not be sent (HTTP ${response.status}). Please try again or call +91 80816 36186.`;
        return;
      }
      form.reset();
      date.min = new Date().toISOString().split('T')[0];
      form.classList.add('submitted');
      status.classList.add('success');
      status.textContent = 'Your request has been sent! Your appointment is not confirmed until Dr. Ruma Parveen replies.';
    } catch (error) {
      status.textContent = 'The request could not be sent because of a network error. Please check your connection and try again, or call +91 80816 36186.';
      console.error('Appointment request submission failed:', error);
    } finally {
      submit.disabled = false;
    }
  });
})();
