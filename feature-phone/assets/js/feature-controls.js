/* =========================
 * Feature phone (Jio Bharat) controls
 * ========================= */
(function () {
  const inputs = Array.from(document.querySelectorAll(".sudoku-container input"));
  let currentIndex = -1;
  let lastBackspaceTime = 0;
  const DOUBLE_PRESS_DELAY = 500; // ms

  // Focus first non-disabled cell
  function focusFirstEditable() {
    const firstEditable = inputs.find(inp => !inp.classList.contains("disabled"));
    if (firstEditable) {
      firstEditable.focus();
      currentIndex = inputs.indexOf(firstEditable);
    }
  }

  // Move focus by direction
  function moveFocus(dx, dy) {
    if (currentIndex === -1) return;
    const current = inputs[currentIndex];
    const row = current.row;
    const col = current.col;
    const nr = Math.max(0, Math.min(8, row + dy));
    const nc = Math.max(0, Math.min(8, col + dx));
    const next = document.querySelector(`.sudoku-container input[row="${nr}"][col="${nc}"]`);
    if (next) {
      next.focus();
      currentIndex = inputs.indexOf(next);
    }
  }

  document.addEventListener("keydown", function (e) {
    const key = e.key;
    const active = document.activeElement;

    switch (key) {
      // Navigation: Arrow or Keypad 2/4/6/8
      case "ArrowUp":
        moveFocus(0, -1);
        break;
      case "ArrowDown":
        moveFocus(0, 1);
        break;
      case "ArrowLeft":
        moveFocus(-1, 0);
        break;
      case "ArrowRight":
        moveFocus(1, 0);
        break;

      // Enter → Validate Sudoku
      case "Enter":
        const valid = game.validate();
        break;

      // SoftLeft → solve
      case "SoftLeft":
        game.solve();
        break;

      // SoftRight → New Game
      case "SoftRight":
        game.newGame();
        setTimeout(focusFirstEditable, 50);
        showToast("New Game Started 🔄");
        break;

      // Clear cell
      case "Backspace":
        const now = Date.now();
        if (now - lastBackspaceTime < DOUBLE_PRESS_DELAY) {
          // double press → exit game
          showToast("Exiting game...");
          console.log("Exit app"); // replace with real exit logic
          lastBackspaceTime = 0;
        } else {
          e.preventDefault();
          if (active && !active.classList.contains("disabled")) {
            active.value = "";
            active.dispatchEvent(new Event("input"));
          }
          lastBackspaceTime = now;
        }
        break;

      // Number input
      default:
        if (/^[1-9]$/.test(key) && active && !active.classList.contains("disabled")) {
          active.value = key;
          active.dispatchEvent(new Event("input"));
          moveFocus(1, 0);
        }
        break;
    }
  });

  window.addEventListener("load", () => {
  // Delay focus to wait for KaiOS DOM readiness
  setTimeout(() => {
    const firstEditable = document.querySelector(".sudoku-container input:not(.disabled)");
    if (firstEditable) {
      firstEditable.focus();
    } else {
      // retry once more if DOM not ready
      setTimeout(() => {
        const retry = document.querySelector(".sudoku-container input:not(.disabled)");
        if (retry) retry.focus();
      }, 400);
    }
  }, 300);
});
})();
