/* ============================================================
   ADCB Open Finance — SME SIP Solution Portal Engine
   Rendering engine for the SME SIP LFI section.
   Depends on globals from sme-sip-data.js:
     SME_SIP_OVERVIEW, SME_SIP_FLOW, SME_SIP_SCENARIOS,
     SME_SIP_ACS, SME_SIP_ARCH, SME_SIP_APIS, SME_SIP_GAPS
   No ES modules — plain var declarations.
   ============================================================ */

/* ── STATE ── */
var smeCurrentScenario = 'login';
var smeOpenCollapsibles = {};

/* =============================================================
   1. TAB NAVIGATION — smeGoTab(tabId)
   Shows/hides .sme-page elements, updates .sme-stab active state
   tabId: 'overview' | 'flow' | 'prototype' | 'acceptance' |
           'architecture' | 'apis' | 'gaps'
   ============================================================= */
function smeGoTab(tabId) {
  var pages = document.querySelectorAll('.sme-page');
  for (var i = 0; i < pages.length; i++) {
    pages[i].classList.remove('active');
  }
  var tabs = document.querySelectorAll('.sme-stab');
  for (var j = 0; j < tabs.length; j++) {
    tabs[j].classList.remove('active');
  }
  var targetPage = document.getElementById('sme-page-' + tabId);
  if (targetPage) targetPage.classList.add('active');
  var targetTab = document.querySelector('.sme-stab[data-tab="' + tabId + '"]');
  if (targetTab) targetTab.classList.add('active');
}

/* =============================================================
   2. COLLAPSIBLE HELPER
   ============================================================= */
function smeToggleCollapsible(id) {
  var body = document.getElementById('sme-col-body-' + id);
  var chevron = document.getElementById('sme-col-chev-' + id);
  if (!body) return;
  var isOpen = smeOpenCollapsibles[id];
  smeOpenCollapsibles[id] = !isOpen;
  body.style.display = isOpen ? 'none' : 'block';
  if (chevron) chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
}

function smeMakeCollapsible(id, title, contentHtml, startOpen) {
  var open = startOpen ? true : false;
  if (open) smeOpenCollapsibles[id] = true;
  return '<div class="sme-collapsible">' +
    '<div class="sme-collapsible-header" onclick="smeToggleCollapsible(\'' + id + '\')">' +
      '<span class="sme-collapsible-title">' + title + '</span>' +
      '<span class="sme-collapsible-chev" id="sme-col-chev-' + id + '" style="transition:transform .2s ease;display:inline-block;' + (open ? 'transform:rotate(90deg)' : '') + '">&#x25B6;</span>' +
    '</div>' +
    '<div id="sme-col-body-' + id + '" style="display:' + (open ? 'block' : 'none') + ';padding:16px 20px;border-top:1px solid var(--color-border);">' +
      contentHtml +
    '</div>' +
  '</div>';
}

/* =============================================================
   3. OVERVIEW TAB — smeRenderOverview()
   ============================================================= */
