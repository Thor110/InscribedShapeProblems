/*
 * A 4D egg with no inscribed tesseract (the 4D analogue of PROOFS.md, Theorem 1.3). The
 * hypersurface is the zero set, inside |p| <= 3/2, of
 *
 *   F(x, y, z, w) = x^2 + (16/25) y^2 + (400/289) z^2 + (100/81) w^2
 *                   + (3/20) (x^3/2 + xyz + (7/10) y^2 z + (3/10) z^3 + xzw + (2/5) w^3) - 1.
 *
 * Its slice w = 0 is the 3D egg of Theorem 1.3.
 *
 * Status. Parts 1 and 2 are proved (`surface`, about 2 seconds). Part 3 is NOT feasible in this
 * form: `./egg-tesseract estimate 200000` (Knuth's random-probe estimate of the branch-and-
 * bound tree) gives about 10^14 boxes, against about 10^8 for the 3D cube. The 6-dimensional
 * rotation is what multiplies the work. ROADMAP.md describes a more promising route.
 *
 *   gcc -O2 -fopenmp -ffp-contract=off -o egg-tesseract tools/egg-tesseract.c -lm
 *   ./egg-tesseract surface           part 1: a smooth strictly convex 3-sphere; constants
 *   ./egg-tesseract search [fraction] part 3: no tesseract (far too slow in full; see Status)
 *   ./egg-tesseract estimate probes   the estimated size of part 3
 *   (compile with -DCONTROL for the round 3-sphere |p| = 1, which has tesseracts in every
 *    orientation: the search must fail there)
 *
 * Tesseracts: centre c, half-edge s, rotation p -> l p conj(r) (l, r unit quaternions), so
 * the vertices are c + s l e conj(r) for the 16 sign vectors e = (+-1, +-1, +-1, +-1).
 * Multiplying e by a unit of Q8 = {+-1, +-i, +-j, +-k} on either side permutes the vertices,
 * so (l, r) can be replaced by (l u, r v) for u, v in Q8. Right multiplication by Q8 permutes
 * the four components of l up to sign, so the largest one can be made the real part: then
 * l = (1, a)/|(1, a)| with |a_i| <= 1, and the same for r = (1, b)/|(1, b)|.
 *
 * Interval arithmetic with outward rounding, as in tools/egg-cube.c.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <omp.h>

typedef struct { double lo, hi; } iv;
static inline double ru(double x) { return x + (fabs(x) * 0x1p-51 + 0x1p-1074); }
static inline double rd(double x) { return x - (fabs(x) * 0x1p-51 + 0x1p-1074); }
static inline iv I(double a) { return (iv){a, a}; }
static inline iv I2(double a, double b) { return (iv){a, b}; }
static inline iv add(iv a, iv b) { return (iv){rd(a.lo + b.lo), ru(a.hi + b.hi)}; }
static inline iv sub(iv a, iv b) { return (iv){rd(a.lo - b.hi), ru(a.hi - b.lo)}; }
static inline iv neg(iv a) { return (iv){-a.hi, -a.lo}; }
static inline iv mul(iv a, iv b) {
  double p1 = a.lo * b.lo, p2 = a.lo * b.hi, p3 = a.hi * b.lo, p4 = a.hi * b.hi;
  return (iv){rd(fmin(fmin(p1, p2), fmin(p3, p4))), ru(fmax(fmax(p1, p2), fmax(p3, p4)))};
}
static inline iv sqr(iv a) {
  double l = fabs(a.lo), h = fabs(a.hi), mx = fmax(l, h), mn = (a.lo <= 0 && a.hi >= 0) ? 0 : fmin(l, h);
  return (iv){mn == 0 ? 0 : rd(mn * mn), ru(mx * mx)};
}
static inline iv divi(iv a, iv b) {   /* b > 0 */
  double p1 = a.lo / b.lo, p2 = a.lo / b.hi, p3 = a.hi / b.lo, p4 = a.hi / b.hi;
  return (iv){rd(fmin(fmin(p1, p2), fmin(p3, p4))), ru(fmax(fmax(p1, p2), fmax(p3, p4)))};
}
static inline iv sqrti(iv a) { return (iv){a.lo <= 0 ? 0 : rd(sqrt(a.lo)), ru(sqrt(a.hi))}; }
static inline iv ratio(long p, long q) { return divi(I(p), I(q)); }
static inline double mag(iv a) { return fmax(fabs(a.lo), fabs(a.hi)); }
static inline double mig(iv a) { return a.lo > 0 ? a.lo : a.hi < 0 ? -a.hi : 0; }
static inline double up_mul(double a, double b) { return ru(a * b); }
static inline double up_add(double a, double b) { return ru(a + b); }
static inline double up_sqrt(double a) { return ru(sqrt(a)); }
static inline double dn_sqrt(double a) { return rd(sqrt(a)); }

