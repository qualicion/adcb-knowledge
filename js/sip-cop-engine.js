/* ============================================================
   ADCB Open Finance — SIP CoP Flow Engine
   Rendering engine for the SIP Confirmation of Payee section.
   Depends on globals: SIP_FLOW_STEPS, SIP_COP_STORIES,
                        SIP_RST_SECTIONS, SIP_GAPS
   ============================================================ */

/* ── STATE ── */
var sipCurrentScreen = 1;
var sipCurrentScenario = 'exact';
var sipTotalScreens = 11;

var SIP_SCREEN_NAMES = ['',
  'TPP: Fill in Payment Data',
  'TPP: Choose Account / Bank',
  'TPP: Permission to Pay (AlTareq)',
  'Redirection to LFI',
  'LFI: Authentication',
  'CoP: Verifying Payee',
  'CoP: Result',
  'LFI: Confirm Payment Details',
  'LFI: PIN / Biometric Auth',
  'Redirection to TPP',
  'TPP: Payment Confirmed'
];

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
    1: {label:'STEP P-0',desc:'TPP: Payment Data & Bank Selection',cop:false},
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

/* ── Shared header + field row helpers ── */
function sipHdr(title, showBack) {
  return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #E2E8F0;">' +
    '<div style="display:flex;align-items:center;gap:6px;">' +
      (showBack ? '<span style="cursor:pointer;font-size:16px;color:#475569;" onclick="sipProtoPrev()">\u2190</span>' : '<div style="width:22px;height:22px;background:#E31E24;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;">\u25B6</div>') +
      '<div style="font-size:13px;font-weight:700;">' + title + '</div>' +
    '</div>' +
    '<div style="width:22px;height:22px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#666;">\u2715</div>' +
  '</div>';
}
function sipRow(k, v, extra) {
  return '<div style="display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;border-bottom:1px solid #f5f5f5;"><span style="color:#475569;">' + k + '</span><span style="font-weight:600;color:#0F172A;' + (extra||'') + '">' + v + '</span></div>';
}
function sipBtn(label, onclick, style) {
  return '<button style="background:linear-gradient(135deg,#00B4C8,#005f6b);color:white;border:none;border-radius:24px;padding:12px;width:calc(100% - 28px);margin:14px 14px 8px;font-size:13px;font-weight:600;cursor:pointer;' + (style||'') + '" onclick="' + onclick + '">' + label + '</button>';
}
function sipBtnSec(label, onclick) {
  return '<button style="background:white;color:#0F172A;border:1px solid #E2E8F0;border-radius:24px;padding:11px;width:calc(100% - 28px);margin:0 14px 12px;font-size:13px;font-weight:600;cursor:pointer;" onclick="' + onclick + '">' + label + '</button>';
}
function sipLogo() {
  return '<div style="text-align:center;padding:10px;"><div style="font-size:13px;color:#0D3349;">\u0627\u0644\u0637\u0627\u0631\u0642</div><div style="font-size:16px;font-weight:700;color:#0D3349;letter-spacing:2px;">ALTAREQ</div></div>';
}

/* ── Owner label bar (TPP / LFI / Redirect) ── */
function sipOwnerBar(owner) {
  var colors = {
    'TPP': 'background:linear-gradient(135deg,#00B4C8,#0D3349);',
    'YOUR LFI': 'background:linear-gradient(135deg,#0D9488,#1C2B4A);',
    'Redirection': 'background:linear-gradient(135deg,#00B4C8,#0D3349);'
  };
  return '<div style="' + (colors[owner]||colors.TPP) + 'color:white;padding:6px 14px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;display:flex;align-items:center;gap:6px;">' +
    '<span style="font-size:12px;">\u2190</span> ' + owner + '</div>';
}

/* ── AlTareq stepper bar ── */
function sipStepper(active) {
  var steps = ['Consent','Authorise','Complete'];
  var h = '<div style="display:flex;align-items:center;justify-content:center;padding:8px 20px;gap:0;">';
  for (var i = 0; i < steps.length; i++) {
    var done = i < active;
    var cur = i === active;
    var bg = done || cur ? '#00B4C8' : '#e0e0e0';
    var col = done || cur ? 'white' : '#999';
    var tc = done || cur ? '#00B4C8' : '#999';
    h += '<div style="display:flex;flex-direction:column;align-items:center;flex:1;"><div style="width:22px;height:22px;border-radius:50%;background:' + bg + ';color:' + col + ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">' + (done ? '\u2713' : (i+1)) + '</div><div style="font-size:9px;color:' + tc + ';margin-top:2px;font-weight:600;">' + steps[i] + '</div></div>';
    if (i < 2) {
      var lineBg = done ? '#00B4C8' : '#e0e0e0';
      h += '<div style="flex:1;height:2px;background:' + lineBg + ';margin-top:-12px;"></div>';
    }
  }
  return h + '</div>';
}

