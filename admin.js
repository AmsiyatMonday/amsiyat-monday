const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: corsHeaders,
  });
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

function extFrom(name, fallback = ".jpg") {
  const match = String(name).match(/\.[a-zA-Z0-9]+$/);
  return match ? match[0].toLowerCase() : fallback;
}

async function githubGetFile(path, env) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "Amsiyat-Monday",
    },
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(`GitHub GET failed (${res.status}): ${await res.text()}`);
  }

  return res.json();
}

async function upsertFile(path, bytes, message, env) {
  const existing = await githubGetFile(path, env);
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`;

  const body = {
    message,
    content: bytesToBase64(bytes),
  };

  if (existing?.sha) {
    body.sha = existing.sha;
  }

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "Amsiyat-Monday",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`GitHub PUT failed (${res.status}): ${text}`);
  }

  return JSON.parse(text);
}

async function loadChapters(env) {
  const file = await githubGetFile("data/chapters.json", env);
  if (!file?.download_url) return [];

  const res = await fetch(file.download_url);
  if (!res.ok) return [];

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method === "GET") {
      return json({
        success: true,
        message: "Amsiyat Monday Worker is running",
      });
    }

    if (request.method !== "POST") {
      return json(
        {
          success: false,
          error: "Method not allowed",
        },
        405
      );
    }

    try {
      const form = await request.formData();

      const title = String(form.get("title") || "").trim();
      const number = String(form.get("number") || "").trim();
      const description = String(form.get("description") || "").trim();
      const status = String(form.get("status") || "draft").trim();
      const tag = String(form.get("tag") || "").trim();

      const pdfFile = form.get("pdf");
      const coverFile = form.get("cover");

      if (!title) throw new Error("عنوان الفصل مطلوب");
      if (!number) throw new Error("رقم الفصل مطلوب");
      if (!(pdfFile instanceof File)) throw new Error("ملف PDF مطلوب");

      const padded = number.padStart(3, "0");
      const pdfPath = `chapters/chapter-${padded}.pdf`;

      const pdfBytes = new Uint8Array(await pdfFile.arrayBuffer());
      await upsertFile(pdfPath, pdfBytes, `Add PDF for chapter ${number}: ${title}`, env);

      let coverPath = "";
      if (coverFile instanceof File) {
        coverPath = `covers/chapter-${padded}${extFrom(coverFile.name, ".jpg")}`;
        const coverBytes = new Uint8Array(await coverFile.arrayBuffer());
        await upsertFile(coverPath, coverBytes, `Add cover for chapter ${number}: ${title}`, env);
      }

      const chapters = await loadChapters(env);

      const record = {
