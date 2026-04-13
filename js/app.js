/* ============================================================
   ADCB Open Finance — App Init
   Bootstrap: render content, wire routing, load initial route
   ============================================================ */

// Render dynamic step accordions
renderSteps('data-steps', DATA_STEPS);
renderSteps('sip-steps', SIP_STEPS);

// Initialize CMI progress
if (typeof cmiUpdateProgress === 'function') cmiUpdateProgress();

// Wire up hash-based routing
window.addEventListener('hashchange', function() {
  var route = parseHash();
  navigateToRoute(route.section, route.anchor);
});

// Route from URL hash on page load
(function() {
  var route = parseHash();
  if (route.section !== 'overview' || route.anchor) {
    navigateToRoute(route.section, route.anchor);
  }
  if (!window.location.hash) {
    history.replaceState(null, '', '#/overview');
  }
})();
