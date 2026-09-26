(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const canvas = $("pinball-canvas");
  const startButton = $("pinball-start");
  const resetButton = $("pinball-reset");
  const leftButton = $("pinball-left");
  const rightButton = $("pinball-right");
  const aliveLabel = $("pinball-alive");
  const message = $("pinball-message");
  const candidateList = $("pinball-candidates");

  const required = [
    canvas,
    startButton,
    resetButton,
    leftButton,
    rightButton,
    aliveLabel,
    message,
    candidateList,
  ];

  if (required.some((element) => !element)) {
    console.error("핀볼: pinball-* HTML 요소가 누락됐습니다.");
    return;
  }

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    console.error("핀볼: Canvas 2D를 사용할 수 없습니다.");
    return;
  }

  const W = canvas.width;
  const H = canvas.height;
  const SCALE_X = W / 480;
  const SCALE_Y = H / 600;
  const TAU = Math.PI * 2;

  const names = [
    "한끼 김치찌개",
    "소담 칼국수",
    "오늘 돈까스",
    "초록 쌀국수",
    "든든 제육",
    "마라탕",
    "수제버거",
    "초밥",
  ];

  const colors = [
    "#ff9f68",
    "#ffd56c",
    "#ff7384",
    "#91cfed",
    "#bc93ff",
    "#fa84c1",
    "#79dfc0",
    "#f5e49b",
  ];

  const BALL_RADIUS = 13;
  const GRAVITY = 0.18;
  const MAX_SECONDS = 30;

  /*
   * 화면에 그리는 선과 실제 충돌 판정에 사용하는 선이 동일하다.
   * 중앙을 가로지르는 중간 막대는 두지 않는다.
   */
  const rails = [
    // 왼쪽 벽 → 플리퍼 바깥쪽으로 이어지는 가이드
    { x1: 26, y1: 25, x2: 26, y2: 355, type: "wall" },
    { x1: 26, y1: 355, x2: 48, y2: 414, type: "wall" },
    { x1: 48, y1: 414, x2: 70, y2: 455, type: "wall" },
    { x1: 70, y1: 455, x2: 105, y2: 520, type: "wall" },
    { x1: 105, y1: 520, x2: 105, y2: 600, type: "wall" },

    // 오른쪽 벽 → 플리퍼 바깥쪽으로 이어지는 가이드
    { x1: 454, y1: 25, x2: 454, y2: 355, type: "wall" },
    { x1: 454, y1: 355, x2: 432, y2: 414, type: "wall" },
    { x1: 432, y1: 414, x2: 410, y2: 455, type: "wall" },
    { x1: 410, y1: 455, x2: 375, y2: 520, type: "wall" },
    { x1: 375, y1: 520, x2: 375, y2: 600, type: "wall" },

    // 위쪽 벽에 붙은 장애물은 유지
    { x1: 26, y1: 284, x2: 90, y2: 307, type: "guide" },
    { x1: 454, y1: 284, x2: 390, y2: 307, type: "guide" },
    { x1: 45, y1: 392, x2: 99, y2: 374, type: "guide" },
    { x1: 435, y1: 392, x2: 381, y2: 374, type: "guide" },
  ];

  /*
   * 가장 중요한 범퍼는 플리퍼 바로 위, 중앙 아래쪽에 배치한다.
   * 중앙 범퍼 밑에서 올라온 공은 아래로 강하게 되튄다.
   */
  const bumpers = [
    // 플리퍼로 올린 공을 아래로 꽂는 중앙 하단 범퍼
    {
      x: 240,
      y: 411,
      r: 29,
      color: "#ff9a43",
      ring: "#ffe0a6",
      center: true,
    },
  
    // 위쪽 장애물
    {
      x: 120,
      y: 175,
      r: 21,
      color: "#79ded4",
      ring: "#c9fff3",
      center: false,
    },
    {
      x: 360,
      y: 175,
      r: 21,
      color: "#b58cff",
      ring: "#ecd8ff",
      center: false,
    },
    {
      x: 240,
      y: 226,
      r: 17,
      color: "#ff79a9",
      ring: "#ffd3e3",
      center: false,
    },
  
    // 사이드에 붙은 작은 범퍼: 중앙 통로는 막지 않음
    {
      x: 107,
      y: 338,
      r: 16,
      color: "#87eac5",
      ring: "#d3ffe7",
      center: false,
    },
    {
      x: 373,
      y: 338,
      r: 16,
      color: "#ffd166",
      ring: "#fff0b4",
      center: false,
    },
  ];

   /* 양쪽 플리퍼의 끝이 중앙에서 겹치지 않도록 짧게 유지한다.
   */
   const flippers = {
    left: {
      px: 105,
      py: 520,
      length: 82,
      idle: 0.28,
      up: -0.55,
      angle: 0.28,
      pressed: false,
    },
    right: {
      px: 375,
      py: 520,
      length: 82,
      idle: Math.PI - 0.28,
      up: Math.PI + 0.55,
      angle: Math.PI - 0.28,
      pressed: false,
    },
  };
  
  const backdrop = new Image();
  let backdropReady = false;

  backdrop.onload = () => {
    backdropReady = true;

    if (state !== "playing") {
      draw();
    }
  };
  backdrop.onerror = () => {
    console.warn(
      "핀볼 배경 이미지를 찾지 못해 기본 바닥으로 표시합니다."
    );
  };

  backdrop.src = "./assets/pinball-backdrop.png";

  let balls = [];
  let particles = [];
  let state = "idle";
  let animationId = 0;
  let previousTime = 0;
  let elapsed = 0;
  let lastEliminated = null;

  function createCandidateList() {
    candidateList.replaceChildren();

    names.forEach((name, id) => {
      const item = document.createElement("li");

      item.textContent = name;
      item.dataset.ballIndex = String(id);
      item.style.setProperty("--ball-color", colors[id]);

      candidateList.append(item);
    });
  }

  function updateStatus() {
    const remaining = balls.filter((ball) => ball.alive).length;

    aliveLabel.textContent =
      `남은 후보 ${remaining}개 · ` +
      `${Math.min(MAX_SECONDS, Math.floor(elapsed))} / 30초`;

    balls.forEach((ball) => {
      const item = candidateList.children[ball.id];

      if (item) {
        item.classList.toggle("is-out", !ball.alive);
      }
    });
  }

  function createBalls() {
    return names.map((name, id) => ({
      id,
      name,
      x: 108 + (id % 4) * 88,
      y: 68 + Math.floor(id / 4) * 38,
      vx: (Math.random() - 0.5) * 2.6,
      vy: 0.5 + Math.random() * 0.8,
      alive: true,
      outlane: false,
      outlaneSide: null,
      glow: 0,
      bumperCooldown: 0,
      lastFlipperHit: -100,
    }));
  }

  function setFlipper(side, pressed) {
    flippers[side].pressed = pressed;

    if (state !== "playing") {
      draw();
    }
  }

  function addParticles(x, y, color) {
    for (let i = 0; i < 7; i += 1) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3,
        life: 17,
        color,
      });
    }
  }

  function collideWithRail(ball, rail) {
    const dx = rail.x2 - rail.x1;
    const dy = rail.y2 - rail.y1;
    const lengthSquared = dx * dx + dy * dy;

    const projection =
      ((ball.x - rail.x1) * dx +
        (ball.y - rail.y1) * dy) /
      lengthSquared;

    const t = Math.max(0, Math.min(1, projection));

    const nearestX = rail.x1 + dx * t;
    const nearestY = rail.y1 + dy * t;

    const offsetX = ball.x - nearestX;
    const offsetY = ball.y - nearestY;
    const distance = Math.hypot(offsetX, offsetY);
    const collisionDistance = BALL_RADIUS + 4;

    if (distance >= collisionDistance) {
      return false;
    }

    const nx =
      distance > 0.0001
        ? offsetX / distance
        : -dy / Math.hypot(dx, dy);

    const ny =
      distance > 0.0001
        ? offsetY / distance
        : dx / Math.hypot(dx, dy);

    ball.x = nearestX + nx * (collisionDistance + 0.2);
    ball.y = nearestY + ny * (collisionDistance + 0.2);

    const toward = ball.vx * nx + ball.vy * ny;

    if (toward < 0) {
      const restitution = 0.82;

      ball.vx -= (1 + restitution) * toward * nx;
      ball.vy -= (1 + restitution) * toward * ny;
    }

    return true;
  }

  function collideWithBumper(ball, bumper) {
    if (ball.bumperCooldown > 0) {
      return;
    }

    const dx = ball.x - bumper.x;
    const dy = ball.y - bumper.y;
    const distance = Math.hypot(dx, dy);
    const collisionDistance = BALL_RADIUS + bumper.r;

    if (distance >= collisionDistance) {
      return;
    }

    const nx = distance > 0.0001 ? dx / distance : 0;
    const ny = distance > 0.0001 ? dy / distance : -1;

    ball.x =
      bumper.x + nx * (collisionDistance + 0.3);

    ball.y =
      bumper.y + ny * (collisionDistance + 0.3);

    const approachingFromBelow =
      bumper.center &&
      ball.y > bumper.y &&
      ball.vy < 0;

    if (approachingFromBelow) {
      /*
       * 플리퍼가 위로 친 공을 중앙 범퍼가 아래로 꽂는다.
       * 아주 약간 좌우로 흩어져 모든 공이 한 점에 쌓이지 않게 한다.
       */
      ball.vy = 7.6 + Math.random() * 1.1;
      ball.vx =
        (ball.x - bumper.x) * 0.075 +
        (Math.random() - 0.5) * 0.6;
    } else {
      const toward = ball.vx * nx + ball.vy * ny;

      if (toward < 0) {
        ball.vx -= 1.75 * toward * nx;
        ball.vy -= 1.75 * toward * ny;
      }

      if (bumper.center && ball.y > bumper.y) {
        ball.vy = Math.max(ball.vy, 5.5);
      }
    }

    ball.bumperCooldown = 7;
    ball.glow = 12;

    addParticles(ball.x, ball.y, colors[ball.id]);
  }

  function collideWithFlipper(ball, side) {
    const flipper = flippers[side];

    const tipX =
      flipper.px +
      Math.cos(flipper.angle) * flipper.length;

    const tipY =
      flipper.py +
      Math.sin(flipper.angle) * flipper.length;

    const approachedFromAbove =
      ball.y < flipper.py + 3;

    const hit = collideWithRail(ball, {
      x1: flipper.px,
      y1: flipper.py,
      x2: tipX,
      y2: tipY,
    });

    if (
      !hit ||
      !flipper.pressed ||
      !approachedFromAbove ||
      elapsed - ball.lastFlipperHit < 0.16
    ) {
      return;
    }

    ball.vy = -Math.max(
      10.8,
      Math.abs(ball.vy) + 5.8
    );

    ball.vx =
      side === "left"
        ? 1.4 + Math.random() * 0.6
        : -1.4 - Math.random() * 0.6;

    ball.lastFlipperHit = elapsed;
    ball.glow = 22;

    addParticles(ball.x, ball.y, colors[ball.id]);
  }

  function eliminate(ball) {
    if (!ball.alive) {
      return;
    }

    ball.alive = false;
    lastEliminated = ball;
    message.textContent = `${ball.name} 탈락!`;
  }

  function moveBall(ball, dt) {
    if (!ball.alive) {
      return;
    }

    /*
     * 한 프레임을 작은 단계로 나눠
     * 빠른 공이 레일이나 범퍼를 뛰어넘지 않게 한다.
     */
    const distance =
      Math.max(Math.abs(ball.vx), Math.abs(ball.vy)) * dt;

    const substeps =
      Math.max(1, Math.ceil(distance / 2.5));

    const step = dt / substeps;

    for (let i = 0; i < substeps; i += 1) {
      if (ball.outlane) {
        const targetX =
        ball.outlaneSide === "left" ? 45 : 435;

        ball.vx *= 0.75;

        ball.x +=
          ball.vx * step +
          (targetX - ball.x) *
            Math.min(0.035 * step, 0.1);

        ball.vy = Math.min(
          8,
          Math.max(2.7, ball.vy + 0.16 * step)
        );

        ball.y += ball.vy * step;

        if (ball.y > H + BALL_RADIUS) {
          eliminate(ball);
        }

        continue;
      }

      ball.vy = Math.min(
        9,
        ball.vy + GRAVITY * step
      );

      ball.vx *= 0.999;

      ball.x += ball.vx * step;
      ball.y += ball.vy * step;

      if (ball.y < 25 + BALL_RADIUS) {
        ball.y = 25 + BALL_RADIUS;
        ball.vy = Math.abs(ball.vy) * 0.86;
      }

      for (const rail of rails) {
        collideWithRail(ball, rail);
      }

      for (const bumper of bumpers) {
        collideWithBumper(ball, bumper);
      }

      collideWithFlipper(ball, "left");
      collideWithFlipper(ball, "right");

      /*
       * 사이드 OUT 통로는 좁게 유지한다.
       * 진입한 공은 물리 충돌 대신 아래로 흘러간다.
       */
      const leftOutlane =
      ball.x < 43 && ball.y > 474;
    
    const rightOutlane =
      ball.x > W - 43 && ball.y > 474;
    
    if (leftOutlane || rightOutlane) {
      ball.outlane = true;
      ball.outlaneSide =
        leftOutlane ? "left" : "right";
    
      ball.vy = Math.max(ball.vy, 2.7);
    } else if (ball.y > H + BALL_RADIUS) {
      eliminate(ball);
    }

      if (!ball.alive) {
        break;
      }
    }

    ball.glow = Math.max(0, ball.glow - dt);

    ball.bumperCooldown = Math.max(
      0,
      ball.bumperCooldown - dt
    );
  }

  function drawBackground() {
    ctx.fillStyle = "#211713";
    ctx.fillRect(0, 0, W, H);

    if (backdropReady) {
      ctx.drawImage(backdrop, 0, 0, W, H);
    }

    ctx.fillStyle = "rgba(14, 10, 11, 0.27)";
    ctx.fillRect(0, 0, W, H);

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#b07846";

    ctx.beginPath();
    ctx.roundRect(8, 8, W - 16, H - 16, 23);
    ctx.stroke();

    ctx.textAlign = "center";

    ctx.fillStyle = "#ffcd99";
    ctx.font = "700 14px sans-serif";
    ctx.fillText("MENU  PINBALL", W / 2, 47);

    ctx.fillStyle = "#d2ac84";
    ctx.font = "11px sans-serif";

    ctx.fillText(
      "A  LEFT FLIPPER                   D  RIGHT FLIPPER",
      W / 2,
      H - 23
    );

    ctx.fillStyle = "#f4b67b";
    ctx.font = "700 10px sans-serif";

    ctx.fillText("OUT", 43, 472);
    ctx.fillText("OUT", 437, 472);
    ctx.fillText("DRAIN", W / 2, 570);
  }

  function drawRails() {
    ctx.lineCap = "round";

    for (const rail of rails) {
      ctx.strokeStyle = "#ff9a45";
      ctx.shadowColor = "#f79545";
      ctx.shadowBlur = 13;
      ctx.lineWidth = 7;

      ctx.beginPath();
      ctx.moveTo(rail.x1, rail.y1);
      ctx.lineTo(rail.x2, rail.y2);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }

  function drawBumpers() {
    for (const bumper of bumpers) {
      ctx.fillStyle = bumper.color;
      ctx.strokeStyle = bumper.ring;
      ctx.lineWidth = 4;
      ctx.shadowColor = bumper.color;
      ctx.shadowBlur = 18;

      ctx.beginPath();
      ctx.arc(
        bumper.x,
        bumper.y,
        bumper.r,
        0,
        TAU
      );

      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(255, 255, 255, 0.55)";

      ctx.beginPath();
      ctx.arc(
        bumper.x - 5,
        bumper.y - 6,
        6,
        0,
        TAU
      );

      ctx.fill();
    }
  }

  function drawFlippers() {
    for (const flipper of Object.values(flippers)) {
      const tipX =
        flipper.px +
        Math.cos(flipper.angle) * flipper.length;

      const tipY =
        flipper.py +
        Math.sin(flipper.angle) * flipper.length;

      ctx.lineWidth = 16;
      ctx.lineCap = "round";
      ctx.strokeStyle =
        flipper.pressed ? "#ffca88" : "#ffa24f";

      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 17;

      ctx.beginPath();
      ctx.moveTo(flipper.px, flipper.py);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      ctx.shadowBlur = 0;

      ctx.fillStyle = "#fff3d8";

      ctx.beginPath();
      ctx.arc(
        flipper.px,
        flipper.py,
        7,
        0,
        TAU
      );

      ctx.fill();
    }
  }

  function drawBalls() {
    for (const ball of balls) {
      if (!ball.alive) {
        continue;
      }

      const color = colors[ball.id];

      /*
       * 공 색을 교체하지 않는다.
       * 충돌 순간에는 원래 색의 후광만 밝아진다.
       */
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = ball.glow > 0 ? 27 : 9;

      ctx.beginPath();
      ctx.arc(
        ball.x,
        ball.y,
        BALL_RADIUS,
        0,
        TAU
      );
      ctx.fill();

      ctx.shadowBlur = 0;

      /*
       * 검은 라벨 배경 없이
       * 최대 네 글자의 흰 글자만 표시한다.
       */
      const label = ball.name
        .replace(/\s/g, "")
        .slice(0, 4);

      ctx.textAlign = "center";
      ctx.font = "800 10px sans-serif";

      ctx.lineWidth = 2;
      ctx.strokeStyle =
        "rgba(42, 25, 21, 0.6)";

      ctx.strokeText(
        label,
        ball.x,
        ball.y + 3
      );

      ctx.fillStyle = "#ffffff";

      ctx.fillText(
        label,
        ball.x,
        ball.y + 3
      );
    }
  }

  function drawParticles() {
    for (const particle of particles) {
      ctx.globalAlpha =
        Math.max(0, particle.life / 17);

      ctx.fillStyle = particle.color;

      ctx.fillRect(
        particle.x,
        particle.y,
        3,
        3
      );
    }

    ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.save();
    ctx.scale(SCALE_X, SCALE_Y);

    drawBackground();
    drawRails();
    drawBumpers();
    drawFlippers();
    drawBalls();
    drawParticles();

    ctx.restore();
  }

  function finish(winner, timedOut = false) {
    state = "finished";

    flippers.left.pressed = false;
    flippers.right.pressed = false;

    if (winner) {
      const item =
        candidateList.children[winner.id];

      if (item) {
        item.classList.add("is-winner");
      }

      message.textContent = timedOut
        ? `30초 종료! 남은 공 중 가장 높은 ${winner.name}이(가) 선정됐어요.`
        : `${winner.name}이(가) 마지막까지 남아 오늘의 메뉴로 선정됐어요!`;
    } else {
      message.textContent =
        "모든 공이 떨어졌어요. 다시 시작해 주세요.";
    }

    draw();
  }

  function frame(timestamp) {
    if (state !== "playing") {
      return;
    }

    const milliseconds =
      Math.min(
        34,
        timestamp - (previousTime || timestamp)
      );

    previousTime = timestamp;
    elapsed += milliseconds / 1000;

    const dt =
      milliseconds / (1000 / 60);

    for (const flipper of Object.values(flippers)) {
      const target =
        flipper.pressed
          ? flipper.up
          : flipper.idle;

      flipper.angle +=
        (target - flipper.angle) *
        Math.min(1, 0.38 * dt);
    }

    for (const ball of balls) {
      moveBall(ball, dt);
    }

    particles = particles.filter(
      (particle) => particle.life > 0
    );

    for (const particle of particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
    }

    updateStatus();

    const survivors =
      balls.filter((ball) => ball.alive);

    if (survivors.length <= 1) {
      finish(survivors[0] || lastEliminated);
      return;
    }

    if (elapsed >= MAX_SECONDS) {
      const highest = survivors.reduce(
        (current, ball) =>
          ball.y < current.y
            ? ball
            : current
      );

      finish(highest, true);
      return;
    }

    draw();

    animationId =
      requestAnimationFrame(frame);
  }

  function reset() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    animationId = 0;
    previousTime = 0;
    elapsed = 0;
    lastEliminated = null;

    balls = [];
    particles = [];
    state = "idle";

    for (const flipper of Object.values(flippers)) {
      flipper.pressed = false;
      flipper.angle = flipper.idle;
    }

    createCandidateList();

    aliveLabel.textContent =
      `남은 후보 ${names.length}개 · 0 / 30초`;

    message.textContent =
      "시작을 누르면 메뉴 공 8개가 동시에 등장합니다.";

    draw();
  }

  function start() {
    reset();

    balls = createBalls();
    state = "playing";

    message.textContent =
      "A/D 키 또는 버튼으로 공을 쳐올리세요.";

    updateStatus();
    draw();

    animationId =
      requestAnimationFrame(frame);
  }

  function bindPointer(button, side) {
    button.addEventListener(
      "pointerdown",
      (event) => {
        event.preventDefault();

        button.setPointerCapture(
          event.pointerId
        );

        setFlipper(side, true);
      }
    );

    for (const type of [
      "pointerup",
      "pointercancel",
      "lostpointercapture",
    ]) {
      button.addEventListener(
        type,
        () => setFlipper(side, false)
      );
    }
  }

  startButton.addEventListener("click", start);
  resetButton.addEventListener("click", reset);

  bindPointer(leftButton, "left");
  bindPointer(rightButton, "right");

  window.addEventListener("keydown", (event) => {
    if (state !== "playing") {
      return;
    }

    if (event.code === "KeyA") {
      setFlipper("left", true);
    }

    if (event.code === "KeyD") {
      setFlipper("right", true);
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.code === "KeyA") {
      setFlipper("left", false);
    }

    if (event.code === "KeyD") {
      setFlipper("right", false);
    }
  });

  window.addEventListener("blur", () => {
    setFlipper("left", false);
    setFlipper("right", false);
  });

  reset();
})();