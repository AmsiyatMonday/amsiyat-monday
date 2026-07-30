(() => {
  const STORAGE_KEY = "amsiyat_local_chapters_v1";
  const WORKER_URL = "https://amsiyatmonday.alyaaalareeqi.workers.dev";
  const el = (id) => document.getElementById(id);

  window.addEventListener("error", (e) => {
    console.error(e.error || e.message);
  });

  window.addEventListener("unhandledrejection", (e) => {
    console.error(e.reason);
  });

  const state = {
    editingId: null,
    coverUrl: "",
    pdfUrl: "",
    coverName: "",
    pdfName: "",
    chapters: loadChapters(),
  };

  const fields = {
    title: el("title"),
    number: el("number"),
    description: el("description"),
    status: el("status"),
    tag: el("tag"),
    cover: el("cover"),
    pdf: el("pdf"),
  };

  const ui = {
    statChapters: el("statChapters"),
    statLast: el("statLast"),
    statStatus: el("statStatus"),
    statFile: el("statFile"),
    coverName: el("coverName"),
    pdfName: el("pdfName"),
    previewTitle: el("previewTitle"),
    previewMeta: el("previewMeta"),
    infoTitle: el("infoTitle"),
    infoNumber: el("infoNumber"),
    infoStatus: el("infoStatus"),
    infoTag: el("infoTag"),
    coverPreview: el("coverPreview"),
    pdfFrame: el("pdfFrame"),
    chapterList: el("chapterList"),
    previewModal: el("previewModal"),
    modalTitle: el("modalTitle"),
    modalMeta: el("modalMeta"),
    modalCover: el("modalCover"),
    modalChapterTitle: el("modalChapterTitle"),
    modalChapterSub: el("modalChapterSub"),
    modalChapterDesc: el("modalChapterDesc"),
    modalChapterNum: el("modalChapterNum"),
    modalChapterTag: el("modalChapterTag"),
  };

  function loadChapters() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveChapters() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.chapters));
    renderList();
    updateStats();
  }

  function statusLabel(v) {
    return v === "published" ? "منشور" : "مسودة";
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function fillPreview() {
    const title = fields.title.value.trim() || "أمسية الاثنين";
    const number = fields.number.value.trim() || "—";
    const description = fields.description.value.trim() || "اكتبي بيانات الفصل لترينها هنا مباشرة";
    const status = statusLabel(fields.status.value);
    const tag = fields.tag.value.trim() || "—";

    ui.previewTitle.textContent = title;
    ui.previewMeta.textContent = description;
    ui.infoTitle.textContent = title;
    ui.infoNumber.textContent = number;
    ui.infoStatus.textContent = status;
    ui.infoTag.textContent = tag;

    ui.modalTitle.textContent = title;
    ui.modalMeta.textContent = `${status} • الفصل ${number}`;
    ui.modalChapterTitle.textContent = title;
    ui.modalChapterSub.textContent = fields.description.value.trim() || "لا يوجد وصف بعد";
    ui.modalChapterDesc.textContent = description;
    ui.modalChapterNum.textContent = `رقم الفصل: ${number}`;
    ui.modalChapterTag.textContent = tag === "—" ? "لا يوجد وسم" : `الوسم: ${tag}`;

    ui.statStatus.textContent = status;
  }

  function updateStats() {
    ui.statChapters.textContent = state.chapters.length;
    const last = state.chapters[state.chapters.length - 1];
    ui.statLast.textContent = last ? `${last.number || "?"} - ${last.title}` : "—";
    ui.statFile.textContent = state.pdfName || "لا يوجد";
  }

  function renderList() {
    if (!state.chapters.length) {
      ui.chapterList.innerHTML = `<div class="empty">لا توجد فصول محفوظة بعد.</div>`;
      return;
    }

    ui.chapterList.innerHTML = state.chapters
      .slice()
      .sort((a, b) => Number(a.number) - Number(b.number))
      .map((ch) => `
        <article class="chapter-item">
          <div class="top">
            <div>
              <h3>${escapeHtml(ch.number ? `الفصل ${ch.number}` : "فصل بدون رقم")} — ${escapeHtml(ch.title)}</h3>
              <p>${escapeHtml(ch.description || "لا يوجد وصف")}</p>
            </div>
            <span style="color:var(--gold);font-weight:700;">${statusLabel(ch.status)}</span>
          </div>
          <div class="actions-row">
            <button class="mini" data-edit="${ch.id}">تعديل</button>
            <button class="mini" data-preview="${ch.id}">معاينة</button>
            <button class="mini" data-delete="${ch.id}">حذف</button>
          </div>
        </article>
      `).join("");

    ui.chapterList.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => editChapter(btn.dataset.edit));
    });
    ui.chapterList.querySelectorAll("[data-preview]").forEach((btn) => {
      btn.addEventListener("click", () => previewChapter(btn.dataset.preview));
    });
    ui.chapterList.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", () => deleteChapter(btn.dataset.delete));
    });
  }

  function syncCoverPreview(file) {
    if (!file) return;
    if (state.coverUrl) URL.revokeObjectURL(state.coverUrl);
    state.coverUrl = URL.createObjectURL(file);
    ui.coverPreview.src = state.coverUrl;
    ui.coverPreview.style.display = "block";
    ui.modalCover.src = state.coverUrl;
  }

  function syncPdfPreview(file) {
    if (!file) return;
    if (state.pdfUrl) URL.revokeObjectURL(state.pdfUrl);
    state.pdfUrl = URL.createObjectURL(file);
    ui.pdfFrame.src = state.pdfUrl;
  }

  function resetForm() {
    state.editingId = null;
    fields.title.value = "";
    fields.number.value = "";
    fields.description.value = "";
    fields.status.value = "draft";
    fields.tag.value = "";
    state.coverName = "";
    state.pdfName = "";
    fields.cover.value = "";
    fields.pdf.value = "";
    if (state.coverUrl) URL.revokeObjectURL(state.coverUrl);
    if (state.pdfUrl) URL.revokeObjectURL(state.pdfUrl);
    state.coverUrl = "";
    state.pdfUrl = "";
    ui.coverPreview.removeAttribute("src");
    ui.coverPreview.style.display = "none";
    ui.pdfFrame.removeAttribute("src");
    ui.coverName.textContent = "لا توجد صورة مختارة";
    ui.pdfName.textContent = "لا يوجد ملف مختار";
    fillPreview();
    updateStats();
  }

  function loadIntoForm(ch) {
    state.editingId = ch.id;
    fields.title.value = ch.title || "";
    fields.number.value = ch.number || "";
    fields.description.value = ch.description || "";
    fields.status.value = ch.status || "draft";
    fields.tag.value = ch.tag || "";
    state.coverName = ch.coverName || "";
    state.pdfName = ch.pdfName || "";
    ui.coverName.textContent = state.coverName || "لا توجد صورة مختارة";
    ui.pdfName.textContent = state.pdfName || "لا يوجد ملف مختار";
    fillPreview();
    updateStats();
  }

  function saveCurrent() {
    const item = {
      id: state.editingId || crypto.randomUUID(),
      title: fields.title.value.trim(),
      number: fields.number.value.trim(),
      description: fields.description.value.trim(),
      status: fields.status.value,
      tag: fields.tag.value.trim(),
      coverName: state.coverName || "",
      pdfName: state.pdfName || "",
      updatedAt: new Date().toISOString(),
    };

    if (!item.title) return alert("اكتبي عنوان الفصل");
    if (!
