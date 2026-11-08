# Roadmap

Notes on work planned or considered but not yet done, so it can be picked up later. Each item says what it is, why it would matter, and roughly how much work it is.

## Where things stand

- **Classical proofs** (PROOFS.md): Theorem 1 (no cube in a generic surface, probably folklore; Theorem 1.3, computer-assisted, certifies one explicit smooth egg with none: a worked example of a known fact, since Bielecki 1954 and the Hausel–Makai–Szűcs argument already give such bodies), Theorems 2–3 (regular simplices in convex bodies), Proposition 5, Lemma 4.
- **Computer-assisted proofs** in interval arithmetic: Theorem 6 (squares in every curve within 0.15 of an ellipse) and Theorem 7 (tetrahedra in every surface within 0.13 of an ellipsoid, plus a range of orientations). Each is confirmed by three independent implementations: JavaScript, Python/mpmath and C/Arb. Corollary 7.3: every orientation within 0.07, by 12,784 certificates; the covering is re-checked exactly and a sample of 100 in Arb.
- **Machine-checked proofs** in Lean 4: all nine odd perfect number results (at least three primes, Euler's form, steps of 6, forced steps, the spine rule, odd σ(N), "9 or 12k + 1").
- **Numerical studies:** shrinkage, rectangle sweep, parity counts, and nearest misses to perfection up to $10^{11}$.

None of this settles an open problem. What it provides is proved constraints, wider proved special cases, and evidence that others can check cheaply.

## Done: an explicit egg with no inscribed cube

**Proved (7 November 2026): PROOFS.md, Theorem 1.3.** The repository's lopsided egg has no inscribed cube.
- `tools/egg-cube.c` proves it in under a minute. Its three parts are the surface's shape, a small-cube lemma (edge at least 0.153), and a 7-dimensional branch and bound over 63 million boxes.
- `tools/egg-cube-arb.c` re-checks it independently with Arb's ball arithmetic: 367 million boxes, about 10 minutes.
- Both pass a control: on the ellipsoid, which has a cube, they find it.

The search turned out far cheaper than feared, because most boxes are ruled out by one vertex almost at once.

**Follow-ups (done, 7 November 2026):**
- **A flatter egg.** The proof still works for asymmetry down to $10^{-8}$, with cost growing only like $\log(1/\varepsilon)$ (63 to 75 million boxes). Much below $10^{-8}$, the boxes would have to be smaller than the program's floor of $10^{-9}$.
- **Other shapes.** The regular icosahedron is excluded (129 million boxes, also re-checked in Arb), and a control on the sphere finds its icosahedra. The dodecahedron, the rhombic dodecahedron and any shape containing a cube's vertices are excluded with no further search (Corollary 1.4). The regular pentagon needs no computation: a non-circular ellipse has none, because five points determine a conic.
- **Exact arithmetic for the surface checks.** Not done, and no longer needed: the Arb program already redoes part 1 independently.

**4D hypercube: started, not settled (7 November 2026).** `tools/egg-tesseract.c` defines a 4D egg whose slice $w = 0$ is the 3D egg.
- **Proved so far.** Parts 1–2: the 4D egg is a smooth, strictly convex 3-sphere, and any inscribed tesseract has half-edge in $[0.0525, 0.6425]$.
- **The search.** Rotations are written $p \mapsto lp\bar r$. The units $\pm1, \pm i, \pm j, \pm k$ act on both sides, which reduces $l$ and $r$ each to one Cayley box. Even so, the direct branch and bound is out of reach. Knuth's random-probe estimate gives about $10^{14}$ boxes, against about $10^8$ for the cube. A mean-value bound only gained a factor of 4. The six rotation parameters are what multiply the work.
- **A more promising route,** if it is ever worth doing. For each pair of opposite vertices $c \pm w$, subtracting the two conditions $F(c + w) = F(c - w) = 0$ gives an equation nearly linear in $c$: $4\,c^{\mathsf T}Aw$ plus the odd part of the cubic. Summed over the 8 diagonals, it pins $|c| \lesssim \varepsilon/s$ for an egg of asymmetry $\varepsilon$. On the ellipsoid, $M^{\mathsf T}AM$ must be diagonal, so the only tesseracts are the axis-aligned ones. For a slightly lopsided egg, a hand-written perturbation argument would confine any tesseract to near the axis-aligned one, and a local computation could exclude it there. *Medium to large; low priority.*
- **Visualisation, done.** The Dimension Explorer shows both eggs turning, the 4D one through its fourth dimension, with the closest cube (2.4% off) and closest tesseract (3.3% off) the solver finds.

## Next phase (plan of 7 November 2026)

**Progress (7 November 2026).**
- Step 1 is done: Corollary 7.3, every orientation for $T = 0.07$ (first $0.02$, then $0.05$; charging each cell its own turning cost, a larger box, and splitting the 320 cubes where the room is tight raised it). The margins at $0.07$ are small, so going further needs many more split cubes. A full Arb re-check of all 12,784 cubes would take about 13 hours on 4 cores.
- Step 2 is done: drafts in OUTREACH-DRAFTS.md, none sent.
- Step 3.1 is done: results 1, 5 and 7 are in Lean.
- Step 3.2, the degree lemma, is not started. Mathlib (v4.35) has no Brouwer fixed-point theorem and no Poincaré–Miranda theorem, only the winding number of loops in the circle. The lemma in four dimensions would need Brouwer first, which is a large project on its own. A 2D version for squares might be reachable through the winding number.

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

- **The degree lemma** behind Theorems 6–7: if the equations stay away from zero, and closer to their linearisation than to zero, on a box boundary, then every nearby system has a solution in the box. This is the self-contained mathematical core of both certificates. Mathlib v4.35 has no Brouwer fixed-point theorem, so Brouwer in dimension n would come first. *Large.*
- **Theorems 2–3** (simplices in convex bodies via the centring jig and Brouwer's fixed-point theorem). Brouwer is the main dependency; check what Mathlib has before starting. *Large.*

### Certificates

- **Every orientation for a wider neighbourhood.** Corollary 7.3 holds for $T = 0.07$, with cubes of half-width $1/36$ and 320 of them split once. Going further needs much more splitting, or a sharper turning bound. *Small to medium (computing time).*
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