function smeRenderOverview() {
  var el = document.getElementById('sme-overview-content');
  if (!el || !SME_SIP_OVERVIEW) return;

  /* ── Metrics ── */
  var metricsHtml = '<div class="sme-metrics-row">';
  for (var m = 0; m < SME_SIP_OVERVIEW.metrics.length; m++) {
    var met = SME_SIP_OVERVIEW.metrics[m];
    metricsHtml +=
      '<div class="sme-metric-card">' +
        '<div class="sme-metric-num" style="color:' + met.color + '">' + met.num + '</div>' +
        '<div class="sme-metric-label">' + met.label + '</div>' +
      '</div>';
  }
  metricsHtml += '</div>';

  /* ── Scope section ── */
  var scopeHtml = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">';
  scopeHtml += '<div>';
  scopeHtml += '<div style="font-size:12px;font-weight:700;color:#15803D;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px;">In Scope</div>';
  scopeHtml += '<table style="width:100%;border-collapse:collapse;">';
  for (var si = 0; si < SME_SIP_OVERVIEW.scope.inScope.length; si++) {
    scopeHtml += '<tr><td style="padding:6px 10px;border-bottom:1px solid var(--color-border);font-size:13px;color:var(--color-text-primary);"><span style="color:#15803D;margin-right:6px;">&#x2713;</span>' + SME_SIP_OVERVIEW.scope.inScope[si] + '</td></tr>';
  }
  scopeHtml += '</table></div>';
  scopeHtml += '<div>';
  scopeHtml += '<div style="font-size:12px;font-weight:700;color:#E31E24;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px;">Out of Scope</div>';
  scopeHtml += '<table style="width:100%;border-collapse:collapse;">';
  for (var so = 0; so < SME_SIP_OVERVIEW.scope.outScope.length; so++) {
    scopeHtml += '<tr><td style="padding:6px 10px;border-bottom:1px solid var(--color-border);font-size:13px;color:var(--color-text-secondary);"><span style="color:#E31E24;margin-right:6px;">&#x2715;</span>' + SME_SIP_OVERVIEW.scope.outScope[so] + '</td></tr>';
  }
  scopeHtml += '</table></div>';
  scopeHtml += '</div>';

  /* ── Journey section ── */
  var journeyHtml = '<table style="width:100%;border-collapse:collapse;">' +
    '<thead><tr>' +
      '<th style="background:var(--navy);color:#fff;padding:9px 12px;text-align:left;font-size:11px;width:40px;">#</th>' +
      '<th style="background:var(--navy);color:#fff;padding:9px 12px;text-align:left;font-size:11px;">Step</th>' +
      '<th style="background:var(--navy);color:#fff;padding:9px 12px;text-align:left;font-size:11px;width:80px;">Who</th>' +
      '<th style="background:var(--navy);color:#fff;padding:9px 12px;text-align:left;font-size:11px;">Description</th>' +
    '</tr></thead><tbody>';
  for (var ji = 0; ji < SME_SIP_OVERVIEW.journey.length; ji++) {
    var jStep = SME_SIP_OVERVIEW.journey[ji];
    var whoColor = jStep.who === 'TPP' ? '#1E40AF' : '#0F766E';
    var whoBg = jStep.who === 'TPP' ? '#DBEAFE' : '#CCFBF1';
    journeyHtml +=
      '<tr style="' + (ji % 2 === 1 ? 'background:var(--color-surface-secondary)' : '') + '">' +
        '<td style="padding:9px 12px;font-size:13px;font-weight:700;color:var(--navy);">' + jStep.num + '</td>' +
        '<td style="padding:9px 12px;font-size:13px;font-weight:600;color:var(--color-text-primary);">' + jStep.step + '</td>' +
        '<td style="padding:9px 12px;">' +
          '<span style="padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;background:' + whoBg + ';color:' + whoColor + ';">' + jStep.who + '</span>' +
        '</td>' +
        '<td style="padding:9px 12px;font-size:13px;color:var(--color-text-secondary);line-height:1.5;">' + jStep.desc + '</td>' +
      '</tr>';
  }
  journeyHtml += '</tbody></table>';

  /* ── Assumptions section ── */
  var assumHtml = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';
  for (var ai = 0; ai < SME_SIP_OVERVIEW.assumptions.length; ai++) {
    assumHtml +=
      '<div style="padding:14px 16px;background:var(--color-surface-secondary);border:1px solid var(--color-border);border-left:3px solid #D97706;border-radius:var(--radius-button);">' +
        '<div style="font-size:11px;font-weight:700;color:#D97706;margin-bottom:4px;">ASSUMPTION ' + (ai + 1) + '</div>' +
        '<div style="font-size:13px;color:var(--color-text-secondary);line-height:1.6;">' + SME_SIP_OVERVIEW.assumptions[ai] + '</div>' +
      '</div>';
  }
  assumHtml += '</div>';

  /* ── v2.1 Changes Banner ── */
  var changesHtml = '';
  if (SME_SIP_OVERVIEW.v21Changes && SME_SIP_OVERVIEW.v21Changes.length) {
    changesHtml =
      '<div style="background:linear-gradient(135deg,var(--navy),#2B4B8A);border-radius:var(--radius-card);padding:16px 20px;margin-bottom:var(--space-section-gap);border-left:4px solid #D4A843;">' +
        '<div style="font-size:12px;font-weight:700;color:#D4A843;margin-bottom:10px;letter-spacing:.5px;">Standards v2.1-final — Key Changes for SME SIP (DOF-2828)</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
    for (var ci = 0; ci < SME_SIP_OVERVIEW.v21Changes.length; ci++) {
      changesHtml += '<div style="font-size:11px;color:rgba(255,255,255,0.85);line-height:1.5;">&#x2713; ' + SME_SIP_OVERVIEW.v21Changes[ci] + '</div>';
    }
    changesHtml += '</div></div>';
  }

  var html = changesHtml + metricsHtml +
    smeMakeCollapsible('scope', 'Scope — In &amp; Out', scopeHtml, true) +
    smeMakeCollapsible('journey', '9-Step Customer Journey', journeyHtml, false) +
    smeMakeCollapsible('assumptions', 'Key Assumptions (' + SME_SIP_OVERVIEW.assumptions.length + ')', assumHtml, false);

  el.innerHTML = html;
}

/* =============================================================
   4. FLOW TAB — smeRenderFlow()
   ============================================================= */
