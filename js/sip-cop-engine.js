/* ============================================================
   ADCB Open Finance — SIP CoP Flow Engine
   Rendering engine for the SIP Confirmation of Payee section.
   Depends on globals: SIP_FLOW_STEPS, SIP_COP_STORIES,
                        SIP_RST_SECTIONS, SIP_GAPS
   ============================================================ */

/* ── STATE ── */
var sipCurrentScreen = 1;
var sipCurrentScenario = 'exact';
var sipTotalScreens = 7;

var SIP_SCREEN_NAMES = ['','Payment Checkout','Bank Selection','Verifying Payee (CoP)','CoP Result','Payment Review','Bank Authorisation','Payment Receipt'];

/* ─────────────────────────────────────────────
   1. TAB NAVIGATION
   ───────────────────────────────────────────── */
function sipGoTab(tabId) {
  var pages = document.querySelectorAll('.sip-page');
  for (var i = 0; i < pages.length; i++) {
    pages[i].classList.remove('active');
    pages[i].classList.remove('sip-page-active');
  }
  var tabs = document.querySelectorAll('.sip-stab');
  for (var j = 0; j < tabs.length; j++) { tabs[j].classList.remove('active'); }

  var targetPage = document.getElementById('sip-page-' + tabId);
  if (targetPage) targetPage.classList.add('active');
  var targetTab = document.querySelector('.sip-stab[data-tab="' + tabId + '"]');
  if (targetTab) targetTab.classList.add('active');
}

/* ─────────────────────────────────────────────
   2. FLOW DIAGRAM
   ───────────────────────────────────────────── */
function sipRenderFlow() {
  var el = document.getElementById('sip-flow-content');
  if (!el || !SIP_FLOW_STEPS || !SIP_FLOW_STEPS.length) return;

  var legend = '<div class="sip-legend">' +
    '<div class="sip-legend-item"><div class="sip-legend-dot" style="background:#DBEAFE;border-color:#1E40AF"></div> User / Frontend</div>' +
    '<div class="sip-legend-item"><div class="sip-legend-dot" style="background:#D1FAE5;border-color:#15803D"></div> TPP Backend</div>' +
    '<div class="sip-legend-item"><div class="sip-legend-dot" style="background:#FEF3C7;border-color:#D97706"></div> OF API Hub</div>' +
    '<div class="sip-legend-item"><div class="sip-legend-dot" style="background:#F5F3FF;border-color:#5B21B6"></div> Bank (LFI)</div>' +
    '<div class="sip-legend-item"><div class="sip-legend-dot" style="background:#FFF3E0;border-color:#E65100"></div> CoP Query</div>' +
    '<div class="sip-legend-item"><div class="sip-legend-dot" style="background:#FEE2E2;border-color:#C41E24"></div> Security / Encryption</div>' +
  '</div>';

  var phases = {
    1: {label:'STEP P-0',desc:'Account & Bank Selection',cop:false},
    3: {label:'CoP QUERY',desc:'Confirmation of Payee',cop:true},
    5: {label:'STEP P-1',desc:'Payment Review & Consent Initiation',cop:false},
    7: {label:'STEP P-2',desc:'Bank Authorization & Token Exchange',cop:false},
    9: {label:'STEP P-3',desc:'Payment Execution & Status',cop:false}
  };

  var html = legend + '<div style="max-width:900px">';
  var copOpen = false;

  for (var i = 0; i < SIP_FLOW_STEPS.length; i++) {
    var step = SIP_FLOW_STEPS[i];
    var num = step.num || (i + 1);
    var color = step.color || '#1E40AF';

    // Phase marker
    if (phases[num]) {
      if (copOpen) { html += '</div>'; copOpen = false; }
      var ph = phases[num];
      html += '<div class="sip-phase-marker' + (ph.cop ? ' cop-phase' : '') + '">' + ph.label + ' \u2014 ' + ph.desc + '</div>';
      if (ph.cop) { html += '<div class="sip-cop-highlight"><div class="sip-cop-highlight-title">\uD83D\uDD0D Confirmation of Payee (CoP) \u2014 Before Payment Consent</div>'; copOpen = true; }
    }

    // Tags HTML
    var tagsHtml = '';
    if (step.tags && step.tags.length) {
      tagsHtml = '<div class="sip-flow-tags">';
      for (var t = 0; t < step.tags.length; t++) {
        var tag = step.tags[t];
        var tagCls = 'sip-tag';
        if (tag.cssClass === 'tag-blue') tagCls += ' sip-tag-ui';
        else if (tag.cssClass === 'tag-orange') tagCls += ' sip-tag-cop';
        else if (tag.cssClass === 'tag-green') tagCls += ' sip-tag-api';
        else if (tag.cssClass === 'tag-red') tagCls += ' sip-tag-security';
        else if (tag.cssClass === 'tag-purple') tagCls += ' sip-tag-bank';
        else if (tag.cssClass === 'tag-amber') tagCls += ' sip-tag-hub';
        else tagCls += ' sip-tag-api';
        tagsHtml += '<span class="' + tagCls + '">' + tag.label + '</span>';
      }
      tagsHtml += '</div>';
    }

    // Detail HTML
    var detailHtml = '';
    if (step.detail && step.detail.rows) {
      detailHtml = '<div class="sip-detail-panel" id="sip-detail-' + num + '">';
      detailHtml += '<h3>' + step.detail.title + ' <button class="sip-close-btn" onclick="event.stopPropagation();sipToggleDetail(' + num + ')">&times;</button></h3>';
      detailHtml += '<table class="sip-detail-table">';
      for (var r = 0; r < step.detail.rows.length; r++) {
        var row = step.detail.rows[r];
        if (row.th && row.td) {
          detailHtml += '<tr><td style="font-weight:600;width:140px">' + row.th + '</td><td>' + row.td + '</td></tr>';
        } else if (row.cells) {
          if (r === 0) {
            detailHtml += '<tr>';
            for (var c = 0; c < row.cells.length; c++) detailHtml += '<th>' + row.cells[c] + '</th>';
            detailHtml += '</tr>';
          } else {
            detailHtml += '<tr>';
            for (var c2 = 0; c2 < row.cells.length; c2++) detailHtml += '<td>' + row.cells[c2] + '</td>';
            detailHtml += '</tr>';
          }
        }
      }
      detailHtml += '</table>';
      if (step.detail.note) detailHtml += '<p style="margin-top:12px;font-size:12px;color:var(--color-primary);font-weight:600;">' + step.detail.note + '</p>';
      detailHtml += '</div>';
    }

    var isLast = i === SIP_FLOW_STEPS.length - 1;

    html += '<div class="sip-flow-step">' +
      '<div class="sip-flow-step-number">' +
        '<div class="sip-step-circle" style="background:' + color + '">' + num + '</div>' +
        (isLast ? '' : '<div class="sip-step-line" style="background:' + color + '"></div>') +
      '</div>' +
      '<div class="sip-flow-step-content">' +
        '<div class="sip-flow-card" style="background:' + color + '15;border-color:' + color + '" onclick="sipToggleDetail(' + num + ')">' +
          '<h3 style="color:' + color + '">' + step.title + '</h3>' +
          '<p>' + step.desc + '</p>' +
          tagsHtml +
        '</div>' +
        detailHtml +
      '</div>' +
    '</div>';
  }

  if (copOpen) html += '</div>';
  html += '</div>';
  el.innerHTML = html;
}

