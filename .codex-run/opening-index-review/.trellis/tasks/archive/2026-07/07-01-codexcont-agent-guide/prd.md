# Clone CodexCont and Follow Agent Guide

## Goal

Clone `https://github.com/neteroster/CodexCont`, fully read `INSTALL-GUIDE-AGENT/AGENT.md`, and begin executing the guide's instructions from this workspace.

## Requirements

* Clone the CodexCont repository locally without disturbing existing SigrikaGo worktree changes.
* Read `INSTALL-GUIDE-AGENT/AGENT.md` completely before taking actions described by it.
* Follow the guide in order unless a step is destructive, requires unavailable credentials, or conflicts with higher-priority project/safety instructions.
* Record blockers or assumptions clearly if the guide cannot be completed in this session.

## Acceptance Criteria

* [ ] CodexCont is cloned into a known local path.
* [ ] `INSTALL-GUIDE-AGENT/AGENT.md` has been read in full.
* [ ] Initial guide steps have been executed or a concrete blocker is documented.
* [ ] Any SigrikaGo documentation updates required by actual project behavior changes are completed.

## Definition of Done

* Guide execution status is reported to the user.
* Existing unrelated dirty files are not reverted or included in this task.
* If this task changes SigrikaGo architecture, runtime behavior, interfaces, data models, resources, theme styles, deployment, or technical debt status, update `docs/system-design.md` or the matching `docs/system-design/` page and regenerate `docs/system-design.html`.

## Out of Scope

* Changing unrelated SigrikaGo features unless the CodexCont guide explicitly requires it.
* Committing or pushing changes unless requested.

## Technical Notes

* Current workspace already has many unrelated uncommitted changes; keep this task's changes scoped.
* Project instruction requires full AGENT.md reading before guide execution.
