/*
 * Independent check of the certificates for PROOFS.md, Theorems 6 and 7, in C with the
 * ball arithmetic of Arb (part of FLINT 3). This is a third implementation, alongside
 * pages/certify-rigorous.js (JavaScript, own interval code) and
 * tools/verify_certificates.py (Python, mpmath). It shares nothing with them except
 * the box definitions z, J, K read from data/certificates.json and
 * data/certificate-tetrahedron.json. Those are only data: the proof is valid for any
 * z, J, K, and their accuracy affects only the margin.
 *
 * Every real quantity is an Arb ball (midpoint ± radius) that is guaranteed to contain
 * the exact value; comparisons are decided only when the balls are disjoint.
 *
 *   sudo apt install libflint-dev          (or build FLINT 3 from source)
 *   gcc -O2 -fopenmp -o verify tools/verify-certificates.c -lflint -lm
 *   ./verify                               (run from the repository root)
 *   ./verify orientations                  (Corollary 7.3: the sample in data/orientation-sample.json)
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <flint/arb.h>
#include <omp.h>

#define PREC 64
#define MAXN 4

/* ---- small helpers ---- */
static double up_d(const arb_t x) { arf_t u; arf_init(u); arb_get_ubound_arf(u, x, PREC); double d = arf_get_d(u, ARF_RND_CEIL); arf_clear(u); return d; }
static double lo_d(const arb_t x) { arf_t u; arf_init(u); arb_get_lbound_arf(u, x, PREC); double d = arf_get_d(u, ARF_RND_FLOOR); arf_clear(u); return d; }
static double mag_d(const arb_t x) { arf_t u; arf_init(u); arb_get_abs_ubound_arf(u, x, PREC); double d = arf_get_d(u, ARF_RND_CEIL); arf_clear(u); return d; }
static double mig_d(const arb_t x) { arf_t u; arf_init(u); arb_get_abs_lbound_arf(u, x, PREC); double d = arf_get_d(u, ARF_RND_FLOOR); arf_clear(u); return d; }
static double mid_d(const arb_t x) { return arf_get_d(arb_midref(x), ARF_RND_NEAR); }
static void set_ratio(arb_t x, long p, long q) { arb_set_si(x, p); arb_div_si(x, x, q, PREC); }
static void set_interval(arb_t x, double a, double b) { arf_t l, u; arf_init(l); arf_init(u); arf_set_d(l, a); arf_set_d(u, b); arb_set_interval_arf(x, l, u, PREC); arf_clear(l); arf_clear(u); }
/* ball ± exact double (FLINT 3.0 has no arb_*_d functions) */
static void add_d(arb_t r, const arb_t x, double d, slong prec) { arb_t t; arb_init(t); arb_set_d(t, d); arb_add(r, x, t, prec); arb_clear(t); }
static void sub_d(arb_t r, const arb_t x, double d, slong prec) { arb_t t; arb_init(t); arb_set_d(t, d); arb_sub(r, x, t, prec); arb_clear(t); }
static void mul_d(arb_t r, const arb_t x, double d, slong prec) { arb_t t; arb_init(t); arb_set_d(t, d); arb_mul(r, x, t, prec); arb_clear(t); }
/* a ball containing every value in [a, b] for a ≤ b given as balls */
static void hull(arb_t x, const arb_t a, const arb_t b) { arb_union(x, a, b, PREC); }

/* ---- the ellipse / ellipsoid and its signed distance ---- */
typedef struct { int n; arb_t a[3], a2[3]; double af[3], a2f[3], amin2; int k; } Ellipsoid;

static void ellipsoid_init(Ellipsoid *E, int n, const long num[], const long den[]) {
  E->n = n; E->amin2 = INFINITY;
  for (int i = 0; i < n; i++) {
    arb_init(E->a[i]); arb_init(E->a2[i]); set_ratio(E->a[i], num[i], den[i]); arb_sqr(E->a2[i], E->a[i], PREC);
    E->af[i] = (double)num[i] / den[i]; E->a2f[i] = E->af[i] * E->af[i];
    if (E->a2f[i] < E->amin2) { E->amin2 = E->a2f[i]; E->k = i; }
  }
}

/* F(t) = Σ (a_i p_i / (t + a_i²))² − 1, as a ball; returns 0 if a denominator may vanish */
static int F_ball(arb_t F, const Ellipsoid *E, const double *p, const arb_t t) {
  arb_t d, r; arb_init(d); arb_init(r); arb_set_si(F, -1); int ok = 1;
  for (int i = 0; i < E->n; i++) {
    arb_add(d, t, E->a2[i], PREC);
    if (!arb_is_positive(d)) { ok = 0; break; }
    mul_d(r, E->a[i], p[i], PREC); arb_div(r, r, d, PREC); arb_sqr(r, r, PREC); arb_add(F, F, r, PREC);
  }
  arb_clear(d); arb_clear(r); return ok;
}