function sipToggleDetail(num) {
  var panels = document.querySelectorAll('.sip-detail-panel');
  var target = document.getElementById('sip-detail-' + num);
  var wasOpen = target && target.classList.contains('open');
  for (var i = 0; i < panels.length; i++) panels[i].classList.remove('open');
  if (target && !wasOpen) target.classList.add('open');
}

/* ─────────────────────────────────────────────
   3. CoP DEEP DIVE
   ───────────────────────────────────────────── */
function sipRenderCopDeepDive() {
  var el = document.getElementById('sip-cop-detail-content');
  if (!el) return;

  el.innerHTML =
    '<h2 style="font-size:21px;font-weight:600;color:var(--navy);margin-bottom:10px">CoP Query \u2014 Deep Dive</h2>' +
    '<p style="margin-bottom:20px">How Confirmation of Payee works within the SIP payment flow</p>' +

    '<div class="sip-cop-grid">' +
      '<div class="sip-cop-card">' +
        '<h3 style="color:#E65100">What is CoP?</h3>' +
        '<p>Confirmation of Payee (CoP) is a <strong>mandatory check</strong> that verifies a payee\'s name matches their bank account before a payment is made. It prevents fraud and misdirected payments.</p>' +
        '<div style="margin-top:12px;padding:10px;background:var(--color-warning-light);border-radius:8px;font-size:12px">' +
          '<strong>Endpoint:</strong> <code>POST /customers/action/cop-query</code><br>' +
          '<strong>When:</strong> After payee details entered, before consent<br>' +
          '<strong>Cost:</strong> 0.5 fils (with payment in 2h) or 2.5 fils standalone' +
        '</div>' +
      '</div>' +
      '<div class="sip-cop-card">' +
        '<h3 style="color:var(--color-primary)">Why is it Mandatory?</h3>' +
        '<ul>' +
          '<li>Prevents payments to wrong accounts</li>' +
          '<li>Reduces fraud (fake payee details)</li>' +
          '<li>Required by CBUAE regulation</li>' +
          '<li><strong>250 AED penalty</strong> if TPP skips CoP for new beneficiary</li>' +
          '<li><strong>500 AED penalty</strong> if skipped for merchant onboarding</li>' +
          '<li>Part of the Risk Information Block</li>' +
        '</ul>' +
      '</div>' +
    '</div>' +

    '<h3 style="font-size:16px;margin:20px 0 12px">CoP Request / Response</h3>' +

    '<div class="sip-cop-grid">' +
      '<div class="sip-cop-card">' +
        '<h4 style="font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-secondary);margin-bottom:12px">Request</h4>' +
        '<div class="sip-cop-code">POST /customers/action/cop-query\nAuthorization: Bearer {client_credentials_token}\nContent-Type: application/json\n\n{\n  "Name": {\n    "fullName": "John Smith"\n  },\n  "Account": {\n    "SchemeName": "IBAN",\n    "Identification": "AE210610012345678901234"\n  }\n}</div>' +
      '</div>' +
      '<div class="sip-cop-card">' +
        '<h4 style="font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-secondary);margin-bottom:12px">Response</h4>' +
        '<div class="sip-cop-code">HTTP/1.1 200 OK\n\n{\n  "Data": {\n    "MatchResult": "ExactMatch",\n    "MatchedName": "John Smith",\n    "AccountStatus": "Active",\n    "FurtherActionRequired": false\n  }\n}\n\n// Possible MatchResult values:\n// "ExactMatch"   - Name matches perfectly\n// "PartialMatch" - Close but not exact\n// "NoMatch"      - Does not match</div>' +
      '</div>' +
    '</div>' +

    '<h3 style="font-size:16px;margin:20px 0 12px">Where CoP Fits in the Payment Flow</h3>' +
    '<div class="sip-cop-card">' +
      '<div class="sip-cop-flow-strip">' +
        '<div class="sip-cop-flow-step" style="background:#DBEAFE;color:#1E40AF">1. User enters payee</div><div class="sip-cop-flow-arrow">\u2192</div>' +
        '<div class="sip-cop-flow-step" style="background:#DBEAFE;color:#1E40AF">2. Select bank</div><div class="sip-cop-flow-arrow">\u2192</div>' +
        '<div class="sip-cop-flow-step" style="background:#FFF3E0;color:#E65100;border:2px solid #E65100;font-weight:700">3. CoP Query \uD83D\uDD0D</div><div class="sip-cop-flow-arrow">\u2192</div>' +
        '<div class="sip-cop-flow-step" style="background:#FFF3E0;color:#E65100;border:2px solid #E65100;font-weight:700">4. CoP Result</div><div class="sip-cop-flow-arrow">\u2192</div>' +
        '<div class="sip-cop-flow-step" style="background:#D1FAE5;color:#15803D">5. Review</div><div class="sip-cop-flow-arrow">\u2192</div>' +
        '<div class="sip-cop-flow-step" style="background:#F5F3FF;color:#5B21B6">6. Bank auth</div><div class="sip-cop-flow-arrow">\u2192</div>' +
        '<div class="sip-cop-flow-step" style="background:#CCFBF1;color:#00695C">7. Executed</div>' +
      '</div>' +
    '</div>';
}

