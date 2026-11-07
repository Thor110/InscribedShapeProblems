/*
 * An explicit smooth strictly convex surface with no inscribed cube (ROADMAP: "an explicit
 * egg with no inscribed cube"). The surface is the zero set, inside the ball |p| <= R0, of
 *
 *   F(x, y, z) = x^2 + (16/25) y^2 + (400/289) z^2
 *                + (3/20) (x^3/2 + xyz + (7/10) y^2 z + (3/10) z^3) - 1,
 *
 * the "lopsided egg" of pages/surfaces3d.js (semi-axes 1, 5/4, 17/20, asymmetry 3/20).
 *
 *   gcc -O2 -fopenmp -ffp-contract=off -o egg-cube tools/egg-cube.c -lm
 *   ./egg-cube surface         part 1: the surface is a smooth strictly convex sphere,
 *                              and the constants for part 2
 *   ./egg-cube search [parts]  part 3: no cube (all of it, or a fraction for timing)
 *
 * Rigour. All bounds use interval arithmetic in which every operation is rounded outward by
 * one unit in the last place or more (the same scheme as pages/interval.js): after a
 * round-to-nearest operation the computed value x is within half an ulp of the exact one,
 * and x + |x|*2^-51 + 2^-1074 is beyond it. Compile with -ffp-contract=off (no fused
 * operations) and without -ffast-math.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <omp.h>

/* ---------- outward-rounded interval arithmetic ---------- */
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
  double lo = fmin(fmin(p1, p2), fmin(p3, p4)), hi = fmax(fmax(p1, p2), fmax(p3, p4));
  return (iv){rd(lo), ru(hi)};
}
static inline iv sqr(iv a) {
  double l = fabs(a.lo), h = fabs(a.hi), mx = fmax(l, h), mn = (a.lo <= 0 && a.hi >= 0) ? 0 : fmin(l, h);
  return (iv){mn == 0 ? 0 : rd(mn * mn), ru(mx * mx)};
}
static inline iv divi(iv a, iv b) {   /* b > 0 */
  double p1 = a.lo / b.lo, p2 = a.lo / b.hi, p3 = a.hi / b.lo, p4 = a.hi / b.hi;
  return (iv){rd(fmin(fmin(p1, p2), fmin(p3, p4))), ru(fmax(fmax(p1, p2), fmax(p3, p4)))};
}
static inline iv ratio(long p, long q) { return divi(I(p), I(q)); }
static inline double mag(iv a) { return fmax(fabs(a.lo), fabs(a.hi)); }
static inline double mig(iv a) { return a.lo > 0 ? a.lo : a.hi < 0 ? -a.hi : 0; }
static inline double up_mul(double a, double b) { return ru(a * b); }   /* a, b >= 0 */
static inline double up_add(double a, double b) { return ru(a + b); }
static inline double up_sqrt(double a) { return ru(sqrt(a)); }         /* sqrt is correctly rounded */
static inline double dn_sqrt(double a) { return rd(sqrt(a)); }

/* ---------- the egg ---------- */
/* The asymmetry e = E_NUM/E_DEN (3/20). Control runs: -DE_NUM=0 gives the ellipsoid, which is
 * centrally symmetric and so has inscribed cubes (Hausel-Makai-Szucs); the search must then fail. */
