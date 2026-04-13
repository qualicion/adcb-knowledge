/* ============================================================
   ADCB Open Finance — SIP CoP Flow Engine
   Rendering engine for the SIP Confirmation of Payee section.
   Depends on globals defined in sip-cop-data.js:
     SIP_FLOW_STEPS, SIP_COP_STORIES, SIP_RST_SECTIONS, SIP_GAPS
   ============================================================ */

/* ── STATE ── */
var sipCurrentScreen = 1;
var sipCurrentScenario = 'exact';
var sipProtoBuilt = false;
var sipNoMatchModalOpen = false;

/* ── SCREEN DEFINITIONS ── */
var SIP_SCREEN_NAMES = [
  '',
  'Payment Checkout',
  'Bank Selection',
  'Verifying Payee (CoP)',
  'CoP Result',
  'Payment Review',
  'Bank Authorisation',
  'Payment Receipt'
];

var SIP_SCENARIO_CONFIG = {
  exact: {
    bannerClass: 'sip-cop-banner-exact',
    bannerIcon: '\u2714',
    bannerTitle: 'Payee Confirmed',
    bannerText: 'Name exactly matches the account holder.',
    checkRequired: false,
    proceedDisabled: false,
    badge: { icon: '\u2714', cls: 'sip-cop-badge-exact', label: 'Payee Verified' }
  },
  partial: {
    bannerClass: 'sip-cop-banner-partial',
    bannerIcon: '\u26A0',
    bannerTitle: 'Partial Match',
    bannerText: 'Name is similar but does not exactly match. Please verify before proceeding.',
    checkRequired: true,
    proceedDisabled: true,
    badge: { icon: '\u26A0', cls: 'sip-cop-badge-partial', label: 'Partial Match' }
  },
  none: {
    bannerClass: 'sip-cop-banner-none',
    bannerIcon: '\u2716',
    bannerTitle: 'No Match Found',
    bannerText: 'The name you entered does not match the account. Proceed only if you are certain.',
    checkRequired: true,
    proceedDisabled: true,
    badge: { icon: '\u2716', cls: 'sip-cop-badge-none', label: 'No Match' }
  },
  unavailable: {
    bannerClass: 'sip-cop-banner-unavailable',
    bannerIcon: '\u2139',
    bannerTitle: 'CoP Unavailable',
    bannerText: 'Payee verification is temporarily unavailable. You may still proceed.',
    checkRequired: false,
    proceedDisabled: false,
    badge: { icon: '\u2013', cls: 'sip-cop-badge-unavailable', label: 'Unverified' }
  }
};

/* ── PHASE MARKERS ── */
var SIP_PHASE_MARKERS = {
  1: { label: 'P-0', desc: 'Pre-Payment', cls: 'sip-phase-p0' },
  3: { label: 'CoP', desc: 'Confirmation of Payee', cls: 'sip-phase-cop' },
  5: { label: 'P-1', desc: 'Post-CoP Consent', cls: 'sip-phase-p1' },
  7: { label: 'P-2', desc: 'Bank Authorisation', cls: 'sip-phase-p2' },
  9: { label: 'P-3', desc: 'Payment Execution', cls: 'sip-phase-p3' }
};

/* ─────────────────────────────────────────────
   1. TAB NAVIGATION
   ───────────────────────────────────────────── */

/**
 * Shows the correct sip-page and updates tab active state.
 * @param {string} tabId - One of: 'flow', 'cop-detail', 'stories', 'prototype', 'rst', 'gaps'
 */
function sipGoTab(tabId) {
  var pages = document.querySelectorAll('.sip-page');
  if (pages) {
    pages.forEach(function(p) { p.classList.remove('active'); p.classList.remove('sip-page-active'); });
  }

  var tabs = document.querySelectorAll('.sip-stab');
  if (tabs) {
    tabs.forEach(function(t) { t.classList.remove('active'); });
  }

  var targetPage = document.getElementById('sip-page-' + tabId);
  if (targetPage) { targetPage.classList.add('active'); }

  var targetTab = document.querySelector('.sip-stab[data-tab="' + tabId + '"]');
  if (targetTab) { targetTab.classList.add('active'); }
}

/* ─────────────────────────────────────────────
   2. FLOW DIAGRAM RENDERER
   ───────────────────────────────────────────── */

/**
 * Renders the SIP flow diagram into #sip-flow-content.
 * Reads from global SIP_FLOW_STEPS.
 */
function sipRenderFlow() {
  var el = document.getElementById('sip-flow-content');
  if (!el) return;
  if (typeof SIP_FLOW_STEPS === 'undefined' || !SIP_FLOW_STEPS.length) {
    el.innerHTML = '<p class="sip-empty">No flow steps defined.</p>';
    return;
  }

  var html = '<div class="sip-flow-diagram">';
  var copOpen = false;

  for (var i = 0; i < SIP_FLOW_STEPS.length; i++) {
    var step = SIP_FLOW_STEPS[i];
    var stepNum = i + 1;

    /* Phase marker */
    if (SIP_PHASE_MARKERS[stepNum]) {
      var marker = SIP_PHASE_MARKERS[stepNum];
      /* Close any open CoP highlight wrapper */
      if (copOpen) {
        html += '</div>';
        copOpen = false;
      }
      /* Open CoP highlight wrapper at step 3 */
      if (stepNum === 3) {
        html += '<div class="sip-cop-highlight">';
        copOpen = true;
      }
      html += '<div class="sip-phase-marker ' + marker.cls + '">' +
        '<span class="sip-phase-badge">' + marker.label + '</span>' +
        '<span class="sip-phase-desc">' + marker.desc + '</span>' +
        '</div>';
    }

    /* Open CoP highlight at step 3 if not yet opened by marker block
       (handles case where marker and highlight open together) */

    var color = step.color || '#185FA5';
    var bgColor = color + '15';
    var stepId = 'sip-step-' + stepNum;

    html += '<div class="sip-flow-step" id="' + stepId + '" ' +
      'style="border-left:3px solid ' + color + ';background:' + bgColor + ';" ' +
      'onclick="sipToggleDetail(\'' + stepId + '\')">' +
      '<div class="sip-step-header">' +
        '<div class="sip-step-circle" style="background:' + color + ';">' + stepNum + '</div>' +
        '<div class="sip-step-info">' +
          '<div class="sip-step-label">' + (step.label || '') + '</div>' +
          (step.api ? '<div class="sip-step-api">' + step.api + '</div>' : '') +
        '</div>' +
        '<div class="sip-step-chevron">&#x25BC;</div>' +
      '</div>' +
      '<div class="sip-detail-panel" id="' + stepId + '-detail">' +
        '<div class="sip-detail-text">' + (step.detail || '') + '</div>' +
        (step.pills && step.pills.length ? '<div class="sip-step-pills">' +
          step.pills.map(function(p) {
            return '<span class="sip-pill" style="border-color:' + color + ';color:' + color + '">' + p + '</span>';
          }).join('') +
        '</div>' : '') +
      '</div>' +
    '</div>';

    /* Connector line between steps (not after last) */
    if (i < SIP_FLOW_STEPS.length - 1) {
      html += '<div class="sip-flow-connector" style="border-color:' + color + '"></div>';
    }
  }

  /* Close any still-open CoP wrapper */
  if (copOpen) {
    html += '</div>';
  }

  html += '</div>';
  el.innerHTML = html;
}

