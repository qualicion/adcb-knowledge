/* ============================================================
   ADCB Open Finance — LFI API Knowledge Base Engine
   Renders tabbed content from lfi-api-data.js.
   ============================================================ */

var lfiApiCurrentTab = 'lfiapi-overview';

/* ── Badge helpers ── */
function lfiApiBadge(method) {
  var cls = {GET:'method-get',POST:'method-post',PATCH:'method-patch'}[method]||'';
  return '<span style="display:inline-block;font-size:10px;font-weight:700;padding:2px 8px;border-radius:3px;color:#fff;background:' +
    ({GET:'#1A6B4A',POST:'#B8860B',PATCH:'#2B4B8A'}[method]||'#5A5A5A') + ';">' + method + '</span>';
}
function lfiApiMibBadge(mib) {
  var labels = {no:'No MIB',yes:'Full MIB',bound:'Consent bound',caap:'CAAP',infra:'Infrastructure'};
  var colors = {no:'background:#E8F5EE;color:#1A6B4A;',yes:'background:#FDEBEE;color:#8A1A2E;',bound:'background:#EFF6FF;color:#2B4B8A;',caap:'background:#F5F3FF;color:#6A3A7A;',infra:'background:#F8FAFC;color:#5A5A5A;'};
  return '<span style="display:inline-block;font-size:10px;font-weight:600;padding:2px 8px;border-radius:3px;' + (colors[mib]||'') + '">' + (labels[mib]||mib) + '</span>';
}
function lfiApiPiiBadge(label, rank) {
  var colors = {0:'background:#E8F5EE;color:#1A6B4A;',1:'background:#FDF4E0;color:#8A6A00;',2:'background:#FDEBEE;color:#8A1A2E;',3:'background:#FDEBEE;color:#8A1A2E;'};
  return '<span style="display:inline-block;font-size:10px;font-weight:600;padding:2px 8px;border-radius:3px;' + (colors[rank]||'') + '">' + label + '</span>';
}

/* ── Render endpoint table ── */
function lfiApiTable(endpoints) {
  var h = '<table class="err-table" style="font-size:12px;">' +
    '<thead><tr><th style="width:8%;">Method</th><th>Endpoint</th><th>Purpose</th><th style="width:12%;">MIB</th><th style="width:10%;">PII</th></tr></thead><tbody>';
  for (var i = 0; i < endpoints.length; i++) {
    var e = endpoints[i];
    h += '<tr><td>' + lfiApiBadge(e.method) + '</td>' +
      '<td><code style="font-size:11px;background:#F1F5F9;padding:2px 6px;border-radius:3px;">' + e.endpoint + '</code></td>' +
      '<td style="font-size:12px;color:#475569;">' + e.purpose + '</td>' +
      '<td>' + lfiApiMibBadge(e.mib) + '</td>' +
      '<td>' + lfiApiPiiBadge(e.piiLabel, e.piiRank) + '</td></tr>';
  }
  return h + '</tbody></table>';
}

/* ── Tab switching ── */
function switchLfiApiTab(name, btn) {
  navigate('lfiapi', 'tab-' + name);
}

