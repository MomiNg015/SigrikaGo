import { DEFAULT_SKILL_SYSTEM_MESSAGE } from "./skillMessages.js";

export const FALLBACK_CHARACTERS = {
  sigrika: {
    id: "sigrika",
    name: "西格莉卡",
    palette: "#ff9b4d",
    portrait: "/assets/sigrika_centered.webp",
    skill: {
      id: "erase-point",
      name: "星辉符文",
      uses: 1,
      cost: 3,
      costType: "numeric",
      costValue: "3",
      systemMessage: DEFAULT_SKILL_SYSTEM_MESSAGE,
      description: "抹除棋盘上指定交叉点。该点不再可落子，也不参与数子。（使用该技能不消耗本次落子）",
      freeTurn: true
    }
  },
  danea: {
    id: "danea",
    name: "达妮娅",
    palette: "#f2a4d8",
    portrait: "/assets/Danea_centered.webp",
    skill: {
      id: "flip-stone",
      name: "染秽",
      uses: 1,
      cost: 3,
      costType: "numeric",
      costValue: "3",
      systemMessage: DEFAULT_SKILL_SYSTEM_MESSAGE,
      description: "指定棋盘上的某个棋子，将其反色。"
    }
  },
  aemeath: {
    id: "aemeath",
    name: "爱弥斯",
    palette: "#67d9e8",
    portrait: "/assets/Aemeath_centered.webp",
    skill: {
      id: "hidden-hand",
      name: "小爱出击",
      uses: 1,
      cost: 0,
      costType: "numeric",
      costValue: "0",
      systemMessage: DEFAULT_SKILL_SYSTEM_MESSAGE,
      description: "本轮落子为隐藏手。落下了电子幽灵般的一手，应该不会被发现吧...",
      effectTags: ["隐藏手"]
    }
  },
  baconbits: {
    id: "baconbits",
    name: "猪小仙",
    palette: "#f59ab2",
    portrait: "/assets/baconbits.webp",
    acquisitionMethod: "商城购买",
    skill: {
      id: "random-blast",
      name: "猪小仙爆炸",
      uses: 1,
      cost: 0,
      costType: "numeric",
      costValue: "0",
      systemMessage: DEFAULT_SKILL_SYSTEM_MESSAGE,
      description: "随机移除棋盘上3*3区域的棋子。",
      freeTurn: true,
      params: { size: 3 }
    }
  },
  nabomo: {
    id: "nabomo",
    name: "娜波摩",
    palette: "#8fb4f7",
    portrait: "/assets/nabomo.webp",
    acquisitionMethod: "积分达到1400分时自动获得",
    skill: {
      id: "color-illusion-passive",
      name: "千变万化",
      uses: 0,
      cost: 0,
      costType: "numeric",
      costValue: "0",
      systemMessage: "{fromColor}{player}使用了{character}的“{skill}”技能，之后自己的落子会在对手视角里千变万化。",
      description: "被动技。自己的落子有80%概率在对手视角里会变成对手棋子颜色。",
      freeTurn: true,
      passive: true,
      params: { probability: 0.8 }
    }
  }
};

export const fallbackCharacterList = Object.values(FALLBACK_CHARACTERS);
