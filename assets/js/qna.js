const QNA_STORAGE_KEY = "lgswpmc_qna_list";

function loadQnaList() {
  try {
    const raw = localStorage.getItem(QNA_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveQnaList(list) {
  localStorage.setItem(QNA_STORAGE_KEY, JSON.stringify(list));
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderQnaList() {
  const listEl = document.getElementById("qnaList");
  const emptyEl = document.getElementById("qnaEmpty");
  const items = loadQnaList();

  if (!items.length) {
    listEl.innerHTML = "";
    emptyEl.style.display = "block";
    return;
  }

  emptyEl.style.display = "none";
  listEl.innerHTML = items
    .slice()
    .reverse()
    .map(
      (item) => `
      <div class="qna-item">
        <div class="qna-meta">
          <span>${escapeHtml(item.name)}</span>
          <span>${escapeHtml(item.date)}</span>
        </div>
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.message)}</p>
      </div>`
    )
    .join("");
}

function setStatus(message, type) {
  const statusEl = document.getElementById("formStatus");
  statusEl.textContent = message;
  statusEl.className = "form-status" + (type ? " " + type : "");
}

document.addEventListener("DOMContentLoaded", () => {
  renderQnaList();

  const form = document.getElementById("qnaForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("qName").value.trim();
    const email = document.getElementById("qEmail").value.trim();
    const title = document.getElementById("qTitle").value.trim();
    const message = document.getElementById("qMessage").value.trim();

    if (!name || !email || !title || !message) {
      setStatus("모든 항목을 입력해 주세요.", "error");
      return;
    }

    const now = new Date();
    const dateStr = now.toLocaleString("ko-KR");

    const mailSubject = `[LG SW PM Competition 2026 질의응답] ${title}`;
    const mailBody =
      `이름: ${name}\n` +
      `회신 이메일: ${email}\n` +
      `등록 일시: ${dateStr}\n\n` +
      `${message}`;

    const mailtoUrl =
      `mailto:${encodeURIComponent(QNA_TO_EMAIL)}` +
      `?subject=${encodeURIComponent(mailSubject)}` +
      `&body=${encodeURIComponent(mailBody)}`;

    window.location.href = mailtoUrl;

    const list = loadQnaList();
    list.push({ name, email, title, message, date: dateStr });
    saveQnaList(list);
    renderQnaList();

    form.reset();
    setStatus("메일 작성 화면이 열렸습니다. 내용을 확인하고 '보내기'를 눌러 등록을 완료해 주세요.", "success");
  });
});