#ifndef E_NUM
#define E_NUM 3
#define E_DEN 20
#endif
static iv A, B, K1, K2, K3, K4;   /* 16/25, 400/289, e/2, e, 0.7e, 0.3e */
static void init_coeffs(void) {
  A = ratio(16, 25); B = ratio(400, 289); K1 = ratio(E_NUM, 2 * E_DEN); K2 = ratio(E_NUM, E_DEN);
  K3 = ratio(7 * E_NUM, 10 * E_DEN); K4 = ratio(3 * E_NUM, 10 * E_DEN);
}
static iv F(iv x, iv y, iv z) {
  iv x2 = sqr(x), y2 = sqr(y), z2 = sqr(z);
  iv q = add(add(x2, mul(A, y2)), mul(B, z2));
  iv c = add(add(mul(K1, mul(x2, x)), mul(K2, mul(mul(x, y), z))), add(mul(K3, mul(y2, z)), mul(K4, mul(z2, z))));
  return sub(add(q, c), I(1));
}
static void gradF(iv x, iv y, iv z, iv g[3]) {
  g[0] = add(add(mul(I(2), x), mul(mul(I(3), K1), sqr(x))), mul(K2, mul(y, z)));
  g[1] = add(add(mul(mul(I(2), A), y), mul(K2, mul(x, z))), mul(mul(I(2), K3), mul(y, z)));
  g[2] = add(add(mul(mul(I(2), B), z), mul(K2, mul(x, y))), add(mul(K3, sqr(y)), mul(mul(I(3), K4), sqr(z))));
}
static void hessF(iv x, iv y, iv z, iv H[3][3]) {
  H[0][0] = add(I(2), mul(mul(I(6), K1), x));
  H[1][1] = add(mul(I(2), A), mul(mul(I(2), K3), z));
  H[2][2] = add(mul(I(2), B), mul(mul(I(6), K4), z));
  H[0][1] = H[1][0] = mul(K2, z);
  H[0][2] = H[2][0] = mul(K2, y);
  H[1][2] = H[2][1] = add(mul(K2, x), mul(mul(I(2), K3), y));
}
/* bounds of |p| over a box */
static double box_min_norm(const iv p[3]) { double s = 0; for (int i = 0; i < 3; i++) { double m = mig(p[i]); s += rd(m * m); } return dn_sqrt(rd(s)); }
static double box_max_norm(const iv p[3]) { double s = 0; for (int i = 0; i < 3; i++) { double m = mag(p[i]); s = up_add(s, up_mul(m, m)); } return up_sqrt(s); }

/* ======================= part 1: the surface ======================= */
#define R0 1.5
#define SURF_W (1.0 / 256)   /* boxes that may meet the surface are refined to this width */
#define HESS_W (1.0 / 32)
typedef struct { long boxes, failed; double rmin, rmax, bb[3][2], g; } SurfStats;

static void surface_box(const iv p[3], int depth, SurfStats *S) {
  S->boxes++;
  double nmin = box_min_norm(p), nmax = box_max_norm(p);
  if (nmin > R0) return;                                  /* outside the ball */
  iv f = F(p[0], p[1], p[2]);
  int meets_sphere = nmax >= R0;
  int ok;
  if (f.lo > 0) ok = 1;                                   /* no zero here, and F > 0 on any sphere part */
  else if (meets_sphere) ok = 0;                          /* need F > 0 where the box meets |p| = R0 */
  else if (f.hi < 0) ok = 1;                              /* no zero here */
  else {
    /* a zero may lie here: need p . grad F > 0 on the box */
    iv g[3]; gradF(p[0], p[1], p[2], g);
    iv d = add(add(mul(p[0], g[0]), mul(p[1], g[1])), mul(p[2], g[2]));
    ok = d.lo > 0;
    if (ok && p[0].hi - p[0].lo > SURF_W) ok = 0;            /* refine near the surface, for tight constants */
    else if (ok) {
      if (nmin < S->rmin) S->rmin = nmin;
      if (nmax > S->rmax) S->rmax = nmax;
      for (int i = 0; i < 3; i++) { if (p[i].lo < S->bb[i][0]) S->bb[i][0] = p[i].lo; if (p[i].hi > S->bb[i][1]) S->bb[i][1] = p[i].hi; }
      double s = 0; for (int i = 0; i < 3; i++) { double m = mig(g[i]); s += rd(m * m); }
      double gl = dn_sqrt(rd(s)); if (gl < S->g) S->g = gl;
    }
  }
  if (ok) return;
  if (depth >= 40) { S->failed++; return; }
  int k = 0; for (int i = 1; i < 3; i++) if (p[i].hi - p[i].lo > p[k].hi - p[k].lo) k = i;
  double m = (p[k].lo + p[k].hi) / 2; iv a[3], b[3]; memcpy(a, p, sizeof a); memcpy(b, p, sizeof b);
  a[k].hi = m; b[k].lo = m; surface_box(a, depth + 1, S); surface_box(b, depth + 1, S);
}

/* Hessian on boxes covering the ball |p| <= r: positive definite (Sylvester), and a bound
 * on its spectral norm (by the largest absolute row sum). */
