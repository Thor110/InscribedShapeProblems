# Outreach drafts

Drafts only. Nothing here has been sent, and nothing should be sent until you have read it, changed what you want, and decided to. Each draft is short on purpose: one question, what is claimed, what is not, and how to check it. [REVIEW.md](REVIEW.md) has the background (who works on what, and what each kind of result needs checking with).

**Before using any of these:**
- **Write the MathOverflow question in your own words.** MathOverflow does not allow AI-generated posts, and these drafts were written with an AI assistant. Use the draft as notes on *what* to ask, then write the post yourself. Emails are not covered by that rule, but they also read better in your own voice.
- Rebuild the preprint (`node tools/build-paper.js`) and run the certificates, so every number quoted matches the repository.
- Send one thing at a time and wait. A single reply, or none, tells you more than five messages sent at once.

---

## 1. MathOverflow: not needed

An earlier draft asked whether an explicit smooth, strictly convex surface with no inscribed cube was known. Having read the sources, the answer is effectively "yes, in substance": Bielecki (1954) gave an explicit (non-smooth) convex body with no inscribed cube, and the Hausel–Makai–Szűcs argument (generic cubic surfaces near the sphere) gives smooth, strictly convex ones in a few lines. The egg of Theorem 1.3 is a certified instance of that, not a new fact, so there is nothing to ask. The write-up now says so.

If you ever do want a literature question answered, the one remaining candidate is whether the general counting statement (Theorem 1, for any polytope) is written down in full anywhere. It is a minor point and not worth a post on its own.

---

## 2. Email to Gregory R. Chambers (certificates near an ellipse)

**Why him.** His 2022 paper proves inscribed squares for curves close to smooth curves, and the square certificate (Theorem 6) is a quantitative result of the same kind. The repository already compares the two: for the ellipse $x^2 + y^2/0.36 = 1$, the certified allowance is about 4.2 times the one his theorem gives with the ellipse itself as the reference curve (PROOFS.md, after Theorem 6). That comparison is specific and checkable, and it is the reason to write to him rather than anyone else.

**Find his current address on his university page.** Do not use an address from an old paper.

> **Subject:** A computer-assisted inscribed-square certificate near an ellipse, and how it compares with your 2022 theorem
>
> Dear Professor Chambers,
>
> I have been working on inscribed-shape problems as an independent researcher, and one result is close to your paper "On the square peg problem". I do not claim to solve the square peg problem.
>
> The result: every closed curve $r(\theta)$ with $|r(\theta) - r_E(\theta)| \le 0.15$, where $r_E$ is the radial function of the ellipse $x^2 + y^2/0.36 = 1$, has an inscribed square. This includes curves that are nowhere differentiable and nowhere locally monotone. The proof is a degree argument on a box around the ellipse's square, with all estimates checked in interval arithmetic. Three independent programs (JavaScript, Python/mpmath, C/Arb) confirm it, and it runs in under a second.
>
> If I have read your theorem correctly, with the ellipse itself as the reference curve it allows a perturbation of about 0.036 (one tenth of the reciprocal of the maximum curvature), so the certificate covers about four times as much. What I could not rule out is that some other smooth reference curve, of smaller curvature, would bring every curve in this neighbourhood within your bound. My question is whether that can happen here, or whether certificates of this kind are already known.
>
> The write-up is two pages (Theorem 6 in [link to PROOFS.md]), and the full preprint is at [link to PAPER.pdf]. The same method gives inscribed regular tetrahedra near an ellipsoid, for surfaces that are only continuous.
>
> With thanks for your time,
> Edward James Gordon

**Before sending:** check the 0.036 figure and the 4.2 ratio against PROOFS.md (the paragraph after Theorem 6), and re-read the statement of his main theorem in arXiv:2203.02613 so the "one tenth of the reciprocal of the curvature" description matches it exactly. If unsure, say so in the email ("if I have read your theorem correctly" is already there for that reason).

---

## 3. Prepared replies

Short answers to the replies most likely to come back, written now so they need no thought on the day. In each case, agree with anything that is right, correct anything that is misread, and stop there.

**"So you think you have solved the square peg problem / the tetrahedron problem?"**
> No. The open problems are about every continuous curve or surface, and they remain open. The certificates prove the result for every curve within a fixed distance of one ellipse (and every surface near one ellipsoid). That neighbourhood contains very rough curves, which is the new part, but it is one neighbourhood, not all curves.

**"Theorem 1 is trivial / folklore."**
> Agreed, the proof is a dimension count. I am asking because I would like to cite it rather than reprove it. Do you know where it is written down?

**"Who ever conjectured that every surface has an inscribed cube?" or "Bielecki already showed this in 1954."**
> Agreed on both. The answer was known to be negative: Bielecki gave a convex body with no inscribed cube, and the write-up cites him and describes his example. The egg adds no new fact: it is a smooth example of the same thing, certified by computer, which the Hausel–Makai–Szűcs argument already implies. It is posed as a natural analogue of the square and tetrahedron problems rather than as a conjecture. The only thing I think may be new is an explicit smooth, strictly convex example with a checkable proof, and I would like to know if that is known too.

**"Computer proofs are not proofs" or "floating point can't prove anything."**
> Every estimate uses outward-rounded interval arithmetic, so each computed bound provably contains the true value. Three independent implementations agree, one of them using the Arb library, which is designed for exactly this. The mathematical part (the degree lemma) is a short pen-and-paper proof. Which part would you like me to explain in more detail?

**"This is a special case of Gromov's theorem."**
> Gromov's theorem needs a $C^1$ surface. The certificate covers every continuous surface within 0.13 of the ellipsoid, including nowhere-differentiable ones, which his theorem does not reach. In the other direction it is much weaker: it covers one neighbourhood, not all smooth surfaces.

**"Isn't this already covered by [some paper]?"**
> Thank you, I had not seen it. I will read it and update the write-up, with credit. (Then do so, and reply briefly once you have.)

**"Did you use AI?"**
> Yes. I used an AI assistant for much of the code and the write-up. The results do not rest on trusting it: the certificates are checked by three independent programs, and the number-theory results by Lean. I take responsibility for every claim, and corrections are welcome.

**"The odd perfect number results are elementary."**
> Yes, they are known, classical results. The point of that section is that they are machine-checked in Lean, not that they are new. Nothing is claimed about the existence of odd perfect numbers.

**No reply.**
> Normal, and not a verdict on the work. Researchers get many such emails. Wait at least a month before trying anyone else, and do not follow up more than once.

---

## Order, if you decide to go ahead

1. (The MathOverflow question is no longer needed; see section 1.)
2. arXiv, if you want the preprint citable. It needs an endorsement in math.MG for a first submission, and a positive reply to step 3 is the natural place to ask for one.
3. The email to Chambers.
