/* ==========================================================================
   common.js — Unified Shared Script for matt-learning
   Handles: Header/Footer/Popover injection, Font Scaling (localStorage),
            KaTeX Auto-Render, Anchored Glossary Popovers, MCQ Grading,
            Spaced Recall Flashcards, and Class Imbalance Series Nav.
   ========================================================================== */

var SERIES = [
  { file: 'imbalance-1-metrics.html',       title: 'Why accuracy lies: metrics for rare classes' },
  { file: 'imbalance-2-evaluation.html',    title: 'Honest evaluation: splits, folds and leakage' },
  { file: 'imbalance-3-thresholds.html',    title: 'Threshold moving and cost-based decisions' },
  { file: 'imbalance-4-weights.html',       title: 'Class weights and focal loss' },
  { file: 'imbalance-5-resampling.html',    title: 'Resampling, SMOTE and balanced ensembles' },
  { file: 'imbalance-6-probabilities.html', title: 'Fixing probabilities, other angles, and a checklist' }
];

/* ---------- Utilities & Math Helpers ---------- */
function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
function erf(x) {
  var s = x < 0 ? -1 : 1;
  x = Math.abs(x);
  var t = 1 / (1 + 0.3275911 * x);
  var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}
function Phi(x) { return 0.5 * (1 + erf(x / Math.SQRT2)); }
function phi(x) { return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI); }
function logit(p) { return Math.log(p / (1 - p)); }
function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
function fmt(x, d) {
  if (!isFinite(x)) { return 'n/a'; }
  return Number(x).toFixed(d === undefined ? 2 : d);
}
function fmtInt(x) { return Math.round(x).toLocaleString('en-US'); }
function svgEl(tag, attrs, text) {
  var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (var k in attrs) { if (Object.prototype.hasOwnProperty.call(attrs, k)) { el.setAttribute(k, attrs[k]); } }
  if (text !== undefined) { el.textContent = text; }
  return el;
}
function clearSvg(svg) { while (svg.firstChild) { svg.removeChild(svg.firstChild); } }

/* ---------- KaTeX Auto-Render ---------- */
var katexOptions = {
  delimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
    { left: '\\(', right: '\\)', display: false },
    { left: '\\[', right: '\\]', display: true }
  ],
  throwOnError: false
};

function renderMathIn(el) {
  if (el && typeof renderMathInElement === 'function') {
    renderMathInElement(el, katexOptions);
    return true;
  }
  return false;
}

function renderAllMath() {
  return renderMathIn(document.body);
}

function ensureMathRendered(tries) {
  if (renderAllMath() || tries <= 0) { return; }
  setTimeout(function () { ensureMathRendered(tries - 1); }, 200);
}

/* ---------- Font Controls (Unified across all pages) ---------- */
var FONT_KEY = 'matt_learning_font_px';
var currentFontSize = 18;
try {
  var savedFont = parseInt(localStorage.getItem(FONT_KEY) || localStorage.getItem('imbalance-font'), 10);
  if (savedFont >= 14 && savedFont <= 28) { currentFontSize = savedFont; }
} catch (e) {}

function applyFontSize(px) {
  currentFontSize = clamp(px, 14, 28);
  document.documentElement.style.setProperty('--font-size', currentFontSize + 'px');
  if (document.body) { document.body.style.fontSize = currentFontSize + 'px'; }
  var lbl = document.getElementById('font-size-label');
  if (lbl) { lbl.textContent = currentFontSize + 'px'; }
  try {
    localStorage.setItem(FONT_KEY, String(currentFontSize));
    localStorage.setItem('imbalance-font', String(currentFontSize));
  } catch (e) {}
}