/* Signed distance (negative inside) from the point p to the ellipsoid, as a ball.
 * The closest point is a_i² p_i/(t + a_i²) with t the unique root above −min a_i² of the
 * decreasing F; a floating-point root is bracketed and the bracket verified with balls. */
static int sd_point(arb_t out, const Ellipsoid *E, const double *p) {
  int n = E->n; double t;
  double F0 = -1; for (int i = 0; i < n; i++) { double r = E->af[i] * p[i] / E->a2f[i]; F0 += r * r; }
  t = F0 > 0 ? 0.0 : -E->amin2 + E->af[E->k] * fabs(p[E->k]);
  for (int it = 0; it < 100; it++) {                  /* Newton, monotone from the left */
    double Fv = -1, dF = 0;
    for (int i = 0; i < n; i++) { double u = t + E->a2f[i], r = E->af[i] * p[i] / u; Fv += r * r; dF -= 2 * r * r / u; }
    if (!(dF < 0)) break;
    double step = Fv / dF; t -= step;
    if (fabs(step) <= 1e-16 * (1 + fabs(t))) break;
  }
  arb_t tl, th, Fl, Fh, T, s, r, d; arb_init(tl); arb_init(th); arb_init(Fl); arb_init(Fh); arb_init(T); arb_init(s); arb_init(r); arb_init(d);
  int found = 0;
  for (double w = 1e-13 * (1 + fabs(t)); w < 1e-3 && !found; w *= 16) {
    double a = t - w, b = t + w;
    if (!(a > -E->amin2 * (1 - 1e-12))) continue;
    arb_set_d(tl, a); arb_set_d(th, b);
    if (!F_ball(Fl, E, p, tl) || !F_ball(Fh, E, p, th)) continue;
    if (arb_is_positive(Fl) && arb_is_negative(Fh)) {
      hull(T, tl, th); arb_zero(s);
      for (int i = 0; i < n; i++) { arb_add(d, T, E->a2[i], PREC); arb_set_d(r, p[i]); arb_div(r, r, d, PREC); arb_sqr(r, r, PREC); arb_add(s, s, r, PREC); }
      arb_sqrt(s, s, PREC); arb_abs(r, T); arb_mul(out, r, s, PREC);   /* |t|·√Σ… over the bracket */
      if (b < 0) arb_neg(out, out);
      else if (a <= 0) { double m = mag_d(out); set_interval(out, -m, m); }
      found = 1;
    }
  }
  arb_clear(tl); arb_clear(th); arb_clear(Fl); arb_clear(Fh); arb_clear(T); arb_clear(s); arb_clear(r); arb_clear(d);
  return found;
}

/* sd over a ball vector B: sd at the centre, widened by the distance from the centre to B */
static void sd_box(arb_t out, const Ellipsoid *E, arb_srcptr B) {
  double q[3]; arb_t r2, dv; arb_init(r2); arb_init(dv); arb_zero(r2);
  for (int i = 0; i < E->n; i++) { q[i] = mid_d(B + i); sub_d(dv, B + i, q[i], PREC); arb_set_d(dv, mag_d(dv)); arb_sqr(dv, dv, PREC); arb_add(r2, r2, dv, PREC); }
  arb_sqrt(r2, r2, PREC);
  if (!sd_point(out, E, q)) { fprintf(stderr, "signed distance not verified\n"); exit(2); }
  arb_add_error(out, r2);
  arb_clear(r2); arb_clear(dv);
}

/* ---- the two problems ---- */
typedef struct { int n; Ellipsoid E; arb_t b, w[4][3]; double lip; } Problem;

