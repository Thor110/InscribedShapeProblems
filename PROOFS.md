# Proofs

This document contains the following results, written to be checked line by line:

1. **Theorem 1 (a disproof).** If a polytope has more vertices than the dimension of the similarity group, a *generic* smooth closed hypersurface contains no inscribed copy of it. In particular the inscribed-cube conjecture is false, even for smooth strictly convex surfaces.
2. **Theorem 2 (the centring jig, made rigorous).** Every smooth, strictly convex body in $\mathbb{R}^n$ contains an inscribed regular simplex in **every** orientation (more generally, any simplex whose circumcentre lies inside it). The proof is the skeletal-jig argument: the "rattle" is a vector field, and its zero is the inscribed simplex.
3. **Theorem 3 (every convex body).** The same holds for *any* convex body, in every orientation that is **admissible** for it. Every orientation is admissible for a body with a $C^1$ boundary, so Theorem 2 holds without strict convexity. **Proposition 5** shows admissibility cannot be dropped: a thin enough triangle has no inscribed equilateral triangle in some orientations.
4. **Lemma 4 (a route to the open case).** If ever-finer approximations of a curve each contain an inscribed square that cannot be arbitrarily small, the limiting curve contains one. This is the hypothesis that the shrinkage studies test.
5. **Theorem 6 (a computer-assisted certificate).** Every curve whose radius stays within 0.13 of a 1 × 0.6 ellipse's has an inscribed square. This includes nowhere-differentiable, non-symmetric fractal curves that are not locally monotone.
6. **Theorem 7 (the same in 3D).** Every surface whose radius stays within 0.04 of a 1 × 0.8 × 0.6 ellipsoid's has an inscribed regular tetrahedron, including rough surfaces that are not $C^1$, where Gromov's theorem does not apply.

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

## Theorem 3 — every convex body

Let $K \subset \mathbb{R}^n$ be a convex body (compact, convex, non-empty interior), not necessarily smooth or strictly convex. Let $\Delta$, $w_k$ and $\lambda_k$ be as in Theorem 2, and for $Q \in O(n)$ write $u_k = Q w_k$. The **tangent cone** of $K$ at $x \in \partial K$ is $T_K(x) = \overline{\bigcup_{t > 0} t(K - x)}$, the directions into $K$ from $x$.

> **Definition.** The orientation $Q$ is **admissible** for $K$ if at every boundary point $x \in \partial K$, at least one arm direction $u_k$ lies in the interior of $T_K(x)$: from every boundary point, at least one arm of the jig points strictly into the body.

> **Theorem 3.** If $Q$ is admissible for $K$, then $K$ contains an inscribed copy of $\Delta$ with orientation $Q$: there are $x^\* \in K$ and $\rho > 0$ with $x^\* + \rho\, u_k \in \partial K$ for every $k$.

*Proof.* **Step 1: smooth outer approximations.** By Schneider (*Convex Bodies*, Thm. 3.4.1), there are convex bodies $L_m$ with $C^\infty$ boundary and positive curvature, hence strictly convex, with Hausdorff distance $d_H(L_m, K + \tfrac{2}{m}B) \le \tfrac1m$, where $B$ is the unit ball. Then $K + \tfrac2m B \subset L_m + \tfrac1m B$, i.e. $h_K + \tfrac2m \le h_{L_m} + \tfrac1m$ for the support functions, so $K + \tfrac1m B \subset L_m$. Also $L_m \subset K + \tfrac3m B$. Put $K_m = L_m$:
$$K \subset K_m \subset K + \tfrac3m B.$$

**Step 2: Theorem 2 on each $K_m$.** It gives $x_m \in \operatorname{int} K_m$ and $\rho_m > 0$ with $x_m + \rho_m u_k \in \partial K_m$. Because $K_m$ is convex and $x_m$ interior, each ray from $x_m$ leaves $K_m$ exactly once, so every arm of the jig at $x_m$ has length exactly $\rho_m$.

