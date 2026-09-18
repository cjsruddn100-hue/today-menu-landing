const previewButtons = document.querySelectorAll(
  ".update-preview-button"
);

const previewPanel = document.querySelector(
  "#update-preview"
);

const previewDetails = document.querySelectorAll(
  ".update-preview-detail"
);

previewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedPreview = button.dataset.preview;

    previewDetails.forEach((detail) => {
      const detailPreview = detail.dataset.previewContent;

      detail.classList.toggle(
        "is-active",
        detailPreview === selectedPreview
      );
    });

    previewPanel.classList.add("is-open");
    previewPanel.setAttribute("aria-hidden", "false");

    previewPanel.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
});