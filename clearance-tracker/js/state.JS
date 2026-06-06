// ════════════════════════════════════════
//  STATE — المخزن المركزي للبيانات
// ════════════════════════════════════════

const State = (() => {
  let _rows      = [];
  let _editRowId = null;   // id الصف الي في Edit Mode
  let _editMode  = false;  // global edit toggle (للـ toolbar)
  let _filters   = { bank:'', status:'', supplier:'', clearer:'', q:'' };
  let _saveTimer = null;

  // ── Rows ──────────────────────────────
  function getRows()        { return _rows; }
  function setRows(data)    { _rows = data; }
  function updateRow(id, fields) {
    const idx = _rows.findIndex(r => String(r.id) === String(id));
    if (idx === -1) return null;
    _rows[idx] = { ..._rows[idx], ...fields };
    return _rows[idx];
  }
  function removeRow(id) {
    _rows = _rows.filter(r => String(r.id) !== String(id));
  }
  function addRow(row) { _rows.push(row); }

  // ── Edit ──────────────────────────────
  function getEditRowId()   { return _editRowId; }
  function setEditRowId(id) { _editRowId = id; }
  function getEditMode()    { return _editMode; }
  function setEditMode(v)   { _editMode = v; }

  // ── Filters ───────────────────────────
  function getFilters()     { return { ..._filters }; }
  function setFilter(k, v)  { _filters[k] = v; }

  // ── Save Timer ────────────────────────
  function getSaveTimer()   { return _saveTimer; }
  function setSaveTimer(t)  { _saveTimer = t; }

  // ── Filtered rows ─────────────────────
  function getFiltered() {
    const { bank, status, supplier, clearer, q } = _filters;
    const ql = q.toLowerCase();
    return _rows.filter(r => {
      if (bank     && r.bank     !== bank)     return false;
      if (status   && r.status   !== status)   return false;
      if (supplier && r.supplier !== supplier) return false;
      if (clearer  && r.clearer  !== clearer)  return false;
      if (ql && !(
        (r.bl     ||'').toLowerCase().includes(ql) ||
        (r.goods  ||'').toLowerCase().includes(ql) ||
        (r.client ||'').toLowerCase().includes(ql) ||
        (r.ref    ||'').toLowerCase().includes(ql) ||
        (r.sl     ||'').toLowerCase().includes(ql)
      )) return false;
      return true;
    });
  }

  // ── Unique ID ─────────────────────────
  function uniqueId() {
    const existing = new Set(_rows.map(r => Number(r.id)).filter(n => n < 100000));
    let id = 101;
    while (existing.has(id)) id++;
    return String(id);
  }

  return {
    getRows, setRows, updateRow, removeRow, addRow,
    getEditRowId, setEditRowId,
    getEditMode, setEditMode,
    getFilters, setFilter,
    getSaveTimer, setSaveTimer,
    getFiltered, uniqueId,
  };
})();