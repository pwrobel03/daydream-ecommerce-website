---
name: Task
about: One task — one pull request, one topic
labels: proposed
---

## Goal
One or two sentences: what works after this task and for whom.

## Context
Why; related ADRs (`docs/adr/NNNN-…`) and issues.

## Acceptance criteria
- [ ] Verifiable statement (behaviour, not implementation)
- [ ] Tests: exactly what must be covered

## Scope
Files and modules the task most likely touches (create / modify / test).

## Interfaces
- Consumes: what this task uses from earlier tasks — exact names and signatures.
- Produces: what later tasks rely on — exact names, parameter and return types.

## Out of scope
What NOT to do in this task.

## Owner review
(Only when the owner wants to see something before merge.) What the owner reviews, e.g. "the JSON output shape".

## Dependencies
Depends on: #N (or "none").
