# Rules for Writing Interactive Learning Articles

Every article in `matt-learning` must be a **commitment, feedback, and retrieval engine**—not a passive display medium—and must be optimized for the **Onyx Boox Go 10.3** E-ink tablet.

---

## 1. Core Pedagogical Rules (Cognitive & HCI Evidence)

1. **Force Constructive (C) output, not just Active (A) clicking.**
   - Dragging a slider or clicking "Next" is only *Active* (barely beats passive reading). Require the reader to **predict, complete, explain, or recall** before revealing the mechanism.
2. **Never open a section with a formal definition or an open-ended sandbox.**
   - Unassisted discovery hurts novices (`d = -0.38`). Open each major concept with a **concrete anomaly or prediction hook** ("Guess First") and force a 20-second micro-commitment (with an `"I have no idea — show me"` escape hatch) before unlocking free sliders or revealing the rule.
3. **Predict-Observe-Explain (POE) + Refutation Text.**
   - Overlay the true answer/curve directly on the reader's prediction so the error gap is explicit.
   - Name the exact misconception: *"Most people guess [X] because they assume [naive heuristic]. That breaks here because [1-sentence reason]."*
4. **Discrete steppers + persistent small multiples over continuous animation.**
   - Continuous animations suffer from the *Transient Information Effect* (earlier states vanish before working memory links them). Use `Step 1 | Step 2 | Step 3` controls (and constrained presets like `Low | Critical | High` alongside any slider) while keeping prior states visible side-by-side or as ghost traces.
5. **Enforce Spatial Contiguity (zero split-attention).**
   - Put labels directly on SVG curves and bars instead of in separate legends or bottom captions. Link equation symbols, prose terms, and visual elements inline.
6. **Cut decorative visuals and tangents (Ruthless Coherence).**
   - Every visual element must carry causal weight. Highlight active changes with crisp monochrome contrast or arrows.
7. **Strict chunk budget + Concrete -> Abstract (Concreteness Fading).**
   - Keep prose chunks to **150–250 words** per visual or interactive step. Never bury a widget under 1,000 words of text.
   - Walk through one concrete numerical trace with real numbers *before* stating the general equation, then map numbers to symbols.
8. **Worked Examples -> Backward Fading.**
   - Show a full worked example (Steps 1–2–3), then a **70%-worked example** where the reader completes the final step (backward fading beats forward fading), before asking for an unassisted solution.
9. **Closed-book retrieval every 300–500 words (Recall > Recognition).**
   - Insert short free-response, fill-in-the-equation, or counterfactual prediction prompts before revealing the answer and explanatory feedback.
10. **Mitigate the Expertise Reversal Trap.**
    - Provide a 1-question **Fast-Forward Diagnostic** at the top of sections so experienced readers can collapse/skip basic scaffolding.
11. **End with Contrastive Matrix, Interleaved Practice, and Spaced Recall.**
    - Include a **Contrastive Matrix** comparing the new concept to its closest neighbors across 3–4 decision axes (Objective, Failure Mode, Complexity, When to Use).
    - Mix new and neighboring concepts in **Interleaved Diagnostic Checks** (collapsed by default in `<details class="mcq-box">`).
    - Export **5–8 spaced Q&A recall prompts** (`1d / 4d / 14d / 30d`).
12. **No calculator required for any question.**
    - Every prediction hook, worked example, backward-faded step, retrieval prompt, and MCQ must be solvable in your head without a calculator. Use clean, mental-math-friendly numbers (small integers, simple fractions, powers of 2 or 10, clean percentages) or test conceptual reasoning directly.
13. **Use distinct, traceable numbers in worked examples.**
    - Avoid degenerate or repetitive values (such as matrices filled with `0`s and `1`s like `[1, 1, 0; 0, 0, 1]`) that obscure which input landed where. Use distinct, small numbers (such as `[0, 1, 2; 3, 4, 5]`) so every step of the calculation is easy to trace while staying mental-math friendly.

---

## 2. Standard 5-Stage Article Architecture

Follow this loop for every major concept:

