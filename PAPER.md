# Inscribed polytopes in curves and surfaces: a dimension count, a centring argument, and a computer-assisted certificate

*Edward James Gordon aka Thor110. Preprint, working draft. Interactive companion: <https://thor110.github.io/InscribedShapeProblems/>. Code and data: <https://github.com/Thor110/InscribedShapeProblems>.*

## Abstract

We study four inscribed-shape problems: an equilateral triangle or a square in a Jordan curve, and a regular tetrahedron or a cube in a Jordan surface. We place them in families that continue to every dimension, and record seven results.

1. **No cubes in general.** A transversality argument shows that a generic smooth closed hypersurface in $\mathbb{R}^n$ contains no inscribed copy of any polytope with more vertices than the dimension $n(n+1)/2 + 1$ of the similarity group. In particular a generic smooth, strictly convex surface in $\mathbb{R}^3$ contains no inscribed cube (Theorem 1). A computer-assisted proof gives an explicit one: a cubic "egg" with rational coefficients and no inscribed cube (Theorem 1.3).
2. **Simplices in convex bodies.** An elementary "centring jig" argument shows that every convex body in $\mathbb{R}^n$ contains an inscribed regular simplex in every orientation that is *admissible* for it, and in every orientation when its boundary is $C^1$ (Theorems 2 and 3). For smooth bodies this is a special case of Gromov's theorem, but the proof uses only Brouwer's fixed-point theorem.
3. **Admissibility is needed.** Bodies with sharp corners can lose orientations: an isosceles triangle with apex below $60°$ has no inscribed equilateral triangle pointing at its apex (Proposition 5).
4. **A limit criterion for squares.** Non-shrinking squares on approximations give a square on the limit (Lemma 4).
5. **A computer-assisted proof.** Every Jordan curve whose polar radius stays within $0.15$ of that of the ellipse $x^2 + y^2/0.36 = 1$ has an inscribed square (Theorem 6), proved in interval arithmetic. This class contains nowhere-differentiable curves that are neither locally monotone nor symmetric.
6. **The same in 3D.** Every surface whose radius stays within $0.13$ of that of a $1 \times 0.8 \times 0.6$ ellipsoid has an inscribed regular tetrahedron (Theorem 7), and within $0.06$ in every orientation within $4.16°$ of a given one. Within $0.02$ it has one in **every** orientation (Corollary 7.3), by a covering of all rotations with 10,544 certificates. This includes surfaces that are not $C^1$, outside Gromov's theorem.
7. **Numerical studies.** Four studies probe the open continuous cases:
   - on fractal curves and surfaces refined level by level, the largest inscribed squares and the tracked regular tetrahedra converge rather than shrink;
   - rectangles of 9 aspect ratios are found on all 9 test curves;
   - exhaustive counts give an odd number of squares and an even number of $2{:}1$ rectangles on every generic curve where the count settles.

Every numerical claim is reproducible from the repository, and every reported inscribed shape passes an independent check to a relative tolerance of $10^{-9}$.

## 1. Introduction

The **inscribed square problem** (Toeplitz, 1911) asks whether every Jordan curve in the plane contains the four vertices of a square. It is open. Proved cases include:
- convex curves (Emch 1913);
- smooth curves (Schnirelmann 1929);
- locally monotone curves, which include all polygons (Stromquist 1989);
- curves made of two Lipschitz graphs with small constant (Tao 2017);
- curves close to a smooth curve relative to its curvature (Chambers 2022).

See Matschke's survey (2014) for the history. The **rectangular peg problem**, for rectangles of a prescribed aspect ratio, was solved for smooth curves by Greene and Lobb (2021). Vaughan showed that *some* rectangle always exists. The equilateral triangle, and indeed any triangle up to similarity, is inscribed in every Jordan curve (Meyerson 1980, Nielsen 1992). In $\mathbb{R}^3$, Gromov (1969) showed that every $C^1$ embedded sphere contains an inscribed regular tetrahedron, indeed any simplex, in every orientation. The continuous case is open. Regular octahedra are inscribed in smooth convex bodies (Makeev 2001), and cross-polytopes in smooth convex bodies in $\mathbb{R}^n$ for $n$ an odd prime power (Karasev 2009). Centrally symmetric convex bodies in $\mathbb{R}^3$ contain inscribed cubes (Hausel, Makai and Szűcs 2000).