/* Theorem 6: corners A = γ(t), C = −γ(t'), γ(t) = ((1 − t²)/(1 + t²), 2bt/(1 + t²)) */
static void gam(arb_t x, arb_t y, const Problem *P, const arb_t t) {
  arb_t t2, den; arb_init(t2); arb_init(den);
  arb_sqr(t2, t, PREC); arb_add_si(den, t2, 1, PREC);
  arb_sub_si(x, t2, 1, PREC); arb_neg(x, x); arb_div(x, x, den, PREC);
  arb_mul(y, P->b, t, PREC); arb_mul_si(y, y, 2, PREC); arb_div(y, y, den, PREC);
  arb_clear(t2); arb_clear(den);
}
static void G_square(arb_ptr g, const Problem *P, const double *p) {
  arb_t t, Ax, Ay, Cx, Cy, mx, my, hx, hy; arb_ptr B = _arb_vec_init(2);
  arb_init(t); arb_init(Ax); arb_init(Ay); arb_init(Cx); arb_init(Cy); arb_init(mx); arb_init(my); arb_init(hx); arb_init(hy);
  arb_set_d(t, p[0]); gam(Ax, Ay, P, t); arb_set_d(t, p[1]); gam(Cx, Cy, P, t); arb_neg(Cx, Cx); arb_neg(Cy, Cy);
  arb_add(mx, Ax, Cx, PREC); arb_mul_2exp_si(mx, mx, -1); arb_add(my, Ay, Cy, PREC); arb_mul_2exp_si(my, my, -1);
  arb_sub(hx, Cx, Ax, PREC); arb_mul_2exp_si(hx, hx, -1); arb_sub(hy, Cy, Ay, PREC); arb_mul_2exp_si(hy, hy, -1);
  arb_sub(B + 0, mx, hy, PREC); arb_add(B + 1, my, hx, PREC); sd_box(g + 0, &P->E, B);
  arb_add(B + 0, mx, hy, PREC); arb_sub(B + 1, my, hx, PREC); sd_box(g + 1, &P->E, B);
  arb_clear(t); arb_clear(Ax); arb_clear(Ay); arb_clear(Cx); arb_clear(Cy); arb_clear(mx); arb_clear(my); arb_clear(hx); arb_clear(hy); _arb_vec_clear(B, 2);
}
/* Theorem 7: vertices x + s·w_k */
static void G_tetra(arb_ptr g, const Problem *P, const double *p) {
  arb_ptr V = _arb_vec_init(3); arb_t s; arb_init(s); arb_set_d(s, p[3]);
  for (int k = 0; k < 4; k++) { for (int i = 0; i < 3; i++) { arb_mul(V + i, s, P->w[k][i], PREC); add_d(V + i, V + i, p[i], PREC); } sd_box(g + k, &P->E, V); }
  _arb_vec_clear(V, 3); arb_clear(s);
}
static void G_eval(arb_ptr g, const Problem *P, const double *p) { if (P->n == 2) G_square(g, P, p); else G_tetra(g, P, p); }

static void square_problem(Problem *P) {
  long num[2] = {1, 3}, den[2] = {1, 5}; P->n = 2; ellipsoid_init(&P->E, 2, num, den);
  arb_init(P->b); set_ratio(P->b, 3, 5);
  arb_t l; arb_init(l); arb_set_si(l, 2); arb_sqrt(l, l, PREC); arb_mul_si(l, l, 2, PREC); P->lip = up_d(l); arb_clear(l);   /* 2√2 */
}
/* Cayley rotation R = ((1 − |q|²)I + 2qqᵀ + 2[q]×)/(1 + |q|²), q = (1/8, 1/4, 3/8) or the
 * given Cayley vector qd (exact doubles); w_k = R v_k/√3 */
static void tetra_problem(Problem *P, const double *qd) {
  long num[3] = {1, 4, 3}, den[3] = {1, 5, 5}; P->n = 4; ellipsoid_init(&P->E, 3, num, den);
  arb_t q[3], qq, d0, den1, R[3][3], s3, x, X; for (int i = 0; i < 3; i++) arb_init(q[i]);
  arb_init(qq); arb_init(d0); arb_init(den1); arb_init(s3); arb_init(x); arb_init(X);
  if (qd) for (int i = 0; i < 3; i++) arb_set_d(q[i], qd[i]);
  else { set_ratio(q[0], 1, 8); set_ratio(q[1], 1, 4); set_ratio(q[2], 3, 8); }
  arb_zero(qq); for (int i = 0; i < 3; i++) { arb_sqr(x, q[i], PREC); arb_add(qq, qq, x, PREC); }
  arb_sub_si(d0, qq, 1, PREC); arb_neg(d0, d0); arb_add_si(den1, qq, 1, PREC);
  for (int i = 0; i < 3; i++) for (int j = 0; j < 3; j++) {
    arb_init(R[i][j]); arb_mul(R[i][j], q[i], q[j], PREC); arb_mul_si(R[i][j], R[i][j], 2, PREC);
    if (i == j) arb_add(R[i][j], R[i][j], d0, PREC);
    /* [q]× = [[0, −q3, q2], [q3, 0, −q1], [−q2, q1, 0]] */
    arb_zero(X);
    if (i == 0 && j == 1) arb_neg(X, q[2]); if (i == 0 && j == 2) arb_set(X, q[1]);
    if (i == 1 && j == 0) arb_set(X, q[2]); if (i == 1 && j == 2) arb_neg(X, q[0]);
    if (i == 2 && j == 0) arb_neg(X, q[1]); if (i == 2 && j == 1) arb_set(X, q[0]);
    arb_mul_si(X, X, 2, PREC); arb_add(R[i][j], R[i][j], X, PREC); arb_div(R[i][j], R[i][j], den1, PREC);
  }
  arb_set_si(s3, 3); arb_sqrt(s3, s3, PREC);
  int v[4][3] = {{1, 1, 1}, {1, -1, -1}, {-1, 1, -1}, {-1, -1, 1}};
  double wmax = 0;
  for (int k = 0; k < 4; k++) {
    arb_t nrm; arb_init(nrm); arb_zero(nrm);
    for (int i = 0; i < 3; i++) {
      arb_init(P->w[k][i]); arb_zero(P->w[k][i]);
      for (int j = 0; j < 3; j++) { arb_mul_si(x, R[i][j], v[k][j], PREC); arb_add(P->w[k][i], P->w[k][i], x, PREC); }
      arb_div(P->w[k][i], P->w[k][i], s3, PREC); arb_sqr(x, P->w[k][i], PREC); arb_add(nrm, nrm, x, PREC);
    }
    arb_sqrt(nrm, nrm, PREC); if (up_d(nrm) > wmax) wmax = up_d(nrm); arb_clear(nrm);
  }
  arb_set_d(x, wmax); arb_add(x, x, s3, PREC); P->lip = up_d(x);        /* |Δ(x + s w)| ≤ (√3 + |w|)‖Δp‖∞ */
  for (int i = 0; i < 3; i++) { arb_clear(q[i]); for (int j = 0; j < 3; j++) arb_clear(R[i][j]); }
  arb_clear(qq); arb_clear(d0); arb_clear(den1); arb_clear(s3); arb_clear(x); arb_clear(X);
}

