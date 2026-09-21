const ladderBoard = document.querySelector(
  "#ladder-board"
);

const ladderResult = document.querySelector(
  "#ladder-game-result"
);

const ladderCandidateList = document.querySelector(
  "#ladder-candidate-list"
);

const ladderStartButton = document.querySelector(
  "#ladder-start-button"
);

const ladderAddButton = document.querySelector(
  "#ladder-add-button"
);

const ladderResetButton = document.querySelector(
  "#ladder-reset-button"
);

const ladderShareButton = document.querySelector(
  "#ladder-share-button"
);

const defaultRestaurants = [
  "한끼 김치찌개",
  "소담 칼국수",
  "오늘 돈까스",
  "초록 쌀국수",
  "든든 제육",
];

let selectedRestaurants = [];
let ladderRungs = [];
let winnerIndex = null;
let ladderStarted = false;

function renderCandidateList(restaurants) {
  if (!ladderCandidateList) {
    return;
  }

  ladderCandidateList.innerHTML = "";

  restaurants.forEach((restaurant, index) => {
    const listItem = document.createElement("li");

    const label = document.createElement("label");
    label.className = "ladder-candidate-label";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = restaurant;
    checkbox.checked = true;
    checkbox.dataset.candidateIndex = index;

    const text = document.createElement("span");
    text.textContent = restaurant;

    label.append(checkbox, text);
    listItem.append(label);
    ladderCandidateList.append(listItem);

    checkbox.addEventListener("change", () => {
      resetLadderState();
    });
  });
}

function getCheckedRestaurants() {
  if (!ladderCandidateList) {
    return [];
  }

  const checkedInputs = ladderCandidateList.querySelectorAll(
    "input[type='checkbox']:checked"
  );

  return Array.from(checkedInputs).map(
    (checkbox) => checkbox.value
  );
}

function createRungs(count) {
  const rungs = [];
  const rowCount = 7;

  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < count - 1; column += 1) {
      const previousRung = rungs.find(
        (rung) =>
          rung.row === row &&
          rung.column === column - 1
      );

      const canCreate =
        Math.random() > 0.5 &&
        !previousRung;

      if (canCreate) {
        rungs.push({
          row,
          column,
        });
      }
    }
  }

  return rungs;
}

function getPathData(startIndex) {
  let currentColumn = startIndex;
  const visitedColumns = [startIndex];
  const visitedRungs = [];

  for (let row = 0; row < 7; row += 1) {
    const rightRung = ladderRungs.find(
      (rung) =>
        rung.row === row &&
        rung.column === currentColumn
    );

    const leftRung = ladderRungs.find(
      (rung) =>
        rung.row === row &&
        rung.column === currentColumn - 1
    );

    if (rightRung) {
      visitedRungs.push(rightRung);
      currentColumn += 1;
      visitedColumns.push(currentColumn);
      continue;
    }

    if (leftRung) {
      visitedRungs.push(leftRung);
      currentColumn -= 1;
      visitedColumns.push(currentColumn);
    }
  }

  return {
    destinationIndex: currentColumn,
    visitedColumns,
    visitedRungs,
  };
}

function createBoard(count) {
  if (!ladderBoard) {
    return;
  }

  ladderBoard.innerHTML = "";

  ladderBoard.style.setProperty(
    "--ladder-count",
    count
  );

  const startRow = document.createElement("div");
  startRow.className = "ladder-start-row";

  selectedRestaurants.forEach((restaurant, index) => {
    const startButton = document.createElement("button");

    startButton.type = "button";
    startButton.className = "ladder-start-button";
    startButton.textContent = restaurant;
    startButton.dataset.startIndex = index;

    startButton.addEventListener("click", () => {
      if (!ladderStarted) {
        if (ladderResult) {
          ladderResult.textContent =
            "먼저 사다리 시작 버튼을 눌러 주세요.";
        }

        return;
      }

      playLadder(index);
    });

    startRow.append(startButton);
  });

  const lines = document.createElement("div");
  lines.className = "ladder-lines";

  selectedRestaurants.forEach((_, index) => {
    const verticalLine = document.createElement("i");

    verticalLine.className = "ladder-vertical-line";
    verticalLine.dataset.column = index;

    const position =
      count === 1
        ? 50
        : (index / (count - 1)) * 100;

    verticalLine.style.left = `${position}%`;

    lines.append(verticalLine);
  });

  ladderRungs.forEach((rung) => {
    const rungElement = document.createElement("b");

    rungElement.className = "ladder-rung";
    rungElement.dataset.row = rung.row;
    rungElement.dataset.column = rung.column;

    const leftPercent =
      (rung.column / (count - 1)) * 100;

    const widthPercent =
      100 / (count - 1);

    const topPercent =
      ((rung.row + 1) / 8) * 100;

    rungElement.style.left = `${leftPercent}%`;
    rungElement.style.width = `${widthPercent}%`;
    rungElement.style.top = `${topPercent}%`;

    lines.append(rungElement);
  });

  const cover = document.createElement("div");

  cover.id = "ladder-cover";
  cover.className = "ladder-cover";
  cover.innerHTML =
    "사다리 시작 전<br />결과를 가리고 있어요";

  lines.append(cover);

  const resultRow = document.createElement("div");
  resultRow.className = "ladder-result-row";

  selectedRestaurants.forEach((_, index) => {
    const resultLabel = document.createElement("span");

    resultLabel.className = "ladder-result-label";
    resultLabel.textContent = "꽝";
    resultLabel.dataset.resultIndex = index;

    resultRow.append(resultLabel);
  });

  ladderBoard.append(startRow, lines, resultRow);
}