function smeRenderFlow() {
  var el = document.getElementById('sme-flow-content');
  if (!el || !SME_SIP_FLOW) return;

  /* Happy path horizontal flow */
  var happyHtml = '<div style="margin-bottom:20px;">' +
    '<div style="font-size:12px;font-weight:700;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.7px;margin-bottom:14px;">Happy Path — 9 Steps</div>' +
    '<div class="sme-flow-container">' +
      '<div class="sme-flow-steps">';

  for (var hi = 0; hi < SME_SIP_FLOW.happyPath.length; hi++) {
    var step = SME_SIP_FLOW.happyPath[hi];
    var isLast = hi === SME_SIP_FLOW.happyPath.length - 1;
    happyHtml +=
      '<div class="sme-flow-step">' +
        '<div class="sme-flow-node" style="border-color:' + step.color + ';background:' + step.color + '15;">' +
          '<div style="font-size:18px;margin-bottom:4px;">' + step.icon + '</div>' +
          '<div style="font-size:10px;font-weight:700;color:' + step.color + ';line-height:1.3;">' + step.label + '</div>' +
          '<div style="font-size:9px;color:var(--color-text-secondary);margin-top:2px;line-height:1.3;">' + step.sublabel + '</div>' +
        '</div>' +
        (isLast ? '' : '<div class="sme-flow-arrow">&#x2192;</div>') +
      '</div>';
  }
  happyHtml += '</div></div></div>';

  /* Error paths table */
  var errHtml =
    '<div style="margin-bottom:20px;">' +
      '<div style="font-size:12px;font-weight:700;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.7px;margin-bottom:10px;">Error &amp; Blocked Paths</div>' +
      '<table style="width:100%;border-collapse:collapse;">' +
        '<thead><tr>' +
          '<th style="background:var(--navy);color:#fff;padding:9px 14px;text-align:left;font-size:11px;">Scenario</th>' +
          '<th style="background:var(--navy);color:#fff;padding:9px 14px;text-align:left;font-size:11px;">Screen</th>' +
        '</tr></thead><tbody>';
  for (var ei = 0; ei < SME_SIP_FLOW.errorPaths.length; ei++) {
    var ep = SME_SIP_FLOW.errorPaths[ei];
    errHtml +=
      '<tr style="' + (ei % 2 === 1 ? 'background:var(--color-surface-secondary)' : '') + '">' +
        '<td style="padding:9px 14px;font-size:13px;color:var(--color-text-primary);">' +
          '<span style="color:#E31E24;margin-right:6px;">&#x26A0;</span>' + ep.scenario +
        '</td>' +
        '<td style="padding:9px 14px;">' +
          '<button class="sme-scenario-link-btn" onclick="smeGoTab(\'prototype\');smeShowScenario(\'' + ep.screen + '\',null);" ' +
            'style="background:#EFF6FF;color:#1E40AF;border:1px solid #BFDBFE;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;cursor:pointer;">' +
            ep.screen +
          '</button>' +
        '</td>' +
      '</tr>';
  }
  errHtml += '</tbody></table></div>';

  /* Eligibility check */
  var eligHtml =
    '<div>' +
      '<div style="font-size:12px;font-weight:700;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.7px;margin-bottom:10px;">Eligibility Gate — 3 Checks</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px;">';
  for (var eli = 0; eli < SME_SIP_FLOW.eligibility.length; eli++) {
    var ec = SME_SIP_FLOW.eligibility[eli];
    eligHtml +=
      '<div style="padding:14px 16px;border:1px solid var(--color-border);border-radius:var(--radius-button);background:var(--color-surface);">' +
        '<div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:8px;">' + (eli + 1) + '. ' + ec.check + '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
          '<div style="padding:8px 12px;background:#FEF2F2;border:1px solid #FCA5A5;border-radius:6px;">' +
            '<div style="font-size:10px;font-weight:700;color:#B91C1C;margin-bottom:3px;">NO &#x2715;</div>' +
            '<div style="font-size:11px;color:#475569;">' + ec.noResult + '</div>' +
          '</div>' +
          '<div style="padding:8px 12px;background:#F0FDF4;border:1px solid #86EFAC;border-radius:6px;">' +
            '<div style="font-size:10px;font-weight:700;color:#15803D;margin-bottom:3px;">YES &#x2713;</div>' +
            '<div style="font-size:11px;color:#475569;">' + ec.yesResult + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }
  eligHtml += '</div></div>';

  el.innerHTML = happyHtml + errHtml + eligHtml;
}

/* =============================================================
   5. PROTOTYPE TAB — smeRenderPrototype()
   ============================================================= */