/* ---- one check: centre point of a cell, with the bound r for the cell's points ---- */
typedef struct { const Problem *P; int n; double z[MAXN], J[MAXN][MAXN], K[MAXN][MAXN], c, Teff, nK, kD; } Box;

/* evaluates at y (in [−c, c]^n), returns gl = lower bound of ‖G‖∞, h = upper bound of ‖G − L‖∞,
 * and fl = the rounding in computing the sample point z + K·y */
static void check_point(const Box *X, const double *y, double *gl, double *h, double *fl) {
  int n = X->n; double ps[MAXN]; *gl = 0; *h = 0; *fl = 0;
  arb_t ex, t, L; arb_init(ex); arb_init(t); arb_init(L); arb_ptr g = _arb_vec_init(n);
  for (int r = 0; r < n; r++) {
    double s = X->z[r]; for (int k = 0; k < n; k++) s += X->K[r][k] * y[k]; ps[r] = s;
    arb_set_d(ex, X->z[r]); for (int k = 0; k < n; k++) { arb_set_d(t, X->K[r][k]); mul_d(t, t, y[k], PREC); arb_add(ex, ex, t, PREC); }
    sub_d(ex, ex, ps[r], PREC); double e = mag_d(ex); if (e > *fl) *fl = e;
  }
  G_eval(g, X->P, ps);
  for (int r = 0; r < n; r++) {
    arb_zero(L); for (int k = 0; k < n; k++) { arb_set_d(t, ps[k]); sub_d(t, t, X->z[k], PREC); mul_d(t, t, X->J[r][k], PREC); arb_add(L, L, t, PREC); }
    arb_sub(t, g + r, L, PREC); double hv = mag_d(t), gv = mig_d(g + r);
    if (hv > *h) *h = hv; if (gv > *gl) *gl = gv;
  }
  arb_clear(ex); arb_clear(t); arb_clear(L); _arb_vec_clear(g, n);
}
/* does the cell of half-width hw around y pass both conditions? */
static int cell_passes(const Box *X, const double *y, double hw, double *sG, double *sD) {
  double gl, h, fl; check_point(X, y, &gl, &h, &fl);
  arb_t rad, a, b; arb_init(rad); arb_init(a); arb_init(b);
  arb_set_d(rad, X->nK); mul_d(rad, rad, hw, PREC); add_d(rad, rad, fl, PREC);      /* r = ‖K‖·h + ε */
  arb_set_d(a, gl); arb_set_d(b, X->P->lip); arb_mul(b, b, rad, PREC); arb_sub(a, a, b, PREC); sub_d(a, a, X->Teff, PREC);
  arb_set_d(b, gl - 0.0); sub_d(b, b, h, PREC); { arb_t k; arb_init(k); arb_set_d(k, X->kD); arb_mul(k, k, rad, PREC); arb_sub(b, b, k, PREC); arb_clear(k); }
  *sG = lo_d(a); *sD = lo_d(b); int ok = arb_is_positive(a) && arb_is_positive(b);
  arb_clear(rad); arb_clear(a); arb_clear(b); return ok;
}

/* ---- adaptive cells on one face ---- */
typedef struct { double lo[MAXN - 1], hi[MAXN - 1]; int depth; } Cell;
typedef struct { long cells, failed; int deepest; double slackG, slackD; } Stats;

