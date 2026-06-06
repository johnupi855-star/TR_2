// ════════════════════════════════════════
//  RENDER — رسم الجدول والـ UI
// ════════════════════════════════════════

const Render = (() => {

  // ── Row Colors ────────────────────────
  const ROW_COLORS = [
    { val:'',  label:'بدون لون',           hex:'',        bg:'transparent' },
    { val:'1', label:'لسه موصلتش',         hex:'#94A3B8', bg:'#f1f5f9' },
    { val:'2', label:'وصلت',               hex:'#60A5FA', bg:'#eff6ff' },
    { val:'3', label:'في انتظار سحب إذن', hex:'#FCD34D', bg:'#fffbeb' },
    { val:'4', label:'تم سحب الإذن',      hex:'#FB923C', bg:'#fff7ed' },
    { val:'5', label:'تحت العمل',          hex:'#A78BFA', bg:'#f5f3ff' },
    { val:'6', label:'خرجت',               hex:'#34D399', bg:'#ecfdf5' },
    { val:'7', label:'مع الناقل',          hex:'#2DD4BF', bg:'#f0fdfa' },
    { val:'8', label:'تم التسليم',         hex:'#4ADE80', bg:'#f0fdf4' },
    { val:'9', label:'مشكلة',              hex:'#F87171', bg:'#fef2f2' },
  ];

  // ── Shipment Journey ──────────────────
  const JOURNEY_STEPS = [
    { key:'N',   label:'جديد' },
    { key:'B',   label:'انتظار' },
    { key:'W',   label:'جاري' },
    { key:'H',   label:'تحت العمل' },
    { key:'C',   label:'تم سحب الإذن' },
    { key:'O',   label:'تخزين' },
    { key:'S-O', label:'خرجت' },
    { key:'F',   label:'انتهت' },
  ];

  function journeyHtml(status) {
    const cur = JOURNEY_STEPS.findIndex(s => s.key === status);
    return '<div class="journey">' +
      JOURNEY_STEPS.map((s, i) =>
        '<div class="j-step' +
        (i < cur ? ' j-done' : i === cur ? ' j-active' : '') + '">' +
        '<div class="j-dot"></div>' +
        '<div class="j-lbl">' + s.label + '</div>' +
        '</div>'
      ).join('<div class="j-line"></div>') +
    '</div>';
  }

  // ── Color Picker ──────────────────────
  function cpHtml(id, cur) {
    const c = ROW_COLORS.find(x => x.val === cur) || ROW_COLORS[0];
    const opts = ROW_COLORS.map(o =>
      '<div class="cp-opt' + (o.val === cur ? ' sel' : '') + '"' +
      ' style="background:' + (o.bg || '#f9fafb') + '"' +
      ' data-cpid="' + id + '" data-cpval="' + o.val + '">' +
      '<span class="cp-dot" style="background:' + (o.hex || '#e2e8f0') + '"></span>' +
      '<span>' + o.label + '</span>' +
      '</div>'
    ).join('');
    return '<div class="cp-wrap" id="cp_' + id + '">' +
      '<button class="cp-btn" data-cptoggle="' + id + '" title="لون الصف">' +
        '<span class="cp-dot" style="background:' + (c.hex || '#e2e8f0') + '"></span>' +
      '</button>' +
      '<div class="cp-menu" id="cpm_' + id + '">' + opts + '</div>' +
    '</div>';
  }

  // ── Option helpers ────────────────────
  function statusOpts(cur) {
    return ['W','B','O','F','H','C','N','W/O','S-O','S-B','S-W']
      .map(s => '<option value="' + s + '"' + (s===cur?' selected':'') + '>' + s + '</option>').join('');
  }
  function bankOpts(cur) {
    return ['QNB','NBE','ATJ']
      .map(b => '<option' + (b===cur?' selected':'') + '>' + b + '</option>').join('');
  }
  function suppOpts(cur) {
    return ['Zaurak','Navigator']
      .map(s => '<option' + (s===cur?' selected':'') + '>' + s + '</option>').join('');
  }
  function clearerOpts(cur) {
    return ['','Relan','Mahaba','El Badry']
      .map(c => '<option value="' + c + '"' + (c===cur?' selected':'') + '>' + (c||'—') + '</option>').join('');
  }

  // ── View Row ──────────────────────────
  function viewRow(r, searchQ) {
    const d   = Utils.calcDays(r.eta);
    const rc  = ROW_COLORS.find(x => x.val === (r.rowColor||'')) || ROW_COLORS[0];
    const hl  = t => Utils.highlight(t, searchQ);

    return `
      <td class="drag-handle" title="اسحب لإعادة الترتيب">⠿</td>
      <td>
        <div class="bl-main">${hl(r.bl)}</div>
        <div class="sub-text">${hl(r.ref)}</div>
      </td>
      <td class="td-sl">${hl(r.sl||'')}</td>
      <td class="td-goods">${hl(r.goods)}</td>
      <td>
        <div>${hl(r.client)}</div>
        <div class="sub-text">${Utils.esc(r.supplier)}</div>
      </td>
      <td><span class="badge ${Utils.bankCls(r.bank)}">${r.bank}</span></td>
      <td class="td-cntr">${Utils.esc(r.cntr)}</td>
      <td class="td-amt">${Utils.fmtAmt(r.amount)}</td>
      <td class="td-date">${Utils.fmtDateDisplay(r.eta)}</td>
      <td class="td-date">${Utils.fmtDateDisplay(r.storage)}</td>
      <td class="td-date">${Utils.fmtDateDisplay(r.rcvd)}</td>
      <td class="${Utils.daysCls(d)}">${d === null ? '—' : d}</td>
      <td><span class="badge ${Utils.statusCls(r.status)}" title="${r.status}">${r.status}</span></td>
      <td style="text-align:center">
        <span class="badge ${Utils.clearerCls(r.clearer)}">${Utils.esc(r.clearer||'—')}</span>
      </td>
      <td class="td-color">${cpHtml(r.id, r.rowColor||'')}</td>
      <td class="td-notes">${hl(r.comment||'')}</td>
      <td class="td-updated"><span class="updated-lbl">${r.updatedAt||''}</span></td>
      <td class="td-actions">
        <button class="icon-btn edit-row-btn" data-id="${r.id}" title="تعديل هذا الصف">✏️</button>
      </td>`;
  }

  // ── Edit Row ──────────────────────────
  function editRow(r) {
    const id = r.id;
    return `
      <td class="drag-handle">⠿</td>
      <td class="edit-cell">
        <input value="${Utils.esc(r.bl)}" data-id="${id}" data-f="bl" placeholder="BL No."/>
        <input value="${Utils.esc(r.ref)}" data-id="${id}" data-f="ref" placeholder="Ref..."/>
      </td>
      <td class="edit-cell"><input value="${Utils.esc(r.sl||'')}" data-id="${id}" data-f="sl" placeholder="SL"/></td>
      <td class="edit-cell"><input value="${Utils.esc(r.goods)}" data-id="${id}" data-f="goods"/></td>
      <td class="edit-cell">
        <input value="${Utils.esc(r.client)}" data-id="${id}" data-f="client" placeholder="عميل"/>
        <select data-id="${id}" data-f="supplier">${suppOpts(r.supplier)}</select>
      </td>
      <td class="edit-cell"><select data-id="${id}" data-f="bank">${bankOpts(r.bank)}</select></td>
      <td class="edit-cell"><input value="${Utils.esc(r.cntr)}" data-id="${id}" data-f="cntr"/></td>
      <td class="edit-cell"><input type="number" value="${r.amount}" data-id="${id}" data-f="amount" step="0.01"/></td>
      <td class="edit-cell"><input type="date" value="${Utils.fmtDateInput(r.eta)}" data-id="${id}" data-f="eta"/></td>
      <td class="edit-cell"><input type="date" value="${Utils.fmtDateInput(r.storage)}" data-id="${id}" data-f="storage"/></td>
      <td class="edit-cell"><input type="date" value="${Utils.fmtDateInput(r.rcvd)}" data-id="${id}" data-f="rcvd"/></td>
      <td class="td-days-edit">${Utils.calcDays(r.eta) ?? '—'}</td>
      <td class="edit-cell"><select data-id="${id}" data-f="status">${statusOpts(r.status)}</select></td>
      <td class="edit-cell" style="text-align:center">
        <select data-id="${id}" data-f="clearer" style="width:100%">${clearerOpts(r.clearer||'')}</select>
      </td>
      <td class="td-color">${cpHtml(r.id, r.rowColor||'')}</td>
      <td class="edit-cell td-notes-edit">
        <textarea data-id="${id}" data-f="comment">${Utils.esc(r.comment)}</textarea>
      </td>
      <td class="td-updated"><span class="updated-lbl">${r.updatedAt||''}</span></td>
      <td class="td-actions" style="white-space:nowrap">
        <button class="icon-btn save-btn" data-id="${id}" title="حفظ">💾</button>
        <button class="icon-btn del-btn"  data-id="${id}" title="حذف">🗑</button>
      </td>`;
  }

  // ── Summary Cards ─────────────────────
  function renderSummary(filtered) {
    const total  = filtered.reduce((s, r) => s + Number(r.amount), 0);
    const byBank = { QNB:0, NBE:0, ATJ:0 };
    filtered.forEach(r => { if (byBank[r.bank] !== undefined) byBank[r.bank] += Number(r.amount); });

    // في الميناء = حالة W
    const inPort  = filtered.filter(r => r.status === 'W').length;
    // Delayed = ETA فات ولسه مش خلص
    const delayed = filtered.filter(r => {
      const d = Utils.calcDays(r.eta);
      return d !== null && d < 0 && !['F','O','S-O'].includes(r.status);
    }).length;

    document.getElementById('summary').innerHTML = `
      <div class="card">
        <div class="card-label">إجمالي المبالغ</div>
        <div class="card-val">${Utils.fmtAmt(total)}</div>
        <div class="card-sub">${filtered.length} شحنة</div>
      </div>
      <div class="card">
        <div class="card-label">QNB</div>
        <div class="card-val">${Utils.fmtAmt(byBank.QNB)}</div>
        <div class="card-sub">${filtered.filter(r=>r.bank==='QNB').length} شحنة</div>
      </div>
      <div class="card">
        <div class="card-label">NBE</div>
        <div class="card-val">${Utils.fmtAmt(byBank.NBE)}</div>
        <div class="card-sub">${filtered.filter(r=>r.bank==='NBE').length} شحنة</div>
      </div>
      <div class="card">
        <div class="card-label">ATJ</div>
        <div class="card-val">${Utils.fmtAmt(byBank.ATJ)}</div>
        <div class="card-sub">${filtered.filter(r=>r.bank==='ATJ').length} شحنة</div>
      </div>
      <div class="card card-port">
        <div class="card-label">في الميناء</div>
        <div class="card-val" style="color:#dc2626">${inPort}</div>
        <div class="card-sub">حالة W</div>
      </div>
      <div class="card ${delayed > 0 ? 'card-delayed' : ''}">
        <div class="card-label">متأخرة ⚠️</div>
        <div class="card-val" style="color:${delayed>0?'#d97706':'#94a3b8'}">${delayed}</div>
        <div class="card-sub">ETA فاتت</div>
      </div>`;

    document.getElementById('headerInfo').textContent =
      filtered.length + ' شحنة — ' + Utils.fmtAmt(total);
    document.getElementById('countInfo').textContent =
      'عرض ' + filtered.length + ' من ' + State.getRows().length;
  }

  // ── To-Do Today ───────────────────────
  function renderTodo() {
    const today = new Date();
    today.setHours(0,0,0,0);
    const rows = State.getRows();
    const tasks = [];

    rows.forEach(r => {
      const d = Utils.calcDays(r.eta);
      if (d !== null && d >= 0 && d <= 3 && !['F','O','S-O'].includes(r.status))
        tasks.push({ msg: r.bl + ' — ETA بعد ' + d + ' أيام', type:'warn' });
      if (r.status === 'W' && !r.clearer)
        tasks.push({ msg: r.bl + ' — لا يوجد Clearer', type:'info' });
      if (d !== null && d < 0 && !['F','O','S-O'].includes(r.status))
        tasks.push({ msg: r.bl + ' — ETA تجاوز ' + Math.abs(d) + ' يوم', type:'danger' });
    });

    const el = document.getElementById('todoList');
    if (!el) return;
    if (!tasks.length) {
      el.innerHTML = '<div class="todo-empty">✅ مفيش مهام اليوم</div>';
      return;
    }
    el.innerHTML = tasks.map(t =>
      '<div class="todo-item todo-' + t.type + '">' + t.msg + '</div>'
    ).join('');
  }

  // ── Main Render ───────────────────────
  function render() {
    const filtered  = State.getFiltered();
    const editRowId = State.getEditRowId();
    const searchQ   = State.getFilters().q;

    renderSummary(filtered);
    renderTodo();

    const tbody = document.getElementById('tbody');
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="18" class="empty">لا توجد نتائج</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const rc   = r.rowColor ? 'row-color-' + r.rowColor : '';
      const isEd = String(r.id) === String(editRowId);
      const activeClass = isEd ? ' row-editing' : '';
      return '<tr data-id="' + r.id + '" class="' + rc + activeClass + '">' +
        (isEd ? editRow(r) : viewRow(r, searchQ)) +
      '</tr>';
    }).join('');

    // init drag after render
    UI.initDrag();
  }

  return { render, ROW_COLORS, cpHtml, journeyHtml };
})();