typedef struct { long boxes, failed; double M, minDet; } HessStats;
static void hess_box(const iv p[3], double r, int depth, HessStats *S) {
  S->boxes++;
  if (box_min_norm(p) > r) return;
  iv H[3][3]; hessF(p[0], p[1], p[2], H);
  iv d1 = H[0][0], d2 = sub(mul(H[0][0], H[1][1]), sqr(H[0][1]));
  iv d3 = add(sub(mul(H[0][0], sub(mul(H[1][1], H[2][2]), sqr(H[1][2]))), mul(H[0][1], sub(mul(H[0][1], H[2][2]), mul(H[1][2], H[0][2])))),
              mul(H[0][2], sub(mul(H[0][1], H[1][2]), mul(H[1][1], H[0][2]))));
  if (d1.lo > 0 && d2.lo > 0 && d3.lo > 0 && p[0].hi - p[0].lo <= HESS_W) {
    double M = 0; for (int i = 0; i < 3; i++) { double s = 0; for (int j = 0; j < 3; j++) s = up_add(s, mag(H[i][j])); if (s > M) M = s; }
    if (M > S->M) S->M = M;
    if (d3.lo < S->minDet) S->minDet = d3.lo;
    return;
  }
  if (depth >= 30) { S->failed++; return; }
  int k = 0; for (int i = 1; i < 3; i++) if (p[i].hi - p[i].lo > p[k].hi - p[k].lo) k = i;
  double m = (p[k].lo + p[k].hi) / 2; iv a[3], b[3]; memcpy(a, p, sizeof a); memcpy(b, p, sizeof b);
  a[k].hi = m; b[k].lo = m; hess_box(a, r, depth + 1, S); hess_box(b, r, depth + 1, S);
}

typedef struct { double rmax, bb[3][2], g, M, smin, smax; int ok; } Surface;

static Surface surface(int verbose) {
  Surface out; SurfStats S = {0, 0, INFINITY, 0, {{INFINITY, -INFINITY}, {INFINITY, -INFINITY}, {INFINITY, -INFINITY}}, INFINITY};
  iv p[3] = {I2(-R0, R0), I2(-R0, R0), I2(-R0, R0)};
  surface_box(p, 0, &S);
  HessStats H = {0, 0, 0, INFINITY};
  double r = S.rmax; iv q[3] = {I2(-r, r), I2(-r, r), I2(-r, r)};
  hess_box(q, r, 0, &H);
  out.rmax = S.rmax; memcpy(out.bb, S.bb, sizeof out.bb); out.g = S.g; out.M = H.M;
  /* small cubes: edge a >= g/(3M), so half-edge s >= g/(6M); large: diameter 2*sqrt(3)*s <= 2*rmax */
  out.smin = rd(rd(S.g / ru(6 * H.M)) * (1 - 0x1p-50));
  out.smax = ru(ru(S.rmax / dn_sqrt(3)) * (1 + 0x1p-50));
  out.ok = S.failed == 0 && H.failed == 0 && out.smin > 0;
  if (verbose) {
    printf("Part 1: the surface F = 0 inside |p| <= %g\n", R0);
    printf("  %ld boxes, %ld failed: F > 0 on |p| = %g, and p . grad F > 0 wherever F can vanish\n", S.boxes, S.failed, R0);
    printf("  so the zero set is one smooth star-shaped sphere, with %.4f <= |p| <= %.4f\n", S.rmin, S.rmax);
    printf("  bounding box [%.4f, %.4f] x [%.4f, %.4f] x [%.4f, %.4f]; |grad F| >= %.4f on it\n", S.bb[0][0], S.bb[0][1], S.bb[1][0], S.bb[1][1], S.bb[2][0], S.bb[2][1], S.g);
    printf("  Hessian positive definite on |p| <= %.4f (%ld boxes, %ld failed; det >= %.3f): strictly convex\n", r, H.boxes, H.failed, H.minDet);
    printf("  Hessian norm <= M = %.4f there\n", H.M);
    printf("Part 2: a cube with all 8 vertices on the surface has edge >= g/(3M) = %.4f, so half-edge s in [%.4f, %.4f]\n", 2 * out.smin, out.smin, out.smax);
    printf("%s\n", out.ok ? "VALID" : "FAILED");
  }
  return out;
}

/* ======================= part 3: no cube ======================= */
/* A cube: centre c, half-edge s, rotation R(q) (Cayley vector q); vertices c + s R(q) e for
 * the 8 sign vectors e. The cube's 24 rotations are the 48 units of the binary octahedral
 * group, and every rotation is equivalent to one with |q_i| <= sqrt2 - 1, |q1|+|q2|+|q3| <= 1. */
typedef struct { double lo[7], hi[7]; } Box;    /* c0 c1 c2 s q0 q1 q2 */
typedef struct { long boxes, failed; int deepest; double smallestRho; } Stats;
static Surface SF;
static double QMAX;
static long reported = 0;