static Stats scan_face(const Box *X, int fixed, int sign, int start, int maxdepth) {
  int n = X->n, m = n - 1; Stats S = {0, 0, 0, INFINITY, INFINITY};
  long cap = 1 << 16, top = 0; Cell *st = malloc(cap * sizeof(Cell));
  double *edges = malloc((start + 1) * sizeof(double));
  for (int i = 0; i <= start; i++) edges[i] = i == start ? X->c : -X->c + 2 * X->c * i / start;
  int idx[MAXN] = {0};
  for (;;) {
    if (top == cap) { cap *= 2; st = realloc(st, cap * sizeof(Cell)); }
    for (int f = 0; f < m; f++) { st[top].lo[f] = edges[idx[f]]; st[top].hi[f] = edges[idx[f] + 1]; }
    st[top++].depth = 0;
    int k = 0; while (k < m && ++idx[k] == start) idx[k++] = 0;
    if (k == m) break;
  }
  while (top) {
    Cell C = st[--top]; S.cells++;
    double y[MAXN], hw = 0;
    for (int d = 0, f = 0; d < n; d++) {
      if (d == fixed) { y[d] = sign * X->c; continue; }
      double mid = (C.lo[f] + C.hi[f]) / 2; y[d] = mid;
      arb_t a; arb_init(a); arb_set_d(a, C.hi[f]); sub_d(a, a, mid, PREC); if (up_d(a) > hw) hw = up_d(a);
      arb_set_d(a, mid); sub_d(a, a, C.lo[f], PREC); if (up_d(a) > hw) hw = up_d(a); arb_clear(a); f++;
    }
    double sG, sD;
    if (cell_passes(X, y, hw, &sG, &sD)) {
      if (sG < S.slackG) S.slackG = sG; if (sD < S.slackD) S.slackD = sD; if (C.depth > S.deepest) S.deepest = C.depth;
    } else if (C.depth < maxdepth) {
      for (int mask = 0; mask < (1 << m); mask++) {
        if (top == cap) { cap *= 2; st = realloc(st, cap * sizeof(Cell)); }
        for (int f = 0; f < m; f++) { double mid = (C.lo[f] + C.hi[f]) / 2; if ((mask >> f) & 1) { st[top].lo[f] = mid; st[top].hi[f] = C.hi[f]; } else { st[top].lo[f] = C.lo[f]; st[top].hi[f] = mid; } }
        st[top++].depth = C.depth + 1;
      }
    } else S.failed++;
  }
  free(st); free(edges); return S;
}

/* ---- uniform grid on one face (the square, as in the other checkers) ---- */
static Stats grid_face(const Box *X, int fixed, int sign, int N) {
  /* every boundary point lies within half a grid step of a sample: treat each sample as a cell */
  int n = X->n; Stats S = {0, 0, 0, INFINITY, INFINITY};
  double *ys = malloc(N * sizeof(double)); for (int i = 0; i < N; i++) ys[i] = i == N - 1 ? X->c : -X->c + 2 * X->c * i / (N - 1);
  double hmax = 0; for (int i = 1; i < N; i++) { arb_t a; arb_init(a); arb_set_d(a, ys[i]); sub_d(a, a, ys[i - 1], PREC); if (up_d(a) > hmax) hmax = up_d(a); arb_clear(a); }
  for (int i = 0; i < N; i++) {
    double y[MAXN]; for (int d = 0; d < n; d++) y[d] = d == fixed ? sign * X->c : ys[i];   /* n = 2: one free coordinate */
    double sG, sD; S.cells++;
    if (cell_passes(X, y, hmax / 2 * (1 + 1e-15), &sG, &sD)) { if (sG < S.slackG) S.slackG = sG; if (sD < S.slackD) S.slackD = sD; } else S.failed++;
  }
  free(ys); return S;
}

