# Inscribed Problems
This project presents **conjectures** and a skeletal constraint-based search, a "rattling frame" construction, intended as evidence and motivation for the conjecture that a state of mechanical equilibrium exists for all continuous, non-self-intersecting 2D or 3D volumes (containing a regular triangle, square, regular tetrahedron, and cube).

**Status.** The conjectures for general continuous Jordan curves / surfaces are **open problems** in the literature. The 2D inscribed-square case is the Toeplitz conjecture: open for general continuous curves, and proved for convex curves (Emch), smooth curves (Schnirelmann) and locally monotone curves, which include all polygons (Stromquist 1989). The 3D inscribed-tetrahedron case is proved for smooth ($C^1$) surfaces, in every orientation (Gromov 1969), and open for general continuous surfaces. The 3D inscribed-cube conjecture is **false** for generic surfaces, even smooth convex ones ([PROOFS.md](PROOFS.md), Theorem 1); it holds for centrally symmetric convex bodies (Hausel–Makai–Szűcs 2000). The arguments below are **proposed proofs of conjectures**, not established results, except where marked. See the [problem map](#problem-map), [PROOFS.md](PROOFS.md) and [References](#references).

This repository also contains some other proposed arguments of mine.

## Interactive Demonstration
You can view the **Inscribed Square & Cube Viewfinder** in action here:
[Run the Live Viewfinder](https://thor110.github.io/InscribedSquareProblem/)

Note that the viewfinders are simpler demonstrations, while the skeletal finders more accurately showcase the method.

### What the finders do

- **Skeletal Shape Finder (2D).** A jig of rays from a common centre $I$ grips the curve. The rays point at the target shape's vertices as seen from its circumcentre, so the hit points form the target exactly when every ray has the same length. Targets: square, rectangle of any aspect ratio, equilateral triangle, triangle of any shape, regular pentagon and regular hexagon. The centre is "rattled" toward the chord midpoints, then Newton's method solves the equilibrium to machine precision. For the square the jig sweeps its rotation looking for the sign change in the diagonal difference (the IVT step). If that sweep fails, it tries a nearest-hit jig, then random restarts, then a *tracking* jig whose arms follow a chosen crossing. The tracking jig is needed on curves that are not star-shaped, where a square's vertex can be a middle crossing of a ray.
- **Skeletal Space Finder (3D).** The same idea with rays along the cube diagonals, the tetrahedral directions or the octahedral axes. A Levenberg–Marquardt solver adjusts the centre (3 DoF) and rotation (3 DoF) to make every ray length equal. On fractal surfaces it solves a smoothed surface first and adds detail one octave at a time.
- **Pivot only.** Both skeletal finders have a *Pivot only* checkbox. It keeps the skeleton's rotation fixed and only jiggles the central pivot, which isolates the bisection step. An equilateral triangle (2D) or regular tetrahedron (3D) is still found at any rotation, because centring alone forces equal ray lengths. A square, cube or octahedron generally is not, because it needs the rotation as well.
- **Inscribed Cube Viewfinder.** Searches directly for a cube with all eight vertices on the surface, adjusting centre, rotation and size (7 parameters for 8 vertex conditions). Moving the sliders shows the closest cube at that orientation. (Earlier versions grew the largest cube that fits *inside* the surface, which is a different problem.)
- **Search time estimates.** Each finder shows an estimated search time for the chosen shape and curve or surface, plus elapsed time and remaining time while it runs. Where no exact solution is expected, such as a cube on a surface without symmetry or a square with its rotation held fixed, the estimate is **∞**. The search still runs through its set number of starting points and then reports the closest candidate.
- **Curves:** smooth blobs, star, circle (a control on which every target exists), ellipse, polygons, a true crescent, a comb, a spiral (not star-shaped from any point), and the fractals: Koch snowflake (12,288 edges), hexagonal anti-snowflake, Minkowski island (16,384 edges), Weierstrass blob and a random fractal coastline. `tests/jordan-check.js` confirms each is a simple closed curve.
- **Surfaces:** sphere, ellipsoid, a lopsided egg (strictly convex, no symmetry), random blob, bumpy sphere, 3D star, heart-like, ring-like, cube-like, and two fractal surfaces. All are seam-free.

### Verification and precision

A shape is marked **locked / verified** only after an independent check. That check compares **every pairwise vertex distance** with the ideal shape, and **every vertex's distance to the curve or surface**, against a relative tolerance of $10^{-9}$. Typical verified results are accurate to about $10^{-16}$, the limit of double-precision arithmetic.

Earlier versions could report a lock on the wrong shape:

- The 2D finder forced "locked" after a sign change even when the sign change came from a jump in the chord function (non-convex curves).
- The 3D finder checked only the 4 long diagonals and 12 edges of the cube. Two nested regular tetrahedra of *different* sizes pass that test without being a cube. Its tolerance was also about 0.5%.

The pairwise-distance check rules out both. Every curve and surface is generated from a seed, and the URL records it (`?curve=koch&seed=42`), so any result can be reproduced.

![Inscribed Square Viewfinder Demo](images/viewfinder_demo.gif)

## Problem map

The original four problems ask for an inscribed equilateral triangle, square, regular tetrahedron and cube. The triangle is solved. Each of the other three belongs to a family that continues into every dimension, because the skeletal jig works the same way in $\mathbb{R}^n$:
- **Square:** its jig (two perpendicular chords, bisected and equal) generalises to the **cross-polytope** (octahedron in 3D, 16-cell in 4D), *not* to the hypercube.
- **Cube:** generalises to the hypercube.
- **Tetrahedron:** generalises to the regular simplex.

*Expected dimension* is the number of degrees of freedom of a similar copy, $n(n+1)/2+1$, minus the number of vertices. *Found* is from this repository's verified searches: an inscribed copy whose pairwise distances and surface distances all agree to 1e-9. Test curves and surfaces include fractals, non-convex shapes and a strictly convex surface with no symmetry.

| Family | Shape | Dim | Vertices | Expected dim. | Status in the literature | Proved here | Found by the finders |
|---|---|---|---|---|---|---|---|
| Triangle | Equilateral / any triangle | 2 | 3 | 1 | **Solved** for all Jordan curves (Meyerson 1980, Nielsen 1992) | — | ✅ every curve tested |
| **Square** | Square | 2 | 4 | 0 | **Open** for continuous curves. Proved for convex (Emch), smooth (Schnirelmann), locally monotone (Stromquist), small-Lipschitz (Tao) | — | ✅ every curve tested (16 + 3 in the n-D engine) |
| Square | Rectangle, any aspect ratio | 2 | 4 | 0 | **Open** for continuous curves. Proved for smooth (Greene–Lobb 2021); *some* aspect ratio always exists (Vaughan) | — | ✅ every curve tested |
| Square | Regular pentagon, hexagon, … | 2 | 5, 6, … | < 0 | Known to fail in general (e.g. ellipses) | Theorem 1 (generic) | ✅ only on curves with matching symmetry |
| Square | Regular octahedron | 3 | 6 | 1 | **Open.** Proved for smooth convex bodies (Makeev 2001) | — | ✅ every surface tested |
| Square | Cross-polytope (16-cell, …) | 4, 5 | 8, 10 | 3, 6 | **Open.** Proved for smooth convex bodies when $n$ is an odd prime power (Karasev 2009) | — | ✅ every surface tested (5 surfaces × 2 seeds in each dimension) |
| **Cube** | Cube | 3 | 8 | **−1** | Proved for centrally symmetric convex bodies (Hausel–Makai–Szűcs 2000) | **False in general** (Theorem 1) | ❌ except on symmetric surfaces |
| Cube | Hypercube | 4, 5 | 16, 32 | −5, −16 | — | **False in general** (Theorem 1) | ✅ only on the sphere and ellipsoid; ❌ elsewhere (closest misses 0.6–9%) |
| Cube | Icosahedron, dodecahedron | 3 | 12, 20 | −5, −13 | — | **False in general** (Theorem 1) | not tested |
| **Tetrahedron** | Regular tetrahedron | 3 | 4 | 3 | **Open** for continuous surfaces. Proved for $C^1$ surfaces in every orientation (Gromov 1969) | Elementary proof for smooth strictly convex bodies (Theorem 2) | ✅ every surface tested, at any rotation |
| Tetrahedron | Regular simplex (5-cell, …) | 4, 5 | 5, 6 | 6, 10 | **Open** for continuous; proved for $C^1$ (Gromov) | Theorem 2 (convex, every dimension) | ✅ every surface tested (5 surfaces × 2 seeds in each dimension) |

**Where the three open problems stand.**
1. **Square:** open. Every test agrees with the conjecture. The jig argument is a proof for convex curves (Emch's); for non-convex curves the step "the bisecting centre moves continuously as the jig rotates" fails, and that gap is the open problem.
2. **Tetrahedron:** solved for smooth surfaces (Gromov), so what remains open is non-smooth (merely continuous) surfaces. Your centring jig gives an elementary proof in the smooth strictly convex case, in every dimension ([PROOFS.md](PROOFS.md), Theorem 2).
3. **Cube:** settled in the negative for general surfaces ([PROOFS.md](PROOFS.md), Theorem 1): a cube has 7 degrees of freedom but 8 vertex conditions, so generic surfaces have none. The same holds for every hypercube in dimension ≥ 3.

<details><summary>Full n-dimensional results (seed 1; ✅ verified with its error, ❌ closest miss)</summary>

| n | Shape | Vertices | Expected dimension | Sphere | Ellipsoid | Lopsided egg | Random blob | Fractal blob | Literature |
|---|---|---|---|---|---|---|---|---|---|
| 2 | equilateral triangle | 3 | 1 | ✅ 6e-17 | ✅ 3e-16 | ✅ 1e-16 | ✅ 2e-16 | ✅ 1e-16 | Solved for all Jordan curves (Meyerson 1980; Nielsen 1992) |
| 2 | square | 4 | 0 | ✅ 0e+0 | ✅ 2e-16 | ✅ 3e-16 | ✅ 4e-16 | ✅ 6e-16 | Open for continuous curves; proved for smooth (Schnirelmann), convex (Emch), locally monotone (Stromquist) |
| 3 | regular tetrahedron | 4 | 3 | ✅ 4e-16 | ✅ 1e-16 | ✅ 5e-16 | ✅ 3e-16 | ✅ 3e-16 | Open for continuous; proved for C¹ spheres in every pose (Gromov 1969) |
| 3 | regular octahedron | 6 | 1 | ✅ 0e+0 | ✅ 9e-16 | ✅ 8e-16 | ✅ 8e-16 | ✅ 5e-16 | Open; proved for smooth convex bodies (Makeev 2001) |
| 3 | cube | 8 | -1 | ✅ 0e+0 | ✅ 4e-16 | ❌ 2e-2 | ❌ 9e-3 | ❌ 2e-4 | False for generic smooth surfaces (PROOFS.md); true for centrally symmetric convex bodies (Hausel–Makai–Szűcs 2000) |
| 4 | regular 5-cell | 5 | 6 | ✅ 1e-16 | ✅ 5e-16 | ✅ 6e-16 | ✅ 4e-16 | ✅ 4e-16 | Open for continuous; proved for C¹ spheres in every pose (Gromov 1969) |
| 4 | regular 16-cell | 8 | 3 | ✅ 0e+0 | ✅ 7e-16 | ✅ 1e-15 | ✅ 1e-15 | ✅ 1e-15 | Open; proved for smooth convex bodies when n is an odd prime power (Karasev 2009) |
| 4 | tesseract | 16 | -5 | ✅ 0e+0 | ✅ 1e-15 | ❌ 1e-2 | ❌ 5e-2 | ❌ 1e-2 | False for generic smooth hypersurfaces (PROOFS.md) |
| 5 | 5-simplex | 6 | 10 | ✅ 1e-16 | ✅ 6e-16 | ✅ 4e-16 | ✅ 6e-16 | ✅ 6e-16 | Open for continuous; proved for C¹ spheres in every pose (Gromov 1969) |
| 5 | 5-orthoplex | 10 | 6 | ✅ 0e+0 | ✅ 5e-16 | ✅ 1e-15 | ✅ 2e-15 | ✅ 2e-15 | Open; proved for smooth convex bodies when n is an odd prime power (Karasev 2009) |
| 5 | 5-cube | 32 | -16 | ✅ 1e-16 | ✅ 1e-14 | ❌ 1e-2 | ❌ 6e-2 | ❌ 6e-2 | False for generic smooth hypersurfaces (PROOFS.md) |

</details>

The [Dimension Explorer](https://thor110.github.io/InscribedSquareProblem/pages/dimension-explorer.html) runs the n-dimensional searches in the browser and fills in this kind of table live; `node tests/run-nd.js 5` does the same from the command line.

## What holds weight

A summary of where each part of the project stands, combining the literature with this repository's numerical results (228 automated runs; see [Running the checks](#running-the-checks)).

| Claim or argument | Numerical result | Standing |
|---|---|---|
| **Degrees-of-freedom count** (corrected table below) | Predicted the outcome of every run: shapes with enough freedom were always found; over-determined shapes were found only on curves or surfaces with a matching symmetry | Strongest general principle here. Standard transversality reasoning; predicts *where* to expect solutions, not a proof that they exist |
| **Centring forces regularity** for the triangle and tetrahedron jigs (rays whose directions sum to zero, one more ray than the dimension) | Verified on every curve and surface, at every rotation, including pivot-only mode, in dimensions 2–5 | **Proved** for smooth strictly convex bodies in every dimension ([PROOFS.md](PROOFS.md), Theorem 2); the $C^1$ case in general is Gromov's theorem |
| **Square: bisect, then rotate 90° (IVT)** | Verified on all 16 curves, including fractals; jumps observed on non-convex curves | Rigorous for convex curves (this is Emch's argument). For non-convex curves the continuity step fails; the general case is the open Toeplitz problem |
| **Rectangles of a given aspect ratio** | Verified on all 16 curves at aspect 2 and on 6 curves at aspect 4 | The 90° swap does not apply (the chords never trade places), so the IVT step gives nothing. Proved for smooth curves (Greene–Lobb 2021); open for continuous curves |
| **Triangles of any shape** | Verified on all 16 curves, including an obtuse 20°/30°/130° triangle | Known theorem (Nielsen 1992) |
| **Regular octahedron** | Verified on all 11 surfaces | 1-parameter family expected; related results by Makeev |
| **Cube** | Verified only on surfaces with central or mirror symmetry; elsewhere the closest cube misses by 5e-5 to 5e-2 | **Disproved** for generic surfaces ([PROOFS.md](PROOFS.md), Theorem 1); true for centrally symmetric convex bodies (Hausel–Makai–Szűcs) |
| **Regular pentagon / hexagon** (controls) | Verified only on the circle and on curves with 5-fold (pentagon) or 3- or 6-fold (hexagon) symmetry | Known to fail in general: a non-circular ellipse has no inscribed regular pentagon, because five points determine a conic |
| Expansion paradox | — | Does not hold as stated (see caveat in that section) |
| Odd perfect number heuristic | — | Refuted as stated: odd abundant numbers such as 945 exist |

**Shape coverage.** The finders now cover the inscribed shapes studied in the literature for planar Jordan curves: squares, rectangles of any aspect ratio, and triangles of any shape. Regular pentagons and hexagons are included as controls. In 3D they cover the regular tetrahedron, octahedron and cube. Not included, by design:
- **Icosahedron and dodecahedron:** with 7 DoF against 12 or 20 vertex conditions they fail even more decisively than the cube.
- **Irregular tetrahedra of a given shape:** the 3D analogue of Nielsen's theorem, a 3-parameter family like the regular tetrahedron. A natural next addition.
- **Curves in $\mathbb{R}^n$ and higher-dimensional simplices:** for example Gupta–Rubinstein-Salzedo. Outside the 2D/3D scope of these pages.

## Inscribed Triangle Problem

This problem is already solved. Every Jordan curve inscribes equilateral triangles (Meyerson 1980), and in fact triangles similar to any given triangle (Nielsen 1992). Gupta and Rubinstein-Salzedo extend Nielsen's result to Jordan curves in $\mathbb{R}^n$ for a restricted set of triangles ([arXiv:2102.03953](https://arxiv.org/abs/2102.03953)).

I have presented a demonstration using my method anyway which can be seen here. The Skeletal Shape Finder also handles triangles of any given shape (*Inscribed Triangle (any shape)*, angles entered as `A,B`), which is Nielsen's theorem.

In the jig the three rays are 120° apart. If $I$ is the centroid of the three hit points, the three ray lengths must be equal, so the triangle is equilateral **at every rotation**. Inscribed equilateral triangles therefore come in a 1-parameter family. This matches the degrees-of-freedom count below and the literature above.

![Inscribed Triangle Shapefinder Demo](images/triangle_demonstration.gif)

[Run the Skeletal Shape Finder](https://thor110.github.io/InscribedSquareProblem/pages/skeletal-shapefinder.html?shape=triangle)

## Inscribed Square Problem
**Conjecture and proposed argument.** The general continuous-Jordan-curve case (the Toeplitz conjecture) is open; this section presents the conjecture, an informal argument, and a simulation illustrating it. Known cases:

- convex curves: Emch 1913/1916;
- smooth curves: Schnirelmann 1929/1944;
- locally monotone curves, including every polygon: Stromquist 1989;
- curves made of two Lipschitz graphs with constant below 1: Tao 2017.

Greene and Lobb (2021) proved the stronger statement that smooth Jordan curves inscribe rectangles of **every** aspect ratio. Matschke's 2014 survey covers the history.

**The Skeletal Frame:** Let $C$ be any Jordan curve.

Define a 'Skeletal Jig' consisting of two perpendicular lines intersecting at a common midpoint $I$.

**The Points of Intersection:** As $I$ moves within $C$ and the jig rotates ($\theta$), the lines intersect $C$ at four points ($E, F, G, H$), forming two perpendicular chords.

**The Continuity of Chords:** Because $C$ is a continuous Jordan curve, the lengths of these chords and their distances from $I$ vary continuously with respect to $I(x, y)$ and $\theta$. *(This holds for convex curves. For non-convex curves a ray can cross $C$ several times, and the gripped crossing can jump as $I$ or $\theta$ moves. The Skeletal Shape Finder counts these jumps as "discontinuities".)*

**The First Equilibrium (Length):** At any fixed point $I$, rotating the jig $90^\circ$ swaps the two chords. If Chord 1 was longer than Chord 2, it is now shorter. By the Intermediate Value Theorem (IVT), there must exist an angle $\theta$ where the two perpendicular chords are equal in length.

**The Second Equilibrium (Bisection):** As $I$ is moved through the interior of $C$, the offset of these equal-length chords (the distance from $I$ to the boundary) also varies continuously. There exists a position for $I$ where the midpoint of the jig aligns with the midpoints of both chords.

> **Open step.** For each angle $\theta$, the bisection condition (2 equations) fixes the centre $I(\theta)$, and the chords then form a rhombus. Turning $\theta$ by 90° swaps the diagonals, so the IVT gives a square **provided $I(\theta)$ exists and varies continuously**. For convex curves it does, and the argument then closely follows Emch's proof for convex curves. For non-convex curves $I(\theta)$ can split into branches or jump, and that continuity is exactly the step that is not established. In the limit of very rough curves, squares can also shrink to a point. Closing the argument in general needs a topological (degree / equivariant) argument that I do not carry out here.

**The Result:** When the chords are perpendicular, equal in length, and bisected at $I$, the vertices $E, F, G, H$ define an inscribed square.

**Conjecture (Toeplitz).** Every Jordan curve in the plane contains an inscribed square.

![Inscribed Square Shapefinder Demo](images/square_demonstration.gif)

[Run the Skeletal Shape Finder](https://thor110.github.io/InscribedSquareProblem/pages/skeletal-shapefinder.html)

## Inscribed Rectangle Problem (Rectangular Peg)

**Status.** Every smooth Jordan curve inscribes rectangles of every aspect ratio (Greene–Lobb 2021). For general continuous curves, rectangles of *some* aspect ratio always exist (Vaughan's argument, published by Meyerson 1981), but *every* aspect ratio is open.

**The jig.** Two chords through $I$ crossing at angle $2\alpha$, where $\tan\alpha$ is the rectangle's height-to-width ratio. If both chords are bisected at $I$ and have equal lengths, the four hit points form the rectangle.

**Why the square argument does not carry over.** For the square, rotating the jig by 90° swaps the two chords, so the diagonal difference must change sign. For any other aspect ratio no rotation swaps the chords: after half a turn the jig returns to itself with the same sign. That is why the rectangle problem needed new ideas (symplectic geometry, in Greene–Lobb's proof). The Skeletal Shape Finder still finds rectangles on every test curve, using its random-restart and tracking phases.

![Inscribed Rectangle Shapefinder Demo](images/rectangle_demonstration.gif)

[Run the Skeletal Shape Finder (rectangle, aspect 2)](https://thor110.github.io/InscribedSquareProblem/pages/skeletal-shapefinder.html?shape=rectangle&p=2)

## Inscribed Cube Problem
> **Update: disproved in general.** [PROOFS.md](PROOFS.md) (Theorem 1) shows that generic smooth surfaces, including strictly convex ones, contain no inscribed cube, so the conjecture below is false as stated. It is true for centrally symmetric convex bodies (Hausel–Makai–Szűcs 2000). The original argument is kept for reference.

**Conjecture and proposed argument.** The case of **centrally symmetric** convex bodies in $\mathbb{R}^3$ is established (Hausel–Makai–Szűcs 2000). The general case is not, and the numerical evidence below suggests it fails for surfaces without symmetry. This section presents the conjecture together with an informal extension of the 2D skeletal-jig construction to 3D, which should be read as heuristic.

**The 3D Skeletal Jig:** Let $C$ be any closed 3D Jordan surface.

Define a 3D "Skeletal Jig" representing the four internal diagonals of a cube. These four lines intersect at a common midpoint I and provide eight points of intersection with the surface C.

**The Points of Intersection:** As $I$ moves within $C$ and the jig rotates, the four diagonals intersect $C$ at eight points, forming four diagonal chords.

**The First Equilibrium (Length):** At any fixed point $I$, rotating the jig allows the diagonals to swap positions. Because the lengths of the chords vary continuously as they rotate, the Intermediate Value Theorem (IVT) guarantees an orientation where all four diagonal chords are equal in length.

**The Second Equilibrium (Bisection):** As $I$ is moved through the 3D interior of $C$, the offset of these equal-length chords (the distance from $I$ to the boundary) varies continuously. There exists a position for $I$ where the midpoint of the jig aligns with the midpoints of the four equal-length chords.

> **Open step.** The 1-parameter IVT claim above only equalises two diagonal lengths at a time. Pinning down all four simultaneously requires an equivariant argument whose configuration space carries the full octahedral symmetry of the cube; I do not verify this in generality here.

**The Result:** When the four chords are equal in length, and bisected at $I$, the eight points of intersection define the vertices of an inscribed cube.

**Conjecture.** Every closed 3D Jordan surface contains an inscribed cube.

> **Numerical evidence against the general case.** A cube has 7 degrees of freedom (centre 3, rotation 3, size 1). Placing all 8 vertices on a surface is 8 conditions. In jig terms, 6 DoF must satisfy 7 equalities among 8 ray lengths. With more conditions than freedoms, a *generic* surface is not expected to contain any inscribed cube. Symmetry removes conditions, which is why centrally symmetric (or mirror-symmetric) surfaces do contain cubes.
>
> Skeletal Space Finder, cube mode, 2 seeds per surface; the error is the best candidate's relative error:
>
> | Surface | Symmetry | Result |
> |---|---|---|
> | Sphere, ellipsoid, ring-like, cube-like | central | cube verified, error ≈ 1e-16 |
> | Heart-like | mirror plane | cube verified, error ≈ 1e-15 |
> | Bumpy sphere | none | none; best 2.6e-4 and 8.2e-4 |
> | Random blob | none | none; best 1.9e-2 and 5.4e-2 |
> | 3D star | none | none; best 4.0e-2 and 1.8e-2 |
> | Lopsided egg (strictly convex) | none | none; best 2.35e-2 |
> | Fractal blob / fractal ridged | none | none; best 5.2e-4, 1.0e-3 / 2.6e-4, 7.6e-4 |
>
> The Inscribed Cube Viewfinder searches cubes directly and gives the same split: cubes are verified on every symmetric surface, and on the others the closest cube found has error 5e-5 to 4e-2. On the same surfaces, regular tetrahedra and octahedra verify to about 1e-16 every time. The lopsided egg was cross-checked with an independent optimiser: 400 random starts over all cubes in space found no vertex closer than 2.8% (relative to the cube's size) to the surface. As the egg's asymmetry parameter $\varepsilon$ shrinks, the best cube's error shrinks in proportion (about $0.16\,\varepsilon$). Failing to find a cube numerically is not a proof that none exists, but these results are consistent with the dimension count.

![Inscribed Cube Spacefinder Demo](images/cube_demonstration.gif)

[Run the Skeletal Space Finder](https://thor110.github.io/InscribedSquareProblem/pages/skeletal-spacefinder.html)

## Inscribed Tetrahedron Problem
> **Update.** Gromov (1969) proved that every $C^1$-smooth sphere in $\mathbb{R}^n$ contains an inscribed simplex similar to any given simplex, in every orientation; this includes the regular tetrahedron. [PROOFS.md](PROOFS.md) (Theorem 2) turns the centring argument below into an elementary proof for smooth strictly convex bodies. The case of general continuous surfaces remains open.

**Conjecture and proposed argument.** This section is a conjecture together with an informal extension of the 2D skeletal-jig construction.

**The Tetrahedral Jig:** Let $C$ be any closed 3D Jordan surface.

Define a 'Skeletal Jig' consisting of four rays extending from a common midpoint $I$ at the fixed tetrahedral angle of approximately $109.5^\circ$ from one another.

**The Points of Intersection:** As $I$ moves within $C$ and the jig rotates, the four rays intersect $C$ at four points ($E, F, G, H$).

**The First Equilibrium (Length):** Because the surface $C$ is continuous, the distances from $I$ to the four intersection points ($E, F, G, H$) vary continuously. By rotating the jig, the rays swap orientations. The Intermediate Value Theorem (IVT) guarantees that there exists an orientation and a position for $I$ where the distances from the midpoint to all four boundary points are equal.

**The Second Equilibrium:** Since the "Skeletal Jig" is composed of four axes passing through $I$, there are actually eight potential intersection points with $C$. This provides "twice the leverage," ensuring that even in highly irregular surfaces, the jig has multiple rotational paths to find a state where the primary four rays reach a length equilibrium.

> **Open step.** Equalising all four distances simultaneously — not two at a time — requires an equivariant argument on the configuration space under the full tetrahedral symmetry. The "twice the leverage" remark above is heuristic and does not substitute for this.

**The Result:** When four points on a continuous surface are equidistant from a common center $I$ and maintained at regular tetrahedral angles, those points ($E, F, G, H$) define an inscribed regular tetrahedron.

**Conjecture.** Every closed 3D Jordan surface contains an inscribed regular tetrahedron.

**Note.** If $I$ is the centroid of the four hit points, the four ray lengths must be equal, so the jig is a regular tetrahedron at every rotation. The rotation does not need searching. Regular tetrahedra come in a 3-parameter family (see the count below), and the Skeletal Space Finder verifies one on every test surface, including the fractals.

## Inscribed Octahedron (added for comparison)

The Skeletal Space Finder also has an octahedron mode: six rays along $\pm x, \pm y, \pm z$. A regular octahedron has 7 DoF and 6 vertex conditions, so a 1-parameter family is expected. The finder verifies one on every test surface. Makeev has related results on regular octahedra inscribed in smooth convex bodies ([Zap. Nauchn. Sem. POMI](https://m.mathnet.ru/eng/znsl1460)).

![Inscribed Tetrahedron Spacefinder Demo](images/tetrahedron_demonstration.gif)

[Run the Skeletal Space Finder](https://thor110.github.io/InscribedSquareProblem/pages/skeletal-spacefinder.html?shape=tetrahedron)

## Degrees Of Freedom (Heuristic)

A hand-wavy informal count of why one might expect the conjectures above to be true. This is **not** a proof — dimensional counting tells you the expected dimension of the solution set, not that a solution exists. The conjectures stand or fall on the equivariant / topological arguments in the sections above.

To motivate an equilibrium state, the available Degrees of Freedom (DoF) should meet or exceed the number of equality constraints required to make the shape regular.

A regular shape in the plane has 4 DoF (centre 2, rotation 1, size 1); in space it has 7 (centre 3, rotation 3, size 1). Each vertex that must lie on the curve or surface is one condition. Equivalently, the jig has 3 DoF in 2D and 6 in 3D (the size is set by the ray lengths), and it needs all its ray lengths equal.

| Shape | DoF | Conditions | Expected solutions |
|---|---|---|---|
| Square, or rectangle of a given aspect ratio (2D) | 4 | 4 vertices | isolated solutions (dimension 0) |
| Equilateral triangle, or any given triangle (2D) | 4 | 3 vertices | 1-parameter family |
| Regular pentagon (2D) | 4 | 5 vertices | **none for a generic curve** (dimension −1) |
| Regular hexagon (2D) | 4 | 6 vertices | **none for a generic curve** (dimension −2) |
| Cube (3D) | 7 | 8 vertices | **none for a generic surface** (dimension −1) |
| Regular tetrahedron (3D) | 7 | 4 vertices | 3-parameter family |
| Regular octahedron (3D) | 7 | 6 vertices | 1-parameter family |

(An earlier version of this section counted the cube's "6 face-centres", which are the vertices of an octahedron, not a cube, and left out the size parameter.)

**Heuristic Conclusion:** For the square, triangle, tetrahedron and octahedron, the DoF meet or exceed the conditions, so these shapes are a plausible feature of any continuous closed curve or surface. For the cube they do not, which matches the numerical evidence above. This is a motivation, not a proof.

## Expansion Paradox (Heuristic)

A second informal motivation. This is **not** a proof either — the expansion argument below shows that some intersection state exists at every scale, not that one of those states is a regular polytope.

Consider a regular polytope (triangle, square, tetrahedron, or cube) expanding from any interior point $I$ within a closed Jordan boundary.

At a scale near zero, the shape is entirely contained. At a scale larger than the volume's maximum diameter, the shape entirely encloses the boundary.

Because the boundary is continuous and non-self-intersecting, the transition from 'Interior' to 'Exterior' requires an intermediate state of mechanical equilibrium where all vertices (or rays) intersect the boundary simultaneously.

Because the Jordan boundary forbids self-intersection, this intersection cannot occur at a scale of zero, guaranteeing a non-degenerate inscribed shape.

> **Caveat.** With the centre and rotation held fixed, the vertices reach the boundary at *different* scales, not simultaneously. Making them arrive together means adjusting the centre and rotation, which is the original problem. Ruling out the zero-scale limit is also the known hard part of the Toeplitz problem.

## Perfect Odd Numbers... (Heuristic / Sketch)

**Not a proof.** This section is an informal heuristic and a visual motivation only. The non-existence of odd perfect numbers is a long-standing open problem; the argument below sketches an intuition but does not constitute a proof. Heuristic arguments based on divisor densities cannot, by themselves, rule out odd perfect numbers, since divisors of an odd integer $N$ form a sparse but unconstrained set in principle.

While modern number theory attempts to find a "Monster" odd perfect number through computational brute force, this heuristic argues the structure of an odd number's divisor set makes perfection implausible.

The "Binary Spine" Requirement:

Every known perfect number ($N$) possesses a "Binary Spine", a sequence of divisors generated by the power of 2 ($N/2, N/4, N/8, \dots, 1$). This spine provides the "Half-Weight Block" ($N/2$) which acts as the mandatory anchor for the sum of proper divisors.

The Argument:

The $1/2 N$ Anchor: For the sum of proper divisors to equal $N$, the set must contain a dominant value that provides the majority of the "weight". In all even perfect numbers, this value is exactly $1/2 N$.

The Binary Void: An odd number, by definition, cannot be halved to produce an integer. It is "Mechanically Hollow", it lacks the $N/2$ divisor and the subsequent binary chain that leads to the final values of 2 and 1.

The Sum Deficit: Without the $1/2 N$ anchor, an odd number's largest proper divisor is at most $1/3 N$. The remaining divisors ($1/5 N, 1/7 N, \dots$) are physically incapable of reaching the total of $N$ regardless of how many factors are added.

Algebraic Sketch:

If a state of "Numerical Equilibrium" (Perfection) is defined by:

$N = \sum(\text{Proper Divisors})$

And the mandatory skeleton of that equilibrium is:

$N = (1/2 N \times 2)$

$X(f) = 1/2 N$

Process Repeat $\rightarrow 1$

$\sum X = N$

## The Bridge Analogy
Attempting to construct an odd perfect number is like trying to build a bridge across a void where the laws of physics forbid the existence of the primary support beam.

In an even perfect number, the $N/2$ divisor acts as the massive central pylon that spans half the distance instantly.

Without this "Half-Weight Block," an odd number is forced to attempt the crossing using only a sprawling collection of smaller, weaker planks ($N/3, N/5, N/7 \dots$).

No matter how many millions of these smaller pieces you pile up, they are mechanically incapable of bridging the gap to $N$.

The structure is doomed to be "too light" to reach equilibrium.

## Further Explanation
If a number can be divided by something, the result is ultimately smaller if all odd numbers are smaller, they simply can not sum up to the whole number they were divided from.

1. The Even Model (Density)

In an even perfect number like $6$, you start with a 50% Anchor ($3 = 6/2$). The remaining pieces ($2, 1$) only need to cover the remaining $50\%$. The "Binary Spine" ($N/2, N/4, N/8, \dots$) creates a dense map where the pieces are large enough to reach the total easily.

2. The Odd Model (Hollowness)

In an odd number, the "Support Beam" is missing.

The Starting Gap: Your largest possible piece is only $33.3\%$ of the whole ($N/3$).

The Numerical Fjord: To reach $100\%$ ($N$), you now have a $66.6\%$ gap to fill using only progressively smaller odd divisors ($N/5, N/7, N/9, \dots$).

Mechanical Inevitability: As $N$ gets larger, these divisors become more "Sparse". My argument is that the "Numerical Gravity" of these smaller pieces isn't strong enough to pull the sum up to $N$. Without the $N/2$ pylon, the bridge falls into the fjord.

In a perfect even number, the $N/2$ anchor does half the work. In an odd number, you're starting with a 66% deficit. Because divisors must be integers derived from $N$, you simply don't have enough 'Large Bricks' to fill that hole. The more you divide, the smaller the pieces get, and the farther away the whole becomes.

## Another explanation
For any odd number N, the sum of its proper divisors is structurally bounded below N because without N/2 in the divisor set, the largest available divisor is at most N/p where p is the smallest odd prime factor of N, which is at minimum 3. The remaining divisors are all smaller fractions of N derived from combinations of its prime factors, and their collective sum cannot bridge the gap to N.

> **Correction.** The claim that the divisors of an odd number "cannot bridge the gap" is false in general: odd **abundant** numbers exist. The smallest is $945$, whose proper divisors sum to $975 > 945$, and there are infinitely many. The Number Stability viewer's $N = 945$ button shows this. So the sum can overshoot $N$, and the open question is whether it can ever land **exactly** on $N$. Separately, even perfect numbers $2^{p-1}(2^p-1)$ have only the binary chain $N/2, N/4, \dots, N/2^{p-1}$; for example $28/8$ is not an integer.

## Visualisation of Structural Instability for Odd Numbers (Heuristic)
This is another visualisation I have added to the interactive demonstrations. The visual is illustrative of the heuristic in the previous sections; it is not a proof.

[Run the Number Stability Viewer](https://thor110.github.io/InscribedSquareProblem/pages/number-stability.html)

## Regenerating the demo GIFs

The GIFs in `images/` are recorded automatically from the live pages:

```bash
npm install
npm run gifs                       # all demos
node tools/record-gifs.js cube     # only demos whose name contains "cube"
```

The recorder drives each page with a fixed seed and advances the search one step per frame, so the output is identical from run to run. The demos are listed at the top of `tools/record-gifs.js`. On GitHub, the **Update demo GIFs** workflow (`.github/workflows/update-gifs.yml`) does the same whenever `pages/` changes on `main`, or on demand from the Actions tab, and commits the new GIFs. The pages also accept `?pace=N` to watch a search in slow motion, and the Space Finder accepts `?rot=pitch,roll,yaw` to set the starting rotation.

## Running the checks

The pages are plain HTML and need no build step. The scripts in `tests/` use Node.js and Playwright:

```bash
node tests/jordan-check.js       # every 2D curve is a simple closed polygon
node tests/run-2d.js 3           # square and triangle search on every curve, 3 seeds
node tests/run-2d.js 1 rectangle,trianglex,pentagon,hexagon   # the other 2D targets
node tests/run-3d.js 2           # cube, tetrahedron and octahedron search on every surface
node tests/run-cube-viewfinder.js 2   # direct inscribed-cube search on every surface
node tests/run-nd.js 5           # n-dimensional table (dimensions 2–5)
node tests/run-nd.js --check-convex   # the lopsided egg is strictly convex in 2–6 dimensions
```

## References

- A. Emch, "Some properties of closed convex curves in a plane", *Amer. J. Math.* 35 (1913); "On some properties of the medians of closed continuous curves formed by analytic arcs", *Amer. J. Math.* 38 (1916).
- L. G. Schnirelmann, "On certain geometrical properties of closed curves" (1929; expanded version in *Uspekhi Mat. Nauk* 10, 1944).
- W. Stromquist, "Inscribed squares and square-like quadrilaterals in closed curves", *Mathematika* 36 (1989).
- T. Tao, "An integration approach to the Toeplitz square peg problem", *Forum Math. Sigma* 5 (2017) — [arXiv:1611.07441](https://arxiv.org/abs/1611.07441).
- M. D. Meyerson, "Balancing acts", *Topology Proceedings* 6 (1981) — includes H. Vaughan's proof that every Jordan curve inscribes a rectangle.
- J. E. Greene and A. Lobb, "The rectangular peg problem", *Annals of Math.* 194 (2021).
- B. Matschke, "A survey on the square peg problem", *Notices AMS* 61(4) (2014).
- M. D. Meyerson, "Equilateral triangles and continuous curves", *Fund. Math.* 110 (1980).
- M. J. Nielsen, "Triangles inscribed in simple closed curves", *Geom. Dedicata* 43 (1992).
- A. Gupta and S. Rubinstein-Salzedo, "Inscribed triangles of Jordan curves in $\mathbb{R}^n$" — [arXiv:2102.03953](https://arxiv.org/abs/2102.03953).
- M. L. Gromov, "Simplexes inscribed on a hypersurface", *Mat. Zametki* 5 (1969); see also J. Cantarella, E. Denne, J. McCleary, *Forum Math. Sigma* (2022) — [arXiv:2106.12063](https://arxiv.org/abs/2106.12063).
- V. V. Makeev, inscribed regular octahedra in smooth convex bodies, *Zap. Nauchn. Sem. POMI* 279 (2001); R. N. Karasev, "Inscribing a regular crosspolytope" — [arXiv:0905.2671](https://arxiv.org/abs/0905.2671).
- T. Hausel, E. Makai and A. Szűcs, "Inscribing cubes and covering by rhombic dodecahedra via equivariant topology", *Mathematika* 47 (2000) — [arXiv:math/9906066](https://arxiv.org/abs/math/9906066).
