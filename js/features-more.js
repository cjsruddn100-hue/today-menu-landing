// 추가 기능 동작 설명 탭 (담당: B)
(function () {
  const tabs = Array.from(document.querySelectorAll(".features-how-tab"));
  if (tabs.length === 0) return;

  function select(tab) {
    tabs.forEach(function (item) {
      const isOn = item === tab;
      item.setAttribute("aria-selected", String(isOn));
      item.tabIndex = isOn ? 0 : -1;
      item.classList.toggle("is-active", isOn);
      document.getElementById(item.getAttribute("aria-controls")).hidden = !isOn;
    });
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      select(tab);
    });
    // 키보드 좌우 화살표로 탭 이동
    tab.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const step = event.key === "ArrowRight" ? 1 : -1;
      const next = tabs[(index + step + tabs.length) % tabs.length];
      select(next);
      next.focus();
    });
  });

  select(tabs[0]);
})();
