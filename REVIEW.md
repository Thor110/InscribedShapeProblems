# Getting the work reviewed

This is a kit for sending the preprint ([PAPER.pdf](PAPER.pdf), also [as a web page](https://thor110.github.io/InscribedShapeProblems/pages/paper.html)) to people who can check it. Researchers get many unsolicited claims about famous open problems, and most go unread. What gets read is short, modest and specific: it says exactly what is claimed, what is *not* claimed, and how to check it in minutes.

## What the preprint claims, by kind

Each kind needs a different kind of check, and it helps a reviewer to know which is which.

| Kind | Results | How to check |
|---|---|---|
| **Classical proofs** | Theorem 1 (generic non-existence: no cube in a generic smooth convex surface); Theorems 2–3 (regular simplices in convex bodies, in every admissible orientation); Proposition 5 (admissibility cannot be dropped); Lemma 4 (non-shrinking squares on approximations) | Read [PROOFS.md](PROOFS.md); each proof is a page or less |
| **Computer-assisted proofs** | Theorem 6 (every curve within 0.15 of an ellipse has an inscribed square, fractals included); Theorem 7 (every surface within 0.12 of an ellipsoid has an inscribed regular tetrahedron, plus an open set of orientations) | Run `node tools/certify-square.js` (under a second) and `node tools/certify-tetra.js` (two minutes). The trusted code is about 300 lines: `pages/interval.js` and `pages/certify-rigorous.js` |
| **Numerical evidence** | Shrinkage studies, rectangle sweep, parity counts | Evidence only, not proof; `node tests/run-study.js all` reproduces it |

**What is not claimed.** None of the open problems (inscribed square, rectangle or tetrahedron in every continuous Jordan curve or sphere) is claimed solved. Theorems 2–3 are special cases of Gromov's theorem in the smooth case; their value is an elementary proof that also covers non-smooth convex bodies in admissible orientations. Theorems 6–7 are quantitative results near one ellipse and one ellipsoid, not new structural classes. Parts may well be known, and pointers to the literature are as welcome as corrections.

## Questions to ask

Specific questions get answers more often than "please review my paper":
1. Is Theorem 1 (more vertices than the similarity group has dimensions ⇒ generically no inscribed copy) known? It reads like folklore, but we have not found it stated.
2. Is Theorem 3 (every convex body, every admissible orientation) known for non-smooth convex bodies, and is admissibility the right condition?
3. Is the degree lemma in Theorem 6, Step 2, together with its interval-arithmetic check, a sound way to certify inscribed shapes near a smooth curve? Is there a published certificate of this kind to compare with?
4. Does any known result already cover the curves of Corollary 6.1 (nowhere differentiable, not locally monotone, no symmetry), for example Chambers' theorem with a cleverly chosen reference curve?

## People whose work is closest

These are the authors of the work the preprint builds on. Write to one or two whose work matches your question most closely, not to all of them at once. Their institutional pages list current contact details.

| Topic | Authors | Related work |
|---|---|---|
| Survey of the square peg problem | Benjamin Matschke | "A survey on the square peg problem" (2014) |
| Rectangles in smooth curves | Joshua Greene, Andrew Lobb | "The rectangular peg problem" (2021) |
| Curves close to smooth curves | Gregory R. Chambers | "On the square peg problem" (2022) |
| Integration approach, Lipschitz curves | Terence Tao | "An integration approach to the Toeplitz square peg problem" (2017) |
| Inscribed simplices and squares, transversality | Jason Cantarella, Elizabeth Denne, John McCleary | Papers on inscribed simplices and the square peg theorem |
| Cross-polytopes in convex bodies | Roman Karasev | "Inscribing a regular crosspolytope" (2009) |
| Validated numerics (for the certificates) | Researchers in interval arithmetic and computer-assisted proof | General soundness of Theorems 6–7 |

For a public question, [MathOverflow](https://mathoverflow.net) welcomes focused research-level questions such as "is this known?" (questions 1, 2 and 4 above), but not requests to review a whole paper. Posting the preprint on [arXiv](https://arxiv.org) (category math.MG, Metric Geometry) makes it citable and visible; first-time submitters need an endorsement from an established author in that category.

## A short message to send

> Subject: Elementary proof for inscribed simplices in convex bodies, and computer-assisted inscribed-square certificates near an ellipse
>
> Dear Professor …,
>
> I have been working on inscribed-shape problems and have written up some results that relate to your work on [topic]. I do not claim to solve the open problems. The main points:
>
> - an elementary (Brouwer) proof that every convex body contains an inscribed regular simplex in every "admissible" orientation, and that admissibility cannot be dropped;
> - a computer-assisted proof, in interval arithmetic, that every curve within 0.15 of the ellipse x² + y²/0.36 = 1 has an inscribed square (including nowhere-differentiable curves that are not locally monotone), and the analogue for regular tetrahedra near an ellipsoid.
>
> My specific question is: [one question from the list above].
>
> The preprint is at [link to PAPER.pdf]; the proofs are each about a page, and the certificates run in seconds (`node tools/certify-square.js`). I would be grateful for any pointer to the literature, or for a note if something is wrong.
>
> With thanks,
> [name]

## Before sending

- Rebuild the preprint so it matches the repository: `node tools/build-paper.js`.
- Run both certificates and check that they report VALID.
- Put your name, as you want it cited, at the top of `PAPER.md`.