function smeRenderPrototype() {
  var el = document.getElementById('sme-prototype-content');
  if (!el || !SME_SIP_SCENARIOS) return;

  /* Flat list of all scenarios with short labels */
  window._smeProtoGroups = [
    { id:'happy', label:'\u2705 Happy Path', color:'#15803D',
      items:[
        {key:'tpp-checkout',short:'1. Noon Checkout'},
        {key:'tpp-redirect',short:'2. Redirect to ADCB'},
        {key:'login',short:'3. Login'},
        {key:'consent-details',short:'4. Consent'},
        {key:'account-select',short:'5. Select Account'},
        {key:'account-selected',short:'6. Confirm'},
        {key:'pin',short:'7. PIN / EFR'},
        {key:'redirect',short:'8. Redirect back'}
      ]},
    { id:'variants', label:'\uD83D\uDD04 Account Variants', color:'#D97706',
      items:[
        {key:'login',short:'1. Login'},
        {key:'consent-details',short:'2. Consent'},
        {key:'one-account',short:'\u2794 1 Account'},
        {key:'two-accounts',short:'\u2794 2 Accounts'},
        {key:'tpp-selected',short:'\u2794 TPP Pre-selected'}
      ]},
    { id:'errors', label:'\u274C Error Screens', color:'#E31E24',
      items:[
        {key:'login',short:'1. Login'},
        {key:'identify-superuser',short:'2. Eligibility'},
        {key:'access-restricted',short:'\u2794 Access Restricted'},
        {key:'no-accounts',short:'\u2794 No Accounts'},
        {key:'auth-expired',short:'\u2794 Auth Expired'},
        {key:'unsuccessful',short:'\u2794 PIN Failed (3x)'}
      ]},
    { id:'other', label:'\u2699 Other Flows', color:'#475569',
      items:[
        {key:'tpp-redirect-to-app',short:'0. TPP Deep Link'},
        {key:'login',short:'1. Login'},
        {key:'cancel-consent',short:'\u2794 Cancel'},
        {key:'confirm-payment',short:'\u2794 Confirm Payment'},
        {key:'payment-execution',short:'\u2794 Payment Exec'},
        {key:'timeout-error',short:'Timeout Error'}
      ]}
  ];

  /* Dropdown + steps bar */
  var pickerHtml = '<div class="sme-proto-picker">' +
    '<select class="sme-proto-select" id="sme-proto-select" onchange="smeOnCategoryChange(this.value)">';
  for (var gi = 0; gi < window._smeProtoGroups.length; gi++) {
    var g = window._smeProtoGroups[gi];
    pickerHtml += '<option value="' + g.id + '">' + g.label + ' (' + g.items.length + ')</option>';
  }
  pickerHtml += '</select>' +
    '<div class="sme-proto-steps" id="sme-proto-steps"></div>' +
  '</div>';

  /* Context description bar */
  var descHtml = '<div id="sme-scenario-desc" style="padding:10px 14px;background:var(--color-surface-secondary);border:1px solid var(--color-border);border-radius:var(--radius-button);margin-bottom:14px;font-size:12px;color:var(--color-text-secondary);line-height:1.6;display:none;"></div>';

  /* Phone + Dev panel side by side */
  var mainHtml =
    descHtml +
    '<div class="sme-prototype-main">' +
      '<div class="sme-phone-wrap">' +
        '<div class="sme-phone-frame">' +
          '<div class="sme-phone-notch"></div>' +
          '<div class="sme-phone-screen" id="sme-phone-screen"></div>' +
        '</div>' +
      '</div>' +
      '<div class="sme-dev-panel" id="sme-dev-panel">' +
        '<div class="sme-dev-panel-header">' +
          '<span class="sme-dev-panel-dot" style="background:#F85149"></span>' +
          '<span class="sme-dev-panel-dot" style="background:#E3B341"></span>' +
          '<span class="sme-dev-panel-dot" style="background:#56D364"></span>' +
          '<span id="sme-dev-panel-title" style="margin-left:8px">API Calls</span>' +
        '</div>' +
        '<div class="sme-dev-panel-body" id="sme-dev-panel-body"></div>' +
      '</div>' +
    '</div>';

  el.innerHTML = pickerHtml + mainHtml;
  smeOnCategoryChange('happy');
}

function smeOnCategoryChange(catId) {
  var grp = null;
  for (var i = 0; i < window._smeProtoGroups.length; i++) {
    if (window._smeProtoGroups[i].id === catId) { grp = window._smeProtoGroups[i]; break; }
  }
  if (!grp) return;

  var stepsEl = document.getElementById('sme-proto-steps');
  if (!stepsEl) return;

  var html = '';
  for (var j = 0; j < grp.items.length; j++) {
    var item = grp.items[j];
    html += '<button class="sme-proto-step-btn' + (j === 0 ? ' active' : '') + '" ' +
      'id="sme-sbtn-' + item.key + '" ' +
      'onclick="smeShowScenario(\'' + item.key + '\',this)" ' +
      'style="--step-color:' + grp.color + '">' +
      item.short +
    '</button>';
  }
  stepsEl.innerHTML = html;

  /* Auto-select first */
  var firstKey = grp.items[0].key;
  smeShowScenario(firstKey, document.getElementById('sme-sbtn-' + firstKey));
}

