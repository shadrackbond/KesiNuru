# KesiNuru Implementation Backlog

This backlog converts the frozen MVP scope into buildable issues. P0 issues form the critical path. P1 items may begin only after every P0 acceptance test for the current milestone passes.

## Working rules

- One issue must produce one demonstrable outcome.
- Every issue has an owner before work begins.
- Pull requests must reference an issue and include verification evidence.
- No real legal documents or personal data may be committed.
- New scope requires removing equivalent effort from P0 or P1.
- Feature freeze begins 26 September 2026.

## Milestones

| Milestone | Deadline | Exit condition |
| --- | --- | --- |
| M1 Foundation | 18 Sep, 10:00 p.m. EAT | Case persists and reopens from dashboard |
| M2 Intake and evidence | 20 Sep, 10:00 p.m. EAT | Intake and three uploads persist safely |
| M3 Document intelligence | 22 Sep, 10:00 p.m. EAT | Facts extracted with sources and user verification |
| M4 Traceability | 23 Sep, 10:00 p.m. EAT | Timeline, evidence links and Nuru Check work |
| M5 CasePack | 24 Sep, 10:00 p.m. EAT | Reviewable CasePack exports |
| M6 Stabilisation | 25 Sep, 10:00 p.m. EAT | Critical tests pass and access controls hold |
| M7 Deployment | 26 Sep, 8:00 p.m. EAT | Live golden demo completes without intervention |
| M8 Submission | 27 Sep, 6:00 p.m. EAT | Devpost submission complete |

## Epic A — Foundation and data

### KS-001 — Initialise application and quality tooling

**Priority:** P0  
**Milestone:** M1  
**Estimate:** 3 hours

- Next.js and TypeScript application runs locally.
- Formatting, linting and tests have scripts.
- Environment example contains placeholders only.
- Apache-2.0 licence and README are present.

### KS-002 — Implement core database schema

**Priority:** P0  
**Milestone:** M1  
**Estimate:** 5 hours

- Create User, Case, IntakeResponse, EvidenceFile, ExtractedFact, CaseEvent, EvidenceLink, NuruCheck, LegalSource and GeneratedDocument.
- Add ownership and lifecycle indexes.
- Migration runs on a clean database.

### KS-003 — Add secure user/session boundary

**Priority:** P0  
**Milestone:** M1  
**Estimate:** 4 hours

- A user or demo session can create and reopen a case.
- Every case read and write performs server-side ownership checks.
- Authorization test rejects cross-user access.

### KS-004 — Build application shell and dashboard

**Priority:** P0  
**Milestone:** M1  
**Estimate:** 5 hours

- Responsive navigation, dashboard, empty state and case cards exist.
- New and resumed cases route to the correct step.
- Loading and error states are visible.

## Epic B — Intake and evidence

### KS-005 — Build eligibility and consent gate

**Priority:** P0  
**Milestone:** M2  
**Estimate:** 3 hours

- Age, jurisdiction, limitation and processing consent are captured.
- Ineligible or emergency selections do not enter normal intake.

### KS-006 — Build guided employment intake

**Priority:** P0  
**Milestone:** M2  
**Estimate:** 7 hours

- Eight intake steps save incrementally.
- “I do not know” and “no document” are supported.
- User can review and edit all answers.

### KS-007 — Implement private evidence upload

**Priority:** P0  
**Milestone:** M2  
**Estimate:** 6 hours

- Validate PDF, JPEG and PNG type and size server-side.
- Store files privately using non-guessable keys.
- Upload status, retry, preview and deletion work.

### KS-008 — Seed synthetic demo cases

**Priority:** P0  
**Milestone:** M2  
**Estimate:** 4 hours

- Golden unpaid-wage case can be seeded repeatedly.
- No real personal data is present.
- Reset produces the same starting state.

## Epic C — Document intelligence

### KS-009 — OCR and document classification

**Priority:** P0  
**Milestone:** M3  
**Estimate:** 6 hours

- Text is extracted from controlled PDF and image samples.
- Document type and processing status are recorded.
- Failure falls back to manual entry.

### KS-010 — Schema-constrained fact extraction

**Priority:** P0  
**Milestone:** M3  
**Estimate:** 8 hours

- Names, dates, amounts, employment fields and events use a validated schema.
- Candidate facts retain page or image source references.
- Document content cannot provide system instructions.

### KS-011 — Build fact-verification interface

**Priority:** P0  
**Milestone:** M3  
**Estimate:** 6 hours

- User can confirm, correct or reject each candidate.
- Original candidate remains auditable after correction.
- Low-confidence facts cannot be bulk confirmed.

