/*
 * Independent check of tools/egg-cube.c (the egg with no inscribed cube), in C with the ball
 * arithmetic of Arb (FLINT 3). It shares no code with egg-cube.c, and it bounds each box
 * differently: instead of a value at the centre plus a Lipschitz bound, it evaluates the
 * vertices and F directly on balls of parameters, so Arb carries every error.
 *
 *   gcc -O2 -fopenmp -o egg-cube-arb tools/egg-cube-arb.c -lflint -lm
 *   ./egg-cube-arb
 *   ./egg-cube-arb control   (asymmetry 0, the ellipsoid: the boxes holding its known cube,
 *                            centre 0, half-edge 1/sqrt(1 + 16/25 + 400/289), must NOT be excluded)
 *   ./egg-cube-arb icosahedron           the same for the regular icosahedron
 *   ./egg-cube-arb icosahedron-control   (the unit sphere: its icosahedra must be found)
 *
 * The egg: F = x^2 + (16/25) y^2 + (400/289) z^2 + (3/20)(x^3/2 + xyz + (7/10) y^2 z + (3/10) z^3) - 1,
 * and the surface is its zero set in |p| <= 3/2.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <flint/arb.h>
#include <omp.h>

#define PREC 64
static double up_d(const arb_t x) { arf_t u; arf_init(u); arb_get_ubound_arf(u, x, PREC); double d = arf_get_d(u, ARF_RND_CEIL); arf_clear(u); return d; }
static double lo_d(const arb_t x) { arf_t u; arf_init(u); arb_get_lbound_arf(u, x, PREC); double d = arf_get_d(u, ARF_RND_FLOOR); arf_clear(u); return d; }
static void ball(arb_t x, double a, double b) { arf_t l, u; arf_init(l); arf_init(u); arf_set_d(l, a); arf_set_d(u, b); arb_set_interval_arf(x, l, u, PREC); arf_clear(l); arf_clear(u); }
static void q_(arb_t x, long p, long q) { arb_set_si(x, p); arb_div_si(x, x, q, PREC); }

static arb_t CA, CB, CE, C7, C3;   /* 16/25, 400/289, 3/20, 7/10, 3/10 */

/* F at the ball vector p */
static void Fb(arb_t f, arb_srcptr p) {
  arb_t t, u; arb_init(t); arb_init(u);
  arb_sqr(f, p + 0, PREC);
  arb_sqr(t, p + 1, PREC); arb_addmul(f, CA, t, PREC);
  arb_sqr(t, p + 2, PREC); arb_addmul(f, CB, t, PREC);
  /* cubic part: x^3/2 + xyz + (7/10) y^2 z + (3/10) z^3 */
  arb_sqr(u, p + 0, PREC); arb_mul(u, u, p + 0, PREC); arb_mul_2exp_si(u, u, -1);
  arb_mul(t, p + 0, p + 1, PREC); arb_mul(t, t, p + 2, PREC); arb_add(u, u, t, PREC);
  arb_sqr(t, p + 1, PREC); arb_mul(t, t, p + 2, PREC); arb_addmul(u, C7, t, PREC);
  arb_sqr(t, p + 2, PREC); arb_mul(t, t, p + 2, PREC); arb_addmul(u, C3, t, PREC);
  arb_addmul(f, CE, u, PREC); arb_sub_si(f, f, 1, PREC);
  arb_clear(t); arb_clear(u);
}
/* p . grad F, and |grad F| (as a ball) */
static void radial_grad(arb_t d, arb_t gn, arb_srcptr p) {
  arb_t g0, g1, g2, t; arb_init(g0); arb_init(g1); arb_init(g2); arb_init(t);
  /* F_x = 2x + e(3x^2/2 + yz) */
  arb_sqr(g0, p + 0, PREC); arb_mul_si(g0, g0, 3, PREC); arb_mul_2exp_si(g0, g0, -1); arb_addmul(g0, p + 1, p + 2, PREC); arb_mul(g0, g0, CE, PREC);
  arb_mul_2exp_si(t, p + 0, 1); arb_add(g0, g0, t, PREC);
  /* F_y = 2(16/25) y + e(xz + (7/5) yz) */
  arb_mul(g1, p + 1, p + 2, PREC); arb_mul(g1, g1, C7, PREC); arb_mul_2exp_si(g1, g1, 1); arb_addmul(g1, p + 0, p + 2, PREC); arb_mul(g1, g1, CE, PREC);
  arb_mul(t, CA, p + 1, PREC); arb_mul_2exp_si(t, t, 1); arb_add(g1, g1, t, PREC);
  /* F_z = 2(400/289) z + e(xy + (7/10) y^2 + (9/10) z^2) */
  arb_sqr(g2, p + 1, PREC); arb_mul(g2, g2, C7, PREC); arb_addmul(g2, p + 0, p + 1, PREC);
  arb_sqr(t, p + 2, PREC); arb_mul(t, t, C3, PREC); arb_mul_si(t, t, 3, PREC); arb_add(g2, g2, t, PREC); arb_mul(g2, g2, CE, PREC);
  arb_mul(t, CB, p + 2, PREC); arb_mul_2exp_si(t, t, 1); arb_add(g2, g2, t, PREC);
  arb_mul(d, p + 0, g0, PREC); arb_addmul(d, p + 1, g1, PREC); arb_addmul(d, p + 2, g2, PREC);
  arb_sqr(gn, g0, PREC); arb_addmul(gn, g1, g1, PREC); arb_addmul(gn, g2, g2, PREC); arb_sqrtpos(gn, gn, PREC);
  arb_clear(g0); arb_clear(g1); arb_clear(g2); arb_clear(t);
}
static void norm2(arb_t n, arb_srcptr p) { arb_sqr(n, p + 0, PREC); arb_addmul(n, p + 1, p + 1, PREC); arb_addmul(n, p + 2, p + 2, PREC); }

