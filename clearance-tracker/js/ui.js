// ════════════════════════════════════════
//  UI — التفاعلات والـ Events
// ════════════════════════════════════════

const UI = (() => {

  let _refreshInterval = null;
  let _refreshCountdown = 60;
  const REFRESH_SEC = 60;

  // ── Toast ─────────────────────────────
  function toast(msg, type = 'info', dur = 3000) {
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.textContent = msg;
    document.getElementById('toastContainer').appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, dur);
  }

  // ── Spinner ───────────────────────────
  function showSpinner() { document.getElementById('spinnerOverlay').classList.add('active'); }
  function hideSpinner() { document.getElementById('spinnerOverlay').classList.remove('active'); }
  function showSaving()  { document.getElementById('savingDot').classList.add('active'); }
  function hideSaving()  { document.getElementById('savingDot').classList.remove('active'); }

  // ── Load Data ─────────────────────────
  async function loadData(manual = false) {
    if (manual) showSpinner();
    try {
      const data = await API.getAll();
      State.setRows(data.map(r => ({
        ...r,
        amount  : parseFloat(r.amount) || 0,
        order   : (r.order !== '' && !isNaN(parseInt(r.order))) ? parseInt(r.order) : 9999,
        rowColor: r.rowColor || '',
      })).sort((a, b) => a.order - b.order));
      Render.render();
      if (manual) toast('تم التحديث ✓', 'success');
    } catch(err) {
      toast('خطأ في التحميل: ' + err.message, 'error', 5000);
    } finally {
      if (manual) hideSpinner();
    }
  }

  // ── Auto Refresh ──────────────────────
  function startAutoRefresh() {
    if (_refreshInterval) clearInterval(_refreshInterval);
    _refreshCountdown = REFRESH_SEC;
    _refreshInterval = setInterval(async () => {
      _refreshCountdown--;
      const el = document.getElementById('refreshInfo');
      if (el) el.textContent = '🔁 ' + _refreshCountdown + 's';
      if (_refreshCountdown <= 0) {
        _refreshCountdown = REFRESH_SEC;
        await loadData(false);
      }
    }, 1000);
  }

  // ── Field Change ──────────────────────
  function onFieldChange(id, field, val) {
    let processed = val;
    if (field === 'amount') processed = parseFloat(val) || 0;
    else if (['eta','storage','rcvd'].includes(field)) processed = val ? String(val).slice(0,10) : '';
    else if (field === 'status' && val === 'F') {
      // اعرض modal الحذف
      window._fPendingId = id;
      State.updateRow(id, { status: 'F', updatedAt: Utils.nowISO() });
      Render.render();
      document.getElementById('fModal').classList.add('active');
      scheduleAutoSave(id);
      return;
    }

    const r = State.updateRow(id, { [field]: processed, updatedAt: Utils.nowISO() });
    if (!r) return;
    Render.render();
    scheduleAutoSave(id);
  }

  function scheduleAutoSave(id) {
    clearTimeout(State.getSaveTimer());
    State.setSaveTimer(setTimeout(async () => {
      const r = State.getRows().find(x => String(x.id) === String(id));
      if (!r) return;
      showSaving();
      try { await API.update(r); hideSaving(); }
      catch(err) { hideSaving(); toast('خطأ في الحفظ', 'error', 4000); }
    }, 700));
  }

  // ── Manual Save ───────────────────────
  async function manualSave(id) {
    const r = State.getRows().find(x => String(x.id) === String(id));
    if (!r) return;
    clearTimeout(State.getSaveTimer());
    showSaving();
    try {
      await API.update(r);
      hideSaving();
      toast('تم الحفظ ✓', 'success');
      State.setEditRowId(null);
      Render.render();
    } catch(err) {
      hideSaving();
      toast('خطأ في الحفظ: ' + err.message, 'error', 4000);
    }
  }

  // ── Delete ────────────────────────────
  async function deleteRow(id) {
    if (!confirm('تأكيد حذف الشحنة؟')) return;
    showSpinner();
    try {
      await API.remove(id);
      State.removeRow(id);
      Render.render();
      toast('تم الحذف ✓', 'success');
    } catch(err) {
      toast('خطأ في الحذف', 'error', 4000);
    } finally {
      hideSpinner();
    }
  }

  // ── Add Row ───────────────────────────
  async function addRow() {
    const newRow = {
      id:'', bl:'BL-NEW', sl:'', ref:'', goods:'',
      supplier:'Navigator', client:'', bank:'NBE',
      amount:0, cntr:'1x40', eta:'', storage:'', rcvd:'',
      days:0, status:'N', clearer:'', rowColor:'', order:9999,
      comment:'', updatedAt: Utils.nowISO(),
    };
    newRow.id = State.uniqueId();
    showSpinner();
    try {
      await API.create(newRow);
      State.addRow(newRow);
      State.setEditRowId(newRow.id);
      Render.render();
      toast('تمت الإضافة ✓', 'success');
      document.getElementById('tbody').lastElementChild?.scrollIntoView({ behavior:'smooth', block:'nearest' });
    } catch(err) {
      toast('خطأ في الإضافة', 'error', 4000);
    } finally {
      hideSpinner();
    }
  }

  // ── Color Picker ──────────────────────
  function cpToggle(id) {
    const isOpen = document.getElementById('cp_' + id)?.classList.contains('open');
    cpClose();
    if (!isOpen) {
      const wrap = document.getElementById('cp_' + id);
      const menu = document.getElementById('cpm_' + id);
      if (!wrap || !menu) return;
      wrap.classList.add('open');
      const rect = wrap.getBoundingClientRect();
      menu.style.position = 'fixed';
      menu.style.top  = (rect.bottom + 4) + 'px';
      menu.style.left = rect.left + 'px';
    }
  }

  function cpClose() {
    document.querySelectorAll('.cp-wrap.open').forEach(el => el.classList.remove('open'));
  }

  async function updateRowColor(id, val) {
    const r = State.updateRow(id, { rowColor: val });
    if (!r) return;
    cpClose();
    Render.render();
    showSaving();
    try { await API.update(r); hideSaving(); }
    catch(err) { hideSaving(); toast('خطأ في حفظ اللون', 'error', 3000); }
  }

  // ── Drag & Drop ───────────────────────
  let _dragSrcId = null;

  function initDrag() {
    const tbody = document.getElementById('tbody');
    if (!tbody) return;

    tbody.querySelectorAll('tr[data-id]').forEach(tr => {
      const handle = tr.querySelector('.drag-handle');
      if (!handle) return;

      handle.onmousedown = () => { tr.draggable = true; };
      handle.onmouseup   = () => { tr.draggable = false; };

      tr.ondragstart = e => {
        _dragSrcId = tr.dataset.id;
        tr.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      };

      tr.ondragend = () => {
        tr.draggable = false;
        tr.classList.remove('dragging');
        tbody.querySelectorAll('.drag-over').forEach(r => r.classList.remove('drag-over'));
      };

      tr.ondragover = e => {
        e.preventDefault();
        tbody.querySelectorAll('.drag-over').forEach(r => r.classList.remove('drag-over'));
        tr.classList.add('drag-over');
      };

      tr.ondrop = async e => {
        e.preventDefault();
        const targetId = tr.dataset.id;
        if (!_dragSrcId || _dragSrcId === targetId) return;

        const rows   = State.getRows();
        const srcIdx = rows.findIndex(r => String(r.id) === String(_dragSrcId));
        const tgtIdx = rows.findIndex(r => String(r.id) === String(targetId));
        if (srcIdx === -1 || tgtIdx === -1) return;

        const [moved] = rows.splice(srcIdx, 1);
        rows.splice(tgtIdx, 0, moved);
        rows.forEach((r, i) => { r.order = i; });

        Render.render();
        showSaving();
        try {
          await API.batchUpdate(rows);
          hideSaving();
          toast('تم حفظ الترتيب ✓', 'success');
        } catch(err) {
          hideSaving();
          toast('خطأ في حفظ الترتيب', 'error', 3000);
        }
      };
    });
  }

  // ── F Modal ───────────────────────────
  function fModalYes() {
    document.getElementById('fModal').classList.remove('active');
    if (window._fPendingId) deleteRow(window._fPendingId);
    window._fPendingId = null;
  }

  function fModalNo() {
    document.getElementById('fModal').classList.remove('active');
    window._fPendingId = null;
  }

  // ── Export Excel ──────────────────────
  function exportExcel() {
    const rows = State.getFiltered();
    const headers = ['ID','BL','SL','Ref','Goods','Supplier','Client','Bank','Amount','Cntr','ETA','Storage','Rcvd','Status','Clearer','Comment'];
    const csvRows = [headers.join(',')];
    rows.forEach(r => {
      csvRows.push([
        r.id, r.bl, r.sl, r.ref, r.goods, r.supplier, r.client,
        r.bank, r.amount, r.cntr,
        Utils.fmtDateDisplay(r.eta),
        Utils.fmtDateDisplay(r.storage),
        Utils.fmtDateDisplay(r.rcvd),
        r.status, r.clearer,
        '"' + (r.comment||'').replace(/"/g,'""') + '"'
      ].join(','));
    });
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type:'text/csv;charset=utf-8' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'clearance-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    toast('تم التصدير ✓', 'success');
  }

  // ── Print ─────────────────────────────
  function printReport() {
    window.print();
  }

  // ── Keyboard Shortcuts ────────────────
  function initShortcuts() {
    document.addEventListener('keydown', async e => {
      const inInput = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName);
      const alt  = e.altKey;
      const code = e.code;

      // Alt+S — حفظ كل التعديلات
      if (alt && code === 'KeyS') {
        e.preventDefault();
        showSaving();
        try {
          for (const r of State.getRows()) await API.update(r);
          hideSaving();
          toast('تم حفظ كل التعديلات ✓', 'success');
        } catch(err) {
          hideSaving();
          toast('خطأ في الحفظ', 'error', 4000);
        }
        return;
      }

      if (e.code === 'Escape') {
        if (State.getEditRowId()) { State.setEditRowId(null); Render.render(); }
        cpClose();
        return;
      }

      if (inInput) return;

      if (alt && code === 'KeyN') { e.preventDefault(); addRow(); return; }
      if (alt && code === 'KeyR') { e.preventDefault(); loadData(true); return; }
      if (alt && code === 'KeyP') { e.preventDefault(); printReport(); return; }
      if (alt && code === 'KeyF') {
        e.preventDefault();
        document.getElementById('fSearch').focus();
        return;
      }
      if (alt && code === 'KeyX') { e.preventDefault(); exportExcel(); return; }
    });
  }

  // ── Event Delegation ──────────────────
  function initEvents() {
    const tbody = document.getElementById('tbody');

    // تغيير القيم في edit cells
    tbody.addEventListener('change', e => {
      const el = e.target;
      const id = el.dataset.id;
      const f  = el.dataset.f;
      if (id && f) onFieldChange(id, f, el.value);
    });

    tbody.addEventListener('input', e => {
      const el = e.target;
      const id = el.dataset.id;
      const f  = el.dataset.f;
      if (id && f && el.tagName === 'TEXTAREA') onFieldChange(id, f, el.value);
    });

    // زرار تعديل صف واحد
    tbody.addEventListener('click', e => {
      // edit button
      const editBtn = e.target.closest('.edit-row-btn');
      if (editBtn) {
        const id = editBtn.dataset.id;
        State.setEditRowId(State.getEditRowId() === id ? null : id);
        Render.render();
        return;
      }
      // save button
      const saveBtn = e.target.closest('.save-btn');
      if (saveBtn) { manualSave(saveBtn.dataset.id); return; }

      // delete button
      const delBtn = e.target.closest('.del-btn');
      if (delBtn) { deleteRow(delBtn.dataset.id); return; }

      // color picker toggle
      const cpToggleBtn = e.target.closest('[data-cptoggle]');
      if (cpToggleBtn) { e.stopPropagation(); cpToggle(cpToggleBtn.dataset.cptoggle); return; }

      // color option
      const cpOpt = e.target.closest('[data-cpid]');
      if (cpOpt) { e.stopPropagation(); updateRowColor(cpOpt.dataset.cpid, cpOpt.dataset.cpval); return; }
    });

    // اغلاق الـ color picker لو ضغط بره
    document.addEventListener('click', e => {
      if (!e.target.closest('.cp-wrap')) cpClose();
    });

    // Filters
    ['fBank','fStatus','fSupplier','fClearer'].forEach(id => {
      document.getElementById(id).addEventListener('change', e => {
        State.setFilter(id.slice(1).toLowerCase(), e.target.value);
        Render.render();
      });
    });
    // fix: fBank → bank, fStatus → status
    document.getElementById('fBank').addEventListener('change', e => {
      State.setFilter('bank', e.target.value); Render.render();
    });
    document.getElementById('fStatus').addEventListener('change', e => {
      State.setFilter('status', e.target.value); Render.render();
    });
    document.getElementById('fSupplier').addEventListener('change', e => {
      State.setFilter('supplier', e.target.value); Render.render();
    });
    document.getElementById('fClearer').addEventListener('change', e => {
      State.setFilter('clearer', e.target.value); Render.render();
    });
    document.getElementById('fSearch').addEventListener('input', e => {
      State.setFilter('q', e.target.value); Render.render();
    });

    // F Modal
    document.getElementById('fModalYes').addEventListener('click', fModalYes);
    document.getElementById('fModalNo').addEventListener('click',  fModalNo);

    // Buttons
    document.getElementById('btnAdd').addEventListener('click', addRow);
    document.getElementById('btnRefresh').addEventListener('click', () => loadData(true));
    document.getElementById('btnPrint').addEventListener('click', printReport);
    document.getElementById('btnExport').addEventListener('click', exportExcel);
  }

  // ── Init ──────────────────────────────
  async function init() {
    showSpinner();
    initEvents();
    initShortcuts();
    await loadData(false);
    hideSpinner();
    startAutoRefresh();
  }

  return {
    init, loadData, addRow, deleteRow, manualSave,
    initDrag, toast, showSpinner, hideSpinner,
    showSaving, hideSaving, exportExcel, cpClose,
  };
})();