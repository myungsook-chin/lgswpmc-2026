// Mobile nav toggle
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".nav-menu");

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("open");
    });
  }

  // highlight active nav link
  const current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-menu a").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === current) {
      link.classList.add("active");
    }
  });

  // reveal-line 순차 등장 애니메이션:
  // CSS 애니메이션과 transform이 지원되는 환경에서만 활성화.
  // 미지원 환경(IE, GPU 없는 VDI 등)에서는 opacity:1 기본값으로 텍스트가 항상 보임.
  // prefers-reduced-motion은 CSS @media에서만 처리 (transform 제거, opacity 페이드는 유지).
  const supportsAnimation =
    typeof document.documentElement.style.animationName !== "undefined" &&
    typeof document.documentElement.style.transform !== "undefined";

  if (supportsAnimation && document.querySelector(".reveal-line")) {
    document.documentElement.classList.add("js-reveal-ready");
  }
});
