(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nav = document.querySelector("[data-nav]");
  const menuButton = document.querySelector(".menu-toggle");
  const navLinks = [...document.querySelectorAll("#primary-navigation a")];
  const progress = document.querySelector(".scroll-progress span");

  document.getElementById("year").textContent = new Date().getFullYear();

  menuButton?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
  });

  navLinks.forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  }));

  const updateScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const ratio = max > 0 ? scrollY / max : 0;
    progress.style.width = `${ratio * 100}%`;
    nav.classList.toggle("scrolled", scrollY > 24);
  };
  addEventListener("scroll", updateScroll, { passive: true });
  updateScroll();

  const reveals = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(item => item.classList.add("visible"));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    reveals.forEach(item => revealObserver.observe(item));
  }

  const sections = [...document.querySelectorAll("main section[id]")];
  const activateNav = () => {
    const current = sections.reduce((active, section) =>
      scrollY >= section.offsetTop - innerHeight * .35 ? section.id : active, "home");
    navLinks.forEach(link => link.classList.toggle("active", link.hash === `#${current}`));
  };
  addEventListener("scroll", activateNav, { passive: true });
  activateNav();

})();
