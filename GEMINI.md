# matt-learning Workspace Rules & Personal Preferences

When creating or editing interactive learning articles in `~/matt-learning`, follow these personal preferences and read `ARTICLE_RULES.md` in full before writing any article.

## Non-Negotiable Preferences

1. **No Calculator Required for Any Question**
   - Every prediction hook, worked example, backward-faded completion step, retrieval prompt, and MCQ must be solvable mentally without a calculator.
   - Use clean, mental-math-friendly numbers (small integers, simple fractions, powers of 2 or 10, clean percentages like 10%, 25%, 50%) or test conceptual reasoning directly.

2. **Distinct Numbers in Worked Examples (Easy to Trace)**
   - Use distinct, non-repetitive numbers in worked examples so every element's path through the computation is unambiguous—for example, a matrix like `[0, 1, 2; 3, 4, 5]` instead of `[1, 1, 0; 0, 0, 1]` where repeated `0`s and `1`s hide which row/column contributed to the result.
   - Keep those distinct numbers small enough to compute mentally without a calculator.

3. **All Concepts and Symbols Must Be Clickable with Popovers**
   - Every non-obvious concept, technical term, acronym, prerequisite, AND every mathematical symbol, variable, or operator (in prose, legends, and equations) must be clickable (`.term[data-term]`).
   - Clicking any concept or symbol must open an anchored popover explaining what it means in plain English (with nested `.term` links inside popover definitions when helpful), without a full-screen backdrop so the page remains visible.

4. **E-Ink & Tablet Optimization (Onyx Boox Go 10.3)**
   - High-contrast monochrome (`#000000` on `#ffffff`), crisp `1px`/`2px`/`3px` solid `#000` borders, `#e8e8e8` highlight fills, zero shadows, zero gradients, and `transition: none !important; animation: none !important;`.
   - Large touch targets (`>= 48px` buttons/inputs, `44px` slider track with `28px` thumb) and working `A-` / `A+` font-scaling controls persisted in `localStorage`.

5. **Interactive Structure & Pedagogy**
   - Start every article with a short bulleted TL;DR.
   - Use worked-out numerical examples, interactive widgets/steppers, and `<details>` for advanced derivations or code.
   - Wrap all MCQs in `<details class="mcq-box">` (collapsed by default) with `data-explain` feedback on every option.
   - Write plain, direct human prose with zero AI tells.
   - See `ARTICLE_RULES.md` for the full 5-stage pedagogical architecture and pre-publish audit checklist.

6. **Publishing Workflow**
   - Always add a card/link for any new article to `index.html`.
   - Commit and push changes to `main` so they are live on GitHub Pages (`https://tabletmatt100.github.io/matt-learning/<filename>`).
