/* ============================================================
   ADCB Open Finance — CMI Dashboard Engine
   Rendering, navigation, AC status, phone preview
   ============================================================ */

/* ── STATE ── */
var CMI_STATES = ['draft','agreed','discuss','blocked'];
var CMI_SLBL = {draft:'Draft', agreed:'Agreed \u2713', discuss:'\u26A0 Discuss', blocked:'Blocked'};
var CMI_SCL = {draft:'cmi-c-draft', agreed:'cmi-c-agreed', discuss:'cmi-c-discuss', blocked:'cmi-c-blocked'};
var cmiAcSt = {};
var cmiBuiltPages = {};
var cmiCurrentScenario = 'default';
var cmiCurrentPhonePage = 'cmi01';

/* ── BUILD CMI PAGE ── */
function cmiRenderPage(id) {
  if (cmiBuiltPages[id]) return;
  cmiBuiltPages[id] = true;
  var screen = CMI_SCREENS[id];
  if (!screen) return;
  var el = document.getElementById('cmi-page-' + id);
  if (!el) return;

  var isBE = screen.type === 'be';
  var acs = isBE ? (screen.beACs || []) : (screen.feACs || []);
  var acCount = acs.length;
  var gapCount = (screen.gaps || []).length;
  var rstCount = (screen.rst || []).length;

  el.innerHTML =
    '<div class="cmi-screen-header">' +
      '<div class="cmi-sh-top">' +
        '<div><div class="cmi-sh-id">' + screen.id + '</div><div class="cmi-sh-name">' + screen.name + '</div></div>' +
        '<div class="cmi-sh-badges">' +
          '<span class="cmi-badge cmi-b-p1">P1 High</span>' +
          '<span class="cmi-badge ' + (isBE ? 'cmi-b-be' : 'cmi-b-fe') + '">' + (isBE ? 'Backend API' : 'Frontend') + '</span>' +
          '<span class="cmi-badge cmi-b-qa">' + acCount + ' ACs \u00B7 ' + gapCount + ' Gaps \u00B7 ' + rstCount + ' Tests</span>' +
        '</div>' +
      '</div>' +
      '<div class="cmi-story">' +
        '<div class="cmi-story-row"><span class="cmi-story-k">As a</span><span class="cmi-story-v">' + screen.story.as + '</span></div>' +
        '<div class="cmi-story-row"><span class="cmi-story-k">I want</span><span class="cmi-story-v">' + screen.story.want + '</span></div>' +
        '<div class="cmi-story-row"><span class="cmi-story-k">So that</span><span class="cmi-story-v">' + screen.story.so + '</span></div>' +
      '</div>' +
    '</div>' +
    '<div class="cmi-section-tabs" id="cmi-tabs-' + id + '">' +
      '<div class="cmi-stab active" onclick="cmiGoSection(\'' + id + '\',\'what\',this)">What it does</div>' +
      '<div class="cmi-stab" onclick="cmiGoSection(\'' + id + '\',\'ac\',this)">Acceptance Criteria <span class="cmi-stab-count">' + acCount + '</span></div>' +
      '<div class="cmi-stab" onclick="cmiGoSection(\'' + id + '\',\'gap\',this)">Gaps <span class="cmi-stab-count">' + gapCount + '</span></div>' +
      '<div class="cmi-stab" onclick="cmiGoSection(\'' + id + '\',\'rst\',this)">Test Scenarios <span class="cmi-stab-count">' + rstCount + '</span></div>' +
    '</div>' +
    '<div id="cmi-sec-' + id + '-what" class="cmi-subsection active">' + cmiBuildWhat(screen) + '</div>' +
    '<div id="cmi-sec-' + id + '-ac" class="cmi-subsection">' + cmiBuildACs(screen, id) + '</div>' +
    '<div id="cmi-sec-' + id + '-gap" class="cmi-subsection">' + cmiBuildGaps(screen) + '</div>' +
    '<div id="cmi-sec-' + id + '-rst" class="cmi-subsection">' + cmiBuildRST(screen) + '</div>' +
    '<div class="cmi-team-notes">' +
      '<div class="cmi-tn-hdr"><h3>Team Notes \u2014 ' + screen.id + '</h3></div>' +
      '<div class="cmi-tn-body">' +
        '<textarea class="cmi-tn-ta" placeholder="Sprint notes, decisions, open questions\u2026"></textarea>' +
        '<div class="cmi-tn-foot"><span style="font-size:10px;color:var(--color-text-tertiary)">Notes are not saved between sessions</span>' +
        '<button class="cmi-tn-save" onclick="this.closest(\'.cmi-tn-body\').querySelector(\'textarea\').value=\'\'">Clear</button></div>' +
      '</div>' +
    '</div>';

  acs.forEach(function(ac) { if (!cmiAcSt[ac.id]) cmiAcSt[ac.id] = 'draft'; });
}

function cmiBuildWhat(screen) {
  if (!screen.what || screen.what.length === 0) return '';
  return '<div class="cmi-what-card">' +
    '<div class="cmi-what-hdr"><h3>What this screen / API does \u2014 in plain language</h3></div>' +
    '<div class="cmi-what-body">' +
    screen.what.map(function(w) {
      return '<div class="cmi-what-item"><span class="cmi-what-icon">' + w.icon + '</span><span>' + w.text + '</span></div>';
    }).join('') +
    '</div></div>';
}

