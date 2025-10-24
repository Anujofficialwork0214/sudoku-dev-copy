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
      game.solve();
    }
  };

  cancel.onclick = function () {
    popup.style.display = "none";
  };

  popup.onclick = function (e) {
    if (e.target === popup) popup.style.display = "none";
  };
}

let popupTimeout;

function showPopupMessage(message ="invalid message") {
  const popup = document.getElementById("popup-message");
  popup.innerHTML = message;
  popup.style.color = "red";

  // Show message
  popup.classList.add("show");

  // Clear previous timeout if multiple triggers happen
  clearTimeout(popupTimeout);

  // Hide again after 3 seconds
  popupTimeout = setTimeout(() => {
    popup.classList.remove("show");
  }, 3000);
}