function smeShowScenario(name, btn) {
  var data = SME_SIP_SCENARIOS[name];
  if (!data) return;
  smeCurrentScenario = name;

  var phoneEl = document.getElementById('sme-phone-screen');
  if (phoneEl) phoneEl.innerHTML = data.screenHtml;

  var devEl = document.getElementById('sme-dev-panel-body');
  if (devEl) devEl.innerHTML = data.apisHtml;

  var descEl = document.getElementById('sme-scenario-desc');
  if (descEl) {
    if (data.desc) {
      descEl.innerHTML = data.desc;
      descEl.style.display = 'block';
    } else {
      descEl.style.display = 'none';
    }
  }

  var titleEl = document.getElementById('sme-dev-panel-title');
  if (titleEl) titleEl.textContent = data.title;

  var allChips = document.querySelectorAll('.sme-proto-step-btn');
  for (var i = 0; i < allChips.length; i++) allChips[i].classList.remove('active');
  if (btn) {
    btn.classList.add('active');
  } else {
    var found = document.getElementById('sme-sbtn-' + name);
    if (found) found.classList.add('active');
  }
}

/* =============================================================
   6. ACCEPTANCE CRITERIA TAB — smeRenderAcceptance()
   ============================================================= */
function smeRenderAcceptance() {
  var el = document.getElementById('sme-acceptance-content');
  if (!el || !SME_SIP_ACS) return;

  var html = '';
  for (var si = 0; si < SME_SIP_ACS.length; si++) {
    var story = SME_SIP_ACS[si];
    var acCount = story.acs.length;

    var bodyHtml = '';
    if (story.prereq) {
      bodyHtml +=
        '<div style="padding:10px 16px;background:#F0F4F8;border-bottom:1px solid var(--color-border);font-size:12px;color:var(--color-text-secondary);">' +
          '<strong style="color:var(--navy);">Prerequisite:</strong> ' + story.prereq +
        '</div>';
    }
    bodyHtml += '<div class="sme-ac-grid">';
    for (var ai = 0; ai < story.acs.length; ai++) {
      var ac = story.acs[ai];
      bodyHtml += '<div class="sme-ac-card">' +
        '<div class="sme-ac-card-header">' +
          '<span class="sme-ac-id">' + ac.id + '</span>' +
          '<span class="sme-ac-title">' + ac.title + '</span>' +
        '</div>' +
        '<div class="sme-ac-gwt">';

      /* Given */
      if (ac.given && ac.given.length) {
        bodyHtml += '<div class="sme-gwt-row sme-gwt-given">' +
          '<span class="sme-gwt-key">Given</span>' +
          '<ul class="sme-gwt-list">';
        for (var gi = 0; gi < ac.given.length; gi++) {
          bodyHtml += '<li>' + ac.given[gi] + '</li>';
        }
        bodyHtml += '</ul></div>';
      }
      /* When */
      if (ac.when && ac.when.length) {
        bodyHtml += '<div class="sme-gwt-row sme-gwt-when">' +
          '<span class="sme-gwt-key">When</span>' +
          '<ul class="sme-gwt-list">';
        for (var wi = 0; wi < ac.when.length; wi++) {
          bodyHtml += '<li>' + ac.when[wi] + '</li>';
        }
        bodyHtml += '</ul></div>';
      }
      /* Then */
      if (ac.then && ac.then.length) {
        bodyHtml += '<div class="sme-gwt-row sme-gwt-then">' +
          '<span class="sme-gwt-key">Then</span>' +
          '<ul class="sme-gwt-list">';
        for (var ti = 0; ti < ac.then.length; ti++) {
          bodyHtml += '<li>' + ac.then[ti] + '</li>';
        }
        bodyHtml += '</ul></div>';
      }

      bodyHtml += '</div></div>';
    }
    bodyHtml += '</div>';

    html += smeMakeCollapsible(
      'ac-' + story.id,
      story.id + ' &mdash; ' + story.title + ' <span style="font-size:11px;font-weight:400;color:var(--color-text-secondary);margin-left:6px;">(' + acCount + ' ACs)</span>',
      bodyHtml,
      false
    );
  }

  el.innerHTML = html;
}

/* =============================================================
   7. ARCHITECTURE TAB — smeRenderArchitecture()
   ============================================================= */