function cmiBuildACs(screen, id) {
  var isBE = screen.type === 'be';
  var acs = isBE ? (screen.beACs || []) : (screen.feACs || []);
  if (acs.length === 0) return '<p style="color:var(--color-text-secondary);font-size:13px;padding:14px">No ACs defined for this screen yet.</p>';

  var label = isBE ? 'Backend Acceptance Criteria' : 'Frontend Acceptance Criteria';
  var hint = isBE
    ? 'These define what the API must do. They can be tested by calling the API directly.'
    : 'These define what the user sees and can do. Each one is written in Given/When/Then format.';

  var items = acs.map(function(ac) {
    var hasGWT = ac.given && ac.when && ac.then;
    var previewBtn = cmiMakePreviewBtn(ac.id);
    return '<div class="cmi-ac-item" id="cmi-acitem-' + ac.id + '">' +
      '<div class="cmi-ac-row">' +
        '<span class="cmi-ac-id">' + ac.id + '</span>' +
        '<div class="cmi-ac-body">' +
          '<div class="cmi-ac-text">' + (hasGWT ? '<em>' + ac.given + '</em>, <em>' + ac.when + '</em> \u2192 <strong>' + ac.then + '</strong>' : '') + '</div>' +
          (hasGWT ? '<div class="cmi-gwt">' +
            '<div class="cmi-gwt-row"><span class="cmi-gwt-k cmi-k-given">Given</span><span class="cmi-gwt-v">' + ac.given + '</span></div>' +
            '<div class="cmi-gwt-row"><span class="cmi-gwt-k cmi-k-when">When</span><span class="cmi-gwt-v">' + ac.when + '</span></div>' +
            '<div class="cmi-gwt-row"><span class="cmi-gwt-k cmi-k-then">Then</span><span class="cmi-gwt-v">' + ac.then + '</span></div>' +
          '</div>' : '') +
          (ac.note ? '<div class="cmi-ac-note">' + ac.note + '</div>' : '') +
          '<div class="cmi-ac-actions">' + previewBtn +
            '<span class="cmi-note-btn" onclick="cmiAddNote(this)">+ Add note</span>' +
          '</div>' +
        '</div>' +
        '<span class="cmi-status-chip cmi-c-draft" onclick="cmiCycleAC(\'' + ac.id + '\',\'' + id + '\',this)">Draft</span>' +
      '</div>' +
    '</div>';
  }).join('');

  return '<div class="cmi-ac-group">' +
    '<div class="cmi-ac-group-hdr">' +
      '<h3>' + label + ' (' + acs.length + ')</h3>' +
      '<div class="cmi-ac-sum" id="cmi-sum-' + id + '"></div>' +
    '</div>' +
    '<div class="cmi-ac-hint">' + hint + '</div>' +
    items +
  '</div>';
}