/* ---- box setup: degree of L and c_eff, from the (arbitrary) data z, J, K ---- */
static double norm_inf_ball(arb_t M[MAXN][MAXN], int n) { double m = 0; for (int i = 0; i < n; i++) { double s = 0; for (int j = 0; j < n; j++) s += mag_d(M[i][j]); s *= 1 + 1e-15; if (s > m) m = s; } return m; }
static void det_ball(arb_t d, arb_t M[MAXN][MAXN], int n) {
  if (n == 1) { arb_set(d, M[0][0]); return; }
  arb_t minor[MAXN][MAXN], t; arb_init(t); arb_zero(d);
  for (int i = 0; i < n - 1; i++) for (int j = 0; j < n - 1; j++) arb_init(minor[i][j]);
  for (int c = 0; c < n; c++) {
    for (int i = 1; i < n; i++) for (int j = 0, jj = 0; j < n; j++) if (j != c) arb_set(minor[i - 1][jj++], M[i][j]);
    det_ball(t, minor, n - 1); arb_mul(t, t, M[0][c], PREC);
    if (c % 2) arb_sub(d, d, t, PREC); else arb_add(d, d, t, PREC);
  }
  for (int i = 0; i < n - 1; i++) for (int j = 0; j < n - 1; j++) arb_clear(minor[i][j]);
  arb_clear(t);
}
static int box_setup(Box *X, double *cEff) {
  int n = X->n; arb_t Jb[MAXN][MAXN], Kb[MAXN][MAXN], E[MAXN][MAXN], d, t;
  arb_init(d); arb_init(t);
  for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) { arb_init(Jb[i][j]); arb_init(Kb[i][j]); arb_init(E[i][j]); arb_set_d(Jb[i][j], X->J[i][j]); arb_set_d(Kb[i][j], X->K[i][j]); }
  for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) {
    arb_set_si(E[i][j], i == j ? -1 : 0);
    for (int k = 0; k < n; k++) { arb_mul(t, Jb[i][k], Kb[k][j], PREC); arb_add(E[i][j], E[i][j], t, PREC); }
  }
  double e = norm_inf_ball(E, n); X->nK = norm_inf_ball(Kb, n); double nJ = norm_inf_ball(Jb, n);
  arb_set_d(t, X->P->lip); arb_mul_si(t, t, 2, PREC); add_d(t, t, nJ, PREC); X->kD = up_d(t);
  arb_set_d(t, 1); sub_d(t, t, e, PREC); mul_d(t, t, X->c, PREC); *cEff = lo_d(t);
  det_ball(d, Jb, n); int degree = arb_is_positive(d) ? 1 : arb_is_negative(d) ? -1 : 0;
  for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) { arb_clear(Jb[i][j]); arb_clear(Kb[i][j]); arb_clear(E[i][j]); }
  arb_clear(d); arb_clear(t); return degree;
}

/* ---- minimal JSON reading: the numbers after "key": in order ---- */
static char *slurp(const char *path) {
  FILE *f = fopen(path, "rb"); if (!f) { fprintf(stderr, "cannot open %s\n", path); exit(2); }
  fseek(f, 0, SEEK_END); long len = ftell(f); fseek(f, 0, SEEK_SET);
  char *s = malloc(len + 1); if (fread(s, 1, len, f) != (size_t)len) exit(2); s[len] = 0; fclose(f); return s;
}
static void read_numbers(const char *json, const char *section, const char *key, double *out, int count) {
  const char *p = strstr(json, section); if (!p) { fprintf(stderr, "missing %s\n", section); exit(2); }
  char pat[64]; snprintf(pat, sizeof pat, "\"%s\":", key); p = strstr(p, pat); if (!p) { fprintf(stderr, "missing %s\n", key); exit(2); }
  p += strlen(pat);
  for (int i = 0; i < count; i++) {
    while (*p && !(*p == '-' || (*p >= '0' && *p <= '9'))) p++;
    char *end; out[i] = strtod(p, &end); p = end;
  }
}
static void load_box(Box *X, const char *file, int n) {
  char *json = slurp(file); double tmp[MAXN * MAXN];
  read_numbers(json, "\"certificate\"", "zero", X->z, n);
  read_numbers(json, "\"certificate\"", "J", tmp, n * n); for (int i = 0; i < n * n; i++) X->J[i / n][i % n] = tmp[i];
  read_numbers(json, "\"certificate\"", "K", tmp, n * n); for (int i = 0; i < n * n; i++) X->K[i / n][i % n] = tmp[i];
  free(json);
}

static int run(const char *title, Box *X, int adaptive, int N) {
  double cEff; int degree = box_setup(X, &cEff), nf = 2 * X->n; Stats R[2 * MAXN];
  double t0 = omp_get_wtime();
  #pragma omp parallel for schedule(dynamic, 1)
  for (int f = 0; f < nf; f++) R[f] = adaptive ? scan_face(X, f / 2, f % 2 ? 1 : -1, 8, 12) : grid_face(X, f / 2, f % 2 ? 1 : -1, N);
  long cells = 0, failed = 0; int deepest = 0; double sG = INFINITY, sD = INFINITY;
  for (int f = 0; f < nf; f++) { cells += R[f].cells; failed += R[f].failed; if (R[f].deepest > deepest) deepest = R[f].deepest; if (R[f].slackG < sG) sG = R[f].slackG; if (R[f].slackD < sD) sD = R[f].slackD; }
  int ok = degree != 0 && cEff > 0 && failed == 0;
  printf("%s: %s\n  degree %d, %ld %s checked%s, %ld failed, %.1f s\n  on every %s: |G| − (change) − perturbation ≥ %.3g; degree condition slack %.3g\n",
         title, ok ? "VALID" : "FAILED", degree, cells, adaptive ? "cells" : "samples", adaptive ? (deepest ? " (adaptive)" : "") : "", failed, omp_get_wtime() - t0,
         adaptive ? "cell" : "sample", sG, sD);
  return ok;
}

