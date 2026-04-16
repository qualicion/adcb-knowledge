/* ============================================================
   ADCB Open Finance — Navigation
   Sidebar toggle, section switching, breadcrumb updates
   ============================================================ */

/* ── TOGGLE NAV SECTIONS ── */
function toggleNav(section) {
  var parent = document.getElementById('nav-' + section);
  var sub = document.getElementById('sub-' + section);
  var isExpanded = parent.classList.contains('expanded');

  if (isExpanded) {
    parent.classList.remove('expanded');
    sub.classList.remove('open');
  } else {
    parent.classList.add('expanded');
    sub.classList.add('open');
    navigate(section);
  }
}

/* ── NAVIGATION ── */
function navigate(section, anchor) {
  var newHash = buildHash(section, anchor);
  if (window.location.hash !== newHash) {
    history.pushState(null, '', newHash);
  }
  navigateToRoute(section, anchor);
}

function navigateToRoute(section, anchor) {
  // Switch sections
  document.querySelectorAll('.section').forEach(function(s){ s.classList.remove('active'); });
  var sectionEl = document.getElementById('section-' + section);
  if (!sectionEl) { section = 'overview'; sectionEl = document.getElementById('section-overview'); }
  sectionEl.classList.add('active');

  // Update nav
  document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
  document.getElementById('nav-' + section).classList.add('active');

  // Auto-expand the relevant sub-nav
  var parent = document.getElementById('nav-' + section);
  var sub = document.getElementById('sub-' + section);
  if (parent && sub) {
    parent.classList.add('expanded');
    sub.classList.add('open');
  }

  // Update breadcrumb
  var names = { overview: 'General Overview', consent: 'Consent & Scheduler', lfi: 'LFI Project', smesip: 'Single Instant Payment (SME)', sipcop: 'Single Instant Payment', cmi: 'CMI Dashboard' };
  document.getElementById('bc-current').textContent = names[section] || section;

  // Handle tab activation for overview
  if (section === 'overview' && anchor) {
    var tabName = anchor.replace('tab-', '');
    document.querySelectorAll('#section-overview .tab-btn').forEach(function(b) {
      b.classList.remove('active');
      if (b.getAttribute('data-tab') === tabName) {
        b.classList.add('active');
      }
    });
    document.querySelectorAll('#section-overview .tab-panel').forEach(function(p){ p.classList.remove('active'); });
    var panelMap = { players:'panel-players', data:'panel-data', sip:'panel-sip', compare:'panel-compare', status:'panel-status' };
    var panel = document.getElementById(panelMap[tabName]);
    if (panel) panel.classList.add('active');
  }

  // Handle tab activation for consent
  if (section === 'consent' && anchor) {
    var conTabName = anchor.replace('tab-', '');
    document.querySelectorAll('#section-consent .tab-btn').forEach(function(b) {
      b.classList.remove('active');
      if (b.getAttribute('data-tab') === conTabName) {
        b.classList.add('active');
      }
    });
    document.querySelectorAll('#section-consent .tab-panel').forEach(function(p){ p.classList.remove('active'); });
    var conPanel = document.getElementById('panel-' + conTabName);
    if (conPanel) conPanel.classList.add('active');

    var conNavItem = document.getElementById('nav-' + conTabName);
    if (conNavItem) conNavItem.classList.add('active');
  }

  // Handle tab activation for LFI
  if (section === 'lfi' && anchor) {
    var lfiTabName = anchor.replace('tab-', '');
    document.querySelectorAll('#section-lfi .tab-btn').forEach(function(b) {
      b.classList.remove('active');
      if (b.getAttribute('data-tab') === lfiTabName) {
        b.classList.add('active');
      }
    });
    document.querySelectorAll('#section-lfi .tab-panel').forEach(function(p){ p.classList.remove('active'); });
    var lfiPanel = document.getElementById('panel-' + lfiTabName);
    if (lfiPanel) lfiPanel.classList.add('active');

    var lfiNavItem = document.getElementById('nav-' + lfiTabName);
    if (lfiNavItem) lfiNavItem.classList.add('active');
  }

  // Handle SME SIP Portal navigation
  if (section === 'smesip') {
    if (typeof smeSipInit === 'function' && !window._smeSipInitDone) {
      smeSipInit();
      window._smeSipInitDone = true;
    }
    if (anchor) {
      var smeTabName = anchor.replace('tab-smesip-', '');
      if (typeof smeGoTab === 'function') smeGoTab(smeTabName);
      var smeNavItem = document.getElementById('nav-smesip-' + smeTabName);
      if (smeNavItem) smeNavItem.classList.add('active');
    } else {
      if (typeof smeGoTab === 'function') smeGoTab('overview');
      var smeOverviewNav = document.getElementById('nav-smesip-overview');
      if (smeOverviewNav) smeOverviewNav.classList.add('active');
    }
  }

  // Handle SIP CoP Flow navigation
  if (section === 'sipcop') {
    // Initialize SIP CoP content on first visit
    if (typeof sipCopInit === 'function' && !window._sipCopInitDone) {
      sipCopInit();
      window._sipCopInitDone = true;
    }
    if (anchor) {
      var sipTabName = anchor.replace('tab-sipcop-', '');
      if (typeof sipGoTab === 'function') sipGoTab(sipTabName);
      var sipNavItem = document.getElementById('nav-sipcop-' + sipTabName);
      if (sipNavItem) sipNavItem.classList.add('active');
    } else {
      // Default to flow tab
      if (typeof sipGoTab === 'function') sipGoTab('flow');
      var sipFlowNav = document.getElementById('nav-sipcop-flow');
      if (sipFlowNav) sipFlowNav.classList.add('active');
    }
  }

  // Handle CMI Dashboard navigation
  if (section === 'cmi') {
    // Reset all CMI pages to hidden
    document.querySelectorAll('.cmi-page').forEach(function(p){ p.classList.remove('active'); });
    document.querySelectorAll('.cmi-nav-item').forEach(function(n){ n.classList.remove('active'); });

    if (anchor) {
      var cmiTabName = anchor.replace('tab-', '');
      // Check if it's a screen page or the overview
      if (cmiTabName === 'cmi-overview') {
        document.getElementById('cmi-page-overview').classList.add('active');
        var cmiNavItem = document.getElementById('nav-cmi-overview');
        if (cmiNavItem) cmiNavItem.classList.add('active');
      } else {
        // It's a screen like cmi-cmi01, cmi-cmi02, etc.
        var screenId = cmiTabName.replace('cmi-', '');
        cmiRenderPage(screenId);
        var screenPage = document.getElementById('cmi-page-' + screenId);
        if (screenPage) screenPage.classList.add('active');
        var cmiScreenNav = document.getElementById('nav-' + cmiTabName);
        if (cmiScreenNav) cmiScreenNav.classList.add('active');
      }
    } else {
      // Default to overview
      document.getElementById('cmi-page-overview').classList.add('active');
      var cmiOverviewNav = document.getElementById('nav-cmi-overview');
      if (cmiOverviewNav) cmiOverviewNav.classList.add('active');
    }
  }

  closeSidebar();
  window.scrollTo(0, 0);
}

/* ── SIDEBAR MOBILE ── */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}