/**
 * Toggles the detail panel for a flow step.
 * Closes all other open panels first.
 * @param {string} id - The step element ID (e.g. 'sip-step-3')
 */
function sipToggleDetail(id) {
  var allPanels = document.querySelectorAll('.sip-detail-panel');
  if (allPanels) {
    allPanels.forEach(function(p) {
      if (p.id !== id + '-detail') {
        p.classList.remove('sip-panel-open');
        var parentStep = p.closest ? p.closest('.sip-flow-step') : p.parentNode;
        if (parentStep) { parentStep.classList.remove('sip-step-expanded'); }
      }
    });
  }

  var panel = document.getElementById(id + '-detail');
  var stepEl = document.getElementById(id);
  if (!panel) return;

  var isOpen = panel.classList.contains('sip-panel-open');
  if (isOpen) {
    panel.classList.remove('sip-panel-open');
    if (stepEl) { stepEl.classList.remove('sip-step-expanded'); }
  } else {
    panel.classList.add('sip-panel-open');
    if (stepEl) { stepEl.classList.add('sip-step-expanded'); }
  }
}

/* ─────────────────────────────────────────────
   3. COP DEEP DIVE RENDERER
   ───────────────────────────────────────────── */

/**
 * Renders the CoP Deep Dive section into #sip-cop-detail-content.
 */
function sipRenderCopDeepDive() {
  var el = document.getElementById('sip-cop-detail-content');
  if (!el) return;

  var html = '';

  /* Two-card intro grid */
  html += '<div class="sip-cop-intro-grid">' +

    '<div class="sip-cop-card">' +
      '<div class="sip-cop-card-hdr">' +
        '<span class="sip-cop-card-icon">&#x1F50D;</span>' +
        '<h3>What is CoP?</h3>' +
      '</div>' +
      '<p>Confirmation of Payee (CoP) is a name-matching check performed <strong>before</strong> a payment is initiated. ' +
      'When a customer enters a recipient\'s name and account/IBAN, the TPP calls the CoP API. ' +
      'The API Hub queries the recipient\'s LFI and returns whether the name is an <strong>exact match</strong>, ' +
      '<strong>partial match</strong>, <strong>no match</strong>, or the service is <strong>unavailable</strong>.</p>' +
      '<p>CoP is a mandatory CBUAE requirement for all Single Instant Payments under the UAE Open Finance framework. ' +
      'It is the primary defence against Authorised Push Payment (APP) fraud.</p>' +
    '</div>' +

    '<div class="sip-cop-card">' +
      '<div class="sip-cop-card-hdr">' +
        '<span class="sip-cop-card-icon">&#x26A0;&#xFE0F;</span>' +
        '<h3>Why is it Mandatory?</h3>' +
      '</div>' +
      '<ul class="sip-cop-list">' +
        '<li><strong>APP Fraud Prevention:</strong> Stops payments to accounts where the name does not match — the most common fraud vector for instant payments.</li>' +
        '<li><strong>CBUAE Regulation:</strong> Required under the UAE Open Finance SIP specification. A TPP that skips CoP is non-compliant and liable for the resulting fraud loss.</li>' +
        '<li><strong>Customer Protection:</strong> Gives the payer actionable information before authorising — they can abort or query the recipient before money moves.</li>' +
        '<li><strong>Liability Shift:</strong> If CoP is performed and the customer proceeds after a No Match warning, liability shifts to the customer. If CoP is skipped, liability remains with the TPP.</li>' +
      '</ul>' +
    '</div>' +

  '</div>';

  /* Request / Response code blocks */
  html += '<div class="sip-cop-api-section">' +
    '<h3 class="sip-cop-api-title">API: POST /customers/action/cop-query</h3>' +
    '<div class="sip-cop-api-grid">' +

      '<div class="sip-code-block">' +
        '<div class="sip-code-label">Request</div>' +
        '<pre class="sip-pre">' +
'POST /customers/action/cop-query\n' +
'Authorization: Bearer {access_token}\n' +
'Content-Type: application/json\n\n' +
'{\n' +
'  "Data": {\n' +
'    "Initiation": {\n' +
'      "CreditorAccount": {\n' +
'        "SchemeName": "IBAN",\n' +
'        "Identification": "AE070331234567890123456",\n' +
'        "Name": "Mohammed Al Rashidi"\n' +
'      }\n' +
'    }\n' +
'  }\n' +
'}' +
        '</pre>' +
      '</div>' +

      '<div class="sip-code-block">' +
        '<div class="sip-code-label">Response (Exact Match)</div>' +
        '<pre class="sip-pre">' +
'HTTP/1.1 200 OK\n\n' +
'{\n' +
'  "Data": {\n' +
'    "CoP": {\n' +
'      "Result": "MATC",\n' +
'      "Name": "Mohammed Al Rashidi",\n' +
'      "ReasonCode": null\n' +
'    }\n' +
'  },\n' +
'  "Links": {\n' +
'    "Self": "/customers/action/cop-query"\n' +
'  },\n' +
'  "Meta": {}\n' +
'}' +
        '</pre>' +
      '</div>' +

    '</div>' +

    '<div class="sip-cop-result-codes">' +
      '<h4>Result Codes</h4>' +
      '<div class="sip-result-code-grid">' +
        '<div class="sip-result-code sip-rc-exact"><span class="sip-rc-badge">MATC</span><span>Exact Match — proceed normally</span></div>' +
        '<div class="sip-result-code sip-rc-partial"><span class="sip-rc-badge">CLOS</span><span>Partial / Close Match — warn user, require confirmation</span></div>' +
        '<div class="sip-result-code sip-rc-none"><span class="sip-rc-badge">NMAT</span><span>No Match — strong warning, require explicit confirmation</span></div>' +
        '<div class="sip-result-code sip-rc-unavail"><span class="sip-rc-badge">IAVL</span><span>CoP Unavailable — allow proceed, log for audit</span></div>' +
      '</div>' +
    '</div>' +

  '</div>';

  /* 7-step flow strip */
  var flowSteps = [
    { n: 1, label: 'Customer enters payee name + IBAN', color: '#185FA5' },
    { n: 2, label: 'TPP calls POST /cop-query', color: '#185FA5' },
    { n: 3, label: 'API Hub routes to payee\'s LFI', color: '#3B6D11' },
    { n: 4, label: 'LFI performs name match against account', color: '#3B6D11' },
    { n: 5, label: 'LFI returns MATC / CLOS / NMAT / IAVL', color: '#3B6D11' },
    { n: 6, label: 'TPP presents result to customer', color: '#854F0B' },
    { n: 7, label: 'Customer decides: abort or proceed', color: '#854F0B' }
  ];

  html += '<div class="sip-cop-flow-strip-section">' +
    '<h3 class="sip-cop-api-title">CoP Sequence — 7 Steps</h3>' +
    '<div class="sip-cop-flow-strip">';

  for (var i = 0; i < flowSteps.length; i++) {
    var s = flowSteps[i];
    html += '<div class="sip-strip-step" style="background:' + s.color + '15;border:1px solid ' + s.color + ';">' +
      '<div class="sip-strip-num" style="background:' + s.color + ';">' + s.n + '</div>' +
      '<div class="sip-strip-label">' + s.label + '</div>' +
    '</div>';
    if (i < flowSteps.length - 1) {
      html += '<div class="sip-strip-arrow">&#x2192;</div>';
    }
  }

  html += '</div></div>';

  el.innerHTML = html;
}