/* ---- Corollary 7.3: re-check a sample of the orientation cubes ----
 * Each record gives a cube [lo, hi] of Cayley vectors, its centre q, the box size c and the
 * box data z, J, K. Everything else is computed here: the half-width h of the cube around q,
 * the circumradius range on Q, the allowance T + s_max·2√3·h for turning within the cube,
 * and the adaptive-cell check of both conditions. */
static int read_seq(const char **p, const char *key, double *out, int count) {
  char pat[64]; snprintf(pat, sizeof pat, "\"%s\":", key); const char *q = strstr(*p, pat); if (!q) return 0;
  q += strlen(pat);
  for (int i = 0; i < count; i++) { while (*q && !(*q == '-' || (*q >= '0' && *q <= '9'))) q++; char *end; out[i] = strtod(q, &end); q = end; }
  *p = q; return 1;
}
static int orientations(const char *file) {
  char *json = slurp(file); const char *p = json;
  double Tq[2]; if (!read_seq(&p, "T", Tq, 2)) { fprintf(stderr, "missing T\n"); exit(2); }
  enum { MAXC = 100000 }; static double LO[MAXC][3], HI[MAXC][3], Q[MAXC][3], C[MAXC], Z[MAXC][4], JJ[MAXC][16], KK[MAXC][16];
  int m = 0;
  while (m < MAXC && read_seq(&p, "lo", LO[m], 3)) {
    read_seq(&p, "hi", HI[m], 3); read_seq(&p, "q", Q[m], 3); read_seq(&p, "c", &C[m], 1);
    read_seq(&p, "zero", Z[m], 4); read_seq(&p, "J", JJ[m], 16); read_seq(&p, "K", KK[m], 16); m++;
  }
  free(json);
  int passed = 0; double worstG = INFINITY, worstD = INFINITY, smallS = INFINITY; long cells = 0; double t0 = omp_get_wtime();
  #pragma omp parallel for schedule(dynamic, 1) reduction(+:passed, cells) reduction(min:worstG, worstD, smallS)
  for (int i = 0; i < m; i++) {
    Problem P; tetra_problem(&P, Q[i]); Box X; X.P = &P; X.n = 4; X.c = C[i];
    for (int r = 0; r < 4; r++) { X.z[r] = Z[i][r]; for (int k = 0; k < 4; k++) { X.J[r][k] = JJ[i][4 * r + k]; X.K[r][k] = KK[i][4 * r + k]; } }
    arb_t h, a, t; arb_init(h); arb_init(a); arb_init(t); arb_zero(h);
    /* h ≥ the largest coordinate distance from q to the cube's faces */
    for (int k = 0; k < 3; k++) {
      arb_set_d(a, HI[i][k]); sub_d(a, a, Q[i][k], PREC); arb_abs(a, a); arb_max(h, h, a, PREC);
      arb_set_d(a, Q[i][k]); sub_d(a, a, LO[i][k], PREC); arb_abs(a, a); arb_max(h, h, a, PREC);
      if (!(LO[i][k] <= Q[i][k] && Q[i][k] <= HI[i][k])) arb_set_si(h, 1000);   /* q must lie in the cube */
    }
    /* circumradius range over the corners of Q (s is affine on Q) */
    double smin = INFINITY, smax = -INFINITY;
    for (int k = 0; k < 16; k++) { arb_set_d(a, X.z[3]); for (int r = 0; r < 4; r++) { arb_set_d(t, X.K[3][r]); mul_d(t, t, (k >> r) & 1 ? X.c : -X.c, PREC); arb_add(a, a, t, PREC); } if (lo_d(a) < smin) smin = lo_d(a); if (up_d(a) > smax) smax = up_d(a); }
    /* Teff = T + s_max·2√3·h */
    arb_set_si(t, 3); arb_sqrt(t, t, PREC); arb_mul_si(t, t, 2, PREC); arb_mul(t, t, h, PREC); mul_d(t, t, smax, PREC);
    set_ratio(a, (long)Tq[0], (long)Tq[1]); arb_add(t, t, a, PREC); X.Teff = up_d(t);
    arb_clear(h); arb_clear(a); arb_clear(t);
    double cEff; int degree = box_setup(&X, &cEff); Stats S = {0, 0, 0, INFINITY, INFINITY};
    for (int f = 0; f < 8; f++) { Stats R = scan_face(&X, f / 2, f % 2 ? 1 : -1, 8, 12); S.cells += R.cells; S.failed += R.failed; if (R.slackG < S.slackG) S.slackG = R.slackG; if (R.slackD < S.slackD) S.slackD = R.slackD; }
    int ok = degree != 0 && cEff > 0 && S.failed == 0 && smin > 0;
    passed += ok; cells += S.cells; if (S.slackG < worstG) worstG = S.slackG; if (S.slackD < worstD) worstD = S.slackD; if (smin < smallS) smallS = smin;
    if (!ok) printf("  cube %d (q = %.4f, %.4f, %.4f) FAILED: degree %d, cEff %.3g, %ld cells failed, circumradius ≥ %.4f\n", i, Q[i][0], Q[i][1], Q[i][2], degree, cEff, S.failed, smin);
  }
  int ok = passed == m && m > 0;
  printf("Corollary 7.3 (every orientation, T = %g/%g), sample of %d cubes: %s\n  %d passed, %ld cells checked, %.0f s\n  on every cell: |G| − (change) − perturbation ≥ %.3g; degree condition slack %.3g; circumradius ≥ %.4f\n",
         Tq[0], Tq[1], m, ok ? "VALID" : "FAILED", passed, cells, omp_get_wtime() - t0, worstG, worstD, smallS);
  return ok;
}