/* rotation matrix of the Cayley vector q (a point), enclosed */
static void rotation(const double q[3], iv R[3][3]) {
  iv Q[3] = {I(q[0]), I(q[1]), I(q[2])};
  iv qq = add(add(sqr(Q[0]), sqr(Q[1])), sqr(Q[2])), den = add(I(1), qq), d0 = sub(I(1), qq);
  iv X[3][3] = {{I(0), neg(Q[2]), Q[1]}, {Q[2], I(0), neg(Q[0])}, {neg(Q[1]), Q[0], I(0)}};
  for (int i = 0; i < 3; i++) for (int j = 0; j < 3; j++) {
    iv v = add(mul(I(2), mul(Q[i], Q[j])), mul(I(2), X[i][j]));
    if (i == j) v = add(v, d0);
    R[i][j] = divi(v, den);
  }
}

/* Is the box free of cubes? Evaluates at the centre, and bounds the change across the box. */
static int excluded(const Box *b) {
  double m[7], hw[7];
  for (int k = 0; k < 7; k++) { m[k] = (b->lo[k] + b->hi[k]) / 2; hw[k] = fmax(ru(b->hi[k] - m[k]), ru(m[k] - b->lo[k])); }
  /* every vertex moves by at most rho across the box:
   * |dc| + sqrt3 |ds| + s_max * 2 sqrt3 |dq|   (|R(q')e - R(q)e| <= 2 |u' - u| |e|, |u' - u| <= |q' - q|) */
  double dc = up_sqrt(up_add(up_add(up_mul(hw[0], hw[0]), up_mul(hw[1], hw[1])), up_mul(hw[2], hw[2])));
  double dq = up_sqrt(up_add(up_add(up_mul(hw[4], hw[4]), up_mul(hw[5], hw[5])), up_mul(hw[6], hw[6])));
  double s3 = up_sqrt(3), rho = up_add(up_add(dc, up_mul(s3, hw[3])), up_mul(up_mul(up_mul(2, s3), b->hi[3]), dq));
  iv R[3][3]; rotation(m + 4, R);
  iv s = I(m[3]);
  for (int e = 0; e < 8; e++) {
    double sg[3] = {e & 1 ? 1 : -1, e & 2 ? 1 : -1, e & 4 ? 1 : -1};
    iv p[3];
    for (int i = 0; i < 3; i++) { iv t = add(add(mul(R[i][0], I(sg[0])), mul(R[i][1], I(sg[1]))), mul(R[i][2], I(sg[2]))); p[i] = add(I(m[i]), mul(s, t)); }
    iv f = F(p[0], p[1], p[2]);
    double fm = mig(f);
    if (fm == 0) continue;
    /* the box of radius rho around the vertex */
    iv P[3]; for (int i = 0; i < 3; i++) P[i] = I2(rd(p[i].lo - rho), ru(p[i].hi + rho));
    if (box_min_norm(P) > SF.rmax) return 1;              /* the vertex cannot reach the surface */
    iv g[3]; gradF(P[0], P[1], P[2], g);
    double G = up_sqrt(up_add(up_add(up_mul(mag(g[0]), mag(g[0])), up_mul(mag(g[1]), mag(g[1]))), up_mul(mag(g[2]), mag(g[2]))));
    if (fm > up_mul(G, rho)) return 1;                     /* F has no zero within rho of the vertex */
  }
  return 0;
}
static double rho_of(const Box *b) {   /* the same weights, for choosing the split */
  double w[7]; for (int k = 0; k < 7; k++) w[k] = (b->hi[k] - b->lo[k]) / 2;
  return sqrt(w[0] * w[0] + w[1] * w[1] + w[2] * w[2]) + sqrt(3) * w[3] + 2 * sqrt(3) * b->hi[3] * sqrt(w[4] * w[4] + w[5] * w[5] + w[6] * w[6]);
}
static int q_outside(const Box *b) {   /* the box misses |q1| + |q2| + |q3| <= 1 */
  double s = 0; for (int k = 4; k < 7; k++) s += b->lo[k] > 0 ? b->lo[k] : b->hi[k] < 0 ? -b->hi[k] : 0;
  return rd(s) > 1;   /* (a lower bound of the sum, so only boxes surely outside are dropped) */
}

