(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const state = window.textFlow = { ready: false, enabled: false, mode: 'static' };

  function showEverything() {
    document.querySelectorAll('.section-head, .project-intro, .about-layout, .skill-groups, .projects, .timeline, .resume-box, .contact-list')
      .forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
  }

  if (reduced.matches || !window.gsap || !window.ScrollTrigger) {
    showEverything();
    state.ready = true;
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  state.enabled = true;
  state.mode = 'portfolio2-light';

  const targets = [
    '.section-head',
    '.project-intro',
    '.about-layout',
    '.skill-groups',
    '.projects',
    '.timeline',
    '.resume-box',
    '.contact-list'
  ];

  targets.forEach(selector => {
    gsap.utils.toArray(selector).forEach(el => {
      if (el.getBoundingClientRect().top <= innerHeight - 40) return;
      gsap.from(el, {
        y: 36,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: el,
          start: 'top 93%',
          once: true
        }
      });
    });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  document.fonts?.ready?.then(() => ScrollTrigger.refresh());

  state.ready = true;
})();