**Step 3: the simplices cannot shrink.** Suppose $\rho_{m_j} \to 0$ along a subsequence. Passing to a further subsequence, $x_{m_j} \to x^\*$, and $x^\* \in K$ since $x_m \in K + \tfrac3m B$.
- *If $x^\* \in \operatorname{int} K$:* some ball $B(x^\*, 2\eta) \subset K \subset K_{m_j}$. For large $j$, $|x_{m_j} - x^\*| < \eta$, so every arm at $x_{m_j}$ has length at least $\eta$. This contradicts $\rho_{m_j} \to 0$.
- *If $x^\* \in \partial K$:* by admissibility some $u_j \in \operatorname{int} T_K(x^\*)$. The cone $C = \bigcup_{t>0} t(K - x^\*)$ is convex with closure $T_K(x^\*)$, so $\operatorname{int} T_K(x^\*) = \operatorname{int} C$. Choose points $c_0, \dots, c_n \in C$ with $u_j$ in the interior of their convex hull, and write $c_i = t_i (k_i - x^\*)$ with $k_i \in K$, $t_i > 0$. For $0 < s \le s_0 := \min_i 1/t_i$, convexity gives $x^\* + s c_i \in K$, hence $x^\* + s \operatorname{conv}\{c_i\} \subset K$. So some ball $x^\* + s_0 u_j + s_0 \eta B$ lies in $K$.

  Then every $x$ with $|x - x^\*| < s_0 \eta$ has $x + s_0 u_j \in K \subset K_m$. For large $j$ this holds for $x = x_{m_j}$, so the $j$-th arm at $x_{m_j}$ has length at least $s_0$. Again this contradicts $\rho_{m_j} \to 0$.

So $\rho_m \ge c > 0$ for all large $m$; also $\rho_m \le \operatorname{diam} K_1$.

**Step 4: the limit.** Pass to a subsequence with $x_m \to x^\*$ and $\rho_m \to \rho^\* \in [c, \operatorname{diam} K_1]$. The vertices $y^m_k = x_m + \rho_m u_k \in \partial K_m$ converge to $y_k = x^\* + \rho^\* u_k$. Each $y_k \in K$, because $\partial K_m \subset K + \tfrac3m B$. And $y_k \notin \operatorname{int} K$: otherwise a ball around $y_k$ lies in $K \subset K_m$, and for large $m$ it contains $y^m_k$ in the interior of $K_m$, contradicting $y^m_k \in \partial K_m$. So every $y_k \in \partial K$, and they are the vertices of the copy of $\Delta$ scaled by $\rho^\* > 0$, centred at $x^\*$, with orientation $Q$. $\blacksquare$

> **Corollary 3.1.** If $\partial K$ is $C^1$, every orientation is admissible, so $K$ contains an inscribed copy of $\Delta$ in every orientation. (Theorem 2 without strict convexity: flat pieces are fine.)

*Proof.* At $x \in \partial K$ with unit outer normal $\nu$, $T_K(x) = \{d : \langle d, \nu \rangle \le 0\}$. By $(\ast)$, $\sum \lambda_k \langle u_k, \nu \rangle = 0$ with not all terms zero, so some $\langle u_k, \nu\rangle < 0$, i.e. $u_k \in \operatorname{int} T_K(x)$. $\blacksquare$

> **Corollary 3.2 (polygons).** A convex polygon all of whose interior angles exceed $120°$ contains an inscribed equilateral triangle in every orientation.

*Proof.* At a vertex with interior angle $\beta > 120°$, $\operatorname{int} T_K$ is an open sector of angle $\beta$, and any open arc longer than $120°$ contains one of three directions spaced $120°$ apart. Edge points are $C^1$ points. $\blacksquare$

(Regular polygons with at least seven sides qualify.)

> **Proposition 5 (admissibility cannot be dropped).** Let $K$ be an isosceles triangle with apex angle $\alpha < 60°$. Then $K$ contains no inscribed equilateral triangle with a vertex pointing at the apex along the axis of symmetry.

*Proof.* Place the apex at the origin with the axis along the positive $x$-axis: $K = \{(x, y) : 0 \le x \le 1,\ |y| \le h x\}$ with $h = \tan(\alpha/2) < 1/\sqrt3$. An equilateral triangle in this orientation, with circumcentre $(c_x, c_y)$ and circumradius $\rho > 0$, has vertices $L = (c_x - \rho, c_y)$ and $P_\pm = (c_x + \rho/2,\ c_y \pm \rho\sqrt3/2)$. If it were inscribed, all three vertices would lie in $K$, so the whole triangle would.
- $P_\pm \in K$ gives $|c_y| + \rho\sqrt3/2 \le h(c_x + \rho/2)$.
- $L \in \partial K$. It is not on the base, since then $P_\pm$ would have $x > 1$. So $L$ is on a slanted side, the apex included: $|c_y| = h(c_x - \rho)$.