/* ─────────────────────────────────────────────
   4. STORIES RENDERER
   ───────────────────────────────────────────── */

/**
 * Renders user stories into #sip-stories-content.
 * Reads from global SIP_COP_STORIES.
 */
function sipRenderStories() {
  var el = document.getElementById('sip-stories-content');
  if (!el) return;
  if (typeof SIP_COP_STORIES === 'undefined' || !SIP_COP_STORIES.length) {
    el.innerHTML = '<p class="sip-empty">No stories defined.</p>';
    return;
  }

  var typeColors = {
    happy: '#0F6E56',
    warning: '#854F0B',
    error: '#8B1D1D',
    edge: '#185FA5',
    security: '#4B1FA5'
  };

  var priorityColors = {
    critical: '#8B1D1D',
    high: '#854F0B',
    medium: '#185FA5',
    low: '#3B6D11'
  };

  var html = '<div class="sip-stories-list">';

  for (var i = 0; i < SIP_COP_STORIES.length; i++) {
    var story = SIP_COP_STORIES[i];
    var storyId = 'sip-story-' + i;
    var typeColor = typeColors[story.type] || '#185FA5';
    var prioColor = priorityColors[story.priority] || '#854F0B';

    var acItems = '';
    if (story.ac && story.ac.length) {
      for (var j = 0; j < story.ac.length; j++) {
        var ac = story.ac[j];
        var acId = storyId + '-ac-' + j;
        acItems += '<div class="sip-ac-item">' +
          '<div class="sip-ac-check" id="' + acId + '" onclick="sipToggleAc(\'' + acId + '\')">' +
            '<span class="sip-ac-box">&#x25A1;</span>' +
          '</div>' +
          '<div class="sip-ac-text"><strong>' + (ac.id || '') + '</strong> ' + (ac.text || '') + '</div>' +
        '</div>';
      }
    }

    html += '<div class="sip-story-card" id="' + storyId + '">' +
      '<div class="sip-story-header" onclick="sipToggleStory(\'' + storyId + '\')">' +
        '<div class="sip-story-header-left">' +
          '<span class="sip-story-id-badge" style="background:' + typeColor + '15;color:' + typeColor + ';border:1px solid ' + typeColor + '">' +
            (story.id || '') +
          '</span>' +
          '<div class="sip-story-title">' + (story.title || '') + '</div>' +
        '</div>' +
        '<div class="sip-story-header-right">' +
          '<span class="sip-priority-badge" style="background:' + prioColor + '15;color:' + prioColor + '">' +
            (story.priority ? story.priority.charAt(0).toUpperCase() + story.priority.slice(1) : '') +
          '</span>' +
          '<span class="sip-story-chevron">&#x25BC;</span>' +
        '</div>' +
      '</div>' +
      '<div class="sip-story-body" id="' + storyId + '-body">' +
        '<div class="sip-story-text">' +
          '<div class="sip-story-row"><span class="sip-story-k">As a</span><span class="sip-story-v">' + (story.as || '') + '</span></div>' +
          '<div class="sip-story-row"><span class="sip-story-k">I want</span><span class="sip-story-v">' + (story.want || '') + '</span></div>' +
          '<div class="sip-story-row"><span class="sip-story-k">So that</span><span class="sip-story-v">' + (story.so || '') + '</span></div>' +
        '</div>' +
        (acItems ? '<div class="sip-ac-list"><div class="sip-ac-list-title">Acceptance Criteria</div>' + acItems + '</div>' : '') +
      '</div>' +
    '</div>';
  }

  html += '</div>';
  el.innerHTML = html;
}

