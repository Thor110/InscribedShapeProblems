#!/usr/bin/env python3
"""Independent check of the certificates for PROOFS.md, Theorems 6 and 7.

This re-implements the checks of pages/certify-rigorous.js from scratch in Python,
using the interval arithmetic of mpmath (mpmath.iv, outward rounding at 53 bits)
instead of the JavaScript code in pages/interval.js. Nothing is shared with the
JavaScript except the box definitions z, J, K read from data/certificates.json and
data/certificate-tetrahedron.json. Those are only data: the proof is valid for any z,
J, K, and their accuracy affects only the margin.

    pip install mpmath
    python3 tools/verify_certificates.py            # square (T = 0.15) and tetrahedron (T = 0.06)
    python3 tools/verify_certificates.py square     # one of them

The square check is the full Theorem 6 (80,000 boundary samples, a few minutes).
Python is too slow for Theorem 7's 64 million samples, so the tetrahedron is checked
on a smaller box with a coarser grid, which proves the theorem with T = 0.06 (the
JavaScript proves T = 0.12 with the finer grid).
"""
import json, math, os, sys, time
from multiprocessing import Pool
from mpmath import iv, mpf

iv.prec = 53
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
I = lambda a, b=None: iv.mpf([a, a if b is None else b])
lo = lambda x: float(x.a)
hi = lambda x: float(x.b)
def mag(x): return max(abs(lo(x)), abs(hi(x)))
def mig(x): return lo(x) if lo(x) > 0 else (-hi(x) if hi(x) < 0 else 0.0)

# ---- signed distance to an ellipse / ellipsoid, enclosed ----
# Closest point q_i = a_i² p_i / (t + a_i²), t the unique root above −min a_i² of the
# decreasing F(t) = Σ (a_i p_i / (t + a_i²))² − 1; distance |t|·√Σ (p_i/(t + a_i²))².
def make_sd(axes):
    A = [iv.mpf(a) for a in axes]                      # intervals containing the exact semi-axes
    A2 = [a * a for a in A]
    af = [float(mpf(a.mid)) for a in A]; a2f = [x * x for x in af]; amin2 = min(a2f); k = a2f.index(amin2)
    def F(p, t):
        s = I(-1)
        for i in range(len(p)): s += (A[i] * p[i] / (t + A2[i])) ** 2
        return s
    def sd(p):
        Ff = lambda t: sum((af[i] * p[i] / (t + a2f[i])) ** 2 for i in range(len(p))) - 1
        t = 0.0 if Ff(0.0) > 0 else -amin2 + af[k] * abs(p[k])
        for _ in range(100):                           # Newton, monotone from the left
            Fv = -1.0; dF = 0.0
            for i in range(len(p)):
                u = t + a2f[i]; r = af[i] * p[i] / u; Fv += r * r; dF -= 2 * r * r / u
            if not dF < 0: break
            step = Fv / dF; t -= step
            if abs(step) <= 1e-16 * (1 + abs(t)): break
        d = 1e-13 * (1 + abs(t))
        while d < 1e-3:
            tl, th = t - d, t + d
            if tl > -amin2 * (1 - 1e-12):
                try:
                    if lo(F(p, I(tl))) > 0 and hi(F(p, I(th))) < 0:
                        T = I(tl, th); s = I(0)
                        for i in range(len(p)): s += (I(p[i]) / (T + A2[i])) ** 2
                        dist = I(mig(T), mag(T)) * iv.sqrt(s)
                        if tl > 0: return dist
                        if th < 0: return -dist
                        return I(-hi(dist), hi(dist))
                except ZeroDivisionError:
                    pass
            d *= 16
        raise ValueError('signed distance not verified at %r' % (p,))
    return sd

def sd_box(sd, B):
    """sd over an interval box: at the box centre, widened by the distance to the box."""
    q = [float(mpf(b.mid)) for b in B]
    r2 = I(0)
    for i, b in enumerate(B): r2 += I(max(q[i] - lo(b), hi(b) - q[i])) ** 2
    r = hi(iv.sqrt(r2)); e = sd(q)
    return I(lo(e - I(r)), hi(e + I(r)))

