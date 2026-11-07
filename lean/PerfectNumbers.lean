/-
Machine-checked proofs (Lean 4 + Mathlib) of the number-theory results in the README
section "Odd Perfect Numbers":

* `geom_mod_two`, `geom_neg_one`, `geom_one`, `geom_euler`: the local rules for a single
  prime power, `σ(p^a) = 1 + p + ⋯ + p^a`;
* `sigma_pow_dvd`: the factor `σ(p^a)` of each prime power `p^a ∥ N` divides `σ(N)`;
* `three_primes` (result 1): an odd perfect number has at least three distinct primes;
* `spine` (result 5) and `sigma_odd_iff` (result 7);
* `forced_step`, `forced_step_le` (result 9): `gcd(σ(N), 2N)` divides `σ(N) − 2N`;
* `steps_of_six` (result 3);
* `spine_miss` (result 4) and `perfect_mul_prime` (result 6);
* `euler_form` (result 2, Euler's theorem on odd perfect numbers);
* `nine_or_twelve` (result 8): an odd perfect number is divisible by 9, or its special
  prime is `1 mod 12`.

Build: `cd lean && lake build` (see README).
-/
import Mathlib.NumberTheory.ArithmeticFunction.Misc
import Mathlib.Data.Nat.Factorization.Basic
import Mathlib.Tactic.Ring
import Mathlib.Tactic.NormNum
import Mathlib.Tactic.Linarith
import Mathlib.Tactic.LinearCombination

open ArithmeticFunction Finset
open scoped ArithmeticFunction.sigma

namespace PerfectNumbers

/-- `g p a = 1 + p + ⋯ + p^a`, which is `σ(p^a)` for a prime `p`. -/
def g (p a : ℕ) : ℕ := ∑ k ∈ range (a + 1), p ^ k

theorem g_succ (p a : ℕ) : g p (a + 1) = g p a + p ^ (a + 1) := by
  simp [g, sum_range_succ]

theorem sigma_prime_pow {p : ℕ} (hp : p.Prime) (a : ℕ) : σ 1 (p ^ a) = g p a :=
  sigma_one_apply_prime_pow hp

/-! ### Local rules for one prime power -/

/-- For odd `p`, `1 + p + ⋯ + p^a` is a sum of `a + 1` odd numbers. -/
theorem geom_mod_two {p : ℕ} (hp : p % 2 = 1) (a : ℕ) : g p a % 2 = (a + 1) % 2 := by
  induction a with
  | zero => simp [g]
  | succ a ih =>
    have h : p ^ (a + 1) % 2 = 1 := by rw [Nat.pow_mod, hp]; simp
    rw [g_succ, Nat.add_mod, ih, h]; omega

/-- If `p ≡ 1 (mod r)` then `1 + p + ⋯ + p^a ≡ a + 1 (mod r)`. -/
theorem geom_one {p r : ℕ} (hp : p % r = 1) (a : ℕ) : g p a % r = (a + 1) % r := by
  have h1 : 1 % r = 1 := by
    match r, hp with
    | 0, _ => rfl
    | 1, hp => omega
    | r + 2, _ => exact Nat.mod_eq_of_lt (by omega)
  induction a with
  | zero => simp [g, h1]
  | succ a ih =>
    have h : p ^ (a + 1) % r = 1 := by rw [Nat.pow_mod, hp, one_pow, h1]
    rw [g_succ, Nat.add_mod, ih, h, Nat.add_mod (a + 1) 1 r, h1]

/-- For odd exponents the sum pairs up: `1 + p + ⋯ + p^(2m+1) = (1 + p)(1 + p² + ⋯ + p^(2m))`. -/
theorem geom_odd_factor (p m : ℕ) : g p (2 * m + 1) = (1 + p) * ∑ j ∈ range (m + 1), p ^ (2 * j) := by
  induction m with
  | zero => simp [g, sum_range_succ]
  | succ m ih =>
    have : 2 * (m + 1) + 1 = (2 * m + 1) + 1 + 1 := by ring
    rw [this, g_succ, g_succ, ih, sum_range_succ (fun j => p ^ (2 * j)) (m + 1)]
    ring

/-- If `p ≡ −1 (mod r)` and `a` is odd, then `r ∣ 1 + p + ⋯ + p^a`. -/
theorem geom_neg_one {p r a : ℕ} (hp : r ∣ p + 1) (ha : a % 2 = 1) : r ∣ g p a := by
  obtain ⟨m, rfl⟩ : ∃ m, a = 2 * m + 1 := ⟨a / 2, by omega⟩
  rw [geom_odd_factor, add_comm 1 p]
  exact Dvd.dvd.mul_right hp _

/-- Euler's local step: if `p` and `a` are odd and `1 + p + ⋯ + p^a ≡ 2 (mod 4)`, then
`p ≡ a ≡ 1 (mod 4)`. -/
theorem geom_euler {p a : ℕ} (hp : p % 2 = 1) (ha : a % 2 = 1) (h : g p a % 4 = 2) :
    p % 4 = 1 ∧ a % 4 = 1 := by
  have hp4 : p % 4 = 1 := by
    rcases (by omega : p % 4 = 1 ∨ p % 4 = 3) with h1 | h3
    · exact h1
    · exfalso
      have : 4 ∣ g p a := geom_neg_one (by omega) ha
      omega
  refine ⟨hp4, ?_⟩
  have := geom_one hp4 a
  omega

/-! ### Each prime-power factor divides σ(N) -/

/-- For a set `s` of primes of `N`, the product of their factors `σ(p^a)` divides `σ(N)`. -/
theorem prod_sigma_dvd {N : ℕ} (hN : N ≠ 0) {s : Finset ℕ} (hs : s ⊆ N.primeFactors) :
    (∏ p ∈ s, σ 1 (p ^ N.factorization p)) ∣ σ 1 N := by
  rw [isMultiplicative_sigma.multiplicative_factorization (σ 1) hN, Finsupp.prod,
    Nat.support_factorization]
  exact prod_dvd_prod_of_subset _ _ _ hs

theorem sigma_pow_dvd {N p : ℕ} (hN : N ≠ 0) (hp : p ∈ N.primeFactors) :
    σ 1 (p ^ N.factorization p) ∣ σ 1 N := by
  simpa using prod_sigma_dvd hN (s := {p}) (by simpa using hp)

theorem mem_primeFactors_of_odd {N p : ℕ} (_hN : N ≠ 0) (_hp : p.Prime) (h : N.factorization p % 2 = 1) :
    p ∈ N.primeFactors := by
  rw [← Nat.support_factorization, Finsupp.mem_support_iff]; omega

theorem odd_of_dvd_odd {N q : ℕ} (hN : N % 2 = 1) (h : q ∣ N) : q % 2 = 1 := by
  by_contra hc
  have h2 : 2 ∣ N := Nat.dvd_trans (by omega : 2 ∣ q) h
  omega

/-! ### Result 9: forced steps -/

/-- `gcd(σ(N), 2N)` divides the miss `σ(N) − 2N`. -/
theorem forced_step (N : ℕ) : ((Nat.gcd (σ 1 N) (2 * N) : ℕ) : ℤ) ∣ (σ 1 N : ℤ) - 2 * N := by
  have h1 : ((Nat.gcd (σ 1 N) (2 * N) : ℕ) : ℤ) ∣ (σ 1 N : ℤ) := Int.natCast_dvd_natCast.2 (Nat.gcd_dvd_left _ _)
  have h2 : ((Nat.gcd (σ 1 N) (2 * N) : ℕ) : ℤ) ∣ ((2 * N : ℕ) : ℤ) := Int.natCast_dvd_natCast.2 (Nat.gcd_dvd_right _ _)
  push_cast at h2
  exact dvd_sub h1 h2

/-- So a miss is either zero or at least `gcd(σ(N), 2N)` in size. -/
theorem forced_step_le (N : ℕ) (h : σ 1 N ≠ 2 * N) :
    Nat.gcd (σ 1 N) (2 * N) ≤ ((σ 1 N : ℤ) - 2 * N).natAbs := by
  have hd := Int.natAbs_dvd_natAbs.2 (forced_step N)
  simp only [Int.natAbs_natCast] at hd
  exact Nat.le_of_dvd (by omega) hd

/-! ### Result 3: steps of 6 -/

/-- If `N` is odd, divisible by 3, has some prime to an odd power, and has a prime
`p ≡ 2 (mod 3)` to an odd power, then `6 ∣ σ(N) − 2N`. -/
theorem steps_of_six {N q p : ℕ} (hN : N % 2 = 1) (h3 : 3 ∣ N)
    (hq : q.Prime) (hqodd : N.factorization q % 2 = 1)
    (hp : p.Prime) (hp3 : p % 3 = 2) (hpodd : N.factorization p % 2 = 1) :
    (6 : ℤ) ∣ (σ 1 N : ℤ) - 2 * N := by
  have hN0 : N ≠ 0 := by omega
  -- 2 ∣ σ(N), from q
  have hqN : q ∈ N.primeFactors := mem_primeFactors_of_odd hN0 hq hqodd
  have hq2 : q % 2 = 1 := odd_of_dvd_odd hN (Nat.dvd_of_mem_primeFactors hqN)
  have h2 : 2 ∣ σ 1 N := by
    refine Nat.dvd_trans ?_ (sigma_pow_dvd hN0 hqN)
    rw [sigma_prime_pow hq]; have := geom_mod_two hq2 (N.factorization q); omega
  -- 3 ∣ σ(N), from p
  have h3s : 3 ∣ σ 1 N := by
    refine Nat.dvd_trans ?_ (sigma_pow_dvd hN0 (mem_primeFactors_of_odd hN0 hp hpodd))
    rw [sigma_prime_pow hp]; exact geom_neg_one (by omega) hpodd
  have a : (2 : ℤ) ∣ σ 1 N := Int.natCast_dvd_natCast.2 h2
  have b : (3 : ℤ) ∣ σ 1 N := Int.natCast_dvd_natCast.2 h3s
  have c : (3 : ℤ) ∣ N := Int.natCast_dvd_natCast.2 h3
  omega

/-! ### Results 4 and 6: even numbers -/

theorem g_two (k : ℕ) : g 2 k + 1 = 2 ^ (k + 1) := by
  induction k with
  | zero => simp [g]
  | succ k ih => rw [g_succ, pow_succ 2 (k + 1)]; omega

/-- Result 4 (spine minus partner): for an odd prime `p`, the miss of `2^k·p` is
`(1 + 2 + ⋯ + 2^k) − p`. -/
theorem spine_miss (k : ℕ) {p : ℕ} (hp : p.Prime) (hp2 : p ≠ 2) :
    (σ 1 (2 ^ k * p) : ℤ) - 2 * (2 ^ k * p : ℕ) = (g 2 k : ℤ) - p := by
  have hcop : Nat.gcd (2 ^ k) p = 1 :=
    Nat.Coprime.pow_left k ((Nat.coprime_primes Nat.prime_two hp).2 (Ne.symm hp2))
  rw [isMultiplicative_sigma.map_mul_of_coprime hcop, sigma_prime_pow Nat.prime_two,
    show σ 1 p = p + 1 by simpa [g] using sigma_prime_pow hp 1]
  have := g_two k
  push_cast
  have h : (2 : ℤ) ^ (k + 1) = g 2 k + 1 := by exact_mod_cast this.symm
  rw [pow_succ] at h
  linear_combination (-(p : ℤ)) * h

/-- Result 6 (perfect times a prime): if `σ(P) = 2P` and `p` is a prime not dividing `P`,
then `P·p` misses by exactly `2P`. -/
theorem perfect_mul_prime {P p : ℕ} (hP : σ 1 P = 2 * P) (hp : p.Prime) (hpP : ¬ p ∣ P) :
    (σ 1 (P * p) : ℤ) - 2 * (P * p : ℕ) = 2 * P := by
  have hcop : Nat.gcd P p = 1 := Nat.Coprime.symm ((Nat.Prime.coprime_iff_not_dvd hp).2 hpP)
  rw [isMultiplicative_sigma.map_mul_of_coprime hcop, hP,
    show σ 1 p = p + 1 by simpa [g] using sigma_prime_pow hp 1]
  push_cast; ring

/-! ### Result 2: Euler's form of an odd perfect number -/

/-- Euler: an odd perfect number has exactly one prime `p` to an odd power, and
`p ≡ a ≡ 1 (mod 4)` for that power `a`; every other prime appears to an even power. -/
theorem euler_form {N : ℕ} (hN : N % 2 = 1) (hperf : σ 1 N = 2 * N) :
    ∃ p, p.Prime ∧ N.factorization p % 2 = 1 ∧ p % 4 = 1 ∧ N.factorization p % 4 = 1 ∧
      ∀ q, q.Prime → q ≠ p → N.factorization q % 2 = 0 := by
  have hN0 : N ≠ 0 := by omega
  -- each factor σ(q^e) is odd exactly when e is even
  have fact_mod (q : ℕ) (hq : q ∈ N.primeFactors) :
      σ 1 (q ^ N.factorization q) % 2 = (N.factorization q + 1) % 2 := by
    rw [sigma_prime_pow (Nat.prime_of_mem_primeFactors hq)]
    exact geom_mod_two (odd_of_dvd_odd hN (Nat.dvd_of_mem_primeFactors hq)) _
  -- some prime has an odd exponent: otherwise σ(N) is a product of odd numbers
  have hexists : ∃ p ∈ N.primeFactors, N.factorization p % 2 = 1 := by
    by_contra hall; push Not at hall
    have hodd : σ 1 N % 2 = 1 := by
      rw [isMultiplicative_sigma.multiplicative_factorization (σ 1) hN0, Finsupp.prod,
        Nat.support_factorization]
      refine Finset.prod_induction _ (fun x => x % 2 = 1) (fun a b ha hb => by simp [Nat.mul_mod, ha, hb]) (by simp) ?_
      intro q hq; rw [fact_mod q hq]; have := hall q hq; omega
    omega
  obtain ⟨p, hpN, hpodd⟩ := hexists
  have hp : p.Prime := Nat.prime_of_mem_primeFactors hpN
  -- no second prime has an odd exponent: two even factors would give 4 ∣ σ(N) = 2N
  have huniq : ∀ q, q.Prime → q ≠ p → N.factorization q % 2 = 0 := by
    intro q hq hqp
    by_contra hqodd
    have hqN : q ∈ N.primeFactors := mem_primeFactors_of_odd hN0 hq (by omega)
    have hsub : ({p, q} : Finset ℕ) ⊆ N.primeFactors := by
      intro x hx; simp at hx; rcases hx with rfl | rfl <;> assumption
    have hdvd := prod_sigma_dvd hN0 hsub
    rw [Finset.prod_pair (Ne.symm hqp)] at hdvd
    have e1 := fact_mod p hpN; have e2 := fact_mod q hqN
    have h4 : 4 ∣ σ 1 (p ^ N.factorization p) * σ 1 (q ^ N.factorization q) := by
      obtain ⟨a, ha⟩ : 2 ∣ σ 1 (p ^ N.factorization p) := by omega
      obtain ⟨b, hb⟩ : 2 ∣ σ 1 (q ^ N.factorization q) := by omega
      rw [ha, hb]; exact ⟨a * b, by ring⟩
    have := Nat.dvd_trans h4 hdvd
    rw [hperf] at this; omega
  -- the special factor σ(p^a) divides 2N with N odd, so it is 2 mod 4
  have hfac := sigma_pow_dvd hN0 hpN
  rw [hperf] at hfac
  have e := fact_mod p hpN
  have h2mod4 : σ 1 (p ^ N.factorization p) % 4 = 2 := by
    obtain ⟨c, hc⟩ := hfac
    have hc' : 2 * N = σ 1 (p ^ N.factorization p) * c := hc
    rcases (by omega : σ 1 (p ^ N.factorization p) % 4 = 0 ∨ σ 1 (p ^ N.factorization p) % 4 = 2) with h0 | h2
    · exfalso
      obtain ⟨d, hd⟩ : 4 ∣ σ 1 (p ^ N.factorization p) := Nat.dvd_of_mod_eq_zero h0
      have h4 : 2 * N = 4 * (d * c) := by rw [hc', hd]; ring
      omega
    · exact h2
  rw [sigma_prime_pow hp] at h2mod4
  obtain ⟨h1, h2⟩ := geom_euler (odd_of_dvd_odd hN (Nat.dvd_of_mem_primeFactors hpN)) hpodd h2mod4
  exact ⟨p, hp, hpodd, h1, h2, huniq⟩

/-! ### Result 8: divisible by 9, or the special prime is 1 mod 12 -/

theorem nine_or_twelve {N : ℕ} (hN : N % 2 = 1) (hperf : σ 1 N = 2 * N) :
    9 ∣ N ∨ ∃ p, p.Prime ∧ N.factorization p % 2 = 1 ∧ p % 12 = 1 := by
  have hN0 : N ≠ 0 := by omega
  obtain ⟨p, hp, hpodd, hp4, _, huniq⟩ := euler_form hN hperf
  by_cases h3 : 3 ∣ N
  · -- 3 is not the special prime (3 % 4 = 3), so its exponent is even and positive
    left
    have hne : 3 ≠ p := by intro h; subst h; omega
    have heven := huniq 3 Nat.prime_three hne
    have hpos : 0 < N.factorization 3 := Nat.Prime.factorization_pos_of_dvd Nat.prime_three hN0 h3
    have h2 : 2 ≤ N.factorization 3 := by omega
    have := (Nat.Prime.pow_dvd_iff_le_factorization Nat.prime_three hN0).2 h2
    simpa using this
  · -- if p ≡ 2 (mod 3), then 3 ∣ σ(p^a) ∣ σ(N) = 2N, so 3 ∣ N: impossible
    right
    refine ⟨p, hp, hpodd, ?_⟩
    have hp3 : p % 3 ≠ 2 := by
      intro hp3
      have hpN := mem_primeFactors_of_odd hN0 hp hpodd
      have hs : 3 ∣ σ 1 (p ^ N.factorization p) := by
        rw [sigma_prime_pow hp]; exact geom_neg_one (by omega) hpodd
      have h := Nat.dvd_trans hs (sigma_pow_dvd hN0 hpN)
      rw [hperf] at h; omega
    have hp0 : p % 3 ≠ 0 := by
      intro h0
      have : 3 ∣ p := Nat.dvd_of_mod_eq_zero h0
      have := (Nat.prime_dvd_prime_iff_eq Nat.prime_three hp).1 this; omega
    omega

/-! ### Result 5: the spine on its own -/

/-- `σ(2^k) = 2^(k+1) − 1`, so every power of two misses being perfect by exactly `−1`. -/
theorem spine (k : ℕ) : σ 1 (2 ^ k) + 1 = 2 ^ (k + 1) := by
  rw [sigma_prime_pow Nat.prime_two]; exact g_two k

/-! ### Result 7: when σ(N) is odd -/

/-- The factor `σ(q^e)` of a prime power is odd exactly when `q = 2` or `e` is even. -/
theorem sigma_pow_mod_two {q : ℕ} (hq : q.Prime) (e : ℕ) :
    σ 1 (q ^ e) % 2 = if q = 2 then 1 else (e + 1) % 2 := by
  rw [sigma_prime_pow hq]
  split_ifs with h2
  · subst h2
    have h := g_two e
    have : 2 ^ (e + 1) % 2 = 0 := by rw [pow_succ]; simp
    omega
  · exact geom_mod_two (hq.eq_two_or_odd.resolve_left h2) e

/-- `σ(N)` is odd exactly when every odd prime divides `N` to an even power, that is, when
`N` is a square or twice a square. -/
theorem sigma_odd_iff {N : ℕ} (hN : N ≠ 0) :
    σ 1 N % 2 = 1 ↔ ∀ p, p.Prime → p ≠ 2 → N.factorization p % 2 = 0 := by
  constructor
  · intro hodd p hp hp2
    by_contra hpodd
    have hpN := mem_primeFactors_of_odd hN hp (by omega)
    have heven : 2 ∣ σ 1 (p ^ N.factorization p) := by
      have := sigma_pow_mod_two hp (N.factorization p); simp only [hp2, ↓reduceIte] at this; omega
    have := Nat.dvd_trans heven (sigma_pow_dvd hN hpN)
    omega
  · intro hall
    rw [isMultiplicative_sigma.multiplicative_factorization (σ 1) hN, Finsupp.prod,
      Nat.support_factorization]
    refine Finset.prod_induction _ (fun x => x % 2 = 1) (fun a b ha hb => by simp [Nat.mul_mod, ha, hb]) (by simp) ?_
    intro q hq
    have hqp := Nat.prime_of_mem_primeFactors hq
    rw [sigma_pow_mod_two hqp]
    split_ifs with h2
    · rfl
    · have := hall q hqp h2; omega

/-! ### Result 1: at least three distinct prime factors -/

/-- `(p − 1)(1 + p + ⋯ + p^a) = p^(a+1) − 1`. -/
theorem g_mul_pred {p : ℕ} (hp : 1 ≤ p) (a : ℕ) : g p a * (p - 1) + 1 = p ^ (a + 1) := by
  induction a with
  | zero => simp [g]; omega
  | succ a ih =>
    rw [g_succ, add_mul, pow_succ p (a + 1)]
    obtain ⟨r, rfl⟩ : ∃ r, p = r + 1 := ⟨p - 1, by omega⟩
    simp only [Nat.add_sub_cancel] at ih ⊢
    rw [← ih]; ring

/-- `σ(N)·∏(p − 1) ≤ N·∏p` over the primes of `N`. -/
theorem sigma_mul_prod_le {N : ℕ} (hN : N ≠ 0) :
    σ 1 N * ∏ p ∈ N.primeFactors, (p - 1) ≤ N * ∏ p ∈ N.primeFactors, p := by
  have hNe := Nat.prod_primeFactors_pow_factorization hN
  calc σ 1 N * ∏ p ∈ N.primeFactors, (p - 1)
      = ∏ p ∈ N.primeFactors, σ 1 (p ^ N.factorization p) * (p - 1) := by
        rw [isMultiplicative_sigma.multiplicative_factorization (σ 1) hN, Finsupp.prod,
          Nat.support_factorization, prod_mul_distrib]
    _ ≤ ∏ p ∈ N.primeFactors, p ^ N.factorization p * p := by
        refine Finset.prod_le_prod fun p hp => ?_
        have hpp := Nat.prime_of_mem_primeFactors hp
        rw [sigma_prime_pow hpp]
        have := g_mul_pred hpp.one_lt.le (N.factorization p)
        rw [pow_succ] at this; omega
    _ = N * ∏ p ∈ N.primeFactors, p := by rw [prod_mul_distrib, ← hNe]

/-- An odd perfect number has at least three distinct prime factors. -/
theorem three_primes {N : ℕ} (hN : N % 2 = 1) (hperf : σ 1 N = 2 * N) :
    3 ≤ N.primeFactors.card := by
  have hN0 : N ≠ 0 := by omega
  have hb := sigma_mul_prod_le hN0
  rw [hperf] at hb
  -- every prime factor is odd, so at least 3
  have h3 : ∀ p ∈ N.primeFactors, 3 ≤ p := fun p hp => by
    have := odd_of_dvd_odd hN (Nat.dvd_of_mem_primeFactors hp)
    have := (Nat.prime_of_mem_primeFactors hp).two_le; omega
  have hNpos : 0 < N := by omega
  by_contra hlt
  rcases (by omega : N.primeFactors.card = 0 ∨ N.primeFactors.card = 1 ∨ N.primeFactors.card = 2)
    with h0 | h1 | h2
  · -- no prime factors: N = 1, but σ(1) = 1 ≠ 2
    rw [Finset.card_eq_zero, Nat.primeFactors_eq_empty] at h0
    rcases h0 with rfl | rfl
    · omega
    · simp at hperf
  · obtain ⟨p, hp⟩ := Finset.card_eq_one.1 h1
    have hp3 := h3 p (by simp [hp])
    rw [hp, prod_singleton, prod_singleton] at hb
    have : 2 * (p - 1) ≤ p := Nat.le_of_mul_le_mul_left (by nlinarith) hNpos
    omega
  · obtain ⟨p, q, hpq, hs⟩ := Finset.card_eq_two.1 h2
    have hp3 := h3 p (by simp [hs]); have hq3 := h3 q (by simp [hs])
    have hpo := odd_of_dvd_odd hN (Nat.dvd_of_mem_primeFactors (by simp [hs] : p ∈ N.primeFactors))
    have hqo := odd_of_dvd_odd hN (Nat.dvd_of_mem_primeFactors (by simp [hs] : q ∈ N.primeFactors))
    rw [hs, prod_pair hpq, prod_pair hpq] at hb
    have hle : 2 * ((p - 1) * (q - 1)) ≤ p * q :=
      Nat.le_of_mul_le_mul_left (by nlinarith) hNpos
    -- write p = a + 3, q = b + 3 with a ≠ b both even, so a + b ≥ 2
    obtain ⟨a, rfl⟩ : ∃ a, p = a + 3 := ⟨p - 3, by omega⟩
    obtain ⟨b, rfl⟩ : ∃ b, q = b + 3 := ⟨q - 3, by omega⟩
    have hab : 2 ≤ a + b := by omega
    simp only [show a + 3 - 1 = a + 2 by omega, show b + 3 - 1 = b + 2 by omega] at hle
    nlinarith [Nat.zero_le (a * b)]

end PerfectNumbers

-- Each main theorem uses only Lean's three standard axioms
-- (propext, Classical.choice, Quot.sound), and no `sorry`.
#print axioms PerfectNumbers.forced_step_le
#print axioms PerfectNumbers.steps_of_six
#print axioms PerfectNumbers.spine_miss
#print axioms PerfectNumbers.perfect_mul_prime
#print axioms PerfectNumbers.euler_form
#print axioms PerfectNumbers.nine_or_twelve
#print axioms PerfectNumbers.spine
#print axioms PerfectNumbers.sigma_odd_iff
#print axioms PerfectNumbers.three_primes