/**
 * Toggles expand/collapse on a story card.
 * @param {string} id - Story element ID
 */
function sipToggleStory(id) {
  var body = document.getElementById(id + '-body');
  var card = document.getElementById(id);
  if (!body || !card) return;
  var isOpen = body.classList.contains('sip-story-open');
  body.classList.toggle('sip-story-open', !isOpen);
  card.classList.toggle('sip-story-expanded', !isOpen);
}

/**
 * Toggles the checked state of an AC checkbox.
 * @param {string} id - AC check element ID
 */
function sipToggleAc(id) {
  var el = document.getElementById(id);
  if (!el) return;
  var isChecked = el.classList.contains('checked');
  el.classList.toggle('checked', !isChecked);
  var box = el.querySelector('.sip-ac-box');
  if (box) { box.innerHTML = isChecked ? '&#x25A1;' : '&#x2713;'; }
}

/* ─────────────────────────────────────────────
   5. RST SCENARIOS RENDERER
   ───────────────────────────────────────────── */

/**
 * Renders RST test scenarios into #sip-rst-content.
 * Reads from global SIP_RST_SECTIONS.
 */
function sipRenderRST() {
  var el = document.getElementById('sip-rst-content');
  if (!el) return;
  if (typeof SIP_RST_SECTIONS === 'undefined' || !SIP_RST_SECTIONS.length) {
    el.innerHTML = '<p class="sip-empty">No RST scenarios defined.</p>';
    return;
  }

  var html = '';

  /* Stats row */
  html += '<div class="sip-stats-row">' +
    '<div class="sip-stat-box"><div class="sip-stat-num">45</div><div class="sip-stat-label">Total Scenarios</div></div>' +
    '<div class="sip-stat-box sip-stat-critical"><div class="sip-stat-num">2</div><div class="sip-stat-label">Critical Risk</div></div>' +
    '<div class="sip-stat-box sip-stat-high"><div class="sip-stat-num">15</div><div class="sip-stat-label">High Risk</div></div>' +
    '<div class="sip-stat-box sip-stat-oracles"><div class="sip-stat-num">11</div><div class="sip-stat-label">Test Oracles</div></div>' +
  '</div>';

  /* Filter bar */
  var filters = [
    { id: 'all', label: 'All' },
    { id: 'critical', label: 'Critical' },
    { id: 'high', label: 'High' },
    { id: 'data', label: 'Data' },
    { id: 'function', label: 'Function' },
    { id: 'time', label: 'Time' },
    { id: 'operations', label: 'Operations' },
    { id: 'security', label: 'Security' },
    { id: 'platform', label: 'Platform' }
  ];

  html += '<div class="sip-filter-bar">';
  for (var fi = 0; fi < filters.length; fi++) {
    var f = filters[fi];
    html += '<button class="sip-filter-btn' + (f.id === 'all' ? ' active' : '') + '" ' +
      'id="sip-filter-' + f.id + '" ' +
      'onclick="sipFilterRst(\'' + f.id + '\')">' + f.label + '</button>';
  }
  html += '<span class="sip-filter-count" id="sip-rst-visible-count"></span>';
  html += '</div>';

  /* Sections */
  for (var si = 0; si < SIP_RST_SECTIONS.length; si++) {
    var section = SIP_RST_SECTIONS[si];
    var sectionCat = section.category || 'data';
    html += '<div class="sip-rst-section" id="sip-rst-sec-' + si + '" data-category="' + sectionCat + '">' +
      '<div class="sip-rst-sec-header">' +
        '<h3 class="sip-rst-sec-title">' + (section.title || '') + '</h3>' +
        '<span class="sip-heuristic-tag">' + (section.heuristic || '') + '</span>' +
      '</div>' +
      '<p class="sip-rst-sec-desc">' + (section.description || '') + '</p>' +
      '<div class="sip-rst-table-wrap">' +
        '<table class="sip-rst-table">' +
          '<thead><tr>' +
            '<th>#</th>' +
            '<th>Scenario</th>' +
            '<th>How Triggered</th>' +
            '<th>Expected</th>' +
            '<th>Impact</th>' +
            '<th>Risk</th>' +
            '<th>Heuristic</th>' +
          '</tr></thead>' +
          '<tbody>' + sipBuildRstRows(section.scenarios || []) + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
  }

  el.innerHTML = html;
  sipUpdateRstCount();
}

/**
 * Builds table row HTML for RST scenarios.
 * @param {Array} scenarios
 * @returns {string}
 */
function sipBuildRstRows(scenarios) {
  if (!scenarios || !scenarios.length) return '<tr><td colspan="7" class="sip-empty-row">No scenarios.</td></tr>';
  var rows = '';
  for (var i = 0; i < scenarios.length; i++) {
    var s = scenarios[i];
    var riskClass = 'sip-risk-' + (s.risk || 'medium').toLowerCase().replace(/\s+/g, '-');
    rows += '<tr data-risk="' + (s.risk || '').toLowerCase() + '">' +
      '<td class="sip-rst-num">' + (s.num || (i + 1)) + '</td>' +
      '<td><strong>' + (s.scenario || '') + '</strong></td>' +
      '<td>' + (s.trigger || '') + '</td>' +
      '<td>' + (s.expected || '') + '</td>' +
      '<td>' + (s.impact || '') + '</td>' +
      '<td><span class="' + riskClass + '">' + (s.risk || '') + '</span></td>' +
      '<td>' + (s.oracle ? '<span class="sip-oracle-tag">' + s.oracle + '</span>' : (s.heuristic || '')) + '</td>' +
    '</tr>';
  }
  return rows;
}

/**
 * Filters RST sections by category or risk level.
 * @param {string} cat - Filter category key
 */