# ---- the two problems ----
def square_problem():
    b = iv.mpf(3) / 5; sd = make_sd([iv.mpf(1), b]); one = I(1); two = I(2); half = I(0.5)
    def gam(t):
        t2 = t * t; den = one + t2
        return [(one - t2) / den, two * b * t / den]
    def G(p):
        A = gam(I(p[0])); C = [-x for x in gam(I(p[1]))]
        mx, my = (A[0] + C[0]) * half, (A[1] + C[1]) * half
        hx, hy = (C[0] - A[0]) * half, (C[1] - A[1]) * half
        return [sd_box(sd, [mx - hy, my + hx]), sd_box(sd, [mx + hy, my - hx])]
    lip = hi(two * iv.sqrt(two))                       # |γ'| ≤ 2, |ΔB| ≤ (|ΔA| + |ΔC|)/√2
    return dict(n=2, G=G, gam=gam, lip=lip)

def tetra_dirs():
    q = [I(0.125), I(0.25), I(0.375)]; one = I(1); two = I(2)
    qq = q[0] ** 2 + q[1] ** 2 + q[2] ** 2; den = one + qq; d0 = one - qq; z = I(0)
    X = [[z, -q[2], q[1]], [q[2], z, -q[0]], [-q[1], q[0], z]]
    R = [[((d0 if i == j else z) + two * q[i] * q[j] + two * X[i][j]) / den for j in range(3)] for i in range(3)]
    s3 = iv.sqrt(I(3))
    return [[sum((R[i][k] * v[k] for k in range(3)), I(0)) / s3 for i in range(3)] for v in ([1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1])]

def tetra_problem():
    sd = make_sd([iv.mpf(1), iv.mpf(4) / 5, iv.mpf(3) / 5]); W = tetra_dirs()
    def G(p):
        return [sd_box(sd, [I(p[i]) + I(p[3]) * w[i] for i in range(3)]) for w in W]
    wmax = max(hi(iv.sqrt(w[0] ** 2 + w[1] ** 2 + w[2] ** 2)) for w in W)
    lip = hi(iv.sqrt(I(3)) + I(wmax))                  # |Δ(x + s w)| ≤ (√3 + |w|) ‖Δp‖∞
    return dict(n=4, G=G, lip=lip)

PROBLEMS = {'square': square_problem, 'tetra': tetra_problem}

# ---- the check on one face of the cube [−c, c]^n ----
def scan_face(args):
    name, z, J, K, c, N, fixed, sign = args
    P = PROBLEMS[name](); n = P['n']
    ys = [(-c + 2 * c * i / (N - 1)) if i < N - 1 else c for i in range(N)]
    minG = math.inf; degm = math.inf; maxH = 0.0; flerr = 0.0; count = 0
    idx = [0] * (n - 1)
    while True:
        y = []; f = 0
        for d in range(n):
            if d == fixed: y.append(sign * c)
            else: y.append(ys[idx[f]]); f += 1
        ps = [z[r] + sum(K[r][k] * y[k] for k in range(n)) for r in range(n)]       # float sample point
        for r in range(n):                             # distance from the exact z + K y to it
            ex = I(z[r]) + sum((I(K[r][k]) * I(y[k]) for k in range(n)), I(0))
            flerr = max(flerr, max(hi(ex) - ps[r], ps[r] - lo(ex)))
        g = P['G'](ps); h = 0.0; gl = 0.0
        for r in range(n):
            L = sum((I(J[r][k]) * (I(ps[k]) - I(z[k])) for k in range(n)), I(0))
            h = max(h, mag(g[r] - L)); gl = max(gl, mig(g[r]))
        maxH = max(maxH, h); minG = min(minG, gl); degm = min(degm, gl - h); count += 1
        k = 0
        while k < n - 1:
            idx[k] += 1
            if idx[k] < N: break
            idx[k] = 0; k += 1
        if k == n - 1: break
    return dict(minG=minG, degm=degm, maxH=maxH, flerr=flerr, count=count)

def norm_inf(M): return max(sum(mag(x) for x in row) for row in M)

def det(M):
    n = len(M)
    if n == 1: return M[0][0]
    s = I(0)
    for c in range(n):
        minor = [row[:c] + row[c + 1:] for row in M[1:]]
        t = M[0][c] * det(minor); s = s - t if c % 2 else s + t
    return s

