import StoryPlayerModal, { nextStoryNodeId } from "./StoryPlayerModal.jsx";

const ONBOARDING_TEXT = Object.freeze({
  title: "新手引导",
  continue: "继续",
  finish: "完成",
  skip: "跳过",
  fastForward: "快进并跳过引导",
  skipTitle: "确认跳过引导？",
  skipMessage: "之后你仍可以在大厅右上角的“引导”里重新查看。",
  cancel: "取消",
  confirmSkip: "确认跳过",
  noScript: "暂无可播放的引导内容",
  close: "关闭新手引导",
  textLabel: "新手引导对话文本"
});

export default function OnboardingStoryModal(props) {
  return <StoryPlayerModal {...props} labels={{ ...ONBOARDING_TEXT, ...(props.labels ?? {}) }} />;
}

export { nextStoryNodeId };
