/* ============================================================
   ADCB Open Finance — UI Components
   Render functions and interactive handlers
   ============================================================ */

/* ── RENDER STEPS ── */
function renderSteps(containerId, steps) {
  var el = document.getElementById(containerId);
  el.innerHTML = '';
  steps.forEach(function(s, i) {
    var item = document.createElement('div');
    item.className = 'step-item';
    item.style.borderLeftColor = s.color;
    item.innerHTML =
      '<div class="step-head" onclick="toggleStep(this)">' +
        '<div class="step-num" style="background:' + s.color + '">' + (i+1) + '</div>' +
        '<div class="step-title">' + s.label + '</div>' +
        '<span class="step-chevron">&#x25B6;</span>' +
      '</div>' +
      '<div class="step-body">' +
        '<p class="step-desc">' + s.detail + '</p>' +
        '<div class="pills">' + s.pills.map(function(p){ return '<span class="pill">' + p + '</span>'; }).join('') + '</div>' +
      '</div>';
    el.appendChild(item);
  });
}

function toggleStep(head) {
  head.parentElement.classList.toggle('open');
}

/* ── TAB SWITCHING ── */
function switchTab(name, btn) {
  navigate('overview', 'tab-' + name);
}

function switchLfiTab(name, btn) {
  navigate('lfi', 'tab-' + name);
}

/* ── PLAYER CARDS ── */
var PLAYER_KEYS = ['user', 'tpp', 'hub', 'lfi'];

function togglePlayer(key) {
  var card = document.getElementById('card-' + key);
  var detail = document.getElementById('detail-' + key);
  var isOpen = card.classList.contains('active');
  PLAYER_KEYS.forEach(function(k) {
    var c = document.getElementById('card-' + k);
    var d = document.getElementById('detail-' + k);
    if (c) c.classList.remove('active');
    if (d) d.classList.remove('visible');
    var h = document.getElementById('hint-' + k);
    if (h) h.textContent = 'tap to expand';
  });
  if (!isOpen) {
    card.classList.add('active');
    detail.classList.add('visible');
    document.getElementById('hint-' + key).textContent = 'tap to close';
  }
}

function closePlayer(key) {
  var c = document.getElementById('card-' + key);
  var d = document.getElementById('detail-' + key);
  var h = document.getElementById('hint-' + key);
  if (c) c.classList.remove('active');
  if (d) d.classList.remove('visible');
  if (h) h.textContent = 'tap to expand';
}

/* ── PAYMENT STATUS ── */
function showStatus(key, el) {
  document.querySelectorAll('.status-box').forEach(function(b){ b.classList.remove('selected'); });
  el.classList.add('selected');
  document.getElementById('status-info').textContent = STATUS_INFO[key];
}