/* ---------- Shared Base Glossary (Class Imbalance Series) ---------- */
var SHARED_GLOSSARY = {
  'precision': {
    title: 'Precision',
    body: 'Of everything the model flagged as positive, the fraction that really is positive: $TP/(TP+FP)$. Also called positive predictive value. Low precision means lots of false alarms. Unlike recall, it depends on the class balance: the same model has lower precision on a rarer problem.',
    more: { href: 'imbalance-1-metrics.html#s-metrics', label: 'Part 1: the metrics that actually move' }
  },
  'recall': {
    title: 'Recall',
    body: 'Of all real positives, the fraction the model caught: $TP/(TP+FN)$. Same thing as sensitivity and <span class="term" data-term="tpr">true positive rate</span>. A model that predicts "negative" for everything has recall 0, whatever its accuracy.',
    more: { href: 'imbalance-1-metrics.html#s-metrics', label: 'Part 1: the metrics that actually move' }
  },
  'tpr': {
    title: 'True positive rate (TPR)',
    body: 'Another name for recall or sensitivity: $TP/(TP+FN)$. It is the y-axis of a ROC curve.'
  },
  'fpr': {
    title: 'False positive rate (FPR)',
    body: '$FP/(FP+TN)$: the fraction of real negatives that got flagged. It is the x-axis of a ROC curve. Because the denominator is the (huge) negative class, a small FPR can still mean a lot of false alarms in absolute numbers.'
  },
  'specificity': {
    title: 'Specificity',
    body: 'True negative rate: $TN/(TN+FP)$, which is $1 - \\text{FPR}$. Of all real negatives, the fraction correctly left alone.'
  },
  'f1': {
    title: 'F1 score',
    body: 'The harmonic mean of <span class="term" data-term="precision">precision</span> and <span class="term" data-term="recall">recall</span>: $2PR/(P+R)$. The harmonic mean is dragged toward the smaller of the two, so you cannot get a high F1 by maxing one and ignoring the other. It ignores true negatives entirely.',
    more: { href: 'imbalance-1-metrics.html#s-metrics', label: 'Part 1: F1 worked example' }
  },
  'confusion-matrix': {
    title: 'Confusion matrix',
    body: 'A 2x2 table (for binary problems) counting true positives, false negatives, false positives and true negatives. Every threshold-based metric is some formula of these four numbers.',
    more: { href: 'imbalance-1-metrics.html#s1', label: 'Part 1: a fraud confusion matrix' }
  },
  'balanced-accuracy': {
    title: 'Balanced accuracy',
    body: 'The average of per-class recall. For binary problems, $(\\text{TPR} + \\text{TNR})/2$. Random or constant predictions score 0.5 regardless of imbalance.'
  },
  'mcc': {
    title: 'Matthews correlation coefficient (MCC)',
    body: 'The Pearson correlation between predicted and true binary labels. Ranges from -1 (always wrong) through 0 (chance) to 1 (perfect). It only gets high when all four confusion-matrix cells are good, which makes it hard to game with imbalance.',
    more: { href: 'imbalance-1-metrics.html#s-mcc', label: 'Part 1: MCC worked example' }
  },
  'roc-auc': {
    title: 'ROC-AUC',
    body: 'Area under the curve of <span class="term" data-term="tpr">true positive rate</span> vs <span class="term" data-term="fpr">false positive rate</span> as the threshold sweeps. Equals the probability that a random positive gets a higher score than a random negative. Random = 0.5 at any imbalance, which makes it look flattering when negatives vastly outnumber positives.',
    more: { href: 'imbalance-1-metrics.html#s-curves', label: 'Part 1: PR-AUC vs ROC-AUC' }
  },
  'pr-auc': {
    title: 'PR-AUC (average precision)',
    body: 'Area under the precision-recall curve. A random scorer gets PR-AUC equal to the positive rate (0.01 for 1% fraud), so always compare to that baseline. More sensitive than ROC-AUC to false positives on imbalanced data. In sklearn: <code>average_precision_score</code>.',
    more: { href: 'imbalance-1-metrics.html#s-curves', label: 'Part 1: PR-AUC vs ROC-AUC' }
  },
  'base-rate': {
    title: 'Base rate (prevalence)',
    body: 'The fraction of all cases that are positive, before looking at any features. In the running fraud example it is 100 / 10,000 = 1%. Also called the prior, written $\\pi$ in this series.'
  },
  'stratified': {
    title: 'Stratified split',
    body: 'A train/test split or CV fold assignment that keeps the class proportions identical in every part. Without it, a small minority class can end up badly over- or under-represented in some folds.',
    more: { href: 'imbalance-2-evaluation.html#s-stratify', label: 'Part 2: stratify your splits' }
  },
  'leakage': {
    title: 'Leakage',
    body: 'Any path by which information from validation/test data reaches the training process. Resampling before splitting is a classic example: copies or interpolations of test positives end up in training, inflating scores.',
    more: { href: 'imbalance-2-evaluation.html#s-leakage', label: 'Part 2: resample only inside training folds' }
  },
  'threshold': {
    title: 'Decision threshold',
    body: 'The cutoff $t$ that turns a score into a label: predict positive when score $\\ge t$. The default 0.5 is only optimal when both kinds of mistake cost the same and the scores are calibrated.',
    more: { href: 'imbalance-3-thresholds.html', label: 'Part 3: threshold moving' }
  },
  'class-weight': {
    title: 'Class weights',
    body: 'Multipliers on each class\'s contribution to the training loss. Giving the rare class a bigger weight makes its errors cost more, so the model works harder to get it right. sklearn\'s "balanced" setting uses $w_c = n/(k\\,n_c)$.',
    more: { href: 'imbalance-4-weights.html', label: 'Part 4: class weights and focal loss' }
  },
  'focal-loss': {
    title: 'Focal loss',
    body: '$-\\alpha_t(1-p_t)^\\gamma \\log p_t$. Cross-entropy multiplied by a factor that shrinks the loss of well-classified examples. Introduced for RetinaNet (Lin et al., 2017) to stop masses of easy background boxes from dominating training.',
    more: { href: 'imbalance-4-weights.html#s-focal', label: 'Part 4: focal loss' }
  },
  'smote': {
    title: 'SMOTE',
    body: 'Synthetic Minority Over-sampling Technique (Chawla et al., 2002). Creates new minority examples by interpolating between a minority point and one of its $k$ nearest minority neighbours: $x_i + \\lambda(x_{nn}-x_i)$, $\\lambda \\in [0,1]$.',
    more: { href: 'imbalance-5-resampling.html#s-smote', label: 'Part 5: SMOTE and its stepper widget' }
  },
  'calibration': {
    title: 'Calibration',
    body: 'A model is calibrated if, among all cases it gives probability 0.2, about 20% are positive. Ranking metrics like AUC ignore calibration entirely. Resampling, class weights and focal loss all break it.',
    more: { href: 'imbalance-6-probabilities.html', label: 'Part 6: getting probabilities back' }
  },
  'logit': {
    title: 'Logit (log-odds)',
    body: '$\\text{logit}(p) = \\ln\\frac{p}{1-p}$. Maps probabilities in (0, 1) to the whole real line. $\\text{logit}(0.5) = 0$, $\\text{logit}(0.01) \\approx -4.595$. Its inverse is the sigmoid $\\sigma(z) = 1/(1+e^{-z})$.'
  }
};

