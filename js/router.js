/* ============================================================
   ADCB Open Finance — Hash Router
   Pure functions for URL hash routing (no side effects)
   ============================================================ */

/* Readable URL slugs ↔ internal IDs */
var SLUG_TO_ID = {
  'the-players': 'players', 'data-sharing': 'data', 'sip-payment': 'sip',
  'side-by-side': 'compare', 'payment-status': 'status',
  'system-map': 'system', 'consent-lifecycle': 'lifecycle',
  'data-scheduler': 'scheduler', 'error-scenarios': 'errors'
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
    if (section === 'overview') {
      anchor = 'tab-' + id;
    } else if (section === 'consent') {
      anchor = 'part-' + id;
    }
  }

  return { section: section, anchor: anchor };
}
