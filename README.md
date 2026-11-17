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

3. **[Library Index](index.html)**:
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
