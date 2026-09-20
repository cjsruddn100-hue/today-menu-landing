/* =========================================================
   location-pick.js  ―  위치 기반 랜덤 추천 (발표용, 담당: B)

   · 가게 정보는 data/stores.js 에서 읽습니다. (비밀 키 없음)
   · 네이버 지도 Client ID가 있으면 실제 지도 위에 핀을 찍고,
     없거나 인증에 실패하면 그림 지도로 자동 전환합니다.
   · 핀이나 목록을 클릭하면 페이지 안에서 가게 정보가 열립니다.
   · "뽑아보기"는 최근 5일간 간 곳을 빼고 딱 한 곳을 골라 보여줍니다.
   ========================================================= */

(function () {
  const STORES = window.STORE_DATA || [];
  const CONFIG = window.LOCATION_CONFIG || {};
  const CENTER = CONFIG.CENTER || { lat: 37.497942, lng: 127.027621 };
  const RADIUS = CONFIG.RADIUS || 500;
  const EXCLUDE_DAYS = 5;
  const HISTORY_KEY = "todaymenu_visit_history";
  const WALK_M_PER_MIN = 70; // 도보 1분 ≈ 70m

  // ── 화면 요소 ─────────────────────────────────────────
  const pinLayer = document.querySelector(".location-pins");
  const naverBox = document.querySelector(".location-naver-map");
  const imageBox = document.querySelector(".location-image");
  const listBox = document.querySelector(".location-list");
  const detailBox = document.querySelector(".location-detail");
  const pickButton = document.querySelector(".location-pick-button");
  const resetButton = document.querySelector(".location-reset-button");
  const statusText = document.querySelector(".location-status");

  if (!pinLayer || !listBox || !detailBox || STORES.length === 0) return;

  // ── 방문 기록 (localStorage) ──────────────────────────
  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveVisit(store) {
    const history = loadHistory();
    history.unshift({ id: store.id, date: Date.now() });
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
    } catch (e) {
      /* 저장이 막힌 브라우저에서는 기록 없이 동작 */
    }
  }

  function recentIds() {
    const limit = Date.now() - EXCLUDE_DAYS * 24 * 60 * 60 * 1000;
    return loadHistory()
      .filter((v) => v.date >= limit)
      .map((v) => v.id);
  }

  // ── 핀 + 목록 그리기 ──────────────────────────────────
  function render() {
    pinLayer.innerHTML = "";
    listBox.innerHTML = "";

    STORES.forEach((store, index) => {
      // 지도 위 핀
      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = "location-pin";
      pin.style.left = `${store.x}%`;
      pin.style.top = `${store.y}%`;
      pin.textContent = index + 1;
      pin.dataset.id = store.id;
      pin.setAttribute("aria-label", `${store.name} 정보 보기`);
      pin.addEventListener("click", () => openDetail(store));
      pinLayer.appendChild(pin);

      // 아래 목록
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "location-list-item";
      button.dataset.id = store.id;
      button.innerHTML = `
        <span class="location-list-num">${index + 1}</span>
        <span class="location-list-name"></span>
        <span class="location-list-meta">${store.category} · ${store.distance}m</span>
      `;
      button.querySelector(".location-list-name").textContent = store.name;
      button.addEventListener("click", () => openDetail(store));
      item.appendChild(button);
      listBox.appendChild(item);
    });
  }

  // ── 가게 정보 열기 ────────────────────────────────────
  function openDetail(store, options = {}) {
    const minutes = Math.max(1, Math.round(store.distance / WALK_M_PER_MIN));

    detailBox.innerHTML = `
      <p class="location-detail-label">${options.picked ? "오늘은 여기 어때요?" : "가게 정보"}</p>
      <p class="location-detail-name"></p>
      <p class="location-detail-meta">${store.category} · ${store.distance}m · 도보 약 ${minutes}분</p>
      <dl class="location-detail-info">
        <div><dt>대표 메뉴</dt><dd class="js-menu"></dd></div>
        <div><dt>가격</dt><dd class="js-price"></dd></div>
        <div><dt>영업 시간</dt><dd class="js-hours"></dd></div>
        <div><dt>한 줄 팁</dt><dd class="js-note"></dd></div>
      </dl>
      ${options.excluded > 0 ? `<p class="location-detail-note">최근 ${EXCLUDE_DAYS}일간 간 곳 ${options.excluded}곳은 뺐어요.</p>` : ""}
      <button class="location-detail-close" type="button">닫기</button>
    `;
    // 가게 이름·정보는 textContent로 넣어 안전하게 표시
    detailBox.querySelector(".location-detail-name").textContent = store.name;
    detailBox.querySelector(".js-menu").textContent = store.menu;
    detailBox.querySelector(".js-price").textContent = store.price;
    detailBox.querySelector(".js-hours").textContent = store.hours;
    detailBox.querySelector(".js-note").textContent = store.note;
    detailBox
      .querySelector(".location-detail-close")
      .addEventListener("click", closeDetail);

    detailBox.hidden = false;
    highlight(store.id);
  }

  function closeDetail() {
    detailBox.hidden = true;
    highlight(null);
  }

  // ── 네이버 지도 (Client ID가 있을 때만) ──────────────
  let naverMap = null;
  const naverMarkers = {};

  function markerHtml(number, active) {
    return `<span class="location-naver-pin${active ? " is-active" : ""}">${number}</span>`;
  }

  // 인증 실패 시 네이버가 호출하는 함수 → 그림 지도로 되돌리기
  window.navermap_authFailure = function () {
    console.warn("[위치 추천] 네이버 지도 인증 실패 → 그림 지도로 전환");
    useImageMap();
  };

  function useImageMap() {
    if (naverBox) naverBox.hidden = true;
    if (imageBox) imageBox.hidden = false;
    pinLayer.hidden = false;
  }

  function loadNaverMap() {
    return new Promise((resolve, reject) => {
      if (!CONFIG.NAVER_MAP_CLIENT_ID || !naverBox) {
        reject(new Error("NO_ID"));
        return;
      }
      const script = document.createElement("script");
      script.src =
        "https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=" +
        encodeURIComponent(CONFIG.NAVER_MAP_CLIENT_ID);
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("LOAD_FAIL"));
      document.head.appendChild(script);
    });
  }

  function drawNaverMap() {
    const center = new naver.maps.LatLng(CENTER.lat, CENTER.lng);
    naverMap = new naver.maps.Map(naverBox, { center, zoom: 16 });

    // 걸어갈 수 있는 반경
    new naver.maps.Circle({
      map: naverMap,
      center,
      radius: RADIUS,
      fillColor: "#f97316",
      fillOpacity: 0.08,
      strokeColor: "#f97316",
      strokeOpacity: 0.5,
      strokeStyle: "shortdash",
    });

    // 내 위치
    new naver.maps.Marker({
      map: naverMap,
      position: center,
      icon: {
        content: '<span class="location-naver-me"></span>',
        anchor: new naver.maps.Point(9, 9),
      },
    });

    // 가게 5곳
    STORES.forEach((store, index) => {
      const marker = new naver.maps.Marker({
        map: naverMap,
        position: new naver.maps.LatLng(store.lat, store.lng),
        title: store.name,
        icon: {
          content: markerHtml(index + 1, false),
          anchor: new naver.maps.Point(15, 15),
        },
      });
      naver.maps.Event.addListener(marker, "click", () => openDetail(store));
      naverMarkers[store.id] = { marker, number: index + 1 };
    });

    naverBox.hidden = false;
    if (imageBox) imageBox.hidden = true;
    pinLayer.hidden = true;
  }

  function highlightNaver(id) {
    Object.keys(naverMarkers).forEach((key) => {
      const { marker, number } = naverMarkers[key];
      marker.setIcon({
        content: markerHtml(number, key === id),
        anchor: new naver.maps.Point(15, 15),
      });
      marker.setZIndex(key === id ? 100 : 1);
    });
    if (id && naverMap) {
      const store = STORES.find((s) => s.id === id);
      if (store) naverMap.panTo(new naver.maps.LatLng(store.lat, store.lng));
    }
  }

  // 선택한 가게의 핀·목록만 강조
  function highlight(id) {
    document
      .querySelectorAll(".location-pin, .location-list-item")
      .forEach((el) => el.classList.toggle("is-active", el.dataset.id === id));
    if (naverMap) highlightNaver(id);
  }

  // ── 뽑기: 최근 간 곳 빼고 딱 한 곳 ────────────────────
  function handlePick() {
    const recent = recentIds();
    const candidates = STORES.filter((s) => !recent.includes(s.id));
    const pool = candidates.length > 0 ? candidates : STORES;
    const picked = pool[Math.floor(Math.random() * pool.length)];

    saveVisit(picked);
    openDetail(picked, {
      picked: true,
      excluded: STORES.length - candidates.length,
    });

    statusText.textContent =
      candidates.length > 0
        ? `반경 500m 안 ${STORES.length}곳 중 한 곳을 뽑았어요.`
        : "최근에 다 가봤네요! 처음부터 다시 골랐어요.";
  }

  function handleReset() {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {
      /* 무시 */
    }
    statusText.textContent = "방문 기록을 지웠어요.";
  }

  render();
  loadNaverMap()
    .then(drawNaverMap)
    .catch(() => useImageMap());
  if (pickButton) pickButton.addEventListener("click", handlePick);
  if (resetButton) resetButton.addEventListener("click", handleReset);
})();
