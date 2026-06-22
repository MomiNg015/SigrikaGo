export const SKILL_EFFECT_CATALOG = {
  "erase-point": {
    label: "抹除交叉点",
    targetRule: "empty-point",
    active: true,
    boardEffect: true,
    soundCues: { startAt: 0.08, impactAt: 0.48 }
  },
  "flip-stone": {
    label: "棋子反色",
    targetRule: "stone",
    active: true,
    boardEffect: true,
    soundCues: { startAt: 0.04, impactAt: 0.6 }
  },
  "hidden-hand": {
    label: "隐藏手",
    targetRule: "empty-point",
    active: true,
    boardEffect: true,
    soundCues: { startAt: 0.04, impactAt: 0.52 }
  },
  "protocol-takeover": {
    label: "协议接管",
    targetRule: "empty-point",
    active: true,
    boardEffect: true,
    soundCues: { startAt: 0.05, impactAt: 0.5 }
  },
  "random-blast": {
    label: "随机爆炸",
    targetRule: "none",
    active: true,
    boardEffect: true,
    soundCues: { startAt: 0.06, impactAt: 0.56 }
  },
  "row-slash": {
    label: "一斩足矣",
    targetRule: "any-point",
    active: true,
    boardEffect: false,
    soundCues: { startAt: 0.04, impactAt: 0.46 }
  },
  "spray-stone": {
    label: "流光溢彩",
    targetRule: "stone",
    active: true,
    boardEffect: true,
    soundCues: { startAt: 0.04, impactAt: 0.58 }
  },
  "liberty-purge": {
    label: "虚湮解弦",
    targetRule: "legal-move-point",
    active: true,
    boardEffect: true,
    soundCues: { startAt: 0.04, impactAt: 0.5 }
  },
  "double-move": {
    label: "ChangLi double move",
    targetRule: "none",
    active: true,
    boardEffect: true,
    soundCues: { startAt: 0.05, impactAt: 0.44 }
  },
  "color-illusion-passive": {
    label: "被动伪装",
    targetRule: "none",
    active: false,
    boardEffect: false,
    soundCues: { startAt: 0, impactAt: 0 }
  }
};

export const SKILL_EFFECT_TYPES = Object.freeze(Object.keys(SKILL_EFFECT_CATALOG));
export const ACTIVE_SKILL_EFFECT_TYPES = Object.freeze(
  SKILL_EFFECT_TYPES.filter((effectType) => SKILL_EFFECT_CATALOG[effectType].active)
);
export const SKILL_EFFECT_OPTIONS = Object.freeze(
  SKILL_EFFECT_TYPES.map((effectType) => Object.freeze({
    value: effectType,
    label: SKILL_EFFECT_CATALOG[effectType].label
  }))
);

export function skillEffectTypeList() {
  return [...SKILL_EFFECT_TYPES];
}

export function isSkillEffectType(effectType) {
  return Object.hasOwn(SKILL_EFFECT_CATALOG, effectType);
}

export function skillEffectTargetRule(effectType, fallbackRule = null) {
  return SKILL_EFFECT_CATALOG[effectType]?.targetRule ?? fallbackRule ?? "none";
}

export function skillEffectSoundCues(effectType) {
  return SKILL_EFFECT_CATALOG[effectType]?.soundCues ?? { startAt: 0, impactAt: 0 };
}

export function skillEffectHasBoardEffect(effectType) {
  return Boolean(SKILL_EFFECT_CATALOG[effectType]?.boardEffect);
}

export function skillEffectTypeMessage() {
  const types = skillEffectTypeList();
  return `${types.slice(0, -1).join(", ")}, or ${types.at(-1)}`;
}
