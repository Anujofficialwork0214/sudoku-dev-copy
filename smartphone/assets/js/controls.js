function showSolvePopup() {
  const popup = document.getElementById("solvePopup");
  popup.style.display = "flex";

  const confirm = document.getElementById("confirmSolve");
  const cancel = document.getElementById("cancelSolve");

  // Prevent duplicate event bindings
  confirm.onclick = cancel.onclick = null;

  confirm.onclick = function () {
    popup.style.display = "none";
    if (typeof game.solve === "function") {
      game.solveDirectly();
    }
  };

  cancel.onclick = function () {
    popup.style.display = "none";
  };

  popup.onclick = function (e) {
    if (e.target === popup) popup.style.display = "none";
  };
}