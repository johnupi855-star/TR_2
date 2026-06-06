// ════════════════════════════════════════
//  UTILS — دوال مساعدة
// ════════════════════════════════════════

const Utils = (() => {

  // ── التاريخ ───────────────────────────
  function fmtDateDisplay(v) {
    if (!v) return '—';
    const s = String(v);
    const dateOnly = s.includes('T') ? s.split('T')[0] : s.slice(0, 10);
    const parts = dateOnly.split('-');
    if (parts.length === 3 && parts[0].length === 4)
      return parts[2] + '/' + parts[1] + '/' + parts[0];
    return v || '—';
  }

  function fmtDateInput(v) {
    if (!v) return '';
    const s = String(v).trim();
    const raw = s.includes('T') ? s.split('T')[0] : s.slice(0, 10);
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      const p = raw.split('/');
      return p[2] + '-' + p[1] + '-' + p[0];
    }
    return raw;
  }

  function calcDays(eta) {
    if (!eta) return null;
    const s = String(eta);
    const raw = s.includes('T') ? s.split('T')[0] : s.slice(0, 10);
    const parts = raw.split('-');
    if (parts.length !== 3) return null;
    const etaDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(etaDate)) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    etaDate.setHours(0, 0, 0, 0);
    return Math.round((etaDate - today) / 86400000);
  }

  function sanitizeDateField(v) {
    if (!v) return '';
    const s = String(v).trim();
    const raw = s.includes('T') ? s.split('T')[0] : s.slice(0, 10);
    return raw;
  }

  // ── الأرقام ───────────────────────────
  function fmtAmt(v) {
    return '$' + Number(v).toLocaleString('en-US', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  }

  // ── XSS escape ────────────────────────
  function esc(v) {
    return String(v || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ── Search highlight ──────────────────
  function highlight(text, query) {
    if (!query || !text) return esc(text);
    const escaped = String(text);
    const re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return escaped.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(re, '<mark class="hl">$1</mark>');
  }

  // ── CSS classes ───────────────────────
  function bankCls(b) {
    return b === 'QNB' ? 'bank-QNB' : b === 'NBE' ? 'bank-NBE' : b === 'ATJ' ? 'bank-ATJ' : 'bank-QNB';
  }

  function statusCls(s) {
    const m = {
      'W':'s-W','B':'s-B','O':'s-O','S-B':'s-SB','S-O':'s-SO',
      'S-W':'s-SW','F':'s-F','H':'s-H','C':'s-C','N':'s-N','W/O':'s-WO'
    };
    return m[s] || 's-N';
  }

  function daysCls(d) {
    if (d === null) return 'days-neg';
    d = Number(d);
    if (d < 0)  return 'days-neg';
    if (d > 10) return 'days-danger';
    if (d > 4)  return 'days-warn';
    return 'days-ok';
  }

  function clearerCls(c) {
    if (c === 'Relan')    return 'c-RELAN';
    if (c === 'Mahaba')   return 'c-MAHABA';
    if (c === 'El Badry') return 'c-BADRY';
    return 's-N';
  }

  // ── Last updated ──────────────────────
  function nowISO() {
    return new Date().toISOString().slice(0, 16).replace('T', ' ');
  }

  return {
    fmtDateDisplay, fmtDateInput, calcDays, sanitizeDateField,
    fmtAmt, esc, highlight,
    bankCls, statusCls, daysCls, clearerCls,
    nowISO,
  };
})();