/* ---------- Anchored Popover Engine ---------- */
var popBox = null;
var popBody = null;
var popTitle = null;
var backBtn = null;
var popHistory = [];
var anchorTermEl = null;

function ensurePopoverDOM() {
  popBox = document.getElementById('popover-box');
  if (!popBox) {
    popBox = document.createElement('div');
    popBox.id = 'popover-box';
    popBox.setAttribute('role', 'region');
    popBox.setAttribute('aria-labelledby', 'popover-term-name');
    popBox.innerHTML =
      '<div class="popover-header">' +
        '<span class="popover-title" id="popover-term-name">Term</span>' +
        '<div>' +
          '<button class="btn btn-small" id="popover-back" style="display:none;">Back</button> ' +
          '<button class="btn btn-small" id="popover-close" onclick="closePopover()">Close</button>' +
        '</div>' +
      '</div>' +
      '<div id="popover-body"></div>';
    document.body.appendChild(popBox);
  }
  popBody = document.getElementById('popover-body');
  popTitle = document.getElementById('popover-term-name');
  backBtn = document.getElementById('popover-back');
  if (backBtn && !backBtn.getAttribute('data-bound')) {
    backBtn.setAttribute('data-bound', '1');
    backBtn.addEventListener('click', function () {
      if (popHistory.length) { showTerm(popHistory.pop(), false); }
    });
  }
}