/* ── Main init ── */
function lfiApiInit() {
  /* Overview tab */
  var overviewEl = document.getElementById('lfiapi-overview-content');
  if (overviewEl) {
    var metrics = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:20px;">';
    for (var ci = 0; ci < LFI_API_CATEGORIES.length; ci++) {
      var cat = LFI_API_CATEGORIES[ci];
      metrics += '<div style="background:#fff;border:1px solid #E2E8F0;border-top:3px solid ' + cat.color + ';border-radius:8px;padding:14px 16px;text-align:center;">' +
        '<div style="font-size:28px;font-weight:700;color:' + cat.color + ';">' + cat.count + '</div>' +
        '<div style="font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:.5px;margin-top:4px;">' + cat.label + '</div></div>';
    }
    metrics += '</div>';

    var mentalModel = '<div class="box box-gold" style="margin-bottom:16px;">' +
      '<h3 style="color:var(--color-text-primary);margin-bottom:6px;">Mental model — one line</h3>' +
      '<p>Anything under <code>/open-data/*</code>, <code>/products</code>, or <code>/health</code> is <strong>pre-consent and PII-free</strong>. Everything else that returns account, customer, transaction, statement, policy, claim, payment, or FX data sits behind <strong>MIB consent and CAAP authentication</strong>.</p>' +
    '</div>';

    var unconsented = lfiApiTable(LFI_API_ENDPOINTS.filter(function(e){ return e.category === 'Unconsented'; }));

    overviewEl.innerHTML = metrics + mentalModel +
      '<h3 style="color:var(--navy);">The 4 endpoints that need no consent and no PII</h3>' +
      '<p style="font-size:13px;color:var(--color-text-secondary);margin-bottom:8px;">These are the complete list of LFI GETs that both (a) lack PII and (b) sit outside the MIB consent flow.</p>' +
      unconsented +
      '<div class="box box-warn"><p><strong>One nuance:</strong> <code>POST /customers/action/cop-query</code> is technically pre-payment and not tied to a standing MIB consent, but it <strong>does</strong> take and return PII (beneficiary name check). No MIB ≠ no PII.</p></div>';
  }

  /* Category tabs */
  for (var ti = 0; ti < LFI_API_CATEGORIES.length; ti++) {
    var c = LFI_API_CATEGORIES[ti];
    var tabEl = document.getElementById('lfiapi-' + c.key + '-content');
    if (tabEl) {
      var filtered = LFI_API_ENDPOINTS.filter(function(e){ return e.category === c.filter; });
      tabEl.innerHTML =
        '<div class="box box-navy" style="margin-bottom:16px;"><p>' + c.desc + '</p></div>' +
        lfiApiTable(filtered);
    }
  }

  /* Matrix tab */
  var matrixEl = document.getElementById('lfiapi-matrix-content');
  if (matrixEl) {
    var searchBar = '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">' +
      '<input type="text" id="lfiapi-search" placeholder="Search endpoint or keyword..." style="flex:2;min-width:200px;padding:8px 12px;border:1px solid #E2E8F0;border-radius:6px;font-size:13px;outline:none;" oninput="lfiApiFilter()" />' +
      '<select id="lfiapi-method-filter" style="padding:8px 12px;border:1px solid #E2E8F0;border-radius:6px;font-size:13px;" onchange="lfiApiFilter()"><option value="">All Methods</option><option value="GET">GET</option><option value="POST">POST</option><option value="PATCH">PATCH</option></select>' +
      '<select id="lfiapi-mib-filter" style="padding:8px 12px;border:1px solid #E2E8F0;border-radius:6px;font-size:13px;" onchange="lfiApiFilter()"><option value="">All MIB</option><option value="no">No MIB</option><option value="yes">Full MIB</option><option value="bound">Consent bound</option></select>' +
      '<select id="lfiapi-pii-filter" style="padding:8px 12px;border:1px solid #E2E8F0;border-radius:6px;font-size:13px;" onchange="lfiApiFilter()"><option value="">All PII</option><option value="0">None</option><option value="1">Med</option><option value="2">High+</option></select>' +
      '<button onclick="lfiApiReset()" style="padding:8px 14px;border:1px solid #E2E8F0;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;background:#fff;">Reset</button>' +
    '</div>' +
    '<div id="lfiapi-filter-status" style="font-size:11px;color:#475569;margin-bottom:8px;">Showing all ' + LFI_API_ENDPOINTS.length + ' endpoints</div>' +
    '<div id="lfiapi-matrix-table"></div>';

    matrixEl.innerHTML = searchBar;
    lfiApiFilter();
  }

  /* Glossary tab */
  var glossaryEl = document.getElementById('lfiapi-glossary-content');
  if (glossaryEl && LFI_API_GLOSSARY) {
    var gh = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
    for (var gi = 0; gi < LFI_API_GLOSSARY.length; gi++) {
      var g = LFI_API_GLOSSARY[gi];
      gh += '<div style="padding:12px 14px;background:#fff;border:1px solid #E2E8F0;border-left:3px solid var(--teal);border-radius:0 8px 8px 0;">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
          '<span style="font-size:12px;font-weight:800;color:var(--navy);font-family:var(--font-family-mono);">' + g.term + '</span>' +
          '<span style="font-size:10px;color:#94A3B8;">' + g.full + '</span>' +
        '</div>' +
        '<div style="font-size:12px;color:#475569;line-height:1.6;">' + g.plain + '</div>' +
      '</div>';
    }
    glossaryEl.innerHTML = gh + '</div>';
  }
}

/* ── Matrix filter ── */
function lfiApiFilter() {
  var q = (document.getElementById('lfiapi-search') || {}).value || '';
  q = q.trim().toLowerCase();
  var method = (document.getElementById('lfiapi-method-filter') || {}).value || '';
  var mib = (document.getElementById('lfiapi-mib-filter') || {}).value || '';
  var pii = (document.getElementById('lfiapi-pii-filter') || {}).value || '';

  var filtered = LFI_API_ENDPOINTS.filter(function(e) {
    if (method && e.method !== method) return false;
    if (mib && e.mib !== mib) return false;
    if (pii !== '' && parseInt(pii) !== e.piiRank && !(pii === '2' && e.piiRank >= 2)) return false;
    if (q) {
      var hay = (e.endpoint + ' ' + e.category + ' ' + e.purpose + ' ' + e.family + ' ' + e.method).toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  });

  var tableEl = document.getElementById('lfiapi-matrix-table');
  var statusEl = document.getElementById('lfiapi-filter-status');
  if (tableEl) tableEl.innerHTML = lfiApiTable(filtered);
  if (statusEl) {
    statusEl.innerHTML = filtered.length === LFI_API_ENDPOINTS.length
      ? 'Showing all <strong>' + LFI_API_ENDPOINTS.length + '</strong> endpoints'
      : 'Showing <strong>' + filtered.length + '</strong> of <strong>' + LFI_API_ENDPOINTS.length + '</strong> endpoints';
  }
}

function lfiApiReset() {
  var s = document.getElementById('lfiapi-search'); if (s) s.value = '';
  var m = document.getElementById('lfiapi-method-filter'); if (m) m.value = '';
  var mi = document.getElementById('lfiapi-mib-filter'); if (mi) mi.value = '';
  var p = document.getElementById('lfiapi-pii-filter'); if (p) p.value = '';
  lfiApiFilter();
}
