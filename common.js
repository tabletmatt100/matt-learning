/* ==========================================================================
   common.js — Unified Shared Script for matt-learning
   Handles: Header/Footer/Popover injection, Font Scaling (localStorage),
            KaTeX Auto-Render, Anchored Glossary Popovers, MCQ Grading,
            Spaced Recall Flashcards, and Class Imbalance Series Nav.
   ========================================================================== */

var SERIES = [];

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

/* ---------- Shared Base Glossary (Class Imbalance & Core Classification) ---------- */
var SHARED_GLOSSARY = {
  'precision': {
    title: 'Precision',
    body: 'Of everything the model flagged as positive, the fraction that really is positive: $TP/(TP+FP)$. Also called positive predictive value. Low precision means lots of false alarms. Unlike recall, it depends on the class balance: the same model has lower precision on a rarer problem.'
  },
  'recall': {
    title: 'Recall',
    body: 'Of all real positives, the fraction the model caught: $TP/(TP+FN)$. Same thing as sensitivity and <span class="term" data-term="tpr">true positive rate</span>. A model that predicts "negative" for everything has recall 0, whatever its accuracy.'
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
    body: 'The harmonic mean of <span class="term" data-term="precision">precision</span> and <span class="term" data-term="recall">recall</span>: $2PR/(P+R)$. The harmonic mean is dragged toward the smaller of the two, so you cannot get a high F1 by maxing one and ignoring the other. It ignores true negatives entirely.'
  },
  'confusion-matrix': {
    title: 'Confusion matrix',
    body: 'A $2 \\times 2$ table (for binary problems) counting true positives ($TP$), false negatives ($FN$), false positives ($FP$) and true negatives ($TN$). Every threshold-based metric is some formula of these four numbers.'
  },
  'balanced-accuracy': {
    title: 'Balanced accuracy',
    body: 'The average of per-class recall. For binary problems, $(\\text{TPR} + \\text{TNR})/2$. Random or constant predictions score $0.5$ regardless of imbalance.'
  },
  'mcc': {
    title: 'Matthews correlation coefficient (MCC)',
    body: 'The Pearson correlation between predicted and true binary labels. Ranges from $-1$ (always wrong) through $0$ (chance) to $+1$ (perfect). It only gets high when all four confusion-matrix cells are good, which makes it hard to game with imbalance.'
  },
  'roc-auc': {
    title: 'ROC-AUC',
    body: 'Area under the curve of <span class="term" data-term="tpr">true positive rate</span> vs <span class="term" data-term="fpr">false positive rate</span> as the threshold sweeps. Equals the probability that a random positive gets a higher score than a random negative. Random $= 0.5$ at any imbalance, which makes it look flattering when negatives vastly outnumber positives.'
  },
  'pr-auc': {
    title: 'PR-AUC (average precision)',
    body: 'Area under the precision-recall curve. A random scorer gets PR-AUC equal to the positive rate ($0.01$ for $1\\%$ fraud), so always compare to that baseline. More sensitive than ROC-AUC to false positives on imbalanced data. In sklearn: <code>average_precision_score</code>.'
  },
  'base-rate': {
    title: 'Base rate (prevalence)',
    body: 'The fraction of all cases that are positive, before looking at any features. In the running fraud example it is $100 / 10{,}000 = 1\\%$. Also called the prior, written $\\pi$.'
  },
  'stratified': {
    title: 'Stratified split',
    body: 'A train/test split or CV fold assignment that keeps the class proportions identical in every part. Without it, a small minority class can end up badly over- or under-represented in some folds.'
  },
  'leakage': {
    title: 'Leakage',
    body: 'Any path by which information from validation/test data reaches the training process. Resampling before splitting is a classic example: copies or interpolations of test positives end up in training, inflating scores.'
  },
  'threshold': {
    title: 'Decision threshold',
    body: 'The cutoff $t$ that turns a score into a label: predict positive when score $\\ge t$. The default $0.5$ is only optimal when both kinds of mistake cost the same and the scores are calibrated.'
  },
  'class-weight': {
    title: 'Class weights',
    body: 'Multipliers on each class\'s contribution to the training loss. Giving the rare class a bigger weight makes its errors cost more, so the model works harder to get it right. sklearn\'s "balanced" setting uses $w_c = n/(k\\,n_c)$.'
  },
  'focal-loss': {
    title: 'Focal loss',
    body: '$-\\alpha_t(1-p_t)^\\gamma \\log p_t$. Cross-entropy multiplied by a factor that shrinks the loss of well-classified examples. Introduced for RetinaNet (Lin et al., 2017) to stop masses of easy background boxes from dominating training.'
  },
  'smote': {
    title: 'SMOTE',
    body: 'Synthetic Minority Over-sampling Technique (Chawla et al., 2002). Creates new minority examples by interpolating between a minority point and one of its $k$ nearest minority neighbours: $x_i + \\lambda(x_{\\text{nn}}-x_i)$, $\\lambda \\in [0,1]$.'
  },
  'calibration': {
    title: 'Calibration',
    body: 'A model is calibrated if, among all cases it gives probability $0.20$, about $20\\%$ are positive. Ranking metrics like AUC ignore calibration entirely. Resampling, class weights and focal loss all break it.'
  },
  'logit': {
    title: 'Logit (log-odds)',
    body: '$\\text{logit}(p) = \\ln\\frac{p}{1-p}$. Maps probabilities in $(0, 1)$ to the whole real line. $\\text{logit}(0.5) = 0$, $\\text{logit}(0.01) \\approx -4.595$. Its inverse is the sigmoid $\\sigma(z) = 1/(1+e^{-z})$.'
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
  if (popTitle) {
    popTitle.innerHTML = g.title;
    renderMathIn(popTitle);
  }
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

/* ---------- Spaced Repetition System (SRS) Engine & Master Deck ---------- */
var SRS_KEY = 'matt_learning_srs_v1';
var SRS_OFFSET_KEY = 'matt_learning_srs_offset_days';
var MS_PER_DAY = 86400000;

var SRS_LIBRARY = {
  'attention.html': {
    title: '1. How Attention Works',
    cards: [
      { q: 'Write the Scaled Dot-Product Attention formula and explain why we divide by $\\sqrt{d_k}$.', a: '$\\text{Attention}(Q,K,V) = \\text{softmax}\\!\\left(\\frac{QK^\\top}{\\sqrt{d_k}}\\right)V$. If $q_i, k_j$ have unit variance, their dot product has variance $d_k$; dividing by $\\sqrt{d_k}$ keeps variance at $1$ so softmax does not saturate into near-zero gradients.' },
      { q: 'What are the exact roles of Query ($Q$), Key ($K$), and Value ($V$) in self-attention?', a: 'Query $Q = XW_Q$ asks "what am I looking for?", Key $K = XW_K$ advertises "what do I contain?" (matched via $QK^\\top$), and Value $V = XW_V$ holds the payload vectors blended by the attention weights.' },
      { q: 'How does a causal attention mask prevent future-token leakage during autoregressive training?', a: 'It adds $-\\infty$ (or $-10^9$) to every upper-triangular score $(i < j)$ before softmax, forcing $\\exp(-\\infty) = 0$ so token $i$ puts $0\\%$ weight on any future token $j > i$.' },
      { q: 'Why use Multi-Head Attention with $h$ heads of dimension $d_k = d_{\\text{model}}/h$ instead of one big head?', a: 'Each head projects into a distinct $d_k$-dimensional subspace at the same total FLOP cost, letting the layer attend to syntax, coreference, and position simultaneously before concatenating and projecting via $W_O$.' },
      { q: 'Why does standard self-attention scale quadratically $O(T^2)$ in sequence length $T$?', a: 'Because every one of the $T$ queries computes a dot product against all $T$ keys, forming a $T \\times T$ attention matrix per head.' }
    ]
  },
  'gkd.html': {
    title: '2. Generalized Knowledge Distillation (GKD)',
    cards: [
      { q: 'What is exposure bias in standard supervised Knowledge Distillation ($\lambda = 0$)?', a: 'During offline KD, the student only sees gold/teacher prefixes, but at inference it conditions on its own imperfect tokens, entering unfamiliar states where errors compound.' },
      { q: 'How does On-Policy GKD ($\lambda > 0$) fix exposure bias without needing ground-truth reward verifiers?', a: 'With probability $\\lambda$, the student generates its own rollout $y \\sim p_\\theta(\\cdot|x)$, and the teacher provides dense per-token probability targets $p_T(\\cdot | x, y_{<t})$ on the exact states the student actually visits.' },
      { q: 'How do Forward KL ($D_{\\text{KL}}(P_T \\parallel P_S)$) and Reverse KL ($D_{\\text{KL}}(P_S \\parallel P_T)$) differ in behavior?', a: 'Forward KL is mode-covering (penalizes student wherever $P_T > 0$, spreading mass across all teacher modes). Reverse KL is mode-seeking (penalizes student wherever $P_T \\approx 0$, locking onto the teacher\'s single sharpest mode).' },
      { q: 'Why does raising distillation temperature $T > 1$ help a smaller student learn from teacher logits?', a: 'Dividing logits by $T > 1$ softens the distribution and boosts "dark knowledge" in runner-up tokens, teaching relative token similarities instead of a near-one-hot argmax.' }
    ]
  },
  'class-imbalance.html': {
    title: '3. Dealing with Class Imbalance',
    cards: [
      { q: 'On a $1\\%$ fraud dataset ($100$ frauds, $9{,}900$ legit), a classifier has $90\\%$ recall ($\\text{TPR} = 0.90$) and $95\\%$ specificity ($\\text{FPR} = 0.05$). What is its precision, and why?', a: 'It catches $0.90 \\times 100 = 90$ frauds ($TP = 90$), but triggers $0.05 \\times 9{,}900 = 495$ false alarms ($FP = 495$). $\\text{Precision} = 90 / (90 + 495) = 15.4\\%$, because the $5\\%$ FPR multiplies a $99\\times$ larger negative pool.' },
      { q: 'Why is PR-AUC preferred over ROC-AUC when positives are rare (e.g. $\\pi = 1\\%$)?', a: 'ROC-AUC uses $\\text{FPR} = FP / (FP + TN)$, where massive $TN$ hides hundreds of false alarms. PR-AUC plots Precision vs Recall, comparing false alarms directly against true catches. Random guessing scores $0.50$ on ROC-AUC but $\\pi$ ($0.01$) on PR-AUC.' },
      { q: 'Given false-positive cost $C_{FP}$ and false-negative cost $C_{FN}$, what is the Bayes-optimal probability threshold $t^*$ for a calibrated classifier?', a: '$t^* = \\frac{C_{FP}}{C_{FP} + C_{FN}}$. For example, if a review costs $\\$10$ and a missed fraud costs $\\$90$, flag whenever $\\hat{p} \\ge \\frac{10}{10 + 90} = 0.10$.' },
      { q: 'What happens if you run SMOTE or oversampling before splitting into train and validation folds?', a: 'Data leakage: copies/interpolations of the same minority examples land in both train and validation folds, inflating validation recall. Always resample strictly inside the training fold.' },
      { q: 'How do class weights $w_+$ and focal loss $-(1 - p_t)^\\gamma \\ln p_t$ differ in how they reweight training examples?', a: 'Class weights multiply all positive examples by a constant $w_+$. Focal loss scales every example by $(1 - p_t)^\\gamma$, shrinking well-classified examples so gradients focus on hard examples.' },
      { q: 'If you train with positive class weight $w_+$ and the model outputs raw probability $\\tilde{p}$, how do you recover the calibrated probability $\\hat{p}$?', a: 'Divide the raw odds by $w_+$: $\\hat{p} = \\frac{\\tilde{p}}{\\tilde{p} + w_+(1 - \\tilde{p})}$, or in log-odds: $\\text{logit}(\\hat{p}) = \\text{logit}(\\tilde{p}) - \\ln w_+$.' }
    ]
  },
  'deepconf.html': {
    title: '4. DeepConf: Deep Think with Confidence',
    cards: [
      { q: 'How does DeepConf define token confidence $C_t$ from next-token distribution $P_t$?', a: 'As the average log-probability of the top-$k$ candidate tokens at step $t$ (or negative local entropy), measuring how sharply peaked the model\'s belief is at that step.' },
      { q: 'Why does DeepConf use Lowest Group Confidence (sliding window minimum) instead of average trace confidence?', a: 'A long reasoning chain is a weakest-link process: one hallucinated algebraic step ruins the final answer even if the other $95\\%$ of tokens have high confidence. A sliding window catches localized collapses.' },
      { q: 'How does DeepConf Online early stopping save $40\\text{–}70\\%$ of test-time compute tokens?', a: 'After $N_0$ warmup traces establish a confidence threshold $\\tau$, subsequent parallel traces are aborted mid-generation the moment their sliding-window confidence drops below $\\tau$.' },
      { q: 'In confidence-weighted majority voting, how are surviving traces aggregated?', a: 'Instead of $1$ vote per trace, each trace\'s vote for final answer $a$ is weighted by its softmax-normalized trace confidence (after filtering out the bottom percentile).' }
    ]
  },
  'reinforcement-learning.html': {
    title: '5. Reinforcement Learning From Scratch (Part 1)',
    cards: [
      { q: 'What is the Credit Assignment Problem in RL?', a: 'When a reward arrives after a sequence of moves, figuring out which earlier actions actually caused that outcome.' },
      { q: 'If a $+80$ reward is delayed by $2$ steps and $\\gamma = 0.5$, what is it worth today?', a: '$20$ (step $1$ cuts $80$ in half to $40$; step $2$ cuts $40$ in half to $20$).' },
      { q: 'What is the 1-step TD error ($\\delta_t$) in plain English?', a: 'The surprise between the 1-step target $R_{t+1} + \\gamma V(S_{t+1})$ and your old scorecard estimate $V(S_t)$.' },
      { q: 'What does bootstrapping mean in TD learning?', a: 'Updating a state\'s scorecard after one step using the neighboring state\'s current scorecard estimate $V(S_{t+1})$ instead of waiting for the episode to end.' },
      { q: 'Why do we need $Q(s, a)$ instead of just $V(s)$ to pick actions?', a: '$V(s)$ only scores how good a tile is; $Q(s, a)$ scores each specific move from that tile so you can pick the move with the highest score.' }
    ]
  },
  'rl-algorithms.html': {
    title: '6. Modern RL Algorithms: Q*, PPO & GRPO (Part 2)',
    cards: [
      { q: 'What does $Q^*(s, a)$ ("Q-star") mean in plain English?', a: 'The expected discounted return of taking action $a$ in state $s$, assuming you play $100\\%$ optimally on every step after that.' },
      { q: 'Why do Actor-Critic algorithms use Advantage ($A_t = R - V(s)$) instead of raw reward $R$?', a: 'So they only reinforce actions that scored better than the expected baseline $V(s)$ for that state/prompt, rather than rewarding below-average answers on easy prompts.' },
      { q: 'What problem does PPO\'s clipping range $[1 - \\epsilon, 1 + \\epsilon]$ solve?', a: 'It puts a speed limit (e.g. $\\pm 20\\%$) on how far the new policy probabilities can move from the old policy in a single update, preventing policy collapse.' },
      { q: 'How does GRPO compute Advantage without a Critic neural network?', a: 'It samples a group of $G$ answers for the same prompt, computes their average reward $\\mu$, and scores each answer relative to that group average: $A_i = (R_i - \\mu) / \\sigma$.' },
      { q: 'When should you pick DPO vs. GRPO for an LLM?', a: 'Use DPO for fast offline tuning on fixed (chosen, rejected) preference pairs; use GRPO when the model needs online practice and verification (like solving math or code problems).' }
    ]
  },
  'training-hyperparameters.html': {
    title: '7. Training Hyperparameters',
    cards: [
      { q: 'Above what threshold does gradient descent diverge on a valley with curvature $H$?', a: 'When learning rate $\\eta > 2 / H$. Each step jumps past the minimum and lands higher up the opposite wall.' },
      { q: 'How does Gradient Accumulation ($K$ steps) achieve a large effective batch size $B_{\\text{eff}}$ on a small GPU?', a: 'It runs $K$ forward/backward passes of micro-batch $B_{\\text{micro}}$ and averages their gradients before updating weights once, giving $B_{\\text{eff}} = B_{\\text{micro}} \\times K$ without storing all $B_{\\text{eff}}$ activations at once.' },
      { q: 'If you quadruple effective batch size $B_{\\text{eff}}$ for a fixed number of epochs, why must you adjust the learning rate $\\eta$?', a: 'Because $4\\times$ larger batches take $4\\times$ fewer optimizer steps per epoch (and have $2\\times$ lower gradient noise std), so $\\eta$ must be scaled up (linearly for SGD, or by $\\sqrt{4} = 2\\times$ for AdamW) to cover the same progress.' },
      { q: 'Why does AdamW need linear warmup during the first $W$ steps of Transformer training?', a: 'Because at step $0$ the second-moment variance estimate $v_t$ has almost no sample history, so taking full peak-LR steps immediately produces erratic adaptive jumps.' },
      { q: 'How does Gradient Norm Clipping at threshold $c$ protect training without distorting the update direction?', a: 'Whenever $\\lVert g \\rVert_2 > c$, it multiplies the entire gradient vector by the scalar $c / \\lVert g \\rVert_2$, shrinking its length to $c$ while preserving the exact ratio between all coordinates.' },
      { q: 'What is the mathematical difference between AdamW and Adam + L2 regularization?', a: 'Adam + L2 adds $\\lambda w$ into the gradient, where it gets divided by $\\sqrt{\\hat{v}_t}$ (weakening decay on high-gradient weights). AdamW decouples weight decay outside the adaptive term: $w \\leftarrow w - \\eta \\lambda w$.' }
    ]
  },
  'metrics-refresher.html': {
    title: '8. Classification Metrics Refresher',
    cards: [
      { q: 'State the conditioning difference between Precision, Recall, and Specificity in terms of $TP, FP, FN, TN$.', a: 'Precision conditions on predicted positives: $TP/(TP+FP)$. Recall (Sensitivity) conditions on actual positives: $TP/(TP+FN)$. Specificity ($\\text{TNR} = 1 - \\text{FPR}$) conditions on actual negatives: $TN/(TN+FP)$.' },
      { q: 'What is a Type I error ($\\alpha$) vs. a Type II error ($\\beta$), and how do they connect to FPR, Specificity, and Recall?', a: 'Type I error is a False Positive ($\\alpha = \\text{FPR} = FP/(FP+TN) = 1 - \\text{Specificity}$). Type II error is a False Negative ($\\beta = \\text{FNR} = FN/(TP+FN) = 1 - \\text{Recall}$).' },
      { q: 'Why does F1 use the harmonic mean $\\frac{2PR}{P+R}$ instead of the arithmetic mean $\\frac{P+R}{2}$?', a: 'A classifier that predicts positive on everything gets $R = 1.0, P \\approx 0$, which still scores $0.50$ under arithmetic mean but $\\approx 0$ under harmonic mean; harmonic mean punishes extreme imbalance between $P$ and $R$.' },
      { q: 'What is the probabilistic interpretation of ROC-AUC, and why does ROC-AUC stay unchanged when healthy negatives scale $10\\times$ while PR-AUC drops?', a: 'ROC-AUC equals $P(s(x_+) > s(x_-))$. Its axes ($\\text{TPR}$ and $\\text{FPR} = 1 - \\text{Specificity}$) normalize each class by its own row total, whereas PR-AUC uses $\\text{Precision} = \\frac{TP}{TP + FP}$, where $10\\times$ more false alarms crush precision.' },
      { q: 'On a dataset with $10$ positives and $990$ negatives ($1\\%$ base rate), what is the random-guessing baseline for ROC-AUC vs. PR-AUC?', a: 'Random guessing always scores $0.50$ on ROC-AUC regardless of class balance, but scores the positive base rate $\\pi = \\frac{10}{1000} = 0.01$ on PR-AUC.' },
      { q: 'How do you remember all 4 rates (TPR, FNR, TNR, FPR) as just two pairs that add to $100\\%$?', a: 'Group by the actual truth (denominator): 1) Real Positives ($TP+FN$): $\\text{TPR (Sensitivity/Recall)} + \\text{FNR (Miss rate)} = 100\\%$. 2) Real Negatives ($TN+FP$): $\\text{TNR (Specificity)} + \\text{FPR (False alarm rate)} = 100\\%$.' }
    ]
  },
  'linear-algebra-refresher.html': {
    title: '9. Linear Algebra for ML Refresher',
    cards: [
      { q: 'What is the geometric formula connecting the dot product $a \\cdot b$ to cosine similarity?', a: '$a \\cdot b = \\|a\\|_2 \\|b\\|_2 \\cos\\theta$, so cosine similarity is $\\frac{a \\cdot b}{\\|a\\|_2 \\|b\\|_2}$, which removes vector lengths and compares direction only.' },
      { q: 'Why does $L_1$ regularization produce sparse (exact-zero) weights while $L_2$ weight decay does not?', a: 'The derivative of $w^2$ is $2w$ (which vanishes near $0$), whereas the derivative of $|w|$ is $\\pm 1$ all the way to $0$, pushing small weights to exact zero.' },
      { q: 'If $Y = XW$ with $X$ of shape $(B, d_{\\text{in}})$ and $W$ of shape $(d_{\\text{in}}, d_{\\text{out}})$, what are the backprop shapes for $dX$ and $dW$?', a: '$dX = dY\\,W^\\top$ has shape $(B, d_{\\text{out}}) \\times (d_{\\text{out}}, d_{\\text{in}}) \\to (B, d_{\\text{in}})$, and $dW = X^\\top dY$ has shape $(d_{\\text{in}}, B) \\times (B, d_{\\text{out}}) \\to (d_{\\text{in}}, d_{\\text{out}})$.' },
      { q: 'How many parameters and what maximum rank does a LoRA update $\\Delta W = B A$ have when $B$ is $(d, r)$ and $A$ is $(r, d)$?', a: 'It has $2dr$ parameters (instead of $d^2$) and rank at most $r$, because every input passes through an $r$-dimensional bottleneck.' },
      { q: 'What is an eigenvector $v$ and eigenvalue $\\lambda$ of a square matrix $A$ in plain geometry?', a: 'A direction $v$ that does not rotate when multiplied by $A$ ($Av = \\lambda v$); $A$ simply stretches or shrinks $v$ by the factor $\\lambda$.' }
    ]
  },
  'feature-engineering.html': {
    title: '10. Feature Engineering',
    cards: [
      { q: 'Why do decision trees struggle with raw ratio relationships like $x_1 / x_2$ unless you engineer the ratio column explicitly?', a: 'Decision trees only make axis-aligned splits ($x_1 > c$ or $x_2 > d$), so approximating a diagonal slope $x_1 / x_2 > k$ requires a jagged staircase of dozens of splits that generalizes poorly.' },
      { q: 'Which models require feature standardization ($z = (x - \\mu)/\\sigma$) or log-transforms, and which are invariant to monotonic rescaling?', a: 'Linear/logistic regression, neural nets, SVMs, and k-NN depend on distances and gradients so they require scaling. Tree ensembles (XGBoost, Random Forest) only rank split order and are invariant to monotonic rescaling of single columns.' },
      { q: 'Write the smoothed Out-of-Fold Target Encoding formula for category $c$ and explain why both parts are required.', a: '$\\text{TE}(c) = \\frac{\\sum_{i \\in c_{\\text{oof}}} y_i + m \\cdot \\bar{y}}{n_c + m}$. Out-of-fold exclusion prevents target self-leakage, while $m$ virtual prior rows shrink rare categories toward the global mean $\\bar{y}$.' },
      { q: 'Why must cyclical features like hour-of-day $h \\in [0, 24)$ be encoded as $(\\sin(2\\pi h/24), \\cos(2\\pi h/24))$?', a: 'Raw integers place $23{:}00$ and $00{:}00$ at opposite ends ($|23-0|=23$). Mapping onto the unit circle makes adjacent hours close across midnight while $(\\sin, \\cos)$ uniquely identifies every angle.' }
    ]
  },
  'calibration.html': {
    title: '11. Probability Calibration',
    cards: [
      { q: 'What does it mean for a classifier\'s probabilities $\\hat{p}$ to be calibrated, and why can a model have ROC-AUC $= 0.95$ while being badly miscalibrated?', a: 'Calibration means $P(Y=1 \\mid \\hat{p} = p) = p$. ROC-AUC only checks pairwise rank order, so multiplying all probabilities by $0.1$ or pushing them to $0.001 / 0.999$ leaves ROC-AUC unchanged while ruining calibration.' },
      { q: 'How do Brier Score and Expected Calibration Error (ECE) measure probability quality?', a: 'Brier Score $\\frac{1}{N}\\sum (\\hat{p}_i - y_i)^2$ combines calibration and refinement (discrimination). ECE $\\sum_b \\frac{n_b}{N} |\\text{acc}(b) - \\text{conf}(b)|$ measures the weighted vertical gap between the reliability curve and the $y = x$ diagonal.' },
      { q: 'When should you choose Platt Scaling (Sigmoid / Temperature Scaling) vs. Isotonic Regression (PAVA)?', a: 'Use Platt/Temperature Scaling (1–2 parameters) when calibration data is small ($N < 1{,}000$) or distortion is sigmoidal. Use Isotonic Regression (non-parametric piecewise-constant) only when you have $N > 1{,}000\\text{–}2{,}000$ held-out samples.' },
      { q: 'Why do boosted trees and deep neural nets distort probabilities in opposite ways before calibration?', a: 'Boosted/bagged trees average or sum restricted votes, pushing scores away from $0$ and $1$ (under-confident, needing $a > 1$ Platt slope). Over-parameterized deep nets keep growing logits on separable training data, making softmax over-confident (needing Temperature $T > 1$).' }
    ]
  },
  'bias-variance.html': {
    title: '12. Overfitting, Underfitting & Bias-Variance',
    cards: [
      { q: 'Write the 3-term Bias-Variance decomposition of Expected Test MSE at input $x$.', a: '$\\mathbb{E}[(y - \\hat{f}(x))^2] = \\text{Bias}^2 + \\text{Variance} + \\sigma^2$, where $\\text{Bias}^2 = (\\bar{f}(x) - f(x))^2$, $\\text{Variance} = \\mathbb{E}[(\\hat{f}(x) - \\bar{f}(x))^2]$, and $\\sigma^2$ is irreducible noise.' },
      { q: 'How do you distinguish Underfitting from Overfitting using Training Error and Validation Error?', a: 'Underfitting (high bias): BOTH training and validation errors are high (tiny gap). Overfitting (high variance): training error is very low while validation error is high (wide generalization gap).' },
      { q: 'Why does adding $10\\times$ more training rows fail to fix an underfit (high-bias) model?', a: 'More rows only reduce Variance ($\\sim 1/N$) so the model estimates its best straight line more precisely, but a rigid model still cannot bend to match a curved true signal $f(x)$.' },
      { q: 'Across repeated training sets, a model predicts an average of $7$ for a true target of $10$, with prediction variance $2$ and noise variance $1$. What is its Expected Test MSE?', a: '$\\text{Bias}^2 = (7 - 10)^2 = 9$. Expected Test MSE $= 9\\ (\\text{Bias}^2) + 2\\ (\\text{Variance}) + 1\\ (\\text{Noise}) = 12$.' },
      { q: 'Why do Random Forests (bagging) use deep trees while Gradient Boosting uses shallow trees?', a: 'Averaging independent trees cuts Variance but leaves Bias unchanged, so Random Forests must start with low-bias deep trees. Boosting sequentially fixes errors to cut Bias, so it starts with low-variance shallow trees.' }
    ]
  },
  'calculus-refresher.html': {
    title: '13. Calculus for ML Refresher',
    cards: [
      { q: 'Why does Gradient Descent subtract the gradient ($w \\leftarrow w - \\eta \\nabla_w L$)?', a: 'Because the directional derivative $\\nabla L \\cdot u = \\|\\nabla L\\|_2 \\cos\\theta$ is maximized at $\\theta = 0^\\circ$ (steepest uphill) and most negative at $\\theta = 180^\\circ$ ($-\\nabla L$, steepest downhill).' },
      { q: 'In the multivariable chain rule, when do you multiply local derivatives vs. add them?', a: 'You multiply local derivatives along a sequential chain ($w \\to z \\to \\hat{y} \\to L$), and you add derivatives whenever a variable branches to feed multiple downstream paths.' },
      { q: 'What is the derivative of $\\sigma(z)$, and why does it cause vanishing gradients in deep networks?', a: '$\\sigma\'(z) = \\sigma(z)(1 - \\sigma(z))$, which is at most $0.25$ (at $z = 0$) and near $0$ for large $|z|$. Multiplying numbers $\\le 0.25$ across many layers shrinks gradients exponentially.' },
      { q: 'What is the gradient $\\frac{\\partial L}{\\partial z}$ of Cross-Entropy loss combined with Sigmoid or Softmax logits $z$?', a: '$\\frac{\\partial L}{\\partial z} = \\hat{p} - y$ (predicted probability minus true label), because the $1/\\hat{p}$ derivative of $-\\ln \\hat{p}$ cancels the $\\hat{p}(1 - \\hat{p})$ factor from sigmoid/softmax.' },
      { q: 'If a loss valley has second-derivative curvature $h = L\'\'(w) > 0$, what is the optimal 1-step learning rate and the maximum stable learning rate?', a: 'Optimal 1-step Newton learning rate is $\\eta = 1/h$; maximum stable learning rate before steps overshoot and diverge is $\\eta_{\\max} = 2/h$.' }
    ]
  },
  'backpropagation.html': {
    title: '14. Backpropagation From Scratch',
    cards: [
      { q: 'Why does backpropagation compute gradients for $d = 1{,}000{,}000$ weights in $O(1)$ passes while finite differences requires $O(d)$ passes?', a: 'Finite differences perturbs one weight at a time Forward $\\to$ Loss ($d + 1$ forward passes). Backpropagation caches intermediate values in $1$ forward pass and propagates sensitivities from the scalar loss $L$ backward to all $d$ weights in $1$ backward pass.' },
      { q: 'At a multiply gate $u = w \\cdot x$ receiving upstream gradient $\\bar{u} = \\frac{\\partial L}{\\partial u}$, what are $\\bar{w}$ and $\\bar{x}$?', a: 'They swap partners: $\\bar{w} = x \\cdot \\bar{u}$ and $\\bar{x} = w \\cdot \\bar{u}$. Consequently, a huge input $x$ produces a huge gradient on the weight $w$, and $x = 0$ gives $\\bar{w} = 0$.' },
      { q: 'At an add gate $z = u + b$ receiving upstream gradient $\\bar{z}$, and at a fan-out branch where variable $w$ feeds two paths $z_1$ and $z_2$, how do gradients flow backward?', a: 'Add gate distributes (copies) the upstream gradient unchanged to each input: $\\bar{u} = \\bar{z}$ and $\\bar{b} = \\bar{z}$. A fan-out branch adds the incoming gradients from all downstream paths: $\\bar{w} = \\bar{w}_1 + \\bar{w}_2$.' },
      { q: 'For a matrix linear layer $z = W x + b$ with $W \\in \\mathbb{R}^{m \\times n}$, $x \\in \\mathbb{R}^{n \\times 1}$, and upstream gradient $\\bar{z} \\in \\mathbb{R}^{m \\times 1}$, what are the exact formulas for $\\bar{W}$, $\\bar{x}$, and $\\bar{b}$?', a: 'By shape matching: $\\bar{W} = \\bar{z} x^\\top$ ($m \\times n$ outer product), $\\bar{x} = W^\\top \\bar{z}$ ($n \\times 1$), and $\\bar{b} = \\bar{z}$ ($m \\times 1$).' },
      { q: 'Why does neural network training require 3–4x more memory than inference?', a: 'Because $\\bar{W} = \\bar{z} x^\\top$ and activation derivatives depend on the forward activations $x$ and $z$. Training must keep every layer\'s intermediate forward activations cached in RAM/VRAM until the backward pass reaches that layer.' },
      { q: 'What is the architectural difference between a Dead ReLU and a Vanishing Sigmoid gradient, and how does a residual connection $h_\\ell = h_{\\ell-1} + F(h_{\\ell-1})$ prevent vanishing gradients?', a: 'A Dead ReLU has $z \\le 0$ so its local derivative is $0$. Sigmoid has max derivative $0.25$, so $L$ layers multiply $\\le 0.25^L \\to 0$. A residual block has local derivative $1 + F\'$, creating a $+1$ additive highway that carries upstream gradients straight through.' }
    ]
  },
  'lora.html': {
    title: '15. LoRA & QLoRA From Scratch',
    cards: [
      { q: 'Write the LoRA forward pass equation for a linear layer with frozen base weights $W_0 \\in \\mathbb{R}^{d \\times k}$, and state the shapes of $B$ and $A$.', a: '$h = W_0 x + \\frac{\\alpha}{r} B (A x)$, where $A$ has shape $(r \\times k)$ (down-projection) and $B$ has shape $(d \\times r)$ (up-projection), with rank $r \\ll \\min(d, k)$.' },
      { q: 'How are LoRA matrices $A$ and $B$ initialized at step 0, and why cannot both be initialized to zero?', a: '$A$ is initialized with random Gaussian/Kaiming noise and $B = 0$. That makes $\\Delta W = B A = 0$ at step $0$ while giving $B$ a nonzero gradient $\\bar{B} = \\frac{\\alpha}{r} \\bar{h} (Ax)^\\top$ on step $1$. If both $A=0$ and $B=0$, both gradients are $0$ forever.' },
      { q: 'Why does LoRA add zero inference latency after training, whereas classical serial bottleneck adapters add latency?', a: 'Because $B A x$ has no nonlinearity between $A$ and $B$. By linearity, $W_0 x + \\frac{\\alpha}{r} B A x = (W_0 + \\frac{\\alpha}{r} B A) x$, so we merge $W_{\\text{merged}} = W_0 + \\frac{\\alpha}{r} B A$ once offline.' },
      { q: 'For a $4096 \\times 4096$ matrix ($16{,}777{,}216$ weights), what is the parameter compression ratio of a rank $r = 8$ LoRA adapter?', a: '$\\text{Compression ratio} = \\frac{d \\cdot k}{r(d + k)} = \\frac{4096 \\times 4096}{8 \\times 8192} = 256\\times$ fewer trainable parameters ($65{,}536$ vs $16{,}777{,}216$).' },
      { q: 'Why does LoRA multiply $BAx$ by $\\frac{\\alpha}{r}$ instead of a fixed constant?', a: 'Summing $r$ rank-$1$ terms in $B A x$ causes the output and gradient magnitude to scale proportionally with $r$. Dividing by $r$ normalizes update magnitude so you can sweep $r$ without retuning the learning rate.' },
      { q: 'How does QLoRA reduce the VRAM required to fine-tune a 7B model from $\\sim 60+\\text{ GB}$ down to $\\sim 5\\text{–}7\\text{ GB}$?', a: '1) Freezes $W_0$ so $99\\%$ of weights need zero AdamW optimizer states. 2) Compresses frozen $W_0$ from 16-bit ($14\\text{ GB}$) to 4-bit NormalFloat4 (NF4) with double quantization ($\\sim 3.9\\text{ GB}$), dequantizing blocks to BF16 on the fly.' }
    ]
  }
};

var SRS_DECK_KEY = 'matt_learning_srs_deck_v2';
var SRS_REMOVED_KEY = 'matt_learning_srs_removed_v2';

function getSrsDayOffset() {
  try {
    return parseInt(localStorage.getItem(SRS_OFFSET_KEY) || '0', 10) || 0;
  } catch (e) {
    return 0;
  }
}

function setSrsDayOffset(days) {
  try {
    localStorage.setItem(SRS_OFFSET_KEY, String(Math.max(0, Math.round(days))));
  } catch (e) {}
}

function getSrsTodayDay() {
  return Math.floor(Date.now() / MS_PER_DAY) + getSrsDayOffset();
}

function formatSrsDueDate(dueDay) {
  var today = getSrsTodayDay();
  var diff = dueDay - today;
  if (diff <= 0) {
    return 'Today';
  }
  if (diff === 1) {
    return 'Tomorrow';
  }
  return 'In ' + diff + 'd';
}

/* Explicit user/AI SRS deck: { [id]: { id, q, a, source, reps, interval, ease, lapses, dueDay, addedAt, updatedAt } } */
function getSrsDeck() {
  try {
    var raw = localStorage.getItem(SRS_DECK_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveSrsDeck(deckMap, markDirty) {
  try {
    localStorage.setItem(SRS_DECK_KEY, JSON.stringify(deckMap));
    if (markDirty !== false) {
      localStorage.setItem(GIST_UPDATED_KEY, new Date().toISOString());
    }
  } catch (e) {}
}

function getSrsRemovedMap() {
  try {
    var raw = localStorage.getItem(SRS_REMOVED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveSrsRemovedMap(remMap) {
  try {
    localStorage.setItem(SRS_REMOVED_KEY, JSON.stringify(remMap));
  } catch (e) {}
}

function isCardInSrs(cardId) {
  var deck = getSrsDeck();
  return Boolean(deck[cardId]);
}

function addQuestionToSrs(cardId, qText, aText, sourceLabel) {
  var deck = getSrsDeck();
  var rem = getSrsRemovedMap();
  delete rem[cardId];
  saveSrsRemovedMap(rem);

  var today = getSrsTodayDay();
  var nowIso = new Date().toISOString();
  if (!deck[cardId]) {
    deck[cardId] = {
      id: cardId,
      q: qText,
      a: aText,
      source: sourceLabel || 'Article',
      reps: 0,
      interval: 0,
      ease: 2.50,
      lapses: 0,
      dueDay: today,
      lastGrade: null,
      addedAt: nowIso,
      updatedAt: nowIso
    };
  } else {
    deck[cardId].q = qText;
    deck[cardId].a = aText;
    if (sourceLabel) { deck[cardId].source = sourceLabel; }
    deck[cardId].updatedAt = nowIso;
  }
  saveSrsDeck(deck);
  pushStateToGist();
  refreshAllSrsButtons();
  if (typeof window.onSrsUpdated === 'function') { window.onSrsUpdated(cardId); }
  return deck[cardId];
}

function removeQuestionFromSrs(cardId) {
  var deck = getSrsDeck();
  var rem = getSrsRemovedMap();
  delete deck[cardId];
  rem[cardId] = new Date().toISOString();
  saveSrsRemovedMap(rem);
  saveSrsDeck(deck);
  pushStateToGist();
  refreshAllSrsButtons();
  if (typeof window.onSrsUpdated === 'function') { window.onSrsUpdated(cardId); }
}

function toggleArticleCardSrs(cardId, qText, aText, sourceLabel) {
  if (isCardInSrs(cardId)) {
    removeQuestionFromSrs(cardId);
    return false;
  } else {
    addQuestionToSrs(cardId, qText, aText, sourceLabel);
    return true;
  }
}

/* Pull AI-added cards from srs-cards.json in the repository (uses cached fallback when offline) */
function syncAiCardsFromRepo(callback) {
  fetch('srs-cards.json?t=' + Date.now())
    .then(function (res) {
      if (!res.ok) { throw new Error('HTTP ' + res.status); }
      return res.json();
    })
    .then(function (data) {
      if (!data || !Array.isArray(data.cards)) { return; }
      var deck = getSrsDeck();
      var rem = getSrsRemovedMap();
      var today = getSrsTodayDay();
      var changed = false;
      data.cards.forEach(function (c) {
        if (!c || !c.id || !c.q) { return; }
        if (rem[c.id]) { return; } /* User explicitly removed this card */
        if (!deck[c.id]) {
          deck[c.id] = {
            id: c.id,
            q: c.q,
            a: c.a || '',
            source: c.source || 'AI Added',
            reps: 0,
            interval: 0,
            ease: 2.50,
            lapses: 0,
            dueDay: today,
            lastGrade: null,
            addedAt: c.addedAt || '',
            updatedAt: c.updatedAt || ''
          };
          changed = true;
        }
      });
      if (changed) {
        saveSrsDeck(deck, false);
      }
      if (typeof window.onSrsUpdated === 'function') { window.onSrsUpdated(); }
      if (typeof callback === 'function') { callback(); }
    })
    .catch(function () {
      if (typeof callback === 'function') { callback(); }
    });
}

/* SM-2 4-button scheduler:
   grade: 'again' (1), 'hard' (2), 'good' (3), 'easy' (4) */
function computeSm2Next(prev, grade) {
  var reps = (prev && prev.reps) ? prev.reps : 0;
  var interval = (prev && prev.interval) ? prev.interval : 0;
  var ease = (prev && prev.ease) ? prev.ease : 2.50;
  var lapses = (prev && prev.lapses) ? prev.lapses : 0;
  var nextReps = reps;
  var nextInt = 1;
  var nextEase = ease;
  var nextLapses = lapses;

  if (grade === 'again') {
    nextReps = 0;
    nextInt = 1;
    nextEase = Math.max(1.30, Number((ease - 0.20).toFixed(2)));
    nextLapses = lapses + 1;
  } else if (grade === 'hard') {
    nextReps = Math.max(1, reps);
    nextInt = (reps === 0) ? 1 : Math.max(interval + 1, Math.round(interval * 1.2));
    nextEase = Math.max(1.30, Number((ease - 0.15).toFixed(2)));
  } else if (grade === 'good') {
    nextReps = reps + 1;
    if (nextReps === 1) { nextInt = 2; }
    else if (nextReps === 2) { nextInt = 5; }
    else { nextInt = Math.max(interval + 1, Math.round(interval * ease)); }
  } else if (grade === 'easy') {
    nextReps = reps + 1;
    nextEase = Number((ease + 0.15).toFixed(2));
    if (nextReps === 1) { nextInt = 4; }
    else if (nextReps === 2) { nextInt = 9; }
    else { nextInt = Math.max(interval + 2, Math.round(interval * nextEase * 1.3)); }
  }

  var today = getSrsTodayDay();
  return {
    reps: nextReps,
    interval: nextInt,
    ease: nextEase,
    lapses: nextLapses,
    dueDay: today + nextInt,
    lastGrade: grade,
    updatedAt: new Date().toISOString()
  };
}

function previewSm2Intervals(prev) {
  return {
    again: computeSm2Next(prev, 'again').interval,
    hard: computeSm2Next(prev, 'hard').interval,
    good: computeSm2Next(prev, 'good').interval,
    easy: computeSm2Next(prev, 'easy').interval
  };
}

function getCardStatusInfo(card) {
  var today = getSrsTodayDay();
  if (!card) {
    return { status: 'not-added', isDue: false, label: 'Not in SRS', diffDays: 9999, dateLabel: '' };
  }
  var dueDay = card.dueDay || today;
  var diff = dueDay - today;
  var dateLabel = formatSrsDueDate(dueDay);
  if (diff <= 0) {
    return {
      status: 'due',
      isDue: true,
      label: 'DUE TODAY',
      diffDays: diff,
      dateLabel: dateLabel
    };
  }
  return {
    status: 'scheduled',
    isDue: false,
    label: 'Due ' + dateLabel,
    diffDays: diff,
    dateLabel: dateLabel
  };
}

function gradeSrsCard(cardId, grade) {
  var deck = getSrsDeck();
  var card = deck[cardId];
  if (!card) { return null; }
  var next = computeSm2Next(card, grade);
  card.reps = next.reps;
  card.interval = next.interval;
  card.ease = next.ease;
  card.lapses = next.lapses;
  card.dueDay = next.dueDay;
  card.lastGrade = next.lastGrade;
  card.updatedAt = next.updatedAt;
  deck[cardId] = card;
  saveSrsDeck(deck);
  pushStateToGist();
  refreshAllSrsButtons();
  if (typeof window.onSrsUpdated === 'function') { window.onSrsUpdated(cardId, card); }
  return card;
}

function stepSrsDayOffset(deltaDays) {
  if (deltaDays === 0) {
    setSrsDayOffset(0);
  } else {
    setSrsDayOffset(getSrsDayOffset() + deltaDays);
  }
  refreshAllSrsButtons();
  if (typeof window.onSrsUpdated === 'function') { window.onSrsUpdated(); }
}

function getAllSrsCards() {
  var deck = getSrsDeck();
  var out = [];
  Object.keys(deck).forEach(function (id) {
    var c = deck[id];
    if (!c || !c.q) { return; }
    var info = getCardStatusInfo(c);
    out.push({
      id: id,
      q: c.q,
      a: c.a || '',
      source: c.source || 'Custom',
      reps: c.reps || 0,
      interval: c.interval || 0,
      ease: c.ease || 2.50,
      dueDay: c.dueDay || getSrsTodayDay(),
      info: info,
      card: c
    });
  });
  /* Sort due cards first, then soonest scheduled due date */
  out.sort(function (a, b) {
    if (a.info.isDue !== b.info.isDue) {
      return a.info.isDue ? -1 : 1;
    }
    return a.dueDay - b.dueDay;
  });
  return out;
}

window.SRS_LIBRARY = SRS_LIBRARY;
window.getSrsDeck = getSrsDeck;
window.getSrsDayOffset = getSrsDayOffset;
window.formatSrsDueDate = formatSrsDueDate;
window.isCardInSrs = isCardInSrs;
window.addQuestionToSrs = addQuestionToSrs;
window.removeQuestionFromSrs = removeQuestionFromSrs;
window.toggleArticleCardSrs = toggleArticleCardSrs;
window.syncAiCardsFromRepo = syncAiCardsFromRepo;
window.computeSm2Next = computeSm2Next;
window.previewSm2Intervals = previewSm2Intervals;
window.getCardStatusInfo = getCardStatusInfo;
window.gradeSrsCard = gradeSrsCard;
window.stepSrsDayOffset = stepSrsDayOffset;
window.getAllSrsCards = getAllSrsCards;

function getActivePageCards() {
  var here = location.pathname.split('/').pop() || 'index.html';
  if (typeof SPACED_CARDS !== 'undefined' && Array.isArray(SPACED_CARDS) && SPACED_CARDS.length > 0) {
    return SPACED_CARDS;
  }
  if (SRS_LIBRARY[here] && Array.isArray(SRS_LIBRARY[here].cards)) {
    return SRS_LIBRARY[here].cards;
  }
  return null;
}

function getCurrentArticleSourceTitle() {
  var here = location.pathname.split('/').pop() || 'article.html';
  if (SRS_LIBRARY[here] && SRS_LIBRARY[here].title) {
    return SRS_LIBRARY[here].title;
  }
  var h1 = document.querySelector('h1');
  return h1 ? h1.textContent.trim() : here;
}

/* Toggle an article recall card (by index) into/out of the user's SRS list */
function toggleRecallCardInSrs(idx) {
  var cards = getActivePageCards();
  if (!cards || !cards[idx]) { return; }
  var here = location.pathname.split('/').pop() || 'article.html';
  var cardId = here + '::card-' + idx;
  var cleanQ = cards[idx].q.replace(/^\[[0-9]+d\]\s*/, '');
  toggleArticleCardSrs(cardId, cleanQ, cards[idx].a, getCurrentArticleSourceTitle());
}
window.toggleRecallCardInSrs = toggleRecallCardInSrs;

/* Toggle an article MCQ comprehension check into/out of the user's SRS list */
function extractMcqQA(box) {
  var ps = box.querySelectorAll('p');
  var qText = '';
  for (var i = 0; i < ps.length; i++) {
    if (!ps[i].closest('.mcq-feedback') && !ps[i].closest('.mcq-option')) {
      qText = ps[i].innerHTML.trim();
      if (qText) { break; }
    }
  }
  var correctVal = box.getAttribute('data-correct');
  var rightOpt = correctVal ? box.querySelector('input[value="' + correctVal + '"]') : null;
  var optLabel = rightOpt ? rightOpt.closest('.mcq-option') : box.querySelector('.mcq-option[data-correct="true"]');
  var aText = '';
  if (optLabel) {
    var clone = optLabel.cloneNode(true);
    var inp = clone.querySelector('input');
    if (inp) { inp.remove(); }
    var why = (rightOpt && rightOpt.getAttribute('data-explain')) || optLabel.getAttribute('data-explain') || optLabel.getAttribute('data-why') || '';
    aText = '<strong>' + clone.innerHTML.trim() + '</strong>' + (why ? '<br>' + why : '');
  }
  return { q: qText || 'Comprehension Check', a: aText || 'See article check.' };
}

function toggleMcqInSrs(boxId) {
  var box = document.getElementById(boxId);
  if (!box) { return; }
  var here = location.pathname.split('/').pop() || 'article.html';
  var cardId = here + '::' + boxId;
  var qa = extractMcqQA(box);
  toggleArticleCardSrs(cardId, qa.q, qa.a, getCurrentArticleSourceTitle());
}
window.toggleMcqInSrs = toggleMcqInSrs;

function refreshAllSrsButtons() {
  renderSpacedCards();
  var here = location.pathname.split('/').pop() || 'article.html';
  var deck = getSrsDeck();
  document.querySelectorAll('.mcq-srs-btn').forEach(function (btn) {
    var boxId = btn.getAttribute('data-box-id');
    var cardId = here + '::' + boxId;
    var inSrs = Boolean(deck[cardId]);
    if (inSrs) {
      var info = getCardStatusInfo(deck[cardId]);
      btn.textContent = '\u2713 In SRS (' + info.dateLabel + ')';
      btn.className = 'srs-btn mcq-srs-btn srs-toggle-btn in-srs';
    } else {
      btn.textContent = '+ SRS';
      btn.className = 'srs-btn mcq-srs-btn srs-toggle-btn';
    }
  });
}

function renderSpacedCards() {
  var listEl = document.getElementById('spaced-list');
  var cards = getActivePageCards();
  if (!listEl || !cards) { return; }
  var here = location.pathname.split('/').pop() || 'article.html';
  var deck = getSrsDeck();

  listEl.innerHTML = cards.map(function (c, i) {
    var id = here + '::card-' + i;
    var cState = deck[id] || null;
    var inSrs = Boolean(cState);
    var info = getCardStatusInfo(cState);
    var cleanQ = c.q.replace(/^\[[0-9]+d\]\s*/, '');
    var badgeHtml = inSrs
      ? ' <span class="srs-badge ' + (info.isDue ? 'is-due' : 'is-scheduled') + '">' + info.dateLabel + '</span>'
      : '';
    var btnLabel = inSrs
      ? '\u2713 In SRS (' + info.dateLabel + ') \u00b7 Remove'
      : '+ Add to SRS';
    var btnClass = 'srs-btn srs-toggle-btn' + (inSrs ? ' in-srs' : '');

    return '<details class="recall-card" id="recall-card-' + i + '">' +
      '<summary>Card ' + (i + 1) + ': ' + cleanQ + badgeHtml + '</summary>' +
      '<p style="margin:0.5rem 0;">' + c.a + '</p>' +
      '<button type="button" class="' + btnClass + '" onclick="toggleRecallCardInSrs(' + i + ')">' + btnLabel + '</button>' +
    '</details>';
  }).join('');
  renderMathIn(listEl);
}

function copySpacedCards() {
  var cards = getActivePageCards();
  if (!cards) { return; }
  var text = cards.map(function (c, i) {
    return 'Q' + (i + 1) + ': ' + c.q.replace(/^\[[0-9]+d\]\s*/, '') + '\nA' + (i + 1) + ': ' + c.a;
  }).join('\n\n');
  var st = document.getElementById('copy-status');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      if (st) { st.textContent = 'Copied ' + cards.length + ' cards.'; }
    }, function () {
      if (st) { st.textContent = 'Clipboard blocked; select cards manually.'; }
    });
  } else if (st) {
    st.textContent = 'Clipboard unavailable in this browser.';
  }
}

/* ---------- Article Completion Tracking + GitHub Gist Sync ---------- */
var COMPLETED_KEY = 'matt_learning_completed_v1';
var UNCOMPLETED_KEY = 'matt_learning_uncompleted_v1';
var GIST_ID_KEY = 'matt_learning_gist_id';

function getUncompletedMap() {
  try {
    var raw = localStorage.getItem(UNCOMPLETED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
var GIST_TOKEN_KEY = 'matt_learning_gist_token';
var GIST_UPDATED_KEY = 'matt_learning_gist_updated_at';
var GEMINI_API_KEY_STORAGE = 'matt_learning_gemini_api_key';
var DEFAULT_GIST_ID = 'b270eaafff8dc051eca22cc33b394235';
var GIST_FILENAME = 'matt_learning_state.json';

function getGeminiApiKey() {
  try {
    return (localStorage.getItem(GEMINI_API_KEY_STORAGE) || '').trim();
  } catch (e) {
    return '';
  }
}

function setGeminiApiKey(k) {
  try {
    if (k && k.trim()) {
      localStorage.setItem(GEMINI_API_KEY_STORAGE, k.trim());
    } else {
      localStorage.removeItem(GEMINI_API_KEY_STORAGE);
    }
  } catch (e) {}
}
window.getGeminiApiKey = getGeminiApiKey;
window.setGeminiApiKey = setGeminiApiKey;

function getGistId() {
  try {
    return (localStorage.getItem(GIST_ID_KEY) || DEFAULT_GIST_ID).trim();
  } catch (e) {
    return DEFAULT_GIST_ID;
  }
}

function getGistToken() {
  try {
    return (localStorage.getItem(GIST_TOKEN_KEY) || '').trim();
  } catch (e) {
    return '';
  }
}

function setGistToken(tok) {
  try {
    if (tok && tok.trim()) {
      localStorage.setItem(GIST_TOKEN_KEY, tok.trim());
    } else {
      localStorage.removeItem(GIST_TOKEN_KEY);
    }
  } catch (e) {}
}
window.getGistToken = getGistToken;
window.setGistToken = setGistToken;
window.getGistId = getGistId;

/* Capture #sync=<token> or #gemini=<key> from URL so pairing Go 10.3 or Palma 3 is a 1-tap link */
function captureSyncTokenFromHash() {
  var tok = '';
  var gemKey = '';
  if (location.hash) {
    var m = location.hash.match(/[#&]sync=([^&]+)/);
    if (m && m[1]) { tok = decodeURIComponent(m[1]).trim(); }
    var gm = location.hash.match(/[#&](?:gemini|key)=([^&]+)/);
    if (gm && gm[1]) { gemKey = decodeURIComponent(gm[1]).trim(); }
  }
  if (location.search) {
    if (!tok) {
      var q = location.search.match(/[?&]sync=([^&]+)/);
      if (q && q[1]) { tok = decodeURIComponent(q[1]).trim(); }
    }
    if (!gemKey) {
      var gq = location.search.match(/[?&](?:gemini|key)=([^&]+)/);
      if (gq && gq[1]) { gemKey = decodeURIComponent(gq[1]).trim(); }
    }
  }
  if (tok) { setGistToken(tok); }
  if (gemKey) { setGeminiApiKey(gemKey); }
  if (tok || gemKey) {
    try {
      history.replaceState(null, document.title, location.pathname);
    } catch (e) {
      location.hash = '';
    }
    return true;
  }
  return false;
}

function promptGistTokenSetup() {
  var current = getGistToken();
  var val = window.prompt('Paste your GitHub token (or open your #sync=... pairing link) to enable 2-way Gist sync:', current || '');
  if (val !== null) {
    setGistToken(val);
    ensureGistWarningBanner();
    pullStateFromGist(function () {
      if (getGistToken()) { pushStateToGist(); }
    });
  }
}
window.promptGistTokenSetup = promptGistTokenSetup;

function ensureGistWarningBanner() {
  var existing = document.getElementById('gist-setup-banner');
  var tok = getGistToken();
  if (tok) {
    if (existing) { existing.style.display = 'none'; }
    return;
  }
  var mainEl = document.querySelector('main');
  if (!mainEl) { return; }
  if (!existing) {
    existing = document.createElement('div');
    existing.id = 'gist-setup-banner';
    existing.style.cssText = 'border:2px solid #000;background:#e8e8e8;padding:0.55rem 0.75rem;margin-bottom:0.75rem;font-size:0.85rem;display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;';
    existing.innerHTML =
      '<span><strong>Gist sync not set up on this browser</strong> (read-only mode — changes won\'t sync to cloud).Open your <code>#sync=...</code> pairing link or add a token.</span>' +
      '<button type="button" class="srs-btn" style="background:#000;color:#fff;padding:4px 10px;font-weight:bold;" onclick="promptGistTokenSetup()">Set Token</button>';
    mainEl.insertBefore(existing, mainEl.firstChild);
  } else {
    existing.style.display = 'flex';
  }
}
window.ensureGistWarningBanner = ensureGistWarningBanner;

function getCompletedMap() {
  try {
    var raw = localStorage.getItem(COMPLETED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function isArticleCompleted(file) {
  var map = getCompletedMap();
  return Boolean(map[file]);
}

function setSyncStatus(msg) {
  var el = document.getElementById('gist-sync-status');
  if (el) { el.textContent = msg; }
}

function setArticleCompleted(file, done) {
  var map = getCompletedMap();
  var uncomp = getUncompletedMap();
  var now = new Date().toISOString();
  if (done) {
    map[file] = now;
    delete uncomp[file];
  } else {
    delete map[file];
    uncomp[file] = now;
  }
  try {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(map));
    localStorage.setItem(UNCOMPLETED_KEY, JSON.stringify(uncomp));
    localStorage.setItem(GIST_UPDATED_KEY, now);
  } catch (e) {}
  pushStateToGist();
}

function toggleArticleCompleted(file) {
  var next = !isArticleCompleted(file);
  setArticleCompleted(file, next);
  return next;
}
window.toggleArticleCompleted = toggleArticleCompleted;
window.isArticleCompleted = isArticleCompleted;

function pullStateFromGist(callback) {
  var gistId = getGistId();
  if (!gistId) { return; }
  var headers = { 'Accept': 'application/vnd.github+json' };
  var tok = getGistToken();
  if (tok) { headers['Authorization'] = 'Bearer ' + tok; }

  setSyncStatus('Syncing with Gist...');
  fetch('https://api.github.com/gists/' + gistId + '?t=' + Date.now(), {
    method: 'GET',
    headers: headers,
    cache: 'no-store'
  })
    .then(function (res) {
      if (!res.ok) { throw new Error('HTTP ' + res.status); }
      return res.json();
    })
    .then(function (data) {
      if (!data || !data.files || !data.files[GIST_FILENAME]) {
        setSyncStatus('Gist connected (empty)');
        return;
      }
      var remoteState = JSON.parse(data.files[GIST_FILENAME].content || '{}');
      var remoteCompleted = remoteState.completed || {};
      var remoteUncompleted = remoteState.uncompleted || {};
      var remoteDeck = remoteState.srsDeck || {};
      var remoteRemoved = remoteState.srsRemoved || {};
      var localCompleted = getCompletedMap();
      var localUncompleted = getUncompletedMap();
      var localDeck = getSrsDeck();
      var localRemoved = getSrsRemovedMap();
      var localUpdated = '';
      try { localUpdated = localStorage.getItem(GIST_UPDATED_KEY) || ''; } catch (e) {}
      var remoteUpdated = remoteState.updatedAt || '';

      /* Merge removed tombstones first (newest timestamp wins) */
      var mergedRemoved = {};
      var k;
      for (k in remoteRemoved) { if (Object.prototype.hasOwnProperty.call(remoteRemoved, k)) { mergedRemoved[k] = remoteRemoved[k]; } }
      for (k in localRemoved) {
        if (Object.prototype.hasOwnProperty.call(localRemoved, k)) {
          if (!mergedRemoved[k] || localRemoved[k] > mergedRemoved[k]) {
            mergedRemoved[k] = localRemoved[k];
          }
        }
      }
      saveSrsRemovedMap(mergedRemoved);

      /* Merge SRS deck items (reviewed cards beat unreviewed seed cards; otherwise newest updatedAt wins) */
      var mergedDeck = {};
      for (k in remoteDeck) {
        if (Object.prototype.hasOwnProperty.call(remoteDeck, k) && !mergedRemoved[k]) {
          mergedDeck[k] = remoteDeck[k];
        }
      }
      for (k in localDeck) {
        if (Object.prototype.hasOwnProperty.call(localDeck, k) && !mergedRemoved[k]) {
          var loc = localDeck[k];
          var rem = mergedDeck[k];
          if (!rem) {
            mergedDeck[k] = loc;
          } else {
            var locReviewed = Boolean(loc.lastGrade || loc.reps > 0 || loc.lapses > 0);
            var remReviewed = Boolean(rem.lastGrade || rem.reps > 0 || rem.lapses > 0);
            if (locReviewed && !remReviewed) {
              mergedDeck[k] = loc;
            } else if (!locReviewed && remReviewed) {
              mergedDeck[k] = rem;
            } else if ((loc.updatedAt || '') >= (rem.updatedAt || '')) {
              mergedDeck[k] = loc;
            }
          }
        }
      }
      saveSrsDeck(mergedDeck, false);

      /* Merge uncompleted tombstones & completed articles (newest timestamp per article wins) */
      var mergedUncompleted = {};
      for (k in remoteUncompleted) {
        if (Object.prototype.hasOwnProperty.call(remoteUncompleted, k)) {
          mergedUncompleted[k] = remoteUncompleted[k];
        }
      }
      for (k in localUncompleted) {
        if (Object.prototype.hasOwnProperty.call(localUncompleted, k)) {
          if (!mergedUncompleted[k] || localUncompleted[k] > mergedUncompleted[k]) {
            mergedUncompleted[k] = localUncompleted[k];
          }
        }
      }

      var mergedCompleted = {};
      for (k in remoteCompleted) {
        if (Object.prototype.hasOwnProperty.call(remoteCompleted, k)) {
          mergedCompleted[k] = remoteCompleted[k];
        }
      }
      for (k in localCompleted) {
        if (Object.prototype.hasOwnProperty.call(localCompleted, k)) {
          if (!mergedCompleted[k] || localCompleted[k] > mergedCompleted[k]) {
            mergedCompleted[k] = localCompleted[k];
          }
        }
      }
      /* Apply uncompleted tombstones if uncompleted timestamp is newer than completed timestamp */
      for (k in mergedUncompleted) {
        if (Object.prototype.hasOwnProperty.call(mergedUncompleted, k)) {
          if (mergedCompleted[k] && mergedUncompleted[k] > mergedCompleted[k]) {
            delete mergedCompleted[k];
          }
        }
      }

      var chosen = mergedCompleted;
      try {
        localStorage.setItem(COMPLETED_KEY, JSON.stringify(chosen));
        localStorage.setItem(UNCOMPLETED_KEY, JSON.stringify(mergedUncompleted));
        if (remoteUpdated && (!localUpdated || remoteUpdated > localUpdated)) {
          localStorage.setItem(GIST_UPDATED_KEY, remoteUpdated);
        }
      } catch (e) {}

      /* Push back to Gist if local had newer offline edits, completions, or SRS reviews */
      var needsPush = (localUpdated && (!remoteUpdated || localUpdated > remoteUpdated)) ||
        Object.keys(chosen).length !== Object.keys(remoteCompleted).length ||
        Object.keys(mergedDeck).length !== Object.keys(remoteDeck).length;
      if (needsPush) {
        pushStateToGist();
      }

      var count = Object.keys(chosen).length;
      setSyncStatus('Gist synced (' + count + ' completed, ' + Object.keys(mergedDeck).length + ' SRS)' + (tok ? ' \u00b7 R/W' : ' \u00b7 Read-only'));
      updateArticleCompleteBox();
      refreshAllSrsButtons();
      if (typeof renderHomeList === 'function') { renderHomeList(); }
      if (typeof window.onSrsUpdated === 'function') { window.onSrsUpdated(); }
      if (typeof callback === 'function') { callback(chosen); }
    })
    .catch(function (err) {
      setSyncStatus('Gist offline (' + (err && err.message ? err.message : 'cached') + ')');
      if (typeof callback === 'function') { callback(getCompletedMap()); }
    });
}

function pushStateToGist(callback) {
  var gistId = getGistId();
  var tok = getGistToken();
  if (!gistId || !tok) {
    setSyncStatus('Local saved (Add token in Gist Sync to push)');
    return;
  }
  var now = new Date().toISOString();
  var map = getCompletedMap();
  var uncomp = getUncompletedMap();
  var srsDeck = getSrsDeck();
  var srsRemoved = getSrsRemovedMap();
  var payload = {
    version: 2,
    updatedAt: now,
    completedCount: Object.keys(map).length,
    completed: map,
    uncompleted: uncomp,
    srsCount: Object.keys(srsDeck).length,
    srsDeck: srsDeck,
    srsRemoved: srsRemoved
  };
  var body = { files: {} };
  body.files[GIST_FILENAME] = { content: JSON.stringify(payload, null, 2) };

  setSyncStatus('Saving to Gist...');
  fetch('https://api.github.com/gists/' + gistId, {
    method: 'PATCH',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': 'Bearer ' + tok,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
    .then(function (res) {
      if (!res.ok) { throw new Error('HTTP ' + res.status); }
      return res.json();
    })
    .then(function () {
      try { localStorage.setItem(GIST_UPDATED_KEY, now); } catch (e) {}
      setSyncStatus('Gist saved (' + Object.keys(map).length + ' completed) \u00b7 R/W');
      if (typeof callback === 'function') { callback(true); }
    })
    .catch(function (err) {
      setSyncStatus('Gist push failed (' + (err && err.message ? err.message : 'network') + ')');
      if (typeof callback === 'function') { callback(false); }
    });
}
window.pullStateFromGist = pullStateFromGist;
window.pushStateToGist = pushStateToGist;

function updateArticleCompleteBox() {
  var here = location.pathname.split('/').pop() || 'index.html';
  var btn = document.getElementById('article-complete-btn');
  var statusEl = document.getElementById('article-complete-status');
  if (!btn) { return; }
  var done = isArticleCompleted(here);
  if (done) {
    btn.textContent = '\u2713 Completed (Tap to Undo)';
    btn.className = 'btn is-complete';
    if (statusEl) { statusEl.textContent = 'Moved to the Completed tab on the home screen.'; }
  } else {
    btn.textContent = 'Mark as Complete';
    btn.className = 'btn';
    if (statusEl) { statusEl.textContent = 'Finished reading this article?'; }
  }
}

/* ---------- Shared Header & Footer Injection ---------- */
function ensureHeaderAndFooter() {
  var here = location.pathname.split('/').pop() || 'index.html';
  var isIndex = (here === 'index.html' || here === '');
  var isImbalancePart = SERIES.some(function (s) { return s.file === here; });

  var hdr = document.querySelector('header');
  if (isIndex) {
    if (hdr) { hdr.remove(); }
    return;
  }
  if (!hdr) {
    hdr = document.createElement('header');
    hdr.id = 'top';
    var navHtml = '<div class="nav-links"><a href="index.html">&larr; All Articles</a>' +
      (isImbalancePart ? '<a href="class-imbalance.html">Series Overview</a>' : '') +
      '</div>';
    hdr.innerHTML =
      '<div class="header-inner">' +
        navHtml +
      '</div>';
    document.body.insertBefore(hdr, document.body.firstChild);
  } else {
    if (!hdr.id) { hdr.id = 'top'; }
    var fc = hdr.querySelector('.font-controls');
    if (fc) { fc.remove(); }
    var st = hdr.querySelector('.site-title');
    if (st) { st.remove(); }
  }

  var mainEl = document.querySelector('main');
  if (!isIndex && mainEl) {
    if (!document.querySelector('footer.article-footer') && !document.getElementById('prev-next')) {
      var ftr = document.createElement('footer');
      ftr.className = 'article-footer';
      ftr.innerHTML = '<a href="index.html">&larr; All Articles</a><a href="#top">&uarr; Back to top</a>';
      mainEl.appendChild(ftr);
    }
    if (!document.getElementById('article-complete-box')) {
      var cbox = document.createElement('div');
      cbox.id = 'article-complete-box';
      cbox.className = 'article-complete-box';
      cbox.innerHTML =
        '<span class="complete-status-text" id="article-complete-status">Finished reading this article?</span>' +
        '<button type="button" class="btn" id="article-complete-btn">Mark as Complete</button>';
      var anchor = document.getElementById('prev-next') || document.querySelector('footer.article-footer');
      if (anchor && anchor.parentNode === mainEl) {
        mainEl.insertBefore(cbox, anchor);
      } else {
        mainEl.appendChild(cbox);
      }
      var cbtn = document.getElementById('article-complete-btn');
      if (cbtn) {
        cbtn.addEventListener('click', function () {
          toggleArticleCompleted(here);
          updateArticleCompleteBox();
        });
      }
      updateArticleCompleteBox();
    }
  }
}

/* ---------- Ask Gemini Overlay ('c' shortcut + floating search icon) ---------- */
var GEMINI_MODEL_PRIMARY = 'gemini-3.5-flash-lite';
var GEMINI_MODEL_FALLBACK = 'gemini-3.1-flash-lite';
var geminiChatTurns = [];
var geminiPageIdx = 0;
var geminiBusy = false;
var geminiCachedPageContext = null;

function isTypingInEditable(target) {
  var el = target || document.activeElement;
  if (!el || !el.tagName) { return false; }
  var tag = el.tagName.toLowerCase();
  if (tag === 'textarea' || tag === 'select' || el.isContentEditable) { return true; }
  if (tag === 'input') {
    var t = (el.getAttribute('type') || 'text').toLowerCase();
    return t !== 'radio' && t !== 'checkbox' && t !== 'range' && t !== 'button' && t !== 'submit' && t !== 'reset';
  }
  return false;
}

function extractCleanText(node) {
  if (!node) { return ''; }
  var clone = node.cloneNode(true);
  if (clone.querySelectorAll) {
    clone.querySelectorAll('#gemini-ask-overlay, #gemini-ask-fab, #popover-box, script, style, .katex-html').forEach(function (n) {
      n.remove();
    });
    /* Include live input/select/slider values inline */
    var origInputs = node.querySelectorAll ? node.querySelectorAll('input, select, textarea') : [];
    var cloneInputs = clone.querySelectorAll('input, select, textarea');
    for (var i = 0; i < origInputs.length && i < cloneInputs.length; i++) {
      var oi = origInputs[i];
      var ci = cloneInputs[i];
      var t = (oi.getAttribute('type') || '').toLowerCase();
      if (t === 'radio' || t === 'checkbox') {
        if (oi.checked) {
          ci.replaceWith(document.createTextNode('[SELECTED: ' + (oi.value || 'checked') + '] '));
        } else {
          ci.remove();
        }
      } else if (oi.value) {
        ci.replaceWith(document.createTextNode('[VALUE: ' + oi.value + '] '));
      }
    }
  }
  return (clone.textContent || '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function getVisibleViewportContext() {
  var root = document.querySelector('main') || document.body;
  var vh = window.innerHeight || document.documentElement.clientHeight || 800;
  var blocks = root.querySelectorAll('h1, h2, h3, p, li, .tldr, .worked, .math-block, .refutation, .callout, .interactive-card, .mcq-box, .srs-list-item, .article-row, table');
  var visibleLines = [];
  var currentHeading = '';
  var seen = [];

  for (var i = 0; i < blocks.length; i++) {
    var el = blocks[i];
    if (el.closest('#gemini-ask-overlay') || el.closest('#gemini-ask-fab')) { continue; }
    var style = window.getComputedStyle ? window.getComputedStyle(el) : null;
    if (style && (style.display === 'none' || style.visibility === 'hidden')) { continue; }
    var rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) { continue; }

    var tag = el.tagName.toLowerCase();
    if ((tag === 'h1' || tag === 'h2' || tag === 'h3') && rect.top <= vh * 0.7) {
      currentHeading = extractCleanText(el);
    }

    /* Element overlaps the current viewport */
    if (rect.bottom > 0 && rect.top < vh) {
      /* Skip if an ancestor is already in seen[] to avoid duplicating text */
      var hasAncestor = seen.some(function (anc) { return anc !== el && anc.contains(el); });
      if (hasAncestor) { continue; }
      seen.push(el);
      var txt = extractCleanText(el);
      if (txt) { visibleLines.push(txt); }
    }
  }

  var out = '';
  if (currentHeading) {
    out += 'Active Section Heading: ' + currentHeading + '\n';
  }
  if (popBox && popBox.style.display === 'block') {
    var popTxt = extractCleanText(popBox);
    if (popTxt) { out += 'Currently Open Glossary Popover: ' + popTxt + '\n'; }
  }
  out += visibleLines.join('\n\n');
  if (out.length > 4500) {
    out = out.slice(0, 4500) + '\n...[viewport truncated]';
  }
  return out.trim();
}

function getPageContextForGemini() {
  var title = document.title || '';
  var h1 = document.querySelector('h1');
  if (h1 && h1.textContent) { title = h1.textContent.trim(); }
  var root = document.querySelector('main') || document.body;
  var rawText = extractCleanText(root);
  if (rawText.length > 24000) {
    rawText = rawText.slice(0, 24000) + '\n...[truncated]';
  }
  var viewportText = getVisibleViewportContext();
  var sel = '';
  try {
    sel = (window.getSelection && String(window.getSelection()).trim()) || '';
  } catch (e) {}

  var glossLines = [];
  if (typeof GLOSSARY === 'object' && GLOSSARY) {
    Object.keys(GLOSSARY).forEach(function (k) {
      var g = GLOSSARY[k];
      if (g && g.title && g.body) {
        var cleanBody = g.body.replace(/<[^>]+>/g, '');
        glossLines.push('- ' + g.title + ': ' + cleanBody);
      }
    });
  }

  var ctx = 'Page Title: ' + title + '\nURL: ' + (location.pathname.split('/').pop() || 'index.html');
  if (sel) {
    ctx += '\n\n=== USER SELECTED TEXT ===\n' + sel;
  }
  if (viewportText) {
    ctx += '\n\n=== CURRENTLY VISIBLE ON USER\'S SCREEN (VIEWPORT) ===\n' +
      '(When the user says "this", "here", "this equation", "this question", or "this widget", prioritize what is currently on their screen below):\n' +
      viewportText;
  }
  ctx += '\n\n=== FULL PAGE CONTENT ===\n' + rawText;
  if (glossLines.length) {
    ctx += '\n\n=== PAGE GLOSSARY ===\n' + glossLines.join('\n');
  }
  return ctx;
}

function formatGeminiHtml(raw) {
  var safe = String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  /* Convert ```code``` blocks */
  safe = safe.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, function (_, _lang, code) {
    return '<pre><code>' + code.trim() + '</code></pre>';
  });
  /* Convert inline `code` */
  safe = safe.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  /* Convert **bold** */
  safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  /* Convert paragraphs & bullet lists */
  var blocks = safe.split(/\n{2,}/);
  return blocks.map(function (b) {
    var trimmed = b.trim();
    if (!trimmed) { return ''; }
    if (trimmed.indexOf('<pre>') === 0) { return trimmed; }
    var lines = trimmed.split('\n');
    var isList = lines.every(function (l) { return /^(\*|-|\d+\.)\s+/.test(l.trim()); });
    if (isList) {
      var items = lines.map(function (l) {
        return '<li>' + l.trim().replace(/^(\*|-|\d+\.)\s+/, '') + '</li>';
      }).join('');
      return '<ul>' + items + '</ul>';
    }
    return '<p>' + lines.join('<br>') + '</p>';
  }).join('');
}

function renderGeminiMessages() {
  var box = document.getElementById('gemini-ask-messages');
  var nav = document.getElementById('gemini-ask-nav');
  if (!box) { return; }
  if (geminiChatTurns.length === 0) {
    box.className = 'gemini-ask-messages';
    box.innerHTML = '';
    if (nav) { nav.style.display = 'none'; }
    return;
  }
  if (geminiPageIdx < 0) { geminiPageIdx = 0; }
  if (geminiPageIdx >= geminiChatTurns.length) { geminiPageIdx = geminiChatTurns.length - 1; }
  var turn = geminiChatTurns[geminiPageIdx];

  if (nav) {
    if (geminiChatTurns.length > 1) {
      nav.style.display = 'flex';
      var prevBtn = document.getElementById('gemini-page-prev');
      var nextBtn = document.getElementById('gemini-page-next');
      var countEl = document.getElementById('gemini-page-count');
      if (prevBtn) { prevBtn.disabled = geminiPageIdx === 0; }
      if (nextBtn) { nextBtn.disabled = geminiPageIdx === geminiChatTurns.length - 1; }
      if (countEl) { countEl.textContent = (geminiPageIdx + 1) + ' / ' + geminiChatTurns.length; }
    } else {
      nav.style.display = 'none';
    }
  }

  box.className = 'gemini-ask-messages has-turns';
  var qHtml = '<p>' + String(turn.q || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</p>';
  var aHtml = formatGeminiHtml(turn.a || '');
  box.innerHTML =
    '<div class="gemini-msg gemini-msg-user">' +
      '<div class="gemini-msg-body">' + qHtml + '</div>' +
    '</div>' +
    '<div class="gemini-msg gemini-msg-model">' +
      '<div class="gemini-msg-body">' + aHtml + '</div>' +
    '</div>';
  renderMathIn(box);
  box.scrollTop = 0;
}

function ensureGeminiAskDOM() {
  if (!document.getElementById('gemini-ask-fab')) {
    var fab = document.createElement('button');
    fab.type = 'button';
    fab.id = 'gemini-ask-fab';
    fab.setAttribute('aria-label', 'Ask Gemini Hydrogen (c)');
    fab.setAttribute('title', 'Ask Gemini Hydrogen (c)');
    fab.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">' +
        '<circle cx="10.5" cy="10.5" r="6.5"></circle>' +
        '<line x1="15.5" y1="15.5" x2="21" y2="21"></line>' +
      '</svg>';
    fab.addEventListener('click', function () {
      toggleGeminiAskModal();
    });
    document.body.appendChild(fab);
  }

  if (!document.getElementById('gemini-ask-overlay')) {
    var ov = document.createElement('div');
    ov.id = 'gemini-ask-overlay';
    ov.setAttribute('role', 'region');
    ov.setAttribute('aria-label', 'Ask Gemini Hydrogen');
    ov.innerHTML =
      '<div class="gemini-ask-nav" id="gemini-ask-nav" style="display:none;">' +
        '<button type="button" id="gemini-page-prev" aria-label="Previous question">&#x2039;</button>' +
        '<span class="gemini-page-count" id="gemini-page-count">1 / 1</span>' +
        '<button type="button" id="gemini-page-next" aria-label="Next question">&#x203A;</button>' +
      '</div>' +
      '<div class="gemini-ask-messages" id="gemini-ask-messages"></div>' +
      '<form class="gemini-ask-form" id="gemini-ask-form">' +
        '<input type="text" id="gemini-ask-input" placeholder="Ask Gemini..." autocomplete="off" />' +
        '<button type="submit" id="gemini-ask-send" aria-label="Send">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">' +
            '<line x1="12" y1="19" x2="12" y2="5"></line>' +
            '<polyline points="5 12 12 5 19 12"></polyline>' +
          '</svg>' +
        '</button>' +
        '<button type="button" id="gemini-ask-close" aria-label="Close" title="Close (c)">&times;</button>' +
      '</form>';
    document.body.appendChild(ov);

    document.getElementById('gemini-ask-close').addEventListener('click', closeGeminiAskModal);
    document.getElementById('gemini-page-prev').addEventListener('click', function () {
      if (geminiPageIdx > 0) {
        geminiPageIdx--;
        renderGeminiMessages();
      }
    });
    document.getElementById('gemini-page-next').addEventListener('click', function () {
      if (geminiPageIdx < geminiChatTurns.length - 1) {
        geminiPageIdx++;
        renderGeminiMessages();
      }
    });
    var form = document.getElementById('gemini-ask-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitGeminiQuestion();
    });
  }
}

function isGeminiAskOpen() {
  var ov = document.getElementById('gemini-ask-overlay');
  return Boolean(ov && ov.classList.contains('open'));
}

function openGeminiAskModal() {
  ensureGeminiAskDOM();
  var ov = document.getElementById('gemini-ask-overlay');
  var fab = document.getElementById('gemini-ask-fab');
  if (ov) { ov.classList.add('open'); }
  if (fab) { fab.classList.add('is-open'); }
  renderGeminiMessages();
  var sel = '';
  try {
    sel = (window.getSelection && String(window.getSelection()).trim()) || '';
  } catch (e) {}
  var inp = document.getElementById('gemini-ask-input');
  if (inp) {
    if (sel && !inp.value.trim()) {
      inp.value = 'Regarding "' + sel.slice(0, 240) + '": ';
    }
    setTimeout(function () {
      inp.focus();
      try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch (e) {}
    }, 10);
  }
}

function closeGeminiAskModal() {
  var ov = document.getElementById('gemini-ask-overlay');
  var fab = document.getElementById('gemini-ask-fab');
  var inp = document.getElementById('gemini-ask-input');
  if (inp) {
    inp.value = '';
    inp.blur();
  }
  geminiChatTurns = [];
  geminiPageIdx = 0;
  renderGeminiMessages();
  if (ov) { ov.classList.remove('open'); }
  if (fab) { fab.classList.remove('is-open'); }
}

function toggleGeminiAskModal() {
  if (isGeminiAskOpen()) {
    closeGeminiAskModal();
  } else {
    openGeminiAskModal();
  }
}
window.openGeminiAskModal = openGeminiAskModal;
window.closeGeminiAskModal = closeGeminiAskModal;
window.toggleGeminiAskModal = toggleGeminiAskModal;

function createSrsCardWithGemini(userPrompt, callback) {
  var apiKey = getGeminiApiKey();
  if (!apiKey) {
    var entered = window.prompt('Paste your Gemini API key (saved ONLY to this device\'s localStorage):', '');
    if (!entered || !entered.trim()) {
      if (typeof callback === 'function') { callback(new Error('API key required.')); }
      return;
    }
    apiKey = entered.trim();
    setGeminiApiKey(apiKey);
  }

  var sysText =
    'You create concise, high-signal spaced-repetition flashcard questions and answers for an ML & math learning library. ' +
    'Follow these rules:\n' +
    '1. Every calculation must be solvable mentally without a calculator (use clean small numbers if math is involved).\n' +
    '2. Write plain, direct English with LaTeX math in $...$ where helpful.\n' +
    '3. Keep the question clear and specific, and the answer concise (1-3 sentences).\n' +
    '4. Return ONLY valid JSON with two keys: {"q": "Question text...", "a": "Answer text..."} and no markdown fences.';

  var contents = [{
    role: 'user',
    parts: [{ text: 'Create one spaced-repetition Q&A card based on this request: ' + userPrompt }]
  }];

  callGeminiGenerate(GEMINI_MODEL_PRIMARY, apiKey, sysText, contents, 1)
    .then(function (res) {
      var raw = (res.text || '').trim();
      /* Strip ```json ... ``` fences if present */
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      var parsed = null;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        var m = raw.match(/\{[\s\S]*\}/);
        if (m) {
          try { parsed = JSON.parse(m[0]); } catch (e2) {}
        }
      }
      if (!parsed || !parsed.q || !parsed.a) {
        throw new Error('Could not parse Q&A from AI response.');
      }
      var cardId = 'ai-custom-' + Date.now();
      var card = addQuestionToSrs(cardId, String(parsed.q).trim(), String(parsed.a).trim(), 'AI Created');
      if (typeof callback === 'function') { callback(null, card); }
    })
    .catch(function (err) {
      if (err && (err.status === 400 || err.status === 401 || err.status === 403) && /api key|unauthenticated|credential/i.test(err.message || '')) {
        setGeminiApiKey('');
      }
      if (typeof callback === 'function') { callback(err); }
    });
}
window.createSrsCardWithGemini = createSrsCardWithGemini;

function callGeminiGenerate(modelName, apiKey, systemText, contents, attempt) {
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(modelName) + ':generateContent?key=' + encodeURIComponent(apiKey);
  var genCfg = { temperature: 0.3 };
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemText }] },
      contents: contents,
      generationConfig: genCfg
    })
  }).then(function (res) {
    return res.json().catch(function () { return {}; }).then(function (data) {
      if (!res.ok) {
        var status = res.status;
        var msg = (data && data.error && data.error.message) ? data.error.message : ('HTTP ' + status);
        var err = new Error(msg);
        err.status = status;
        throw err;
      }
      var parts = (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
      var textOut = parts.map(function (p) { return p.text || ''; }).join('').trim();
      if (!textOut) { throw new Error('Empty response from ' + modelName); }
      return { text: textOut, model: modelName };
    });
  }).catch(function (err) {
    var tries = attempt || 1;
    if ((err.status === 503 || err.status === 429) && tries < 2) {
      return new Promise(function (resolve) { setTimeout(resolve, 900); }).then(function () {
        return callGeminiGenerate(modelName, apiKey, systemText, contents, tries + 1);
      });
    }
    if ((err.status === 503 || err.status === 429 || err.status === 404) && modelName === GEMINI_MODEL_PRIMARY) {
      return callGeminiGenerate(GEMINI_MODEL_FALLBACK, apiKey, systemText, contents, 1);
    }
    throw err;
  });
}

function submitGeminiQuestion() {
  if (geminiBusy) { return; }
  var inp = document.getElementById('gemini-ask-input');
  var sendBtn = document.getElementById('gemini-ask-send');
  if (!inp) { return; }
  var q = inp.value.trim();
  if (!q) { return; }

  var apiKey = getGeminiApiKey();
  if (!apiKey || q.toLowerCase() === '/key') {
    var entered = window.prompt('Paste your Gemini API key (saved ONLY to this device\'s localStorage, never GitHub or Gist):', apiKey || '');
    if (!entered || !entered.trim()) { return; }
    apiKey = entered.trim();
    setGeminiApiKey(apiKey);
    if (q.toLowerCase() === '/key') {
      inp.value = '';
      return;
    }
  }

  inp.value = '';
  var pendingIdx = geminiChatTurns.push({
    q: q,
    a: 'Thinking...',
    modelLabel: 'Gemini 4 Hydrogen'
  }) - 1;
  geminiPageIdx = pendingIdx;
  geminiBusy = true;
  if (sendBtn) { sendBtn.disabled = true; }
  renderGeminiMessages();

  var sysPrompt =
    'You are a concise, direct technical tutor helping the reader understand the following interactive learning page. ' +
    'Answer directly in plain English with concrete numbers when helpful. Use $...$ or $$...$$ for LaTeX math. ' +
    'Keep answers compact and easy to scan on an E-ink screen.\n\n' +
    getPageContextForGemini();

  var contents = [];
  for (var i = 0; i < pendingIdx; i++) {
    var turn = geminiChatTurns[i];
    if (!turn.isError) {
      contents.push({
        role: 'user',
        parts: [{ text: turn.q }]
      });
      contents.push({
        role: 'model',
        parts: [{ text: turn.a }]
      });
    }
  }
  contents.push({
    role: 'user',
    parts: [{ text: q }]
  });

  callGeminiGenerate(GEMINI_MODEL_PRIMARY, apiKey, sysPrompt, contents, 1)
    .then(function (res) {
      var label = res.model === GEMINI_MODEL_PRIMARY
        ? 'Gemini 4 Hydrogen'
        : ('Gemini 4 Hydrogen (via ' + res.model + ')');
      if (geminiChatTurns[pendingIdx]) {
        geminiChatTurns[pendingIdx] = {
          q: q,
          a: res.text,
          modelLabel: label
        };
      }
    })
    .catch(function (err) {
      var msg = (err && err.message) ? err.message : 'Request failed.';
      if (err && (err.status === 400 || err.status === 401 || err.status === 403) && /api key|unauthenticated|credential/i.test(msg)) {
        setGeminiApiKey('');
        msg += ' (Cleared old key — ask again or type /key to paste your new Gemini API key.)';
      }
      if (geminiChatTurns[pendingIdx]) {
        geminiChatTurns[pendingIdx] = {
          q: q,
          a: 'Error: ' + msg,
          modelLabel: 'Gemini 4 Hydrogen',
          isError: true
        };
      }
    })
    .then(function () {
      geminiBusy = false;
      if (sendBtn) { sendBtn.disabled = false; }
      renderGeminiMessages();
      /* Blur input after sending so pressing 'c' on the physical keyboard immediately closes the popup while reading */
      if (inp) { inp.blur(); }
    });
}

/* ---------- DOMContentLoaded Initialization ---------- */
document.addEventListener('DOMContentLoaded', function () {
  var capturedNewToken = captureSyncTokenFromHash();
  ensureHeaderAndFooter();
  ensureGistWarningBanner();
  ensurePopoverDOM();
  ensureGeminiAskDOM();
  applyFontSize(currentFontSize);
  pullStateFromGist(function () {
    syncAiCardsFromRepo(function () {
      if (capturedNewToken) {
        pushStateToGist();
      }
    });
  });
  window.addEventListener('online', function () {
    pullStateFromGist();
  });

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
    if (e.key === 'Escape') {
      if (isGeminiAskOpen()) {
        e.preventDefault();
        closeGeminiAskModal();
        return;
      }
      closePopover();
    }
    if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (!isTypingInEditable(e.target)) {
        e.preventDefault();
        toggleGeminiAskModal();
        return;
      }
    }
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
    if (!isInstant && box.hasAttribute('data-correct') && !box.querySelector('button:not(.mcq-srs-btn)')) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn';
      btn.textContent = 'Check answer';
      btn.addEventListener('click', function () { checkMCQ(boxId); });
      box.insertBefore(btn, fb);
    }

    /* 4b. Add "+ Add to SRS" toggle button on every MCQ comprehension check */
    if (!box.querySelector('.mcq-srs-btn')) {
      var srsBtn = document.createElement('button');
      srsBtn.type = 'button';
      srsBtn.className = 'btn btn-small mcq-srs-btn srs-toggle-btn';
      srsBtn.setAttribute('data-box-id', boxId);
      srsBtn.style.marginLeft = '8px';
      srsBtn.addEventListener('click', function () {
        toggleMcqInSrs(boxId);
      });
      box.insertBefore(srsBtn, fb);
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

  /* Auto-inject or populate #spaced-widget chrome on any article with cards */
  var hereFile = location.pathname.split('/').pop() || 'index.html';
  var sw = document.getElementById('spaced-widget');
  if (!sw && !document.getElementById('spaced-list') && getActivePageCards() && hereFile !== 'index.html') {
    var mainContainer = document.querySelector('main');
    if (mainContainer) {
      sw = document.createElement('div');
      sw.className = 'interactive-card';
      sw.id = 'spaced-widget';
      var cboxAnchor = document.getElementById('article-complete-box') || document.querySelector('footer.article-footer');
      if (cboxAnchor && cboxAnchor.parentNode === mainContainer) {
        mainContainer.insertBefore(sw, cboxAnchor);
      } else {
        mainContainer.appendChild(sw);
      }
    }
  }
  if (sw && !sw.querySelector('#spaced-list')) {
    sw.innerHTML =
      '<div class="widget-label">Article Questions &amp; Spaced Repetition</div>' +
      '<h3>Core Retrieval Prompts</h3>' +
      '<p>Questions are <strong>not</strong> added to your SRS list automatically. Tap any card below and press <strong>+ Add Question to SRS List</strong> to add it to your <a href="index.html#srs">Home SRS Tab</a>.</p>' +
      '<div id="spaced-list"></div>' +
      '<div class="control-row">' +
        '<button type="button" class="btn btn-small" onclick="copySpacedCards()">Copy Q&amp;A Cards</button>' +
        '<a class="btn btn-small" href="index.html#srs" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center;">Open Home SRS Tab &rarr;</a>' +
        '<span id="copy-status" style="font-family:var(--font-mono); font-size:0.9em;"></span>' +
      '</div>';
  }
  refreshAllSrsButtons();
  updateScore();
  ensureMathRendered(10);
});

window.addEventListener('load', function () {
  renderAllMath();

  /* Register PWA Service Worker & Manifest for 100% offline reading */
  if (!document.querySelector('link[rel="manifest"]')) {
    var mf = document.createElement('link');
    mf.rel = 'manifest';
    mf.href = 'manifest.json';
    document.head.appendChild(mf);
  }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
});