static Stats search_box(Box b0) {
  Stats S = {0, 0, 0, INFINITY};
  long cap = 4096, top = 0; Box *st = malloc(cap * sizeof(Box)); int *dp = malloc(cap * sizeof(int));
  st[top] = b0; dp[top++] = 0;
  while (top) {
    Box b = st[--top]; int d = dp[top]; S.boxes++;
    if (q_outside(&b) || excluded(&b)) { if (d > S.deepest) S.deepest = d; continue; }
    double rho = rho_of(&b);
    if (d >= 60 || rho < 1e-9) { S.failed++; if (rho < S.smallestRho) S.smallestRho = rho;
      long nf;
      #pragma omp atomic capture
      nf = ++reported;
      if (nf <= 10)
      #pragma omp critical
      printf("  NOT EXCLUDED: c = (%.6f, %.6f, %.6f), s = %.6f, q = (%.6f, %.6f, %.6f)\n", (b.lo[0] + b.hi[0]) / 2, (b.lo[1] + b.hi[1]) / 2, (b.lo[2] + b.hi[2]) / 2, (b.lo[3] + b.hi[3]) / 2, (b.lo[4] + b.hi[4]) / 2, (b.lo[5] + b.hi[5]) / 2, (b.lo[6] + b.hi[6]) / 2);
      continue; }
    /* split the coordinate contributing most to rho */
    double c[7]; for (int k = 0; k < 7; k++) c[k] = (b.hi[k] - b.lo[k]);
    c[3] *= sqrt(3); for (int k = 4; k < 7; k++) c[k] *= 2 * sqrt(3) * b.hi[3];
    int k = 0; for (int i = 1; i < 7; i++) if (c[i] > c[k]) k = i;
    double mid = (b.lo[k] + b.hi[k]) / 2;
    if (top + 2 > cap) { cap *= 2; st = realloc(st, cap * sizeof(Box)); dp = realloc(dp, cap * sizeof(int)); }
    Box a = b, e = b; a.hi[k] = mid; e.lo[k] = mid;
    st[top] = a; dp[top++] = d + 1; st[top] = e; dp[top++] = d + 1;
  }
  free(st); free(dp); return S;
}

int main(int argc, char **argv) {
  init_coeffs();
  if (argc > 1 && !strcmp(argv[1], "surface")) return surface(1).ok ? 0 : 1;
  if (argc > 1 && !strcmp(argv[1], "search")) {
    SF = surface(0); if (!SF.ok) { printf("surface checks failed\n"); return 1; }
    QMAX = ru(sqrt(2) - 1) + 1e-12;
    /* top-level grid: centres in the surface's bounding box, s in [smin, smax], q in [-QMAX, QMAX]^3 */
    int N[7] = {8, 10, 7, 8, 4, 4, 4}; long total = 1; for (int k = 0; k < 7; k++) total *= N[k];
    double lo[7] = {SF.bb[0][0], SF.bb[1][0], SF.bb[2][0], SF.smin, -QMAX, -QMAX, -QMAX};
    double hi[7] = {SF.bb[0][1], SF.bb[1][1], SF.bb[2][1], SF.smax, QMAX, QMAX, QMAX};
    double frac = argc > 2 ? atof(argv[2]) : 1; long count = (long)(total * frac); if (count < 1) count = 1;
    long step = total / count;   /* a spread-out sample of the top boxes when timing */
    printf("Part 3: %ld of %ld top boxes; s in [%.4f, %.4f]\n", count, total, SF.smin, SF.smax);
    long boxes = 0, failed = 0; int deepest = 0; double t0 = omp_get_wtime(); long done = 0;
    #pragma omp parallel for schedule(dynamic, 1) reduction(+:boxes, failed) reduction(max:deepest)
    for (long t = 0; t < count; t++) {
      long idx = t * step; Box b;
      for (int k = 0; k < 7; k++) { int j = idx % N[k]; idx /= N[k];
        b.lo[k] = j == 0 ? lo[k] : lo[k] + (hi[k] - lo[k]) * j / N[k]; b.hi[k] = j == N[k] - 1 ? hi[k] : lo[k] + (hi[k] - lo[k]) * (j + 1) / N[k]; }
      Stats S = search_box(b); boxes += S.boxes; failed += S.failed; if (S.deepest > deepest) deepest = S.deepest;
      long dn;
      #pragma omp atomic capture
      dn = ++done;
      if (dn % 1000 == 0) { fprintf(stderr, "\r  %ld/%ld top boxes, %.0f s", dn, count, omp_get_wtime() - t0); }
    }
    printf("\n  %ld boxes checked, deepest split %d, %ld not excluded, %.1f s\n%s\n", boxes, deepest, failed, omp_get_wtime() - t0,
           failed == 0 && count == total ? "VALID: no inscribed cube" : failed ? "FAILED" : "partial run: no cube in the part checked");
    return failed == 0 ? 0 : 1;
  }
  fprintf(stderr, "usage: egg-cube surface | search [fraction]\n"); return 2;
}
