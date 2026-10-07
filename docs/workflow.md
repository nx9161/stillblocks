# War Room — Project: Stillblocks

The diagram records the actual work performed. Role seats ran as separate agent turns; some agents were reused between phases. Sloane authored and integrated the website because the Sites owner handles its source and hosting lifecycle.

```mermaid
flowchart TD
    U[Your request] --> PW[Phase 0: Prompt Writer<br/>Refine goal and acceptance criteria]
    PW --> KW[Knowledge Wizard<br/>Official MDN research and dossier]
    KW --> P1[Phase 1: Product Owner + UX Designer + Business Analyst<br/>Scope, design, usability, commercial check]
    P1 --> EA[Phase 2: Enterprise Architect<br/>Browser-only engine and game invariants]
    EA --> ENG[Backend + Frontend + DevOps seats<br/>Challenge edge cases and release plan]
    ENG --> BUILD[Sloane<br/>Author and integrate game]
    BUILD --> SEC[Phase 3: AppSec + AI Red Team + Tech Law + General Counsel<br/>Security, applicability, fonts, branding]
    SEC --> FIX[Self-host fonts and complete controller<br/>AppSec re-review]
    FIX --> QA[Phase 4: QA Manager + Frontend review<br/>Engine tests and static review]
    QA --> PR[Public repository + game pull request]
    PR --> OWNER[Owner review and merge]
    OWNER --> RELEASE[Production publication after explicit approval]
    QA -.-> B[Browser playthrough<br/>Blocked by environment policy; still required]
    B -.-> RELEASE
    SEC -. Findings .-> FIX
    QA -. Defects .-> BUILD
```

## Decisions

- Native static HTML, CSS and JavaScript: no game framework, backend or login.
- Separate deterministic engine, canvas renderer and semantic controls.
- Warm original styling, visible keyboard guide, ghost and upcoming pieces.
- Pause on tab hiding/focus loss; freeze timers and clear held inputs.
- Confirm restart, preserve modified browser shortcuts and Tab behavior.
- Self-host fonts with licenses; no application tracking or storage.
- QA verifies game invariants; browser QA remains explicitly unverified.
- Owner controls merging and production approval.

## Review outcomes

Product, UX, Business and architecture seats approved the defined scope. AI red-team review found no AI surface. AppSec passed the final static review. Tech Law requested self-hosted fonts; implemented with OFL notices. General Counsel identified no scope blocker and required publication-file and license checks. QA evidence is in the tests and pull request.
