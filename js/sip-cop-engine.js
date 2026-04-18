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
/* ── Screen descriptions (one-liner context) ── */
var SIP_SCREEN_DESCS = {
  1:  'Customer fills in payment details at the TPP checkout. Selects "Pay by bank using AlTareq" as payment method.',
  2:  'Customer chooses to select an existing account or pick a new bank from the LFI directory.',
  3:  'TPP shows the AlTareq consent screen with full payment details. Customer reviews before being redirected.',
  4:  'Customer is being redirected from the TPP to their bank (LFI) for authentication. Do not close this window.',
  5:  'The bank verifies the customer\'s identity. This happens automatically before the consent screens load.',
  6:  'The bank sends a CoP query to check if the payee name matches the account holder on that IBAN.',
  7:  'CoP result is shown. Exact match = green. Partial = amber warning. No match = red risk. Unavailable = info.',
  8:  'Customer sees payment details on the bank side and selects which account to pay from. Only one can be selected.',
  9:  'Customer authenticates with Touch ID, Face ID, or PIN to authorise the payment.',
  10: 'Payment is authorised. Customer is being redirected back to the TPP. Do not close this window.',
  11: 'Payment is confirmed. The TPP shows a receipt with transaction details.'
};

/* ── Ordered API-call sequences per screen ──
   Each screen lists the calls that fire while the user is on it, in the
   exact order they happen. The panel renders them numbered 01, 02, 03\u2026
*/
var SIP_SCREEN_API_CALLS = {
  1: { title: 'TPP CHECKOUT', calls: [] },
  2: {
    title: 'BANK / ACCOUNT SELECTION',
    calls: [
      { method: 'GET', label: 'LFI Directory', caller: 'Amazon \u2192 OF Hub',
        code: '// TPP fetches registered LFIs from the OF Hub\nGET /api/v2.0/participants\n\n// Response: list of banks\n[\n  { "name": "ADCB",        "bic": "ADCBAEAA" },\n  { "name": "Emirates NBD","bic": "ABORAEAA" },\n  { "name": "Mashreq",     "bic": "BOMLAEAD" },\n  { "name": "RAKBANK",     "bic": "NRAKAEAK" }\n]' }
    ]
  },
  3: {
    title: 'CoP QUERY + CONSENT INITIATION',
    calls: [
      { method: 'POST', label: 'Confirmation of Payee (mandatory pre-consent)', caller: 'Amazon \u2192 OF Hub \u2192 ADCB',
        code: '// CBUAE requires a CoP check BEFORE the consent is created\nPOST /api/v2.0/customers/action/cop-query\n{\n  "Name":    { "fullName": "Ahmed Al Maktoum" },\n  "Account": { "SchemeName":     "IBAN",\n               "Identification": "AE070331234567890123" }\n}\n\n// Response:\n{ "MatchResult":   "ExactMatch",\n  "MatchedName":   "Ahmed Al Maktoum",\n  "AccountStatus": "Active" }' },
      { method: 'POST', label: 'Payment Consent Initiate (carries CoP result)', caller: 'Amazon \u2192 OF Hub',
        code: 'POST /api/v2.0/payment-consents/initiate\n{\n  "Data": {\n    "Initiation": {\n      "InstructedAmount": { "Amount": "1000", "Currency": "AED" },\n      "CreditorAccount":  { "Identification": "AE070331\u2026" },\n      "CreditorName":     "Ahmed Al Maktoum",\n      "RemittanceInformation": { "Reference": "INV-2026-0042" }\n    },\n    "CoPResult": {\n      "matchResult":    "ExactMatch",\n      "queryTimestamp": "2026-04-17T10:15:00Z"\n    }\n  },\n  "Risk": { "PaymentContextCode": "EcommerceGoods" }\n}' },
      { method: 'POST', label: 'Pushed Authorisation Request (PAR)', caller: 'Amazon \u2192 Al Tareq Hub',
        code: 'POST /as/par\n{\n  "response_type": "code",\n  "client_id":    "tpp-client-001",\n  "scope":        "payments openid",\n  "request":      "<signed-JAR-JWT>"\n}\n\n// Response:\n{ "request_uri": "urn:adcb:bwc:1234", "expires_in": 90 }' }
    ]
  },
  4: {
    title: 'REDIRECT TO ADCB',
    calls: [
      { method: 'GET', label: 'OAuth2 Authorise (handover to ADCB)', caller: 'Browser \u2192 Al Tareq Hub',
        code: '// OAuth2 redirect via the Al Tareq hub\nGET /as/authorize\n  ?request_uri=urn:adcb:bwc:1234\n  &client_id=tpp-client-001\n\n// 302 \u2192 https://auth.adcb.ae/mib/login' }
    ]
  },
  5: {
    title: 'ADCB AUTHENTICATION (INTERNAL)',
    calls: [
      { method: 'POST', label: 'ADCB session login (BAU, not exposed to TPP)', caller: 'Customer \u2192 ADCB',
        code: '// Internal ADCB auth \u2014 customer logs in\nPOST /mib/auth/login\n{ "username": "****", "method": "password" }\n\n// Response:\n{ "sessionId": "sid-\u2026", "status": "AuthRequired" }' }
    ]
  },
  6: {
    title: 'CoP ECHO TO ADCB',
    calls: [
      { method: 'GET', label: 'Fetch pending consent + CoP result', caller: 'ADCB \u2192 Al Tareq Hub',
        code: '// ADCB pulls the pending consent to render it\nGET /api/v2.0/payment-consents/{ConsentId}\n\n// Response (partial):\n{\n  "Status":    "AwaitingAuthorisation",\n  "CoPResult": { "matchResult": "ExactMatch" },\n  "Initiation": {\n    "InstructedAmount": { "Amount": "1000", "Currency": "AED" }\n  }\n}' }
    ]
  },
  7: {
    title: 'CoP RESULT DISPLAY',
    calls: [
      { method: 'N/A', label: 'Client-side rendering of CoP outcome', caller: 'ADCB UI',
        code: '// No network call \u2014 badge derived from consent.CoPResult\n"ExactMatch"    \u2192 \u2705 Green  \u2014 proceed automatically\n"PartialMatch"  \u2192 \u26A0 Amber  \u2014 checkbox required\n"NoMatch"       \u2192 \u274C Red    \u2014 explicit risk acceptance\n"Unavailable"   \u2192 \u2139 Blue   \u2014 proceed with caution' }
    ]
  },
  8: {
    title: 'CONFIRM DETAILS + ACCOUNT SELECTION',
    calls: [
      { method: 'GET', label: 'List eligible debtor accounts', caller: 'ADCB (internal)',
        code: 'GET /mib/accounts\n// Returns: eligible AED CASA accounts with balances\n[\n  { "iban": "AE07 1234 5246 4523 4567 895",\n    "type": "Current", "balance": 44576.00, "currency": "AED" },\n  { "iban": "AE07 1255 3546 4523 4567 895",\n    "type": "Savings", "balance": 12034.00, "currency": "AED" }\n]' },
      { method: 'PATCH', label: 'Record account selection on consent', caller: 'ADCB \u2192 Al Tareq Hub',
        code: 'PATCH /api/v2.0/payment-consents/{ConsentId}\n{\n  "Data": {\n    "Action": "AccountSelected",\n    "DebtorAccount": {\n      "SchemeName":     "IBAN",\n      "Identification": "AE07 1234 5246 4523 4567 895"\n    }\n  }\n}' }
    ]
  },
  9: {
    title: 'SCA AUTHORISATION',
    calls: [
      { method: 'POST', label: 'Strong Customer Auth (Touch ID / Face ID / PIN)', caller: 'Customer \u2192 ADCB',
        code: 'POST /mib/auth/verify\n{\n  "consentId": "pcon-001",\n  "method":    "touch_id",   // or face_id / pin\n  "sessionId": "sid-\u2026"\n}\n\n// 3 attempts max before consent is rejected' },
      { method: 'PATCH', label: 'Mark consent Authorised', caller: 'ADCB \u2192 Al Tareq Hub',
        code: 'PATCH /api/v2.0/payment-consents/{ConsentId}\n{\n  "Data": {\n    "Status":            "Authorised",\n    "AuthorisationCode": "AUTH-XYZ-001"\n  }\n}' }
    ]
  },
  10: {
    title: 'REDIRECT BACK + TOKEN EXCHANGE',
    calls: [
      { method: 'GET', label: 'OAuth2 callback with auth code', caller: 'Browser \u2192 Amazon',
        code: '// ADCB redirects back to Amazon\'s callback URI\nGET {tpp_callback}\n  ?code={authorization_code}\n  &state={original_state}' },
      { method: 'POST', label: 'Exchange code for access token (PKCE + private_key_jwt)', caller: 'Amazon \u2192 Al Tareq Hub',
        code: 'POST /as/token\ngrant_type=authorization_code\n&code={auth_code}\n&code_verifier={pkce_verifier}\n&client_assertion_type=\u2026jwt-bearer\n&client_assertion={private_key_jwt}\n\n// Response:\n{ "access_token": "eyJ\u2026", "expires_in": 3600 }' }
    ]
  },
  11: {
    title: 'PAYMENT EXECUTION (PI-6) + STATUS (PI-8)',
    calls: [
      { method: 'POST', label: 'Execute payment (PI-6, signed JWT + idempotency key)', caller: 'Amazon \u2192 OF Hub \u2192 ADCB',
        code: 'POST /api/v2.0/payments\nx-idempotency-key: 8f3a\u2026b7\nContent-Type: application/jose\n\n{\n  "Data": {\n    "ConsentId": "pcon-001",\n    "Initiation": {\n      "InstructedAmount": { "Amount": "1000", "Currency": "AED" },\n      "CreditorAccount":  { "Identification": "AE070331\u2026" },\n      "DebtorAccount":    { "Identification": "AE071234\u2026" }\n    }\n  },\n  "Risk": { "PaymentContextCode": "EcommerceGoods" }\n}\n\n// 201 Created\n{ "DomesticPaymentId": "PAY-001", "Status": "Pending" }' },
      { method: 'GET', label: 'Poll payment status (PI-8)', caller: 'Amazon \u2192 OF Hub',
        code: 'GET /api/v2.0/payments/PAY-001\n\n// Terminal status reached:\n{ "DomesticPaymentId": "PAY-001",\n  "Status":            "AcceptedSettlementCompleted",\n  "CreationDateTime":  "2026-04-17T10:15:00Z" }' }
    ]
  }
};

