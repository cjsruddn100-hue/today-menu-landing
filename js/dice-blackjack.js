const diceRollButton = document.querySelector(
  "#dice-roll-button"
);

const diceFinishButton = document.querySelector(
  "#dice-finish-button"
);

const diceShareButton = document.querySelector(
  "#dice-share-button"
);

const diceResetButton = document.querySelector(
  "#dice-reset-button"
);

const dicePlayerCard = document.querySelector(
  "#dice-player-card"
);

const dicePlayerStatus = document.querySelector(
  "#dice-player-status"
);

const diceRollList = document.querySelector(
  "#dice-roll-list"
);

const diceScore = document.querySelector(
  "#dice-score"
);

const diceResultCard = document.querySelector(
  "#dice-result-card"
);

const diceResultTitle = document.querySelector(
  "#dice-result-title"
);

const diceResultDescription = document.querySelector(
  "#dice-result-description"
);

const diceGameMessage = document.querySelector(
  "#dice-game-message"
);

let currentScore = 0;
let diceRolls = [];
let gameFinished = false;

function getRandomDiceNumber() {
  return Math.floor(Math.random() * 6) + 1;
}

function renderDiceRolls() {
  diceRollList.innerHTML = "";

  if (diceRolls.length === 0) {
    const emptyText = document.createElement("span");

    emptyText.className = "dice-roll-empty";
    emptyText.textContent =
      "아직 굴린 주사위가 없어요.";

    diceRollList.append(emptyText);

    return;
  }

  diceRolls.forEach((roll) => {
    const dice = document.createElement("span");

    dice.className = "dice-roll";
    dice.textContent = roll;

    diceRollList.append(dice);
  });
}

function updateScore() {
  diceScore.textContent = currentScore;
}

function setControlsDisabled(disabled) {
  diceRollButton.disabled = disabled;
  diceFinishButton.disabled = disabled;
}

function showResult(title, description, type) {
  diceResultTitle.textContent = title;
  diceResultDescription.textContent = description;

  diceResultCard.classList.remove(
    "is-success",
    "is-bust"
  );

  if (type === "success") {
    diceResultCard.classList.add("is-success");
  }

  if (type === "bust") {
    diceResultCard.classList.add("is-bust");
  }
}

function finishGame(type) {
  gameFinished = true;

  dicePlayerCard.classList.remove(
    "is-active",
    "is-bust",
    "is-finished"
  );

  setControlsDisabled(true);

  diceShareButton.hidden = false;

  if (type === "bust") {
    dicePlayerCard.classList.add("is-bust");

    dicePlayerStatus.textContent =
      "18을 넘었습니다. 이번 도전은 버스트입니다.";

    showResult(
      "버스트!",
      `${currentScore}점으로 18을 넘겼어요. 다시 도전해 보세요.`,
      "bust"
    );

    diceGameMessage.textContent =
      "결과 화면을 캡처해 동료에게 공유하세요!";

    diceShareButton.dataset.result =
      `오늘은 뭐 먹지 주사위 블랙잭 결과: ${currentScore}점으로 버스트했습니다.`;

    return;
  }

  dicePlayerCard.classList.add("is-finished");

  dicePlayerStatus.textContent =
    `${currentScore}점에서 결과를 확정했습니다.`;

  showResult(
    `${currentScore}점 기록!`,
    `18을 넘지 않고 ${currentScore}점을 만들었습니다. 동료와 결과를 공유해 보세요.`,
    "success"
  );

  diceGameMessage.textContent =
    "결과 화면을 캡처해 동료에게 공유하세요!";

  diceShareButton.dataset.result =
    `오늘은 뭐 먹지 주사위 블랙잭 결과: ${currentScore}점 기록!`;
}

function rollDice() {
  if (gameFinished) {
    return;
  }

  const diceNumber = getRandomDiceNumber();

  diceRolls.push(diceNumber);
  currentScore += diceNumber;

  renderDiceRolls();
  updateScore();

  dicePlayerStatus.textContent =
    `${diceNumber}이(가) 나왔습니다. 현재 ${currentScore}점입니다.`;

  diceGameMessage.textContent =
    "한 번 더 굴릴지, 지금 결과를 확정할지 선택하세요.";

  if (currentScore > 18) {
    finishGame("bust");
  }
}

function resetDiceGame() {
  currentScore = 0;
  diceRolls = [];
  gameFinished = false;

  dicePlayerCard.classList.remove(
    "is-bust",
    "is-finished"
  );

  dicePlayerCard.classList.add("is-active");

  dicePlayerStatus.textContent =
    "원하는 만큼 주사위를 굴려 보세요.";

  diceGameMessage.textContent =
    "주사위를 굴려 18에 가장 가까운 점수에 도전해 보세요.";

  diceShareButton.hidden = true;
  diceShareButton.dataset.result = "";
  diceShareButton.textContent = "결과 공유하기";

  renderDiceRolls();
  updateScore();

  showResult(
    "아직 결과를 기다리고 있어요",
    "18을 넘지 않는 범위에서 원하는 점수를 만든 뒤 결과를 확정해 보세요.",
    "waiting"
  );

  setControlsDisabled(false);
}

async function shareDiceResult() {
  const shareText =
    diceShareButton.dataset.result ||
    "오늘은 뭐 먹지 주사위 블랙잭 결과를 확인해 보세요!";

  try {
    if (navigator.share) {
      await navigator.share({
        title: "오늘은 뭐 먹지 | 주사위 블랙잭",
        text: shareText,
      });

      return;
    }

    await navigator.clipboard.writeText(shareText);

    diceShareButton.textContent = "결과 복사 완료";

    setTimeout(() => {
      diceShareButton.textContent = "결과 공유하기";
    }, 1800);
  } catch (error) {
    console.log(
      "공유가 취소되었거나 복사에 실패했습니다.",
      error
    );
  }
}

if (diceRollButton) {
  diceRollButton.addEventListener(
    "click",
    rollDice
  );
}

if (diceFinishButton) {
  diceFinishButton.addEventListener(
    "click",
    () => finishGame("success")
  );
}

if (diceResetButton) {
  diceResetButton.addEventListener(
    "click",
    resetDiceGame
  );
}

if (diceShareButton) {
  diceShareButton.addEventListener(
    "click",
    shareDiceResult
  );
}

if (diceRollButton) {
  resetDiceGame();
}