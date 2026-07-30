(() => {
  const STORAGE_KEY = "amsiyat_local_chapters_v1";
  const WORKER_URL = "https://amsiyatmonday.alyaaalareeqi.workers.dev";

  const $ = (id) => document.getElementById(id);
  const uuid = () =>
    (crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const state = {
    editingId: null,
    coverUrl: "",
    pdfUrl: "",
    coverName: "",
    pdfName: "",
    chapters: loadChapters(),
  };

  const fields = {
    title: $("title"),
    number: $("number"),
    description: $("description"),
    status: $("status"),
    tag: $("tag"),
    cover: $("cover"),
    pdf: $("pdf"),
  };

  const ui = {
    statChapters: $("statChapters"),
    statLast: $("statLast"),
    statStatus: $("statStatus"),
    statFile: $("statFile"),
    coverName: $("coverName"),
    pdfName: $("pdfName"),
    previewTitle: $("previewTitle"),
    previewMeta: $("previewMeta"),
    infoTitle: $("infoTitle"),
    infoNumber: $("infoNumber"),
    infoStatus: $("infoStatus"),
    infoTag: $("infoTag"),
    coverPreview: $("coverPreview"),
    pdfFrame: $("pdfFrame"),
    chapterList: $("chapterList"),
    previewModal: $("previewModal"),
    modalTitle: $("modalTitle"),
    modalMeta: $("modalMeta"),
    modalCover: $("modalCover"),
    modalChapterTitle: $("modalChapterTitle"),
    modalChapterSub: $("modalChapterSub"),
    modalChapterDesc: $("modalChapterDesc"),
    modalChapterNum: $("modalChapterNum"),
    modalChapterTag: $("modalChapterTag"),
    btnSave: $("btnSave"),
    btnSaveAndPreview: $("btnSaveAndPreview"),
    btnPreview: $("btnPreview"),
    btnPublishRemote: $("btnPublishRemote"),
    btnClearAll: $("btnClearAll"),
    btnCloseModal: $("btnCloseModal"),
    btnSaveFromPreview: $("btnSaveFromPreview"),
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

  function readForm() {
    return {
      id: state.editingId || uuid(),
      title: fields.title.value.trim(),
      number: fields.number.value.trim(),
      description: fields.description.value.trim(),
      status: fields.status.value,
      tag: fields.tag.value.trim(),
      coverName: state.coverName || "",
      pdfName: state.pdfName || "",
      updatedAt: new Date().toISOString(),
    };
  }

  function fillPreview() {
    const title = fields.title.value.trim() || "أمسية الاثنين";
    const number = fields.number.value.trim() || "—";
    const description =
      fields.description.value.trim() ||
      "اكتبي بيانات الفصل لترينها هنا مباشرة";
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
    ui.modalChapterSub.textContent =
      fields.description.value.trim() || "لا يوجد وصف بعد";
    ui.modalChapterDesc.textContent = description;
    ui.modalChapterNum.textContent = `رقم الفصل: ${number}`;
    ui.modalChapterTag.textContent =
      tag === "—" ? "لا يوجد وسم" : `الوسم: ${tag}`;

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
      .map(
        (ch) => `
        <article class="chapter-item">
          <div class="top">
            <div>
              <h3>${escapeHtml(
                ch.number ? `الفصل ${ch.number}` : "فصل بدون رقم"
              )} — ${escapeHtml(ch.title)}</h3>
              <p>${escapeHtml(ch.description || "لا يوجد وصف")}</p>
            </div>
            <span style="color:var(--gold);font-weight:700;">${statusLabel(
              ch.status
            )}</span>
          </div>
          <div class="actions-row">
            <button class="mini" data-edit="${ch.id}">تعديل</button>
            <button class="mini" data-preview="${ch.id}">معاينة</button>
            <button class="mini" data-delete="${ch.id}">حذف</button>
          </div>
        </article>
      `
      )
      .join("");

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
    if (
