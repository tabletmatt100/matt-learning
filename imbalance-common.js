/* Shared code for the class imbalance series.
   Load this NON-deferred in <head>, after the KaTeX <script defer> tags.
   Each page may define `var glossary = {...}` (inline, anywhere before DOMContentLoaded).
   Page entries override the shared ones below. */

var SERIES = [
  { file: 'imbalance-1-metrics.html',     title: 'Why accuracy lies: metrics for rare classes' },
  { file: 'imbalance-2-evaluation.html',  title: 'Honest evaluation: splits, folds and leakage' },
  { file: 'imbalance-3-thresholds.html',  title: 'Threshold moving and cost-based decisions' },
  { file: 'imbalance-4-weights.html',     title: 'Class weights and focal loss' },
  { file: 'imbalance-5-resampling.html',  title: 'Resampling, SMOTE and balanced ensembles' },
  { file: 'imbalance-6-probabilities.html', title: 'Fixing probabilities, other angles, and a checklist' }
];

/* ---------- KaTeX ---------- */
var katexOptions = {
  delimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
    { left: '\\(', right: '\\)', display: false },
    { left: '\\[', right: '\\]', display: true }
  ],
  throwOnError: false
};
function renderAllMath() {
  if (typeof renderMathInElement === 'function') { renderMathInElement(document.body, katexOptions); }
}
function renderMathIn(el) {
  if (typeof renderMathInElement === 'function') { renderMathInElement(el, katexOptions); }
}

/* ---------- Math helpers for widgets ---------- */
function erf(x) {
  // Abramowitz and Stegun 7.1.26
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
function fmt(x, d) { return (isFinite(x) ? x.toFixed(d) : 'n/a'); }
function fmtInt(x) { return Math.round(x).toLocaleString('en-US'); }
function svgEl(tag, attrs, text) {
  var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (var k in attrs) { if (Object.prototype.hasOwnProperty.call(attrs, k)) { el.setAttribute(k, attrs[k]); } }
  if (text !== undefined) { el.textContent = text; }
  return el;
}
function clearSvg(svg) { while (svg.firstChild) { svg.removeChild(svg.firstChild); } }

/* ---------- Shared glossary (core terms used in several parts) ---------- */
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

/* ---------- Page setup ---------- */
document.addEventListener('DOMContentLoaded', function () {
  setTimeout(renderAllMath, 50);
  setTimeout(renderAllMath, 400);

  /* Font size, remembered across pages in the series */
  var size = 18;
  try { var saved = parseInt(localStorage.getItem('imbalance-font'), 10); if (saved >= 14 && saved <= 30) { size = saved; } } catch (e) {}
  function applySize() {
    document.body.style.fontSize = size + 'px';
    try { localStorage.setItem('imbalance-font', String(size)); } catch (e) {}
  }
  applySize();
  var inc = document.getElementById('font-inc'), dec = document.getElementById('font-dec');
  if (inc) { inc.addEventListener('click', function () { if (size < 30) { size += 2; applySize(); } }); }
  if (dec) { dec.addEventListener('click', function () { if (size > 14) { size -= 2; applySize(); } }); }

  /* Series navigation */
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
    var h = '<span></span>';
    if (idx > 0) { h = '<a href="' + SERIES[idx - 1].file + '">&larr; Part ' + idx + ': ' + SERIES[idx - 1].title + '</a>'; }
    else { h = '<a href="class-imbalance.html">&larr; Series overview</a>'; }
    if (idx >= 0 && idx < SERIES.length - 1) { h += '<a href="' + SERIES[idx + 1].file + '">Part ' + (idx + 2) + ': ' + SERIES[idx + 1].title + ' &rarr;</a>'; }
    else { h += '<a href="class-imbalance.html">Back to series overview &rarr;</a>'; }
    pn.innerHTML = h;
  }

  /* Popovers: event delegation, so terms inside popovers and MCQ feedback work too */
  var gloss = {};
  var k;
  for (k in SHARED_GLOSSARY) { if (Object.prototype.hasOwnProperty.call(SHARED_GLOSSARY, k)) { gloss[k] = SHARED_GLOSSARY[k]; } }
  if (typeof glossary === 'object' && glossary) {
    for (k in glossary) { if (Object.prototype.hasOwnProperty.call(glossary, k)) { gloss[k] = glossary[k]; } }
  }
  window.ALL_GLOSSARY = gloss;

  var popBox = document.getElementById('popover-box');
  var popBackdrop = document.getElementById('popover-backdrop');
  var popBody = document.getElementById('popover-body');
  var popTitle = document.getElementById('popover-term-name');
  var backBtn = document.getElementById('popover-back');
  var history = [];

  function showTerm(key, pushCurrent) {
    var g = gloss[key];
    if (!g) { g = { title: key, body: 'No definition written for this term yet.' }; }
    if (pushCurrent && popBox.style.display === 'block' && popBox.getAttribute('data-key')) {
      history.push(popBox.getAttribute('data-key'));
    }
    popBox.setAttribute('data-key', key);
    popTitle.textContent = g.title;
    var body = g.body;
    if (g.more) { body += '<div><a class="more-link" href="' + g.more.href + '">More: ' + g.more.label + ' &rarr;</a></div>'; }
    popBody.innerHTML = body;
    if (backBtn) { backBtn.style.display = history.length ? 'inline-block' : 'none'; }
    popBackdrop.style.display = 'block';
    popBox.style.display = 'block';
    popBox.scrollTop = 0;
    renderMathIn(popBody);
  }
  function closePop() {
    popBackdrop.style.display = 'none';
    popBox.style.display = 'none';
    popBox.removeAttribute('data-key');
    history = [];
  }
  window.closePopover = closePop;
  if (backBtn) { backBtn.addEventListener('click', function () { if (history.length) { showTerm(history.pop(), false); } }); }

  function decorate(root) {
    root.querySelectorAll('.term').forEach(function (el) {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
    });
  }
  decorate(document);
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('.term') : null;
    if (!el) { return; }
    e.preventDefault();
    var inPopover = popBox.contains(el);
    showTerm(el.getAttribute('data-term'), inPopover);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closePop(); }
    if (e.key === 'Enter' && document.activeElement && document.activeElement.classList.contains('term')) {
      document.activeElement.click();
    }
  });

  /* MCQs */
  document.querySelectorAll('.mcq-option input').forEach(function (inp) {
    inp.addEventListener('change', function () {
      var box = inp.closest('.mcq-box');
      box.querySelectorAll('.mcq-option').forEach(function (o) { o.classList.remove('picked'); });
      inp.closest('.mcq-option').classList.add('picked');
    });
  });
  var boxes = document.querySelectorAll('.mcq-box');
  boxes.forEach(function (box, i) {
    var t = box.querySelector('.mcq-title');
    if (t && !t.textContent.trim()) { t.textContent = 'Check ' + (i + 1) + ' of ' + boxes.length; }
  });
  updateScore();
});

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
  el.textContent = 'Checks answered: ' + answered + ' of ' + total + '. Right on the first try: ' + right + '.' +
    (answered === total && total > 0 ? (right === total ? ' A clean sweep.' : ' Scroll back to any you missed and reread the explanations.') : '');
}

