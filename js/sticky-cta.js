(() => {
  const hero = document.querySelector(".hero");
  const eventSection = document.querySelector("#event");
  const stickyCta = document.querySelector("[data-sticky-cta]");
  if (!hero || !eventSection || !stickyCta) return;
  const updateWithScroll = () => {
    const heroBottom = hero.getBoundingClientRect().bottom;
    const eventBounds = eventSection.getBoundingClientRect();
    const isEventInView = eventBounds.top < window.innerHeight && eventBounds.bottom > 0;
    stickyCta.hidden = heroBottom > 0 || isEventInView;
  };
  if (!("IntersectionObserver" in window)) {
    window.addEventListener("scroll", updateWithScroll, { passive: true });
    window.addEventListener("resize", updateWithScroll);
    updateWithScroll();
    return;
  }
  let hasPassedHero = false;
  let isEventVisible = false;
  const updateVisibility = () => {
    stickyCta.hidden = !hasPassedHero || isEventVisible;
  };
  const heroObserver = new IntersectionObserver(([entry]) => {
    hasPassedHero = !entry.isIntersecting && entry.boundingClientRect.top < 0;
    updateVisibility();
  }, { threshold: 0.1 });
  const eventObserver = new IntersectionObserver(([entry]) => {
    isEventVisible = entry.isIntersecting;
    updateVisibility();
  }, { threshold: 0.1 });
  heroObserver.observe(hero);
  eventObserver.observe(eventSection);
})();