/* ─────────────────────────────────────────────
   4. USER STORIES
   ───────────────────────────────────────────── */
function sipRenderStories() {
  var el = document.getElementById('sip-stories-content');
  if (!el || !SIP_COP_STORIES) return;

  var html = '<h2 style="font-size:21px;font-weight:600;color:var(--navy);margin-bottom:6px">User Stories & Acceptance Criteria</h2>' +
    '<p style="margin-bottom:20px">CoP (Confirmation of Payee) \u2014 Written as a Product Owner using simple language</p>';

  for (var i = 0; i < SIP_COP_STORIES.length; i++) {
    var s = SIP_COP_STORIES[i];
    var idClass = s.type === 'ui' ? 'ui' : s.type === 'api' ? 'api' : 'perf';
    var priClass = s.priority === 'high' ? 'sip-pri-high' : 'sip-pri-med';
    var priLabel = s.priority === 'high' ? 'Must Have' : 'Should Have';

    html += '<div class="sip-story-card" onclick="this.classList.toggle(\'open\')">' +
      '<div class="sip-story-header">' +
        '<span class="sip-story-id ' + idClass + '">' + s.id + '</span>' +
        '<span class="sip-story-title">' + s.title + '</span>' +
        '<span class="sip-story-priority ' + priClass + '">' + priLabel + '</span>' +
        '<span class="sip-story-chevron">\u25BC</span>' +
      '</div>' +
      '<div class="sip-story-body">' +
        '<div class="sip-story-section"><h4>User Story</h4>' +
          '<div class="sip-story-text">' + s.storyText + '</div>' +
        '</div>' +
        '<div class="sip-story-section"><h4>Acceptance Criteria</h4>' +
          '<ul class="sip-ac-list">';
    for (var a = 0; a < s.acs.length; a++) {
      html += '<li><div class="sip-ac-check" onclick="event.stopPropagation();this.classList.toggle(\'checked\')">\u2713</div> ' + s.acs[a] + '</li>';
    }
    html += '</ul></div></div></div>';
  }

  el.innerHTML = html;
}

/* ─────────────────────────────────────────────
   5. RST SCENARIOS
   ───────────────────────────────────────────── */