function checkMCQ(boxId) {
  var box = document.getElementById(boxId);
  var correct = box.getAttribute('data-correct');
  var selected = box.querySelector('input[type="radio"]:checked');
  var fb = box.querySelector('.mcq-feedback');
  fb.style.display = 'block';
  if (!selected) {
    fb.innerHTML = '<p>Pick an option first.</p>';
    return;
  }
  if (!mcqResults[boxId]) { mcqResults[boxId] = { first: selected.value === correct }; }
  box.querySelectorAll('.mcq-option').forEach(function (o) { o.classList.remove('right', 'wrong'); });
  var html;
  var right = box.querySelector('input[value="' + correct + '"]');
  right.closest('.mcq-option').classList.add('right');
  if (selected.value === correct) {
    html = '<p><strong>Correct.</strong> ' + selected.getAttribute('data-explain') + '</p>';
  } else {
    selected.closest('.mcq-option').classList.add('wrong');
    html = '<p><strong>Not quite (' + selected.value + ').</strong> ' + selected.getAttribute('data-explain') + '</p>' +
           '<p><strong>Answer: ' + correct + '.</strong> ' + right.getAttribute('data-explain') + '</p>';
  }
  html += '<details><summary>Why each option is right or wrong</summary><ul>';
  box.querySelectorAll('input[type="radio"]').forEach(function (o) {
    html += '<li><strong>' + o.value + ':</strong> ' + o.getAttribute('data-explain') + '</li>';
  });
  html += '</ul></details>';
  fb.innerHTML = html;
  renderMathIn(fb);
  updateScore();
}
