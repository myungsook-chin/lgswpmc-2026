// 웹 페이지 In-place 편집 모드
// - 화면 우측 하단 "편집" 버튼으로 토글합니다.
// - 편집 모드에서는 본문 텍스트를 클릭해서 직접 수정할 수 있습니다.
// - "임시저장"은 이 브라우저(localStorage)에만 저장되어, 새로고침해도 유지됩니다.
// - "HTML 다운로드"로 수정된 페이지 파일을 받아 실제 파일을 교체 → git commit/push 하면
//   모든 방문자에게 반영되는 정식 배포가 됩니다. (GitHub Pages는 서버가 없어 실시간 전체 공유 저장은 지원하지 않습니다.)
(function () {
  const EDIT_PASSCODE = "pmpb2026"; // 간단한 오남용 방지용 암호 (진짜 보안 인증 아님)
  const STORAGE_PREFIX = "pmpb_edit_v1_";
  const storageKey = STORAGE_PREFIX + location.pathname.replace(/[^a-zA-Z0-9]/g, "_");

  let editMode = false;
  let toolbar, statusEl;

  function getContentRoot() {
    return document.getElementById("pageContent");
  }

  function restoreSavedContent() {
    const root = getContentRoot();
    if (!root) return;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      root.innerHTML = saved;
    }
  }

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function blockLinkNav(e) {
    if (editMode) {
      e.preventDefault();
    }
  }

  // 네이티브 prompt/alert/confirm 대신 사용하는 커스텀 모달
  function showModal({ title, message, showInput, confirmText, cancelText }) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "editor-modal-overlay";

      const box = document.createElement("div");
      box.className = "editor-modal-box";

      const h = document.createElement("h3");
      h.textContent = title;
      box.appendChild(h);

      if (message) {
        const p = document.createElement("p");
        p.textContent = message;
        box.appendChild(p);
      }

      let input;
      if (showInput) {
        input = document.createElement("input");
        input.type = "password";
        input.className = "editor-modal-input";
        box.appendChild(input);
      }

      const actions = document.createElement("div");
      actions.className = "editor-modal-actions";

      let cancelBtn;
      if (cancelText) {
        cancelBtn = document.createElement("button");
        cancelBtn.className = "editor-btn";
        cancelBtn.textContent = cancelText;
        cancelBtn.onclick = () => {
          overlay.remove();
          resolve(null);
        };
        actions.appendChild(cancelBtn);
      }

      const okBtn = document.createElement("button");
      okBtn.className = "editor-btn editor-btn-main";
      okBtn.textContent = confirmText || "확인";
      okBtn.onclick = () => {
        const value = showInput ? input.value : true;
        overlay.remove();
        resolve(value);
      };
      actions.appendChild(okBtn);

      box.appendChild(actions);
      overlay.appendChild(box);
      document.body.appendChild(overlay);

      if (showInput) {
        input.focus();
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") okBtn.click();
          if (e.key === "Escape" && cancelBtn) cancelBtn.click();
        });
      }
    });
  }

  async function toggleEditMode() {
    const root = getContentRoot();
    if (!root) return;

    if (!editMode) {
      const input = await showModal({
        title: "편집 모드 암호 입력",
        message: "이 페이지를 편집하려면 암호를 입력하세요.",
        showInput: true,
        confirmText: "확인",
        cancelText: "취소",
      });
      if (input === null) return;
      if (input !== EDIT_PASSCODE) {
        await showModal({ title: "암호 오류", message: "암호가 올바르지 않습니다.", confirmText: "확인" });
        return;
      }
      editMode = true;
      root.setAttribute("contenteditable", "true");
      root.classList.add("edit-active");
      document.querySelectorAll("#pageContent a").forEach((a) => {
        a.addEventListener("click", blockLinkNav);
      });
      renderToolbarButtons(true);
      setStatus("편집 모드입니다. 텍스트를 클릭해서 수정하세요.");
    } else {
      editMode = false;
      root.setAttribute("contenteditable", "false");
      root.classList.remove("edit-active");
      document.querySelectorAll("#pageContent a").forEach((a) => {
        a.removeEventListener("click", blockLinkNav);
      });
      renderToolbarButtons(false);
      setStatus("");
    }
  }

  function saveLocal() {
    const root = getContentRoot();
    if (!root) return;
    localStorage.setItem(storageKey, root.innerHTML);
    setStatus("이 브라우저에 임시저장되었습니다. (다른 방문자에게는 보이지 않음)");
  }

  async function resetLocal() {
    const ok = await showModal({
      title: "초기화 확인",
      message: "이 브라우저에 저장된 편집 내용을 삭제하고 원본으로 되돌릴까요?",
      confirmText: "삭제",
      cancelText: "취소",
    });
    if (!ok) return;
    localStorage.removeItem(storageKey);
    location.reload();
  }

  function downloadHtml() {
    const clone = document.documentElement.cloneNode(true);
    const cloneRoot = clone.querySelector("#pageContent");
    if (cloneRoot) {
      cloneRoot.removeAttribute("contenteditable");
      cloneRoot.classList.remove("edit-active");
    }
    const toolbarClone = clone.querySelector("#editorToolbar");
    if (toolbarClone) toolbarClone.remove();

    const html = "<!DOCTYPE html>\n" + clone.outerHTML;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const fileName = location.pathname.split("/").pop() || "index.html";
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus("HTML 파일이 다운로드되었습니다. 실제 파일을 교체 후 배포해 주세요.");
  }

  function renderToolbarButtons(active) {
    toolbar.innerHTML = "";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "editor-btn editor-btn-main";
    toggleBtn.textContent = active ? "✅ 편집 종료" : "✏️ 편집 모드";
    toggleBtn.onclick = toggleEditMode;
    toolbar.appendChild(toggleBtn);

    if (active) {
      const saveBtn = document.createElement("button");
      saveBtn.className = "editor-btn";
      saveBtn.textContent = "💾 임시저장";
      saveBtn.onclick = saveLocal;
      toolbar.appendChild(saveBtn);

      const downloadBtn = document.createElement("button");
      downloadBtn.className = "editor-btn";
      downloadBtn.textContent = "⬇️ HTML 다운로드";
      downloadBtn.onclick = downloadHtml;
      toolbar.appendChild(downloadBtn);

      const resetBtn = document.createElement("button");
      resetBtn.className = "editor-btn editor-btn-danger";
      resetBtn.textContent = "↩️ 초기화";
      resetBtn.onclick = resetLocal;
      toolbar.appendChild(resetBtn);
    }

    toolbar.appendChild(statusEl);
  }

  function buildToolbar() {
    toolbar = document.createElement("div");
    toolbar.id = "editorToolbar";
    toolbar.className = "editor-toolbar";

    statusEl = document.createElement("span");
    statusEl.className = "editor-status";

    document.body.appendChild(toolbar);
    renderToolbarButtons(false);
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!getContentRoot()) return;
    restoreSavedContent();
    buildToolbar();
  });
})();