function smeRenderArchitecture() {
  var el = document.getElementById('sme-architecture-content');
  if (!el || !SME_SIP_ARCH) return;

  /* Systems row */
  var systemsHtml = '<div class="sme-arch-row">';
  for (var si = 0; si < SME_SIP_ARCH.systems.length; si++) {
    var sys = SME_SIP_ARCH.systems[si];
    var isLast = si === SME_SIP_ARCH.systems.length - 1;
    systemsHtml +=
      '<div class="sme-arch-box ' + sys.cssClass + '">' +
        '<div class="sme-arch-box-name">' + sys.name + '</div>' +
        '<div class="sme-arch-box-sub">' + sys.subtitle + '</div>' +
        '<ul class="sme-arch-box-list">';
    for (var di = 0; di < sys.details.length; di++) {
      systemsHtml += '<li>' + sys.details[di] + '</li>';
    }
    systemsHtml += '</ul></div>';
    if (!isLast) systemsHtml += '<div class="sme-arch-arr">&#x2192;</div>';
  }
  systemsHtml += '</div>';

  /* Sequence table */
  var seqHtml =
    '<table style="width:100%;border-collapse:collapse;margin-bottom:var(--space-section-gap);">' +
      '<thead><tr>' +
        '<th style="background:var(--navy);color:#fff;padding:9px 12px;text-align:left;font-size:11px;width:40px;">#</th>' +
        '<th style="background:var(--navy);color:#fff;padding:9px 12px;text-align:left;font-size:11px;width:80px;">From</th>' +
        '<th style="background:var(--navy);color:#fff;padding:9px 12px;text-align:left;font-size:11px;width:80px;">To</th>' +
        '<th style="background:var(--navy);color:#fff;padding:9px 12px;text-align:left;font-size:11px;">Action</th>' +
        '<th style="background:var(--navy);color:#fff;padding:9px 12px;text-align:left;font-size:11px;">Protocol</th>' +
      '</tr></thead><tbody>';
  for (var qi = 0; qi < SME_SIP_ARCH.sequence.length; qi++) {
    var ph = SME_SIP_ARCH.sequence[qi];
    seqHtml +=
      '<tr style="' + (qi % 2 === 1 ? 'background:var(--color-surface-secondary)' : '') + '">' +
        '<td style="padding:9px 12px;font-weight:700;color:var(--navy);font-size:13px;">' + ph.phase + '</td>' +
        '<td style="padding:9px 12px;font-size:12px;font-weight:600;color:var(--color-text-primary);">' + ph.from + '</td>' +
        '<td style="padding:9px 12px;font-size:12px;font-weight:600;color:var(--color-text-primary);">' + ph.to + '</td>' +
        '<td style="padding:9px 12px;font-size:13px;color:var(--color-text-secondary);">' + ph.action + '</td>' +
        '<td style="padding:9px 12px;font-size:11px;font-family:var(--font-family-mono);color:#0F766E;">' + ph.protocol + '</td>' +
      '</tr>';
  }
  seqHtml += '</tbody></table>';

  /* Security + Components cards side by side */
  var secHtml = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">';

  secHtml += '<div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-card);overflow:hidden;">' +
    '<div style="background:var(--navy);color:#fff;padding:10px 16px;font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;">Security Requirements</div>' +
    '<div style="padding:14px 16px;">';
  for (var sec = 0; sec < SME_SIP_ARCH.security.length; sec++) {
    var s = SME_SIP_ARCH.security[sec];
    secHtml +=
      '<div style="display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--color-border);">' +
        '<span style="font-size:10px;font-weight:700;background:#1C2B4A;color:#fff;padding:2px 8px;border-radius:4px;flex-shrink:0;margin-top:2px;">' + s.tag + '</span>' +
        '<span style="font-size:13px;color:var(--color-text-secondary);line-height:1.5;">' + s.desc + '</span>' +
      '</div>';
  }
  secHtml += '</div></div>';

  secHtml += '<div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-card);overflow:hidden;">' +
    '<div style="background:#0F766E;color:#fff;padding:10px 16px;font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;">Platform Components</div>' +
    '<div style="padding:14px 16px;">';
  for (var ci = 0; ci < SME_SIP_ARCH.components.length; ci++) {
    var comp = SME_SIP_ARCH.components[ci];
    secHtml +=
      '<div style="padding:8px 0;border-bottom:1px solid var(--color-border);">' +
        '<div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:3px;">' + comp.name + '</div>' +
        '<div style="font-size:12px;color:var(--color-text-secondary);line-height:1.5;">' + comp.desc + '</div>' +
      '</div>';
  }
  secHtml += '</div></div>';

  secHtml += '</div>';

  /* ── Glossary ── */
  var glossaryHtml = '';
  if (SME_SIP_ARCH.glossary && SME_SIP_ARCH.glossary.length) {
    glossaryHtml =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
    for (var gli = 0; gli < SME_SIP_ARCH.glossary.length; gli++) {
      var g = SME_SIP_ARCH.glossary[gli];
      glossaryHtml +=
        '<div style="padding:12px 14px;background:var(--color-surface);border:1px solid var(--color-border);border-left:3px solid var(--teal);border-radius:0 var(--radius-button) var(--radius-button) 0;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
            '<span style="font-size:12px;font-weight:800;color:var(--navy);font-family:var(--font-family-mono);">' + g.term + '</span>' +
            '<span style="font-size:10px;color:var(--color-text-tertiary);">' + g.full + '</span>' +
          '</div>' +
          '<div style="font-size:12px;color:var(--color-text-secondary);line-height:1.6;">' + g.plain + '</div>' +
        '</div>';
    }
    glossaryHtml += '</div>';
  }

  el.innerHTML =
    smeMakeCollapsible('arch-glossary', '&#x1F4D6; Jargon Buster — Technical Terms in Plain English (' + (SME_SIP_ARCH.glossary ? SME_SIP_ARCH.glossary.length : 0) + ' terms)', glossaryHtml, true) +
    smeMakeCollapsible('arch-systems', 'System Interaction Overview', systemsHtml, false) +
    smeMakeCollapsible('arch-sequence', 'End-to-End Sequence (' + SME_SIP_ARCH.sequence.length + ' phases)', seqHtml, false) +
    smeMakeCollapsible('arch-security', 'Security &amp; Platform', secHtml, false);
}