function sipRenderRST() {
  var el = document.getElementById('sip-rst-content');
  if (!el || !SIP_RST_SECTIONS) return;

  var totalScenarios = 0;
  var critCount = 0, highCount = 0;
  for (var s = 0; s < SIP_RST_SECTIONS.length; s++) {
    var sec = SIP_RST_SECTIONS[s];
    totalScenarios += sec.scenarios.length;
    for (var sc = 0; sc < sec.scenarios.length; sc++) {
      if (sec.scenarios[sc].risk === 'critical') critCount++;
      if (sec.scenarios[sc].risk === 'high') highCount++;
    }
  }

  var html = '<h2 style="font-size:21px;font-weight:600;color:var(--navy);margin-bottom:6px">RST Test Scenarios</h2>' +
    '<p style="margin-bottom:20px">Interrogated using James Bach\'s RST heuristics: SFDPOT, FEW HICCUPPS, Touring, and Risk-based analysis</p>' +

    '<div class="box box-navy"><p><strong>Methodology:</strong> Each scenario was generated by systematically applying Bach\'s RST frameworks to the SIP + CoP flow. Scenarios are grouped by SFDPOT element (Structure, Function, Data, Platform, Operations, Time).</p></div>' +

    '<div class="sip-rst-stats">' +
      '<div class="sip-rst-stat"><div class="num" id="sip-rst-total">' + totalScenarios + '</div><div class="label">Test Scenarios</div></div>' +
      '<div class="sip-rst-stat"><div class="num">' + critCount + '</div><div class="label">Critical</div></div>' +
      '<div class="sip-rst-stat"><div class="num">' + highCount + '</div><div class="label">High Risk</div></div>' +
      '<div class="sip-rst-stat"><div class="num">' + SIP_RST_SECTIONS.length + '</div><div class="label">SFDPOT Sections</div></div>' +
    '</div>' +

    '<div class="sip-rst-filter-bar">' +
      '<div class="sip-rst-filter active" onclick="sipFilterRst(\'all\',this)">All Scenarios</div>' +
      '<div class="sip-rst-filter" onclick="sipFilterRst(\'critical\',this)">Critical</div>' +
      '<div class="sip-rst-filter" onclick="sipFilterRst(\'high\',this)">High Risk</div>';
  for (var f = 0; f < SIP_RST_SECTIONS.length; f++) {
    html += '<div class="sip-rst-filter" onclick="sipFilterRst(\'' + SIP_RST_SECTIONS[f].id + '\',this)">' + SIP_RST_SECTIONS[f].title + '</div>';
  }
  html += '</div>';

  for (var i = 0; i < SIP_RST_SECTIONS.length; i++) {
    var section = SIP_RST_SECTIONS[i];
    html += '<div class="sip-rst-section" data-category="' + section.id + '">' +
      '<div class="sip-rst-section-title"><span class="sip-heuristic-tag">SFDPOT \u2014 ' + section.sfdpot + '</span> ' + section.title + '</div>' +
      '<div class="sip-rst-section-desc">' + section.desc + '</div>' +
      '<table class="sip-scenario-table"><thead><tr>' +
        '<th style="width:40px">#</th><th style="width:200px">Scenario</th><th style="width:200px">How Triggered</th>' +
        '<th style="width:160px">Expected</th><th style="width:180px">Impact</th><th style="width:60px">Risk</th><th>Heuristic</th>' +
      '</tr></thead><tbody>';

    for (var j = 0; j < section.scenarios.length; j++) {
      var sc2 = section.scenarios[j];
      var riskCls = 'sip-risk-' + sc2.risk;
      var oracleHtml = '';
      if (sc2.oracles) {
        for (var o = 0; o < sc2.oracles.length; o++) {
          oracleHtml += '<span class="sip-oracle-tag">' + sc2.oracles[o] + '</span>';
        }
      }
      html += '<tr data-cat="' + section.id + '" data-risk="' + sc2.risk + '">' +
        '<td>' + sc2.id + '</td>' +
        '<td><strong>' + sc2.title + '</strong></td>' +
        '<td>' + sc2.trigger + '</td>' +
        '<td>' + sc2.expected + '</td>' +
        '<td>' + sc2.impact + '</td>' +
        '<td><span class="sip-risk-tag ' + riskCls + '">' + sc2.risk.charAt(0).toUpperCase() + sc2.risk.slice(1) + '</span></td>' +
        '<td>' + oracleHtml + '</td>' +
      '</tr>';
    }
    html += '</tbody></table></div>';
  }

  el.innerHTML = html;
}

function sipFilterRst(cat, btn) {
  var filters = document.querySelectorAll('.sip-rst-filter');
  for (var i = 0; i < filters.length; i++) filters[i].classList.remove('active');
  if (btn) btn.classList.add('active');

  var sections = document.querySelectorAll('.sip-rst-section');
  var isRisk = (cat === 'critical' || cat === 'high');

  for (var s = 0; s < sections.length; s++) {
    var sec = sections[s];
    var rows = sec.querySelectorAll('tbody tr');

    if (cat === 'all') {
      sec.style.display = '';
      for (var r = 0; r < rows.length; r++) rows[r].style.display = '';
      continue;
    }

    if (isRisk) {
      var hasVisible = false;
      for (var r2 = 0; r2 < rows.length; r2++) {
        var match = rows[r2].getAttribute('data-risk') === cat;
        rows[r2].style.display = match ? '' : 'none';
        if (match) hasVisible = true;
      }
      sec.style.display = hasVisible ? '' : 'none';
    } else {
      if (sec.getAttribute('data-category') === cat) {
        sec.style.display = '';
        for (var r3 = 0; r3 < rows.length; r3++) rows[r3].style.display = '';
      } else {
        sec.style.display = 'none';
      }
    }
  }

  // Update count
  var visible = 0;
  var allRows = document.querySelectorAll('.sip-rst-section:not([style*="display: none"]) tbody tr:not([style*="display: none"])');
  visible = allRows.length;
  var counter = document.getElementById('sip-rst-total');
  if (counter) counter.textContent = visible;
}

/* ─────────────────────────────────────────────
   6. DESIGN GAPS
   ───────────────────────────────────────────── */