/* ---------- part 1 ---------- */
typedef struct { long boxes, failed; double rmin, rmax, bb[3][2], g; } P1;
static void p1(const double lo[3], const double hi[3], int depth, P1 *S) {
  S->boxes++;
  arb_ptr p = _arb_vec_init(3); arb_t f, n, d, gn; arb_init(f); arb_init(n); arb_init(d); arb_init(gn);
  for (int i = 0; i < 3; i++) ball(p + i, lo[i], hi[i]);
  norm2(n, p); int done = 0, ok = 0;
  if (lo_d(n) > 2.25) done = ok = 1;                       /* outside |p| <= 3/2 */
  else {
    Fb(f, p); int meets = up_d(n) >= 2.25;
    if (arb_is_positive(f)) done = ok = 1;
    else if (!meets && arb_is_negative(f)) done = ok = 1;
    else if (!meets && hi[0] - lo[0] <= 1.0 / 256) {
      radial_grad(d, gn, p);
      if (arb_is_positive(d)) {
        done = ok = 1;
        double r0 = sqrt(fmax(lo_d(n), 0)) * (1 - 1e-15), r1 = sqrt(up_d(n)) * (1 + 1e-15);
        if (r0 < S->rmin) S->rmin = r0;
        if (r1 > S->rmax) S->rmax = r1;
        for (int i = 0; i < 3; i++) { if (lo[i] < S->bb[i][0]) S->bb[i][0] = lo[i]; if (hi[i] > S->bb[i][1]) S->bb[i][1] = hi[i]; }
        double g = lo_d(gn); if (g < S->g) S->g = g;
      }
    }
  }
  arb_clear(f); arb_clear(n); arb_clear(d); arb_clear(gn); _arb_vec_clear(p, 3);
  if (done && ok) return;
  if (depth > 45) { S->failed++; return; }
  int k = 0; for (int i = 1; i < 3; i++) if (hi[i] - lo[i] > hi[k] - lo[k]) k = i;
  double m = (lo[k] + hi[k]) / 2, a[3], b[3];
  memcpy(a, hi, sizeof a); a[k] = m; p1(lo, a, depth + 1, S);
  memcpy(b, lo, sizeof b); b[k] = m; p1(b, hi, depth + 1, S);
}