1. **Stage 0 — Pre-Training Header (2–3 min max)**
   - **Bulleted TL;DR**: What problem this solves, the core mechanism in one concrete sentence, and when it breaks.
   - **Inline Symbol / Term Legend**: 3–5 core symbols/terms with 1-line plain-English meanings.
   - **Fast-Forward Diagnostic**: 1-question check to let experts skip basic scaffolding.
2. **Stage 1 — Concrete Prediction Hook**
   - A concrete scenario with intuitive tension. Force a prediction before showing the formula or unlocking the slider.
3. **Stage 2 — Gap Reveal & Misconception Refutation**
   - Show the true result overlaid on the reader's guess and refute the naive heuristic directly.
4. **Stage 3 — Segmented Mechanism + Linked Visuals + Worked Example**
   - 150–250 word chunks, concrete numbers -> general equation, discrete stepper + persistent small multiples, direct inline labels.
5. **Stage 4 — Backward-Faded Practice & Closed-Book Retrieval**
   - 70%-worked example where the reader finishes the last step + a closed-book generation prompt with immediate why-feedback.
6. **Stage 5 — Contrastive Matrix, Interleaved Checks & Spaced Export**
   - Comparison table across decision axes, collapsed `<details class="mcq-box">` interleaved checks (with `data-explain` on every option), and exportable spaced-recall Q&A cards.

---

## 3. Hardware, UI & Prose Rules (Boox Go 10.3)

- **Monochrome E-ink CSS**: `#000000` text on `#ffffff` background, crisp `1px`/`2px`/`3px` solid `#000` borders, `#e8e8e8` highlight fills, zero shadows, zero gradients, and `transition: none !important; animation: none !important;` on `*`.
- **Touch targets & font scaling**: Minimum `48px` height on buttons/inputs, `44px` hit track on sliders with `28px` thumbs, working `A-` / `A+` header buttons scaling `:root` `--font-size` and persisting to `localStorage`.
- **Offline + Online KaTeX**: Load from local `katex/` with `onerror` fallback to jsDelivr.
- **Aggressive anchored popovers for all concepts AND symbols**: Every non-obvious concept, technical term, acronym, prerequisite, and mathematical symbol/variable/operator (in prose, symbol legends, and equations) must be clickable (`.term[data-term]`) and open an anchored popover explaining what it means in plain English (including nested `.term` links inside popover definitions). Popovers must anchor directly to the clicked term or symbol (no full-screen backdrop) so the reader can keep viewing the page.
- **Collapsed MCQs by default**: Wrap every MCQ in `<details class="mcq-box">` with `<summary class="mcq-title">` and `data-explain` on every option.
- **Human prose, zero AI tells**: Plain descriptive headings, varied sentence lengths, concrete numbers, no emojis, no em-dash overuse, no filler ("delve", "crucial", "landscape", "it's important to note", "in conclusion", "let's dive in"), and no padded summaries at the end of every section.

---

## 4. Pre-Publish Self-Audit Checklist

1. **No-Click Audit**: If a reader never touches an optional slider, do the default state + discrete steppers/small multiples still communicate 100% of the argument?
2. **Blind-Click Audit**: Is every free slider gated or preceded by a prediction or faded completion prompt so readers cannot mistake smooth UI motion for understanding?
3. **Split-Attention Audit**: Are all curves, bars, and symbols labeled directly on the figure and inline in prose without a separate legend?
4. **Transient-Motion Audit**: Can every state transition be stepped through discretely with prior states still visible?
5. **Blank-Sheet Test**: Does every major section force at least one eyes-off-the-solution generation (free recall, equation completion, or counterfactual prediction) with explanatory feedback?
6. **Popover & MCQ Audit**: Are all unfamiliar concepts AND mathematical symbols/variables/operators clickable with anchored `.term` popovers, and are all MCQs collapsed by default in `<details class="mcq-box">`?
7. **No-Calculator & Traceable-Numbers Audit**: Can every question, prediction prompt, worked example, and MCQ be solved mentally without a calculator, and do worked examples use distinct numbers (e.g. `[0, 1, 2; 3, 4, 5]`, not `[1, 1, 0; 0, 0, 1]`) so every element is easy to trace?
