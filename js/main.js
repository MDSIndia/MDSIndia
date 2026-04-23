/* ── Shared JS: nav active, scroll effects, animations ── */
(function () {
  'use strict';

  /* Active nav link */
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  /* Navbar scroll shadow */
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav && nav.classList.toggle('scrolled', window.scrollY > 20);
  });

  /* Hamburger */
  const burger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      burger.classList.toggle('open');
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
  }

  /* Scroll-reveal */
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

  /* Smooth page transitions */
  document.querySelectorAll('a[href$=".html"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href.startsWith('http')) return;
      e.preventDefault();
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.22s';
      setTimeout(() => { location.href = href; }, 230);
    });
  });

  /* Fade in on load */
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.35s';
  window.addEventListener('load', () => { document.body.style.opacity = '1'; });

  /* Counter animation */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const isFloat = String(target).includes('.');
    const dur = 1800, step = 16;
    let current = 0, elapsed = 0;
    const timer = setInterval(() => {
      elapsed += step;
      current = target * Math.min(elapsed / dur, 1);
      el.textContent = (isFloat ? current.toFixed(1) : Math.floor(current)) + (el.dataset.suffix || '');
      if (elapsed >= dur) clearInterval(timer);
    }, step);
  }
  const statObserver = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { animateCount(e.target); statObserver.unobserve(e.target); } });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => statObserver.observe(el));

  /* Contact form */
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('.submit-btn');
      btn.textContent = '✓ Message Sent!';
      btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
      btn.disabled = true;
    });
  }

  /* Beta form */
  const betaForm = document.getElementById('beta-form');
  if (betaForm) {
    betaForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = betaForm.querySelector('button[type="submit"]');
      btn.textContent = '🎉 You\'re on the list!';
      btn.disabled = true;
    });
  }
})();