function cmiBuildGaps(screen) {
  var gaps = screen.gaps || [];
  if (gaps.length === 0) return '<div class="box box-succ" style="margin:14px 0">No gaps identified. Requirements appear clear and complete.</div>';

  var high = gaps.filter(function(g){return g.sev==='high';}).length;
  var med = gaps.filter(function(g){return g.sev==='medium';}).length;
  var low = gaps.filter(function(g){return g.sev==='low';}).length;

  var intro = '<div class="box box-warn"><p>A <strong>gap</strong> is something in the requirements that is unclear, missing, or contradictory. Each gap has a <strong>risk</strong> (what goes wrong if ignored) and a <strong>fix</strong> (what needs to happen).</p></div>';

  var items = gaps.map(function(g) {
    var sevClass = {high:'cmi-gap-high', medium:'cmi-gap-med', low:'cmi-gap-low'}[g.sev];
    var sevTag = {high:'cmi-sev-h', medium:'cmi-sev-m', low:'cmi-sev-l'}[g.sev];
    var sevLabel = {high:'High', medium:'Medium', low:'Low'}[g.sev];
    return '<div class="cmi-gap-item ' + sevClass + '">' +
      '<div class="cmi-gap-row">' +
        '<span class="cmi-gap-id">' + g.id + '</span>' +
        '<div class="cmi-gap-body">' +
          '<div class="cmi-gap-title-row">' +
            '<div class="cmi-gap-title">' + g.title + '</div>' +
            '<span class="cmi-sev ' + sevTag + '">' + sevLabel + '</span>' +
          '</div>' +
          '<div class="cmi-gap-what">' + g.what + '</div>' +
          '<div class="cmi-gap-blocks">' +
            '<div class="cmi-gap-block cmi-block-risk"><strong>Risk:</strong> ' + g.risk + '</div>' +
            '<div class="cmi-gap-block cmi-block-fix"><strong>Fix:</strong> ' + g.fix + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  return intro + '<div class="cmi-gap-card">' +
    '<div class="cmi-gap-card-hdr">' +
      '<h3>Gaps (' + gaps.length + ')</h3>' +
      '<div class="cmi-gap-counts">' +
        (high > 0 ? '<span class="cmi-gcnt cmi-gcnt-h">' + high + ' High</span>' : '') +
        (med > 0 ? '<span class="cmi-gcnt cmi-gcnt-m">' + med + ' Medium</span>' : '') +
        (low > 0 ? '<span class="cmi-gcnt cmi-gcnt-l">' + low + ' Low</span>' : '') +
      '</div>' +
    '</div>' + items + '</div>';
}

function cmiBuildRST(screen) {
  var tests = screen.rst || [];
  if (tests.length === 0) return '<p style="color:var(--color-text-secondary);font-size:13px;padding:14px">No test scenarios defined yet.</p>';

  var levelLabel = {integration:'Integration Test', system:'System Test', uat:'UAT Test'};
  var tagClass = {integration:'cmi-rt-int', system:'cmi-rt-sys', uat:'cmi-rt-uat'};

  var intro = '<div class="box box-navy"><p><strong>RST (Rapid Software Testing) approach by James Bach.</strong> Each test explains <em>why it matters</em> before explaining what to do. The goal is to find real problems.</p></div>';

  var items = tests.map(function(t) {
    var previewBtn = cmiMakePreviewBtn(t.id);
    var steps = (t.steps || []).map(function(s, i) {
      return '<div class="cmi-rst-step">' +
        '<span class="cmi-rst-step-n">' + (i + 1) + '</span>' +
        '<div class="cmi-rst-step-body">' + s.do +
          '<span class="cmi-rst-expected">\u2192 Expected: ' + s.expect + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="cmi-rst-item">' +
      '<div class="cmi-rst-row">' +
        '<span class="cmi-rst-id">' + t.id + '</span>' +
        '<div class="cmi-rst-body">' +
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px">' +
            '<div class="cmi-rst-title">' + t.title + '</div>' + previewBtn +
          '</div>' +
          '<div class="cmi-rst-tags">' +
            '<span class="cmi-rtag ' + tagClass[t.level] + '">' + levelLabel[t.level] + '</span>' +
            '<span class="cmi-rtag" style="background:#FFF7ED;color:#9A3412">RST Approach</span>' +
          '</div>' +
          '<div class="cmi-rst-why">' +
            '<div class="cmi-rst-why-title">Why this test matters</div>' + t.why +
          '</div>' +
          '<div class="cmi-rst-steps">' + steps + '</div>' +
          '<div class="cmi-rst-impact">' +
            '<span class="cmi-rst-impact-title">Impact if this fails</span>' + t.impact +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  return intro + '<div class="cmi-rst-card">' +
    '<div class="cmi-rst-card-hdr"><h3>Test Scenarios (' + tests.length + ')</h3></div>' +
    items + '</div>';
}

/* ── PREVIEW BUTTON ── */
function cmiMakePreviewBtn(acId) {
  var entry = CMI_AC_PREVIEW_MAP[acId];
  if (!entry) return '';
  var parts = entry.split('|');
  return '<span class="cmi-preview-btn" onclick="cmiOpenPhone(\'' + parts[0] + '\',\'' + parts[1] + '\')">\u25B6 Preview</span>';
}

/* ── SECTION NAVIGATION ── */
function cmiGoSection(pageId, sectionId, tabEl) {
  var tabs = document.getElementById('cmi-tabs-' + pageId);
  if (tabs) tabs.querySelectorAll('.cmi-stab').forEach(function(t){ t.classList.remove('active'); });
  if (tabEl) tabEl.classList.add('active');
  ['what','ac','gap','rst'].forEach(function(s) {
    var el = document.getElementById('cmi-sec-' + pageId + '-' + s);
    if (el) el.classList.remove('active');
  });
  var target = document.getElementById('cmi-sec-' + pageId + '-' + sectionId);
  if (target) target.classList.add('active');
}

/* ── AC STATUS CYCLING ── */
function cmiCycleAC(id, pageId, el) {
  var nxt = CMI_STATES[(CMI_STATES.indexOf(cmiAcSt[id] || 'draft') + 1) % 4];
  cmiAcSt[id] = nxt;
  el.className = 'cmi-status-chip ' + CMI_SCL[nxt];
  el.textContent = CMI_SLBL[nxt];
  cmiUpdateSum(pageId);
  cmiUpdateProgress();
}

function cmiUpdateSum(pageId) {
  var screen = CMI_SCREENS[pageId];
  if (!screen) return;
  var isBE = screen.type === 'be';
  var acs = isBE ? (screen.beACs || []) : (screen.feACs || []);
  var el = document.getElementById('cmi-sum-' + pageId);
  if (!el) return;
  var c = {draft:0, agreed:0, discuss:0, blocked:0};
  acs.forEach(function(ac){ c[cmiAcSt[ac.id] || 'draft']++; });
  el.innerHTML = '';
  if (c.agreed > 0) el.innerHTML += '<span class="cmi-sum-chip cmi-sum-agreed">' + c.agreed + ' Agreed</span>';
  if (c.discuss > 0) el.innerHTML += '<span class="cmi-sum-chip cmi-sum-discuss">' + c.discuss + ' Discuss</span>';
  if (c.blocked > 0) el.innerHTML += '<span class="cmi-sum-chip cmi-sum-blocked">' + c.blocked + ' Blocked</span>';
  var d = acs.length - c.agreed - c.discuss - c.blocked;
  if (d > 0) el.innerHTML += '<span class="cmi-sum-chip cmi-sum-draft">' + d + ' Draft</span>';
}

function cmiUpdateProgress() {
  var all = Object.values(cmiAcSt);
  var a = all.filter(function(s){return s==='agreed';}).length;
  var w = all.filter(function(s){return s==='discuss';}).length;
  var b = all.filter(function(s){return s==='blocked';}).length;
  var d = 50 - a - w - b;
  var cntA = document.getElementById('cmi-cnt-a'); if (cntA) cntA.textContent = a;
  var cntW = document.getElementById('cmi-cnt-w'); if (cntW) cntW.textContent = w;
  var cntB = document.getElementById('cmi-cnt-b'); if (cntB) cntB.textContent = b;
  var cntD = document.getElementById('cmi-cnt-d'); if (cntD) cntD.textContent = d;
  var pf = document.getElementById('cmi-pf'); if (pf) pf.style.width = Math.round(a / 50 * 100) + '%';
}

/* ── NOTES ── */
function cmiAddNote(btn) {
  btn.style.display = 'none';
  var wrap = document.createElement('div');
  wrap.className = 'cmi-note-wrap';
  wrap.innerHTML = '<textarea class="cmi-note-input" rows="2" placeholder="Add your note\u2026"></textarea><div class="cmi-note-btns"><button class="cmi-n-save" onclick="cmiSaveNote(this)">Save</button><button class="cmi-n-cancel" onclick="cmiCancelNote(this)">Cancel</button></div>';
  btn.parentElement.insertBefore(wrap, btn.nextSibling);
  wrap.querySelector('textarea').focus();
}
function cmiSaveNote(btn) {
  var w = btn.closest('.cmi-note-wrap');
  var v = w.querySelector('textarea').value.trim();
  if (!v) { cmiCancelNote(btn); return; }
  var n = document.createElement('div');
  n.className = 'cmi-saved-note';
  n.innerHTML = '<strong>Note:</strong> ' + v + ' <span style="float:right;cursor:pointer;color:#93C5FD;font-size:10px" onclick="this.parentElement.remove()">\u2715</span>';
  w.replaceWith(n);
  var ab = n.closest('.cmi-ac-actions');
  if (ab) { var nb = ab.querySelector('.cmi-note-btn'); if (nb) nb.style.display = ''; }
}
function cmiCancelNote(btn) {
  var w = btn.closest('.cmi-note-wrap');
  var ab = w.closest('.cmi-ac-actions');
  if (ab) { var nb = ab.querySelector('.cmi-note-btn'); if (nb) nb.style.display = ''; }
  w.remove();
}

/* ── CMI PAGE NAVIGATION (within CMI section) ── */
function cmiGoToScreen(id) {
  navigate('cmi', 'tab-cmi-' + id);
}

/* ── PHONE PREVIEW ── */
function cmiOpenPhone(page, scenario) {
  cmiCurrentPhonePage = page;
  document.getElementById('cmi-phoneModal').classList.add('open');
  var scenarios = CMI_SCENARIOS[page] || [];
  var strip = document.getElementById('cmi-scenarioStrip');
  strip.innerHTML = scenarios.map(function(s){
    return '<button class="cmi-sc-btn' + (s.id === scenario ? ' on' : '') + '" onclick="cmiRunScenario(\'' + s.id + '\',this)">' + s.label + '</button>';
  }).join('');
  document.getElementById('cmi-modal-title').textContent = page.toUpperCase() + ' \u2014 Screen Preview';
  cmiRenderPhoneBody(scenario || (scenarios[0] ? scenarios[0].id : 'default'));
}

function cmiRunScenario(id, btn) {
  document.querySelectorAll('.cmi-sc-btn').forEach(function(b){b.classList.remove('on');});
  btn.classList.add('on');
  cmiRenderPhoneBody(id);
  var detMap = {vrp:1,single:5,combined:3,intl:4,readonly:1,ac30:0,ac28:0,'default':null};
  if (detMap[id] !== undefined && detMap[id] !== null) {
    setTimeout(function(){ cmiPhoneOpenDet(detMap[id]); }, 100);
  }
}

function cmiClosePhone() { document.getElementById('cmi-phoneModal').classList.remove('open'); }

function cmiUpdateDevPanel(scenario) {
  var key = cmiCurrentPhonePage + '|' + scenario;
  var devBody = document.getElementById('cmi-devBody');
  var devTitle = document.getElementById('cmi-dev-title');
  if (!devBody) return;
  if (typeof CMI_SCENARIO_APIS !== 'undefined' && CMI_SCENARIO_APIS[key]) {
    var api = CMI_SCENARIO_APIS[key];
    devBody.innerHTML = api.html;
    if (devTitle) devTitle.textContent = api.title;
  } else {
    devBody.innerHTML = '<div style="padding:20px;text-align:center;color:#8B949E;font-size:12px;">Select a scenario to see API calls</div>';
    if (devTitle) devTitle.textContent = 'API Calls';
  }
}

function cmiRenderPhoneBody(scenario) {
  cmiCurrentScenario = scenario;
  var body = document.getElementById('cmi-pPhoneBody');
  cmiPhoneCloseDet();
  cmiPhoneCloseFilter();
  cmiUpdateDevPanel(scenario);
  var cnf = document.getElementById('cmi-pConfirm'); if (cnf) cnf.classList.remove('open');

  var isHistory = ['history','ac12','ac13'].indexOf(scenario) >= 0;
  document.getElementById('cmi-ptab-c').classList.toggle('on', !isHistory);
  document.getElementById('cmi-ptab-h').classList.toggle('on', isHistory);

  var html = '';

  if (scenario === 'ac08') {
    html = cmiPhoneSearchBar() + '<div style="flex:1;overflow-y:auto"><div class="cmi-empty-state"><div class="cmi-empty-icon">\uD83D\uDCCB</div><div class="cmi-empty-title">No active consents found</div><div class="cmi-empty-sub">No consents are currently in Authorized state.</div></div></div>';
    body.innerHTML = html; return;
  }
  if (scenario === 'ac07') html += '<div class="cmi-stale-banner">\u26A0 API Hub unreachable \u2014 showing cached data <span style="font-weight:700;text-decoration:underline;cursor:pointer">Retry</span></div>';

  if (!isHistory) {
    var expActive = scenario === 'ac06' ? ' active' : '';
    var authActive = !expActive ? ' active' : '';
    html += '<div class="cmi-p-strip">' +
      '<div class="cmi-p-stat' + authActive + '" onclick="cmiFilterByStat(\'auth\',this)"><div class="cmi-p-stat-n cmi-n-g">142</div><div class="cmi-p-stat-l">Authorized</div></div>' +
      '<div class="cmi-p-stat" onclick="cmiFilterByStat(\'susp\',this)"><div class="cmi-p-stat-n cmi-n-a">8</div><div class="cmi-p-stat-l">Suspended</div></div>' +
      '<div class="cmi-p-stat' + expActive + '" onclick="cmiFilterByStat(\'exp\',this)"><div class="cmi-p-stat-n cmi-n-r">12</div><div class="cmi-p-stat-l">Expiring&lt;30d</div></div>' +
      '<div class="cmi-p-stat" onclick="cmiFilterByStat(\'all\',this)"><div class="cmi-p-stat-n cmi-n-n">162</div><div class="cmi-p-stat-l">All</div></div>' +
    '</div>';
  }

  if (scenario === 'ac18') {
    html += '<div class="cmi-sort-bar"><span style="font-size:10px;font-weight:700;color:var(--color-text-secondary);white-space:nowrap">Sort:</span>' +
      '<span class="cmi-sort-chip on">Consent ID \u2193</span><span class="cmi-sort-chip">Expiry</span><span class="cmi-sort-chip">LFI</span><span class="cmi-sort-chip">Status</span></div>';
  }

  if (scenario === 'ac16') {
    html += '<div class="cmi-p-search"><div class="cmi-p-sinp"><svg width="13" height="13" fill="none" stroke="#bbb" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input placeholder="Search LFI name or Account/IBAN\u2026" oninput="cmiPhoneFilterSearch(this.value)"></div><div class="cmi-p-fbtn" onclick="cmiPhoneOpenFilter()"><svg width="13" height="13" fill="none" stroke="#fff" stroke-width="2.2" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg></div></div>' +
      '<div style="padding:7px 11px;font-size:10px;color:var(--color-text-secondary);background:#fff;border-bottom:1px solid var(--color-border);flex-shrink:0">Results appear within 500ms \u00B7 Search by LFI name or Account/IBAN</div>';
  } else if (!isHistory && scenario !== 'ac08' && scenario !== 'ac18') {
    html += cmiPhoneSearchBar();
  }

  if (isHistory) {
    html += '<div class="cmi-p-toolbar"><span class="cmi-p-count">4 records \u00B7 7-year retention (CBUAE)</span><button class="cmi-p-export" onclick="cmiSimulateExport(this)">Export CSV</button></div>';
    html += '<div class="cmi-p-scroll"><div class="cmi-p-list">' + cmiRenderHistoryCards(scenario) + '</div></div>';
  } else if (scenario === 'ac06') {
    var f = CMI_CONSENT_DATA.filter(function(c){return c.warn;});
    html += '<div style="background:var(--color-warning-light);border-bottom:1px solid #FDE68A;padding:6px 11px;font-size:10px;color:var(--color-warning-dark);flex-shrink:0">\u26A0 Filtered: Expiring \u226430 days \u2014 ' + f.length + ' of 162 consents</div>';
    html += '<div class="cmi-p-scroll"><div class="cmi-p-list" id="cmi-pListC">' + f.map(cmiRenderCard).join('') + '</div></div>';
  } else if (scenario === 'ac02') {
    html += '<div style="background:var(--color-success-light);border-bottom:1px solid #86EFAC;padding:6px 11px;font-size:10px;color:var(--color-success-dark);flex-shrink:0">New consent appeared within 30 seconds</div>';
    html += '<div class="cmi-p-scroll"><div class="cmi-p-list" id="cmi-pListC">' + CMI_CONSENT_DATA.map(cmiRenderCard).join('') + '</div></div>';
  } else {
    html += '<div class="cmi-p-scroll"><div class="cmi-p-list" id="cmi-pListC">' + CMI_CONSENT_DATA.map(cmiRenderCard).join('') + '</div></div>';
  }

  body.innerHTML = html;

  if (scenario === 'ac04') {
    setTimeout(function(){ document.querySelectorAll('.cmi-p-card').forEach(function(c){ if(c.innerHTML.indexOf('Combined')>=0){c.style.border='2px solid var(--color-primary)';c.style.background='#fff8f8';}}); }, 50);
  }
  if (scenario === 'ac03') {
    setTimeout(function(){ document.querySelectorAll('.cmi-p-card').forEach(function(c){ if(c.innerHTML.indexOf('\u26A0')>=0){c.style.border='2px solid var(--color-warning)';c.style.background='var(--color-warning-light)';}}); }, 50);
  }
}

function cmiPhoneSearchBar() {
  return '<div class="cmi-p-search"><div class="cmi-p-sinp"><svg width="13" height="13" fill="none" stroke="#bbb" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input placeholder="Search LFI name or Account/IBAN\u2026" oninput="cmiPhoneFilterSearch(this.value)"></div><div class="cmi-p-fbtn" onclick="cmiPhoneOpenFilter()"><svg width="13" height="13" fill="none" stroke="#fff" stroke-width="2.2" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg></div></div>';
}

function cmiRenderCard(c) {
  return '<div class="cmi-p-card" onclick="cmiPhoneOpenDet(' + c.i + ')">' +
    '<div class="cmi-p-ct"><div class="cmi-p-av" style="background:' + c.ac + '">' + c.av + '</div>' +
    '<div class="cmi-p-cm"><div class="cmi-p-lfi">' + c.lfi + '</div><div class="cmi-p-cid">' + c.id + '</div></div>' +
    '<span class="cmi-pb ' + c.sb + '">' + c.st + '</span></div>' +
    '<div class="cmi-p-cb"><span class="cmi-pb ' + c.tb + '">' + c.type + '</span>' +
    '<span class="cmi-p-exp' + (c.warn ? ' warn' : '') + '">' + (c.warn ? '\u26A0 ' : '') + c.exp + '</span></div></div>';
}

function cmiRenderHistoryCards(scenario) {
  var autoExpand = scenario === 'ac12';
  return CMI_HISTORY_DATA.map(function(h, i) {
    var tlOpen = (autoExpand && i === 0) ? 'open' : '';
    return '<div class="cmi-p-card">' +
      '<div class="cmi-p-ct"><div class="cmi-p-av" style="background:' + h.ac + ';width:28px;height:28px;font-size:8px">' + h.av + '</div>' +
      '<div class="cmi-p-cm"><div class="cmi-p-lfi">' + h.lfi + '</div><div class="cmi-p-cid">' + h.id + '</div></div>' +
      '<span class="cmi-pb ' + h.sb + '">' + h.st + '</span></div>' +
      '<div class="cmi-p-cb" style="margin-bottom:5px"><span class="cmi-pb ' + h.tb + '">' + h.type + '</span><span style="font-size:9px;color:var(--color-text-secondary)">' + h.tDate + '</span></div>' +
      '<div class="cmi-p-hreason">' + h.reason + '</div>' +
      '<div class="cmi-p-tltog" onclick="cmiPhoneToggleTL(this,\'cmi-htl' + i + '\')"><svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="transition:transform .2s' + (autoExpand && i === 0 ? ';transform:rotate(180deg)' : '') + '"><polyline points="6 9 12 15 18 9"/></svg> Activity Timeline</div>' +
      '<div class="cmi-p-tlbody ' + tlOpen + '" id="cmi-htl' + i + '">' +
      h.tl.map(function(t){ return '<div class="cmi-p-tlrow"><div class="cmi-p-tldot" style="background:' + t.c + '"></div><div><div class="cmi-p-tlev">' + t.ev + '</div><div class="cmi-p-tlt">' + t.t + '</div></div></div>'; }).join('') +
      '</div></div>';
  }).join('');
}

function cmiPhoneToggleTL(el, id) {
  var b = document.getElementById(id); if (!b) return;
  var open = b.classList.toggle('open');
  el.querySelector('svg').style.transform = open ? 'rotate(180deg)' : '';
}

function cmiFilterByStat(type, el) {
  document.querySelectorAll('.cmi-p-stat').forEach(function(s){s.classList.remove('active');});
  if (el) el.classList.add('active');
  var l = document.getElementById('cmi-pListC'); if (!l) return;
  var f = type === 'auth' ? CMI_CONSENT_DATA.filter(function(c){return c.st==='Authorized';}) :
          type === 'susp' ? CMI_CONSENT_DATA.filter(function(c){return c.st==='Suspended';}) :
          type === 'exp' ? CMI_CONSENT_DATA.filter(function(c){return c.warn;}) : CMI_CONSENT_DATA;
  l.innerHTML = f.length ? f.map(cmiRenderCard).join('') : '<div class="cmi-empty-state"><div class="cmi-empty-icon">\uD83D\uDCCB</div><div class="cmi-empty-title">No results</div></div>';
}

function cmiPhoneFilterSearch(v) {
  var l = document.getElementById('cmi-pListC'); if (!l) return;
  var q = v.toLowerCase();
  if (q.length < 3) { l.innerHTML = CMI_CONSENT_DATA.map(cmiRenderCard).join(''); return; }
  var f = CMI_CONSENT_DATA.filter(function(c){ return c.lfi.toLowerCase().indexOf(q) >= 0 || c.id.toLowerCase().indexOf(q) >= 0 || c.type.toLowerCase().indexOf(q) >= 0; });
  l.innerHTML = f.length ? f.map(cmiRenderCard).join('') : '<div class="cmi-empty-state"><div class="cmi-empty-icon">\uD83D\uDD0D</div><div class="cmi-empty-title">No results for "' + v + '"</div></div>';
}

function cmiSimulateExport(btn) {
  btn.textContent = 'Downloading\u2026';
  btn.style.background = 'var(--color-success)';
  setTimeout(function(){ btn.textContent = '\u2713 Downloaded'; }, 900);
  setTimeout(function(){ btn.textContent = 'Export CSV'; btn.style.background = ''; }, 2500);
}

/* Detail pane */
function cmiPhoneOpenDet(idx) {
  var c = CMI_CONSENT_DATA[idx]; var sc = cmiCurrentScenario;
  var isVRP = c.pt === 'vrp', isIntl = c.pt === 'intl', isComb = c.pt === 'comb', isSingle = c.pt === 'single';
  var isReadOnly = sc === 'readonly'; var showConfirm = sc === 'ac30';

  var html = '<div class="cmi-p-hero"><div class="cmi-p-hbdg"><span class="cmi-pb ' + c.tb + '">' + c.type + '</span><span class="cmi-pb ' + c.sb + '">' + c.st + '</span></div>' +
    '<div class="cmi-p-hcid">' + c.id + '</div>' +
    '<div class="cmi-p-hlfi"><div style="width:18px;height:18px;border-radius:4px;background:' + c.ac + ';display:inline-flex;align-items:center;justify-content:center;font-size:7px;font-weight:800;color:#fff">' + c.av + '</div>&nbsp;' + c.lfi + '</div>' +
    '<div class="cmi-p-hdates"><div class="cmi-p-hdate"><label>IBAN</label><span style="font-size:10px">AE** **** 4521</span></div><div class="cmi-p-hdate"><label>Expiry</label><span>' + c.exp + '</span></div></div>';

  if (isReadOnly) html += '<div class="cmi-p-readonly">Revoked \u2014 view is read-only. No actions available.</div>';
  else if (c.st === 'Authorized') html += '<div class="cmi-p-hacts"><div class="cmi-p-hact cmi-p-rev" onclick="cmiOpenConfirm(\'' + c.id + '\',\'' + c.lfi + '\')">Revoke</div><div class="cmi-p-hact cmi-p-sus">Suspend</div></div>';
  else if (c.st === 'Suspended') html += '<div class="cmi-p-hacts"><div class="cmi-p-hact cmi-p-rev" onclick="cmiOpenConfirm(\'' + c.id + '\',\'' + c.lfi + '\')">Revoke</div><div class="cmi-p-hact cmi-p-rea">Reactivate</div></div>';

  html += '</div>';

  html += '<div class="cmi-p-dtabs" id="cmi-pDTabs"><div class="cmi-p-dtab on" onclick="cmiPhoneSwDT(this,\'ov\')">Overview</div><div class="cmi-p-dtab" onclick="cmiPhoneSwDT(this,\'perms\')">Permissions</div>';
  if (isVRP||isIntl||isComb||isSingle) html += '<div class="cmi-p-dtab" onclick="cmiPhoneSwDT(this,\'pay\')">Payment</div>';
  if (isVRP) html += '<div class="cmi-p-dtab" onclick="cmiPhoneSwDT(this,\'payh\')">Pay History</div>';
  if (isComb) html += '<div class="cmi-p-dtab" onclick="cmiPhoneSwDT(this,\'rar\')">Combined</div>';
  html += '<div class="cmi-p-dtab" onclick="cmiPhoneSwDT(this,\'tl\')">Timeline</div></div>';

  // Overview tab
  html += '<div id="cmi-dov" class="cmi-dp on"><div class="cmi-dp-card"><div class="cmi-dp-title">Consent Details</div>' +
    '<div class="cmi-dp-row"><span class="cmi-dp-k">LFI</span><span class="cmi-dp-v">' + c.lfi + '</span></div>' +
    '<div class="cmi-dp-row"><span class="cmi-dp-k">Account/IBAN</span><span class="cmi-dp-v" style="font-family:var(--font-family-mono);font-size:10px">AE** **** 4521</span></div>' +
    '<div class="cmi-dp-row"><span class="cmi-dp-k">Type</span><span class="cmi-dp-v">' + c.type + '</span></div>' +
    '<div class="cmi-dp-row"><span class="cmi-dp-k">Status</span><span class="cmi-dp-v"><span class="cmi-pb ' + c.sb + '">' + c.st + '</span></span></div>' +
    '<div class="cmi-dp-row"><span class="cmi-dp-k">Expiry</span><span class="cmi-dp-v">' + c.exp + '</span></div>' +
    '<div class="cmi-dp-row"><span class="cmi-dp-k">Last Payment</span><span class="cmi-dp-v">05/03/2026</span></div>' +
    '<div class="cmi-dp-row"><span class="cmi-dp-k">Total Paid</span><span class="cmi-dp-v">AED 4,200</span></div></div></div>';

  // Permissions tab
  html += '<div id="cmi-dperms" class="cmi-dp"><div class="cmi-dp-card"><div class="cmi-dp-title">Granted Permissions</div>' +
    '<div class="cmi-dp-prow"><div class="cmi-dp-pdot"></div><div><div class="cmi-dp-pl">ReadAccountsBasic / Detail</div><div class="cmi-dp-ps">Account Information</div></div></div>' +
    '<div class="cmi-dp-prow"><div class="cmi-dp-pdot"></div><div><div class="cmi-dp-pl">ReadBalances</div><div class="cmi-dp-ps">Balances cluster</div></div></div>' +
    '<div class="cmi-dp-prow"><div class="cmi-dp-pdot"></div><div><div class="cmi-dp-pl">ReadTransactions</div><div class="cmi-dp-ps">Transactions cluster</div></div></div>' +
    (isVRP||isSingle||isIntl ? '<div class="cmi-dp-prow"><div class="cmi-dp-pdot"></div><div><div class="cmi-dp-pl">PaymentInitiation</div><div class="cmi-dp-ps">Initiate payments</div></div></div>' : '') +
    '</div></div>';

  // Payment tab
  if (isVRP) html += '<div id="cmi-dpay" class="cmi-dp"><div class="cmi-dp-card"><div class="cmi-dp-title">Multi-Payment Parameters (VRP)</div><div class="cmi-dp-row"><span class="cmi-dp-k">Schedule</span><span class="cmi-dp-v">VariablePeriodicSchedule</span></div><div class="cmi-dp-row"><span class="cmi-dp-k">Max/Transaction</span><span class="cmi-dp-v">AED 5,000</span></div><div class="cmi-dp-row"><span class="cmi-dp-k">Frequency</span><span class="cmi-dp-v">Weekly</span></div></div><div class="cmi-dp-card"><div class="cmi-dp-title">Creditors (3 of max 10)</div><div class="cmi-dp-credrow"><div><div class="cmi-dp-cn">DEWA</div><div class="cmi-dp-ci">AE** **** 7890</div></div><div class="cmi-dp-ca">AED 3,000</div></div><div class="cmi-dp-credrow"><div><div class="cmi-dp-cn">Etisalat</div><div class="cmi-dp-ci">AE** **** 1234</div></div><div class="cmi-dp-ca">AED 1,500</div></div><div class="cmi-dp-credrow"><div><div class="cmi-dp-cn">Salik</div><div class="cmi-dp-ci">AE** **** 5678</div></div><div class="cmi-dp-ca">AED 500</div></div></div></div>';
  else if (isSingle) html += '<div id="cmi-dpay" class="cmi-dp"><div class="cmi-dp-card"><div class="cmi-dp-title">Single Immediate Payment</div><div class="cmi-dp-row"><span class="cmi-dp-k">Amount</span><span class="cmi-dp-v">AED 3,500.00</span></div><div class="cmi-dp-row"><span class="cmi-dp-k">Creditor IBAN</span><span class="cmi-dp-v" style="font-family:var(--font-family-mono)">AE** **** <strong>9045</strong></span></div><div class="cmi-dp-row"><span class="cmi-dp-k">CoP Result</span><span class="cmi-dp-v" style="color:var(--color-success);font-weight:800">Match \u2713</span></div></div></div>';
  else if (isIntl) html += '<div id="cmi-dpay" class="cmi-dp"><div class="cmi-dp-card"><div class="cmi-dp-title">International Payment</div><div class="cmi-dp-row"><span class="cmi-dp-k">Amount</span><span class="cmi-dp-v">USD 10,000.00</span></div><div class="cmi-dp-row"><span class="cmi-dp-k">FX Rate</span><span class="cmi-dp-v">1 USD = 3.6725 AED</span></div><div class="cmi-dp-row"><span class="cmi-dp-k">AED 15K Limit</span><span class="cmi-dp-v"><span class="cmi-pb cmi-bauth">Passed \u2713</span></span></div><div class="cmi-dp-row"><span class="cmi-dp-k">Creditor IBAN</span><span class="cmi-dp-v" style="font-family:var(--font-family-mono)">GB** **** <strong>6712</strong></span></div></div></div>';
  else if (isComb) html += '<div id="cmi-dpay" class="cmi-dp"><div class="cmi-dp-card"><div class="cmi-dp-title">Combined Consent (2 RAR Objects)</div><div class="cmi-dp-row"><span class="cmi-dp-k">RAR 1</span><span class="cmi-dp-v">Data Sharing</span></div><div class="cmi-dp-row"><span class="cmi-dp-k">RAR 2</span><span class="cmi-dp-v">Domestic Payment</span></div></div></div>';

  // Payment history tab
  if (isVRP) html += '<div id="cmi-dpayh" class="cmi-dp"><div class="cmi-dp-card"><div class="cmi-dp-title">Payment History (23 total)</div><div class="cmi-dp-phr"><div><div class="cmi-dp-pid">PAY-20260401-001</div><div class="cmi-dp-pd">01 Apr 2026 \u00B7 DEWA</div></div><div style="text-align:right"><div class="cmi-dp-pa">AED 2,800</div><span class="cmi-pb cmi-bauth">Completed</span></div></div><div class="cmi-dp-phr"><div><div class="cmi-dp-pid">PAY-20260318-007</div><div class="cmi-dp-pd">18 Mar 2026 \u00B7 Salik</div></div><div style="text-align:right"><div class="cmi-dp-pa">AED 500</div><span class="cmi-pb cmi-brev">Failed</span></div></div></div></div>';

  // Combined RAR tab
  if (isComb) html += '<div id="cmi-drar" class="cmi-dp"><div class="cmi-dp-card"><div class="cmi-dp-title">Combined \u2014 Select RAR Object</div><div class="cmi-rar-tabs"><div class="cmi-rar-tab on" onclick="cmiSwRar(this,\'cmi-rar1\')">RAR 1: Data Sharing</div><div class="cmi-rar-tab" onclick="cmiSwRar(this,\'cmi-rar2\')">RAR 2: Payment</div></div><div id="cmi-rar1"><div class="cmi-dp-prow"><div class="cmi-dp-pdot"></div><div><div class="cmi-dp-pl">ReadAccountsBasic</div></div></div><div class="cmi-dp-prow"><div class="cmi-dp-pdot"></div><div><div class="cmi-dp-pl">ReadBalances</div></div></div></div><div id="cmi-rar2" style="display:none"><div class="cmi-dp-row"><span class="cmi-dp-k">Type</span><span class="cmi-dp-v">Domestic Payment</span></div><div class="cmi-dp-row"><span class="cmi-dp-k">Amount</span><span class="cmi-dp-v">AED 1,200.00</span></div></div></div></div>';

  // Timeline tab
  html += '<div id="cmi-dtl" class="cmi-dp"><div class="cmi-dp-card"><div class="cmi-dp-title">Activity Timeline</div>' +
    '<div class="cmi-dp-tlr"><div class="cmi-dp-tlc"><div class="cmi-dp-tld" style="background:#6366F1"></div><div class="cmi-dp-tll"></div></div><div><div class="cmi-dp-tev">Consent Created (PAR submitted)</div><div class="cmi-dp-tm">ADCB-TPP \u00B7 15 Feb 2026 14:28</div></div></div>' +
    '<div class="cmi-dp-tlr"><div class="cmi-dp-tlc"><div class="cmi-dp-tld" style="background:#F59E0B"></div><div class="cmi-dp-tll"></div></div><div><div class="cmi-dp-tev">CAAP SCA Initiated</div><div class="cmi-dp-tm">AlTareq push \u00B7 14:31</div></div></div>' +
    '<div class="cmi-dp-tlr"><div class="cmi-dp-tlc"><div class="cmi-dp-tld" style="background:#16A34A"></div></div><div><div class="cmi-dp-tev">Authorized via EFR Biometric</div><div class="cmi-dp-tm">Customer \u00B7 15 Feb 2026 14:32</div></div></div>' +
    '</div></div>';

  document.getElementById('cmi-pDetInner').innerHTML = html;
  document.getElementById('cmi-pDet').classList.add('open');
  document.getElementById('cmi-pDet').querySelector('.cmi-p-detscroll').scrollTop = 0;
  if (showConfirm) setTimeout(function(){ cmiOpenConfirm(c.id, c.lfi); }, 300);
}

function cmiPhoneCloseDet() { document.getElementById('cmi-pDet').classList.remove('open'); }

function cmiPhoneSwDT(el, p) {
  document.getElementById('cmi-pDTabs').querySelectorAll('.cmi-p-dtab').forEach(function(t){t.classList.remove('on');});
  el.classList.add('on');
  ['ov','perms','pay','payh','rar','tl'].forEach(function(id){
    var d = document.getElementById('cmi-d' + id); if (d) d.classList.remove('on');
  });
  var dp = document.getElementById('cmi-d' + p); if (dp) dp.classList.add('on');
}

function cmiSwRar(el, id) {
  el.closest('.cmi-rar-tabs').querySelectorAll('.cmi-rar-tab').forEach(function(t){t.classList.remove('on');});
  el.classList.add('on');
  ['cmi-rar1','cmi-rar2'].forEach(function(r){ var d = document.getElementById(r); if (d) d.style.display = 'none'; });
  var d = document.getElementById(id); if (d) d.style.display = '';
}

function cmiPhoneSwTab(t) {
  document.getElementById('cmi-ptab-c').classList.toggle('on', t === 'c');
  document.getElementById('cmi-ptab-h').classList.toggle('on', t === 'h');
  if (t === 'h') cmiRenderPhoneBody('history'); else cmiRenderPhoneBody('default');
}

function cmiPhoneOpenFilter() { document.getElementById('cmi-pFilter').classList.add('open'); }
function cmiPhoneCloseFilter() { document.getElementById('cmi-pFilter').classList.remove('open'); }
function cmiPhoneToggleChip(el) { el.classList.toggle('on'); }

function cmiOpenConfirm(id, lfi) {
  document.getElementById('cmi-dlg-cid').textContent = id;
  document.getElementById('cmi-dlg-lfi').textContent = lfi;
  document.getElementById('cmi-pConfirm').classList.add('open');
}
function cmiCloseConfirm() { document.getElementById('cmi-pConfirm').classList.remove('open'); }
function cmiConfirmRevoke() {
  cmiCloseConfirm();
  var bar = document.createElement('div');
  bar.style = 'position:absolute;bottom:0;left:0;right:0;background:var(--color-success-light);border-top:1px solid #86EFAC;padding:8px 13px;font-size:11px;color:var(--color-success-dark);z-index:40;display:flex;align-items:center;gap:6px';
  bar.innerHTML = '\u2713 Consent revoked \u00B7 Audit log created \u00B7 LFI notified';
  document.getElementById('cmi-thePhone').appendChild(bar);
  setTimeout(function(){ bar.remove(); }, 3000);
  cmiPhoneCloseDet();
}

function cmiPhoneApplyFilters() { cmiPhoneCloseFilter(); }
function cmiPhoneClearFilters() {
  document.querySelectorAll('#cmi-fStatus .cmi-p-chip, #cmi-fType .cmi-p-chip, #cmi-fLFI .cmi-p-chip').forEach(function(c){ c.classList.remove('on'); });
}
