// Offline display data from server/adminDefaultSnapshot.js; no runtime API.
window.SpriteCatalog = {
  "sigrika": {
    "id": "sigrika",
    "name": "西格莉卡",
    "description": "“我是星炬学院围棋部部长西格莉卡，请多指教哟！”",
    "cv": "璃音",
    "acquisition": "初始获得",
    "legacyPortrait": "../../../public/assets/characters/portraits/sigrika.webp",
    "expressions": {
      "smile": "微笑",
      "thinking": "思考",
      "surprised": "惊讶",
      "closed_smile": "闭眼笑",
      "worried": "担忧",
      "angry": "生气",
      "embarrassed": "害羞",
      "serious": "认真",
      "original": "开口笑"
    },
    "skill": {
      "name": "星辉符文",
      "description": "【疾走】指定棋盘上1处交叉点，将其抹除。",
      "cost": "3",
      "uses": 1
    },
    "derivedSkills": []
  },
  "denia": {
    "id": "denia",
    "name": "达妮娅",
    "description": "“好困...能不能下快点，要睡着了...zzz”",
    "cv": "璃音",
    "acquisition": "初始获得",
    "legacyPortrait": "../../../public/assets/characters/portraits/denia.webp",
    "expressions": {
      "smile": "温柔微笑",
      "closed_smile": "闭眼浅笑",
      "sleepy": "慵懒困倦",
      "playful": "俏皮轻笑",
      "thinking": "安静思考",
      "surprised": "轻微惊讶",
      "annoyed": "轻微不满",
      "serious": "清醒认真",
      "original": "开口笑"
    },
    "skill": {
      "name": "泡影幻梦",
      "description": "指定棋盘上的1枚黑/白棋子，将其反色。",
      "cost": "4",
      "uses": 1
    },
    "derivedSkills": []
  },
  "aemeath": {
    "id": "aemeath",
    "name": "爱弥斯",
    "description": "“诶？我不会偷偷连katago的啦...”",
    "cv": "璃音",
    "acquisition": "招募获得",
    "legacyPortrait": "../../../public/assets/characters/portraits/aemeath.webp",
    "expressions": {
      "smile": "明快微笑",
      "closed_smile": "闭眼开心笑",
      "wink": "俏皮眨眼",
      "surprised": "好奇惊讶",
      "thinking": "专注思考",
      "wry": "无奈吐槽",
      "annoyed": "轻微不满",
      "serious": "坚定认真",
      "original": "柔和微笑"
    },
    "skill": {
      "name": "小爱出击",
      "description": "指定棋盘上1处交叉点落子，该落子为【隐藏手】。",
      "cost": "0",
      "uses": 1
    },
    "derivedSkills": [
      {
        "id": "voyage-star",
        "effectType": "voyage-star",
        "name": "远航星",
        "description": "【派生】【疾走】仅限以“小爱出击”产生的隐藏手存在于场上且未暴露的情况下才可以使用。以该隐藏手为中心，抹除包括其在内的上下左右各1路的交叉点；同时移除这些交叉点上下左右各1路的棋子。",
        "uses": 1,
        "freeTurn": true,
        "targetRule": "none",
        "costType": "numeric",
        "costValue": "5",
        "musicTrackId": "aemeath-voyage-star-default"
      }
    ]
  },
  "lynae": {
    "id": "lynae",
    "name": "琳奈",
    "description": "“只有黑白色那多无趣啊，让我来加点色彩吧！”",
    "cv": "云生",
    "acquisition": "招募获得",
    "legacyPortrait": "../../../public/assets/characters/portraits/lynae.webp",
    "skill": {
      "name": "流光溢彩",
      "description": "指定棋盘上1枚棋子，将其变成【喷涂棋子】。同时，随机将棋盘上另1枚可视棋子也变成喷涂棋子。",
      "cost": "1",
      "uses": 1
    },
    "derivedSkills": []
  },
  "qiuyuan": {
    "id": "qiuyuan",
    "name": "仇远",
    "description": "“黑白色的世界吗...其实我早就已经习惯了。”",
    "cv": "",
    "acquisition": "招募获得",
    "legacyPortrait": "../../../public/assets/characters/portraits/qiuyuan.webp",
    "skill": {
      "name": "一斩足矣",
      "description": "指定棋盘上1枚棋子或1处交叉点，移除其所在行的所有棋子。每移除1枚棋子，超频+1。",
      "cost": "0",
      "uses": 1
    },
    "derivedSkills": []
  },
  "mornye": {
    "id": "mornye",
    "name": "莫宁",
    "description": "“关于围棋和AI吗？AI的出现，并非是替人类踏尽了这片星空，而更像是在黑夜里递来的一架天文望远镜。透过它，我们第一次望见了那些曾隐没于深邃之中的天体、星云与遥远光带。然而，星系之间的航路，棋盘深处的奥秘，以及每一次落子时，人心与未知相遇的微光与震颤——这一切，并不会因那枚透镜而黯淡半分。人类仍可以在每一局棋的旅程中，凝望、诘问、反思，无止境地继续寻找只属于自己的答案。”",
    "cv": "璃音",
    "acquisition": "招募获得",
    "legacyPortrait": "../../../public/assets/characters/portraits/mornye.webp",
    "skill": {
      "name": "协议接管",
      "description": "【疾走】指定棋盘1处交叉点，将其变为对方的【禁地】。",
      "cost": "2",
      "uses": 1
    },
    "derivedSkills": []
  },
  "changli": {
    "id": "changli",
    "name": "长离",
    "description": "“听说这里有下围棋的地方，我就过来看看~”",
    "cv": "云生",
    "acquisition": "招募获得",
    "legacyPortrait": "../../../public/assets/characters/portraits/changli.webp",
    "skill": {
      "name": "谋定后动",
      "description": "【禁先】【疾走】本回合，获得一把【飞刀】。",
      "cost": "3",
      "uses": 1
    },
    "derivedSkills": []
  },
  "chisa": {
    "id": "chisa",
    "name": "千咲",
    "description": "“嗯...我是听说参加围棋部有学分，所以就来了...还请多多指教。”",
    "cv": "云生",
    "acquisition": "招募获得",
    "legacyPortrait": "../../../public/assets/characters/portraits/chisa.webp",
    "skill": {
      "name": "虚湮解弦",
      "description": "指定1处交叉点落子，然后，移除场上所有仅剩1口气的棋块。下一个对方回合，对方无法在这些被移除的棋块所在的交叉点上落子。每移除一颗非己方棋子，超频+1；每移除一颗己方棋子，超频-1。",
      "cost": "1",
      "uses": 1
    },
    "derivedSkills": []
  },
  "nabomo": {
    "id": "nabomo",
    "name": "娜波摩",
    "description": "“作为残星会会长，这种较量简直不在话下...啊，你说残星会是什么？怎么，有兴趣加入我创立的社团吗？”——在这个平行宇宙中，娜波摩不过是个喜欢说中二话的普通学生罢了。",
    "cv": "璃音",
    "acquisition": "首次升上6段后自动获得",
    "legacyPortrait": "../../../public/assets/characters/portraits/nabomo.webp",
    "skill": {
      "name": "？？？",
      "description": "【被动】自己的落子有80%概率在对手视角里会变成对手棋子颜色。",
      "cost": "0",
      "uses": 0
    },
    "derivedSkills": []
  }
};
