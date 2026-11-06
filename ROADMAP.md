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
- `pages/certify.js` (the old floating-point certificate) is kept only for the Weierstrass-blob exploration; it could move to `tools/` or be marked more clearly as non-rigorous.
- Link ClassicalGeometryProblems back to this repository (the best undersized / best oversized idea is shared).
