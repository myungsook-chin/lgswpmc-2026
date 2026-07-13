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
  if (typeof emailjs !== "undefined" && EMAILJS_CONFIG.publicKey) {
    emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
  }

  renderQnaList();

  const form = document.getElementById("qnaForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("qName").value.trim();
    const email = document.getElementById("qEmail").value.trim();
    const title = document.getElementById("qTitle").value.trim();
    const message = document.getElementById("qMessage").value.trim();

    if (!name || !email || !title || !message) {
      setStatus("모든 항목을 입력해 주세요.", "error");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    setStatus("전송 중입니다...", "");

    const now = new Date();
    const dateStr = now.toLocaleString("ko-KR");

    const templateParams = {
      to_email: EMAILJS_CONFIG.toEmail,
      from_name: name,
      from_email: email,
      title: title,
      message: message,
      submitted_at: dateStr,
    };

    try {
      if (
        typeof emailjs === "undefined" ||
        EMAILJS_CONFIG.serviceId.startsWith("YOUR_") ||
        EMAILJS_CONFIG.templateId.startsWith("YOUR_") ||
        EMAILJS_CONFIG.publicKey.startsWith("YOUR_")
      ) {
        throw new Error("EmailJS가 아직 설정되지 않았습니다. assets/js/config.js를 확인하세요.");
      }

      await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, templateParams);

      const list = loadQnaList();
      list.push({ name, email, title, message, date: dateStr });
      saveQnaList(list);
      renderQnaList();

      form.reset();
      setStatus("질문이 등록되고 담당자에게 이메일이 발송되었습니다.", "success");
    } catch (err) {
      console.error(err);
      setStatus("전송에 실패했습니다: " + err.message, "error");
    } finally {
      submitBtn.disabled = false;
    }
  });
});