function sipFilterRst(cat) {
  /* Update button active state */
  var btns = document.querySelectorAll('.sip-filter-btn');
  if (btns) {
    btns.forEach(function(b) { b.classList.remove('active'); });
  }
  var activeBtn = document.getElementById('sip-filter-' + cat);
  if (activeBtn) { activeBtn.classList.add('active'); }

  var sections = document.querySelectorAll('.sip-rst-section');
  if (!sections) return;

  if (cat === 'all') {
    sections.forEach(function(sec) {
      sec.style.display = '';
      /* Show all rows */
      var rows = sec.querySelectorAll('tbody tr');
      if (rows) { rows.forEach(function(r) { r.style.display = ''; }); }
    });
  } else if (cat === 'critical' || cat === 'high') {
    sections.forEach(function(sec) {
      var rows = sec.querySelectorAll('tbody tr');
      var hasVisible = false;
      if (rows) {
        rows.forEach(function(r) {
          var risk = (r.getAttribute('data-risk') || '').toLowerCase();
          var show = (risk === cat);
          r.style.display = show ? '' : 'none';
          if (show) { hasVisible = true; }
        });
      }
      sec.style.display = hasVisible ? '' : 'none';
    });
  } else {
    /* Category filter — show only the matching section */
    sections.forEach(function(sec) {
      var secCat = (sec.getAttribute('data-category') || '').toLowerCase();
      var show = (secCat === cat);
      sec.style.display = show ? '' : 'none';
      /* When showing a category section, ensure all its rows are visible */
      if (show) {
        var rows = sec.querySelectorAll('tbody tr');
        if (rows) { rows.forEach(function(r) { r.style.display = ''; }); }
      }
    });
  }

  sipUpdateRstCount();
}

/**
 * Updates the visible scenario count badge.
 */
function sipUpdateRstCount() {
  var counter = document.getElementById('sip-rst-visible-count');
  if (!counter) return;
  var visibleRows = document.querySelectorAll('.sip-rst-section:not([style*="display: none"]) tbody tr:not([style*="display: none"])');
  var count = visibleRows ? visibleRows.length : 0;
  counter.textContent = count + ' scenario' + (count !== 1 ? 's' : '');
}

/* ─────────────────────────────────────────────
   6. GAPS RENDERER
   ───────────────────────────────────────────── */

/**
 * Renders gap analysis into #sip-gaps-content.
 * Reads from global SIP_GAPS.
 */
function sipRenderGaps() {
  var el = document.getElementById('sip-gaps-content');
  if (!el) return;
  if (typeof SIP_GAPS === 'undefined' || !SIP_GAPS.length) {
    el.innerHTML = '<p class="sip-empty">No gaps defined.</p>';
    return;
  }

  var html = '';

  /* Stats row */
  html += '<div class="sip-stats-row">' +
    '<div class="sip-stat-box"><div class="sip-stat-num">22</div><div class="sip-stat-label">Total Gaps</div></div>' +
    '<div class="sip-stat-box sip-stat-design"><div class="sip-stat-num">6</div><div class="sip-stat-label">Design</div></div>' +
    '<div class="sip-stat-box sip-stat-conflict"><div class="sip-stat-num">2</div><div class="sip-stat-label">Conflict</div></div>' +
    '<div class="sip-stat-box sip-stat-undefined"><div class="sip-stat-num">7</div><div class="sip-stat-label">Undefined</div></div>' +
    '<div class="sip-stat-box sip-stat-billing"><div class="sip-stat-num">3</div><div class="sip-stat-label">Billing</div></div>' +
    '<div class="sip-stat-box sip-stat-liability"><div class="sip-stat-num">2</div><div class="sip-stat-label">Liability</div></div>' +
    '<div class="sip-stat-box sip-stat-security"><div class="sip-stat-num">2</div><div class="sip-stat-label">Security</div></div>' +
  '</div>';

  /* Gaps table */
  html += '<div class="sip-gaps-table-wrap">' +
    '<table class="sip-gaps-table">' +
      '<thead><tr>' +
        '<th>#</th>' +
        '<th>Type</th>' +
        '<th>Gap Description</th>' +
        '<th>Why It Matters</th>' +
        '<th>Heuristic Source</th>' +
        '<th>Suggested Action</th>' +
      '</tr></thead>' +
      '<tbody>';

  for (var i = 0; i < SIP_GAPS.length; i++) {
    var gap = SIP_GAPS[i];
    var typeSlug = (gap.type || 'design').toLowerCase().replace(/\s+/g, '-');
    html += '<tr>' +
      '<td class="sip-gap-num">' + (gap.num || (i + 1)) + '</td>' +
      '<td><span class="sip-gap-' + typeSlug + '">' + (gap.type || '') + '</span></td>' +
      '<td>' + (gap.description || '') + '</td>' +
      '<td>' + (gap.why || '') + '</td>' +
      '<td><em>' + (gap.heuristic || '') + '</em></td>' +
      '<td>' + (gap.action || '') + '</td>' +
    '</tr>';
  }

  html += '</tbody></table></div>';

  el.innerHTML = html;
}

/* ─────────────────────────────────────────────
   7. PHONE PROTOTYPE
   ───────────────────────────────────────────── */

/**
 * Initialises the 7-screen phone prototype.
 */
function sipProtoInit() {
  sipProtoBuilt = true;
  sipCurrentScreen = 1;
  sipCurrentScenario = 'exact';
  sipRenderProtoShell();
  sipUpdateProtoUI();
}

/**
 * Renders the prototype shell HTML into #sip-proto-root.
 * Builds sidebar, phone frame and all 7 screens.
 */
