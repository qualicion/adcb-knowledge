/* ============================================================
   ADCB Open Finance — Hash Router
   Pure functions for URL hash routing (no side effects)
   ============================================================ */

/* Readable URL slugs ↔ internal IDs */
var SLUG_TO_ID = {
  'the-players': 'players', 'data-sharing': 'data', 'sip-payment': 'sip',
  'side-by-side': 'compare', 'payment-status': 'status',
  'system-map': 'con-system', 'consent-lifecycle': 'con-lifecycle',
  'data-scheduler': 'con-scheduler', 'error-scenarios': 'con-errors', 'testing': 'con-testing',
  'liability-fines': 'lfi-fines', 'how-it-works': 'lfi-how',
  'gap-analysis': 'lfi-gaps', 'test-strategy': 'lfi-tests',
  'overview': 'cmi-overview',
  'current-consents': 'cmi-cmi01', 'consent-history': 'cmi-cmi02',
  'filter-search': 'cmi-cmi03', 'consent-detail': 'cmi-cmi04',
  'get-consents': 'cmi-cmi05', 'get-consent-detail': 'cmi-cmi06',
  'delete-consent': 'cmi-cmi07', 'get-payments': 'cmi-cmi08',
  'payment-flow': 'sipcop-flow', 'cop-deep-dive': 'sipcop-cop-detail',
  'user-stories': 'sipcop-stories', 'sip-prototype': 'sipcop-prototype',
  'rst-scenarios': 'sipcop-rst', 'design-gaps': 'sipcop-gaps'
};
var ID_TO_SLUG = {};
for (var slug in SLUG_TO_ID) { ID_TO_SLUG[SLUG_TO_ID[slug]] = slug; }

function buildHash(section, anchor) {
  var path = '#/' + section;
  if (anchor) {
    var id = anchor.replace(/^tab-/, '').replace(/^part-/, '');
    path += '/' + (ID_TO_SLUG[id] || id);
  }
  return path;
}

function parseHash() {
  var hash = window.location.hash || '';
  var parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts.length === 0) return { section: 'overview', anchor: null };

  var section = parts[0];
  var slug = parts[1] || null;
  var anchor = null;

  if (slug) {
    var id = SLUG_TO_ID[slug] || slug;
    if (section === 'overview' || section === 'consent' || section === 'lfi' || section === 'cmi' || section === 'sipcop') {
      anchor = 'tab-' + id;
    }
  }

  return { section: section, anchor: anchor };
}