function resetPathStyles() {
  document
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

  if (ladderShareButton) {
    ladderShareButton.hidden = true;
    ladderShareButton.dataset.result = "";
    ladderShareButton.textContent = "결과 공유하기";
  }

  if (ladderBoard) {
    ladderBoard.innerHTML = `
      <p class="ladder-board-guide">
        오른쪽 후보를 선택한 뒤<br />
        사다리 시작 버튼을 눌러보세요.
      </p>
    `;
  }

  if (ladderResult) {
    ladderResult.textContent =
      "오른쪽 후보를 선택한 뒤 사다리 시작 버튼을 눌러 주세요.";
  }
}

function startLadder() {
  selectedRestaurants = getCheckedRestaurants();

  if (selectedRestaurants.length < 2) {
    if (ladderResult) {
      ladderResult.textContent =
        "후보를 두 개 이상 선택해 주세요.";
    }

    return;
  }

  ladderStarted = true;

  winnerIndex = Math.floor(
    Math.random() * selectedRestaurants.length
  );

  ladderRungs = createRungs(
    selectedRestaurants.length
  );

  createBoard(selectedRestaurants.length);

  const cover = document.querySelector(
    "#ladder-cover"
  );

  if (cover) {
    cover.classList.add("is-hidden");
  }

  const resultLabels = document.querySelectorAll(
    ".ladder-result-label"
  );

  resultLabels.forEach((label, index) => {
    label.textContent =
      index === winnerIndex ? "당첨" : "꽝";
  });

  if (ladderResult) {
    ladderResult.textContent =
      "위의 후보 중 하나를 눌러 결과를 확인해 보세요.";
  }

  if (ladderShareButton) {
    ladderShareButton.hidden = true;
  }
}

function playLadder(startIndex) {
  if (!ladderStarted) {
    return;
  }

  const pathData = getPathData(startIndex);

  const selectedButton = document.querySelector(
    `[data-start-index="${startIndex}"]`
  );

  const resultLabel = document.querySelector(
    `[data-result-index="${pathData.destinationIndex}"]`
  );

  resetPathStyles();

  if (selectedButton) {
    selectedButton.classList.add("is-selected");
  }

  pathData.visitedColumns.forEach((column) => {
    const verticalLine = document.querySelector(
      `.ladder-vertical-line[data-column="${column}"]`
    );

    if (verticalLine) {
      verticalLine.classList.add("is-path");
    }
  });

  pathData.visitedRungs.forEach((rung) => {
    const rungElement = document.querySelector(
      `.ladder-rung[data-row="${rung.row}"][data-column="${rung.column}"]`
    );

    if (rungElement) {
      rungElement.classList.add("is-path");
    }
  });

  if (resultLabel) {
    resultLabel.classList.add("is-winner");
  }

  const winnerRestaurant =
    selectedRestaurants[winnerIndex];

  const isWinner =
    pathData.destinationIndex === winnerIndex;

  if (ladderResult) {
    ladderResult.textContent = isWinner
      ? `축하해요! 오늘의 식당은 ${winnerRestaurant}입니다.`
      : "아쉽지만 꽝이에요. 다른 후보도 눌러보세요.";
  }

  if (ladderShareButton) {
    ladderShareButton.hidden = false;

    ladderShareButton.dataset.result = isWinner
      ? `오늘의 식당은 ${winnerRestaurant}입니다!`
      : "오늘의 메뉴 사다리타기를 해봤어요!";
  }
}

function addCandidate() {
  const restaurant = window.prompt(
    "추가할 식당 이름을 입력하세요."
  );

  if (!restaurant || restaurant.trim() === "") {
    return;
  }

  const currentRestaurants = Array.from(
    ladderCandidateList.querySelectorAll(
      "input[type='checkbox']"
    )
  ).map((checkbox) => checkbox.value);

  currentRestaurants.push(restaurant.trim());

  renderCandidateList(currentRestaurants);
  resetLadderState();

  if (ladderResult) {
    ladderResult.textContent =
      "후보가 추가됐어요. 원하는 후보를 선택한 뒤 사다리 시작을 눌러 주세요.";
  }
}

async function shareResult() {
  if (!ladderShareButton) {
    return;
  }

  const shareText =
    ladderShareButton.dataset.result ||
    "오늘의 메뉴 사다리타기를 해봤어요!";

  try {
    if (navigator.share) {
      await navigator.share({
        title: "오늘은 뭐 먹지",
        text: shareText,
      });

      return;
    }

    await navigator.clipboard.writeText(shareText);

    ladderShareButton.textContent = "결과 복사 완료";

    setTimeout(() => {
      ladderShareButton.textContent = "결과 공유하기";
    }, 1800);
  } catch (error) {
    console.log(
      "공유가 취소되었거나 복사에 실패했습니다.",
      error
    );
  }
}

if (ladderStartButton) {
  ladderStartButton.addEventListener(
    "click",
    startLadder
  );
}

if (ladderAddButton) {
  ladderAddButton.addEventListener(
    "click",
    addCandidate
  );
}

if (ladderResetButton) {
  ladderResetButton.addEventListener(
    "click",
    resetLadderState
  );
}

if (ladderShareButton) {
  ladderShareButton.addEventListener(
    "click",
    shareResult
  );
}

renderCandidateList(defaultRestaurants);
resetLadderState();