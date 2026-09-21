const ladderMenuInput = document.querySelector(
  "#ladder-menu-input"
);

const ladderCreateButton = document.querySelector(
  "#ladder-create-button"
);

const ladderStartButton = document.querySelector(
  "#ladder-start-button"
);

const ladderResetButton = document.querySelector(
  "#ladder-reset-button"
);

const ladderAddButton = document.querySelector(
  "#ladder-add-button"
);

const ladderBoard = document.querySelector(
  "#ladder-board"
);

const ladderResult = document.querySelector(
  "#ladder-game-result"
);

const ladderCandidateList = document.querySelector(
  "#ladder-candidate-list"
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

function getInputRestaurants() {
  return ladderMenuInput.value
    .split(",")
    .map((restaurant) => restaurant.trim())
    .filter((restaurant) => restaurant !== "");
}

function renderCandidateList(restaurants) {
  ladderCandidateList.innerHTML = "";

  restaurants.forEach((restaurant, index) => {
    const listItem = document.createElement("li");

    listItem.innerHTML = `
      <label>
        <input
          type="checkbox"
          value="${restaurant}"
          data-candidate-index="${index}"
          checked
        />
        <span>${restaurant}</span>
      </label>
    `;

    ladderCandidateList.append(listItem);
  });
}

function getCheckedRestaurants() {
  return Array.from(
    ladderCandidateList.querySelectorAll(
      "input[type='checkbox']:checked"
    )
  ).map((checkbox) => checkbox.value);
}

function createRungs(count) {
  const rungs = [];
  const rowCount = 7;

  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < count - 1; column += 1) {
      const canCreate =
        Math.random() > 0.52 &&
        !rungs.some(
          (rung) =>
            rung.row === row &&
            rung.column === column - 1
        );

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

function getDestinationIndex(startIndex) {
  let currentColumn = startIndex;

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
      currentColumn += 1;
    } else if (leftRung) {
      currentColumn -= 1;
    }
  }

  return currentColumn;
}

function createBoard(count) {
  ladderBoard.innerHTML = "";
  ladderBoard.style.setProperty(
    "--ladder-count",
    count
  );

  const startRow = document.createElement("div");
  startRow.className = "ladder-start-row";

  selectedRestaurants.forEach((restaurant, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "ladder-start-button";
    button.textContent = restaurant;
    button.dataset.startIndex = index;

    button.addEventListener("click", () => {
      if (!ladderStarted) {
        ladderResult.textContent =
          "먼저 사다리 시작 버튼을 눌러 주세요.";
        return;
      }

      playLadder(index);
    });

    startRow.append(button);
  });

  ladderBoard.append(startRow);

  const lines = document.createElement("div");
  lines.className = "ladder-lines";

  selectedRestaurants.forEach((_, index) => {
    const verticalLine = document.createElement("i");

    verticalLine.className = "ladder-vertical-line";
    verticalLine.dataset.column = index;
    verticalLine.style.left =
      `${(index / (count - 1)) * 100}%`;

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

    rungElement.style.top =
      `${((rung.row + 1) / 8) * 100}%`;

    rungElement.style.left =
      `${leftPercent}%`;

    rungElement.style.width =
      `${widthPercent}%`;

    lines.append(rungElement);
  });

  const cover = document.createElement("div");
  cover.className = "ladder-cover";
  cover.id = "ladder-cover";
  cover.innerHTML =
    "사다리 시작 전<br />결과를 가리고 있어요";

  lines.append(cover);
  ladderBoard.append(lines);

  const resultRow = document.createElement("div");
  resultRow.className = "ladder-result-row";

  selectedRestaurants.forEach((restaurant, index) => {
    const resultLabel = document.createElement("span");

    resultLabel.className = "ladder-result-label";
    resultLabel.textContent = "꽝";
    resultLabel.dataset.resultIndex = index;

    resultRow.append(resultLabel);
  });

  ladderBoard.append(resultRow);
}

function resetLadderState() {
  ladderStarted = false;
  winnerIndex = null;
  ladderRungs = [];

  ladderResult.textContent =
    "오른쪽 후보를 선택한 뒤 사다리 시작 버튼을 눌러 주세요.";

  ladderBoard.innerHTML = `
    <p class="ladder-board-guide">
      오른쪽 후보를 선택한 뒤 사다리 시작 버튼을 눌러 주세요.
    </p>
  `;
}

function buildLadder() {
  selectedRestaurants = getCheckedRestaurants();

  if (selectedRestaurants.length < 2) {
    ladderResult.textContent =
      "후보를 두 개 이상 선택해 주세요.";
    return;
  }

  ladderStarted = false;
  winnerIndex = Math.floor(
    Math.random() * selectedRestaurants.length
  );

  ladderRungs = createRungs(
    selectedRestaurants.length
  );

  createBoard(selectedRestaurants.length);

  ladderResult.textContent =
    "아직 결과가 가려져 있어요. 사다리를 시작해 보세요.";
}

function startLadder() {
  if (selectedRestaurants.length < 2) {
    ladderResult.textContent =
      "먼저 후보를 두 개 이상 선택해 주세요.";
    return;
  }

  ladderStarted = true;

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

  ladderResult.textContent =
    "위의 후보 중 하나를 클릭해 결과를 확인해 보세요.";
}

function playLadder(startIndex) {
  const destinationIndex =
    getDestinationIndex(startIndex);

  const startButton = document.querySelector(
    `[data-start-index="${startIndex}"]`
  );

  const resultLabel = document.querySelector(
    `[data-result-index="${destinationIndex}"]`
  );

  document
    .querySelectorAll(".is-selected, .is-path, .is-winner")
    .forEach((element) => {
      element.classList.remove(
        "is-selected",
        "is-path",
        "is-winner"
      );
    });

  startButton.classList.add("is-selected");
  resultLabel.classList.add("is-winner");

  const verticalLines = document.querySelectorAll(
    ".ladder-vertical-line"
  );

  verticalLines[destinationIndex].classList.add(
    "is-path"
  );

  const destinationRestaurant =
    selectedRestaurants[destinationIndex];

  const resultText =
    destinationIndex === winnerIndex
      ? `축하해요! ${destinationRestaurant}이(가) 당첨됐어요!`
      : `아쉽지만 ${destinationRestaurant}은(는) 꽝이에요.`;

  ladderResult.textContent = resultText;
}

function loadCandidatesFromInput() {
  const restaurants = getInputRestaurants();

  if (restaurants.length < 2) {
    ladderResult.textContent =
      "식당 후보를 두 개 이상 입력해 주세요.";
    return;
  }

  renderCandidateList(restaurants);
  resetLadderState();

  ladderResult.textContent =
    "후보를 선택한 뒤 사다리를 만들어 보세요.";
}

function addCandidate() {
  const restaurant = window.prompt(
    "추가할 식당 이름을 입력하세요."
  );

  if (!restaurant || restaurant.trim() === "") {
    return;
  }

  const restaurants = getInputRestaurants();

  restaurants.push(restaurant.trim());

  ladderMenuInput.value =
    restaurants.join(", ");

  renderCandidateList(restaurants);
  resetLadderState();
}

ladderCreateButton.addEventListener(
  "click",
  loadCandidatesFromInput
);

ladderStartButton.addEventListener(
  "click",
  startLadder
);

ladderResetButton.addEventListener(
  "click",
  resetLadderState
);

ladderAddButton.addEventListener(
  "click",
  addCandidate
);

renderCandidateList(defaultRestaurants);