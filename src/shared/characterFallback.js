import { DEFAULT_SKILL_SYSTEM_MESSAGE } from "./skillMessages.js";
import { DEFAULT_VOYAGE_STAR_DERIVED_SKILL } from "./derivedSkills.js";

export const FALLBACK_CHARACTERS = {
  sigrika: {
    id: "sigrika",
    name: "西格莉卡",
    description: "星辉社团的符文棋手，擅长用精准的星光符号改写棋盘节奏。",
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
  denia: {
    id: "denia",
    name: "达妮娅",
    description: "月色与泡影之间的术师，能把棋子的立场悄然翻转。",
    palette: "#f2a4d8",
    portrait: "/assets/Danea_centered.webp",
    skill: {
      id: "flip-stone",
      name: "泡影幻梦",
      uses: 1,
      cost: 4,
      costType: "numeric",
      costValue: "4",
      systemMessage: DEFAULT_SKILL_SYSTEM_MESSAGE,
      description: "指定棋盘上的某个棋子，将其反色。"
    }
  },
  aemeath: {
    id: "aemeath",
    name: "爱弥斯",
    description: "活泼的电子幽灵伙伴，最喜欢用出其不意的隐藏手扰乱对局。",
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
      effectTags: ["隐藏手"],
      params: {
        derivedSkills: [{ ...DEFAULT_VOYAGE_STAR_DERIVED_SKILL }]
      }
    }
  },
  baconbits: {
    id: "baconbits",
    name: "猪小仙",
    description: "看似悠闲的爆破型棋手，常用一场热闹的爆炸打开局面。",
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
  lynae: {
    id: "lynae",
    name: "琳奈",
    description: "以流光颜料改写棋子阵营的幻彩棋手，让棋盘边界在一瞬间变得难以预测。",
    palette: "#38d7c2",
    portrait: "/assets/characters/lynae_centered.webp",
    acquisitionMethod: "首次升上5段自动获得（管理员可以直接拥有）",
    skill: {
      id: "spray-stone",
      name: "流光溢彩",
      uses: 1,
      cost: 4,
      costType: "numeric",
      costValue: "4",
      systemMessage: DEFAULT_SKILL_SYSTEM_MESSAGE,
      description: "指定棋盘上一枚非喷涂、非隐藏手的棋子，在其变成喷涂棋子的同时，随机将棋盘上另一枚非喷涂、非隐藏手的棋子也变成喷涂棋子；若不存在另一枚可随机转换的棋子，则只转换指定棋子。超频2。"
    }
  },
  qiuyuan: {
    id: "qiuyuan",
    name: "仇远",
    description: "沉默寡言的剑客，只需一斩便能让棋盘横线归于清寂。",
    palette: "#2f3a3d",
    portrait: "/assets/characters/qiuyuan.png",
    acquisitionMethod: "部员招募获得",
    skill: {
      id: "row-slash",
      name: "一斩足矣",
      uses: 1,
      cost: 0,
      costType: "numeric",
      costValue: "0",
      systemMessage: DEFAULT_SKILL_SYSTEM_MESSAGE,
      description: "指定棋盘上一枚棋子或交叉点，移除其所在行的所有棋子。每移除一枚棋子，超频+1。发动技能会消耗本回合。"
    }
  },
  mornye: {
    id: "mornye",
    name: "莫宁",
    description: "以科学家的冷静视角接管棋盘协议，在关键交叉点写入只针对对手的禁入规则。",
    palette: "#8aa0ff",
    portrait: "/assets/characters/mornye.png",
    acquisitionMethod: "招募获得",
    skill: {
      id: "protocol-takeover",
      name: "协议接管",
      uses: 1,
      cost: 2,
      costType: "numeric",
      costValue: "2",
      systemMessage: DEFAULT_SKILL_SYSTEM_MESSAGE,
      description: "指定棋盘一处空置交叉点，将其变为对方的禁入点。该点为空时，对方不能在此落子，也不能把该空点作为技能目标；该点不计入对方领地。超频2，发动技能不会消耗本回合。",
      freeTurn: true
    }
  },
  changli: {
    id: "changli",
    name: "长离",
    englishName: "ChangLi",
    description: "古风围棋高手，擅长在对手亮出手段后谋定后动，以连续两手重塑棋局。",
    palette: "#e96c7d",
    portrait: "/assets/characters/changli.png",
    acquisitionMethod: "招募获得",
    skill: {
      id: "double-move",
      name: "谋定后动",
      uses: 1,
      cost: 3,
      costType: "numeric",
      costValue: "3",
      systemMessage: DEFAULT_SKILL_SYSTEM_MESSAGE,
      description: "发动后，本回合最多可以连续下 2 手。每一手均按普通落子规则逐手结算，也可以选择弃一手结束行动。该技能只有在对手成功发动过主动技能后才能发动。超频 3，发动技能不会消耗本回合。",
      freeTurn: true,
      params: { moves: 2 }
    }
  },
  chisa: {
    id: "chisa",
    name: "千咲",
    englishName: "Chisa",
    description: "黑发红眸的女子高中生棋手，会在合法落子后拨断棋盘上濒临断气的棋块。",
    palette: "#d74255",
    portrait: "/assets/characters/chisa.png",
    acquisitionMethod: "招募获得",
    skill: {
      id: "liberty-purge",
      name: "虚湮解弦",
      uses: 1,
      cost: 0,
      costType: "numeric",
      costValue: "0",
      systemMessage: DEFAULT_SKILL_SYSTEM_MESSAGE,
      description: "指定一个有效交叉点落子，然后，移除场上所有仅剩1口气的棋块。每移除一颗非己方棋子，超频+1；每移除一颗己方棋子，超频-1。",
      freeTurn: false
    }
  },
  nabomo: {
    id: "nabomo",
    name: "娜波摩",
    description: "擅长伪装与错觉的幻色棋手，会让对手眼中的棋盘变得难以捉摸。",
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