function sipRenderProtoShell() {
  var root = document.getElementById('sip-proto-root');
  if (!root) return;

  var html = '<div class="sip-proto-layout">' +

    /* Sidebar */
    '<div class="sip-proto-sidebar">' +
      '<div class="sip-proto-sidebar-title">Scenario</div>' +
      '<div class="sip-scenario-btns">' +
        '<button class="sip-scenario-btn active" id="sip-scen-exact" onclick="sipSetScenario(\'exact\')">Exact Match</button>' +
        '<button class="sip-scenario-btn" id="sip-scen-partial" onclick="sipSetScenario(\'partial\')">Partial Match</button>' +
        '<button class="sip-scenario-btn" id="sip-scen-none" onclick="sipSetScenario(\'none\')">No Match</button>' +
        '<button class="sip-scenario-btn" id="sip-scen-unavailable" onclick="sipSetScenario(\'unavailable\')">Unavailable</button>' +
      '</div>' +
      '<div class="sip-proto-sidebar-title" style="margin-top:20px">Steps</div>' +
      '<ol class="sip-proto-step-list" id="sip-proto-step-list">' +
        sipBuildStepList() +
      '</ol>' +
    '</div>' +

    /* Phone */
    '<div class="sip-proto-phone-wrap">' +
      '<div class="sip-proto-screen-label" id="sip-proto-screen-label">Screen 1 of 7</div>' +
      '<div class="sip-proto-phone">' +
        '<div class="sip-proto-notch"></div>' +
        '<div class="sip-proto-display">' +
          sipBuildAllScreens() +
        '</div>' +
      '</div>' +
      '<div class="sip-proto-nav-row">' +
        '<button class="sip-proto-nav-btn" id="sip-proto-prev" onclick="sipProtoPrev()" disabled>&#x2039; Back</button>' +
        '<div class="sip-proto-dots" id="sip-proto-dots">' + sipBuildDots() + '</div>' +
        '<button class="sip-proto-nav-btn" id="sip-proto-next" onclick="sipProtoNext()">Next &#x203A;</button>' +
      '</div>' +
    '</div>' +

    /* No-match modal */
    '<div class="sip-no-match-modal" id="sip-no-match-modal" style="display:none">' +
      '<div class="sip-no-match-modal-box">' +
        '<div class="sip-modal-icon">&#x26A0;</div>' +
        '<h3>Confirm Payment Despite No Match</h3>' +
        '<p>The payee name you entered <strong>does not match</strong> the account holder name. ' +
        'If you proceed, you accept liability for this payment. ' +
        'Fraud cannot be reversed.</p>' +
        '<div class="sip-modal-btns">' +
          '<button class="sip-modal-cancel" onclick="sipHideNoMatchModal()">Go Back</button>' +
          '<button class="sip-modal-confirm" onclick="sipHideNoMatchModal();sipProtoGoTo(5)">I Understand, Proceed</button>' +
        '</div>' +
      '</div>' +
    '</div>' +

  '</div>';

  root.innerHTML = html;
}

/**
 * Builds the 7-screen HTML for the prototype phone.
 * @returns {string}
 */
function sipBuildAllScreens() {
  var screens = '';

  /* Screen 1 — Payment Checkout */
  screens += '<div class="sip-proto-screen" id="sip-screen-1">' +
    '<div class="sip-pscreen-bar"><span>&#x2190;</span><span>Payment</span><span></span></div>' +
    '<div class="sip-pscreen-body">' +
      '<div class="sip-pfield-group">' +
        '<label class="sip-pfield-label">Pay to (IBAN)</label>' +
        '<input class="sip-pfield-input" type="text" value="AE070331234567890123456" readonly/>' +
      '</div>' +
      '<div class="sip-pfield-group">' +
        '<label class="sip-pfield-label">Recipient Name</label>' +
        '<input class="sip-pfield-input" type="text" value="Mohammed Al Rashidi" readonly/>' +
      '</div>' +
      '<div class="sip-pfield-group">' +
        '<label class="sip-pfield-label">Amount (AED)</label>' +
        '<input class="sip-pfield-input" type="text" value="1,250.00" readonly/>' +
      '</div>' +
      '<div class="sip-pfield-group">' +
        '<label class="sip-pfield-label">Reference</label>' +
        '<input class="sip-pfield-input" type="text" value="Invoice INV-2024-0891" readonly/>' +
      '</div>' +
      '<button class="sip-paction-btn" onclick="sipProtoNext()">Continue</button>' +
    '</div>' +
  '</div>';

  /* Screen 2 — Bank Selection */
  screens += '<div class="sip-proto-screen" id="sip-screen-2" style="display:none">' +
    '<div class="sip-pscreen-bar"><span onclick="sipProtoPrev()">&#x2190;</span><span>Select Your Bank</span><span></span></div>' +
    '<div class="sip-pscreen-body">' +
      '<p class="sip-pscreen-hint">Choose the bank account to pay from</p>' +
      '<div class="sip-bank-list">' +
        '<div class="sip-bank-item sip-bank-selected" onclick="sipProtoNext()">' +
          '<div class="sip-bank-icon" style="background:#c00;">A</div>' +
          '<div><div class="sip-bank-name">ADCB — Current Account</div><div class="sip-bank-iban">AE07 0330 0000 0123 4567 890</div></div>' +
          '<span class="sip-bank-check">&#x2713;</span>' +
        '</div>' +
        '<div class="sip-bank-item" onclick="sipProtoNext()">' +
          '<div class="sip-bank-icon" style="background:#006;">E</div>' +
          '<div><div class="sip-bank-name">Emirates NBD — Savings</div><div class="sip-bank-iban">AE57 0260 0010 1234 5678 901</div></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';

  /* Screen 3 — Verifying Payee (CoP loading) */
  screens += '<div class="sip-proto-screen" id="sip-screen-3" style="display:none">' +
    '<div class="sip-pscreen-bar"><span></span><span>Verifying Payee</span><span></span></div>' +
    '<div class="sip-pscreen-body sip-pscreen-centered">' +
      '<div class="sip-cop-spinner"></div>' +
      '<div class="sip-cop-loading-label">Confirming payee name&hellip;</div>' +
      '<div class="sip-cop-loading-sub">Checking with the recipient\'s bank</div>' +
    '</div>' +
  '</div>';

  /* Screen 4 — CoP Result (dynamic) */
  screens += '<div class="sip-proto-screen" id="sip-screen-4" style="display:none">' +
    '<div class="sip-pscreen-bar"><span onclick="sipProtoGoTo(1)">&#x2190;</span><span>Payee Check</span><span></span></div>' +
    '<div id="sip-cop-result-body"></div>' +
  '</div>';

  /* Screen 5 — Payment Review */
  screens += '<div class="sip-proto-screen" id="sip-screen-5" style="display:none">' +
    '<div class="sip-pscreen-bar"><span onclick="sipProtoPrev()">&#x2190;</span><span>Review Payment</span><span></span></div>' +
    '<div class="sip-pscreen-body">' +
      '<div id="sip-review-badge-wrap"></div>' +
      '<div class="sip-review-row"><span>Pay to</span><strong>Mohammed Al Rashidi</strong></div>' +
      '<div class="sip-review-row"><span>IBAN</span><strong>AE07 0331 2345 6789 0123 456</strong></div>' +
      '<div class="sip-review-row"><span>Amount</span><strong>AED 1,250.00</strong></div>' +
      '<div class="sip-review-row"><span>Reference</span><strong>Invoice INV-2024-0891</strong></div>' +
      '<div class="sip-review-row"><span>From</span><strong>ADCB Current ****7890</strong></div>' +
      '<button class="sip-paction-btn" onclick="sipProtoNext()">Authorise with Bank</button>' +
    '</div>' +
  '</div>';

  /* Screen 6 — Bank Authorisation */
  screens += '<div class="sip-proto-screen" id="sip-screen-6" style="display:none">' +
    '<div class="sip-pscreen-bar"><span></span><span>ADCB</span><span></span></div>' +
    '<div class="sip-pscreen-body sip-pscreen-centered">' +
      '<div class="sip-auth-logo">A</div>' +
      '<div class="sip-auth-title">Authorise Payment</div>' +
      '<div class="sip-auth-amount">AED 1,250.00</div>' +
      '<div class="sip-auth-to">To Mohammed Al Rashidi</div>' +
      '<button class="sip-paction-btn sip-biometric-btn" onclick="sipProtoNext()">&#x1F4F1; Confirm with Biometrics</button>' +
      '<div class="sip-auth-otp-link">Use OTP instead</div>' +
    '</div>' +
  '</div>';

  /* Screen 7 — Payment Receipt */
  screens += '<div class="sip-proto-screen" id="sip-screen-7" style="display:none">' +
    '<div class="sip-pscreen-bar"><span></span><span>Receipt</span><span></span></div>' +
    '<div class="sip-pscreen-body sip-pscreen-centered">' +
      '<div class="sip-receipt-icon">&#x2714;</div>' +
      '<div class="sip-receipt-title">Payment Sent</div>' +
      '<div class="sip-receipt-amount">AED 1,250.00</div>' +
      '<div class="sip-receipt-to">Mohammed Al Rashidi</div>' +
      '<div class="sip-receipt-ref">Ref: INV-2024-0891</div>' +
      '<div class="sip-receipt-status">Status: ACCC — Settled</div>' +
      '<button class="sip-paction-btn" onclick="sipProtoGoTo(1)">New Payment</button>' +
    '</div>' +
  '</div>';

  return screens;
}