/* =============================================================
   8. APIS TAB — smeRenderApis()
   ============================================================= */
function smeRenderApis() {
  var el = document.getElementById('sme-apis-content');
  if (!el || !SME_SIP_APIS) return;

  /* Required headers banner */
  var headersBanner =
    '<div style="background:#0D1117;border:1px solid #30363D;border-radius:var(--radius-button);padding:14px 18px;margin-bottom:var(--space-section-gap);">' +
      '<div style="font-size:11px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px;">Required Headers — All Endpoints</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;">' +
        '<code style="background:#161B22;color:#7EE787;padding:4px 10px;border-radius:4px;font-size:11px;font-family:var(--font-family-mono);">Authorization: Bearer {token}</code>' +
        '<code style="background:#161B22;color:#7EE787;padding:4px 10px;border-radius:4px;font-size:11px;font-family:var(--font-family-mono);">x-fapi-interaction-id</code>' +
        '<code style="background:#161B22;color:#7EE787;padding:4px 10px;border-radius:4px;font-size:11px;font-family:var(--font-family-mono);">x-fapi-auth-date</code>' +
        '<code style="background:#161B22;color:#7EE787;padding:4px 10px;border-radius:4px;font-size:11px;font-family:var(--font-family-mono);">Content-Type: application/json</code>' +
      '</div>' +
    '</div>';

  var html = headersBanner;

  for (var ai = 0; ai < SME_SIP_APIS.length; ai++) {
    var api = SME_SIP_APIS[ai];
    var badgeClass = api.method === 'GET' ? 'sme-badge-get' :
                     api.method === 'POST' ? 'sme-badge-post' :
                     api.method === 'PATCH' ? 'sme-badge-patch' : 'sme-badge-oauth';

    var apiBodyHtml =
      '<div style="padding:16px;">' +
        '<p style="font-size:13px;color:var(--color-text-secondary);margin-bottom:14px;line-height:1.6;">' + api.desc + '</p>' +
        '<div style="margin-bottom:12px;">' +
          '<div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Request</div>' +
          api.requestHtml +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
          '<div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Response</div>' +
          api.responseHtml +
        '</div>' +
        (api.errorsHtml ?
          '<div>' +
            '<div style="font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Errors</div>' +
            api.errorsHtml +
          '</div>' : '') +
      '</div>';

    var collapsibleTitle =
      '<div style="display:flex;align-items:center;gap:8px;flex:1;">' +
        '<span class="sme-api-badge ' + badgeClass + '">' + api.method + '</span>' +
        '<code style="font-family:var(--font-family-mono);font-size:13px;color:var(--navy);">' + api.path + '</code>' +
      '</div>';

    html += smeMakeCollapsible('api-' + api.id, collapsibleTitle, apiBodyHtml, false);
  }

  el.innerHTML = html;
}

/* =============================================================
   9. GAPS TAB — smeRenderGaps()
   ============================================================= */