#define D 4
/* ---------- the 4D egg ---------- */
static iv QC[D], E, H7, H3, H2;   /* quadratic coefficients; e = 3/20; 7/10, 3/10, 2/5 */
static void init_coeffs(void) {
#ifdef CONTROL
  for (int i = 0; i < D; i++) QC[i] = I(1); E = I(0);
#else
  QC[0] = I(1); QC[1] = ratio(16, 25); QC[2] = ratio(400, 289); QC[3] = ratio(100, 81); E = ratio(3, 20);
#endif
  H7 = ratio(7, 10); H3 = ratio(3, 10); H2 = ratio(2, 5);
}
/* cubic part C = x^3/2 + xyz + (7/10) y^2 z + (3/10) z^3 + xzw + (2/5) w^3 */
static iv Fv(const iv p[D]) {
  iv x = p[0], y = p[1], z = p[2], w = p[3];
  iv q = I(-1); for (int i = 0; i < D; i++) q = add(q, mul(QC[i], sqr(p[i])));
  iv c = mul(I(0.5), mul(sqr(x), x));
  c = add(c, mul(mul(x, y), z));
  c = add(c, mul(H7, mul(sqr(y), z)));
  c = add(c, mul(H3, mul(sqr(z), z)));
  c = add(c, mul(mul(x, z), w));
  c = add(c, mul(H2, mul(sqr(w), w)));
  return add(q, mul(E, c));
}
static void grad(const iv p[D], iv g[D]) {
  iv x = p[0], y = p[1], z = p[2], w = p[3];
  /* C_x = 3x^2/2 + yz + zw; C_y = xz + (7/5) yz; C_z = xy + (7/10) y^2 + (9/10) z^2 + xw; C_w = xz + (6/5) w^2 */
  iv cx = add(add(mul(I(1.5), sqr(x)), mul(y, z)), mul(z, w));
  iv cy = add(mul(x, z), mul(mul(I(2), H7), mul(y, z)));
  iv cz = add(add(mul(x, y), mul(H7, sqr(y))), add(mul(mul(I(3), H3), sqr(z)), mul(x, w)));
  iv cw = add(mul(x, z), mul(mul(I(3), H2), sqr(w)));
  iv C[D] = {cx, cy, cz, cw};
  for (int i = 0; i < D; i++) g[i] = add(mul(mul(I(2), QC[i]), p[i]), mul(E, C[i]));
}
static void hess(const iv p[D], iv H[D][D]) {
  iv x = p[0], y = p[1], z = p[2], w = p[3], Z = I(0);
  /* second derivatives of C */
  iv c[D][D] = {
    {mul(I(3), x), z, add(y, w), z},
    {z, mul(mul(I(2), H7), z), add(x, mul(mul(I(2), H7), y)), Z},
    {add(y, w), add(x, mul(mul(I(2), H7), y)), mul(mul(I(6), H3), z), x},
    {z, Z, x, mul(mul(I(6), H2), w)}};
  for (int i = 0; i < D; i++) for (int j = 0; j < D; j++) { H[i][j] = mul(E, c[i][j]); if (i == j) H[i][j] = add(H[i][j], mul(I(2), QC[i])); }
}
static double min_norm(const iv p[D]) { double s = 0; for (int i = 0; i < D; i++) { double m = mig(p[i]); s += rd(m * m); } return dn_sqrt(rd(s)); }
static double max_norm(const iv p[D]) { double s = 0; for (int i = 0; i < D; i++) { double m = mag(p[i]); s = up_add(s, up_mul(m, m)); } return up_sqrt(s); }