/**
 * Builds step list items for the prototype sidebar.
 * @returns {string}
 */
function sipBuildStepList() {
  var items = '';
  for (var i = 1; i <= 7; i++) {
    items += '<li class="sip-proto-step-item" id="sip-proto-step-' + i + '" onclick="sipProtoGoTo(' + i + ')">' +
      SIP_SCREEN_NAMES[i] +
    '</li>';
  }
  return items;
}

/**
 * Builds step dot indicators.
 * @returns {string}
 */
function sipBuildDots() {
  var dots = '';
  for (var i = 1; i <= 7; i++) {
    dots += '<span class="sip-proto-dot" id="sip-dot-' + i + '" onclick="sipProtoGoTo(' + i + ')"></span>';
  }
  return dots;
}

/**
 * Sets the current CoP scenario and re-renders dependent screens.
 * @param {string} scenario - 'exact'|'partial'|'none'|'unavailable'
 */
function sipSetScenario(scenario) {
  sipCurrentScenario = scenario;

  /* Update scenario button states */
  var scenBtns = ['exact', 'partial', 'none', 'unavailable'];
  for (var i = 0; i < scenBtns.length; i++) {
    var btn = document.getElementById('sip-scen-' + scenBtns[i]);
    if (btn) {
      btn.classList.toggle('active', scenBtns[i] === scenario);
    }
  }

  /* Re-render dynamic screens */
  sipRenderCopResult();
  sipRenderReviewBadge();
}

/**
 * Advances to the next prototype screen.
 */
function sipProtoNext() {
  if (sipCurrentScreen >= 7) return;
  var next = sipCurrentScreen + 1;
  sipProtoGoTo(next);

  /* Screen 3 auto-advances after 1.5s (CoP loading simulation) */
  if (next === 3) {
    setTimeout(function() {
      if (sipCurrentScreen === 3) {
        sipRenderCopResult();
        sipProtoGoTo(4);
      }
    }, 1500);
  }
}

/**
 * Goes back to the previous prototype screen.
 */
function sipProtoPrev() {
  if (sipCurrentScreen <= 1) return;
  sipProtoGoTo(sipCurrentScreen - 1);
}

/**
 * Navigates the prototype to a specific screen number.
 * @param {number} n - Target screen number (1-7)
 */
function sipProtoGoTo(n) {
  if (n < 1 || n > 7) return;

  /* Hide current screen */
  var current = document.getElementById('sip-screen-' + sipCurrentScreen);
  if (current) { current.style.display = 'none'; }

  sipCurrentScreen = n;

  /* Show new screen */
  var next = document.getElementById('sip-screen-' + sipCurrentScreen);
  if (next) { next.style.display = ''; }

  /* Render dynamic screens when navigating to them */
  if (sipCurrentScreen === 4) { sipRenderCopResult(); }
  if (sipCurrentScreen === 5) { sipRenderReviewBadge(); }

  sipUpdateProtoUI();
}

/**
 * Dynamically renders the CoP result into screen 4.
 */