function smeRenderGaps() {
  var el = document.getElementById('sme-gaps-content');
  if (!el || !SME_SIP_GAPS) return;

  /* Resolved banner */
  var resolvedBanner = '';
  if (SME_SIP_GAPS.resolved && SME_SIP_GAPS.resolved.length) {
    resolvedBanner =
      '<div style="background:#F0FDF4;border:1px solid #A8D5BF;border-radius:var(--radius-card);padding:12px 16px;margin-bottom:var(--space-section-gap);font-size:12px;">' +
        '<strong style="color:#15803D;">Resolved by DOF-2828 (v2.1 alignment):</strong> ';
    resolvedBanner += SME_SIP_GAPS.resolved.join(' &middot; ');
    resolvedBanner += '</div>';
  }
  var sections = [
    {
      key: 'critical',
      label: 'Critical Gaps',
      sublabel: 'Must resolve before sprint sign-off',
      borderColor: '#E31E24',
      bgColor: '#FEF2F2',
      badgeStyle: 'background:#FEE2E2;color:#991B1B;',
      count: SME_SIP_GAPS.critical.length,
      template: function(g) {
        return '<div class="sme-gap-item" style="border-left:3px solid #E31E24;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
            '<span style="font-family:var(--font-family-mono);font-size:11px;font-weight:800;color:#E31E24;">' + g.id + '</span>' +
            '<span style="padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;background:#FEE2E2;color:#991B1B;">Critical</span>' +
            '<span style="font-size:12px;font-weight:600;color:var(--color-text-secondary);">' + g.story + '</span>' +
          '</div>' +
          '<div style="font-size:13px;font-weight:700;color:var(--color-text-primary);margin-bottom:6px;">' + g.issue + '</div>' +
          '<div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:8px;line-height:1.6;">' + g.why + '</div>' +
          '<div style="background:#FFF1F2;border:1px solid #FECACA;border-radius:6px;padding:8px 12px;">' +
            '<span style="font-size:10px;font-weight:700;color:#B91C1C;margin-right:4px;">QUESTION:</span>' +
            '<span style="font-size:12px;color:#475569;">' + g.question + '</span>' +
          '</div>' +
        '</div>';
      }
    },
    {
      key: 'medium',
      label: 'Medium Gaps',
      sublabel: 'Should be resolved before QA sign-off',
      borderColor: '#D97706',
      count: SME_SIP_GAPS.medium.length,
      template: function(g) {
        return '<div class="sme-gap-item" style="border-left:3px solid #D97706;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
            '<span style="font-family:var(--font-family-mono);font-size:11px;font-weight:800;color:#D97706;">' + g.id + '</span>' +
            '<span style="padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;background:#FEF3C7;color:#92400E;">Medium</span>' +
            '<span style="font-size:12px;font-weight:600;color:var(--color-text-secondary);">' + g.story + '</span>' +
          '</div>' +
          '<div style="font-size:13px;font-weight:600;color:var(--color-text-primary);margin-bottom:6px;">' + g.issue + '</div>' +
          '<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;padding:8px 12px;">' +
            '<span style="font-size:10px;font-weight:700;color:#92400E;margin-right:4px;">QUESTION:</span>' +
            '<span style="font-size:12px;color:#475569;">' + g.question + '</span>' +
          '</div>' +
        '</div>';
      }
    },
    {
      key: 'compliance',
      label: 'Compliance Observations',
      sublabel: 'CBUAE standards alignment',
      borderColor: '#1E40AF',
      count: SME_SIP_GAPS.compliance.length,
      template: function(g) {
        return '<div class="sme-gap-item" style="border-left:3px solid #1E40AF;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
            '<span style="font-family:var(--font-family-mono);font-size:11px;font-weight:800;color:#1E40AF;">' + g.id + '</span>' +
            '<span style="padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;background:#DBEAFE;color:#1E40AF;">Compliance</span>' +
            '<span style="font-size:12px;font-weight:600;color:var(--color-text-secondary);">' + g.area + '</span>' +
          '</div>' +
          '<div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:6px;line-height:1.6;">' + g.observation + '</div>' +
          '<div style="font-size:11px;color:#1E40AF;font-weight:600;">Ref: ' + g.reference + '</div>' +
        '</div>';
      }
    },
    {
      key: 'missing',
      label: 'Missing Stories',
      sublabel: 'Stories and ACs not yet created',
      borderColor: '#64748B',
      count: SME_SIP_GAPS.missing.length,
      template: function(g) {
        return '<div class="sme-gap-item" style="border-left:3px solid #64748B;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
            '<span style="font-family:var(--font-family-mono);font-size:11px;font-weight:800;color:#64748B;">' + g.id + '</span>' +
            '<span style="padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;background:#F1F5F9;color:#475569;">Missing</span>' +
          '</div>' +
          '<div style="font-size:13px;font-weight:700;color:var(--color-text-primary);margin-bottom:6px;">' + g.gap + '</div>' +
          '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:8px 12px;">' +
            '<span style="font-size:10px;font-weight:700;color:#64748B;margin-right:4px;">ACTION:</span>' +
            '<span style="font-size:12px;color:#475569;">' + g.action + '</span>' +
          '</div>' +
        '</div>';
      }
    }
  ];

  var html = '';
  for (var si = 0; si < sections.length; si++) {
    var sec = sections[si];
    var items = SME_SIP_GAPS[sec.key];
    var cardHtml =
      '<div class="sme-gap-card" style="border-left:4px solid ' + sec.borderColor + ';">' +
        '<div class="sme-gap-card-header" style="border-left:none;">' +
          '<div>' +
            '<div style="font-size:14px;font-weight:700;color:var(--color-text-primary);">' + sec.label + '</div>' +
            '<div style="font-size:12px;color:var(--color-text-secondary);margin-top:2px;">' + sec.sublabel + '</div>' +
          '</div>' +
          '<span style="padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;background:' + sec.borderColor + ';color:#fff;">' + sec.count + '</span>' +
        '</div>' +
        '<div style="padding:0 16px 16px;">';
    for (var ii = 0; ii < items.length; ii++) {
      cardHtml += sec.template(items[ii]);
    }
    cardHtml += '</div></div>';
    html += cardHtml;
  }

  el.innerHTML = resolvedBanner + html;
}

/* =============================================================
   10. MASTER INIT — smeSipInit()
   ============================================================= */
function smeSipInit() {
  smeRenderOverview();
  smeRenderFlow();
  smeRenderPrototype();
  smeRenderAcceptance();
  smeRenderArchitecture();
  smeRenderApis();
  smeRenderGaps();
  smeGoTab('overview');
}
