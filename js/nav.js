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
  var names = { overview: 'General Overview', consent: 'Consent & Scheduler', lfi: 'LFI Project' };
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

    // Highlight sidebar sub-item
    var navItem = document.getElementById('nav-' + lfiTabName);
    if (navItem) navItem.classList.add('active');
  }

  // Handle anchors for consent section
  if (section === 'consent' && anchor) {
    setTimeout(function() {
      var el = document.getElementById(anchor);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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