/* ======================= part 1 ======================= */
#define R0 1.5
#define SURF_W (1.0 / 64)
#define HESS_W (1.0 / 8)
typedef struct { long boxes, failed; double rmin, rmax, bb[D][2], g, M; } Surf;
static void merge(Surf *S, const Surf *L) {
  S->boxes += L->boxes; S->failed += L->failed; S->rmin = fmin(S->rmin, L->rmin); S->rmax = fmax(S->rmax, L->rmax);
  S->g = fmin(S->g, L->g); S->M = fmax(S->M, L->M);
  for (int i = 0; i < D; i++) { S->bb[i][0] = fmin(S->bb[i][0], L->bb[i][0]); S->bb[i][1] = fmax(S->bb[i][1], L->bb[i][1]); }
}
static void init_surf(Surf *S) { memset(S, 0, sizeof *S); S->rmin = INFINITY; S->g = INFINITY; for (int i = 0; i < D; i++) { S->bb[i][0] = INFINITY; S->bb[i][1] = -INFINITY; } }

static void split(const iv p[D], iv a[D], iv b[D]) {
  int k = 0; for (int i = 1; i < D; i++) if (p[i].hi - p[i].lo > p[k].hi - p[k].lo) k = i;
  double m = (p[k].lo + p[k].hi) / 2; memcpy(a, p, D * sizeof(iv)); memcpy(b, p, D * sizeof(iv)); a[k].hi = m; b[k].lo = m;
}
/* the zero set in |p| <= R0 is star-shaped and smooth: F > 0 where boxes meet |p| = R0, and
 * p . grad F > 0 wherever F may vanish */
static void surf_box(const iv p[D], int depth, Surf *S) {
  S->boxes++;
  double nmin = min_norm(p), nmax = max_norm(p);
  if (nmin > R0) return;
  iv f = Fv(p); int ok;
  if (f.lo > 0) ok = 1;
  else if (nmax >= R0) ok = 0;
  else if (f.hi < 0) ok = 1;
  else {
    iv g[D]; grad(p, g); iv d = I(0); for (int i = 0; i < D; i++) d = add(d, mul(p[i], g[i]));
    ok = d.lo > 0 && p[0].hi - p[0].lo <= SURF_W;
    if (ok) {
      S->rmin = fmin(S->rmin, nmin); S->rmax = fmax(S->rmax, nmax);
      for (int i = 0; i < D; i++) { S->bb[i][0] = fmin(S->bb[i][0], p[i].lo); S->bb[i][1] = fmax(S->bb[i][1], p[i].hi); }
      double s = 0; for (int i = 0; i < D; i++) { double m = mig(g[i]); s += rd(m * m); } S->g = fmin(S->g, dn_sqrt(rd(s)));
    }
  }
  if (ok) return;
  if (depth > 60) { S->failed++; return; }
  iv a[D], b[D]; split(p, a, b); surf_box(a, depth + 1, S); surf_box(b, depth + 1, S);
}
/* Hessian positive definite on |p| <= r, by Gershgorin (every eigenvalue of a symmetric
 * matrix is within sum_j!=i |H_ij| of some H_ii), and its norm <= the largest row sum */
static void hess_box(const iv p[D], double r, int depth, Surf *S) {
  S->boxes++;
  if (min_norm(p) > r) return;
  iv H[D][D]; hess(p, H); int pd = 1; double M = 0;
  for (int i = 0; i < D; i++) {
    double off = 0, row = mag(H[i][i]); for (int j = 0; j < D; j++) if (j != i) { off = up_add(off, mag(H[i][j])); row = up_add(row, mag(H[i][j])); }
    if (!(rd(H[i][i].lo - off) > 0)) pd = 0;
    M = fmax(M, row);
  }
  if (pd && p[0].hi - p[0].lo <= HESS_W) { S->M = fmax(S->M, M); return; }
  if (depth > 40) { S->failed++; return; }
  iv a[D], b[D]; split(p, a, b); hess_box(a, r, depth + 1, S); hess_box(b, r, depth + 1, S);
}

