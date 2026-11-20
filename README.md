# matt-learning

Personal learning notes, experiments, and code.

## Interactive Explainers (E-ink & Boox Go 10.3 Optimized)

These explainer articles are designed for the **Boox Go 10.3** (Carta 1200 E-ink, 300 PPI) featuring high-contrast typography, interactive calculators and simulators, worked-out math, concept popovers, and comprehension quizzes:

1. **[How Attention Works](attention.html)**:
   - Recurrent bottlenecks vs Attention
   - Query, Key, Value soft-dictionary intuition
   - Scaled Dot-Product Attention & $\sqrt{d_k}$ variance derivation
   - Fully worked-out 3-token mathematical example ($Q, K, V \to QK^T \to \text{Softmax} \to Z$)
   - Interactive Scaled Dot-Product & Causal Masking calculator
   - Multi-Head Attention specialization inspector
   - PyTorch implementation and comprehension check MCQs

2. **[Generalized Knowledge Distillation (GKD)](gkd.html)**:
   - Classical Supervised Distillation & Exposure Bias
   - GKD formulation (Agarwal et al., DeepMind 2023)
   - On-policy student rollouts vs Off-policy teacher trajectories ($\lambda$ mixing)
   - Forward KL (mode-covering / zero-avoiding) vs Reverse KL (mode-seeking / zero-forcing)
   - Step-by-step arithmetic proof of reverse KL penalizing hallucinations
   - Interactive KL simulator & on-policy mixing slider
   - Comparison: GKD vs SFT vs RLHF / PPO

3. **[Dealing with Class Imbalance: Metrics, Thresholds, Weights & Calibration](class-imbalance.html)**:
   - Why accuracy and ROC-AUC hide false-alarm floods at low base rates ($\pi = 1\%$)
   - Stratified splits, natural test priors, and the SMOTE-before-split data leakage bug
   - Cost-optimal threshold moving ($t^* = \frac{C_{FP}}{C_{FP} + C_{FN}}$)
   - Class weights ($w_+$), Focal Loss ($\gamma$), undersampling, and when high-D SMOTE hurts
   - Exact prior-shift probability recovery ($\text{logit}(\hat{p}) = \text{logit}(\tilde{p}) - \ln w_+$)

4. **[DeepConf: Deep Think with Confidence](deepconf.html)**:
   - Token confidence from top-k log-probabilities
   - Group, bottom-10%, lowest and tail confidence
   - Offline confidence-filtered weighted voting
   - Online early stopping with warmup thresholds and adaptive sampling
   - Limitations: confidently wrong traces, diversity collapse

5. **[Library Index](index.html)**:
   - Hub and quick navigation for all explainer articles.

## How to View on Boox Go 10.3

- **Direct Open**:
  ```bash
  ./open.sh
  # or: termux-open attention.html
  ```
- **Local Browser Server**:
  ```bash
  ./serve.sh
  # Then open http://localhost:8080 in NeoBrowser or Chrome
  ```
- **Copy to Boox Documents**:
  ```bash
  cp *.html /sdcard/Documents/
  ```
