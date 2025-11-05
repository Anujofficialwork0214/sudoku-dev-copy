const difficultyOrder = ["easy", "medium", "hard", "pro", "expert"];
let currentDifficultyIndex =
  Number(sessionStorage.getItem("currentDifficultyIndex")) || 0;
// console.log("Loaded difficulty index from storage:", currentDifficultyIndex);
(function (global) {
  "use strict";

  /* =========================
   * Utilities
   * ========================= */
  var util = {
    extend: function (src, props) {
      props = props || {};
      var p;
      for (p in src) {
        if (!props.hasOwnProperty(p)) {
          props[p] = src[p];
        }
      }
      return props;
    },
    each: function (a, b, c) {
      if ("[object Object]" === Object.prototype.toString.call(a)) {
        for (var d in a) {
          if (Object.prototype.hasOwnProperty.call(a, d)) {
            b.call(c, d, a[d], a);
          }
        }
      } else {
        for (var e = 0, f = a.length; e < f; e++) {
          b.call(c, e, a[e], a);
        }
      }
    },
    isDigit1to9: function (ch) {
      return /^[1-9]$/.test(ch);
    },
    includes: function (a, b) {
      return a.indexOf(b) > -1;
    },
  };

  /* =========================
   * Config
   * ========================= */
  var defaultConfig = {
    validate_on_insert: true,
    difficulty: difficultyOrder[currentDifficultyIndex], // easy, medium, hard, pro, expert
  };

  /* =========================
   * Game engine
   * ========================= */
  function Game(config) {
    this.config = config;

    this.cellMatrix = {};
    this.matrix = {};
    this.validation = {};
    this.values = [];
    this.mistakeCount = 0;
    this.isSolvedDirectly = false;

    this.resetValidationMatrices();
    return this;
  }

  Game.prototype = {
    /** Build responsive GUI table */
    buildGUI: function () {
      var td, tr;

      this.table = document.createElement("table");
      // Give both classes so existing CSS works and borders render nicely
      this.table.classList.add("sudoku-container", "sudoku-grid");
      this.table.setAttribute("role", "grid");
      this.table.setAttribute("aria-label", "Sudoku grid");

      for (var i = 0; i < 9; i++) {
        tr = document.createElement("tr");
        tr.setAttribute("role", "row");
        this.cellMatrix[i] = {};

        for (var j = 0; j < 9; j++) {
          // cell wrapper
          td = document.createElement("td");
          td.setAttribute("role", "gridcell");

          // input
          var inp = document.createElement("input");
          this.cellMatrix[i][j] = inp;

          // Mobile-friendly numeric keypad + accessibility
          inp.type = "text";
          inp.readOnly = true;
          inp.inputMode = "numeric";
          inp.autocomplete = "off";
          inp.autocorrect = "off";
          inp.spellcheck = false;
          inp.pattern = "[1-9]*";
          inp.maxLength = 1;
          inp.setAttribute(
            "aria-label",
            "Row " + (i + 1) + " Column " + (j + 1)
          );

          // Custom props for quick access
          inp.row = i;
          inp.col = j;

          // Filter inputs before they land in the field
          inp.addEventListener("beforeinput", this.onBeforeInput.bind(this));
          // Handle value commit + validation
          inp.addEventListener("input", this.onInput.bind(this));
          // Arrow/WASD navigation
          inp.addEventListener("keydown", this.onKeyNav.bind(this));

          // 3x3 section zebra (optional)
          var sectIDi = Math.floor(i / 3);
          var sectIDj = Math.floor(j / 3);
          if ((sectIDi + sectIDj) % 2 === 0) {
            td.classList.add("sudoku-section-one");
          } else {
            td.classList.add("sudoku-section-two");
          }

          td.appendChild(inp);
          tr.appendChild(td);
        }

        this.table.appendChild(tr);
      }

      // Prevent text selection on fixed cells
      this.table.addEventListener("mousedown", this.onMouseDown.bind(this));

      return this.table;
    },

    onBeforeInput: function (e) {
      // Allow deletion
      if (e.inputType && e.inputType.startsWith("delete")) return;

      // Only allow digits 1-9
      var data = e.data || "";
      if (!util.isDigit1to9(data)) {
        e.preventDefault();
      }
    },

    onInput: function (e) {
      var input = e.currentTarget;
      var val = (input.value || "").trim();
      var row = input.row;
      var col = input.col;

      // Normalize: keep only one allowed char
      if (!util.isDigit1to9(val)) {
        input.value = "";
        val = "";
      } else {
        input.value = val; // ensure one char
      }

      // Reset board-level state
      this.table.classList.remove("valid-matrix");
      input.classList.remove("invalid");

      // Update caches
      var sectRow = Math.floor(row / 3);
      var sectCol = Math.floor(col / 3);
      var secIndex = (row % 3) * 3 + (col % 3);
      var oldVal = this.matrix.row[row][col];

      this.matrix.row[row][col] = val;
      this.matrix.col[col][row] = val;
      this.matrix.sect[sectRow][sectCol][secIndex] = val;

      if (this.config.validate_on_insert) {
        var ok = this.validateNumber(val, row, col, oldVal);
        input.classList.toggle("invalid", !ok);
        if (!ok && !this.isSolvedDirectly) {
          this.mistakeCount += 1;
          updateMistakeCounter(this.mistakeCount);
          if (this.mistakeCount >= 5) {
            gameOver();
          }
        }
      }
      if (this.isSolvedDirectly) {
        showPopupMessage(
          "You are editing already solved sudoku. Click on New Game to start new game"
        );
        return;
      }

      // Check for game completion on input
      if (this.validateMatrix()) {
        var allFilled = true;
        var inputs = this.table.getElementsByTagName("input");
        for (var i = 0; i < inputs.length; i++) {
          if (
            inputs[i].value === "" ||
            inputs[i].classList.contains("invalid")
          ) {
            allFilled = false;
            break;
          }
        }

        if (allFilled) {
          const gameWonPopup = document.getElementById("gameWon");
          const restartGameWon = document.getElementById("restartGameWon");
          const gameWonSubmessage =
            document.getElementById("gameWonSubmessage");
          if (gameWonPopup) {
            // Move to next difficulty for next round
            if (currentDifficultyIndex == difficultyOrder.length - 1) {
              gameWonSubmessage.innerText =
                "Amazing! You are on the highest difficulty level!";
              restartGameWon.innerText = "Restart Expert Game";
            }
            if (currentDifficultyIndex < difficultyOrder.length - 1) {
              currentDifficultyIndex++;
            }
            game.game.config.difficulty =
              difficultyOrder[currentDifficultyIndex];
            sessionStorage.setItem(
              "currentDifficultyIndex",
              currentDifficultyIndex
            );

            gameWonPopup.style.display = "flex";
            postScore(0);
            if ( isAdReady ) {
              showJioGameAd("showAd");
            }
          }
        }
      }
    },

    onKeyNav: function (e) {
      var key = e.key.toLowerCase();
      var r = e.currentTarget.row;
      var c = e.currentTarget.col;

      var move = null;
      if (key === "arrowup" || key === "w") move = [-1, 0];
      if (key === "arrowdown" || key === "s") move = [1, 0];
      if (key === "arrowleft" || key === "a") move = [0, -1];
      if (key === "arrowright" || key === "d") move = [0, 1];

      if (move) {
        e.preventDefault();
        var nr = Math.max(0, Math.min(8, r + move[0]));
        var nc = Math.max(0, Math.min(8, c + move[1]));
        this.cellMatrix[nr][nc].focus();
        this.cellMatrix[nr][nc].select();
      }
    },

    onMouseDown: function (e) {
      var t = e.target;
      if (t.nodeName === "INPUT" && t.classList.contains("disabled")) {
        e.preventDefault();
      }
    },

    resetGame: function () {
      this.mistakeCount = 0;
      updateMistakeCounter(this.mistakeCount);
      this.resetValidationMatrices();
      for (var row = 0; row < 9; row++) {
        for (var col = 0; col < 9; col++) {
          this.cellMatrix[row][col].value = "";
          this.cellMatrix[row][col].classList.remove("invalid", "disabled");
          this.cellMatrix[row][col].tabIndex = 1;
        }
      }
      this.table.classList.remove("valid-matrix");
    },

    resetValidationMatrices: function () {
      this.matrix = { row: {}, col: {}, sect: {} };
      this.validation = { row: {}, col: {}, sect: {} };

      for (var i = 0; i < 9; i++) {
        this.matrix.row[i] = ["", "", "", "", "", "", "", "", ""];
        this.matrix.col[i] = ["", "", "", "", "", "", "", "", ""];
        this.validation.row[i] = [];
        this.validation.col[i] = [];
      }

      for (var r = 0; r < 3; r++) {
        this.matrix.sect[r] = [];
        this.validation.sect[r] = {};
        for (var c = 0; c < 3; c++) {
          this.matrix.sect[r][c] = ["", "", "", "", "", "", "", "", ""];
          this.validation.sect[r][c] = [];
        }
      }
    },

    validateNumber: function (num, rowID, colID, oldNum) {
      var isValid = true,
        sectRow = Math.floor(rowID / 3),
        sectCol = Math.floor(colID / 3),
        row = this.validation.row[rowID],
        col = this.validation.col[colID],
        sect = this.validation.sect[sectRow][sectCol];

      oldNum = oldNum || "";
      if (oldNum !== "") {
        if (util.includes(row, oldNum)) row.splice(row.indexOf(oldNum), 1);
        if (util.includes(col, oldNum)) col.splice(col.indexOf(oldNum), 1);
        if (util.includes(sect, oldNum)) sect.splice(sect.indexOf(oldNum), 1);
      }

      if (num !== "") {
        if (
          util.includes(row, num) ||
          util.includes(col, num) ||
          util.includes(sect, num)
        ) {
          isValid = false;
        } else {
          isValid = true;
        }
        row.push(num);
        col.push(num);
        sect.push(num);
      }

      return isValid;
    },

    validateMatrix: function () {
      var isValid,
        val,
        hasError = false;

      for (var row = 0; row < 9; row++) {
        for (var col = 0; col < 9; col++) {
          val = this.matrix.row[row][col];
          if (val !== "") {
            isValid = this.validateNumber(val, row, col, val);
            this.cellMatrix[row][col].classList.toggle("invalid", !isValid);
          }
          if (!isValid) hasError = true;
        }
      }
      return !hasError;
    },

    /** Backtracking solver */
    solveGame: function (row, col, string) {
      var nextSquare = this.findClosestEmptySquare(row, col);
      if (!nextSquare) {
        return true; // solved
      }

      var sqRow = nextSquare.row;
      var sqCol = nextSquare.col;
      var legalValues = this.findLegalValuesForSquare(sqRow, sqCol);

      var sectRow = Math.floor(sqRow / 3);
      var sectCol = Math.floor(sqCol / 3);
      var secIndex = (sqRow % 3) * 3 + (sqCol % 3);

      for (var i = 0; i < legalValues.length; i++) {
        var cval = String(legalValues[i]);
        nextSquare.value = string ? "" : cval;

        this.matrix.row[sqRow][sqCol] = cval;
        this.matrix.col[sqCol][sqRow] = cval;
        this.matrix.sect[sectRow][sectCol][secIndex] = cval;

        if (this.solveGame(sqRow, sqCol, string)) {
          return true;
        } else {
          this.cellMatrix[sqRow][sqCol].value = "";
          this.matrix.row[sqRow][sqCol] = "";
          this.matrix.col[sqCol][sqRow] = "";
          this.matrix.sect[sectRow][sectCol][secIndex] = "";
        }
      }
      return false;
    },

    findClosestEmptySquare: function (row, col) {
      for (var i = col + 9 * row; i < 81; i++) {
        var walkingRow = Math.floor(i / 9);
        var walkingCol = i % 9;
        if (this.matrix.row[walkingRow][walkingCol] === "") {
          return this.cellMatrix[walkingRow][walkingCol];
        }
      }
    },

    findLegalValuesForSquare: function (row, col) {
      var legalNums = [1, 2, 3, 4, 5, 6, 7, 8, 9];

      // remove used in column
      for (var i = 0; i < 9; i++) {
        var v = Number(this.matrix.col[col][i]);
        if (v > 0) {
          var idx = legalNums.indexOf(v);
          if (idx !== -1) legalNums.splice(idx, 1);
        }
      }

      // remove used in row
      for (i = 0; i < 9; i++) {
        v = Number(this.matrix.row[row][i]);
        if (v > 0) {
          idx = legalNums.indexOf(v);
          if (idx !== -1) legalNums.splice(idx, 1);
        }
      }

      // remove used in section
      var sectRow = Math.floor(row / 3);
      var sectCol = Math.floor(col / 3);
      for (i = 0; i < 9; i++) {
        v = Number(this.matrix.sect[sectRow][sectCol][i]);
        if (v > 0) {
          idx = legalNums.indexOf(v);
          if (idx !== -1) legalNums.splice(idx, 1);
        }
      }

      // shuffle for varied puzzles
      for (i = legalNums.length - 1; i > 0; i--) {
        var rand = getRandomInt(0, i);
        var tmp = legalNums[i];
        legalNums[i] = legalNums[rand];
        legalNums[rand] = tmp;
      }

      return legalNums;
    },
  };

  /* =========================
   * Helpers
   * ========================= */
  function getRandomInt(min, max) {
    // Inclusive range
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getUnique(array, count) {
    var tmp = array.slice(0); // fixed: copy correctly
    var ret = [];

    for (var i = 0; i < count && tmp.length > 0; i++) {
      var index = Math.floor(Math.random() * tmp.length);
      var removed = tmp.splice(index, 1);
      ret.push(removed[0]);
    }
    return ret;
  }

  function triggerEvent(el, type) {
    if ("createEvent" in document) {
      var e = document.createEvent("HTMLEvents");
      e.initEvent(type, false, true);
      el.dispatchEvent(e);
    } else {
      var e = document.createEventObject();
      e.eventType = type;
      el.fireEvent("on" + e.eventType, e);
    }
  }

  /* =========================
   * Public Sudoku wrapper
   * ========================= */
  var Sudoku = function (container, settings) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    this.game = new Game(util.extend(defaultConfig, settings));
    this.container.appendChild(this.getGameBoard());
  };

  Sudoku.prototype = {
    getGameBoard: function () {
      return this.game.buildGUI();
    },

    newGame: function () {
      var that = this;
      this.reset();
      setTimeout(function () {
        that.start();
      }, 20);
    },

    start: function () {
      updateDifficultyDisplay(difficultyOrder[currentDifficultyIndex]);
      var arr = [],
        x = 0,
        values,
        rows = this.game.matrix.row,
        inputs = this.game.table.getElementsByTagName("input"),
        difficulties = {
          easy: 70,
          medium: 60,
          hard: 50,
          pro: 40,
          expert: 30,
        };

      // Solve a blank board to get a full solution
      this.game.solveGame(0, 0);
      this.solvedMatrix = JSON.parse(JSON.stringify(this.game.matrix.row));

      util.each(rows, function (i, row) {
        util.each(row, function (r, val) {
          arr.push({ index: x, value: val });
          x++;
        });
      });

      // Choose givens based on difficulty
      const currentDifficulty = this.game.config.difficulty;
      values = getUnique(arr, difficulties[currentDifficulty]);

      // Reset, then fill givens
      this.reset();

      util.each(values, function (i, data) {
        var input = inputs[data.index];
        input.value = data.value;
        input.classList.add("disabled");
        input.tabIndex = -1;
        triggerEvent(input, "input"); // ensure matrices/validation update
      });
    },

    reset: function () {
      this.game.isSolvedDirectly = false;
      this.game.resetGame();
    },

    validate: function () {
      var ok = this.game.validateMatrix();
      this.game.table.classList.toggle("valid-matrix", ok);
      return ok;
    },

    solve: function () {
      if (isRVReady) {
        showJioGameAd("showAdRewarded", () => {
          // After ad completes, solve the Sudoku
          this.game.isSolvedDirectly = true;
          const rows = this.solvedMatrix;

          for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
              const input = this.game.cellMatrix[r][c];
              input.value = rows[r][c];
              input.classList.remove("invalid");
            }
          }
          this.game.table.classList.add("valid-matrix");
        });
      } else {
        console.log("Ad SDK not ready, solving directly");
        // If ad SDK not ready, solve directly
        this.game.isSolvedDirectly = true;
          const rows = this.solvedMatrix;

          for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
              const input = this.game.cellMatrix[r][c];
              input.value = rows[r][c];
              input.classList.remove("invalid");
            }
          }
          this.game.table.classList.add("valid-matrix");
      }
    },
  };

  global.Sudoku = Sudoku;
})(this);