typedef struct { int ok; double rmax, bb[D][2], g, M, smin, smax; } Surface;
static Surface surface(int verbose) {
  Surf S; init_surf(&S); Surf H; init_surf(&H);
  /* 16 pieces for the threads */
  #pragma omp parallel for schedule(dynamic, 1)
  for (int t = 0; t < 256; t++) {
    iv p[D]; for (int i = 0; i < D; i++) { int j = (t >> (2 * i)) & 3; p[i] = I2(-R0 + 0.75 * j, j == 3 ? R0 : -R0 + 0.75 * (j + 1)); }
    Surf L; init_surf(&L); surf_box(p, 0, &L);
    #pragma omp critical
    merge(&S, &L);
  }
  double r = S.rmax;
  #pragma omp parallel for schedule(dynamic, 1)
  for (int t = 0; t < 256; t++) {
    iv p[D]; for (int i = 0; i < D; i++) { int j = (t >> (2 * i)) & 3; p[i] = I2(-r + r / 2 * j, j == 3 ? r : -r + r / 2 * (j + 1)); }
    Surf L; init_surf(&L); hess_box(p, r, 0, &L);
    #pragma omp critical
    { H.boxes += L.boxes; H.failed += L.failed; H.M = fmax(H.M, L.M); }
  }
  Surface out; out.rmax = S.rmax; memcpy(out.bb, S.bb, sizeof out.bb); out.g = S.g; out.M = H.M;
  /* all 16 vertices lie in a slab of thickness M D^2/g (D = 4s the diameter), but a
   * tesseract is at least its edge 2s wide in every direction: s >= g/(8M). Large: 4s <= 2 rmax. */
  out.smin = rd(rd(S.g / ru(8 * H.M)) * (1 - 0x1p-50));
  out.smax = ru(ru(S.rmax / 2) * (1 + 0x1p-50));
  out.ok = S.failed == 0 && H.failed == 0 && out.smin > 0;
  if (verbose) {
    printf("Part 1: the hypersurface F = 0 inside |p| <= %g\n", R0);
    printf("  %ld boxes, %ld failed: one smooth star-shaped 3-sphere, with %.4f <= |p| <= %.4f; |grad F| >= %.4f on it\n", S.boxes, S.failed, S.rmin, S.rmax, S.g);
    printf("  bounding box"); for (int i = 0; i < D; i++) printf(" [%.4f, %.4f]", S.bb[i][0], S.bb[i][1]); printf("\n");
    printf("  Hessian positive definite on |p| <= %.4f (%ld boxes, %ld failed): strictly convex; norm <= M = %.4f\n", r, H.boxes, H.failed, H.M);
    printf("Part 2: a tesseract with all 16 vertices on it has half-edge s in [%.4f, %.4f]\n", out.smin, out.smax);
    printf("%s\n", out.ok ? "VALID" : "FAILED");
  }
  return out;
}

/* ======================= part 3 ======================= */
#define NP 11   /* c0..c3, s, a0..a2, b0..b2 */
typedef struct { double lo[NP], hi[NP]; } Box;
static Surface SF;
static long reported = 0;

/* matrices of left multiplication by q and right multiplication by q (quaternions (w, x, y, z)) */
static void left_mat(const iv q[4], iv M[4][4]) {
  iv w = q[0], x = q[1], y = q[2], z = q[3];
  iv A[4][4] = {{w, neg(x), neg(y), neg(z)}, {x, w, neg(z), y}, {y, z, w, neg(x)}, {z, neg(y), x, w}};
  memcpy(M, A, sizeof A);
}
static void right_mat(const iv q[4], iv M[4][4]) {
  iv w = q[0], x = q[1], y = q[2], z = q[3];
  iv A[4][4] = {{w, neg(x), neg(y), neg(z)}, {x, w, z, neg(y)}, {y, neg(z), w, x}, {z, y, neg(x), w}};
  memcpy(M, A, sizeof A);
}
/* Unnormalised form: with L = (1, a) and R = (1, b), the rotation is p -> L p conj(R)/(|L||R|),
 * so the vertices are c + sigma L e conj(R) with sigma = s/(|L||R|). Since |L|, |R| are in
 * [1, 2] for |a_i|, |b_i| <= 1, sigma ranges over [s_min/4, s_max]. The vertices are then
 * polynomials in (c, sigma, a, b), with simple derivatives. */
