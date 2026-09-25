/* Smooth scrolling matched to Portfolio 2: GSAP ticker drives Lenis and ScrollTrigger. */
(() => {
  'use strict';

  const finePointer = matchMedia('(pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const hasGsap = Boolean(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  const state = window.portfolioScroll = {
    ready: false,
    mode: 'native',
    lerp: 0.085,
    driver: hasGsap ? 'gsap' : 'native'
  };

  let lenis = null;
  let lenisTick = null;
  let locationFrame = 0;

  function destroy() {
    cancelAnimationFrame(locationFrame);
    locationFrame = 0;
    if (lenisTick && hasGsap) gsap.ticker.remove(lenisTick);
    lenisTick = null;
    if (lenis) lenis.destroy();
    lenis = null;
    state.mode = 'native';
  }

  function hashTarget(hash) {
    if (!hash || hash === '#') return null;
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); }
    catch (_) { return null; }
  }

  function destination(target) {
    const header = document.querySelector('[data-nav]');
    const inset = header ? header.getBoundingClientRect().bottom + 16 : 0;
    return Math.max(0, scrollY + target.getBoundingClientRect().top - inset);
  }

  function focusTarget(target) {
    const temporary = !target.hasAttribute('tabindex');
    if (temporary) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (temporary) target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
  }

  function syncLocation() {
    cancelAnimationFrame(locationFrame);
    locationFrame = requestAnimationFrame(() => {
      if (!lenis) return;
      lenis.resize();
      const target = hashTarget(location.hash);
      lenis.scrollTo(target ? destination(target) : scrollY, { immediate: true });
      if (hasGsap) ScrollTrigger.update();
    });
  }

  function setup() {
    destroy();

    if (
      reducedMotion.matches ||
      !finePointer.matches ||
      typeof window.Lenis !== 'function' ||
      !hasGsap
    ) {
      state.ready = true;
      state.driver = hasGsap ? 'gsap' : 'native';
      return;
    }

    try {
      lenis = new window.Lenis({
        lerp: 0.085,
        smoothWheel: true,
        syncTouch: false,
        anchors: false
      });

      lenis.on('scroll', ScrollTrigger.update);

      lenisTick = time => lenis.raf(time * 1000);
      gsap.ticker.add(lenisTick);
      gsap.ticker.lagSmoothing(0);

      state.mode = 'smooth';
      state.driver = 'gsap';
      ScrollTrigger.refresh();
    } catch (error) {
      destroy();
      console.warn('Smooth scrolling unavailable; native scrolling remains enabled.', error);
    }

    state.ready = true;
  }

  document.addEventListener('click', event => {
    if (!lenis || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest?.('a[href^="#"]');
    if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;

    const target = hashTarget(anchor.hash);
    if (!target) return;

    event.preventDefault();
    if (location.hash !== anchor.hash) history.pushState(null, '', anchor.hash);

    lenis.scrollTo(destination(target), {
      duration: 1.1,
      immediate: anchor.classList.contains('skip-link'),
      onComplete: () => focusTarget(target)
    });
  });

  document.addEventListener('keydown', event => {
    if (!lenis || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
      lenis.scrollTo(lenis.actualScroll, { immediate: true });
    }
  });

  finePointer.addEventListener('change', setup);
  reducedMotion.addEventListener('change', setup);
  addEventListener('popstate', syncLocation);
  addEventListener('hashchange', syncLocation);
  addEventListener('pagehide', destroy);
  addEventListener('pageshow', event => { if (event.persisted) setup(); });

  document.addEventListener('visibilitychange', () => {
    if (!lenis || document.hidden) return;
    lenis.resize();
    lenis.scrollTo(scrollY, { immediate: true });
    if (hasGsap) ScrollTrigger.refresh();
  });

  setup();

  if (location.hash) {
    if (document.readyState === 'complete') syncLocation();
    else addEventListener('load', syncLocation, { once: true });
  }
})();