function sipRenderGaps() {
  var el = document.getElementById('sip-gaps-content');
  if (!el || !SIP_GAPS) return;

  var counts = {design:0,conflict:0,undefined:0,billing:0,liability:0,security:0};
  for (var i = 0; i < SIP_GAPS.length; i++) { counts[SIP_GAPS[i].type] = (counts[SIP_GAPS[i].type] || 0) + 1; }

  var html = '<h2 style="font-size:21px;font-weight:600;color:var(--navy);margin-bottom:6px">Unclear Requirements & Design Gaps</h2>' +
    '<p style="margin-bottom:20px">Discovered by applying RST heuristics to current specifications. Each requires a decision from Product, Architecture, or Compliance.</p>' +

    '<div class="sip-rst-stats">' +
      '<div class="sip-rst-stat"><div class="num">' + SIP_GAPS.length + '</div><div class="label">Total Gaps</div></div>' +
      '<div class="sip-rst-stat"><div class="num">' + (counts.design || 0) + '</div><div class="label">Design</div></div>' +
      '<div class="sip-rst-stat"><div class="num">' + (counts.conflict || 0) + '</div><div class="label">Conflict</div></div>' +
      '<div class="sip-rst-stat"><div class="num">' + (counts['undefined'] || 0) + '</div><div class="label">Undefined</div></div>' +
      '<div class="sip-rst-stat"><div class="num">' + (counts.billing || 0) + '</div><div class="label">Billing</div></div>' +
      '<div class="sip-rst-stat"><div class="num">' + (counts.liability || 0) + '</div><div class="label">Liability</div></div>' +
      '<div class="sip-rst-stat"><div class="num">' + (counts.security || 0) + '</div><div class="label">Security</div></div>' +
    '</div>' +

    '<table class="sip-gaps-table"><thead><tr>' +
      '<th style="width:40px">#</th><th style="width:80px">Type</th><th style="width:240px">Gap</th>' +
      '<th style="width:200px">Why It Matters</th><th style="width:120px">Source</th><th>Suggested Action</th>' +
    '</tr></thead><tbody>';

  for (var j = 0; j < SIP_GAPS.length; j++) {
    var g = SIP_GAPS[j];
    html += '<tr>' +
      '<td>' + g.id + '</td>' +
      '<td><span class="sip-gap-tag sip-gap-' + g.type + '">' + g.type.charAt(0).toUpperCase() + g.type.slice(1) + '</span></td>' +
      '<td><strong>' + g.title + '</strong></td>' +
      '<td>' + g.why + '</td>' +
      '<td><span class="sip-oracle-tag">' + g.source + '</span></td>' +
      '<td>' + g.action + '</td>' +
    '</tr>';
  }

  html += '</tbody></table>';
  el.innerHTML = html;
}

/* ─────────────────────────────────────────────
   7. PHONE PROTOTYPE
   ───────────────────────────────────────────── */
function sipProtoInit() {
  var el = document.getElementById('sip-proto-root');
  if (!el) return;

  sipCurrentScreen = 1;
  sipCurrentScenario = 'exact';

  var html = '<div class="sip-proto-layout">' +
    '<div class="sip-proto-sidebar">' +
      '<div class="sip-proto-sidebar-title">Choose a Scenario</div>' +
      '<button class="sip-scenario-btn active" id="sip-scen-exact" onclick="sipSetScenario(\'exact\',this)"><span class="sip-sc-tag sip-sc-happy">HAPPY</span> Exact Name Match</button>' +
      '<button class="sip-scenario-btn" id="sip-scen-partial" onclick="sipSetScenario(\'partial\',this)"><span class="sip-sc-tag sip-sc-warn">WARNING</span> Partial Name Match</button>' +
      '<button class="sip-scenario-btn" id="sip-scen-none" onclick="sipSetScenario(\'none\',this)"><span class="sip-sc-tag sip-sc-danger">RISK</span> No Name Match</button>' +
      '<button class="sip-scenario-btn" id="sip-scen-unavailable" onclick="sipSetScenario(\'unavailable\',this)"><span class="sip-sc-tag sip-sc-grey">FALLBACK</span> CoP Unavailable</button>' +
      '<div class="sip-proto-sidebar-title" style="margin-top:20px">Flow Progress</div>' +
      '<div id="sip-proto-step-list"></div>' +
    '</div>' +
    '<div class="sip-proto-phone-wrap">' +
      '<div class="sip-proto-phone" id="sip-proto-phone">' +
        '<div class="sip-proto-notch"></div>' +
        '<div class="sip-proto-display" id="sip-proto-display">' +
        '</div>' +
        '<div class="sip-modal-overlay" id="sip-no-match-modal">' +
          '<div class="sip-modal-box">' +
            '<div style="font-size:40px;margin-bottom:8px">\u26A0\uFE0F</div>' +
            '<h3>Are you sure?</h3>' +
            '<p>The payee name does <strong>not match</strong> the bank account. Sending money to the wrong account is hard to reverse.</p>' +
            '<div class="sip-modal-btns">' +
              '<button style="background:#eee;color:#333" onclick="sipHideNoMatchModal()">Go Back</button>' +
              '<button style="background:var(--color-error);color:#fff" onclick="sipHideNoMatchModal();sipProtoNext()">I Accept Risk</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="sip-screen-label" id="sip-proto-screen-label"></div>' +
      '<div class="sip-proto-nav-row">' +
        '<button class="sip-proto-nav-btn" id="sip-proto-prev" onclick="sipProtoPrev()" disabled>\u2039 Back</button>' +
        '<div class="sip-proto-dots" id="sip-proto-dots"></div>' +
        '<button class="sip-proto-nav-btn" id="sip-proto-next" onclick="sipProtoNext()">Next \u203A</button>' +
      '</div>' +
    '</div>' +
  '</div>';

  el.innerHTML = html;
  sipRenderScreen();
  sipUpdateProtoUI();
}