function sipRenderScreen() {
  var display = document.getElementById('sip-proto-display');
  if (!display) return;
  var n = sipCurrentScreen;
  var html = '';

  /* ── SCREEN 1: TPP — Fill in payment data ── */
  if (n === 1) {
    html = sipOwnerBar('TPP') + sipLogo() + sipStepper(0) +
      '<div style="padding:12px 14px;">' +
        '<div style="font-size:11px;color:#475569;margin-bottom:4px;">Payment Total</div>' +
        '<div style="font-size:11px;color:#475569;margin-bottom:12px;display:flex;align-items:center;gap:4px;"><span style="width:16px;height:16px;background:#00B4C8;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:white;font-size:9px;">\u25B6</span> 1,000</div>' +
        '<div style="font-size:12px;font-weight:600;margin-bottom:8px;">Fill in with your data</div>' +
        '<div style="border:1px solid #E2E8F0;border-radius:6px;padding:8px 10px;font-size:11px;color:#94A3B8;margin-bottom:6px;">Supplier & Ltd</div>' +
        '<div style="border:1px solid #E2E8F0;border-radius:6px;padding:8px 10px;font-size:11px;color:#94A3B8;margin-bottom:12px;">AE07 0331 2345 6789 01234</div>' +
        '<div style="font-size:12px;font-weight:600;margin-bottom:8px;">Select payment method</div>' +
        '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #E2E8F0;border-radius:6px;margin-bottom:6px;"><span style="width:20px;height:14px;background:linear-gradient(90deg,#1A237E,#FFD700);border-radius:2px;"></span><span style="font-size:11px;">Credit/Debit Card</span></div>' +
        '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #E2E8F0;border-radius:6px;margin-bottom:6px;"><span style="font-size:11px;">Paypal</span></div>' +
        '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:2px solid #00B4C8;border-radius:6px;background:#F0FDFA;"><span style="width:16px;height:16px;background:#00B4C8;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:white;font-size:8px;">\u2713</span><span style="font-size:11px;font-weight:600;color:#00B4C8;">Pay by bank using AlTareq</span></div>' +
      '</div>';

  /* ── SCREEN 2: TPP — Choose your option ── */
  } else if (n === 2) {
    html = sipOwnerBar('TPP') + sipLogo() + sipStepper(0) +
      '<div style="padding:12px 14px;">' +
        '<div style="font-size:13px;font-weight:700;margin-bottom:10px;">Choose your option</div>' +
        '<div style="border:1px solid #E2E8F0;border-radius:6px;padding:8px 10px;font-size:11px;color:#475569;margin-bottom:6px;display:flex;align-items:center;gap:6px;"><span style="width:14px;height:14px;border-radius:50%;border:2px solid #ccc;"></span> Select your account</div>' +
        '<div style="border:2px solid #00B4C8;border-radius:6px;padding:8px 10px;font-size:11px;color:#0F172A;font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:6px;background:#F0FDFA;"><span style="width:14px;height:14px;border-radius:50%;background:#00B4C8;border:2px solid #00B4C8;display:inline-flex;align-items:center;justify-content:center;color:white;font-size:8px;">\u2713</span> Select your bank</div>' +
        '<div style="font-size:13px;font-weight:700;margin-bottom:8px;">Choose your bank</div>' +
        '<div style="border:1px solid #E2E8F0;border-radius:6px;padding:8px 10px;font-size:11px;color:#94A3B8;margin-bottom:8px;">Enter account provider...</div>' +
        '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f5f5f5;"><span style="font-size:11px;color:#475569;">Citibank UAE</span></div>' +
        '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f5f5f5;font-weight:600;color:#E31E24;"><span style="width:8px;height:8px;border-radius:50%;background:#E31E24;"></span> ADCB</div>' +
        '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f5f5f5;"><span style="font-size:11px;color:#475569;">Mashreq</span></div>' +
        '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;"><span style="font-size:11px;color:#475569;">RAKBANK</span></div>' +
      '</div>';

  /* ── SCREEN 3: TPP — Permission to make a payment ── */
  } else if (n === 3) {
    html = sipOwnerBar('TPP') + sipLogo() + sipStepper(0) +
      '<div style="padding:12px 14px;">' +
        '<div style="font-size:13px;font-weight:700;margin-bottom:4px;">Permission to make a payment</div>' +
        '<div style="font-size:10px;color:#475569;margin-bottom:12px;line-height:1.4;">To make a payment from your bank, we need your permission to access the required information.</div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="width:16px;height:16px;background:#00B4C8;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:white;font-size:8px;">\u25B6</span><span style="font-size:11px;font-weight:600;">Payment Total</span><span style="font-size:11px;color:#475569;margin-left:auto;">1,000</span></div>' +
        sipRow('Payment Reference', 'INV-2026-0042') +
        sipRow('Payment Purpose', 'Invoice Payment') +
        '<div style="margin-top:10px;font-size:10px;font-weight:600;margin-bottom:6px;">Payee Information</div>' +
        sipRow('Payee Name', 'Ahmed Al Maktoum') +
        sipRow('Account', 'AE07 0331 2345 6789 01234') +
      '</div>' +
      sipBtn('\uD83D\uDD12 Pay using AlTareq', 'sipProtoNext()') +
      '<div style="text-align:center;padding:4px 14px 8px;font-size:10px;color:#94A3B8;">By tapping you agree to the <span style="color:#00B4C8;">terms & conditions</span></div>' +
      sipBtnSec('Cancel', 'sipProtoPrev()');

  /* ── SCREEN 4: Redirection to LFI ── */
  } else if (n === 4) {
    html = '<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(160deg,#00B4C8 0%,#0D3349 100%);padding:30px 20px;text-align:center;min-height:500px;">' +
        '<div style="font-size:12px;color:rgba(255,255,255,.7);margin-bottom:20px;">You\'ll be redirected to</div>' +
        '<div style="width:56px;height:56px;background:rgba(255,255,255,.15);border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;"><img src="assets/images/adcb-logo.svg" alt="ADCB" style="height:20px;filter:brightness(0) invert(1);" /></div>' +
        '<div style="color:#fff;font-size:16px;font-weight:700;margin-bottom:4px;">[Your LFI]</div>' +
        '<div style="color:rgba(255,255,255,.6);font-size:11px;">don\'t close this window</div>' +
        '<div style="width:48px;height:48px;border:3px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:sme-spin 1s linear infinite;margin:30px 0;"></div>' +
        '<div style="margin-top:auto;color:rgba(255,255,255,.5);font-size:10px;">Powered by</div>' +
        '<div style="color:#fff;font-size:14px;font-weight:700;letter-spacing:2px;margin-top:4px;">ALTAREQ</div>' +
      '</div>';
    setTimeout(function() { if (sipCurrentScreen === 4) { sipCurrentScreen = 5; sipRenderScreen(); sipUpdateProtoUI(); } }, 2000);

  /* ── SCREEN 5: LFI Authentication ── */
  } else if (n === 5) {
    html = '<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#F8FAFC 0%,#E2E8F0 100%);padding:30px 20px;text-align:center;min-height:500px;">' +
        '<div style="font-size:12px;color:#475569;margin-bottom:16px;">Authentication</div>' +
        '<div style="width:72px;height:72px;background:#F0FDFA;border:2px solid #00B4C8;border-radius:16px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:32px;">\uD83C\uDFE6</div>' +
        '<div style="font-size:14px;font-weight:700;color:#0F172A;">Verifying your identity</div>' +
        '<div style="font-size:11px;color:#475569;margin-top:4px;">with your bank</div>' +
        '<div style="width:40px;height:40px;border:3px solid #E2E8F0;border-top-color:#00B4C8;border-radius:50%;animation:sme-spin 1s linear infinite;margin:24px 0;"></div>' +
      '</div>';
    setTimeout(function() { if (sipCurrentScreen === 5) { sipCurrentScreen = 6; sipRenderScreen(); sipUpdateProtoUI(); } }, 1500);

  /* ── SCREEN 6: CoP Verifying Payee ── */
  } else if (n === 6) {
    html = sipOwnerBar('YOUR LFI') + sipLogo() + sipStepper(0) +
      '<div style="padding:40px 14px;text-align:center;">' +
        '<div style="width:48px;height:48px;border:3px solid #E2E8F0;border-top-color:#00B4C8;border-radius:50%;animation:sme-spin 1s linear infinite;margin:0 auto 16px;"></div>' +
        '<div style="font-size:14px;font-weight:600;color:#0F172A;margin-bottom:4px;">Checking payee details...</div>' +
        '<div style="font-size:11px;color:#475569;">Verifying name against bank records</div>' +
      '</div>' +
      '<div style="margin:0 14px;padding:12px;background:#F8FAFC;border-radius:8px;">' +
        sipRow('Payee', 'Ahmed Al Maktoum') +
        sipRow('IBAN', 'AE21 0610 **** 1234') +
      '</div>';
    setTimeout(function() { if (sipCurrentScreen === 6) { sipCurrentScreen = 7; sipRenderScreen(); sipUpdateProtoUI(); } }, 1500);

  /* ── SCREEN 7: CoP Result ── */
  } else if (n === 7) {
    html = sipRenderCopResultScreen();

  /* ── SCREEN 8: LFI — Confirm Payment Details ── */
  } else if (n === 8) {
    html = sipOwnerBar('YOUR LFI') + sipLogo() + sipStepper(1) +
      '<div style="font-size:13px;font-weight:700;text-align:center;padding:8px 14px 4px;">Confirm Payment Details</div>' +
      '<div style="text-align:center;font-size:10px;color:#475569;padding:0 14px 6px;line-height:1.4;">[TPP trading name] needs your permission to make the payment below.</div>' +
      sipRow('Amount', '1,000 AED', 'color:#E31E24;font-weight:700;') +
      sipRow('Payee Name', 'Ahmed Al Maktoum') +
      sipRow('IBAN', 'AE21 0610 **** 1234') +
      sipRow('Payment Purpose', 'Invoice Payment') +
      sipRow('Payment Reference', 'INV-2026-0042') +
      '<div style="font-size:12px;font-weight:700;text-align:center;padding:10px 14px 4px;">Please select the account to pay from</div>' +
      '<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid #f5f5f5;">' +
        '<div style="width:16px;height:16px;border-radius:50%;border:2px solid #ccc;"></div>' +
        '<div style="flex:1;"><div style="font-size:11px;font-weight:600;">Current Account</div><div style="font-size:10px;color:#475569;">AE07 1234 5246 4523 4567 895</div></div><div style="font-size:10px;color:#475569;">M 44,576</div></div>' +
      '<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid #f5f5f5;">' +
        '<div style="width:16px;height:16px;border-radius:50%;border:2px solid #ccc;"></div>' +
        '<div style="flex:1;"><div style="font-size:11px;font-weight:600;">Savings</div><div style="font-size:10px;color:#475569;">AE07 1255 3546 4523 4567 895</div></div><div style="font-size:10px;color:#475569;">M 12,034</div></div>' +
      '<div style="text-align:center;font-size:10px;color:#E31E24;padding:6px;">*Select one option only</div>' +
      sipBtn('\uD83D\uDD12 Pay using AlTareq', 'sipProtoNext()') +
      sipBtnSec('Cancel', 'sipProtoPrev()');

  /* ── SCREEN 9: LFI — Authentication (Touch ID / Face ID / PIN) ── */
  } else if (n === 9) {
    html = sipOwnerBar('YOUR LFI') + sipLogo() + sipStepper(1) +
      '<div style="padding:20px 14px;text-align:center;">' +
        '<div style="font-size:14px;font-weight:700;color:#0F172A;margin-bottom:16px;">Touch ID<br>Authentication</div>' +
        '<div style="width:56px;height:56px;border-radius:50%;background:#F0FDFA;border:2px solid #00B4C8;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;">\uD83D\uDC46</div>' +
        '<div style="font-size:13px;font-weight:600;color:#0F172A;margin-bottom:12px;">Face ID<br>Authentication</div>' +
        '<div style="width:56px;height:56px;border-radius:50%;background:#F5F3FF;border:2px solid #8B5CF6;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;">\uD83D\uDC64</div>' +
        '<div style="font-size:13px;font-weight:600;color:#0F172A;margin-bottom:12px;">PIN entry<br>Authentication</div>' +
        '<div style="display:flex;justify-content:center;gap:8px;margin-bottom:8px;">' +
          '<div style="width:12px;height:12px;border-radius:50%;background:#1C2B4A;"></div>' +
          '<div style="width:12px;height:12px;border-radius:50%;background:#1C2B4A;"></div>' +
          '<div style="width:12px;height:12px;border-radius:50%;border:2px solid #ccc;"></div>' +
          '<div style="width:12px;height:12px;border-radius:50%;border:2px solid #ccc;"></div>' +
        '</div>' +
      '</div>';

  /* ── SCREEN 10: Redirection back to TPP ── */
  } else if (n === 10) {
    html = '<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(160deg,#00B4C8 0%,#0D3349 100%);padding:30px 20px;text-align:center;min-height:500px;">' +
        '<div style="font-size:12px;color:rgba(255,255,255,.7);margin-bottom:20px;">You\'ll be redirected back to</div>' +
        '<div style="width:56px;height:56px;background:rgba(255,255,255,.15);border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;font-size:24px;">\uD83D\uDED2</div>' +
        '<div style="color:#fff;font-size:16px;font-weight:700;margin-bottom:4px;">[Your TPP]</div>' +
        '<div style="color:rgba(255,255,255,.6);font-size:11px;">don\'t close this window</div>' +
        '<div style="width:48px;height:48px;border:3px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:sme-spin 1s linear infinite;margin:30px 0;"></div>' +
        '<div style="margin-top:auto;color:rgba(255,255,255,.5);font-size:10px;">Powered by</div>' +
        '<div style="color:#fff;font-size:14px;font-weight:700;letter-spacing:2px;margin-top:4px;">ALTAREQ</div>' +
      '</div>';

  /* ── SCREEN 11: TPP — Thank you / Confirmation ── */
  } else if (n === 11) {
    html = sipOwnerBar('TPP') + sipLogo() + sipStepper(2) +
      '<div style="padding:20px 14px;text-align:center;">' +
        '<div style="font-size:16px;font-weight:700;color:#0F172A;margin-bottom:4px;">Thank you</div>' +
        '<div style="width:48px;height:48px;border-radius:50%;border:3px solid #15803D;display:flex;align-items:center;justify-content:center;font-size:20px;color:#15803D;margin:12px auto;">\u2713</div>' +
        '<div style="font-size:12px;color:#475569;margin-bottom:16px;">Your Payment has been <strong style="color:#15803D;">[Authorised/Completed]</strong></div>' +
        '<div style="text-align:left;padding:12px;background:#F8FAFC;border-radius:10px;">' +
          sipRow('Amount', '1,000 AED') +
          sipRow('Payee', 'Ahmed Al Maktoum') +
          sipRow('IBAN', 'AE07 0331 2345 6789 01234') +
          sipRow('Reference', 'INV-2026-0042') +
          sipRow('Date', '17 Apr 2026, 10:15') +
        '</div>' +
      '</div>' +
      sipBtn('Done', 'sipCurrentScreen=1;sipRenderScreen();sipUpdateProtoUI()');
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

  var bannerColors = {exact:'#F0FDF4;border:1px solid #86EFAC',partial:'#FFFBEB;border:1px solid #FDE68A',none:'#FEF2F2;border:1px solid #FECACA',unavailable:'#F0F4FF;border:1px solid #BFDBFE'};
  var bannerBg = bannerColors[sc] || bannerColors.exact;

  var h = sipOwnerBar('YOUR LFI') + sipLogo() + sipStepper(0) +
    '<div style="padding:14px;">' +
      '<div style="font-size:13px;font-weight:700;margin-bottom:10px;">Payee Verification</div>' +
      '<div style="padding:10px 12px;background:#F8FAFC;border-radius:8px;margin-bottom:14px;">' +
        sipRow('Payee', 'Ahmed Al Maktoum') +
        sipRow('IBAN', 'AE21 0610 **** 1234') +
      '</div>' +
      '<div style="display:flex;gap:10px;padding:12px;border-radius:10px;background:' + bannerBg + ';margin-bottom:14px;"><span style="font-size:20px;flex-shrink:0;">' + cfg.icon + '</span><div><div style="font-weight:700;font-size:12px;margin-bottom:2px;">' + cfg.title + '</div><div style="font-size:11px;color:#475569;">' + cfg.desc + '</div></div></div>';

  if (cfg.checkbox) {
    h += '<label class="sip-confirm-checkbox' + (cfg.danger ? ' danger-bg' : '') + '">' +
      '<input type="checkbox" onchange="sipUpdateCopProceed()"> <span>' + cfg.checkLabel + '</span></label>';
  }

  h += '<button id="sip-cop-proceed" style="background:linear-gradient(135deg,#00B4C8,#005f6b);color:white;border:none;border-radius:24px;padding:12px;width:100%;font-size:13px;font-weight:600;cursor:pointer;margin-top:8px;' + (cfg.canProceed ? '' : 'opacity:0.5;pointer-events:none;') + '" onclick="sipHandleCopProceed()">' + cfg.btnText + '</button>' +
    '<button style="background:white;color:#0F172A;border:1px solid #E2E8F0;border-radius:24px;padding:11px;width:100%;font-size:13px;font-weight:600;cursor:pointer;margin-top:8px;" onclick="sipProtoPrev()">Go Back \u2014 Edit Details</button>' +
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