static void matmul4(iv A[4][4], iv B[4][4], iv C[4][4]) {
  for (int i = 0; i < 4; i++) for (int j = 0; j < 4; j++) { iv t = I(0); for (int k = 0; k < 4; k++) t = add(t, mul(A[i][k], B[k][j])); C[i][j] = t; }
}
/* For a box X: is it free of tesseracts? If not, *split gets the parameter to split. Mean-value
 * form: F(p_e(x)) lies in F(p_e(m)) + sum_k [grad F(P_e) . dp_e/dx_k (X)] [-hw_k, hw_k],
 * where P_e encloses the vertex over the whole box X. */
static int excluded(const Box *b, int *split) {
  double m[NP], hw[NP];
  for (int k = 0; k < NP; k++) { m[k] = (b->lo[k] + b->hi[k]) / 2; hw[k] = fmax(ru(b->hi[k] - m[k]), ru(m[k] - b->lo[k])); }
  iv X[NP]; for (int k = 0; k < NP; k++) X[k] = I2(b->lo[k], b->hi[k]);
  /* over the box */
  iv L[4] = {I(1), X[5], X[6], X[7]}, Rc[4] = {I(1), neg(X[8]), neg(X[9]), neg(X[10])};
  iv Lm[4][4], Rr[4][4], M[4][4]; left_mat(L, Lm); right_mat(Rc, Rr); matmul4(Lm, Rr, M);
  iv dMa[3][4][4], dMb[3][4][4];
  for (int k = 0; k < 3; k++) {
    iv u[4] = {I(0), I(0), I(0), I(0)}; u[k + 1] = I(1);
    iv U[4][4]; left_mat(u, U); matmul4(U, Rr, dMa[k]);
    iv nu[4] = {I(0), I(0), I(0), I(0)}; nu[k + 1] = I(-1);
    iv V[4][4]; right_mat(nu, V); matmul4(Lm, V, dMb[k]);
  }
  /* at the centre */
  iv Lc[4] = {I(1), I(m[5]), I(m[6]), I(m[7])}, Rcc[4] = {I(1), I(-m[8]), I(-m[9]), I(-m[10])};
  iv Lmc[4][4], Rrc[4][4], Mc[4][4]; left_mat(Lc, Lmc); right_mat(Rcc, Rrc); matmul4(Lmc, Rrc, Mc);
  iv sig = X[4], sigc = I(m[4]);
  double best = -1; int bestk = 0;
  for (int e = 0; e < 16; e++) {
    iv v[4], vc[4], P[4], pc[4];
    for (int i = 0; i < 4; i++) {
      iv t = I(0), tc = I(0);
      for (int j = 0; j < 4; j++) { if ((e >> j) & 1) { t = add(t, M[i][j]); tc = add(tc, Mc[i][j]); } else { t = sub(t, M[i][j]); tc = sub(tc, Mc[i][j]); } }
      v[i] = t; vc[i] = tc; P[i] = add(X[i], mul(sig, t)); pc[i] = add(I(m[i]), mul(sigc, tc));
    }
    if (min_norm(P) > SF.rmax) return 1;
    double fm = mig(Fv(pc));
    if (fm == 0) continue;
    iv g[4]; grad(P, g);
    double contrib[NP], tot = 0;
    for (int k = 0; k < 4; k++) { contrib[k] = up_mul(mag(g[k]), hw[k]); }
    { iv d = I(0); for (int i = 0; i < 4; i++) d = add(d, mul(g[i], v[i])); contrib[4] = up_mul(mag(d), hw[4]); }
    for (int k = 0; k < 3; k++) {
      iv da = I(0), db = I(0);
      for (int i = 0; i < 4; i++) {
        iv ta = I(0), tb = I(0);
        for (int j = 0; j < 4; j++) { if ((e >> j) & 1) { ta = add(ta, dMa[k][i][j]); tb = add(tb, dMb[k][i][j]); } else { ta = sub(ta, dMa[k][i][j]); tb = sub(tb, dMb[k][i][j]); } }
        da = add(da, mul(g[i], ta)); db = add(db, mul(g[i], tb));
      }
      contrib[5 + k] = up_mul(up_mul(mag(da), mag(sig)), hw[5 + k]);
      contrib[8 + k] = up_mul(up_mul(mag(db), mag(sig)), hw[8 + k]);
    }
    for (int k = 0; k < NP; k++) tot = up_add(tot, contrib[k]);
    if (fm > tot) return 1;
    /* remember the vertex closest to exclusion, and its largest term, for the split */
    double ratio = fm / tot;
    if (ratio > best) { best = ratio; bestk = 0; for (int k = 1; k < NP; k++) if (contrib[k] > contrib[bestk]) bestk = k; }
  }
  if (best < 0) {   /* no vertex had a usable value: split the widest (weighted) direction */
    double w[NP]; for (int k = 0; k < NP; k++) w[k] = b->hi[k] - b->lo[k];
    w[4] *= 8; for (int k = 5; k < NP; k++) w[k] *= 4 * b->hi[4];
    bestk = 0; for (int k = 1; k < NP; k++) if (w[k] > w[bestk]) bestk = k;
  }
  *split = bestk; return 0;
}