function sipRenderScreen() {
  var display = document.getElementById('sip-proto-display');
  if (!display) return;
  var n = sipCurrentScreen;
  var html = '';

  if (n === 1) {
    html = '<div class="sip-proto-app-header"><h2>Pay by Bank</h2></div>' +
      '<div class="sip-proto-content">' +
        '<div class="sip-proto-amount"><div class="curr">AED</div><div class="val">250.00</div></div>' +
        '<div class="sip-proto-field-row"><span class="sip-proto-field-label">Payee</span><span class="sip-proto-field-value">Ahmed Al Maktoum</span></div>' +
        '<div class="sip-proto-field-row"><span class="sip-proto-field-label">IBAN</span><span class="sip-proto-field-value">AE21 0610 **** 1234</span></div>' +
        '<div class="sip-proto-field-row"><span class="sip-proto-field-label">Purpose</span><span class="sip-proto-field-value">Invoice Payment</span></div>' +
        '<div class="sip-proto-field-row" style="border:none"><span class="sip-proto-field-label">Reference</span><span class="sip-proto-field-value">INV-2026-0042</span></div>' +
        '<button class="sip-proto-btn sip-proto-btn-primary" onclick="sipProtoNext()">Continue to Bank Selection</button>' +
      '</div>';
  } else if (n === 2) {
    html = '<div class="sip-proto-app-header"><span style="cursor:pointer" onclick="sipProtoPrev()">\u2190</span><h2>Select Your Bank</h2></div>' +
      '<div class="sip-proto-content">' +
        '<p style="font-size:13px;color:var(--color-text-secondary);margin-bottom:16px">Choose which bank to pay from:</p>' +
        '<div class="sip-bank-option selected"><div class="sip-bank-icon" style="background:var(--color-primary)">A</div><div><div style="font-weight:600">ADCB</div><div style="font-size:11px;color:var(--color-text-secondary)">Abu Dhabi Commercial Bank</div></div></div>' +
        '<div class="sip-bank-option"><div class="sip-bank-icon" style="background:#1A237E">E</div><div><div style="font-weight:600">Emirates NBD</div><div style="font-size:11px;color:var(--color-text-secondary)">Emirates National Bank of Dubai</div></div></div>' +
        '<div class="sip-bank-option"><div class="sip-bank-icon" style="background:#00695C">M</div><div><div style="font-weight:600">Mashreq</div><div style="font-size:11px;color:var(--color-text-secondary)">Mashreq Bank</div></div></div>' +
        '<button class="sip-proto-btn sip-proto-btn-primary" onclick="sipProtoNext()">Verify Payee & Continue</button>' +
      '</div>';
  } else if (n === 3) {
    html = '<div class="sip-proto-app-header"><h2>Verifying Payee</h2></div>' +
      '<div class="sip-proto-content">' +
        '<div class="sip-loading-spinner"><div class="sip-spinner-ring"></div><div style="font-size:13px;color:var(--color-text-secondary)">Checking payee details...</div></div>' +
        '<div style="margin-top:24px;padding:16px;background:var(--color-surface-secondary);border-radius:12px">' +
          '<div class="sip-proto-field-row" style="border:none;padding:4px 0"><span class="sip-proto-field-label">Payee</span><span class="sip-proto-field-value">Ahmed Al Maktoum</span></div>' +
          '<div class="sip-proto-field-row" style="border:none;padding:4px 0"><span class="sip-proto-field-label">IBAN</span><span class="sip-proto-field-value">AE21 0610 **** 1234</span></div>' +
        '</div>' +
        '<button class="sip-proto-btn sip-proto-btn-primary" disabled>Please wait...</button>' +
      '</div>';
    setTimeout(function() { if (sipCurrentScreen === 3) { sipCurrentScreen = 4; sipRenderScreen(); sipUpdateProtoUI(); } }, 1500);
  } else if (n === 4) {
    html = sipRenderCopResultScreen();
  } else if (n === 5) {
    html = '<div class="sip-proto-app-header"><span style="cursor:pointer" onclick="sipProtoPrev()">\u2190</span><h2>Review Payment</h2></div>' +
      '<div class="sip-proto-content">' +
        '<div class="sip-proto-amount"><div class="curr">AED</div><div class="val">250.00</div></div>' +
        '<div id="sip-review-badge" style="text-align:center;margin-bottom:12px">' + sipGetBadgeHtml() + '</div>' +
        '<div class="sip-proto-field-row"><span class="sip-proto-field-label">Payee</span><span class="sip-proto-field-value">Ahmed Al Maktoum</span></div>' +
        '<div class="sip-proto-field-row"><span class="sip-proto-field-label">IBAN</span><span class="sip-proto-field-value">AE21 0610 **** 1234</span></div>' +
        '<div class="sip-proto-field-row"><span class="sip-proto-field-label">From</span><span class="sip-proto-field-value">ADCB Savings ****5678</span></div>' +
        '<div class="sip-proto-field-row"><span class="sip-proto-field-label">Purpose</span><span class="sip-proto-field-value">Invoice Payment</span></div>' +
        '<div class="sip-proto-field-row" style="border:none"><span class="sip-proto-field-label">Reference</span><span class="sip-proto-field-value">INV-2026-0042</span></div>' +
        '<button class="sip-proto-btn sip-proto-btn-primary" onclick="sipProtoNext()">Pay Now \u2014 AED 250.00</button>' +
        '<p style="text-align:center;font-size:11px;color:var(--color-text-tertiary);margin-top:8px">You will be redirected to your bank to authorise</p>' +
      '</div>';
  } else if (n === 6) {
    html = '<div class="sip-proto-app-header" style="background:#1A237E"><span>\uD83D\uDD12</span><h2>Bank Authorisation</h2></div>' +
      '<div class="sip-proto-content" style="text-align:center">' +
        '<div style="font-size:40px;margin:16px 0 8px">\uD83C\uDFE6</div>' +
        '<p style="font-size:15px;font-weight:600">ADCB Secure Login</p>' +
        '<p style="font-size:12px;color:var(--color-text-secondary);margin-top:4px">Authorise payment of AED 250.00</p>' +
        '<div style="padding:12px;background:#F0F4FF;border-radius:10px;margin:12px 0;text-align:left">' +
          '<div class="sip-proto-field-row" style="border:none;padding:4px 0"><span class="sip-proto-field-label">To</span><span class="sip-proto-field-value">Ahmed Al Maktoum</span></div>' +
          '<div class="sip-proto-field-row" style="border:none;padding:4px 0"><span class="sip-proto-field-label">Amount</span><span class="sip-proto-field-value" style="color:var(--color-primary);font-size:16px">AED 250.00</span></div>' +
        '</div>' +
        '<div style="background:var(--color-success-light);padding:12px;border-radius:10px;margin:12px 0;font-size:12px;color:var(--color-success-dark)">\uD83D\uDD12 Secure connection \u2022 2-Factor Authentication</div>' +
        '<button class="sip-proto-btn" style="background:#1A237E;color:#fff;margin-top:16px" onclick="sipProtoNext()">Authorise Payment</button>' +
        '<button class="sip-proto-btn sip-proto-btn-secondary" style="margin-top:8px" onclick="sipProtoPrev()">Cancel</button>' +
      '</div>';
  } else if (n === 7) {
    html = '<div class="sip-proto-app-header" style="background:var(--color-success-dark)"><h2 style="width:100%;text-align:center">Payment Complete</h2></div>' +
      '<div class="sip-proto-content" style="text-align:center">' +
        '<div style="font-size:56px;margin:16px 0 8px">\u2705</div>' +
        '<div style="font-size:20px;font-weight:700;color:var(--color-success-dark)">Payment Accepted</div>' +
        '<div style="font-size:12px;color:var(--color-text-secondary);margin-top:4px">Transaction ID: TXN-2026-AF82K9</div>' +
        '<div class="sip-proto-amount" style="padding:16px 0"><div class="curr">AED</div><div class="val" style="color:var(--color-success-dark)">250.00</div></div>' +
        '<div style="text-align:left;padding:12px 16px;background:var(--color-surface-secondary);border-radius:12px">' +
          '<div class="sip-proto-field-row"><span class="sip-proto-field-label">Payee</span><span class="sip-proto-field-value">Ahmed Al Maktoum</span></div>' +
          '<div class="sip-proto-field-row"><span class="sip-proto-field-label">Date</span><span class="sip-proto-field-value">9 Apr 2026, 14:32</span></div>' +
          '<div class="sip-proto-field-row"><span class="sip-proto-field-label">Status</span><span class="sip-proto-field-value" style="color:var(--color-success-dark)">Accepted \u2705</span></div>' +
          '<div class="sip-proto-field-row" style="border:none"><span class="sip-proto-field-label">Method</span><span class="sip-proto-field-value">Aani (IPP)</span></div>' +
        '</div>' +
        '<button class="sip-proto-btn sip-proto-btn-primary" onclick="sipCurrentScreen=1;sipRenderScreen();sipUpdateProtoUI()">Make Another Payment</button>' +
      '</div>';
  }

  display.innerHTML = html;
}

