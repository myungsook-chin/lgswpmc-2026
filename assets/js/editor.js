// 웹 페이지 In-place 편집 모드
// - 화면 우측 하단 "편집" 버튼으로 토글합니다.
// - 편집 모드에서는 본문 텍스트를 클릭해서 직접 수정하거나, 페이지 하단의
//   "자유 작성 영역"에 새 내용을 자유롭게 추가할 수 있습니다. (글자 색상/크기 지정 가능)
// - "임시저장"은 이 브라우저(localStorage)에만 저장되어, 새로고침해도 유지됩니다.
// - "HTML 다운로드"로 수정된 페이지 파일을 받아 실제 파일을 교체 → git commit/push 하면
//   모든 방문자에게 반영되는 정식 배포가 됩니다. (GitHub Pages는 서버가 없어 실시간 전체 공유 저장은 지원하지 않습니다.)
(function () {
  const EDIT_PASSCODE = "pmpb2026"; // 간단한 오남용 방지용 암호 (진짜 보안 인증 아님)
  const STORAGE_PREFIX = "pmpb_edit_v2_";
  const storageKey = STORAGE_PREFIX + location.pathname.replace(/[^a-zA-Z0-9]/g, "_");

  let editMode = false;
  let toolbar, statusEl;

  function getContentRoots() {
    return Array.from(document.querySelectorAll(".editable-region"));
  }

  function restoreSavedContent() {
    const roots = getContentRoots();
    if (!roots.length) return;
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    let map;
    try {
      map = JSON.parse(saved);
    } catch (e) {
      return;
    }
    roots.forEach((root) => {
      if (root.id && Object.prototype.hasOwnProperty.call(map, root.id)) {
        root.innerHTML = map[root.id];
      }
    });
  }

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function blockLinkNav(e) {
    if (editMode) {
      e.preventDefault();
    }
  }

  function wrapSelectionWithStyle(styleProp, value) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setStatus("먼저 스타일을 적용할 텍스트를 드래그해서 선택해 주세요.");
      return;
    }
    const range = sel.getRangeAt(0);
    const roots = getContentRoots();
    const inRoot = roots.some((root) => root.contains(range.commonAncestorContainer));
    if (!inRoot) {
      setStatus("편집 가능한 영역 안에서 텍스트를 선택해 주세요.");
      return;
    }
    const span = document.createElement("span");
    span.style[styleProp] = value;
    try {
      range.surroundContents(span);
    } catch (e) {
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    }
    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.addRange(newRange);
    setStatus("선택한 텍스트에 스타일을 적용했습니다.");
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
    const roots = getContentRoots();
    if (!roots.length) return;

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
      roots.forEach((root) => {
        root.setAttribute("contenteditable", "true");
        root.classList.add("edit-active");
      });
      document.querySelectorAll(".editable-region a").forEach((a) => {
        a.addEventListener("click", blockLinkNav);
      });
      renderToolbarButtons(true);
      setStatus("편집 모드입니다. 기존 텍스트를 수정하거나, 페이지 하단 자유 작성 영역에 새 내용을 추가하세요.");
    } else {
      editMode = false;
      roots.forEach((root) => {
        root.setAttribute("contenteditable", "false");
        root.classList.remove("edit-active");
      });
      document.querySelectorAll(".editable-region a").forEach((a) => {
        a.removeEventListener("click", blockLinkNav);
      });
      renderToolbarButtons(false);
      setStatus("");
    }
  }

  function saveLocal() {
    const roots = getContentRoots();
    if (!roots.length) return;
    const map = {};
    roots.forEach((root) => {
      if (root.id) map[root.id] = root.innerHTML;
    });
    localStorage.setItem(storageKey, JSON.stringify(map));
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
    clone.querySelectorAll(".editable-region").forEach((root) => {
      root.removeAttribute("contenteditable");
      root.classList.remove("edit-active");
    });
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

      const colorLabel = document.createElement("label");
      colorLabel.className = "editor-color-label";
      colorLabel.appendChild(document.createTextNode("색상 "));
      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.value = "#f2b705";
      colorInput.title = "선택한 텍스트의 색상을 바꿉니다.";
      colorInput.addEventListener("input", () => wrapSelectionWithStyle("color", colorInput.value));
      colorLabel.appendChild(colorInput);
      toolbar.appendChild(colorLabel);

      const sizeSelect = document.createElement("select");
      sizeSelect.className = "editor-size-select";
      sizeSelect.title = "선택한 텍스트의 글자 크기를 바꿉니다.";
      sizeSelect.innerHTML =
        '<option value="">크기 선택</option>' +
        '<option value="14px">14px</option>' +
        '<option value="16px">16px</option>' +
        '<option value="18px">18px</option>' +
        '<option value="20px">20px</option>' +
        '<option value="24px">24px</option>' +
        '<option value="28px">28px</option>' +
        '<option value="32px">32px</option>';
      sizeSelect.addEventListener("change", () => {
        if (sizeSelect.value) wrapSelectionWithStyle("fontSize", sizeSelect.value);
        sizeSelect.value = "";
      });
      toolbar.appendChild(sizeSelect);

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
    if (!getContentRoots().length) return;
    restoreSavedContent();
    buildToolbar();
  });
})();