/* =========================
 * Bootstrap
 * ========================= */
var game = new Sudoku(".container");
game.start();

/* =========================
 * UI interactions
 * ========================= */

let focusedCell = null;

// Cell selection
document.querySelectorAll(".sudoku-container input").forEach((cell) => {
  cell.addEventListener("click", function () {
    if (focusedCell) focusedCell.classList.remove("selected-cell");
    focusedCell = cell;
    focusedCell.classList.add("selected-cell");
  });
});

// Keypad numbers
document.querySelectorAll(".keypad-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    if (!focusedCell || focusedCell.classList.contains("disabled")) return;

    if (btn.id === "clear-btn") {
      focusedCell.value = "";
    } else {
      focusedCell.value = btn.dataset.num;
    }

    // Trigger input event for validation
    focusedCell.dispatchEvent(new Event("input", { bubbles: true }));
  });
});

document.getElementById("controls")?.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const { action } = button.dataset;
  if (!action) return;

  try {
    switch (action) {
      case "solve":
        if (!game?.game?.isSolvedDirectly) {
          showSolvePopup();
        } else {
          showPopupMessage("Already solved! Click 'New Game' to start again.");
        }
        break;

      case "newGame":
        if (typeof game.newGame === "function") {
          game.newGame();
          gameCacheAd();
        }
        break;

      default:
        if (typeof game[action] === "function") {
          game[action]();
        }
        break;
    }
  } catch (error) {
    console.error(`Error executing action "${action}":`, error);
    showPopupMessage("An unexpected error occurred. Please try again.");
  }
});


