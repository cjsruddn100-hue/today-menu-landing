(() => {
  const header = document.querySelector("[data-site-header]");
  const menuButton = document.querySelector(".header-menu-button");
  const navigation = document.querySelector(".header-nav");

  if (!header || !menuButton || !navigation) return;

  const closeMenu = () => {
    navigation.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
  };
  const openMenu = () => {
    navigation.classList.add("is-open");
    menuButton.setAttribute("aria-expanded", "true");
  };

  menuButton.addEventListener("click", () => {
    if (menuButton.getAttribute("aria-expanded") === "true") {
      closeMenu();
      return;
    }
    openMenu();
  });
  navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) closeMenu();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) closeMenu();
  });
})();