function getMergedGlossary() {
  var gloss = {};
  var k;
  for (k in SHARED_GLOSSARY) {
    if (Object.prototype.hasOwnProperty.call(SHARED_GLOSSARY, k)) { gloss[k] = SHARED_GLOSSARY[k]; }
  }
  if (typeof GLOSSARY === 'object' && GLOSSARY) {
    for (k in GLOSSARY) {
      if (Object.prototype.hasOwnProperty.call(GLOSSARY, k)) { gloss[k] = GLOSSARY[k]; }
    }
  }
  if (typeof glossary === 'object' && glossary) {
    for (k in glossary) {
      if (Object.prototype.hasOwnProperty.call(glossary, k)) { gloss[k] = glossary[k]; }
    }
  }
  return gloss;
}

function positionPopover() {
  if (!popBox || !anchorTermEl || popBox.style.display !== 'block') { return; }
  var rect = anchorTermEl.getBoundingClientRect();
  var vw = document.documentElement.clientWidth;
  var vh = window.innerHeight;
  var boxW = popBox.offsetWidth;
  var boxH = popBox.offsetHeight;
  var gap = 8;
  var left = clamp(
    rect.left + window.scrollX,
    12 + window.scrollX,
    Math.max(12 + window.scrollX, vw - boxW - 12 + window.scrollX)
  );
  var spaceBelow = vh - rect.bottom;
  var top = (spaceBelow >= boxH + gap + 8 || spaceBelow >= rect.top)
    ? rect.bottom + window.scrollY + gap
    : rect.top + window.scrollY - boxH - gap;
  popBox.style.left = Math.round(left) + 'px';
  popBox.style.top = Math.round(Math.max(12, top)) + 'px';
}

function showTerm(key, pushCurrent) {
  ensurePopoverDOM();
  var gloss = getMergedGlossary();
  var g = gloss[key] || { title: key, body: 'Definition not found.' };
  if (pushCurrent && popBox.style.display === 'block' && popBox.getAttribute('data-key')) {
    popHistory.push(popBox.getAttribute('data-key'));
  }
  popBox.setAttribute('data-key', key);
  if (popTitle) { popTitle.textContent = g.title; }
  var html = '<p style="margin:0;">' + g.body + '</p>';
  if (g.more) {
    html += '<div><a class="more-link" href="' + g.more.href + '">More: ' + g.more.label + ' &rarr;</a></div>';
  }
  popBody.innerHTML = html;
  popBody.querySelectorAll('.term').forEach(function (el) {
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
  });
  if (backBtn) { backBtn.style.display = popHistory.length ? 'inline-block' : 'none'; }
  popBox.style.display = 'block';
  popBox.scrollTop = 0;
  renderMathIn(popBody);
  positionPopover();
}

function closePopover() {
  if (popBox) {
    popBox.style.display = 'none';
    popBox.removeAttribute('data-key');
  }
  var bd = document.getElementById('popover-backdrop');
  if (bd) { bd.style.display = 'none'; }
  popHistory = [];
  if (anchorTermEl) {
    anchorTermEl.classList.remove('term-open');
    if (typeof anchorTermEl.focus === 'function') { anchorTermEl.focus(); }
    anchorTermEl = null;
  }
}
window.closePopover = closePopover;

/* ---------- MCQs & Comprehension Checks ---------- */
var mcqResults = {};

