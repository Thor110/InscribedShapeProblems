# Roadmap

Notes on work planned or considered but not yet done, so it can be picked up later. Each item says what it is, why it would matter, and roughly how much work it is.

## Where things stand

- **Classical proofs** (PROOFS.md): Theorem 1 (no cube in a generic surface), Theorems 2–3 (regular simplices in convex bodies), Proposition 5, Lemma 4.
- **Computer-assisted proofs** in interval arithmetic: Theorem 6 (squares in every curve within 0.15 of an ellipse) and Theorem 7 (tetrahedra in every surface within 0.13 of an ellipsoid, plus a range of orientations). Each is confirmed by three independent implementations: JavaScript, Python/mpmath and C/Arb.
- **Machine-checked proofs** in Lean 4: the odd perfect number results (Euler's form, steps of 6, forced steps, the spine rule, "9 or 12k + 1").
- **Numerical studies:** shrinkage, rectangle sweep, parity counts, and nearest misses to perfection up to $10^{11}$.

None of this settles an open problem. What it provides is proved constraints, wider proved special cases, and evidence that others can check cheaply.

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

### Planned, in order

1. **A smoke test in GitHub Actions.** Run `node tests/smoke.js` on every push that changes `pages/` or `index.html`, next to the GIF workflow, so a broken page is caught before anyone sees it. *Small.*
2. **Charts readable on phones.** The SVG charts have a 760-unit-wide layout, so on a 390 px screen their 12 px text shrinks to about 6 px. Either draw a narrower layout under 500 px or keep the chart at full size inside a sideways-scrolling box. *Small to medium.*
3. **A shared look and navigation.** Each page carries its own copy of the same dark styles and its own "Back to suite" link. One stylesheet and a small header with links to every page would make the site consistent and easier to change. It would also give the home page room for a short "what has been proved" summary linking the certificate page, PROOFS.md, the Lean proofs and the paper. *Medium.*
4. **Shared code for the finders.** The two 3D pages share about 120 copied lines (rotations, mesh, drawing, the search loop). The Skeletal Shape Finder re-implements geometry that already exists in `shapes2d.js` and `inscribed-2d.js`. Moving these into shared scripts removes a class of "fixed in one place but not the other" bugs. The GIF fingerprints will re-record the affected demos automatically. *Medium.*
5. **Sharper canvases.** The Square Viewfinder ignores the screen's pixel density, so it is blurry on phones and high-resolution displays. It should also use pointer events like the other pages, which handle mouse, touch and pen in one place. *Small.*
6. **Smoother long computations.** The tetrahedron study occasionally blocks the page for 300–400 ms between updates (surface set-up between yields). The 3D drawing could also batch outlines into one path, though that changes how overlapping lines blend, so the GIFs would change. *Small.*
7. **Smaller items.**
   - The registry panel on the Skeletal Space Finder re-checks and flickers on every slider movement; it should only update when the result changes.
   - The study's "median" returns the upper middle value for even counts.
   - The tetrahedron chart plots the smallest tetrahedron but clicking draws the largest.
   - The nearest-misses chart has no guard for an empty record list.
   - The finder searches could cache their interior starting points per curve.
8. **Lighter README media.** The eight demo GIFs total about 15 MB. Short MP4 or WebM clips would be a fraction of the size at better quality, but GitHub's README only autoplays GIFs (videos need a click), so this trades autoplay for size. *Optional.*