Substituting, $\rho\sqrt3/2 \le \tfrac32 h\rho$, i.e. $h \ge 1/\sqrt3$, a contradiction. $\blacksquare$

**Remarks.**
- Numerically, with the jig's arms at angles $\theta, \theta + 120°, \theta + 240°$ and the apex pointing in direction $180°$, no inscribed equilateral triangle exists for any $\theta$ from $36°$ to $84°$ when the apex angle is $10°$, or from $46°$ to $74°$ when it is $30°$. Proposition 5 is the case $\theta = 60°$, the middle of both ranges.
- The $60°$ bound is sharp: with apex $59°$ the orientation $\theta = 60°$ still fails, and with apex $61°$ every orientation works. A right isosceles triangle also loses $\theta \in [46°, 74°]$, through its two $45°$ base corners. The thin rectangle, regular pentagon and regular heptagon lose none (`node tests/check-orientations.js`).
- This is the phenomenon Lemma B's $C^1$ assumption guards against. At a sharp corner the jig can be pinned with every arm pointing out of the body, and the would-be simplices shrink into the corner as the body is smoothed.
- *Some* orientation always works in the plane (Meyerson 1980: every Jordan curve has inscribed equilateral triangles). For general convex bodies in $\mathbb{R}^n$ an orientation-free version would follow from Theorem 3 if some orientation is admissible. That holds, for example, when no boundary point has a very sharp tangent cone.

---

## Lemma 4 — a route to the open square problem

> **Lemma 4.** Let $\gamma : S^1 \to \mathbb{R}^2$ be a Jordan curve and $\gamma_L \to \gamma$ uniformly. Suppose there is $\delta \in (0, \tfrac12]$ such that for infinitely many $L$, $\gamma_L$ has an inscribed square with two opposite vertices $\gamma_L(u), \gamma_L(v)$ at parameter distance $|u - v|_{S^1} \ge \delta$. Then $\gamma$ has an inscribed square.

*Proof.* Let $\eta = \min\{ |\gamma(u) - \gamma(v)| : |u - v|_{S^1} \ge \delta \}$, which is positive because $\gamma$ is injective and the set is compact. For large $L$, $\|\gamma_L - \gamma\|_\infty < \eta/4$, so those squares have diagonal at least $\eta/2$. Their vertex parameters lie in the compact $(S^1)^4$; pass to a convergent subsequence $u^L_i \to u_i$. Uniform convergence gives $\gamma_L(u^L_i) \to \gamma(u_i)$. A limit of squares whose diagonals are bounded below by $\eta/2$ is a non-degenerate square, so the four points $\gamma(u_i)$ form a square inscribed in $\gamma$. $\blacksquare$

**How the experiments relate.** For the fractal families in this repository, the level-$L$ polygons, with their natural parametrisations, converge uniformly to the limiting fractal curve. The square shrinkage study finds, at every computed level, verified squares whose diagonal is at least about 0.8 of the curve's width, with their size settling as $L$ grows. That is exactly Lemma 4's hypothesis, observed for finitely many $L$. A proof for a given fractal would need it for all $L$.

