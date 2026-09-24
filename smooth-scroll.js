/* Scrolling only. Matches Portfolio 2's Lenis tuning without importing its design. */
(() => {
  'use strict';
  const finePointer = matchMedia('(pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const state = window.portfolioScroll = { ready: false, mode: 'native', lerp: 0.085 };
  let instance = null;
  let frame = 0;
  let locationFrame = 0;

  function destroy() {
    cancelAnimationFrame(frame);
    cancelAnimationFrame(locationFrame);
    frame = locationFrame = 0;
    if (instance) instance.destroy();
    instance = null;
    state.mode = 'native';
  }

  function tick(time) {
    if (!instance || document.hidden) return;
    instance.raf(time);
    frame = requestAnimationFrame(tick);
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

  // Use native history restoration, then synchronize the scroll engine.
  function syncLocation() {
    cancelAnimationFrame(locationFrame);
    locationFrame = requestAnimationFrame(() => {
      if (!instance) return;
      instance.resize();
      const target = hashTarget(location.hash);
      instance.scrollTo(target ? destination(target) : scrollY, { immediate: true });
    });
  }

  function setup() {
    destroy();
    if (reducedMotion.matches || !finePointer.matches || typeof window.Lenis !== 'function') {
      state.ready = true;
      return;
    }
    try {
      instance = new window.Lenis({
        lerp: 0.085,
        smoothWheel: true,
        syncTouch: false,
        anchors: false,
        autoRaf: false,
        prevent: node => node.matches?.('textarea, select, [data-lenis-prevent], dialog[open]') || false
      });
      state.mode = 'smooth';
      if (!document.hidden) frame = requestAnimationFrame(tick);
    } catch (error) {
      destroy();
      console.warn('Smooth scrolling unavailable; native scrolling remains enabled.', error);
    }
    state.ready = true;
  }

  document.addEventListener('click', event => {
    if (!instance || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest?.('a[href^="#"]');
    if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
    const target = hashTarget(anchor.hash);
    if (!target) return;
    event.preventDefault();
    if (location.hash !== anchor.hash) history.pushState(null, '', anchor.hash);
    instance.scrollTo(destination(target), {
      duration: 1.1,
      immediate: anchor.classList.contains('skip-link'),
      onComplete: () => focusTarget(target)
    });
  });

  // Keyboard scrolling stays native and can interrupt an in-flight animation.
  document.addEventListener('keydown', event => {
    if (!instance || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
      instance.scrollTo(instance.actualScroll, { immediate: true });
    }
  });

  finePointer.addEventListener('change', setup);
  reducedMotion.addEventListener('change', setup);
  addEventListener('popstate', syncLocation);
  addEventListener('hashchange', syncLocation);
  addEventListener('pagehide', destroy);
  addEventListener('pageshow', event => { if (event.persisted) setup(); });
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frame);
    if (!instance || document.hidden) return;
    instance.resize();
    instance.scrollTo(scrollY, { immediate: true });
    frame = requestAnimationFrame(tick);
  });
  setup();
  if (location.hash) {
    if (document.readyState === 'complete') syncLocation();
    else addEventListener('load', syncLocation, { once: true });
  }
})();
