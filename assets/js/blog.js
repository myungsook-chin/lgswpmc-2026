// 자유 게시판(블로그) 기능
// - 방문자가 자유롭게 글을 작성하고 텍스트 색상/크기를 바꿀 수 있습니다.
// - 이 브라우저(localStorage)에만 저장되며, 다른 방문자에게는 공유되지 않습니다.
(function () {
  const STORAGE_PREFIX = "pmpb_blog_v1_";
  const storageKey = STORAGE_PREFIX + location.pathname.replace(/[^a-zA-Z0-9]/g, "_");

  // 저장을 허용하는 태그만 통과시키고 나머지는 벗겨냅니다 (XSS 방지).
  const ALLOWED_TAGS = new Set(["B", "STRONG", "I", "EM", "U", "SPAN", "BR", "P", "DIV", "UL", "OL", "LI"]);

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function sanitizeNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent);
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const tag = node.tagName;
    if (!ALLOWED_TAGS.has(tag)) {
      const frag = document.createDocumentFragment();
      Array.from(node.childNodes).forEach((child) => {
        const cleaned = sanitizeNode(child);
        if (cleaned) frag.appendChild(cleaned);
      });
      return frag;
    }

    const el = document.createElement(tag);
    if (tag === "SPAN") {
      const color = node.style.color;
      const fontSize = node.style.fontSize;
      let safeStyle = "";
      if (color && /^(#[0-9a-fA-F]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\))$/.test(color)) {
        safeStyle += "color:" + color + ";";
      }
      if (fontSize && /^\d{1,3}(\.\d+)?px$/.test(fontSize)) {
        safeStyle += "font-size:" + fontSize + ";";
      }
      if (safeStyle) el.setAttribute("style", safeStyle);
    }
    Array.from(node.childNodes).forEach((child) => {
      const cleaned = sanitizeNode(child);
      if (cleaned) el.appendChild(cleaned);
    });
    return el;
  }

  function sanitizeHtml(html) {
    const container = document.createElement("div");
    container.innerHTML = html;
    const result = document.createElement("div");
    Array.from(container.childNodes).forEach((child) => {
      const cleaned = sanitizeNode(child);
      if (cleaned) result.appendChild(cleaned);
    });
    return result.innerHTML;
  }

  function loadPosts() {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function savePosts(posts) {
    localStorage.setItem(storageKey, JSON.stringify(posts));
  }

  function setStatus(el, msg, type) {
    el.textContent = msg;
    el.className = "form-status" + (type ? " " + type : "");
  }

  function wrapSelectionWithStyle(editableEl, styleProp, value) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return false;
    if (!editableEl.contains(range.commonAncestorContainer)) return false;

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
    return true;
  }

  function renderPosts(listEl, emptyEl, posts) {
    if (!posts.length) {
      listEl.innerHTML = "";
      emptyEl.style.display = "block";
      return;
    }
    emptyEl.style.display = "none";
    listEl.innerHTML = posts
      .slice()
      .reverse()
      .map(
        (post) => `
      <div class="blog-post" data-id="${post.id}">
        <div class="blog-post-meta">
          <span>${escapeHtml(post.author || "익명")}</span>
          <span>${escapeHtml(post.date)}</span>
        </div>
        <h4>${escapeHtml(post.title)}</h4>
        <div class="blog-post-body">${post.html}</div>
        <button type="button" class="blog-delete-btn" data-id="${post.id}">🗑 삭제</button>
      </div>`
      )
      .join("");
  }

  document.addEventListener("DOMContentLoaded", () => {
    const composer = document.getElementById("blogBody");
    const listEl = document.getElementById("blogList");
    const emptyEl = document.getElementById("blogEmpty");
    if (!composer || !listEl || !emptyEl) return;

    const authorInput = document.getElementById("blogAuthor");
    const titleInput = document.getElementById("blogTitle");
    const colorInput = document.getElementById("blogColor");
    const fontSizeSelect = document.getElementById("blogFontSize");
    const submitBtn = document.getElementById("blogSubmitBtn");
    const statusEl = document.getElementById("blogStatus");
    const toolbarBtns = document.querySelectorAll(".blog-toolbar [data-cmd]");

    let posts = loadPosts();
    renderPosts(listEl, emptyEl, posts);

    toolbarBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        composer.focus();
        document.execCommand(btn.dataset.cmd);
      });
    });

    if (colorInput) {
      colorInput.addEventListener("input", () => {
        wrapSelectionWithStyle(composer, "color", colorInput.value);
      });
    }

    if (fontSizeSelect) {
      fontSizeSelect.addEventListener("change", () => {
        if (!fontSizeSelect.value) return;
        wrapSelectionWithStyle(composer, "fontSize", fontSizeSelect.value + "px");
        fontSizeSelect.value = "";
      });
    }

    submitBtn.addEventListener("click", () => {
      const title = titleInput.value.trim();
      const rawHtml = composer.innerHTML.trim();
      const plainText = composer.textContent.trim();

      if (!title || !plainText) {
        setStatus(statusEl, "제목과 내용을 입력해 주세요.", "error");
        return;
      }

      const post = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        author: authorInput ? authorInput.value.trim() : "",
        title,
        html: sanitizeHtml(rawHtml),
        date: new Date().toLocaleString("ko-KR"),
      };

      posts.push(post);
      savePosts(posts);
      renderPosts(listEl, emptyEl, posts);

      titleInput.value = "";
      if (authorInput) authorInput.value = "";
      composer.innerHTML = "";
      setStatus(statusEl, "이 브라우저에 글이 등록되었습니다. (다른 방문자에게는 보이지 않음)", "success");
    });

    listEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".blog-delete-btn");
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.confirm === "true") {
        posts = posts.filter((p) => p.id !== id);
        savePosts(posts);
        renderPosts(listEl, emptyEl, posts);
      } else {
        btn.dataset.confirm = "true";
        btn.textContent = "정말 삭제할까요? (다시 클릭)";
        setTimeout(() => {
          btn.dataset.confirm = "false";
          btn.textContent = "🗑 삭제";
        }, 3000);
      }
    });
  });
})();
