const ladderBoard = document.querySelector("#ladder-board");
const ladderResult = document.querySelector("#ladder-game-result");
const ladderCandidateList = document.querySelector("#ladder-candidate-list");
const ladderStartButton = document.querySelector("#ladder-start-button");
const ladderAddButton = document.querySelector("#ladder-add-button");
const ladderResetButton = document.querySelector("#ladder-reset-button");
const ladderShareButton = document.querySelector("#ladder-share-button");

const defaultRestaurants = [
  "한끼 김치찌개",
  "소담 칼국수",
  "오늘 돈까스",
  "초록 쌀국수",
  "든든 제육",
];

const ROW_COUNT = 7;
const MAX_CANDIDATES = 8;

let selectedRestaurants = [];
let ladderRungs = [];
let winnerIndex = null;
let ladderStarted = false;

function renderCandidateList(restaurants) {
  if (!ladderCandidateList) return;

  ladderCandidateList.replaceChildren();

  restaurants.forEach((restaurant) => {
    const item = document.createElement("li");
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    const text = document.createElement("span");

    label.className = "ladder-candidate-label";
    checkbox.type = "checkbox";
    checkbox.value = restaurant;
    checkbox.checked = true;
    text.textContent = restaurant;

    label.append(checkbox, text);
    item.append(label);
    ladderCandidateList.append(item);

    checkbox.addEventListener("change", resetLadderState);
  });
}

function getCheckedRestaurants() {
  if (!ladderCandidateList) return [];

  return Array.from(
    ladderCandidateList.querySelectorAll(
      'input[type="checkbox"]:checked'
    ),
    (checkbox) => checkbox.value
  );
}

function createRungs(count) {
  const rungs = [];

  for (let row = 0; row < ROW_COUNT; row += 1) {
    let previousColumnHasRung = false;

    for (let column = 0; column < count - 1; column += 1) {
      const shouldCreate =
        !previousColumnHasRung && Math.random() > 0.5;

      if (shouldCreate) {
        rungs.push({ row, column });
      }

      previousColumnHasRung = shouldCreate;
    }
  }

  return rungs;
}

function getPathData(startIndex) {
  let currentColumn = startIndex;
  const visitedRungs = [];

  for (let row = 0; row < ROW_COUNT; row += 1) {
    const rightRung = ladderRungs.find(
      (rung) =>
        rung.row === row && rung.column === currentColumn
    );

    const leftRung = ladderRungs.find(
      (rung) =>
        rung.row === row && rung.column === currentColumn - 1
    );

    if (rightRung) {
      visitedRungs.push(rightRung);
      currentColumn += 1;
    } else if (leftRung) {
      visitedRungs.push(leftRung);
      currentColumn -= 1;
    }
  }

  return {
    destinationIndex: currentColumn,
    visitedRungs,
  };
}

function createBoard(count) {
  if (!ladderBoard) return;

  ladderBoard.replaceChildren();
  ladderBoard.style.setProperty("--ladder-count", count);

  const startRow = document.createElement("div");
  startRow.className = "ladder-start-row";

  selectedRestaurants.forEach((restaurant, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "ladder-start-button";
    button.textContent = restaurant;
    button.dataset.startIndex = String(index);

    button.addEventListener("click", () => {
      if (!ladderStarted) return;
      playLadder(index);
    });

    startRow.append(button);
  });

  const lines = document.createElement("div");
  lines.className = "ladder-lines";

  selectedRestaurants.forEach((_, index) => {
    const verticalLine = document.createElement("i");

    verticalLine.className = "ladder-vertical-line";
    verticalLine.dataset.column = String(index);
    verticalLine.style.left = `${((index + 0.5) / count) * 100}%`;

    lines.append(verticalLine);
  });

  ladderRungs.forEach((rung) => {
    const rungElement = document.createElement("b");

    rungElement.className = "ladder-rung";
    rungElement.dataset.row = String(rung.row);
    rungElement.dataset.column = String(rung.column);
    rungElement.style.left =
      `${((rung.column + 0.5) / count) * 100}%`;
    rungElement.style.width = `${100 / count}%`;
    rungElement.style.top =
      `${((rung.row + 1) / (ROW_COUNT + 1)) * 100}%`;

    lines.append(rungElement);
  });

  const resultRow = document.createElement("div");
  resultRow.className = "ladder-result-row";

  selectedRestaurants.forEach((_, index) => {
    const label = document.createElement("span");

    label.className = "ladder-result-label";
    label.dataset.resultIndex = String(index);
    label.textContent = index === winnerIndex ? "당첨" : "꽝";

    resultRow.append(label);
  });

  ladderBoard.append(startRow, lines, resultRow);
}

function clearPathStyles() {
  if (!ladderBoard) return;

  ladderBoard
    .querySelectorAll(
      ".ladder-start-button.is-selected, " +
      ".ladder-vertical-line.is-path, " +
      ".ladder-rung.is-path, " +
      ".ladder-result-label.is-winner"
    )
    .forEach((element) => {
      element.classList.remove(
        "is-selected",
        "is-path",
        "is-winner"
      );
    });
}

function resetLadderState() {
  ladderStarted = false;
  ladderRungs = [];
  winnerIndex = null;
  selectedRestaurants = [];

  if (ladderShareButton) {
    ladderShareButton.hidden = true;
    ladderShareButton.dataset.result = "";
    ladderShareButton.textContent = "결과 공유하기";
  }

  if (ladderBoard) {
    ladderBoard.replaceChildren();

    const guide = document.createElement("p");
    guide.className = "ladder-board-guide";
    guide.textContent =
      "오른쪽 후보를 선택한 뒤 사다리 시작 버튼을 눌러보세요.";

    ladderBoard.append(guide);
  }

  if (ladderResult) {
    ladderResult.textContent =
      "오른쪽 후보를 선택한 뒤 사다리 시작 버튼을 눌러 주세요.";
  }
}