typedef struct { long boxes, failed; int deepest; } Stats;
static Stats search_box(Box b0) {
  Stats S = {0, 0, 0};
  long cap = 4096, top = 0; Box *st = malloc(cap * sizeof(Box)); int *dp = malloc(cap * sizeof(int));
  st[top] = b0; dp[top++] = 0;
  while (top) {
    long nrep;
    #pragma omp atomic read
    nrep = reported;
    if (nrep > 10) break;
    Box b = st[--top]; int d = dp[top]; S.boxes++;
    int k;
    if (excluded(&b, &k)) { if (d > S.deepest) S.deepest = d; continue; }
    double r2 = 0; for (int i = 0; i < NP; i++) r2 = fmax(r2, b.hi[i] - b.lo[i]);
    if (d >= 400 || r2 < 1e-9) {
      S.failed++; long nf;
      #pragma omp atomic capture
      nf = ++reported;
      if (nf <= 10) {
        #pragma omp critical
        { printf("  NOT EXCLUDED: c = ("); for (int k = 0; k < 4; k++) printf("%.5f%s", (b.lo[k] + b.hi[k]) / 2, k < 3 ? ", " : "), ");
          printf("sigma = %.5f, a = (%.4f, %.4f, %.4f), b = (%.4f, %.4f, %.4f)\n", (b.lo[4] + b.hi[4]) / 2, (b.lo[5] + b.hi[5]) / 2, (b.lo[6] + b.hi[6]) / 2, (b.lo[7] + b.hi[7]) / 2, (b.lo[8] + b.hi[8]) / 2, (b.lo[9] + b.hi[9]) / 2, (b.lo[10] + b.hi[10]) / 2); }
      }
      continue;
    }
    double mid = (b.lo[k] + b.hi[k]) / 2;
    if (top + 2 > cap) { cap *= 2; st = realloc(st, cap * sizeof(Box)); dp = realloc(dp, cap * sizeof(int)); }
    Box x = b, y = b; x.hi[k] = mid; y.lo[k] = mid;
    st[top] = x; dp[top++] = d + 1; st[top] = y; dp[top++] = d + 1;
  }
  free(st); free(dp); return S;
}