int main(int argc, char **argv) {
  if (argc > 1 && !strcmp(argv[1], "orientations")) return orientations(argc > 2 ? argv[2] : "data/orientation-sample.json") ? 0 : 1;
  int all = 1;
  { /* Theorem 6: square, T = 15/100, perturbation (1 + √2)T */
    Problem P; square_problem(&P); Box X; X.P = &P; X.n = 2; X.c = 0.5; load_box(&X, "data/certificates.json", 2);
    arb_t T; arb_init(T); set_ratio(T, 15, 100); arb_t s2; arb_init(s2); arb_set_si(s2, 2); arb_sqrt(s2, s2, PREC); arb_add_si(s2, s2, 1, PREC); arb_mul(T, T, s2, PREC);
    X.Teff = up_d(T); arb_clear(T); arb_clear(s2);
    int ok = run("Theorem 6 (square, T = 0.15)", &X, 0, 20000);
    /* non-degeneracy: |A − C| = |γ(t) + γ(t')| on Q's bounding box, in 100 × 100 cells */
    double cs[4][2], c = X.c, a[4] = {-c, c, c, -c}, b[4] = {-c, -c, c, c}, t0 = INFINITY, t1 = -INFINITY, s0 = INFINITY, s1 = -INFINITY;
    for (int i = 0; i < 4; i++) for (int r = 0; r < 2; r++) cs[i][r] = X.z[r] + X.K[r][0] * a[i] + X.K[r][1] * b[i];
    for (int i = 0; i < 4; i++) { t0 = fmin(t0, cs[i][0]); t1 = fmax(t1, cs[i][0]); s0 = fmin(s0, cs[i][1]); s1 = fmax(s1, cs[i][1]); }
    t0 -= 1e-9; t1 += 1e-9; s0 -= 1e-9; s1 += 1e-9;
    double m = INFINITY; arb_t tt, ss, Ax, Ay, Bx, By; arb_init(tt); arb_init(ss); arb_init(Ax); arb_init(Ay); arb_init(Bx); arb_init(By);
    for (int i = 0; i < 100; i++) for (int j = 0; j < 100; j++) {
      set_interval(tt, t0 + (t1 - t0) * i / 100, t0 + (t1 - t0) * (i + 1) / 100); set_interval(ss, s0 + (s1 - s0) * j / 100, s0 + (s1 - s0) * (j + 1) / 100);
      gam(Ax, Ay, &P, tt); gam(Bx, By, &P, ss); arb_add(Ax, Ax, Bx, PREC); arb_add(Ay, Ay, By, PREC); arb_sqr(Ax, Ax, PREC); arb_sqr(Ay, Ay, PREC); arb_add(Ax, Ax, Ay, PREC); arb_sqrt(Ax, Ax, PREC);
      double v = mig_d(Ax); if (v < m) m = v;
    }
    printf("  diagonal ≥ %.4f − 2T = %.4f\n", m, m - 0.3); ok = ok && m - 0.3 > 0; all = all && ok;
  }
  { /* Theorem 7: tetrahedron, T = 13/100, box c = 0.26, adaptive cells */
    Problem P; tetra_problem(&P, NULL); Box X; X.P = &P; X.n = 4; X.c = 0.26; load_box(&X, "data/certificate-tetrahedron.json", 4);
    arb_t T; arb_init(T); set_ratio(T, 13, 100); X.Teff = up_d(T); arb_clear(T);
    int ok = run("Theorem 7 (tetrahedron, T = 0.13, box c = 0.26, adaptive cells)", &X, 1, 0);
    double smin = INFINITY;
    for (int k = 0; k < 16; k++) { arb_t s, t; arb_init(s); arb_init(t); arb_set_d(s, X.z[3]); for (int r = 0; r < 4; r++) { arb_set_d(t, X.K[3][r]); mul_d(t, t, (k >> r) & 1 ? X.c : -X.c, PREC); arb_add(s, s, t, PREC); } if (lo_d(s) < smin) smin = lo_d(s); arb_clear(s); arb_clear(t); }
    printf("  circumradius ≥ %.4f\n", smin); ok = ok && smin > 0; all = all && ok;
  }
  return all ? 0 : 1;
}
