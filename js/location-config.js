/* =========================================================
   location-config.js  ―  위치 기반 추천 설정 (담당: B)

   · NAVER_MAP_CLIENT_ID : 네이버 클라우드 Maps의 Client ID
     - 웹페이지에 공개되는 용도의 ID이며, 콘솔에 등록한
       주소(예: http://127.0.0.1:5500)에서만 동작합니다.
     - ⚠ Client Secret은 절대 넣지 않습니다.
     - 비워두면 그림 지도로 동작합니다.
   ========================================================= */

// 네이버 ID는 이 파일에 직접 쓰지 않고, 로컬 전용 파일
// js/location-keys.local.js 에서 읽어옵니다. (레포에 올리지 않음)
// 그 파일이 없으면 그림 지도로 동작합니다.
const LOCAL_KEYS = window.LOCATION_KEYS || {};

window.LOCATION_CONFIG = {
  NAVER_MAP_CLIENT_ID: LOCAL_KEYS.NAVER_MAP_KEY_ID || "",

  // 지도 중심 (강남역)
  CENTER: { lat: 37.497942, lng: 127.027621 },

  // 걸어서 다녀올 수 있는 반경 (m)
  RADIUS: 500,
};