function sipRenderCopResultScreen() {
  var sc = sipCurrentScenario;
  var configs = {
    exact: {
      cls:'sip-cop-banner-exact', icon:'\u2705',
      title:'Payee name matches bank records',
      desc:'The name "Ahmed Al Maktoum" is an exact match with the bank account holder.',
      checkbox:false, canProceed:true, btnText:'Continue to Payment Review'
    },
    partial: {
      cls:'sip-cop-banner-partial', icon:'\u26A0\uFE0F',
      title:'Name is close but not an exact match',
      desc:'You entered: <strong>Ahmed Al Maktoum</strong><br>Bank records show: <strong>Ahmed Ali Al Maktoum</strong>',
      checkbox:true, checkLabel:'I confirm that <strong>Ahmed Ali Al Maktoum</strong> is the person I want to pay.',
      canProceed:false, btnText:'I Understand \u2014 Continue'
    },
    none: {
      cls:'sip-cop-banner-none', icon:'\u274C',
      title:'Payee name does NOT match bank records',
      desc:'You entered: <strong>Ahmed Al Maktoum</strong><br>The bank could not match this name to the account. This could be fraud.',
      checkbox:true, checkLabel:'I understand the risk and wish to proceed.', danger:true,
      canProceed:false, btnText:'Proceed Despite Warning', showModal:true
    },
    unavailable: {
      cls:'sip-cop-banner-unavail', icon:'\u2139\uFE0F',
      title:'Payee name check unavailable',
      desc:'We could not verify the payee name right now. Please double-check before proceeding.',
      checkbox:false, canProceed:true, btnText:'Continue to Payment Review'
    }
  };
  var cfg = configs[sc] || configs.exact;

  var h = '<div class="sip-proto-app-header"><span style="cursor:pointer" onclick="sipProtoPrev()">\u2190</span><h2>Payee Verification</h2></div>' +
    '<div class="sip-proto-content">' +
      '<div style="padding:14px 16px;background:var(--color-surface-secondary);border-radius:12px;margin-bottom:16px">' +
        '<div class="sip-proto-field-row" style="border:none;padding:2px 0"><span class="sip-proto-field-label">Payee</span><span class="sip-proto-field-value">Ahmed Al Maktoum</span></div>' +
        '<div class="sip-proto-field-row" style="border:none;padding:2px 0"><span class="sip-proto-field-label">IBAN</span><span class="sip-proto-field-value">AE21 0610 **** 1234</span></div>' +
      '</div>' +
      '<div class="sip-cop-banner ' + cfg.cls + '"><span class="cop-icon">' + cfg.icon + '</span><div><div style="font-weight:700;margin-bottom:2px">' + cfg.title + '</div><div style="font-size:12px">' + cfg.desc + '</div></div></div>';

  if (cfg.checkbox) {
    h += '<label class="sip-confirm-checkbox' + (cfg.danger ? ' danger-bg' : '') + '">' +
      '<input type="checkbox" onchange="sipUpdateCopProceed()"> <span>' + cfg.checkLabel + '</span></label>';
  }

  h += '<button class="sip-proto-btn sip-proto-btn-primary" id="sip-cop-proceed" ' + (cfg.canProceed ? '' : 'disabled') + ' onclick="sipHandleCopProceed()">' + cfg.btnText + '</button>' +
    '<button class="sip-proto-btn sip-proto-btn-secondary" style="margin-top:8px" onclick="sipProtoPrev()">Go Back \u2014 Edit Details</button>' +
  '</div>';

  return h;
}

