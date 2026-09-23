(() => {
  const form = document.querySelector("#beta-register-form");
  const modalElement = document.querySelector("#beta-register-modal");

  if (!form || !modalElement || typeof bootstrap === "undefined") {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    bootstrap.Modal.getOrCreateInstance(modalElement).hide();
    form.reset();
    form.classList.remove("was-validated");
  });
})();
