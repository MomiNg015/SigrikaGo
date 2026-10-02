# 西格莉卡表情素材命名

## Goal

用户确认第一位角色为西格莉卡。将已交付的独立素材包改为明确的 Sigrika 命名，便于其它对话接入立绘和剧情系统。

## Requirements

- 仅更新第一套独立素材包，角色标识使用 sigrika，显示名称使用西格莉卡。
- 工作包目录与 ZIP 使用 sigrika-sprite-expressions。
- 九张交付 PNG 使用 sigrika- 前缀；PSD 为 sigrika-expressions.psd；两张交付预览使用 sigrika- 前缀。
- 同步 manifest、交付说明、QA 中的当前文件路径和重新导出脚本。
- 源素材与内部图层技术文件名继续用于工作流；历史提示词保留制作原文。
- 图像与 PSD 内容不发生变化，以重命名前后 SHA256 一致性验证。

## Acceptance Criteria

- [x] 文件夹、ZIP、九张交付 PNG、PSD 和两张预览完成重命名。
- [x] 角色身份和交付路径引用准确，生成脚本语法检查通过。
- [x] 所有原有二进制文件重命名前后 SHA256 完全一致。
- [x] ZIP 内容与工作包一致，交付记录及路径说明已更新。

## Scope and Validation

只改本机 Codex 输出目录中的独立素材及任务记录。本次未接入应用资源体系，项目系统设计事实不变；不修改项目代码、其它角色包或其它已有工作。无需重跑应用测试；执行文件哈希、manifest 路径、脚本语法和 ZIP 内容检查。

## Research References

- research/rename-notes.md
