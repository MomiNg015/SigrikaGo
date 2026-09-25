# 关闭莫宁角色卡片介绍语音自动播放

## Goal
点击部员手册中的莫宁角色卡片时正常打开详情，但不自动播放介绍语音。

## Requirements
- 仅对 canonicalCharacterId 为 mornye 的角色跳过卡片打开时的介绍语音。
- 保留详情中的手动语音播放、打开音效、出战语音和其他角色的自动介绍语音。
- 同步系统设计说明并生成 HTML。

## Acceptance Criteria
- [x] 莫宁卡片打开路径不触发介绍语音；手动播放回调仍可用。
- [x] 既有部员手册 DOM 测试 5 项通过。
- [x] npm run lint 与 git diff --check 通过。
- [x] 系统设计源文档及生成 HTML 同步。

## Technical Notes
触发点位于 src/modals/HouseModal.jsx 的 openCharacterDetail，手动播放复用 playCharacterDetailVoice。范围明确，无待确认问题。Q 版图片与本地临时产物继续保留原状。
