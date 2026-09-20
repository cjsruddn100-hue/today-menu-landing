(() => {
  const menus = ["순두부찌개", "제육볶음", "비빔밥", "김치찌개", "돈까스", "쌀국수", "마라탕", "닭갈비", "칼국수", "카레", "샐러드", "파스타"];
  const result = document.querySelector("[data-menu-result]");
  const button = document.querySelector("[data-menu-spin]");
  const buttonLabel = document.querySelector("[data-menu-button-label]");
  if (!result || !button || !buttonLabel) return;
  const pickMenu = () => menus[Math.floor(Math.random() * menus.length)];
  button.addEventListener("click", () => {
    if (button.disabled) return;
    let count = 0;
    const chosenMenu = pickMenu();
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    buttonLabel.textContent = "고르는 중";
    const cycleMenus = () => {
      result.textContent = count >= 16 ? chosenMenu : pickMenu();
      if (count >= 16) {
        button.disabled = false;
        button.removeAttribute("aria-busy");
        buttonLabel.textContent = "다시 뽑기";
        return;
      }
      count += 1;
      window.setTimeout(cycleMenus, count < 10 ? 70 : 150);
    };
    cycleMenus();
  });
})();
