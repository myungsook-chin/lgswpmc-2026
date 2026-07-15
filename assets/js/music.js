// 홈페이지 배경음악 재생 버튼
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const audio = document.getElementById("bgMusic");
    const btn = document.getElementById("musicToggle");
    if (!audio || !btn) return;

    const label = btn.querySelector(".music-toggle-label");
    const playText = label ? label.textContent : "";

    function setPlayingUI() {
      btn.classList.add("playing");
      if (label) label.textContent = playText.includes("재생") ? "일시정지" : "Pause";
    }

    function setPausedUI() {
      btn.classList.remove("playing");
      if (label) label.textContent = playText;
    }

    btn.addEventListener("click", () => {
      if (audio.paused) {
        audio.play().then(setPlayingUI).catch(() => {});
      } else {
        audio.pause();
        setPausedUI();
      }
    });

    audio.addEventListener("ended", setPausedUI);
  });
})();
