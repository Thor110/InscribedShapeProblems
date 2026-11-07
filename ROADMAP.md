# Roadmap

Notes on work planned or considered but not yet done, so it can be picked up later. Each item says what it is, why it would matter, and roughly how much work it is.

## Where things stand

- **Classical proofs** (PROOFS.md): Theorem 1 (no cube in a generic surface), Theorems 2–3 (regular simplices in convex bodies), Proposition 5, Lemma 4.
- **Computer-assisted proofs** in interval arithmetic: Theorem 6 (squares in every curve within 0.15 of an ellipse) and Theorem 7 (tetrahedra in every surface within 0.13 of an ellipsoid, plus a range of orientations). Each is confirmed by three independent implementations: JavaScript, Python/mpmath and C/Arb.
- **Machine-checked proofs** in Lean 4: the odd perfect number results (Euler's form, steps of 6, forced steps, the spine rule, "9 or 12k + 1").
- **Numerical studies:** shrinkage, rectangle sweep, parity counts, and nearest misses to perfection up to $10^{11}$.

None of this settles an open problem. What it provides is proved constraints, wider proved special cases, and evidence that others can check cheaply.

## Next phase (plan of 7 November 2026)

In priority order. Each step ends in something checkable, so the plan can stop after any step without leaving loose ends.

### 1. Every tetrahedron orientation (the main goal)

**Aim.** Theorem 7 currently gives, for surfaces within 0.06 of the ellipsoid, a tetrahedron in every orientation within 4.16° of one given orientation. Covering *all* orientations would prove that every such surface has an inscribed regular tetrahedron in **every** orientation. That is the analogue of Gromov's "every pose" theorem, for rough surfaces that his theorem does not cover.

**Steps.**
1. **Generalise the certificate to any orientation.** Take the orientation as input (an exact rational rotation, as now), find that orientation's tetrahedron on the ellipsoid by Newton's method, build its box, and certify a ball of orientations around it, using the turning-angle allowance already used for Corollary 7.2.
2. **A rigorous covering of all rotations.** List centre orientations, each with its certified radius, so that every rotation is within the radius of some centre, after allowing for the tetrahedron's 12 symmetries. The covering must itself be checked rigorously (gaps between balls must be ruled out, not just made unlikely).
3. **Run it in C/Arb**, in batches with a progress log, so it can resume after interruption. The estimate is on the order of $10^4$ certificates and hours of computing.
4. **Independent check.** Re-check a random sample of the certificates in Python/mpmath, and the covering argument separately.
5. **Write-up:** Corollary 7.3 in PROOFS.md, with the data file and the commands to reproduce it.

**Decision point.** Some orientations may sit near a degenerate configuration and need a smaller T or smaller balls. After step 1, a quick scan over a coarse grid of orientations shows how the certified radius varies. If some regions are weak, the theorem is stated for the largest T that covers everything.

**Size:** medium (a few sessions of work, plus hours of computing).

### 2. Outreach, prepared in advance (alongside 1)

**Aim:** make it easy to share the work when you choose, with the stressful parts written beforehand.
- A MathOverflow question asking only "is Theorem 1 known?". It is factual and narrow, so there is little to strawman.
- A short email to the one researcher closest to the certificates (Chambers' work on near-smooth curves is the natural match).
- Prepared replies to likely pushback ("so you think you've proved X" → "No, the claim is Y; see section Z").

These would be drafts in a file for you to read and decide on. Nothing is sent without you. *Small.*

### 3. Lean, continued

1. **The remaining small perfect-number results** (results 1, 5 and 7). *Small.*
2. **The degree lemma behind the certificates.** It is the one mathematical step that the three independent programs all rely on. Formalising it would mean the computer-assisted proofs rest only on Lean and on the three programs' agreement about inequalities. *Medium to large;* first check what Mathlib offers on Brouwer degree.

### 4. Wider searches (optional, any time)

- Nearest misses to $10^{12}$, about three hours. Checks: whether the absolute miss stays at least 6, and whether near misses keep missing by exactly one forced step.
- Wider certificates: several boxes joined, or other base shapes, to push past T = 0.15 (square) and 0.13 (tetrahedron).

### 5. Maintenance

- The smoke test and the GIF workflow run on GitHub automatically; keep both green.
- After any change to a page: `node tests/smoke.js`. After a refactoring: `python3 tools/compare-gifs.py`, which should report every GIF identical.

## Planned

### Lean

- **Results 1, 5 and 7 for perfect numbers.** These are the "at least 3 distinct primes" bound, the −1 miss of every power of two, and "σ(N) is odd exactly when N is a square or twice a square". All are short, in the same style as `lean/PerfectNumbers.lean`. *Small.*
- **The degree lemma** behind Theorems 6–7: if the equations stay away from zero, and closer to their linearisation than to zero, on a box boundary, then every nearby system has a solution in the box. This is the self-contained mathematical core of both certificates. Mathlib's support for Brouwer degree is limited, so this may need a homotopy argument done by hand. *Medium to large.*
- **Theorems 2–3** (simplices in convex bodies via the centring jig and Brouwer's fixed-point theorem). Brouwer is the main dependency; check what Mathlib has before starting. *Large.*

### Certificates

- **Every tetrahedron orientation.** Cover the space of rotations, modulo the tetrahedron's 12 symmetries, with balls of radius about 4° (the range certified for $T = 0.06$). That is on the order of $10^4$ certificates, each with its own box and Newton start. With the C checker each takes seconds, so this is hours of computing. The result would be a tetrahedron in **every** orientation for every surface within 0.06 of the ellipsoid, the full analogue of Gromov's "every pose" for these rough surfaces. *Medium (mostly orchestration).*
- **Several boxes / other base shapes.** One box is limited by the degree condition (it fails beyond $c \approx 0.28$ for the tetrahedron, and the square peaks at $T \approx 0.152$). Joining several boxes, or a base curve chosen to make the square more robust, could push the neighbourhoods further. *Medium, uncertain payoff.*
- **An assembly checker**, for speed when checking many more values (for example the orientation covering above). It would use vector instructions with per-instruction outward rounding (AVX-512). It is not needed for trust, since three implementations already agree, so only worth it if a much larger computation is planned. *Medium.*

### Odd perfect numbers

- **Nearest misses beyond $10^{11}$.** $10^{12}$ is about three hours on 4 cores with the current sieve; the C version of the sieve would be faster. Checks: whether the absolute miss stays at least 6, and whether near misses keep missing by exactly one forced step. *Small to medium.*
- **Forced steps from the other side.** Characterise which prime structures give a large forced step D(N) with a small reduced denominator, i.e. why the near misses look the way they do. Possibly a cleaner statement linking near misses to multiply perfect numbers. *Open-ended.*

### Outreach

- **Send the preprint to one or two people**, using REVIEW.md (questions to ask, closest researchers, a short message template).
- **Ask one focused MathOverflow question**, such as "Is Theorem 1 known?". It asks for a fact, not a judgement.
- **arXiv** (category math.MG), which needs an endorsement for a first submission.

Draft messages and replies to likely pushback can be prepared in advance, so the stressful part is mostly done before anything is sent.

### Small tidying

- The certificate page runs the uniform-grid square check, which is fine at 0.2 s; it could switch to adaptive cells for consistency.
- Link ClassicalGeometryProblems back to this repository (the best undersized / best oversized idea is shared).

## Website

A full review of the site (all 11 pages and their scripts) was done on 2026-11-06. It fixed the bugs below; the remaining items are planned in order of value. `node tests/smoke.js` loads every page at desktop and phone width and fails on errors, sideways overflow or unlabeled controls, so it is a quick check after any change.

### Fixed in the review

**Bugs**
- Skeletal Shape Finder: after an unsuccessful search, the shape shown could belong to a different candidate from the one the status line reported.
- Skeletal Shape Finder: the parameter box carried a rectangle's aspect over to triangles. Invalid values are now replaced visibly (an aspect below 1 is searched as its reciprocal), and the registry receives the value actually searched.
- Every finder page: calling the search twice could run two animation loops at once.
- Dimension Explorer: a quick Stop then Run left several loops running. The seed is now read once per run, and the Dimensions box updates the table straight away.
- Square Viewfinder: the status line was overwritten during Auto-find. A resize with no width change (phones hiding the address bar) threw away a found square. Dragging stuck if the mouse was released outside the canvas.
- 3D finders: dragging could get stuck after a cancelled pointer.
- Verified Results: typing in the filter before the data loaded crashed the page. Submitted names and labels are now escaped before display.
- Certificate page: a failure now says so, instead of leaving "Computing…" on screen. The "largest T" figure is rounded down, so it never overstates what was proved.
- Tetrahedron study: a level after every tetrahedron was lost showed 0/16 instead of 0/0.

**Performance**
- `pages/paper.html` is 0.95 MB instead of 3.3 MB: formulas share one set of glyph shapes. Its appearance and the PDF are unchanged.
- Certificate page: the proof result shows after about 0.2 s; the decorative square search runs afterwards instead of blocking the page for a second.
- 3D finders project each mesh vertex once per frame instead of four times.
- Skeletal Shape Finder: the inside-the-curve test uses the chunked version from `shapes2d.js`, about 45× faster on large fractals.

**Accessibility and layout**
- Every slider and dropdown has a label. Status lines are announced to screen readers. Each formula on the paper page carries its TeX source as a label. The Verified Results filter chips work from the keyboard.
- No page overflows sideways at phone width: the 3D slider grid, the study tables and the Number Stability canvas were fixed.
- The home page's grey text was raised to a readable contrast.

**Tidying**
- `pages/certify.js`, which no page used, moved to `tools/certify-float.js`.

### Done in the follow-up round

1. **The smoke test runs on GitHub** (`.github/workflows/smoke.yml`) for every push or pull request that touches the site.
2. **Charts are readable on phones.** On narrow screens each chart keeps its natural size, so its text stays at the intended size, and the chart box scrolls sideways; the page itself does not.
3. **Shared look and navigation.**
   - `pages/site.css` and `pages/site-nav.js` add the same navigation bar to every page, with the current page highlighted, and a visible keyboard-focus outline on every control.
   - The home page now opens with a "What has been proved" summary, and its links are grouped into Explore, Studies and proofs, and Numbers.
4. **Shared code, first part.** The seven rotation and linear-algebra helpers copied between the two 3D finders now live once, in `pages/space3d.js`. Search results and GIFs are unchanged.
5. **Sharper Square Viewfinder.** It draws at the screen's pixel density and uses pointer events (mouse, touch and pen), capturing the pointer so a drag always ends cleanly.
6. **No blocking in the tetrahedron study.** The solver now pauses between iterations (`solvePoseSteps` and `refineSteps` in `inscribed-nd.js`, which give identical results). In 25 seconds of the study, pauses over 50 ms went from 79 (longest 341 ms) to one of 53 ms.
7. **Smaller items:**
   - the registry panel waits until the sliders settle before checking;
   - a click on the tetrahedron chart draws the plotted (smallest) tetrahedron, for data computed from now on;
   - the nearest-misses chart handles an empty record list;
   - the shape finder computes its starting points once per curve;
   - the study's "median" is documented as taking the upper middle value, matching the saved data.

### Done in the second follow-up round

- **Shared code, second part.**
  - The Skeletal Shape Finder now uses the shared curve geometry (`Inscribed2D.geometry`: ray hits, all crossings, distance, inside) and the shared Newton solver (`Shapes2D.newton`, which gained the page's least-squares step for pentagons and hexagons), removing about 120 duplicated lines.
  - The two 3D finders share their mesh building, projection and surface drawing in `pages/space3d.js`.
  - Each change was checked the strict way: all eight demo GIFs re-record pixel-identical (`python3 tools/compare-gifs.py`), and the 2D and 3D test results are identical, including the pentagon and hexagon searches.
- **Batched 3D outlines: decided against.** Drawing the whole 3D view takes 3.3–4.6 ms per frame, comfortably within a 16 ms frame. Batching the outlines would save perhaps 1–1.5 ms, but it would draw every outline after every face, so the back of the surface would show through the front. That is a visible change for little gain.

### Still open

1. **The remaining duplication in the 3D pages** is the search loop and its UI glue (start, stop, timing display). It differs in small ways between the two pages and is cheap to keep, so it stays unless one of them needs to change. *Low value.*
2. **README media.** The demo GIFs total about 15 MB. Video would be far smaller, but GitHub does not autoplay video in a README, so for now the GIFs stay. *Optional.*