function gameOver() {
  const gameOverPopup = document.getElementById("gameOverPopUp");

  if (gameOverPopup) {
    gameOverPopup.style.display = "flex";
  }
}

// Restart Game button listener
document.getElementById("restartGame").addEventListener("click", function () {
  // Hide the game over popup
  const popup = document.getElementById("gameOverPopUp");
  if (popup) popup.style.display = "none";
  const gameWonPopup = document.getElementById("gameWon");
  if (gameWonPopup) gameWonPopup.style.display = "none";

  // Reset and start a new game
  gameCacheAd();
  game.reset();
  game.start();
});

document
  .getElementById("restartGameWon").addEventListener("click", function () {
    const gameWonPopup = document.getElementById("gameWon");
    if (gameWonPopup) gameWonPopup.style.display = "none";

    // Reset and start a new game
    gameCacheAd();
    game.reset();
    game.start();
  });

function updateMistakeCounter(count) {
  const span = document.getElementById("mistakeCount");
  if (span) {
    span.textContent = count;
  }
}

function updateDifficultyDisplay(currentDifficulty) {
  const display = document.getElementById("difficultyDisplay");
  display.textContent = `${
    currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)
  }`;
}

function showJioGameAd(name, callback) {
  if (!name || typeof name !== "string") {
    console.warn("Invalid ad function name provided.");
    return;
  }

  if (typeof window[name] === "function") {
    try {
      window[name](); // call the SDK function dynamically
      console.log(`${name} called successfully.`);

      // Hook callback to rewarded ad completion
      if (callback) {
        const originalOnEnd = window.onAdMediaEnd;
        window.onAdMediaEnd = function (adSpot, completed, rewardAmount) {
          if (completed) {
            callback(); // run the solve after ad is completed
          }
          // Call original handler if needed
          if (originalOnEnd) originalOnEnd(adSpot, completed, rewardAmount);
        };
      }
    } catch (error) {
      console.error(`Error calling ${name}:`, error);
    }
  } else {
    console.warn(`Function ${name} does not exist in the SDK.`);
  }
}