/* Hessian H = [[2 + 3e x, e z, e y], [e z, 32/25 + (7/5) e z, e x + (7/5) e y], [e y, ., 800/289 + (9/5) e z]]:
 * positive definite (leading minors) and its Frobenius norm (>= spectral norm) */
typedef struct { long boxes, failed; double M; } P2;
static void p2(const double lo[3], const double hi[3], double r, int depth, P2 *S) {
  S->boxes++;
  arb_ptr p = _arb_vec_init(3); arb_t n, h[6], t, m1, m2, m3, fr; arb_init(n); arb_init(t); arb_init(m1); arb_init(m2); arb_init(m3); arb_init(fr);
  for (int i = 0; i < 6; i++) arb_init(h[i]);
  for (int i = 0; i < 3; i++) ball(p + i, lo[i], hi[i]);
  norm2(n, p); int ok = 0;
  if (lo_d(n) > r * r) ok = 1;
  else if (hi[0] - lo[0] <= 1.0 / 32) {
    /* h0 = H00, h1 = H11, h2 = H22, h3 = H01, h4 = H02, h5 = H12 */
    arb_mul(h[0], CE, p + 0, PREC); arb_mul_si(h[0], h[0], 3, PREC); arb_add_si(h[0], h[0], 2, PREC);
    arb_mul(h[1], CE, p + 2, PREC); arb_mul(h[1], h[1], C7, PREC); arb_mul_2exp_si(h[1], h[1], 1); arb_mul_2exp_si(t, CA, 1); arb_add(h[1], h[1], t, PREC);
    arb_mul(h[2], CE, p + 2, PREC); arb_mul(h[2], h[2], C3, PREC); arb_mul_si(h[2], h[2], 6, PREC); arb_mul_2exp_si(t, CB, 1); arb_add(h[2], h[2], t, PREC);
    arb_mul(h[3], CE, p + 2, PREC); arb_mul(h[4], CE, p + 1, PREC);
    arb_mul(h[5], C7, p + 1, PREC); arb_mul_2exp_si(h[5], h[5], 1); arb_add(h[5], h[5], p + 0, PREC); arb_mul(h[5], h[5], CE, PREC);
    arb_set(m1, h[0]);
    arb_mul(m2, h[0], h[1], PREC); arb_submul(m2, h[3], h[3], PREC);
    /* det = h0(h1 h2 - h5^2) - h3(h3 h2 - h5 h4) + h4(h3 h5 - h1 h4) */
    arb_mul(t, h[1], h[2], PREC); arb_submul(t, h[5], h[5], PREC); arb_mul(m3, h[0], t, PREC);
    arb_mul(t, h[3], h[2], PREC); arb_submul(t, h[5], h[4], PREC); arb_submul(m3, h[3], t, PREC);
    arb_mul(t, h[3], h[5], PREC); arb_submul(t, h[1], h[4], PREC); arb_addmul(m3, h[4], t, PREC);
    if (arb_is_positive(m1) && arb_is_positive(m2) && arb_is_positive(m3)) {
      ok = 1;
      arb_zero(fr); for (int i = 0; i < 3; i++) arb_addmul(fr, h[i], h[i], PREC);
      for (int i = 3; i < 6; i++) { arb_sqr(t, h[i], PREC); arb_mul_2exp_si(t, t, 1); arb_add(fr, fr, t, PREC); }
      arb_sqrtpos(fr, fr, PREC); double M = up_d(fr); if (M > S->M) S->M = M;
    }
  }
  for (int i = 0; i < 6; i++) arb_clear(h[i]);
  arb_clear(n); arb_clear(t); arb_clear(m1); arb_clear(m2); arb_clear(m3); arb_clear(fr); _arb_vec_clear(p, 3);
  if (ok) return;
  if (depth > 40) { S->failed++; return; }
  int k = 0; for (int i = 1; i < 3; i++) if (hi[i] - lo[i] > hi[k] - lo[k]) k = i;
  double m = (lo[k] + hi[k]) / 2, a[3], b[3];
  memcpy(a, hi, sizeof a); a[k] = m; p2(lo, a, r, depth + 1, S);
  memcpy(b, lo, sizeof b); b[k] = m; p2(b, hi, r, depth + 1, S);
}