function updateScore() {
  var el = document.getElementById('mcq-score');
  if (!el) { return; }
  var total = document.querySelectorAll('.mcq-box').length;
  var answered = 0, right = 0;
  for (var id in mcqResults) {
    if (Object.prototype.hasOwnProperty.call(mcqResults, id)) {
      answered++;
      if (mcqResults[id].first) { right++; }
    }
  }
  el.textContent = 'Checks answered: ' + answered + ' of ' + total + '. Right on first try: ' + right + '.';
}

function checkMCQ(boxId, explicitCorrect, explicitExplain) {
  var box = document.getElementById(boxId);
  if (!box) { return; }
  var correct = explicitCorrect || box.getAttribute('data-correct');
  var selected = box.querySelector('input[type="radio"]:checked');
  var fb = box.querySelector('.mcq-feedback');
  if (!fb) { return; }
  fb.style.display = 'block';

  if (!selected) {
    fb.className = 'mcq-feedback incorrect';
    fb.innerHTML = '<p>Pick an option first.</p>';
    return;
  }

  if (!mcqResults[boxId]) {
    mcqResults[boxId] = { first: selected.value === correct };
  }
  box.querySelectorAll('.mcq-option').forEach(function (o) { o.classList.remove('right', 'wrong'); });

  var rightOpt = box.querySelector('input[value="' + correct + '"]');
  if (rightOpt && rightOpt.closest('.mcq-option')) {
    rightOpt.closest('.mcq-option').classList.add('right');
  }

  var hasPerOptionExplain = selected.hasAttribute('data-explain');
  var html = '';

  if (hasPerOptionExplain) {
    if (selected.value === correct) {
      html = '<p><strong>Correct.</strong> ' + selected.getAttribute('data-explain') + '</p>';
    } else {
      selected.closest('.mcq-option').classList.add('wrong');
      html = '<p><strong>Not quite (' + selected.value + ').</strong> ' + selected.getAttribute('data-explain') + '</p>' +
             (rightOpt ? '<p><strong>Answer: ' + correct + '.</strong> ' + rightOpt.getAttribute('data-explain') + '</p>' : '');
    }
    html += '<details><summary>Why each option is right or wrong</summary><ul>';
    box.querySelectorAll('input[type="radio"]').forEach(function (o) {
      html += '<li><strong>' + o.value + ':</strong> ' + (o.getAttribute('data-explain') || '') + '</li>';
    });
    html += '</ul></details>';
  } else {
    if (selected.value === correct) {
      fb.className = 'mcq-feedback correct';
      html = '<strong>&#10003; Correct!</strong> ' + (explicitExplain || '');
    } else {
      fb.className = 'mcq-feedback incorrect';
      selected.closest('.mcq-option').classList.add('wrong');
      html = '<strong>&#10007; Not quite.</strong> ' + (explicitExplain || '');
    }
  }

  fb.innerHTML = html;
  fb.querySelectorAll('.term').forEach(function (el) {
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
  });
  renderMathIn(fb);
  updateScore();
}

function resetMCQs() {
  mcqResults = {};
  document.querySelectorAll('.mcq-box').forEach(function (box) {
    if (box.tagName.toLowerCase() === 'details') { box.removeAttribute('open'); }
    box.querySelectorAll('input[type="radio"]').forEach(function (r) { r.checked = false; });
    box.querySelectorAll('.mcq-option').forEach(function (o) { o.classList.remove('picked', 'right', 'wrong'); });
    var fb = box.querySelector('.mcq-feedback');
    if (fb) {
      fb.style.display = 'none';
      fb.innerHTML = '';
    }
  });
  updateScore();
}

/* ---------- Spaced Recall Flashcards ---------- */
function renderSpacedCards() {
  var listEl = document.getElementById('spaced-list');
  if (!listEl || typeof SPACED_CARDS === 'undefined' || !Array.isArray(SPACED_CARDS)) { return; }
  listEl.innerHTML = SPACED_CARDS.map(function (c, i) {
    return '<details class="recall-card"><summary>Card ' + (i + 1) + ': ' + c.q + '</summary><p style="margin:0.5rem 0 0 0;">' + c.a + '</p></details>';
  }).join('');
  renderMathIn(listEl);
}