function sipRenderCopResult() {
  var body = document.getElementById('sip-cop-result-body');
  if (!body) return;

  var config = SIP_SCENARIO_CONFIG[sipCurrentScenario] || SIP_SCENARIO_CONFIG.exact;
  var checkId = 'sip-cop-result-check';

  var html = '<div class="sip-pscreen-body">' +
    '<div class="sip-cop-result-banner ' + config.bannerClass + '">' +
      '<span class="sip-cop-result-icon">' + config.bannerIcon + '</span>' +
      '<div>' +
        '<div class="sip-cop-result-title">' + config.bannerTitle + '</div>' +
        '<div class="sip-cop-result-text">' + config.bannerText + '</div>' +
      '</div>' +
    '</div>' +

    '<div class="sip-cop-result-detail">' +
      '<div class="sip-cop-detail-row"><span>You entered:</span><strong>Mohammed Al Rashidi</strong></div>';

  /* Show matched name based on scenario */
  if (sipCurrentScenario === 'exact') {
    html += '<div class="sip-cop-detail-row"><span>Bank has:</span><strong style="color:#0F6E56">Mohammed Al Rashidi</strong></div>';
  } else if (sipCurrentScenario === 'partial') {
    html += '<div class="sip-cop-detail-row"><span>Bank has:</span><strong style="color:#854F0B">Mohammed Rashidi</strong></div>';
  } else if (sipCurrentScenario === 'none') {
    html += '<div class="sip-cop-detail-row"><span>Bank has:</span><strong style="color:#8B1D1D">Name not matched</strong></div>';
  } else {
    html += '<div class="sip-cop-detail-row"><span>Bank has:</span><strong style="color:#666">Check unavailable</strong></div>';
  }

  html += '</div>';

  /* Warning checkbox for partial/none */
  if (config.checkRequired) {
    html += '<div class="sip-cop-warning-check">' +
      '<input type="checkbox" id="' + checkId + '" onchange="sipCopCheckChange(this)"/>' +
      '<label for="' + checkId + '">I understand and confirm I wish to proceed</label>' +
    '</div>';
  }

  /* Proceed button */
  if (sipCurrentScenario === 'none') {
    html += '<button class="sip-paction-btn" id="sip-cop-proceed-btn" ' +
      (config.proceedDisabled ? 'disabled ' : '') +
      'onclick="sipShowNoMatchModal()">Proceed</button>';
  } else {
    html += '<button class="sip-paction-btn" id="sip-cop-proceed-btn" ' +
      (config.proceedDisabled ? 'disabled ' : '') +
      'onclick="sipProtoGoTo(5)">Proceed to Review</button>';
  }

  html += '<button class="sip-paction-btn sip-paction-secondary" onclick="sipProtoGoTo(1)">Cancel Payment</button>' +
  '</div>';

  body.innerHTML = html;
}

/**
 * Handles the CoP result checkbox change.
 * Enables the Proceed button when checked.
 * @param {HTMLElement} checkbox
 */
function sipCopCheckChange(checkbox) {
  var btn = document.getElementById('sip-cop-proceed-btn');
  if (btn) { btn.disabled = !checkbox.checked; }
}

/**
 * Renders the CoP badge on the payment review screen (screen 5).
 */
function sipRenderReviewBadge() {
  var wrap = document.getElementById('sip-review-badge-wrap');
  if (!wrap) return;

  var config = SIP_SCENARIO_CONFIG[sipCurrentScenario] || SIP_SCENARIO_CONFIG.exact;
  var badge = config.badge;

  wrap.innerHTML = '<div class="sip-review-cop-badge ' + badge.cls + '">' +
    '<span class="sip-review-cop-icon">' + badge.icon + '</span>' +
    '<span>' + badge.label + '</span>' +
  '</div>';
}

/**
 * Shows the No Match confirmation modal.
 */
function sipShowNoMatchModal() {
  var modal = document.getElementById('sip-no-match-modal');
  if (modal) {
    modal.style.display = 'flex';
    sipNoMatchModalOpen = true;
  }
}

/**
 * Hides the No Match confirmation modal.
 */
function sipHideNoMatchModal() {
  var modal = document.getElementById('sip-no-match-modal');
  if (modal) {
    modal.style.display = 'none';
    sipNoMatchModalOpen = false;
  }
}

/**
 * Updates the prototype UI: screen label, nav buttons, step list, dots.
 */
function sipUpdateProtoUI() {
  /* Screen label */
  var label = document.getElementById('sip-proto-screen-label');
  if (label) {
    label.textContent = SIP_SCREEN_NAMES[sipCurrentScreen] + ' (' + sipCurrentScreen + ' of 7)';
  }

  /* Prev button */
  var prevBtn = document.getElementById('sip-proto-prev');
  if (prevBtn) { prevBtn.disabled = (sipCurrentScreen === 1); }

  /* Next button */
  var nextBtn = document.getElementById('sip-proto-next');
  if (nextBtn) { nextBtn.disabled = (sipCurrentScreen === 7); }

  /* Step list */
  for (var i = 1; i <= 7; i++) {
    var stepItem = document.getElementById('sip-proto-step-' + i);
    if (!stepItem) continue;
    stepItem.className = 'sip-proto-step-item';
    if (i < sipCurrentScreen) {
      stepItem.classList.add('sip-step-done');
    } else if (i === sipCurrentScreen) {
      stepItem.classList.add('sip-step-active');
    }
  }

  /* Step dots */
  for (var d = 1; d <= 7; d++) {
    var dot = document.getElementById('sip-dot-' + d);
    if (!dot) continue;
    dot.className = 'sip-proto-dot';
    if (d < sipCurrentScreen) {
      dot.classList.add('sip-dot-done');
    } else if (d === sipCurrentScreen) {
      dot.classList.add('sip-dot-active');
    } else {
      dot.classList.add('sip-dot-future');
    }
  }
}

/* ─────────────────────────────────────────────
   8. MASTER INIT
   ───────────────────────────────────────────── */

/**
 * Master initialiser — call once on page load.
 * Renders all SIP CoP sections.
 */
function sipCopInit() {
  sipRenderFlow();
  sipRenderCopDeepDive();
  sipRenderStories();
  sipRenderRST();
  sipRenderGaps();
  sipProtoInit();
}