/* ---------- part 3: boxes of (c, s, q) evaluated as balls ---------- */
static double RMAX, VN, QM;          /* VN >= |v|; QM: the box of Cayley vectors searched */
static int NV; static arb_t VB[12][3];   /* the vertices at scale 1 */
/* cube: (+-1, +-1, +-1), orientations |q_i| <= sqrt2 - 1, sum |q_i| <= 1.
 * icosahedron: (0, +-1, +-phi) and cyclic permutations; the Hurwitz units are among its
 * rotations, so sum |q_i| <= 1 suffices. */
static void make_shape(int ico) {
  if (!ico) {
    NV = 8; for (int e = 0; e < 8; e++) for (int i = 0; i < 3; i++) { arb_init(VB[e][i]); arb_set_si(VB[e][i], (e >> i) & 1 ? 1 : -1); }
    VN = sqrt(3) * (1 + 1e-12); QM = (sqrt(2) - 1) * (1 + 1e-12);
  } else {
    arb_t phi; arb_init(phi); arb_sqrt_ui(phi, 5, PREC); arb_add_si(phi, phi, 1, PREC); arb_mul_2exp_si(phi, phi, -1);
    int n = 0;
    for (int a = -1; a <= 1; a += 2) for (int b = -1; b <= 1; b += 2) for (int r = 0; r < 3; r++) {
      /* (0, a, b phi) with its coordinates rotated r places */
      for (int i = 0; i < 3; i++) {
        int w = (i + 3 - r) % 3; arb_init(VB[n][i]);
        if (w == 0) arb_zero(VB[n][i]); else if (w == 1) arb_set_si(VB[n][i], a); else arb_mul_si(VB[n][i], phi, b, PREC);
      }
      n++;
    }
    NV = 12; VN = sqrt((1 + sqrt(5)) / 2 + 2) * (1 + 1e-12); QM = 1; arb_clear(phi);
  }
}
/* 1 if no cube has its parameters in the box */
static int no_cube(const double *lo, const double *hi) {
  arb_ptr v = _arb_vec_init(7), p = _arb_vec_init(3); arb_t qq, den, d0, x, f, n, R[3][3];
  arb_init(qq); arb_init(den); arb_init(d0); arb_init(x); arb_init(f); arb_init(n);
  for (int k = 0; k < 7; k++) ball(v + k, lo[k], hi[k]);
  arb_srcptr q = v + 4;
  /* lower bound of |q1| + |q2| + |q3| > 1: outside the fundamental domain */
  double l1 = 0; for (int k = 4; k < 7; k++) l1 += lo[k] > 0 ? lo[k] : hi[k] < 0 ? -hi[k] : 0;
  int res = l1 * (1 - 1e-15) > 1;
  if (!res) {
    norm2(qq, q); arb_add_si(den, qq, 1, PREC); arb_sub_si(d0, qq, 1, PREC); arb_neg(d0, d0);
    for (int i = 0; i < 3; i++) for (int j = 0; j < 3; j++) {
      arb_init(R[i][j]); arb_mul(R[i][j], q + i, q + j, PREC); arb_mul_2exp_si(R[i][j], R[i][j], 1);
      if (i == j) arb_add(R[i][j], R[i][j], d0, PREC);
      int k = 3 - i - j;   /* the cross-product part 2[q]x: entry (i, j), i != j */
      if (i != j) { arb_mul_2exp_si(x, q + k, 1); if ((j - i + 3) % 3 == 1) arb_sub(R[i][j], R[i][j], x, PREC); else arb_add(R[i][j], R[i][j], x, PREC); }
      arb_div(R[i][j], R[i][j], den, PREC);
    }
    for (int e = 0; e < NV && !res; e++) {
      for (int i = 0; i < 3; i++) {
        arb_zero(x); for (int j = 0; j < 3; j++) arb_addmul(x, R[i][j], VB[e][j], PREC);
        arb_mul(x, x, v + 3, PREC); arb_add(p + i, v + i, x, PREC);
      }
      norm2(n, p);
      if (lo_d(n) > RMAX * RMAX) res = 1;
      else { Fb(f, p); if (!arb_contains_zero(f)) res = 1; }
    }
    for (int i = 0; i < 3; i++) for (int j = 0; j < 3; j++) arb_clear(R[i][j]);
  }
  arb_clear(qq); arb_clear(den); arb_clear(d0); arb_clear(x); arb_clear(f); arb_clear(n);
  _arb_vec_clear(v, 7); _arb_vec_clear(p, 3);
  return res;
}
typedef struct { double lo[7], hi[7]; int d; } Box;
static long FAILED_TOTAL = 0;   /* a failed proof stops after a few failures (keeps control runs short) */
static long search(Box b0, long *failed) {
  long cap = 1024, top = 0, boxes = 0; Box *st = malloc(cap * sizeof(Box)); st[top++] = b0;
  while (top) {
    long nf;
    #pragma omp atomic read
    nf = FAILED_TOTAL;
    if (nf > 10) break;
    Box b = st[--top]; boxes++;
    if (no_cube(b.lo, b.hi)) continue;
    if (b.d >= 64) { (*failed)++;
      #pragma omp atomic
      FAILED_TOTAL++;
      continue; }
    double w[7]; for (int k = 0; k < 7; k++) w[k] = b.hi[k] - b.lo[k];
    w[3] *= VN; for (int k = 4; k < 7; k++) w[k] *= 2 * VN * b.hi[3];
    int k = 0; for (int i = 1; i < 7; i++) if (w[i] > w[k]) k = i;
    double m = (b.lo[k] + b.hi[k]) / 2;
    if (top + 2 > cap) { cap *= 2; st = realloc(st, cap * sizeof(Box)); }
    Box a = b, c = b; a.hi[k] = m; c.lo[k] = m; a.d = c.d = b.d + 1; st[top++] = a; st[top++] = c;
  }
  free(st); return boxes;
}