**The problem map.** A similar copy of a polytope in $\mathbb{R}^n$ has $D(n) = n(n+1)/2 + 1$ degrees of freedom, and each vertex on a hypersurface imposes one equation. So the *expected dimension* of the family of inscribed copies is $D(n) - m$ for a polytope with $m$ vertices.

| Polytope | $n$ | $m$ | $D(n) - m$ | Status |
|---|---|---|---|---|
| Equilateral triangle | 2 | 3 | 1 | solved |
| Square, rectangle | 2 | 4 | 0 | open (continuous curves) |
| Regular $k$-gon, $k \ge 5$ | 2 | $k$ | $< 0$ | fails generically (Thm 1) |
| Regular simplex | $n$ | $n+1$ | $n(n-1)/2$ | open (continuous); Thms 2–3 for convex |
| Cross-polytope | $n$ | $2n$ | $(n-1)(n-2)/2$ | open |
| Cube, hypercube | $n \ge 3$ | $2^n$ | $< 0$ | **false** generically (Thm 1) |

The square's "skeletal jig" (two perpendicular chords bisecting each other with equal lengths) generalises to the cross-polytope, not the hypercube. The tetrahedron problem generalises to the simplex. In every dimension $n \ge 3$, the only regular polytopes with non-negative expected dimension are the simplex and the cross-polytope.

**Methods.** The companion pages find inscribed shapes with a *skeletal jig*: rays from a pivot, with the target shape inscribed exactly when suitable ray lengths agree. They combine a centring iteration (the "rattle"), Newton and Levenberg–Marquardt solves, and continuation across refinement levels. Every reported shape is checked independently: its pairwise vertex distances against the target's at the best-fitting scale, and the distance of each vertex to the curve or surface, both relative to the shape's size, must be below $10^{-9}$.

