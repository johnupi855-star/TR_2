// ════════════════════════════════════════
//  API — الاتصال بـ Google Sheets عبر GAS
// ════════════════════════════════════════

const API = (() => {
  // ⚠️ ضع الـ URL هنا بعد كل New Deployment
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbw6PEP9B0uYrpqx-ohCGMgUtkdmRWQfCaVuqcQA5x3YStyeRbld4DFO2quxuOfnJ4e8/exec';

  // ── GET — قراءة البيانات ──────────────
  async function getAll() {
    const url = GAS_URL + '?action=read&t=' + Date.now();
    const res  = await fetch(url, { redirect: 'follow' });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch(e) { throw new Error('GAS parse error: ' + text.slice(0, 100)); }
    if (data && data.error) throw new Error(data.error);
    if (Array.isArray(data)) return data;
    return [];
  }

  // ── POST — كتابة عبر form في iframe ──
  function _formPost(params) {
    return new Promise((resolve) => {
      const iid = 'gi_' + Date.now();
      const fid = 'gf_' + Date.now();

      const iframe = document.createElement('iframe');
      iframe.id = iid; iframe.name = iid;
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const form = document.createElement('form');
      form.id = fid; form.method = 'POST';
      form.action = GAS_URL; form.target = iid;
      form.style.display = 'none';

      Object.entries(params).forEach(([k, v]) => {
        const inp = document.createElement('input');
        inp.type = 'hidden'; inp.name = k; inp.value = String(v);
        form.appendChild(inp);
      });

      document.body.appendChild(form);

      const cleanup = () => {
        setTimeout(() => { iframe.remove(); form.remove(); }, 500);
        resolve(true);
      };

      iframe.onload = cleanup;
      setTimeout(cleanup, 4000);
      form.submit();
    });
  }

  async function create(row)  { await _formPost({ action: 'create', data: JSON.stringify(row) }); }
  async function update(row)  { await _formPost({ action: 'update', data: JSON.stringify(row) }); }
  async function remove(id)   { await _formPost({ action: 'delete', id: String(id) }); }

  // ── Batch update (للترتيب) ────────────
  async function batchUpdate(rows) {
    for (const r of rows) { await update(r); }
  }

  return { getAll, create, update, remove, batchUpdate };
})();