**Why counting alone cannot do it.** For generic smooth curves the number of inscribed squares is odd (Schnirelmann's argument: as the curve deforms, squares appear and disappear in pairs unless one shrinks to a point), while rectangles of any other aspect ratio come in even numbers. The square-count study confirms both on smooth and polygonal curves. On rough curves, small squares multiply at every scale and the count stops being meaningful, and in the limit it is infinite. So any proof for continuous curves must control the *sizes* of squares, as in Lemma 4, not just their number.

---

## Theorem 6 — a computer-assisted certificate

Theorems 2 and 3 need smoothness or convexity. Lemma 4 needs control at *every* level of a fractal. This section takes a third route, which handles genuinely rough curves: prove that a square cannot be removed by any perturbation of a given size. Then compute that the size is large enough to cover a fractal.

Let $E$ be the ellipse $x^2 + y^2/b^2 = 1$ with $b = 0.6$, with polar radius $r_E(\theta) = (\cos^2\theta + \sin^2\theta / b^2)^{-1/2}$. For a continuous $\rho : S^1 \to (0, \infty)$ write $\gamma_\rho(\theta) = \rho(\theta)(\cos\theta, \sin\theta)$. This is a Jordan curve: every ray from the origin crosses it once.

> **Theorem 6.** If $\rho$ is continuous and $|\rho(\theta) - r_E(\theta)| \le T = 0.13$ for all $\theta$, then $\gamma_\rho$ has an inscribed square, with diagonal at least $0.6369$.

The proof has a short analytic part, which holds for any base curve, and a finite computation (`node tools/certify-square.js`, about 8 s), which checks three inequalities.

**Square equations.** Parametrise by $u \in \mathbb{R}/\mathbb{Z}$, $\theta = 2\pi u$. For opposite corners $A = \gamma(u)$ and $C = \gamma(v)$, the other two corners of the square with diagonal $AC$ are
$$B = \tfrac12\big((I - R)A + (I + R)C\big), \qquad D = \tfrac12\big((I + R)A + (I - R)C\big),$$
where $R$ is the rotation by $90°$. Let $\mathrm{sd}_\rho$ be the signed distance to $\gamma_\rho$ (negative inside), and
$$G_\rho(u, v) = \big(\mathrm{sd}_\rho(B),\ \mathrm{sd}_\rho(D)\big) \in \mathbb{R}^2 .$$
$G_\rho$ is continuous, and $G_\rho(u, v) = 0$ with $A \ne C$ is exactly an inscribed square.

**Step 1 (perturbations move $G$ by at most $(1+\sqrt2)T$).** Let $|\rho - \sigma| \le T$ pointwise.
- *Corners.* $|\gamma_\rho(u) - \gamma_\sigma(u)| = |\rho - \sigma| \le T$. The operators $\tfrac12(I \pm R)$ have norm $1/\sqrt2$, so $B$ and $D$ move by at most $\sqrt2\,T$.
- *Signed distance.* For every point $x$, $|\mathrm{sd}_\rho(x) - \mathrm{sd}_\sigma(x)| \le T$. If $x$ is on the same side of both curves, this holds because their Hausdorff distance is at most $T$. Otherwise write $x = s(\cos\theta, \sin\theta)$ with, say, $\sigma(\theta) \le s \le \rho(\theta)$. Then $|\mathrm{sd}_\rho(x)| + |\mathrm{sd}_\sigma(x)| \le (\rho(\theta) - s) + (s - \sigma(\theta)) \le T$, using the radial segment to each curve.
- *Together.* Since $\mathrm{sd}$ is 1-Lipschitz, $\|G_\rho - G_\sigma\|_\infty \le \sqrt2\,T + T$.

**Step 2 (degree).** Let $Q$ be a closed region in the $(u, v)$-torus bounded by a simple loop $\partial Q$, with $\|G_E\|_\infty > (1+\sqrt2)T$ on $\partial Q$ and winding number $w \ne 0$ of $G_E$ around $0$ along $\partial Q$. The homotopy $G_E + t(G_\rho - G_E)$, $t \in [0, 1]$, has no zero on $\partial Q$ by Step 1. So $\deg(G_\rho, Q, 0) = w \ne 0$, and $G_\rho$ vanishes somewhere in $Q$.

**Step 3 (non-degeneracy).** If the $u$-range and $v$-range of $Q$ are disjoint arcs of $\mathbb{R}/\mathbb{Z}$, then $A \ne C$ at every point of $Q$, so the square in Step 2 is non-degenerate. Its diagonal is at least $\min_Q |\gamma_E(u) - \gamma_E(v)| - 2T$.

**The computation.** It only evaluates $G_E$ (a smooth function) and checks three inequalities on one box.
- *The box.* Newton's method finds the ellipse's square $(u, v) = (\tfrac18, \tfrac58)$, with diagonal $1.4552$. $Q$ is the parallelogram $z + J^{-1}([-c, c]^2)$ around it, $c = 0.5$, where $J$ is the Jacobian there. Its $u$-range is $[-0.0303, 0.2803]$ and its $v$-range is $[0.4697, 0.7803]$, which are disjoint.
- *Polygon error.* $\mathrm{sd}_E$ is computed from a polygon $P$ with $2^{19}$ vertices on $E$. $P$ is convex and contains the origin, so it is also a radial curve. Its radial distance from $E$ is at most $e = 2h\sup|\gamma_E'| = 3.2\times10^{-5}$, with $h = 2\pi/2^{19}$. By the second bullet of Step 1, $|\mathrm{sd}_P - \mathrm{sd}_E| \le e$.
- *Lipschitz bound.* $|r_E'| \le q/2$ with $q = 1/b^2 - 1$, so $|\partial_u \gamma_E| \le 2\pi(1 + q/2)$. With the norm bound on $B$ and $D$ from Step 1, the computed $G_P$ is $L$-Lipschitz in the max-norm on $(u, v)$, with $L = \sqrt2 \cdot 2\pi(1 + q/2) = 16.78$.
- *Sampling.* $\partial Q$ is sampled at 1144 points with max-norm spacing $s \le 9.93 \times 10^{-4}$, so $Ls \le 0.0167$. The smallest sampled $\|G_P\|_\infty$ is $0.35746$. Hence on all of $\partial Q$,
$$\|G_E\|_\infty \ \ge\ 0.35746 - Ls - e - 10^{-9} \ \ge\ 0.3408 - e - 10^{-9} \ >\ (1+\sqrt2)\cdot 0.13 = 0.3138 .$$
- *Winding.* Consecutive samples differ by at most $0.0167$, while $\|G_P\| \ge 0.34$. So each step turns by less than $\pi/2$, and the summed angle, $2\pi \cdot 1.000000$, is the exact winding number $w = 1$ of $G_P$. Since $|G_P - G_E| \le e < |G_P|$ on $\partial Q$, $G_E$ has the same winding number.
- *Diagonal.* On a $200 \times 200$ grid over $Q$, $|\gamma_E(u) - \gamma_E(v)|$ is at least $0.6369 + 2T$ once the most it can change within a grid cell is subtracted. Steps 2 and 3 then give Theorem 6. $\blacksquare$

The box certifies every $T < 0.1412$. The `10⁻⁹` term absorbs floating-point rounding. Every computed margin exceeds it by many orders of magnitude, but the code does not use interval arithmetic, so a fully formal version would redo these few thousand evaluations with outward rounding.

**Corollary 6.1 (fractal curves).** Let $W(\theta) = (1 - 2^{-1/2}) \sum_{k \ge 0} 2^{-k/2}\cos\big(2^k(\theta - \theta_0)\big)$, so $|W| \le 1$. Then the curve $\rho = r_E + 0.13\,W$ has an inscribed square, and so does $\rho = r_E + 0.13\,f$ for every continuous $f$ with $|f| \le 1$: random phases, Brownian-like noise, and so on.

For $\theta_0 = 0.3$ (the curve on the [Square Certificate](pages/certificate.html) page), this curve is outside the classical cases:
- *Not smooth or Lipschitz.* $W$ is nowhere differentiable, by Hardy's theorem, since $2 \cdot 2^{-1/2} \ge 1$.
- *Not locally monotone.* The curve is not locally a graph in any direction anywhere, so Stromquist's theorem does not apply. If a coordinate of $\gamma_\rho$ were monotone on some interval of $\theta$, it would be differentiable almost everywhere there (Lebesgue). Dividing by the smooth, non-vanishing factor $\cos(\theta - \varphi)$ away from one point would then make $\rho$, and so $W$, differentiable almost everywhere.
- *Not symmetric.* $W$ is symmetric about $\theta_0$ but not under $\theta \mapsto \theta + \pi$, and $r_E$ is symmetric about $0$ and $\pi/2$. So the curve has no reflection or point symmetry, and the symmetric-curve results of Nielsen and Wright do not apply.

Chambers (2022) proves that a Jordan curve close enough to a $C^2$ curve $\beta$ has an inscribed square, with closeness measured against $1/\kappa$ for $\kappa$ the maximum curvature of $\beta$. For $\beta = E$, $\kappa = 1/b^2 = 2.78$ and $1/(10\kappa) = 0.036$, so Theorem 6 covers a neighbourhood about $3.6$ times wider. We have not ruled out that some other smooth $\beta$, with smaller curvature, lies within Chambers' bound of every curve in Corollary 6.1. So we claim only a computer-assisted proof of a quantitative statement, not a new class of curves.

**What did not work: the Weierstrass blob.** The same method was tried on the `Weierstrass` fractal of the finders, $\rho = 1 + \sum_k 0.085 \cdot 2^{-k/2}\cos(m 2^k\theta + \phi_k)$. The base curve is the $K$-octave truncation, and $T$ is the size of the remaining tail, $\sum_{k \ge K} 0.085 \cdot 2^{-k/2}$:

| $K$ | tail to cover | best certifiable $T$ | ratio |
|---|---|---|---|
| 2 | 0.1451 | 0.0256 | 5.7 |
| 3 | 0.1026 | 0.0230 | 4.5 |
| 4 | 0.0726 | 0.0139 | 5.2 |

The ratio does not improve with $K$. Each added octave shrinks the tail by $2^{-1/2}$, but it also makes the base curve rougher at a finer scale, and the certifiable margin shrinks at the same rate. So the blob cannot be certified this way. The ellipse works because a large, smooth base square survives a fixed-size perturbation; a curve whose roughness carries a constant fraction of its size at every scale does not offer one. This is the quantitative form of the difficulty in the open problem.

---

## Theorem 7 — the same for tetrahedra on rough surfaces

The inscribed-tetrahedron problem is open exactly for non-smooth surfaces: Gromov's theorem needs $C^1$. Theorem 6's method extends to 3D, and becomes simpler, if the tetrahedron's orientation is fixed.

Let $E$ be the ellipsoid $x^2 + y^2/0.8^2 + z^2/0.6^2 = 1$ with radial function $r_E$. For continuous $\rho : S^2 \to (0, \infty)$ let $S_\rho = \{\rho(\omega)\,\omega : \omega \in S^2\}$, a Jordan surface. Let $w_0, \dots, w_3$ be the unit vectors $(\pm1, \pm1, \pm1)/\sqrt3$ with an even number of minus signs, rotated by the Euler angles $(0.3, 0.5, 0.7)$ as in `pages/certify3d.js`.

> **Theorem 7.** If $|\rho(\omega) - r_E(\omega)| \le T = 0.04$ for all $\omega$, then $S_\rho$ has an inscribed regular tetrahedron with vertices $x + s\,w_k$, so in that orientation, with circumradius $s \ge 0.6315$.

*Proof.*
- **Equations.** The unknowns are $p = (x, s) \in \mathbb{R}^4$. Let $G_\rho(p) = \big(\mathrm{sd}_\rho(x + s w_k)\big)_{k=0..3}$. A zero with $s > 0$ is an inscribed tetrahedron. The vertices depend only on $p$, not on the surface, so by the radial argument of Theorem 6, Step 1 (which works verbatim in 3D), $\|G_\rho - G_E\|_\infty \le T$.
- **Box.** Newton's method gives the tetrahedron on $E$, with centre $(-0.0542, 0.0629, 0.1243)$ and circumradius $0.7298$. Let $J$ be (an approximation to) the Jacobian there and $L(p) = J(p - z)$. Take $Q = z + J^{-1}([-c, c]^4)$ with $c = 0.09$, so $\|L\|_\infty = c$ on $\partial Q$, and $\deg(L, Q, 0) = \operatorname{sign}\det J = +1$ ($\det J = 1.655$).
- **Rouché-type bound.** Suppose $\|G_E - L\|_\infty + T < c$ on $\partial Q$. Then the homotopy $L + t(G_\rho - L)$ has no zero on $\partial Q$, so $\deg(G_\rho, Q, 0) = 1$ and $G_\rho$ vanishes in $Q$.
- **The computation** (`node tools/certify-tetra.js`, about a minute):
  - $\mathrm{sd}_E$ is evaluated exactly, up to rounding, by the standard reduction to one monotone equation solved by bisection.
  - Each of the 8 faces of $[-c, c]^4$ is sampled on a $120^3$ grid, with spacing $h = 2c/119$. The largest value of $\|G_E - L\|_\infty$ at the 13,824,000 samples is $0.0341$.
  - $G$ is $(1 + \sqrt3)$-Lipschitz in the max-norm on $p$, since $|\Delta(x + s w_k)| \le \sqrt3\,|\Delta x|_\infty + |\Delta s|$. $L$ is $\|J\|_\infty$-Lipschitz, and every boundary point is within $\|J^{-1}\|_\infty h/2$ of a sample. So between samples $G_E - L$ changes by at most $0.0110$.
  - Hence $\|G_E - L\|_\infty \le 0.0341 + 0.0110 + 10^{-9} = 0.0452 < c - T = 0.05$ on all of $\partial Q$. The certified room for a perturbation is $0.0448$.
- **Non-degeneracy.** $s$ is affine on $Q$, so its minimum, $0.6315$, is attained at a corner. $\blacksquare$

**Corollary 7.1 (rough surfaces).** Let $F : S^2 \to [-1, 1]$ be any continuous function. For example, take $F(\omega) = (1 - 2^{-1/2})\sum_{k \ge 0} 2^{-k/2}\cos(2^k\langle \omega, e\rangle)$ for a fixed unit vector $e$, which is nowhere differentiable along every meridian through $e$ (Hardy). Then the surface $\rho = r_E + 0.04\,F$ has an inscribed regular tetrahedron. Such surfaces are not $C^1$, or even Lipschitz, so Gromov's theorem does not apply. We know of no published result that covers them, but, as for Theorem 6, the claim is a quantitative computer-assisted one and not a new structural class.

**Remarks.**
- The same Rouché-type test proves Theorem 6 too, and works for any number of unknowns: it only needs $\|G - L\|$ to be small on the boundary of a box, compared with the box's size. That is a degree argument with no winding numbers to compute.
- The certified neighbourhood is smaller than in 2D (0.04 against 0.13) because a 4D box boundary needs many more samples for the same Lipschitz margin. Bounding the second derivative of $\mathrm{sd}_E$ instead of its first would shrink the margin between samples and enlarge $T$.
- Certifying several orientations at once would give a whole open set of orientations for every such surface; one suffices for existence.

---

## What remains open

| Problem | Status |
|---|---|
| Square in every continuous Jordan curve (Toeplitz) | **Open.** Proved for convex (Emch), smooth (Schnirelmann), locally monotone (Stromquist) and small-Lipschitz (Tao) curves |
| Rectangle of every aspect ratio in every continuous Jordan curve | **Open.** Proved for smooth curves (Greene–Lobb) and extended to rectifiable curves; *some* rectangle always exists (Vaughan) |
| Regular tetrahedron / simplex in every continuous Jordan sphere | **Open.** Proved for $C^1$ spheres in every pose (Gromov 1969); Theorems 2–3 give elementary proofs for every $C^1$ convex body and, in admissible orientations, every convex body. Theorem 7 certifies every surface within 0.04 of one ellipsoid. "Every pose" fails for non-smooth bodies (Proposition 5) |
| Regular octahedron / cross-polytope | **Open.** Proved for smooth convex bodies in $\mathbb{R}^3$ (Makeev 2001) and in $\mathbb{R}^n$ for $n$ an odd prime power (Karasev 2009) |
| Cube / hypercube ($n \ge 3$) | **False in general** (Theorem 1). True for centrally symmetric convex bodies in $\mathbb{R}^3$ (Hausel–Makai–Szűcs 2000) |

## References

- G. R. Chambers, "On the square peg problem" (2022) — [arXiv:2203.02613](https://arxiv.org/abs/2203.02613).
- G. H. Hardy, "Weierstrass's non-differentiable function", *Trans. Amer. Math. Soc.* 17 (1916) 301–325.
- M. J. Nielsen, S. E. Wright, "Rectangles inscribed in symmetric continua", *Geom. Dedicata* 58 (1995) 151–158.
- M. L. Gromov, "Simplexes inscribed on a hypersurface", *Mat. Zametki* 5 (1969) 81–89.
- J. Cantarella, E. Denne, J. McCleary, "Families of similar simplices inscribed in most smoothly embedded spheres", *Forum Math. Sigma* 10 (2022) e95 — [arXiv:2106.12063](https://arxiv.org/abs/2106.12063).
- J. Cantarella, E. Denne, J. McCleary, "Transversality for configuration spaces and the 'square-peg' theorem" — [arXiv:1402.6174](https://arxiv.org/abs/1402.6174).
- M. Golubitsky, V. Guillemin, *Stable Mappings and Their Singularities*, Springer GTM 14 (1973), Ch. II §4.
- R. Schneider, *Convex Bodies: The Brunn–Minkowski Theory*, 2nd ed., Cambridge University Press (2014), §3.4 (approximation by smooth bodies with positive curvature).
- V. V. Makeev, "On inscribing a regular octahedron in a three-dimensional convex body with smooth boundary", *Zap. Nauchn. Sem. POMI* 279 (2001) 183–186.
- R. N. Karasev, "Inscribing a regular crosspolytope" — [arXiv:0905.2671](https://arxiv.org/abs/0905.2671).
- T. Hausel, E. Makai, A. Szűcs, "Inscribing cubes and covering by rhombic dodecahedra via equivariant topology", *Mathematika* 47 (2000) — [arXiv:math/9906066](https://arxiv.org/abs/math/9906066).
- Square and rectangle references: see the README.
