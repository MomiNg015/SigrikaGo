# Merge branches into master

## Goal

Merge local development branches into `master` and create commit(s) that preserve the branch work without losing or silently mixing unrelated working-tree changes.

## What I already know

* User requested: merge all other branches into `master` and commit.
* Current branch is `codex/recruitment-system`, not `master`.
* `master` is at `36aa2993` and is ahead of `origin/master`.
* There are 42 uncommitted working-tree changes before merging can safely proceed.
* Local branches include multiple `codex/*` work branches plus `master`.

## Assumptions (temporary)

* "All other branches" means all local branches except `master`, not remote-tracking refs.
* Existing uncommitted changes should not be silently included unless the user confirms.

## Open Questions

* How should the existing uncommitted changes be handled before switching to `master`?

## Requirements

* Inspect current branch and dirty state before any merge.
* Avoid destructive git commands.
* Preserve user/WIP changes unless explicitly told otherwise.
* Merge selected branches into `master`.
* Commit merge results after conflicts are resolved.

## Acceptance Criteria

* [ ] `master` contains the selected branch histories or content.
* [ ] Merge conflicts, if any, are resolved intentionally.
* [ ] Final git status and commit result are reported.

## Definition of Done

* Git status inspected before and after merge.
* No unrecognized dirty files committed without confirmation.
* Final commit(s) created if merge succeeds.

## Out of Scope

* Pushing to remote.
* Deleting branches after merge.

## Technical Notes

* Relevant commands inspected: `git status --short --branch`, `git branch --all --verbose --no-abbrev`, `git branch --format`, and `git log --oneline --decorate --graph --all --max-count=40`.