function startLadder() {
  const candidates = getCheckedRestaurants();

  if (candidates.length < 2) {
    if (ladderResult) {
      ladderResult.textContent =
        "후보를 두 개 이상 선택해 주세요.";
    }
    return;
  }

  if (candidates.length > MAX_CANDIDATES) {
    if (ladderResult) {
      ladderResult.textContent =
        `후보는 ${MAX_CANDIDATES}개 이하로 선택해 주세요.`;
    }
    return;
  }

  selectedRestaurants = candidates;
  ladderRungs = createRungs(candidates.length);

  const winningStartIndex = Math.floor(
    Math.random() * candidates.length
  );

  winnerIndex = getPathData(
    winningStartIndex
  ).destinationIndex;

  createBoard(candidates.length);
  ladderStarted = true;

  if (ladderResult) {
    ladderResult.textContent =
      "위의 식당을 하나 눌러 사다리 결과를 확인해 보세요.";
  }

  if (ladderShareButton) {
    ladderShareButton.hidden = true;
    ladderShareButton.dataset.result = "";
  }
}

function playLadder(startIndex) {
  if (!ladderStarted || !ladderBoard) return;

  const pathData = getPathData(startIndex);
  const isWinner =
    pathData.destinationIndex === winnerIndex;

  clearPathStyles();

  const startButton = ladderBoard.querySelector(
    `.ladder-start-button[data-start-index="${startIndex}"]`
  );

  const resultLabel = ladderBoard.querySelector(
    `.ladder-result-label[data-result-index="${pathData.destinationIndex}"]`
  );

  if (startButton) {
    startButton.classList.add("is-selected");
  }

  pathData.visitedRungs.forEach((rung) => {
    const element = ladderBoard.querySelector(
      `.ladder-rung[data-row="${rung.row}"]` +
      `[data-column="${rung.column}"]`
    );

    if (element) {
      element.classList.add("is-path");
    }
  });

  if (resultLabel) {
    resultLabel.classList.add("is-winner");
  }

  // 하단 당첨 칸은 '도착 위치', 식당 이름은 '클릭한 출발 후보'다.
  const chosenRestaurant = selectedRestaurants[startIndex];

  if (ladderResult) {
    ladderResult.textContent = isWinner
      ? `축하해요! 오늘의 식당은 ${chosenRestaurant}입니다.`
      : `${chosenRestaurant}에서 출발한 결과는 꽝이에요.`;
  }

  if (ladderShareButton) {
    ladderShareButton.hidden = false;
    ladderShareButton.dataset.result = isWinner
      ? `오늘의 식당은 ${chosenRestaurant}입니다!`
      : `${chosenRestaurant}에서 출발한 사다리 결과는 꽝이에요.`;
  }
}

function addCandidate() {
  if (!ladderCandidateList) return;

  const input = window.prompt("추가할 식당 이름을 입력하세요.");
  const restaurant = input?.trim();

  if (!restaurant) return;

  const existing = Array.from(
    ladderCandidateList.querySelectorAll(
      'input[type="checkbox"]'
    ),
    (checkbox) => ({
      name: checkbox.value,
      checked: checkbox.checked,
    })
  );

  if (existing.some((item) => item.name === restaurant)) {
    if (ladderResult) {
      ladderResult.textContent =
        "이미 목록에 있는 식당입니다.";
    }
    return;
  }

  if (existing.length >= MAX_CANDIDATES) {
    if (ladderResult) {
      ladderResult.textContent =
        `후보는 최대 ${MAX_CANDIDATES}개까지 추가할 수 있어요.`;
    }
    return;
  }

  renderCandidateList([
    ...existing.map((item) => item.name),
    restaurant,
  ]);

  const checkboxes = ladderCandidateList.querySelectorAll(
    'input[type="checkbox"]'
  );

  existing.forEach((item, index) => {
    checkboxes[index].checked = item.checked;
  });

  resetLadderState();

  if (ladderResult) {
    ladderResult.textContent =
      "후보가 추가됐어요. 선택을 확인한 뒤 사다리를 시작해 주세요.";
  }
}

async function shareResult() {
  if (!ladderShareButton || ladderShareButton.hidden) return;

  const shareText = ladderShareButton.dataset.result;

  try {
    if (navigator.share) {
      await navigator.share({
        title: "오늘은 뭐 먹지",
        text: shareText,
      });
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareText);
      ladderShareButton.textContent = "결과 복사 완료";

      setTimeout(() => {
        ladderShareButton.textContent = "결과 공유하기";
      }, 1800);
    } else if (ladderResult) {
      ladderResult.textContent =
        "이 브라우저에서는 자동 공유를 지원하지 않아요. 결과 화면을 캡처해 주세요.";
    }
  } catch (error) {
    if (error.name !== "AbortError" && ladderResult) {
      ladderResult.textContent =
        "공유에 실패했어요. 결과 화면을 캡처해 주세요.";
    }
  }
}

if (ladderStartButton) {
  ladderStartButton.addEventListener("click", startLadder);
}

if (ladderAddButton) {
  ladderAddButton.addEventListener("click", addCandidate);
}

if (ladderResetButton) {
  ladderResetButton.addEventListener("click", resetLadderState);
}

if (ladderShareButton) {
  ladderShareButton.addEventListener("click", shareResult);
}

renderCandidateList(defaultRestaurants);
resetLadderState();