int main(int argc, char **argv) {
  const char *mode = argc > 1 ? argv[1] : "";
  int ico = !strncmp(mode, "icosahedron", 11), control = strstr(mode, "control") != NULL;
  arb_init(CA); arb_init(CB); arb_init(CE); arb_init(C7); arb_init(C3);
  q_(CA, 16, 25); q_(CB, 400, 289); q_(CE, control ? 0 : 3, 20); q_(C7, 7, 10); q_(C3, 3, 10);
  if (ico && control) { arb_one(CA); arb_one(CB); }   /* the unit sphere, which has icosahedra */
  make_shape(ico);
  double t0 = omp_get_wtime();
  /* part 1, in 64 pieces for the threads */
  P1 S = {0, 0, INFINITY, 0, {{INFINITY, -INFINITY}, {INFINITY, -INFINITY}, {INFINITY, -INFINITY}}, INFINITY};
  #pragma omp parallel for schedule(dynamic, 1)
  for (int t = 0; t < 64; t++) {
    double lo[3], hi[3]; for (int i = 0; i < 3; i++) { int j = (t >> (2 * i)) & 3; lo[i] = -1.5 + 0.75 * j; hi[i] = lo[i] + 0.75; }
    P1 L = {0, 0, INFINITY, 0, {{INFINITY, -INFINITY}, {INFINITY, -INFINITY}, {INFINITY, -INFINITY}}, INFINITY};
    p1(lo, hi, 0, &L);
    #pragma omp critical
    { S.boxes += L.boxes; S.failed += L.failed; S.rmin = fmin(S.rmin, L.rmin); S.rmax = fmax(S.rmax, L.rmax); S.g = fmin(S.g, L.g);
      for (int i = 0; i < 3; i++) { S.bb[i][0] = fmin(S.bb[i][0], L.bb[i][0]); S.bb[i][1] = fmax(S.bb[i][1], L.bb[i][1]); } }
  }
  double r = S.rmax; P2 H = {0, 0, 0};
  #pragma omp parallel for schedule(dynamic, 1)
  for (int t = 0; t < 64; t++) {
    double lo[3], hi[3]; for (int i = 0; i < 3; i++) { int j = (t >> (2 * i)) & 3; lo[i] = -r + r / 2 * j; hi[i] = j == 3 ? r : -r + r / 2 * (j + 1); }
    P2 L = {0, 0, 0}; p2(lo, hi, r, 0, &L);
    #pragma omp critical
    { H.boxes += L.boxes; H.failed += L.failed; H.M = fmax(H.M, L.M); }
  }
  double smin = S.g / (6 * H.M) * (1 - 1e-12), smax = S.rmax / sqrt(3) * (1 + 1e-12);
  if (ico) {   /* s >= g W / (M D^2) with width W = 2 phi^2/sqrt3 and diameter D = 2 sqrt(phi + 2); D s <= 2 rmax */
    double phi = (1 + sqrt(5)) / 2, W = 2 * phi * phi / sqrt(3), D2 = 4 * (phi + 2);
    smin = S.g * W / (H.M * D2) * (1 - 1e-12); smax = 2 * S.rmax / sqrt(D2) * (1 + 1e-12);
  }
  int ok1 = S.failed == 0 && H.failed == 0;
  printf("Part 1: %ld boxes, %ld failed: one smooth star-shaped sphere, %.4f <= |p| <= %.4f, |grad F| >= %.4f\n", S.boxes, S.failed, S.rmin, S.rmax, S.g);
  printf("        Hessian positive definite on |p| <= %.4f (%ld boxes, %ld failed), norm <= %.4f\n", r, H.boxes, H.failed, H.M);
  printf("Part 2 (%s): scale s in [%.4f, %.4f]\n", ico ? "icosahedron" : "cube", smin, smax);
  RMAX = S.rmax;
  /* part 3 */
  double qm = QM;
  int N[7] = {8, 10, 7, 8, 4, 4, 4}; long total = 1; for (int k = 0; k < 7; k++) total *= N[k];
  double LO[7] = {S.bb[0][0], S.bb[1][0], S.bb[2][0], smin, -qm, -qm, -qm}, HI[7] = {S.bb[0][1], S.bb[1][1], S.bb[2][1], smax, qm, qm, qm};
  long boxes = 0, failed = 0;
  #pragma omp parallel for schedule(dynamic, 1) reduction(+:boxes, failed)
  for (long t = 0; t < total; t++) {
    Box b; long idx = t; b.d = 0;
    for (int k = 0; k < 7; k++) { int j = idx % N[k]; idx /= N[k]; b.lo[k] = j == 0 ? LO[k] : LO[k] + (HI[k] - LO[k]) * j / N[k]; b.hi[k] = j == N[k] - 1 ? HI[k] : LO[k] + (HI[k] - LO[k]) * (j + 1) / N[k]; }
    if (control) {   /* only the top boxes that contain the known shape: the ellipsoid's cube, or an icosahedron in the sphere */
      double cube[7] = {0, 0, 0, ico ? 1 / sqrt((1 + sqrt(5)) / 2 + 2) : 1 / sqrt(1 + 16.0 / 25 + 400.0 / 289), 0, 0, 0}; int in = 1;
      for (int k = 0; k < 7; k++) in &= b.lo[k] <= cube[k] && cube[k] <= b.hi[k];
      if (!in) continue;
    }
    long f = 0; boxes += search(b, &f); failed += f;
  }
  if (control) { printf("Control (%s): %ld boxes, %ld not excluded: %s\n", ico ? "icosahedra in the sphere" : "the ellipsoid's cube", boxes, failed, failed ? "the known shape is found, as it must be" : "PROBLEM: the known shape was missed"); return failed ? 0 : 1; }
  int ok = ok1 && failed == 0;
  printf("Part 3: %ld boxes, %ld not excluded, %.0f s\n%s\n", boxes, failed, omp_get_wtime() - t0, ok ? (ico ? "VALID: the egg has no inscribed regular icosahedron" : "VALID: the egg has no inscribed cube") : "FAILED");
  flint_cleanup_master();
  return ok ? 0 : 1;
}