function sipGetBadgeHtml() {
  var badges = {
    exact: '<span class="sip-cop-badge-sm sip-badge-exact">\u2705 Name Verified</span>',
    partial: '<span class="sip-cop-badge-sm sip-badge-partial">\u26A0\uFE0F Partial Match</span>',
    none: '<span class="sip-cop-badge-sm sip-badge-none">\u274C Name Mismatch</span>',
    unavailable: '<span class="sip-cop-badge-sm sip-badge-unavail">\u2139\uFE0F Not Verified</span>'
  };
  return badges[sipCurrentScenario] || badges.exact;
}

function sipUpdateCopProceed() {
  var btn = document.getElementById('sip-cop-proceed');
  var cb = document.querySelector('.sip-confirm-checkbox input');
  if (btn && cb) btn.disabled = !cb.checked;
}

function sipHandleCopProceed() {
  if (sipCurrentScenario === 'none') {
    var modal = document.getElementById('sip-no-match-modal');
    if (modal) modal.classList.add('open');
  } else {
    sipProtoNext();
  }
}

function sipHideNoMatchModal() {
  var modal = document.getElementById('sip-no-match-modal');
  if (modal) modal.classList.remove('open');
}

function sipSetScenario(scenario, btn) {
  sipCurrentScenario = scenario;
  var btns = document.querySelectorAll('.sip-scenario-btn');
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
  if (btn) btn.classList.add('active');
  if (sipCurrentScreen === 4 || sipCurrentScreen === 5) {
    sipRenderScreen();
  }
}

function sipProtoNext() {
  if (sipCurrentScreen < sipTotalScreens) {
    sipCurrentScreen++;
    sipRenderScreen();
    sipUpdateProtoUI();
  }
}

function sipProtoPrev() {
  if (sipCurrentScreen > 1) {
    sipCurrentScreen--;
    sipRenderScreen();
    sipUpdateProtoUI();
  }
}

function sipUpdateProtoUI() {
  var label = document.getElementById('sip-proto-screen-label');
  if (label) label.textContent = 'Screen ' + sipCurrentScreen + ' of ' + sipTotalScreens + ' \u2014 ' + SIP_SCREEN_NAMES[sipCurrentScreen];

  var prev = document.getElementById('sip-proto-prev');
  if (prev) prev.disabled = sipCurrentScreen <= 1;
  var next = document.getElementById('sip-proto-next');
  if (next) {
    next.disabled = sipCurrentScreen >= sipTotalScreens;
    next.textContent = sipCurrentScreen >= sipTotalScreens ? 'Done' : 'Next \u203A';
  }

  // Dots
  var dotsEl = document.getElementById('sip-proto-dots');
  if (dotsEl) {
    var dotsHtml = '';
    for (var i = 1; i <= sipTotalScreens; i++) {
      var cls = 'sip-proto-dot';
      if (i === sipCurrentScreen) cls += ' active';
      else if (i < sipCurrentScreen) cls += ' done';
      dotsHtml += '<div class="' + cls + '"></div>';
    }
    dotsEl.innerHTML = dotsHtml;
  }

  // Step list
  var stepList = document.getElementById('sip-proto-step-list');
  if (stepList) {
    var slHtml = '';
    for (var j = 1; j <= sipTotalScreens; j++) {
      var icon = j < sipCurrentScreen ? '\u2705' : j === sipCurrentScreen ? '\u25B6' : '\u25CB';
      var style = j === sipCurrentScreen ? 'font-weight:700;color:var(--color-primary)' : j < sipCurrentScreen ? 'color:var(--color-success-dark)' : '';
      slHtml += '<div style="padding:3px 0;font-size:12px;' + style + '">' + icon + ' ' + SIP_SCREEN_NAMES[j] + '</div>';
    }
    stepList.innerHTML = slHtml;
  }
}

/* ─────────────────────────────────────────────
   8. MASTER INIT
   ───────────────────────────────────────────── */
function sipCopInit() {
  sipRenderFlow();
  sipRenderCopDeepDive();
  sipRenderStories();
  sipRenderRST();
  sipRenderGaps();
  sipProtoInit();
}
