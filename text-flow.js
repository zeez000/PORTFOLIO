(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const state = window.textFlow = { ready: false, enabled: false, mode: 'static' };

  function showEverything() {
    document.querySelectorAll('[data-gsap-reveal], .section-head, .project-intro, .about-layout, .skill-groups, .projects, .timeline, .resume-box, .contact-list')
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
  state.mode = 'gsap-once';

  const groups = [
    '.section-head',
    '.project-intro',
    '.about-layout',
    '.skill-groups',
    '.projects',
    '.timeline',
    '.resume-box',
    '.contact-list'
  ];

  groups.forEach(selector => {
    gsap.utils.toArray(selector).forEach(el => {
      gsap.fromTo(
        el,
        { y: 26, opacity: 0.32 },
        {
          y: 0,
          opacity: 1,
          duration: 0.78,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            once: true
          }
        }
      );
    });
  });

  gsap.utils.toArray('.skill-card, .project-card, .timeline li, .contact-row').forEach((el, index) => {
    gsap.fromTo(
      el,
      { y: 18, opacity: 0.45 },
      {
        y: 0,
        opacity: 1,
        duration: 0.62,
        delay: Math.min((index % 4) * 0.035, 0.1),
        ease: 'power2.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: el,
          start: 'top 94%',
          once: true
        }
      }
    );
  });

  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  state.ready = true;
})();