function copySpacedCards() {
  if (typeof SPACED_CARDS === 'undefined' || !Array.isArray(SPACED_CARDS)) { return; }
  var text = SPACED_CARDS.map(function (c, i) {
    return 'Q' + (i + 1) + ': ' + c.q + '\nA' + (i + 1) + ': ' + c.a;
  }).join('\n\n');
  var st = document.getElementById('copy-status');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      if (st) { st.textContent = 'Copied ' + SPACED_CARDS.length + ' cards.'; }
    }, function () {
      if (st) { st.textContent = 'Clipboard blocked; select cards manually.'; }
    });
  } else if (st) {
    st.textContent = 'Clipboard unavailable in this browser.';
  }
}

/* ---------- Shared Header & Footer Injection ---------- */
function ensureHeaderAndFooter() {
  var here = location.pathname.split('/').pop() || 'index.html';
  var isIndex = (here === 'index.html' || here === '');
  var isImbalancePart = SERIES.some(function (s) { return s.file === here; });

  var hdr = document.querySelector('header');
  if (!hdr) {
    hdr = document.createElement('header');
    hdr.id = 'top';
    var navHtml = isIndex
      ? '<div class="site-title"><strong>matt-learning</strong><span class="site-subtitle">&middot; Boox Go 10.3 &amp; Palma 3</span></div>'
      : '<div class="nav-links"><a href="index.html">&larr; All Articles</a>' +
        (isImbalancePart ? '<a href="class-imbalance.html">Series Overview</a>' : '') +
        '</div>';
    hdr.innerHTML =
      '<div class="header-inner">' +
        navHtml +
        '<div class="font-controls">' +
          '<button id="font-dec" aria-label="Decrease font size">A-</button>' +
          '<span class="font-size-label" id="font-size-label">' + currentFontSize + 'px</span>' +
          '<button id="font-inc" aria-label="Increase font size">A+</button>' +
        '</div>' +
      '</div>';
    document.body.insertBefore(hdr, document.body.firstChild);
  } else {
    if (!hdr.id) { hdr.id = 'top'; }
    var fc = hdr.querySelector('.font-controls');
    if (fc && !document.getElementById('font-size-label')) {
      var lbl = document.createElement('span');
      lbl.className = 'font-size-label';
      lbl.id = 'font-size-label';
      lbl.textContent = currentFontSize + 'px';
      var incBtn = document.getElementById('font-inc');
      if (incBtn) { fc.insertBefore(lbl, incBtn); }
    }
  }

  var mainEl = document.querySelector('main');
  if (!isIndex && mainEl && !document.querySelector('footer.article-footer') && !document.getElementById('prev-next')) {
    var ftr = document.createElement('footer');
    ftr.className = 'article-footer';
    ftr.innerHTML = '<a href="index.html">&larr; All Articles</a><a href="#top">&uarr; Back to top</a>';
    mainEl.appendChild(ftr);
  }
}