/* Colour mapping for HTTP methods in the panel */
var SIP_METHOD_COLORS = {
  GET:    { bg: '#0B2948', fg: '#93C5FD' },
  POST:   { bg: '#0B3524', fg: '#6EE7B7' },
  PUT:    { bg: '#3F2B0A', fg: '#FCD34D' },
  PATCH:  { bg: '#3F2B0A', fg: '#FCD34D' },
  DELETE: { bg: '#3F1414', fg: '#FCA5A5' },
  'N/A':  { bg: '#1F2937', fg: '#9CA3AF' }
};

/* Render the dark API panel for a screen, numbering calls in sequence */
function sipRenderApiPanel(n) {
  var body = document.getElementById('sip-dev-body');
  var titleEl = document.getElementById('sip-dev-title');
  var data = SIP_SCREEN_API_CALLS[n];
  if (!body || !data) return;
  if (titleEl) titleEl.textContent = data.title;

  if (!data.calls || data.calls.length === 0) {
    body.innerHTML = '<p style="font-size:11px;color:#8B949E;margin:0;line-height:1.6;">'
      + 'No API calls yet \u2014 this is the TPP\u2019s own checkout page. Payment details (amount, IBAN, payee name) are collected client-side and will be sent to the OF Hub on the next screen.'
      + '</p>';
    return;
  }

  var html = '';
  for (var i = 0; i < data.calls.length; i++) {
    var c = data.calls[i];
    var seq = String(i + 1).padStart(2, '0');
    var mc = SIP_METHOD_COLORS[c.method] || SIP_METHOD_COLORS.GET;
    // Escape HTML first, then syntax-colour line-by-line so the span
    // attributes we inject are never matched by the string regex.
    var code = (c.code || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    code = code.split('\n').map(function(line) {
      // Whole-line comments \u2192 grey
      var m = line.match(/^(\s*)(\/\/.*)$/);
      if (m) return m[1] + '<span style="color:#8B949E;">' + m[2] + '</span>';
      // Otherwise highlight quoted strings on the line \u2192 blue
      return line.replace(/("[^"\n]*")/g, '<span style="color:#A5D6FF;">$1</span>');
    }).join('\n');
    html += '<div style="margin-bottom:' + (i === data.calls.length - 1 ? '0' : '14px') + ';">'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">'
      +   '<span style="font-size:10px;font-weight:800;color:#6E7681;font-variant-numeric:tabular-nums;letter-spacing:.6px;">' + seq + '</span>'
      +   '<span style="background:' + mc.bg + ';color:' + mc.fg + ';font-size:10px;font-weight:800;padding:2px 7px;border-radius:4px;font-family:JetBrains Mono,Menlo,monospace;letter-spacing:.4px;">' + c.method + '</span>'
      +   '<span style="font-size:10px;font-weight:700;color:#E6EDF3;">' + c.label + '</span>'
      + '</div>'
      + '<div style="font-size:10px;color:#8B949E;margin:0 0 6px 26px;">' + (c.caller || '') + '</div>'
      + '<pre class="sme-code-block" style="margin-left:26px;color:#C9D1D9;">' + code + '</pre>'
      + '</div>';
  }
  body.innerHTML = html;
}

function sipProtoInit() {
  var el = document.getElementById('sip-proto-root');
  if (!el) return;

  sipCurrentScreen = 1;
  sipCurrentScenario = 'exact';

  var html =
    /* Scenario picker */
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">' +
      '<button class="sip-scenario-btn active" id="sip-scen-exact" onclick="sipSetScenario(\'exact\',this)" style="flex:1;min-width:120px;"><span class="sip-sc-tag sip-sc-happy">HAPPY</span> Exact Match</button>' +
      '<button class="sip-scenario-btn" id="sip-scen-partial" onclick="sipSetScenario(\'partial\',this)" style="flex:1;min-width:120px;"><span class="sip-sc-tag sip-sc-warn">WARNING</span> Partial Match</button>' +
      '<button class="sip-scenario-btn" id="sip-scen-none" onclick="sipSetScenario(\'none\',this)" style="flex:1;min-width:120px;"><span class="sip-sc-tag sip-sc-danger">RISK</span> No Match</button>' +
      '<button class="sip-scenario-btn" id="sip-scen-unavailable" onclick="sipSetScenario(\'unavailable\',this)" style="flex:1;min-width:120px;"><span class="sip-sc-tag sip-sc-grey">FALLBACK</span> CoP Unavailable</button>' +
    '</div>' +
    /* Screen description */
    '<div id="sip-screen-desc" style="padding:8px 14px;background:var(--color-surface-secondary);border:1px solid var(--color-border);border-radius:var(--radius-button);margin-bottom:12px;font-size:12px;color:var(--color-text-secondary);line-height:1.5;"></div>' +
    /* Screen counter + step pills */
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;" id="sip-step-pills"></div>' +
    /* Phone + API panel */
    '<div style="display:flex;gap:16px;align-items:flex-start;">' +
      '<div style="flex-shrink:0;">' +
        '<div class="sip-proto-phone" id="sip-proto-phone" style="cursor:pointer;" onclick="sipProtoNext()">' +
          '<div class="sip-proto-phone-inner">' +
            '<div class="sip-proto-notch"></div>' +
            '<div class="sip-proto-statusbar" id="sip-proto-statusbar">' +
              '<div>9:41</div>' +
              '<div class="sip-proto-statusbar-right">' +
                '<svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="0.6"/><rect x="4.5" y="5" width="3" height="6" rx="0.6"/><rect x="9" y="2.5" width="3" height="8.5" rx="0.6"/><rect x="13.5" y="0" width="3" height="11" rx="0.6"/></svg>' +
                '<svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor"><path d="M7.5 3C9.6 3 11.5 3.8 13 5l1-1A9 9 0 000 4l1 1c1.5-1.2 3.4-2 5.5-2z" opacity="0.9"/><path d="M7.5 6c1.2 0 2.3.4 3.2 1.2l1-1A6 6 0 003.3 6.2l1 1c.9-.8 2-1.2 3.2-1.2z" opacity="0.9"/><circle cx="7.5" cy="9.5" r="1.3"/></svg>' +
                '<svg width="25" height="11" viewBox="0 0 25 11"><rect x="0" y="0" width="22" height="11" rx="3" fill="none" stroke="currentColor" stroke-opacity="0.4"/><rect x="1.5" y="1.5" width="19" height="8" rx="1.5" fill="currentColor"/><rect x="23" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" opacity="0.4"/></svg>' +
              '</div>' +
            '</div>' +
            '<div class="sip-proto-display" id="sip-proto-display"></div>' +
            '<div class="sip-proto-home-ind"></div>' +
            '<div class="sip-modal-overlay" id="sip-no-match-modal">' +
              '<div class="sip-modal-box">' +
                '<div style="font-size:40px;margin-bottom:8px">\u26A0\uFE0F</div>' +
                '<h3>Are you sure?</h3>' +
                '<p>The payee name does <strong>not match</strong> the bank account. Sending money to the wrong account is hard to reverse.</p>' +
                '<div class="sip-modal-btns">' +
                  '<button style="background:#eee;color:#333" onclick="event.stopPropagation();sipHideNoMatchModal()">Go Back</button>' +
                  '<button style="background:var(--color-error);color:#fff" onclick="event.stopPropagation();sipHideNoMatchModal();sipProtoNext()">I Accept Risk</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:center;margin-top:8px;font-size:11px;color:var(--color-text-tertiary);">Tap the screen to advance</div>' +
      '</div>' +
      '<div style="flex:1;min-width:0;max-height:700px;background:#0D1117;border-radius:var(--radius-card);border:1px solid #30363D;overflow:hidden;display:flex;flex-direction:column;">' +
        '<div style="background:#161B22;border-bottom:1px solid #30363D;padding:10px 16px;font-size:12px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.6px;display:flex;align-items:center;gap:5px;flex-shrink:0;">' +
          '<span style="width:8px;height:8px;border-radius:50%;background:#F85149;"></span>' +
          '<span style="width:8px;height:8px;border-radius:50%;background:#E3B341;"></span>' +
          '<span style="width:8px;height:8px;border-radius:50%;background:#56D364;"></span>' +
          '<span id="sip-dev-title" style="margin-left:8px;">API Calls</span>' +
        '</div>' +
        '<div id="sip-dev-body" style="padding:14px;overflow-y:auto;flex:1;"></div>' +
      '</div>' +
    '</div>';

  el.innerHTML = html;
  sipRenderScreen();
  sipUpdateProtoUI();
}

/* ── Shared header + field row helpers ── */
function sipHdr(title, showBack) {
  return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #E2E8F0;background:#fff;">' +
    '<div style="display:flex;align-items:center;gap:8px;">' +
      (showBack ? '<span style="cursor:pointer;font-size:16px;color:#475569;" onclick="sipProtoPrev()">\u2190</span>' : '<div style="width:22px;height:22px;background:#0D9488;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;">\u25B6</div>') +
      '<div style="font-size:13px;font-weight:700;color:#0F172A;">' + title + '</div>' +
    '</div>' +
    '<div style="width:22px;height:22px;border-radius:50%;background:#F1F5F9;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#64748B;">\u2715</div>' +
  '</div>';
}
function sipRow(k, v, extra) {
  return '<div style="display:flex;justify-content:space-between;padding:7px 14px;font-size:11px;border-bottom:1px dashed #F1F5F9;"><span style="color:#64748B;">' + k + '</span><span style="font-weight:600;color:#0F172A;' + (extra||'') + '">' + v + '</span></div>';
}

/* Card wrapper used across screens */
function sipCard(inner, style) {
  return '<div style="background:#fff;border-radius:14px;padding:14px;box-shadow:0 1px 2px rgba(15,23,42,0.04),0 4px 12px rgba(15,23,42,0.04);' + (style||'') + '">' + inner + '</div>';
}

/* Chip badge used on payee row */
function sipBadge(label, color, bg) {
  return '<span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px;background:' + bg + ';color:' + color + ';">' + label + '</span>';
}
function sipBtn(label, onclick, style) {
  return '<button style="background:linear-gradient(90deg,#0D9488,#1C2B4A);color:white;border:none;border-radius:24px;padding:12px;width:calc(100% - 28px);margin:14px 14px 8px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 6px 14px rgba(13,148,136,0.25);' + (style||'') + '" onclick="' + onclick + '">' + label + '</button>';
}
function sipBtnSec(label, onclick) {
  return '<button style="background:white;color:#0F172A;border:1.5px solid #E2E8F0;border-radius:24px;padding:11px;width:calc(100% - 28px);margin:0 14px 12px;font-size:13px;font-weight:600;cursor:pointer;" onclick="' + onclick + '">' + label + '</button>';
}

/* Al Tareq logo \u2014 gradient disc + wordmark (matches cop-prototype.html) */
function sipLogo() {
  return '<div style="text-align:center;padding:12px 0 4px;">' +
    '<div style="display:inline-flex;align-items:center;gap:7px;">' +
      '<svg width="22" height="22" viewBox="0 0 32 32" style="display:block;">' +
        '<defs><linearGradient id="sip-atg" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="#0D9488"/><stop offset="1" stop-color="#1C2B4A"/>' +
        '</linearGradient></defs>' +
        '<circle cx="16" cy="16" r="15" fill="url(#sip-atg)"/>' +
        '<path d="M10 16a6 6 0 1011 3.3" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
        '<path d="M13 15.5l2.3 2.3L21 12" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>' +
      '<div style="font-weight:800;font-size:15px;color:#0F172A;letter-spacing:-0.3px;">Al <span style="color:#0D9488;">Tareq</span></div>' +
    '</div>' +
    '<div style="font-size:9px;color:#94A3B8;margin-top:2px;letter-spacing:1.5px;">\u0627\u0644\u0637\u0627\u0631\u0642</div>' +
  '</div>';
}

/* ADCB shield logo \u2014 used on LFI screens */
function sipAdcbLogo(inverted) {
  var fg = inverted ? '#fff' : '#0F172A';
  return '<div style="display:inline-flex;align-items:center;gap:7px;">' +
    '<svg width="22" height="22" viewBox="0 0 28 28" style="display:block;">' +
      '<path d="M14 2L3 6v8c0 6 4.5 10.5 11 12 6.5-1.5 11-6 11-12V6L14 2z" fill="#E31E24"/>' +
      '<path d="M8 13l6-5 6 5-6 5-6-5z" fill="#fff"/>' +
    '</svg>' +
    '<div style="font-weight:800;font-size:15px;color:' + fg + ';letter-spacing:0.4px;">ADCB</div>' +
  '</div>';
}

/* ── Owner label bar (orange for Amazon TPP, red for ADCB LFI, teal for Redirect) ──
   Top padding reserves 44px for the phone status bar that sits above it. */
function sipOwnerBar(owner) {
  var colors = {
    'AMAZON':      'background:linear-gradient(135deg,#232F3E,#131921);',
    'TPP':         'background:linear-gradient(135deg,#232F3E,#131921);',
    'ADCB':        'background:linear-gradient(135deg,#E31E24,#7F121C);',
    'YOUR LFI':    'background:linear-gradient(135deg,#E31E24,#7F121C);',
    'Redirection': 'background:linear-gradient(135deg,#0D9488,#1C2B4A);'
  };
  var displayName = owner === 'YOUR LFI' ? 'ADCB' : (owner === 'TPP' ? 'AMAZON' : owner);
  return '<div style="' + (colors[owner]||colors.TPP) + 'color:white;padding:50px 14px 10px;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;display:flex;align-items:center;gap:6px;flex-shrink:0;">' +
    '<span style="font-size:12px;">\u2190</span> ' + displayName + '</div>';
}

/* ── Al Tareq stepper bar (Consent \u2192 Authorise \u2192 Complete) ── */
function sipStepper(active) {
  var steps = ['Consent','Authorise','Complete'];
  var teal = '#0D9488';
  var h = '<div style="display:flex;align-items:center;justify-content:center;padding:10px 20px 12px;gap:0;background:#fff;">';
  for (var i = 0; i < steps.length; i++) {
    var done = i < active;
    var cur = i === active;
    var bg = done || cur ? teal : '#E2E8F0';
    var col = done || cur ? 'white' : '#94A3B8';
    var tc = done || cur ? '#0F172A' : '#94A3B8';
    var ring = cur ? 'box-shadow:0 0 0 4px rgba(13,148,136,0.15);' : '';
    h += '<div style="display:flex;flex-direction:column;align-items:center;flex:0 0 auto;z-index:1;">' +
           '<div style="width:24px;height:24px;border-radius:50%;background:' + bg + ';color:' + col + ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;' + ring + '">' + (done ? '\u2713' : (i+1)) + '</div>' +
           '<div style="font-size:10px;color:' + tc + ';margin-top:4px;font-weight:' + (cur ? '700' : '500') + ';">' + steps[i] + '</div>' +
         '</div>';
    if (i < 2) {
      var lineBg = done ? teal : '#E2E8F0';
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

  /* Status-bar colour: light text over coloured owner bars / redirects,
     dark text over light-bg screens (screen 5 = ADCB auth splash only) */
  var statusBar = document.getElementById('sip-proto-statusbar');
  if (statusBar) {
    var lightBgScreens = { 5: true };
    if (lightBgScreens[n]) statusBar.classList.remove('on-dark');
    else statusBar.classList.add('on-dark');
  }

  /* ── SCREEN 1: Amazon — Fill in payment data ── */
  if (n === 1) {
    html = sipOwnerBar('AMAZON') + sipLogo() + sipStepper(0) +
      '<div style="padding:12px 14px;background:#F8FAFC;">' +
        sipCard(
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<div style="width:28px;height:28px;border-radius:14px;background:rgba(13,148,136,0.12);display:flex;align-items:center;justify-content:center;">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="3" stroke="#0D9488" stroke-width="1.8"/><path d="M3 10h18" stroke="#0D9488" stroke-width="1.8"/></svg>' +
            '</div>' +
            '<div style="flex:1;font-size:11px;font-weight:600;color:#0F172A;">Payment Total</div>' +
            '<div style="font-size:13px;font-weight:800;color:#0F172A;">AED 1,000</div>' +
          '</div>' +
          sipRow('Payee Name', 'Ahmed Al Maktoum') +
          sipRow('IBAN', 'AE07 0331 2345 6789 01234') +
          sipRow('Reference', 'INV-2026-0042', 'border-bottom:none;'),
          'margin-bottom:10px;'
        ) +
        sipCard(
          '<div style="font-size:12px;font-weight:700;color:#0F172A;margin-bottom:10px;">Select payment method</div>' +
            '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #E2E8F0;border-radius:10px;margin-bottom:6px;">' +
              '<span style="width:22px;height:14px;background:linear-gradient(90deg,#1A237E,#FFD700);border-radius:2px;"></span>' +
              '<span style="font-size:11px;color:#0F172A;">Credit / Debit Card</span>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #E2E8F0;border-radius:10px;margin-bottom:8px;">' +
              '<span style="width:16px;height:16px;background:#1E40AF;color:#fff;font-size:9px;font-weight:800;border-radius:3px;display:inline-flex;align-items:center;justify-content:center;">P</span>' +
              '<span style="font-size:11px;color:#0F172A;">PayPal</span>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;padding:10px;border-radius:12px;background:linear-gradient(90deg,#1C2B4A,#0D9488);">' +
              '<span style="width:18px;height:18px;background:rgba(255,255,255,.2);border-radius:9px;display:inline-flex;align-items:center;justify-content:center;color:white;font-size:10px;">\u2713</span>' +
              '<span style="flex:1;font-size:11px;font-weight:700;color:#fff;">Pay by bank using Al Tareq</span>' +
              '<span style="width:14px;height:14px;border-radius:7px;border:2px solid #fff;display:inline-flex;align-items:center;justify-content:center;"><span style="width:6px;height:6px;border-radius:3px;background:#fff;"></span></span>' +
            '</div>'
        ) +
      '</div>';

  /* ── SCREEN 2: Amazon — Choose bank / ADCB ── */
  } else if (n === 2) {
    html = sipOwnerBar('AMAZON') + sipLogo() + sipStepper(0) +
      '<div style="padding:12px 14px;background:#F8FAFC;">' +
        sipCard(
          '<div style="font-size:12px;font-weight:700;color:#0F172A;margin-bottom:10px;">Choose your option</div>' +
          '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #F1F5F9;">' +
            '<span style="width:14px;height:14px;border-radius:7px;border:2px solid #CBD5E1;"></span>' +
            '<span style="font-size:11px;color:#475569;">Select your account</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;">' +
            '<span style="width:14px;height:14px;border-radius:7px;border:2px solid #0D9488;display:inline-flex;align-items:center;justify-content:center;"><span style="width:6px;height:6px;border-radius:3px;background:#0D9488;"></span></span>' +
            '<span style="font-size:11px;color:#0F172A;font-weight:600;">Select your bank</span>' +
          '</div>',
          'margin-bottom:10px;'
        ) +
        sipCard(
          '<div style="font-size:12px;font-weight:700;color:#0F172A;margin-bottom:10px;">Choose your bank</div>' +
          '<div style="height:34px;border-radius:10px;background:#F8FAFC;border:1px solid #E2E8F0;display:flex;align-items:center;padding:0 10px;gap:6px;margin-bottom:4px;">' +
            '<span style="font-size:11px;color:#94A3B8;flex:1;">Enter account provider\u2026</span>' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#94A3B8" stroke-width="2"/><path d="M20 20l-3.5-3.5" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/></svg>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:10px;padding:9px 2px;border-bottom:1px solid #F1F5F9;">' +
            '<span style="width:26px;height:26px;border-radius:6px;background:#E31E24;color:#fff;font-size:9px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;">ADCB</span>' +
            '<span style="flex:1;font-size:11px;font-weight:600;color:#0F172A;">Abu Dhabi Commercial Bank</span>' +
            '<span style="width:14px;height:14px;border-radius:7px;border:2px solid #0D9488;display:inline-flex;align-items:center;justify-content:center;"><span style="width:6px;height:6px;border-radius:3px;background:#0D9488;"></span></span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:10px;padding:9px 2px;border-bottom:1px solid #F1F5F9;">' +
            '<span style="width:26px;height:26px;border-radius:6px;background:#C8102E;color:#fff;font-size:9px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;">ENBD</span>' +
            '<span style="flex:1;font-size:11px;color:#475569;">Emirates NBD</span>' +
            '<span style="width:14px;height:14px;border-radius:7px;border:2px solid #CBD5E1;"></span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:10px;padding:9px 2px;border-bottom:1px solid #F1F5F9;">' +
            '<span style="width:26px;height:26px;border-radius:6px;background:#1D6FA4;color:#fff;font-size:9px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;">FAB</span>' +
            '<span style="flex:1;font-size:11px;color:#475569;">First Abu Dhabi Bank</span>' +
            '<span style="width:14px;height:14px;border-radius:7px;border:2px solid #CBD5E1;"></span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:10px;padding:9px 2px;">' +
            '<span style="width:26px;height:26px;border-radius:6px;background:#F26522;color:#fff;font-size:9px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;">MB</span>' +
            '<span style="flex:1;font-size:11px;color:#475569;">Mashreq Bank</span>' +
            '<span style="width:14px;height:14px;border-radius:7px;border:2px solid #CBD5E1;"></span>' +
          '</div>'
        ) +
      '</div>';

  /* ── SCREEN 3: Amazon — Permission to pay (CoP status + payee/payer) ── */
  } else if (n === 3) {
    html = sipOwnerBar('AMAZON') + sipLogo() + sipStepper(0) +
      '<div style="padding:12px 14px;background:#F8FAFC;">' +
        sipCard(
          '<div style="font-size:14px;font-weight:700;color:#0F172A;margin-bottom:4px;">Permission to make a payment</div>' +
          '<div style="font-size:11px;color:#64748B;margin-bottom:12px;line-height:1.4;">To make a payment from your bank, we need your permission to securely initiate the payment.</div>' +
          '<div style="background:#F8FAFC;border-radius:10px;padding:10px;margin-bottom:12px;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
              '<div style="width:24px;height:24px;border-radius:12px;background:rgba(13,148,136,0.15);display:flex;align-items:center;justify-content:center;">' +
                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="3" stroke="#0D9488" stroke-width="1.8"/><path d="M3 10h18" stroke="#0D9488" stroke-width="1.8"/></svg>' +
              '</div>' +
              '<div style="flex:1;font-size:11px;font-weight:600;color:#0F172A;">Payment Total</div>' +
              '<div style="font-size:12px;font-weight:800;color:#0F172A;">AED 1,000</div>' +
            '</div>' +
            sipRow('Reference', 'INV-2026-0042') +
            sipRow('Purpose', 'Invoice Payment', 'border-bottom:none;') +
          '</div>' +
          /* Payee accordion */
          '<div style="border-top:1px solid #F1F5F9;padding-top:10px;margin-top:4px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
              '<div style="font-size:12px;font-weight:700;color:#0D9488;">Payee information</div>' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="#0D9488" stroke-width="2.2" stroke-linecap="round"/></svg>' +
            '</div>' +
            sipRow('IBAN', 'AE07 0331 2345 6789 01234') +
            sipRow('Payee Name', 'Ahmed Al Maktoum') +
            '<div style="display:flex;align-items:center;gap:6px;padding:8px 14px;margin:4px -14px 0;background:rgba(16,185,129,0.08);">' +
              '<span style="width:16px;height:16px;border-radius:8px;background:#10B981;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:10px;">\u2713</span>' +
              '<span style="color:#047857;font-weight:700;font-size:11px;">CoP Confirmed</span>' +
            '</div>' +
          '</div>' +
          /* Payer accordion */
          '<div style="border-top:1px solid #F1F5F9;padding-top:10px;margin-top:10px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
              '<div style="font-size:12px;font-weight:700;color:#0D9488;">Payer information</div>' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="#0D9488" stroke-width="2.2" stroke-linecap="round"/></svg>' +
            '</div>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;">' +
              '<span style="font-size:11px;color:#64748B;">Bank</span>' +
              '<span style="display:inline-flex;align-items:center;gap:6px;">' + sipAdcbLogo(false) + '</span>' +
            '</div>' +
          '</div>'
        ) +
      '</div>' +
      sipBtn('\uD83D\uDD12 Pay using Al Tareq', 'sipProtoNext()') +
      '<div style="text-align:center;padding:2px 14px 6px;font-size:10px;color:#94A3B8;">We\'ll securely transfer you to <b style="color:#0F172A;">ADCB</b> to authorise the payment</div>';

  /* ── SCREEN 4: Redirection to ADCB ── */
  } else if (n === 4) {
    html = '<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#0D9488 0%,#1C2B4A 55%,#0B1220 100%);padding:70px 20px 30px;text-align:center;min-height:500px;">' +
        '<div style="font-size:12px;color:rgba(255,255,255,.85);margin-bottom:20px;">You\'ll be redirected to</div>' +
        '<div style="width:78px;height:78px;background:#fff;border-radius:18px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;box-shadow:0 12px 24px rgba(0,0,0,0.25);">' +
          '<svg width="40" height="40" viewBox="0 0 28 28">' +
            '<path d="M14 2L3 6v8c0 6 4.5 10.5 11 12 6.5-1.5 11-6 11-12V6L14 2z" fill="#E31E24"/>' +
            '<path d="M8 13l6-5 6 5-6 5-6-5z" fill="#fff"/>' +
          '</svg>' +
        '</div>' +
        '<div style="color:#fff;font-size:16px;font-weight:800;letter-spacing:0.5px;margin-bottom:4px;">ADCB</div>' +
        '<div style="color:rgba(255,255,255,.7);font-size:11px;">don\'t close this window</div>' +
        '<div style="width:40px;height:40px;border:3px solid rgba(255,255,255,.2);border-top-color:#0D9488;border-radius:50%;animation:sme-spin 0.9s linear infinite;margin:26px 0;"></div>' +
        '<div style="margin-top:auto;color:rgba(255,255,255,.55);font-size:9px;letter-spacing:1px;margin-bottom:6px;">POWERED BY</div>' +
        '<div style="display:inline-flex;align-items:center;gap:6px;">' +
          '<svg width="16" height="16" viewBox="0 0 32 32"><defs><linearGradient id="sip-r1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0D9488"/><stop offset="1" stop-color="#1C2B4A"/></linearGradient></defs><circle cx="16" cy="16" r="15" fill="url(#sip-r1)"/><path d="M10 16a6 6 0 1011 3.3" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M13 15.5l2.3 2.3L21 12" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '<div style="color:#fff;font-weight:800;font-size:12px;">Al <span style="color:#0D9488;">Tareq</span></div>' +
        '</div>' +
      '</div>';
    setTimeout(function() { if (sipCurrentScreen === 4) { sipCurrentScreen = 5; sipRenderScreen(); sipUpdateProtoUI(); } }, 2000);

  /* ── SCREEN 5: ADCB Authentication splash ── */
  } else if (n === 5) {
    html = '<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#F8FAFC;padding:70px 20px 30px;text-align:center;min-height:500px;gap:18px;">' +
        '<div style="width:72px;height:72px;border-radius:36px;background:linear-gradient(135deg,#E31E24,#A01820);display:flex;align-items:center;justify-content:center;box-shadow:0 12px 28px rgba(227,30,36,0.3);">' +
          '<svg width="32" height="32" viewBox="0 0 24 24" fill="none"><rect x="4" y="10" width="16" height="11" rx="2.5" stroke="#fff" stroke-width="1.8"/><path d="M8 10V7a4 4 0 018 0v3" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>' +
        '</div>' +
        '<div style="font-size:17px;font-weight:800;color:#0F172A;">ADCB Authentication</div>' +
        '<div style="font-size:11px;color:#64748B;">Securing your session\u2026</div>' +
        '<div style="width:36px;height:36px;border:3px solid #E2E8F0;border-top-color:#E31E24;border-radius:50%;animation:sme-spin 0.9s linear infinite;"></div>' +
      '</div>';
    setTimeout(function() { if (sipCurrentScreen === 5) { sipCurrentScreen = 6; sipRenderScreen(); sipUpdateProtoUI(); } }, 1500);

  /* ── SCREEN 6: ADCB — CoP Verifying Payee ── */
  } else if (n === 6) {
    html = sipOwnerBar('ADCB') + sipLogo() + sipStepper(0) +
      '<div style="padding:30px 14px;text-align:center;background:#F8FAFC;">' +
        '<div style="width:56px;height:56px;border:3px solid #E2E8F0;border-top-color:#0D9488;border-radius:50%;animation:sme-spin 0.9s linear infinite;margin:0 auto 18px;"></div>' +
        '<div style="font-size:14px;font-weight:700;color:#0F172A;margin-bottom:4px;">Checking payee details\u2026</div>' +
        '<div style="font-size:11px;color:#64748B;">Verifying name against bank records</div>' +
      '</div>' +
      '<div style="margin:0 14px 14px;">' +
        sipCard(
          sipRow('Payee', 'Ahmed Al Maktoum') +
          sipRow('IBAN', 'AE21 0610 **** 1234', 'border-bottom:none;')
        ) +
      '</div>';
    setTimeout(function() { if (sipCurrentScreen === 6) { sipCurrentScreen = 7; sipRenderScreen(); sipUpdateProtoUI(); } }, 1500);

  /* ── SCREEN 7: ADCB — CoP Result (delegates to per-scenario renderer) ── */
  } else if (n === 7) {
    html = sipRenderCopResultScreen();

  /* ── SCREEN 8: ADCB — Confirm Payment Details + account select ── */
  } else if (n === 8) {
    html = sipOwnerBar('ADCB') + sipLogo() + sipStepper(1) +
      '<div style="padding:12px 14px;background:#F8FAFC;">' +
        sipCard(
          '<div style="font-size:14px;font-weight:700;color:#0F172A;margin-bottom:4px;">Confirm Payment Details</div>' +
          '<div style="font-size:11px;color:#64748B;margin-bottom:12px;"><b>Amazon</b> needs your permission to make the payment below.</div>' +
          '<div style="background:#F8FAFC;border-radius:10px;padding:10px;">' +
            sipRow('Amount', 'AED 1,000', 'color:#E31E24;font-weight:700;') +
            '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px dashed #F1F5F9;font-size:11px;">' +
              '<span style="color:#64748B;">Payee Name</span>' +
              '<span style="display:inline-flex;align-items:center;gap:5px;color:#0F172A;font-weight:600;">Ahmed Al Maktoum <span style="width:14px;height:14px;border-radius:7px;background:#10B981;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:9px;">\u2713</span></span>' +
            '</div>' +
            sipRow('IBAN', 'AE07 0331 2345 6789 01234') +
            sipRow('Payee Bank', 'Supplier Bank') +
            sipRow('Reference', 'INV-2026-0042') +
            sipRow('Purpose', 'Invoice Payment', 'border-bottom:none;') +
          '</div>',
          'margin-bottom:12px;'
        ) +
        sipCard(
          '<div style="font-size:12px;font-weight:700;color:#0F172A;margin-bottom:10px;">Select the account to pay from</div>' +
          '<div style="padding:12px;border-radius:12px;border:1.5px solid #E31E24;background:rgba(227,30,36,0.04);margin-bottom:8px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
              '<div style="font-size:12px;font-weight:700;color:#0F172A;">Current Account</div>' +
              '<div style="font-size:12px;font-weight:700;color:#0F172A;">AED 44,576</div>' +
            '</div>' +
            '<div style="font-size:10px;color:#64748B;">AE07 1234 5246 4523 4567 895</div>' +
            '<div style="font-size:10px;color:#64748B;">Overdraft: AED 1,500</div>' +
          '</div>' +
          '<div style="padding:12px;border-radius:12px;border:1.5px solid #E2E8F0;background:#fff;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
              '<div style="font-size:12px;font-weight:700;color:#0F172A;">Savings</div>' +
              '<div style="font-size:12px;font-weight:700;color:#0F172A;">AED 12,034</div>' +
            '</div>' +
            '<div style="font-size:10px;color:#64748B;">AE07 1255 3546 4523 4567 895</div>' +
          '</div>'
        ) +
      '</div>' +
      sipBtn('\uD83D\uDD12 Pay using Al Tareq', 'sipProtoNext()') +
      sipBtnSec('Cancel', 'sipProtoPrev()');

  /* ── SCREEN 9: ADCB — SCA (Touch ID) ── */
  } else if (n === 9) {
    html = sipOwnerBar('ADCB') + sipLogo() + sipStepper(1) +
      '<div style="padding:10px 14px 16px;background:#F8FAFC;">' +
        /* Method tabs */
        '<div style="display:flex;gap:6px;margin-bottom:14px;">' +
          '<div style="flex:1;height:34px;border-radius:17px;border:1.5px solid #E31E24;background:rgba(227,30,36,0.06);color:#E31E24;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:4px;">\u261D Touch ID</div>' +
          '<div style="flex:1;height:34px;border-radius:17px;border:1.5px solid #E2E8F0;background:#fff;color:#0F172A;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;">Face ID</div>' +
          '<div style="flex:1;height:34px;border-radius:17px;border:1.5px solid #E2E8F0;background:#fff;color:#0F172A;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;">PIN</div>' +
        '</div>' +
        '<div style="text-align:center;">' +
          '<div style="font-size:13px;font-weight:700;color:#0F172A;margin-bottom:4px;">Touch ID Authentication</div>' +
          '<div style="font-size:10px;color:#64748B;margin-bottom:20px;">Hold your finger on the sensor to confirm</div>' +
          '<div style="width:140px;height:140px;border-radius:70px;background:#fff;border:2px solid #0D9488;margin:0 auto;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 10px rgba(13,148,136,0.08);">' +
            '<svg width="72" height="72" viewBox="0 0 48 48" fill="none" stroke-linecap="round">' +
              '<path d="M16 36c-1-3-1.5-6-1.5-9 0-5 4.5-9 9.5-9s9.5 4 9.5 9" stroke="#0D9488" stroke-width="2"/>' +
              '<path d="M20 40c-1-3-1.5-6-1.5-9 0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5c0 2 0 4-.5 6" stroke="#0D9488" stroke-width="2"/>' +
              '<path d="M24 42c-.5-3-.5-6-.5-9 0-1 .5-1.5 1-1.5s.5 1 .5 2c0 2-.5 5-1 7" stroke="#0D9488" stroke-width="2"/>' +
              '<path d="M12 24a12 12 0 0122-6" stroke="#0D9488" stroke-width="2"/>' +
              '<path d="M36 28c0 4-.5 8-2 12" stroke="#0D9488" stroke-width="2"/>' +
            '</svg>' +
          '</div>' +
          '<div style="margin-top:16px;font-size:12px;font-weight:600;color:#0D9488;">Touch the sensor to authenticate</div>' +
          '<div style="margin-top:6px;font-size:9px;color:#94A3B8;font-style:italic;">(demo \u2014 tap Next to simulate success)</div>' +
        '</div>' +
      '</div>';

  /* ── SCREEN 10: Redirection back to Amazon ── */
  } else if (n === 10) {
    html = '<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#0D9488 0%,#1C2B4A 55%,#0B1220 100%);padding:70px 20px 30px;text-align:center;min-height:500px;">' +
        '<div style="font-size:12px;color:rgba(255,255,255,.85);margin-bottom:20px;">You\'ll be redirected back to</div>' +
        '<div style="width:78px;height:78px;background:#fff;border-radius:18px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;box-shadow:0 12px 24px rgba(0,0,0,0.25);padding:0 8px;">' +
          '<div style="font-family:Proxima Nova,system-ui;font-weight:800;font-size:22px;color:#131921;letter-spacing:-0.5px;line-height:1;position:relative;">amazon' +
            '<svg width="44" height="8" viewBox="0 0 44 8" style="position:absolute;bottom:-4px;left:2px;"><path d="M2 4 Q22 8 42 4" stroke="#FF9900" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M38 2 L42 4 L38 6" stroke="#FF9900" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</div>' +
        '</div>' +
        '<div style="color:#fff;font-size:16px;font-weight:800;letter-spacing:0.2px;margin-bottom:4px;">Amazon</div>' +
        '<div style="color:rgba(255,255,255,.7);font-size:11px;">don\'t close this window</div>' +
        '<div style="width:40px;height:40px;border:3px solid rgba(255,255,255,.2);border-top-color:#0D9488;border-radius:50%;animation:sme-spin 0.9s linear infinite;margin:26px 0;"></div>' +
        '<div style="margin-top:auto;color:rgba(255,255,255,.55);font-size:9px;letter-spacing:1px;margin-bottom:6px;">POWERED BY</div>' +
        '<div style="display:inline-flex;align-items:center;gap:6px;">' +
          '<svg width="16" height="16" viewBox="0 0 32 32"><defs><linearGradient id="sip-r2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0D9488"/><stop offset="1" stop-color="#1C2B4A"/></linearGradient></defs><circle cx="16" cy="16" r="15" fill="url(#sip-r2)"/><path d="M10 16a6 6 0 1011 3.3" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M13 15.5l2.3 2.3L21 12" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '<div style="color:#fff;font-weight:800;font-size:12px;">Al <span style="color:#0D9488;">Tareq</span></div>' +
        '</div>' +
      '</div>';

  /* ── SCREEN 11: Amazon — Thank you ── */
  } else if (n === 11) {
    html = sipOwnerBar('AMAZON') + sipLogo() + sipStepper(2) +
      '<div style="padding:14px;background:#F8FAFC;">' +
        sipCard(
          '<div style="text-align:center;">' +
            '<div style="font-size:17px;font-weight:800;color:#0F172A;margin-bottom:12px;">Thank you</div>' +
            '<div style="width:60px;height:60px;border-radius:30px;margin:0 auto 14px;background:linear-gradient(135deg,#10B981,#059669);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(16,185,129,0.35);">' +
              '<svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</div>' +
            '<div style="font-size:12px;color:#64748B;margin-bottom:14px;">Your payment has been <b style="color:#0F172A;">submitted</b></div>' +
          '</div>' +
          '<div style="background:#F8FAFC;border-radius:10px;padding:10px;">' +
            sipRow('Amount', 'AED 1,000') +
            sipRow('Payee', 'Ahmed Al Maktoum') +
            sipRow('IBAN', 'AE07 0331 2345 6789 01234') +
            sipRow('Reference', 'INV-2026-0042') +
            sipRow('Date', '17 Apr 2026, 10:15', 'border-bottom:none;') +
          '</div>',
          'padding:20px 16px;'
        ) +
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

  var h = sipOwnerBar('ADCB') + sipLogo() + sipStepper(0) +
    '<div style="padding:12px 14px;background:#F8FAFC;">' +
      sipCard(
        '<div style="font-size:14px;font-weight:700;color:#0F172A;margin-bottom:10px;">Payee Verification</div>' +
        '<div style="background:#F8FAFC;border-radius:10px;padding:10px;margin-bottom:12px;">' +
          sipRow('Payee', 'Ahmed Al Maktoum') +
          sipRow('IBAN', 'AE21 0610 **** 1234', 'border-bottom:none;') +
        '</div>' +
        '<div style="display:flex;gap:10px;padding:12px;border-radius:10px;background:' + bannerBg + ';margin-bottom:4px;">' +
          '<span style="font-size:20px;flex-shrink:0;line-height:1;">' + cfg.icon + '</span>' +
          '<div><div style="font-weight:700;font-size:12px;color:#0F172A;margin-bottom:4px;">' + cfg.title + '</div>' +
            '<div style="font-size:11px;color:#475569;line-height:1.5;">' + cfg.desc + '</div>' +
          '</div>' +
        '</div>',
        'margin-bottom:12px;'
      );

  if (cfg.checkbox) {
    h += '<div style="padding:0 14px 10px;"><label class="sip-confirm-checkbox' + (cfg.danger ? ' danger-bg' : '') + '">' +
      '<input type="checkbox" onchange="sipUpdateCopProceed()"> <span>' + cfg.checkLabel + '</span></label></div>';
  }

  h += '<div style="padding:0 14px 14px;">' +
    '<button id="sip-cop-proceed" style="background:linear-gradient(90deg,#0D9488,#1C2B4A);color:white;border:none;border-radius:24px;padding:13px;width:100%;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 6px 14px rgba(13,148,136,0.25);' + (cfg.canProceed ? '' : 'opacity:0.5;pointer-events:none;') + '" onclick="sipHandleCopProceed()">' + cfg.btnText + '</button>' +
    '<button style="background:white;color:#0F172A;border:1.5px solid #E2E8F0;border-radius:24px;padding:11px;width:100%;font-size:13px;font-weight:600;cursor:pointer;margin-top:8px;" onclick="sipProtoPrev()">Go Back \u2014 Edit Details</button>' +
  '</div></div>';

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
  // Always reset to screen 1 so the journey starts fresh for the new scenario
  sipCurrentScreen = 1;
  sipRenderScreen();
  sipUpdateProtoUI();
}

function sipGoToScreen(n) {
  sipCurrentScreen = n;
  sipRenderScreen();
  sipUpdateProtoUI();
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
  /* Step pills */
  var pillsEl = document.getElementById('sip-step-pills');
  if (pillsEl) {
    var owners = {1:'TPP',2:'TPP',3:'TPP',4:'Redirect',5:'LFI',6:'LFI',7:'LFI',8:'LFI',9:'LFI',10:'Redirect',11:'TPP'};
    var ownerColors = {'TPP':'#00B4C8','LFI':'#0D9488','Redirect':'#64748B'};
    var ph = '';
    for (var pi = 1; pi <= sipTotalScreens; pi++) {
      var active = pi === sipCurrentScreen;
      var done = pi < sipCurrentScreen;
      var ow = owners[pi] || 'TPP';
      var bg = active ? (ownerColors[ow]||'#00B4C8') : done ? '#E2E8F0' : 'transparent';
      var col = active ? '#fff' : done ? '#15803D' : '#94A3B8';
      var bdr = active ? 'none' : '1px solid #E2E8F0';
      ph += '<div onclick="sipGoToScreen(' + pi + ')" style="padding:4px 10px;border-radius:99px;font-size:10px;font-weight:600;background:' + bg + ';color:' + col + ';border:' + bdr + ';cursor:pointer;white-space:nowrap;">' + (done ? '\u2713 ' : '') + pi + '. ' + (SIP_SCREEN_NAMES[pi]||'').replace(/^(TPP|LFI|CoP|YOUR LFI): ?/,'') + '</div>';
    }
    pillsEl.innerHTML = ph;
  }

  /* Description */
  var descEl = document.getElementById('sip-screen-desc');
  if (descEl) {
    var desc = SIP_SCREEN_DESCS[sipCurrentScreen] || '';
    var owner = {1:'TPP',2:'TPP',3:'TPP',4:'OF Hub',5:'LFI',6:'LFI',7:'LFI',8:'LFI',9:'LFI',10:'OF Hub',11:'TPP'}[sipCurrentScreen] || '';
    descEl.innerHTML = '<strong style="color:var(--navy);">Screen ' + sipCurrentScreen + '/' + sipTotalScreens + ' \u2014 ' + owner + ':</strong> ' + desc;
  }

  /* API panel \u2014 renders ordered call sequence for this screen */
  sipRenderApiPanel(sipCurrentScreen);

  /* Old UI compat */
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