Complete line-by-line proofs of Theorems 1–3, Lemma 4, Proposition 5 and Theorems 6–7 are in the appendix (the repository's `PROOFS.md`). Sections 2–5 state the results and give the key steps.

## 2. Generic non-existence

> **Theorem 1.** Let $P \subset \mathbb{R}^n$ be a polytope with $m > D(n)$ vertices. For a residual set of $f \in C^\infty(\mathbb{R}^n, \mathbb{R})$ (Whitney topology), the zero set $f^{-1}(0)$ contains no inscribed copy of $P$.

*Key steps.*
1. The similar copies of $P$ form an embedded $D(n)$-dimensional submanifold $C_P$ of the space of $m$-tuples of distinct points.
2. Put $W = C_P \times \{0\}$ in the multijet space $J^0_m(\mathbb{R}^n, \mathbb{R})$. It has codimension $nm + m - D(n)$, which is larger than $nm$, the dimension of the domain of the multijet $j^0_m f$.
3. By the multijet transversality theorem, for generic $f$ the multijet is transversal to $W$, so it misses $W$ entirely.

Openness of convexity and of the radial-graph condition near $f_0 = |x|^2 - 1$ then gives:

> **Corollary 1.1.** There are smooth, strictly convex surfaces in $\mathbb{R}^3$, arbitrarily $C^\infty$-close to the round sphere, with no inscribed cube.

Symmetric surfaces have cubes, as Hausel–Makai–Szűcs predict, but they form a meagre set, so this does not conflict with Theorem 1. Theorem 1 does not name a surface. One can be named and checked:

> **Theorem 1.3.** The surface $x^2 + \tfrac{16}{25}y^2 + \tfrac{400}{289}z^2 + \tfrac{3}{20}(\tfrac12x^3 + xyz + \tfrac{7}{10}y^2z + \tfrac{3}{10}z^3) = 1$ (inside $|p| \le \tfrac32$) is a smooth, strictly convex sphere with no inscribed cube.

The proof is computer-assisted, in interval arithmetic.
- First, the surface is checked to be a strictly convex sphere, with $|\nabla F| \ge 1.56$ and Hessian norm at most $3.40$.
- Taylor's theorem then shows that a cube with all its vertices on it would be nearly flat unless its edge is at least $0.153$.
- A branch-and-bound search over centre, size and orientation, with the orientations reduced by the cube's 24 rotations, excludes every other cube: 63 million boxes, under a minute.
- An independent re-implementation with Arb's ball arithmetic agrees. In a control run on the ellipsoid (asymmetry 0), the search correctly finds that surface's cube.

The same programs show that the egg has no regular icosahedron. It has no regular dodecahedron either, since a dodecahedron's vertices include a cube's (Corollary 1.4). The proof also survives making the asymmetry as small as $10^{-8}$, at almost no extra cost. So a surface within about $10^{-8}$ of an ellipsoid with an inscribed cube can have none.

## 3. Simplices in convex bodies: the centring jig

Let $\Delta$ be a simplex whose circumcentre is interior, $w_0, \dots, w_n$ the unit vectors from the circumcentre to its vertices, and $\lambda_k > 0$ with $\sum \lambda_k w_k = 0$. The vector $\lambda$ spans the space of linear relations among the $w_k$. For a convex body $K$, let $r_k(x)$ be the length of the $k$-th arm of the jig at $x$, i.e. how far $x + t w_k$ stays in $K$. The **rattle field** is
$$V(x) = \sum_k \lambda_k\, r_k(x)\, w_k .$$
A zero of $V$ forces $\lambda_k r_k = \rho\lambda_k$, i.e. equal arms, which is an inscribed copy of $\Delta$.

> **Theorem 2.** If $K$ is strictly convex with $C^1$ boundary, $V$ has a zero in the interior. Hence $K$ contains an inscribed copy of $\Delta$, in particular a regular simplex, in every orientation.

*Key steps.*
1. **Continuous arms.** Each $r_k$ is continuous; strict convexity is used here.
2. **Inward at the boundary.** $\langle V(p), \nu\rangle < 0$ at every boundary point; the $C^1$ boundary is used here.
3. **Zero.** An inward-pointing continuous field on a convex body has a zero, by Brouwer applied to $x \mapsto \pi_K(x + V(x))$.

> **Theorem 3.** Let $K$ be any convex body. Call an orientation *admissible* if from every boundary point some arm of the jig points into the interior of the tangent cone. Then $K$ contains an inscribed copy of $\Delta$ in every admissible orientation. If $\partial K$ is $C^1$, every orientation is admissible.

*Key steps.* Apply Theorem 2 to smooth, strictly convex outer approximations $K \subset K_m \subset K + \tfrac3m B$ (Schneider). Admissibility prevents the inscribed simplices from shrinking to a boundary point. A limit of the non-shrinking simplices is inscribed in $K$.

> **Proposition 5.** An isosceles triangle with apex angle below $60°$ has no inscribed equilateral triangle with a vertex pointing at the apex along the axis. The bound $60°$ is sharp.

So "every orientation" genuinely fails for non-smooth bodies, which is the phenomenon Gromov's $C^1$ hypothesis rules out. In the plane some orientation always works (Meyerson).

**Why the square needs more.** A square's jig has a two-dimensional relation space ($w_0 + w_2 = 0$, $w_1 + w_3 = 0$). So the centring step yields only a rhombus, and the equal-diagonal condition requires varying the rotation. That intermediate-value step is where non-convex curves break the argument. The same happens for the cross-polytope in every dimension.

## 4. A limit criterion and what counting cannot do

> **Lemma 4.** Let $\gamma_L \to \gamma$ uniformly, with $\gamma$ a Jordan curve. Suppose infinitely many $\gamma_L$ have inscribed squares whose opposite vertices lie at parameter distance at least $\delta > 0$. Then $\gamma$ has an inscribed square.

For generic smooth curves the number of inscribed squares is odd, and the number of rectangles of any other fixed aspect ratio is even. Section 6.3 confirms both numerically. On rough curves small squares multiply at every scale, and in the limit their number is infinite. So a proof for continuous curves has to control the *sizes* of squares, as in Lemma 4, not their number.

## 5. Computer-assisted certificates

Let $E$ be the ellipse with semi-axes $1$ and $b = 0.6$, with polar radius $r_E(\theta) = (\cos^2\theta + \sin^2\theta/b^2)^{-1/2}$. For continuous $\rho > 0$ let $\gamma_\rho(\theta) = \rho(\theta)(\cos\theta, \sin\theta)$.

> **Theorem 6.** If $|\rho(\theta) - r_E(\theta)| \le 0.15$ for all $\theta$, then $\gamma_\rho$ has an inscribed square, with diagonal at least $0.754$.

*Proof outline.*
1. **Square equations.** With $A$ and $C$ as opposite corners, the other corners are
   $$B, D = \tfrac12\big((I \mp R)A + (I \pm R)C\big),$$
   where $R$ is the rotation by $90°$. Parametrise $A$ and $C$ by the rational parametrisation $\gamma_E(t) = \big(\tfrac{1-t^2}{1+t^2}, \tfrac{2bt}{1+t^2}\big)$ and its antipode, carried along rays to the perturbed curve. Let $G_\rho(t, t') = (\mathrm{sd}_\rho(B), \mathrm{sd}_\rho(D))$, where $\mathrm{sd}_\rho$ is the signed distance to $\gamma_\rho$.
2. **Perturbation bound.** For radial curves, $|\rho - \sigma| \le T$ implies $|\mathrm{sd}_\rho - \mathrm{sd}_\sigma| \le T$ everywhere: compare along rays when the two signs differ. The corners $B, D$ move by at most $\sqrt2\,T$. So $\|G_\rho - G_E\|_\infty \le (1 + \sqrt2)T$.
3. **Degree lemma.** Let $Q = z + K([-c, c]^n)$ for any point $z$ and matrices $J, K$ with $\det J \ne 0$, and let $L(p) = J(p - z)$, so $\|L\|_\infty \ge c_{\rm eff} = c(1 - \|JK - I\|_\infty) > 0$ on $\partial Q$. Suppose that on $\partial Q$:
   - $\|G_E - L\|_\infty < \|G_E\|_\infty$, which makes the homotopy from $L$ to $G_E$ zero-free, so $\deg(G_E, Q, 0) = \operatorname{sign}\det J$;
   - and $\tau < \|G_E\|_\infty$.

   Then every $G$ within $\tau$ of $G_E$ has a zero in $Q$. This test needs no winding number and works in any dimension.
4. **The computation**, all in interval arithmetic with outward rounding:
   - on $\partial Q$, from 80,000 samples with $c = 0.5$ and explicit Lipschitz bounds between them, $\|G_E\|_\infty \ge 0.3660 > (1+\sqrt2)\cdot 0.15 = 0.3621$;
   - and $\|G_E\|_\infty - \|G_E - L\|_\infty \ge 0.23 > 0$;
   - and $|A - C| \ge 1.054$ on $Q$, so the square is non-degenerate.

   The signed distance to the ellipse is enclosed exactly: the closest-point equation's root is bracketed and the bracket verified in intervals. No trigonometric functions are used.

The computation takes under a second (`node tools/certify-square.js`), and runs live on the companion page. An independent re-implementation in Python, using the interval arithmetic of the mpmath library and sharing only the box definition, confirms it (`tools/verify_certificates.py`), as does a third in C with the Arb library (`tools/verify-certificates.c`). Only IEEE 754 arithmetic ($+, -, \times, \div, \sqrt{\ }$, each correctly rounded) and about 300 lines of code are trusted.

> **Corollary 6.1.** Let $W(\theta) = (1 - 2^{-1/2})\sum_{k \ge 0} 2^{-k/2}\cos(2^k(\theta - 0.3))$. The curve $\rho = r_E + 0.15\,W$ has an inscribed square, and so does $r_E + 0.15 f$ for every continuous $|f| \le 1$.

The curve $r_E + 0.15\,W$ lies outside the classical cases:
- it is nowhere differentiable (Hardy);
- it is not locally a graph in any direction, since a monotone coordinate would make $W$ differentiable almost everywhere, so it is not locally monotone;
- it has no reflection or point symmetry.

Theorem 6's neighbourhood is $4.2$ times wider than $1/(10\kappa) = 0.036$ for this ellipse. We do not claim that no other smooth reference curve brings Corollary 6.1 within Chambers' theorem. The certificate's value is that it is explicit, checkable, and reaches a rough class directly.

**Tetrahedra on rough surfaces.** In 3D, fix the tetrahedron's orientation, with unit vectors $w_0, \dots, w_3$ from its centre to its vertices; an exactly orthogonal rational rotation (a Cayley transform) keeps them exact. The unknowns are the centre $x$ and circumradius $s$, and the equations are $G(x, s) = (\mathrm{sd}(x + s w_k))_k \in \mathbb{R}^4$. The vertices do not depend on the surface, so a radial perturbation of size $T$ moves $G$ by at most $T$, and the degree lemma applies with $n = 4$.

> **Theorem 7.** Let $E$ be the ellipsoid with semi-axes $1, 0.8, 0.6$. Every surface $\rho(\omega)\omega$ with $|\rho - r_E| \le 0.13$ has an inscribed regular tetrahedron (in a fixed orientation) with circumradius at least $0.4089$. If $|\rho - r_E| \le 0.06$, it has one in every orientation within $4.16°$ of that one.

The computation (`node tools/certify-tetra.js`, seconds on 4 cores) checks the 8 faces of the 4D box ($c = 0.26$) in adaptive cells. Each cell is checked at its centre, with an explicit bound for the change across it, and split only if the margin is too small for its size. All 997,168 cells pass both conditions of the degree lemma with $\tau = T = 0.13$. A uniform grid would need 64 million samples for the weaker $T = 0.12$. An independent Python/mpmath implementation reaches the same 997,168 cell decisions.

Turning the tetrahedron by an angle $\theta$ moves $G$ by at most $s_{\max}\theta$, which acts as one more perturbation. That gives the open set of orientations.

> **Corollary 7.3.** If $|\rho - r_E| \le 0.02$, the surface has an inscribed regular tetrahedron in every orientation.

Write rotations as unit quaternions, with Cayley vector $q = v/w$. The tetrahedron's symmetries are the 24 Hurwitz units, and every rotation is equivalent under them to one whose Cayley vector lies in the octahedron $|a| + |b| + |c| \le 1$. That octahedron is covered by 10,544 cubes of half-width $1/36$. Within a cube of half-width $h$, the vertices turn by at most $2\sqrt3\,h\,s$. So the certificate at each cube's centre, with that turning counted as an extra perturbation, covers the whole cube. All 10,544 certificates pass (8.26 billion cells, 108 minutes on 4 cores). The covering is re-checked in exact arithmetic, and a random sample of 100 cubes in C with Arb.

With $F(\omega) = (1 - 2^{-1/2})\sum_k 2^{-k/2}\cos(2^k\langle\omega, e\rangle)$, the surface $r_E + 0.13\,F$ is not $C^1$, so Gromov's theorem does not cover it, but Theorem 7 does.

**A negative result.** The same method fails on a self-similar Weierstrass blob $\rho = 1 + \sum_k 0.085\cdot 2^{-k/2}\cos(m2^k\theta + \phi_k)$. Taking the $K$-octave truncation as the base curve, the certifiable perturbation is about $1/5$ of the remaining tail at every $K$ tested:

| $K$ | tail | certifiable |
|---|---|---|
| 2 | 0.145 | 0.026 |
| 3 | 0.103 | 0.023 |
| 4 | 0.073 | 0.014 |

Each octave shrinks both quantities by the same factor. A certificate of this kind needs a base curve whose square is robust at a scale larger than the remaining roughness. A curve with self-similar roughness at a fixed relative size never provides one. This is a quantitative form of the difficulty of the open case.

## 6. Numerical studies

All studies run in the browser (`pages/inscribed-study.html`) and from the command line (`node tests/run-study.js all`). Raw data are in `data/`.

### 6.1 Square shrinkage on fractal curves

Four fractal families are refined level by level with a fixed seed, so the levels converge uniformly to a limit curve. At each level, squares are continued from the previous level and searched for afresh.

| Family, roughest level | Edges | Largest square / width |
|---|---|---|
| Koch snowflake, level 7 | 49,152 | 0.910 (unchanged since level 4) |
| Minkowski island, level 5 | 131,072 | 1.017 |
| Weierstrass blob, level 14 | 131,072 | 0.829 (steady from level 11) |
| Random coastline, level 16 | 65,536 | 0.832 (0.83–0.85 since level 10) |

The tracked squares change size by less than 1% per level at the highest levels. This is the hypothesis of Lemma 4, observed for finitely many levels.

### 6.2 Tetrahedra on fractal surfaces and rectangles of every aspect ratio

Sixteen regular tetrahedra, started at fixed orientations, are followed on three fractal surface families up to 16 octaves:
- Weierstrass-type, Hölder exponent $0.5$;
- ridged;
- Hölder exponent $0.3$.

The smallest tracked tetrahedron changes from $0.895$ to $0.894$, $0.899$ to $0.948$, and $0.939$ to $0.927$ (circumradius divided by mean radius) between levels 8 and 16. Some tetrahedra are lost along the way, through pair annihilation or tracking failure.

Rectangles with aspect ratios from $1{:}1$ to $16{:}1$ were found on all 9 test curves, in all 81 cells. On the ellipse, the search finds exactly one square and two rectangles of every other ratio.

### 6.3 Parity

A $(u, v)$ grid search with Newton refinement, repeated on finer grids until the count stabilises, enumerates every inscribed square and $2{:}1$ rectangle. Over 44 curves and levels:
- the square count settled in 38 cases and was odd in all of them, from 1 up to 171;
- the rectangle count settled in 34 cases and was even in all of them.

Signed counts vanish, because a square's two diagonals carry opposite signs. Counts fail to settle on non-generic curves (circles, long parallel edges) and on rough curves, where small squares appear at every scale.

## 7. Open problems

| Problem | Status |
|---|---|
| Square in every Jordan curve | open |
| Rectangle of every aspect ratio in every Jordan curve | open; smooth case solved |
| Regular simplex in every Jordan sphere | open; $C^1$ case solved (Gromov); convex case in admissible orientations, and a neighbourhood of one ellipsoid, in every orientation within 0.02 (Thm 7, Cor 7.3), here |
| Cross-polytope in every (smooth convex) sphere | open in general |
| Cube in every Jordan surface | false (Theorem 1), with an explicit egg (Thm 1.3); true for centrally symmetric convex bodies |

Two directions follow from this work:
- **Larger certified neighbourhoods.** Theorems 6–7 could start from other smooth base curves and surfaces, use several boxes, or replace the linearisation by a higher-order model.
- **Wider 3D certificates.** Second-derivative bounds for the signed distance would enlarge Theorem 7's neighbourhood, and a finer covering of the rotations would give every orientation for a wider neighbourhood than 0.02.

## References

- G. R. Chambers, "On the square peg problem", arXiv:2203.02613 (2022).
- A. Emch, "Some properties of closed convex curves in a plane", *Amer. J. Math.* 35 (1913).
- M. Golubitsky, V. Guillemin, *Stable Mappings and Their Singularities*, Springer GTM 14 (1973).
- J. E. Greene, A. Lobb, "The rectangular peg problem", *Ann. of Math.* 194 (2021).
- M. L. Gromov, "Simplexes inscribed on a hypersurface", *Mat. Zametki* 5 (1969) 81–89.
- G. H. Hardy, "Weierstrass's non-differentiable function", *Trans. Amer. Math. Soc.* 17 (1916).
- T. Hausel, E. Makai, A. Szűcs, "Inscribing cubes and covering by rhombic dodecahedra via equivariant topology", *Mathematika* 47 (2000).
- R. N. Karasev, "Inscribing a regular crosspolytope", arXiv:0905.2671 (2009).
- V. V. Makeev, "On inscribing a regular octahedron in a three-dimensional convex body with smooth boundary", *Zap. Nauchn. Sem. POMI* 279 (2001).
- B. Matschke, "A survey on the square peg problem", *Notices AMS* 61(4) (2014).
- M. D. Meyerson, "Equilateral triangles and continuous curves", *Fund. Math.* 110 (1980); "Balancing acts", *Topology Proc.* 6 (1981).
- M. J. Nielsen, "Triangles inscribed in simple closed curves", *Geom. Dedicata* 43 (1992).
- M. J. Nielsen, S. E. Wright, "Rectangles inscribed in symmetric continua", *Geom. Dedicata* 58 (1995).
- L. G. Schnirelmann, "On certain geometrical properties of closed curves", *Uspekhi Mat. Nauk* 10 (1944).
- R. Schneider, *Convex Bodies: The Brunn–Minkowski Theory*, 2nd ed., CUP (2014).
- W. Stromquist, "Inscribed squares and square-like quadrilaterals in closed curves", *Mathematika* 36 (1989).
- T. Tao, "An integration approach to the Toeplitz square peg problem", *Forum Math. Sigma* 5 (2017).
