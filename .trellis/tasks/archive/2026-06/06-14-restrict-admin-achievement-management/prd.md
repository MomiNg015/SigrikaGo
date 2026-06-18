# Restrict Admin Achievement Management

## Goal

Tighten the admin achievement editor so admins can only edit existing achievement display metadata and reward assignment. New achievements require code-side event and condition logic, so creation and deletion/disable actions must no longer be available from the admin UI or API.

## Requirements

- Admin achievement list remains readable.
- Existing achievements can only update:
  - `name`
  - `content`
  - `rewardAssetId`
  - `sortOrder`
- Admin achievement UI must remove the "add achievement" and "disable/delete achievement" actions.
- Admin achievement editor must show code-owned fields such as `key`, `conditionType`, and `conditionParams` as non-editable context or omit them from editable controls.
- Backend `PATCH /api/admin/achievements/:id` must reject attempts to change code-owned fields such as `key`, `conditionType`, `conditionParams`, `enabled`, or `deletedAt`.
- Backend `POST /api/admin/achievements` and `DELETE /api/admin/achievements/:id` must reject requests so direct API calls cannot bypass the UI.
- Reward asset management remains available because existing achievements still need selectable reward assets.

## Acceptance Criteria

- [ ] Admin UI renders no "新增成就" action and no achievement "下线" action.
- [ ] Admin achievement save sends only the editable achievement fields.
- [ ] PATCH accepts valid updates to name/content/rewardAssetId/sortOrder.
- [ ] PATCH rejects key/condition/enabled/deletedAt changes.
- [ ] POST and DELETE achievement routes return a JSON error.
- [ ] Reward asset create/edit/delete behavior is unchanged.

## Definition of Done

- Targeted frontend/admin and backend route tests pass.
- `npm test`, `npm run build`, and `npm run docs:system-design` pass if docs are touched.
- System design docs are updated because admin API behavior changes.

## Technical Approach

- Replace full achievement validation on update with a restricted editable-field validator.
- Keep legacy create/disable helper functions available only for code/seed use, but stop exposing them through admin routes.
- Simplify `AdminAchievements` achievement drawer to edit display fields, reward asset, and sort order only.
- Update tests and system design docs to capture the reduced admin contract.

## Out of Scope

- No new achievement definitions in this task.
- No changes to player achievement evaluation logic.
- No changes to reward asset model or reward grant behavior.