### KS-012 — Add deterministic validators

**Priority:** P0  
**Milestone:** M3  
**Estimate:** 4 hours

- Validate dates, currencies and required relationships separately from AI.
- Invalid or impossible outputs are rejected before persistence.

## Epic D — Timeline and Nuru Check

### KS-013 — Generate editable case timeline

**Priority:** P0  
**Milestone:** M4  
**Estimate:** 5 hours

- Events order correctly and display verification status.
- Approximate and unknown dates remain distinguishable.
- User edits are retained.

### KS-014 — Build Evidence Map

**Priority:** P0  
**Milestone:** M4  
**Estimate:** 5 hours

- Selecting a material event reveals supporting or conflicting sources.
- User-stated facts without documents are labelled.

### KS-015 — Implement deterministic Nuru Checks

**Priority:** P0  
**Milestone:** M4  
**Estimate:** 6 hours

- Controlled conflicts and missing evidence trigger expected checks.
- Each check exposes its trigger and resolution path.
- Severity reflects workflow impact, not case strength.

## Epic E — Legal information and export

### KS-016 — Create approved legal-source registry

**Priority:** P0  
**Milestone:** M5  
**Estimate:** 5 hours

- Sources store issuing body, canonical URL, provision and version date.
- No user-facing citation can be generated outside the registry.
- Prototype content is marked as requiring professional validation.

### KS-017 — Build Action Path

**Priority:** P0  
**Milestone:** M5  
**Estimate:** 5 hours

- Options are informational and source-backed.
- No outcome prediction or “best action” label is used.
- Human-review questions can be added to the CasePack.

### KS-018 — Generate CasePack

**Priority:** P0  
**Milestone:** M5  
**Estimate:** 8 hours

- Preview includes summary, parties, timeline, evidence index, gaps, sources and disclaimer.
- Only confirmed, corrected or explicitly user-stated facts appear as substantive content.
- PDF exports from the deployed environment.

## Epic F — Safety and stability

### KS-019 — Add safety routing and disclaimers

**Priority:** P0  
**Milestone:** M6  
**Estimate:** 4 hours

- Emergency and high-risk inputs leave the normal flow.
- Limitations appear before intake, Action Path and export.

### KS-020 — Add privacy and deletion controls

**Priority:** P0  
**Milestone:** M6  
**Estimate:** 4 hours

- Case deletion removes database records and stored objects.
- Logs do not contain evidence text or case summaries.

### KS-021 — Critical integration and authorization tests

**Priority:** P0  
**Milestone:** M6  
**Estimate:** 7 hours

- Golden flow is covered from case creation to export.
- Upload failure, extraction failure, conflict and deletion paths are tested.
- Cross-user file and case access fail.

### KS-022 — Accessibility and mobile pass

**Priority:** P0  
**Milestone:** M6  
**Estimate:** 5 hours

- Critical flow works at 360px width.
- Forms are labelled and keyboard accessible.
- Status never relies on colour alone.

## Epic G — Deployment and submission

### KS-023 — Deploy and configure production

**Priority:** P0  
**Milestone:** M7  
**Estimate:** 5 hours

- Live environment runs migrations and stores files privately.
- Golden demo completes in a private browser.

### KS-024 — Produce documentation and architecture assets

**Priority:** P0  
**Milestone:** M7  
**Estimate:** 4 hours

- README contains actual setup and architecture.
- AI tools, APIs and third-party sources are disclosed.

### KS-025 — Record demonstration and submit

**Priority:** P0  
**Milestone:** M8  
**Estimate:** 6 hours

- Video is no longer than three minutes.
- All public links work while logged out.
- Devpost entry explains problem, solution, stack, safety and credits.

## P1 backlog

| ID | Item | Estimate |
| --- | --- | ---: |
| KS-101 | Editable demand or complaint letter | 6 hours |
| KS-102 | Mobile-money message parser | 5 hours |
| KS-103 | Public sample-case walkthrough | 4 hours |
| KS-104 | Case completeness indicator | 3 hours |
| KS-105 | Structured JSON export | 3 hours |

## Recommended solo build order

`KS-001 → KS-002 → KS-003 → KS-004 → KS-005 → KS-006 → KS-007 → KS-008 → KS-009 → KS-010 → KS-011 → KS-012 → KS-013 → KS-014 → KS-015 → KS-016 → KS-017 → KS-018 → KS-019 → KS-020 → KS-021 → KS-022 → KS-023 → KS-024 → KS-025`

If behind schedule, remove all P1 work first. Do not remove fact verification, evidence traceability, authorization tests or the working CasePack export.
