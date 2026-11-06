# Proofs

This document contains two results, written to be checked line by line:

1. **Theorem 1 (a disproof).** If a polytope has more vertices than the dimension of the similarity group, a *generic* smooth closed hypersurface contains no inscribed copy of it. In particular the inscribed-cube conjecture is false, even for smooth strictly convex surfaces.
2. **Theorem 2 (the centring jig, made rigorous).** Every smooth, strictly convex body in $\mathbb{R}^n$ contains an inscribed regular simplex in **every** orientation (more generally, any simplex whose circumcentre lies inside it). The proof is the skeletal-jig argument: the "rattle" is a vector field, and its zero is the inscribed simplex.

Neither result settles the open problems. The square (Toeplitz), regular tetrahedron and cross-polytope problems remain open for general *continuous* Jordan curves and surfaces; see [What remains open](#what-remains-open).

Theorem 2 is a special case of a theorem of Gromov (1969), which covers every $C^1$ embedded sphere, convex or not, and every simplex shape. Its value here is that the proof is elementary and is exactly the mechanism the Skeletal Shape and Space Finders use.

---

## Notation

- A **similarity** of $\mathbb{R}^n$ is a map $g(x) = sQx + c$ with $s > 0$, $Q \in O(n)$, $c \in \mathbb{R}^n$. The similarities form a Lie group $\mathrm{Sim}(n)$ of dimension
  $$D(n) = \underbrace{n}_{\text{translation}} + \underbrace{\tfrac{n(n-1)}{2}}_{\text{rotation}} + \underbrace{1}_{\text{scale}} = \tfrac{n(n+1)}{2} + 1.$$
  So $D(2) = 4$, $D(3) = 7$, $D(4) = 11$, $D(5) = 16$.
- Let $P$ be a polytope in $\mathbb{R}^n$ with vertices $v_1, \dots, v_m$ that affinely span $\mathbb{R}^n$. A copy of $P$ is **inscribed** in a set $\Sigma$ if $g(v_i) \in \Sigma$ for all $i$ for some $g \in \mathrm{Sim}(n)$. Since $s > 0$, the copy is non-degenerate.
- The **expected dimension** of the family of inscribed copies of $P$ in a hypersurface is $D(n) - m$: each vertex lying on $\Sigma$ is one equation.

| Polytope | $n$ | Vertices $m$ | $D(n) - m$ |
|---|---|---|---|
| Equilateral triangle | 2 | 3 | 1 |
| Square | 2 | 4 | 0 |
| Regular pentagon, hexagon, … | 2 | 5, 6, … | −1, −2, … |
| Regular tetrahedron | 3 | 4 | 3 |
| Regular octahedron | 3 | 6 | 1 |
| Cube | 3 | 8 | **−1** |
| Icosahedron, dodecahedron | 3 | 12, 20 | −5, −13 |
| Regular simplex | $n$ | $n+1$ | $n(n-1)/2 \ge 0$ |
| Cross-polytope (orthoplex) | $n$ | $2n$ | $(n-1)(n-2)/2 \ge 0$ |
| Hypercube | $n \ge 3$ | $2^n$ | **negative** |

In every dimension $n \ge 3$, the only regular polytopes with non-negative expected dimension are the simplex and the cross-polytope. (The 24-, 120- and 600-cells in $\mathbb{R}^4$ have 24, 600 and 120 vertices, all more than $D(4) = 11$.)

---

## Theorem 1 — generic non-existence

> **Theorem 1.** Let $P \subset \mathbb{R}^n$ be a polytope with $m > D(n)$ vertices. There is a residual set $\mathcal{R} \subset C^\infty(\mathbb{R}^n, \mathbb{R})$ (Whitney $C^\infty$ topology) such that for every $f \in \mathcal{R}$, the zero set $f^{-1}(0)$ contains no inscribed copy of $P$.

**Tool.** *Multijet Transversality Theorem* (Golubitsky–Guillemin, *Stable Mappings and Their Singularities*, Ch. II, Thm. 4.13). Let $X, Y$ be smooth manifolds and $W$ a submanifold of the $s$-fold $k$-jet bundle $J^k_s(X, Y)$. Then $\{f \in C^\infty(X, Y) : j^k_s f \pitchfork W\}$ is residual in the Whitney $C^\infty$ topology.

We use $k = 0$. Let $X^{(m)} \subset (\mathbb{R}^n)^m$ be the open set of $m$-tuples of **distinct** points. Then $J^0_m(\mathbb{R}^n, \mathbb{R}) = X^{(m)} \times \mathbb{R}^m$, and
$$j^0_m f(x_1, \dots, x_m) = \big(x_1, \dots, x_m,\ f(x_1), \dots, f(x_m)\big).$$

**Step 1: copies of $P$ form a submanifold of dimension $D(n)$.** Define $\Phi : \mathrm{Sim}(n) \to X^{(m)}$, $\Phi(g) = (g v_1, \dots, g v_m)$. The points are distinct because $g$ is injective.
- *Injective.* If $\Phi(g) = \Phi(h)$, the affine map $h^{-1} g$ fixes every $v_i$. The $v_i$ affinely span $\mathbb{R}^n$, so $h^{-1} g = \mathrm{id}$.
- *Immersion.* $\Phi$ is the orbit map $g \mapsto g \cdot \Phi(\mathrm{id})$ of the smooth diagonal action of $\mathrm{Sim}(n)$ on $X^{(m)}$. Orbit maps have constant rank, and an injective constant-rank map is an immersion (constant rank theorem).
- *Homeomorphism onto its image.* Choose $n+1$ affinely independent vertices $v_{i_0}, \dots, v_{i_n}$. Given $x = \Phi(g)$, $g$ is the unique affine map with $g(v_{i_j}) = x_{i_j}$. Solving for it is linear algebra, so $g$ depends continuously on $x$.

So $C_P := \Phi(\mathrm{Sim}(n))$ is an embedded submanifold of $X^{(m)}$ of dimension $D(n)$.

**Step 2: the bad set.** Let $W = C_P \times \{0\} \subset X^{(m)} \times \mathbb{R}^m$. It is a submanifold of dimension $D(n)$ in a manifold of dimension $nm + m$, so
$$\operatorname{codim} W = nm + m - D(n).$$

**Step 3: transversality forces emptiness.** For $f$ in the residual set given by the Multijet Transversality Theorem, $j^0_m f \pitchfork W$. The domain of $j^0_m f$ has dimension $nm$. If $nm < \operatorname{codim} W$, which is exactly $m > D(n)$, a transversal map cannot meet $W$ at all: at an intersection point the image of the differential (dimension $\le nm$) plus $T W$ would have to span a space of dimension $nm + m$, which is impossible.

**Step 4: conclusion.** Suppose $f^{-1}(0)$ contained an inscribed copy $g(P)$. Then $x = \Phi(g) \in C_P$ and $f(x_i) = 0$ for all $i$, so $j^0_m f(x) \in W$, contradicting Step 3. $\blacksquare$

> **Corollary 1.1 (no inscribed cube in general).** There exist smooth, strictly convex surfaces in $\mathbb{R}^3$, arbitrarily close in $C^\infty$ to the round sphere, that contain no inscribed cube. Hence the conjecture "every closed Jordan surface contains an inscribed cube" is false.

*Proof.* Let $f_0(x) = |x|^2 - 1$, whose zero set is the unit sphere. The set $\mathcal{U}$ of $f$ satisfying all of the following is open in the Whitney $C^2$ topology, hence in $C^\infty$, and contains $f_0$:
1. $f < 0$ on a small ball around the origin, and $f > 0$ outside a large ball;
2. $x \cdot \nabla f(x) > 0$ on the closed annulus in between;
3. wherever $f = 0$, the Hessian of $f$ is positive definite on $\ker \nabla f$.

(For $f_0$, take the balls of radius $1/2$ and $2$: then $x \cdot \nabla f_0 = 2|x|^2 > 0$ on the annulus, and the Hessian is $2I$.) For $f \in \mathcal{U}$, conditions 1 and 2 make each ray from the origin cross $f^{-1}(0)$ exactly once and transversally, so $f^{-1}(0)$ is a smooth radial graph, a smooth sphere. Condition 3 gives it a positive definite second fundamental form, so it bounds a strictly convex body (Hadamard). $C^\infty(\mathbb{R}^3)$ with the Whitney topology is a Baire space, so the residual set $\mathcal{R}$ of Theorem 1 (with $P$ the cube, $m = 8 > 7 = D(3)$) is dense, and $\mathcal{R} \cap \mathcal{U}$ contains points arbitrarily close to $f_0$. $\blacksquare$

**Corollary 1.2.** By the same argument, generic smooth Jordan curves contain no inscribed regular $k$-gon for $k \ge 5$ ($k > D(2) = 4$). Generic smooth closed hypersurfaces in $\mathbb{R}^n$, $n \ge 3$, contain no inscribed hypercube ($2^n > D(n)$). And generic smooth closed surfaces in $\mathbb{R}^3$ contain no inscribed icosahedron or dodecahedron.

**Remarks.**
- The theorem is non-constructive: it shows counterexamples are everywhere, not where. The repository's *lopsided egg* (strictly convex, checked numerically in 2–6 dimensions) is a concrete candidate. Two independent solvers find no cube on it closer than 1.5–2.8% (relative to its size).
- **Symmetry is not generic.** A centrally symmetric surface has inscribed cubes (Hausel–Makai–Szűcs 2000), and so, numerically, do mirror-symmetric ones. Symmetric surfaces form a small (meagre) set, so this does not contradict Theorem 1.
- Theorem 1 says nothing about shapes with $m \le D(n)$. For those, the count only says solutions are *expected*; existence needs a separate argument, such as Theorem 2.

---

## Theorem 2 — the centring jig

> **Theorem 2.** Let $K \subset \mathbb{R}^n$ be a compact convex body (non-empty interior) that is **strictly convex** and has a **$C^1$ boundary**. Let $\Delta$ be a simplex whose circumcentre lies in its interior, and let $w_0, \dots, w_n$ be the unit vectors from that circumcentre to the vertices. Then for every $Q \in O(n)$ there are $x^\* \in \operatorname{int} K$ and $\rho > 0$ such that the points $x^\* + \rho\, Q w_k$ ($k = 0, \dots, n$) all lie on $\partial K$. These are the vertices of a copy of $\Delta$ inscribed in $\partial K$, with the prescribed orientation $Q$.
>
> In particular, $K$ contains an inscribed **regular** simplex (an equilateral triangle in 2D, a regular tetrahedron in 3D) in every orientation.

Replacing $w_k$ by $Q w_k$, we may assume $Q = I$. Because the circumcentre is interior, there are weights $\lambda_k > 0$ with
$$\textstyle\sum_k \lambda_k w_k = 0. \qquad (\ast)$$
The $w_k$ span $\mathbb{R}^n$ (they point to the vertices of a non-degenerate simplex from an interior point), so the linear relations among $w_0, \dots, w_n$ form a one-dimensional space, spanned by $\lambda = (\lambda_0, \dots, \lambda_n)$. For a regular simplex, $\lambda_k = 1$.

**The jig.** For $x \in K$ let $r_k(x) = \max\{ t \ge 0 : x + t w_k \in K \}$, the length of the jig's $k$-th arm. It is finite because $K$ is compact. The **rattle field** is
$$V(x) = \sum_k \lambda_k\, r_k(x)\, w_k.$$
For the regular simplex, $V(x)/(n+1)$ is the vector from $x$ to the centroid of the $n+1$ hit points. The finders' "rattle" $x \leftarrow x + \alpha V(x)$ is the iteration that looks for a zero of $V$.

**Lemma A (the arms vary continuously).** Each $r_k$ is continuous on $K$.

*Proof.* Write $w = w_k$, $r = r_k$.
- *Upper semicontinuity:* if $x_j \to x$ and $r(x_j) \to t$, then $x_j + r(x_j) w \in K$, and $K$ is closed, so $x + t w \in K$ and $r(x) \ge t$.
- *Lower semicontinuity:* let $0 < t < r(x)$. The points $x$ and $x + r(x) w$ lie in $K$. If $x \in \operatorname{int} K$, the half-open segment from an interior point to a point of a convex set lies in the interior, so $x + t w \in \operatorname{int} K$. If $x \in \partial K$, the two points are distinct points of $K$, and strict convexity puts the open segment between them in $\operatorname{int} K$; again $x + t w \in \operatorname{int} K$.

  So for $x_j \to x$, eventually $x_j + t w \in K$, i.e. $r(x_j) \ge t$. Hence $\liminf r(x_j) \ge r(x)$. (If $r(x) = 0$ there is nothing to prove.) $\blacksquare$

**Lemma B (the rattle points inward at the boundary).** For $p \in \partial K$ with outward unit normal $\nu$ (unique, since $\partial K$ is $C^1$), $\langle V(p), \nu \rangle < 0$.

*Proof.* $K \subset \{ y : \langle y - p, \nu \rangle \le 0 \}$.
- If $\langle w_k, \nu \rangle > 0$, then $p + t w_k \notin K$ for every $t > 0$, so $r_k(p) = 0$.
- If $\langle w_k, \nu \rangle < 0$, then $r_k(p) > 0$. Since the supporting hyperplane at $p$ is unique, the tangent cone $T = \overline{\bigcup_{t>0} t(K - p)}$ is the half-space $\{d : \langle d, \nu\rangle \le 0\}$. The convex cone $C = \bigcup_{t>0} t(K-p)$ has closure $T$, and a convex set has the same interior as its closure. So $w_k \in \operatorname{int} T = \operatorname{int} C \subset C$, meaning $p + s w_k \in K$ for some $s > 0$.

By $(\ast)$, $\sum_k \lambda_k \langle w_k, \nu\rangle = 0$. Not all $\langle w_k, \nu \rangle$ are zero, because the $w_k$ span $\mathbb{R}^n$. So some $\langle w_k, \nu \rangle < 0$. Therefore
$$\langle V(p), \nu\rangle = \sum_{\langle w_k,\nu\rangle < 0} \lambda_k\, r_k(p)\, \langle w_k, \nu \rangle < 0,$$
since the terms with $\langle w_k, \nu\rangle > 0$ vanish ($r_k(p) = 0$) and at least one remaining term is strictly negative. $\blacksquare$

**Lemma C (an inward field has a zero).** Let $K$ be a compact convex body and $V : K \to \mathbb{R}^n$ continuous with $\langle V(p), \nu \rangle < 0$ for every $p \in \partial K$ and every outward unit normal $\nu$ at $p$. Then $V(x^\*) = 0$ for some $x^\* \in \operatorname{int} K$.

*Proof.* Let $\pi_K$ be the nearest-point projection onto $K$ (continuous). The map $\varphi(x) = \pi_K(x + V(x))$ sends $K$ continuously into $K$, which is homeomorphic to a closed ball. By Brouwer's fixed-point theorem, $\varphi(x^\*) = x^\*$ for some $x^\*$. Let $y = x^\* + V(x^\*)$.
- If $y \in K$, then $\pi_K(y) = y$, so $V(x^\*) = 0$.
- Otherwise $x^\* = \pi_K(y) \in \partial K$, and $y - x^\* = V(x^\*)$ is a non-zero outward normal vector at $x^\*$: $V(x^\*) = \mu \nu$ for an outward unit normal $\nu$ and $\mu > 0$. Then $\langle V(x^\*), \nu \rangle = \mu > 0$, a contradiction.

So $V(x^\*) = 0$, and $x^\* \notin \partial K$ because $V \ne 0$ there. $\blacksquare$

**Proof of Theorem 2.** By Lemmas A and B, $V$ is continuous and points inward on $\partial K$. By Lemma C it has a zero $x^\* \in \operatorname{int} K$: $\sum_k \lambda_k r_k(x^\*) w_k = 0$. So $(\lambda_k r_k(x^\*))_k$ is a linear relation among the $w_k$, hence a multiple of $\lambda$: $\lambda_k r_k(x^\*) = \rho \lambda_k$ for all $k$, i.e. **all arms have the same length $\rho$**.

Since $x^\*$ is interior, $\rho > 0$. Each point $x^\* + \rho w_k$ is in $K$ (closedness), while $x^\* + t w_k \notin K$ for $t > \rho$, so it lies on $\partial K$. These $n+1$ points lie on the sphere of radius $\rho$ about $x^\*$ in the directions $w_k$, so they are the vertices of $\rho\Delta$ translated to $x^\*$. $\blacksquare$

**Remarks.**
- *Every orientation.* The family of solutions is parametrised by $Q \in O(n)$, of dimension $n(n-1)/2$. This matches the expected dimension $D(n) - (n+1)$ in the table.
- *Pivot only.* The finders' **Pivot only** mode is exactly Theorem 2: it fixes $Q$ and searches only over $x$.
- *Where it stops.* Strict convexity is used in Lemma A, and $C^1$ in Lemma B. For convex bodies with corners or flat pieces, and for non-convex or merely continuous surfaces, Lemmas A and B can fail: the arm lengths can jump, which the 2D finder counts as "discontinuities". Gromov's theorem removes convexity in the $C^1$ case; the merely continuous case is open.
- *Why the square needs more.* A square's jig has 4 arms in 2D, and its relation space is two-dimensional ($w_0 + w_2 = 0$ and $w_1 + w_3 = 0$). So $V = 0$ forces only $r_0 = r_2$ and $r_1 = r_3$: a rhombus, not a square. The missing equation is equal diagonals, which needs the rotation as well. That is the IVT-over-rotation step, and it is where continuity fails for non-convex curves. The same happens for the cross-polytope in every dimension. For simplices nothing is missing: the centring step alone forces regularity.

---

## What remains open

| Problem | Status |
|---|---|
| Square in every continuous Jordan curve (Toeplitz) | **Open.** Proved for convex (Emch), smooth (Schnirelmann), locally monotone (Stromquist) and small-Lipschitz (Tao) curves |
| Rectangle of every aspect ratio in every continuous Jordan curve | **Open.** Proved for smooth curves (Greene–Lobb) and extended to rectifiable curves; *some* rectangle always exists (Vaughan) |
| Regular tetrahedron / simplex in every continuous Jordan sphere | **Open.** Proved for $C^1$ spheres in every pose (Gromov 1969); Theorem 2 gives an elementary proof for smooth strictly convex bodies |
| Regular octahedron / cross-polytope | **Open.** Proved for smooth convex bodies in $\mathbb{R}^3$ (Makeev 2001) and in $\mathbb{R}^n$ for $n$ an odd prime power (Karasev 2009) |
| Cube / hypercube ($n \ge 3$) | **False in general** (Theorem 1). True for centrally symmetric convex bodies in $\mathbb{R}^3$ (Hausel–Makai–Szűcs 2000) |

## References

- M. L. Gromov, "Simplexes inscribed on a hypersurface", *Mat. Zametki* 5 (1969) 81–89.
- J. Cantarella, E. Denne, J. McCleary, "Families of similar simplices inscribed in most smoothly embedded spheres", *Forum Math. Sigma* 10 (2022) e95 — [arXiv:2106.12063](https://arxiv.org/abs/2106.12063).
- J. Cantarella, E. Denne, J. McCleary, "Transversality for configuration spaces and the 'square-peg' theorem" — [arXiv:1402.6174](https://arxiv.org/abs/1402.6174).
- M. Golubitsky, V. Guillemin, *Stable Mappings and Their Singularities*, Springer GTM 14 (1973), Ch. II §4.
- V. V. Makeev, "On inscribing a regular octahedron in a three-dimensional convex body with smooth boundary", *Zap. Nauchn. Sem. POMI* 279 (2001) 183–186.
- R. N. Karasev, "Inscribing a regular crosspolytope" — [arXiv:0905.2671](https://arxiv.org/abs/0905.2671).
- T. Hausel, E. Makai, A. Szűcs, "Inscribing cubes and covering by rhombic dodecahedra via equivariant topology", *Mathematika* 47 (2000) — [arXiv:math/9906066](https://arxiv.org/abs/math/9906066).
- Square and rectangle references: see the README.