def certify(name, z, J, K, c, N, Teff):
    n = len(z); Ji = [[I(x) for x in row] for row in J]; Ki = [[I(x) for x in row] for row in K]
    JK = [[sum((Ji[i][k] * Ki[k][j] for k in range(n)), I(0)) for j in range(n)] for i in range(n)]
    e = norm_inf([[JK[i][j] - I(1 if i == j else 0) for j in range(n)] for i in range(n)])
    cEff = lo(I(c) * (I(1) - I(e))); dJ = det(Ji); degree = 1 if lo(dJ) > 0 else -1 if hi(dJ) < 0 else 0
    ys = [(-c + 2 * c * i / (N - 1)) if i < N - 1 else c for i in range(N)]
    hmax = max(hi(I(ys[i]) - I(ys[i - 1])) for i in range(1, N))
    faces = [(name, z, J, K, c, N, f, s) for f in range(n) for s in (-1, 1)]
    t0 = time.time()
    with Pool(min(len(faces), os.cpu_count() or 1)) as pool: res = pool.map(scan_face, faces)
    minG = min(r['minG'] for r in res); degm = min(r['degm'] for r in res); flerr = max(r['flerr'] for r in res)
    lip = PROBLEMS[name]()['lip']; nJ = norm_inf(Ji); nK = norm_inf(Ki)
    rp = hi(I(nK) * I(hmax) / 2 + I(flerr))            # every point of ∂Q is this close to a sample
    gmove = hi(I(lip) * I(rp)); hmove = hi((I(lip) + I(nJ)) * I(rp))
    minGb = lo(I(minG) - I(gmove)); degree_holds = cEff > 0 and lo(I(degm) - I(gmove) - I(hmove)) > 0
    ok = degree != 0 and degree_holds and Teff < minGb
    return dict(ok=ok, degree=degree, cEff=cEff, minG=minG, minGBoundary=minGb, degMargin=degm, needed=gmove + hmove,
                Teff=Teff, samples=sum(r['count'] for r in res), seconds=time.time() - t0)

def report(title, r):
    print(f"{title}: {'VALID' if r['ok'] else 'FAILED'}")
    print(f"  degree {r['degree']}, {r['samples']:,} boundary samples, {r['seconds']:.0f} s")
    print(f"  min |G| on the box edge {r['minG']:.4f} → {r['minGBoundary']:.4f} after the change between samples; perturbation {r['Teff']:.4f}")
    print(f"  |G| − |G − L| ≥ {r['degMargin']:.4f} > {r['needed']:.4f} needed: degree fixed")

def main():
    which = sys.argv[1:] or ['square', 'tetra']; all_ok = True
    if 'square' in which:
        d = json.load(open(os.path.join(ROOT, 'data', 'certificates.json')))['certificate']
        T = 0.15; Teff = hi((1 + iv.sqrt(I(2))) * (iv.mpf(15) / 100))
        r = certify('square', d['zero'], d['J'], d['K'], 0.5, 20000, Teff)
        # non-degeneracy: |A − C| = |γ(t) + γ(t')| on Q's bounding box, in cells
        P = square_problem(); c = 0.5; z, K = d['zero'], d['K']
        cs = [[z[i] + K[i][0] * a + K[i][1] * b for i in range(2)] for a, b in ((-c, -c), (c, -c), (c, c), (-c, c))]
        t0, t1 = min(p[0] for p in cs) - 1e-9, max(p[0] for p in cs) + 1e-9; s0, s1 = min(p[1] for p in cs) - 1e-9, max(p[1] for p in cs) + 1e-9
        m = math.inf; M = 100
        for i in range(M):
            for j in range(M):
                A = P['gam'](I(t0 + (t1 - t0) * i / M, t0 + (t1 - t0) * (i + 1) / M)); B = P['gam'](I(s0 + (s1 - s0) * j / M, s0 + (s1 - s0) * (j + 1) / M))
                m = min(m, mig(iv.sqrt((A[0] + B[0]) ** 2 + (A[1] + B[1]) ** 2)))
        r['ok'] = r['ok'] and m - 2 * T > 0
        report(f'Theorem 6 (square, T = {T})', r); print(f'  diagonal ≥ {m:.4f} − 2T = {m - 2 * T:.4f}')
        all_ok &= r['ok']
    if 'tetra' in which:
        d = json.load(open(os.path.join(ROOT, 'data', 'certificate-tetrahedron.json')))['certificate']
        T = 0.06; c = 0.14; N = 50
        r = certify('tetra', d['zero'], d['J'], d['K'], c, N, hi(iv.mpf(6) / 100))
        smin = min(lo(I(d['zero'][3]) + sum((I(d['K'][3][k]) * I(c if (m >> k) & 1 else -c) for k in range(4)), I(0))) for m in range(16))
        r['ok'] = r['ok'] and smin > 0
        report(f'Theorem 7 (tetrahedron, T = {T}, box c = {c}, {N}³ grid per face)', r); print(f'  circumradius ≥ {smin:.4f}')
        all_ok &= r['ok']
    sys.exit(0 if all_ok else 1)

if __name__ == '__main__':
    main()