int main(int argc, char **argv) {
  init_coeffs();
  if (argc > 1 && !strcmp(argv[1], "surface")) return surface(1).ok ? 0 : 1;
  if (argc > 1 && !strcmp(argv[1], "search")) {
    SF = surface(0); if (!SF.ok) { printf("surface checks failed\n"); return 1; }
    int N[NP] = {4, 5, 4, 4, 4, 2, 2, 2, 2, 2, 2}; long total = 1; for (int k = 0; k < NP; k++) total *= N[k];
    double lo[NP], hi[NP];
    for (int k = 0; k < 4; k++) { lo[k] = SF.bb[k][0]; hi[k] = SF.bb[k][1]; }
    lo[4] = rd(SF.smin / 4); hi[4] = SF.smax; for (int k = 5; k < NP; k++) { lo[k] = -1; hi[k] = 1; }
    double frac = argc > 2 ? atof(argv[2]) : 1; long count = (long)(total * frac); if (count < 1) count = 1;
    long step = total / count;
    printf("Part 3: %ld of %ld top boxes; sigma in [%.4f, %.4f]\n", count, total, lo[4], hi[4]);
    long boxes = 0, failed = 0; int deepest = 0; double t0 = omp_get_wtime(); long done = 0;
    #pragma omp parallel for schedule(dynamic, 1) reduction(+:boxes, failed) reduction(max:deepest)
    for (long t = 0; t < count; t++) {
      long idx = t * step; Box b;
      for (int k = 0; k < NP; k++) { int j = idx % N[k]; idx /= N[k];
        b.lo[k] = j == 0 ? lo[k] : lo[k] + (hi[k] - lo[k]) * j / N[k]; b.hi[k] = j == N[k] - 1 ? hi[k] : lo[k] + (hi[k] - lo[k]) * (j + 1) / N[k]; }
      Stats S = search_box(b); boxes += S.boxes; failed += S.failed; if (S.deepest > deepest) deepest = S.deepest;
      long dn;
      #pragma omp atomic capture
      dn = ++done;
      if (dn % 100 == 0) fprintf(stderr, "\r  %ld/%ld top boxes, %ld boxes so far in this thread, %.0f s", dn, count, S.boxes, omp_get_wtime() - t0);
    }
    printf("\n  %ld boxes checked, deepest split %d, %ld not excluded, %.1f s\n%s\n", boxes, deepest, failed, omp_get_wtime() - t0,
           failed == 0 && count == total ? "VALID: no inscribed tesseract" : failed ? "FAILED" : "partial run: no tesseract in the part checked");
    return failed == 0 ? 0 : 1;
  }
  if (argc > 2 && !strcmp(argv[1], "estimate")) {   /* Knuth's estimate of the search size, from random probes */
    SF = surface(0); int N[NP] = {4, 5, 4, 4, 4, 2, 2, 2, 2, 2, 2}; long total = 1; for (int k = 0; k < NP; k++) total *= N[k];
    double lo[NP], hi[NP]; for (int k = 0; k < 4; k++) { lo[k] = SF.bb[k][0]; hi[k] = SF.bb[k][1]; }
    lo[4] = rd(SF.smin / 4); hi[4] = SF.smax; for (int k = 5; k < NP; k++) { lo[k] = -1; hi[k] = 1; }
    long probes = atol(argv[2]); double sum = 0, sum2 = 0; int maxd = 0;
    #pragma omp parallel for reduction(+:sum, sum2) reduction(max:maxd)
    for (long t = 0; t < probes; t++) {
      unsigned long long st = 88172645463325252ULL ^ ((unsigned long long)(t + 1) * 0x9E3779B97F4A7C15ULL);
      #define RNG (st ^= st << 13, st ^= st >> 7, st ^= st << 17, st)
      long idx = (long)(RNG % (unsigned long long)total); Box b;
      for (int k = 0; k < NP; k++) { int j = idx % N[k]; idx /= N[k]; b.lo[k] = lo[k] + (hi[k] - lo[k]) * j / N[k]; b.hi[k] = lo[k] + (hi[k] - lo[k]) * (j + 1) / N[k]; }
      double est = 0, w = 1; int d = 0, k;
      for (;;) { est += w; if (excluded(&b, &k) || d > 400) break; double mid = (b.lo[k] + b.hi[k]) / 2; if (RNG & 1) b.hi[k] = mid; else b.lo[k] = mid; w *= 2; d++; }
      sum += est; sum2 += est * est; if (d > maxd) maxd = d;
    }
    double mean = sum / probes, sd = sqrt(fmax(sum2 / probes - mean * mean, 0)) / sqrt(probes);
    printf("estimated boxes: %.3g per top box (+- %.2g), %.3g in all; deepest probe %d\n", mean, sd, mean * total, maxd); return 0;
  }
  fprintf(stderr, "usage: egg-tesseract surface | search [fraction] | estimate probes\n"); return 2;
}