/* ---------- DOMContentLoaded Initialization ---------- */
document.addEventListener('DOMContentLoaded', function () {
  ensureHeaderAndFooter();
  ensurePopoverDOM();
  applyFontSize(currentFontSize);

  var inc = document.getElementById('font-inc');
  var dec = document.getElementById('font-dec');
  if (inc) {
    inc.addEventListener('click', function () { applyFontSize(currentFontSize + 2); });
  }
  if (dec) {
    dec.addEventListener('click', function () { applyFontSize(currentFontSize - 2); });
  }

  /* Class Imbalance Series Navigation */
  var here = location.pathname.split('/').pop() || '';
  var idx = -1;
  SERIES.forEach(function (s, i) { if (s.file === here) { idx = i; } });
  var nav = document.getElementById('series-nav');
  if (nav) {
    var html = '<div class="series-title">Class imbalance series' + (idx >= 0 ? ': part ' + (idx + 1) + ' of ' + SERIES.length : '') + '</div><ol>';
    SERIES.forEach(function (s, i) {
      html += '<li' + (i === idx ? ' class="current"' : '') + '><a href="' + s.file + '">' + s.title + '</a></li>';
    });
    html += '</ol><div style="margin-top:0.3rem;"><a href="class-imbalance.html">Series overview</a></div>';
    nav.innerHTML = html;
  }
  var pn = document.getElementById('prev-next');
  if (pn) {
    var h = '';
    if (idx > 0) { h = '<a href="' + SERIES[idx - 1].file + '">&larr; Part ' + idx + ': ' + SERIES[idx - 1].title + '</a>'; }
    else { h = '<a href="class-imbalance.html">&larr; Series overview</a>'; }
    if (idx >= 0 && idx < SERIES.length - 1) { h += '<a href="' + SERIES[idx + 1].file + '">Part ' + (idx + 2) + ': ' + SERIES[idx + 1].title + ' &rarr;</a>'; }
    else { h += '<a href="class-imbalance.html">Back to series overview &rarr;</a>'; }
    pn.innerHTML = h;
  }

  /* Decorate .term elements & bind event delegation */
  document.querySelectorAll('.term').forEach(function (el) {
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
  });

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('.term') : null;
    if (el) {
      e.preventDefault();
      if (popBox && popBox.contains(el)) {
        showTerm(el.getAttribute('data-term'), true);
        return;
      }
      if (anchorTermEl === el && popBox && popBox.style.display === 'block') {
        closePopover();
        return;
      }
      if (anchorTermEl) { anchorTermEl.classList.remove('term-open'); }
      anchorTermEl = el;
      anchorTermEl.classList.add('term-open');
      popHistory = [];
      showTerm(el.getAttribute('data-term'), false);
      return;
    }
    if (popBox && popBox.style.display === 'block' && !popBox.contains(e.target)) {
      closePopover();
    }
  });

  window.addEventListener('resize', positionPopover);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closePopover(); }
    if (e.key === 'Enter' && document.activeElement && document.activeElement.classList.contains('term')) {
      document.activeElement.click();
    }
  });

  /* MCQs setup: auto-generates <summary class="mcq-title">, radio inputs (from data-option / data-explain),
     Check answer button, <div class="mcq-feedback">, and supports existing full markup & instant-click MCQs */
  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  document.querySelectorAll('.mcq-box').forEach(function (box, i) {
    var total = document.querySelectorAll('.mcq-box').length;
    if (!box.id) { box.id = 'mcq-' + (i + 1); }
    var boxId = box.id;

    /* 1. Auto-create <summary class="mcq-title"> if missing on <details class="mcq-box"> */
    var t = box.querySelector('.mcq-title');
    if (!t && box.tagName.toLowerCase() === 'details') {
      t = document.createElement('summary');
      t.className = 'mcq-title';
      box.insertBefore(t, box.firstChild);
    }
    var topic = box.getAttribute('data-topic');
    if (t && !t.textContent.trim()) {
      t.textContent = 'Check ' + (i + 1) + ' of ' + total +
        (topic ? ': ' + topic : '') +
        (box.tagName.toLowerCase() === 'details' ? ' (tap to expand)' : '');
    }

    /* 2. Auto-upgrade compact .mcq-option elements that lack an <input type="radio">
          (unless they are instant-click options with data-correct="true|false") */
    var isInstant = box.querySelector('.mcq-option[data-correct]') !== null;
    if (!isInstant) {
      box.querySelectorAll('.mcq-option').forEach(function (opt, optIdx) {
        var inp = opt.querySelector('input[type="radio"]');
        if (!inp) {
          var val = opt.getAttribute('data-option') || opt.getAttribute('data-value') || LETTERS[optIdx] || String(optIdx + 1);
          var explain = opt.getAttribute('data-explain');
          inp = document.createElement('input');
          inp.type = 'radio';
          inp.name = boxId;
          inp.value = val;
          if (explain !== null) { inp.setAttribute('data-explain', explain); }
          var trimmed = (opt.textContent || '').trim();
          var hasLetterPrefix = /^[A-H][).:]\s/.test(trimmed);
          if (!hasLetterPrefix) {
            opt.insertBefore(document.createTextNode(' ' + val + ') '), opt.firstChild);
          } else {
            opt.insertBefore(document.createTextNode(' '), opt.firstChild);
          }
          opt.insertBefore(inp, opt.firstChild);
        } else {
          if (!inp.name) { inp.name = boxId; }
          if (!inp.hasAttribute('data-explain') && opt.hasAttribute('data-explain')) {
            inp.setAttribute('data-explain', opt.getAttribute('data-explain'));
          }
        }
      });
    }

    /* 3. Auto-create <div class="mcq-feedback"> if missing */
    var fb = box.querySelector('.mcq-feedback');
    if (!fb) {
      fb = document.createElement('div');
      fb.className = 'mcq-feedback';
      box.appendChild(fb);
    }

    /* 4. Auto-create "Check answer" button if missing on standard radio MCQs */
    if (!isInstant && box.hasAttribute('data-correct') && !box.querySelector('button')) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn';
      btn.textContent = 'Check answer';
      btn.addEventListener('click', function () { checkMCQ(boxId); });
      box.insertBefore(btn, fb);
    }

    /* 5. Bind radio selection highlight */
    box.querySelectorAll('.mcq-option input[type="radio"]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        box.querySelectorAll('.mcq-option').forEach(function (o) { o.classList.remove('picked'); });
        var opt = inp.closest('.mcq-option');
        if (opt) { opt.classList.add('picked'); }
      });
    });

    /* 6. Instant-click MCQs (where .mcq-option has data-correct and data-why) */
    box.querySelectorAll('.mcq-option[data-correct]').forEach(function (opt) {
      opt.addEventListener('click', function () {
        box.querySelectorAll('.mcq-option').forEach(function (o) { o.classList.remove('picked', 'right', 'wrong'); });
        opt.classList.add('picked');
        var ok = opt.getAttribute('data-correct') === 'true';
        opt.classList.add(ok ? 'right' : 'wrong');
        if (fb) {
          fb.className = 'mcq-feedback ' + (ok ? 'correct' : 'incorrect');
          fb.style.display = 'block';
          fb.innerHTML = '<strong>' + (ok ? 'Correct.' : 'Not quite.') + '</strong> ' + (opt.getAttribute('data-why') || '');
          renderMathIn(fb);
        }
      });
    });
  });

  /* Auto-populate score bar and Reset checks button if .score-bar is empty or missing inner markup */
  document.querySelectorAll('.score-bar').forEach(function (bar) {
    if (!bar.querySelector('#mcq-score')) {
      var sp = document.createElement('span');
      sp.id = 'mcq-score';
      bar.insertBefore(sp, bar.firstChild);
    }
    if (!bar.querySelector('button')) {
      var rbtn = document.createElement('button');
      rbtn.type = 'button';
      rbtn.className = 'btn btn-small';
      rbtn.textContent = 'Reset checks';
      rbtn.addEventListener('click', resetMCQs);
      bar.appendChild(rbtn);
    }
  });

  /* Auto-populate #spaced-widget chrome if only #spaced-list or empty #spaced-widget is provided */
  var sw = document.getElementById('spaced-widget');
  if (sw && !sw.querySelector('#spaced-list')) {
    sw.innerHTML =
      '<div class="widget-label">Spaced Recall Export (1d / 4d / 14d / 30d)</div>' +
      '<h3>Core Retrieval Prompts</h3>' +
      '<p>Tap any card to test yourself, or copy all Q&amp;A pairs into your spaced-repetition deck.</p>' +
      '<div id="spaced-list"></div>' +
      '<div class="control-row">' +
        '<button type="button" class="btn btn-small" onclick="copySpacedCards()">Copy Q&amp;A Cards</button>' +
        '<span id="copy-status" style="font-family:var(--font-mono); font-size:0.9em;"></span>' +
      '</div>';
  }
  renderSpacedCards();
  updateScore();
  ensureMathRendered(10);
});

window.addEventListener('load', function () { renderAllMath(); });
