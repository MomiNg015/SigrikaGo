// Generated from prisma/dev.db non-user admin configuration on 2026-07-07.
// Do not include users, audit logs, feedback, reports, game records, mailbox batches/history, or live state here.

export const ADMIN_DEFAULT_CONFIG = {
  "siteSettings": [
    {
      "key": "aboutText",
      "value": "二创性质围棋小游戏，非商用。\n有任何意见或建议可以右上留言板输入提交哦~\neditor：莫名"
    },
    {
      "key": "characterLoadingLines",
      "value": "sigrika=西格莉卡正在做死活题\nmornye=莫宁正在喝速醒能量补充胶\nchangli=长离正在摇扇子\nlynae=琳奈正在摇匀颜料\nnabomo=娜波摩正在玩cosplay\ndenia=达妮娅正在睡大觉\nqiuyuan=仇远正在吹笛子\nchisa=千咲正在制作棋盘烤肉机\naemeath=爱弥斯正在打瘪猪小仙\nbaconbits=猪小仙正在被打爆"
    },
    {
      "key": "footerText",
      "value": "星炬学院围棋部 SigrikaGo\nCopyright ©KURO GAMES. ALL RIGHTS RESERVED.\n浙ICP备2026035038号\n[@莫名](https://space.bilibili.com/6487511)"
    },
    {
      "key": "homeSubtitle",
      "value": "SIGRIKAGO"
    },
    {
      "key": "homeTitle",
      "value": "星炬学院围棋部"
    },
    {
      "key": "preloadTips",
      "value": "露露米是一只小猪\n因为使用数子规则，建议下完单官再申请数目哦~\n在对局中需要判断形势时，可以粗略以“实空+提子数+除子数-超频数*2”来判断双方的目数。\n禁止互相刷棋上分哦~GM会看后台的。"
    },
    {
      "key": "ratingRules",
      "value": "{\n  \"elo\": {\n    \"kFactor\": 40,\n    \"deltaMin\": 4,\n    \"deltaMax\": 36\n  },\n  \"rankChangeRatingDelta\": 100,\n  \"rankGapAdjustment\": {\n    \"enabled\": true,\n    \"steps\": [\n      {\n        \"minGap\": 0,\n        \"rewardMultiplier\": 1,\n        \"normalPenaltyMultiplier\": 1,\n        \"highRankUpsetPenaltyMultiplier\": 1\n      },\n      {\n        \"minGap\": 2,\n        \"rewardMultiplier\": 0.75,\n        \"normalPenaltyMultiplier\": 0.75,\n        \"highRankUpsetPenaltyMultiplier\": 1.25\n      },\n      {\n        \"minGap\": 4,\n        \"rewardMultiplier\": 0.5,\n        \"normalPenaltyMultiplier\": 0.5,\n        \"highRankUpsetPenaltyMultiplier\": 1.5\n      },\n      {\n        \"minGap\": 6,\n        \"rewardMultiplier\": 0.25,\n        \"normalPenaltyMultiplier\": 0.25,\n        \"highRankUpsetPenaltyMultiplier\": 2\n      }\n    ]\n  },\n  \"antiBoost\": {\n    \"enabled\": true,\n    \"windowHours\": 24,\n    \"fullScoreGames\": 3,\n    \"reducedScoreGames\": 6,\n    \"reducedMultiplier\": 0.25,\n    \"modeOverrides\": {}\n  },\n  \"privateRewards\": {\n    \"winCoins\": 20,\n    \"lossCoins\": 10,\n    \"drawCoins\": 10,\n    \"dailyRewardLimit\": 3\n  }\n}"
    },
    {
      "key": "recruitmentConfig",
      "value": "{\"durationMs\":300000,\"successRates\":[50,75,100],\"confidenceTexts\":[\"碰碰运气吧，也许能招到新人呢？\",\"今天是休息日，感觉有大概率能抓到新人。\",\"哇，在飞讯上刷到了好多围棋部相关的内容，这次一定会有新人来了！\"],\"noResponseTexts\":{\"campus-recruitment-poster\":[\"招新贴报挂了好久，但没有人关注。只能下次再试试了...\",\"公告栏前人来人往，但这次还没有人把名字写到申请表上。\"],\"radio-recruitment-ticket\":[\"已经通过电台广播出去了，不过这次还没有任何回讯...\",\"广播已经播出去了，不过这次没有收到明确回信。\"]},\"successTexts\":{\"lynae\":\"呀吼，听说这里很热闹！让我也来掺和一下吧！\",\"mornye\":\"我是莫宁教授，作为围棋部的指导教师，希望未来能和大家友好交流相处。\",\"chisa\":\"请问这是围棋部吗？听说参与围棋活动会有额外学分拿......之后还请多多指教。\",\"qiuyuan\":\"我来了。有谁要切磋一番的吗？\",\"changli\":\"听说远洋之外还有下围棋的地方，我就来了。呵呵，今天有谁愿意和我对弈一盘的吗？\"}}"
    },
    {
      "key": "skillEffectsEnabled",
      "value": "true"
    }
  ],
  "characters": [
    {
      "slug": "sigrika",
      "name": "西格莉卡",
      "description": "“我是星炬学院围棋部部长西格莉卡，请多指教哟！”",
      "portraitUrl": "/assets/sigrika_centered.webp",
      "portraitSource": "url",
      "acquisitionMethod": "初始获得",
      "cvName": "璃音",
      "cvUrl": "https://space.bilibili.com/68435776",
      "source": "default",
      "palette": "#ff9b4d",
      "enabled": true,
      "sortOrder": 0,
      "skill": {
        "effectType": "erase-point",
        "name": "星辉符文",
        "description": "抹除棋盘上指定交叉点（使用该技能不消耗本次落子）。\n超频：3",
        "uses": 1,
        "freeTurn": true,
        "targetRule": "empty-point",
        "paramsJson": "{}",
        "costType": "numeric",
        "costValue": "3",
        "systemMessage": "{color}{player}使用了{character}的“{skill}”技能，从天而降摧毁了{point}的点，铛！",
        "enabled": true
      }
    },
    {
      "slug": "denia",
      "name": "达妮娅",
      "description": "“好困...能不能下快点，要睡着了...zzz”",
      "portraitUrl": "/assets/Danea_centered.webp",
      "portraitSource": "url",
      "acquisitionMethod": "初始获得",
      "cvName": "璃音",
      "cvUrl": "https://space.bilibili.com/68435776",
      "source": "default",
      "palette": "#f2a4d8",
      "enabled": true,
      "sortOrder": 1,
      "skill": {
        "effectType": "flip-stone",
        "name": "泡影幻梦",
        "description": "指定棋盘上的某个棋子，将其反色。\n超频：4",
        "uses": 1,
        "freeTurn": false,
        "targetRule": "stone",
        "paramsJson": "{}",
        "costType": "numeric",
        "costValue": "4",
        "systemMessage": "{fromColor}{player}使用了{character}的“{skill}”技能，诅咒{point}的{targetColor}，将其转变为了{toColor}。",
        "enabled": true
      }
    },
    {
      "slug": "aemeath",
      "name": "爱弥斯",
      "description": "“诶？我不会偷偷连katago的啦...”",
      "portraitUrl": "/assets/Aemeath_centered.webp",
      "portraitSource": "url",
      "acquisitionMethod": "初始获得",
      "cvName": "璃音",
      "cvUrl": "https://space.bilibili.com/68435776",
      "source": "default",
      "palette": "#67d9e8",
      "enabled": true,
      "sortOrder": 2,
      "skill": {
        "effectType": "hidden-hand",
        "name": "小爱出击",
        "description": "本轮落子为隐藏手。\n超频：0",
        "uses": 1,
        "freeTurn": false,
        "targetRule": "empty-point",
        "paramsJson": "{\"derivedSkills\":[{\"id\":\"voyage-star\",\"effectType\":\"voyage-star\",\"name\":\"远航星\",\"description\":\"派生技，仅限以“小爱出击”产生的隐藏手存在于场上且未暴露的情况下才可以使用。以该隐藏手为中心，抹除包括其在内的上下左右1路的交叉点；同时移除这些交叉点上下左右1路的棋子（该技能不消耗落子回合）。超频：5\",\"uses\":1,\"freeTurn\":true,\"targetRule\":\"none\",\"costType\":\"numeric\",\"costValue\":\"5\",\"musicTrackId\":\"aemeath-voyage-star-default\"}]}",
        "costType": "numeric",
        "costValue": "0",
        "systemMessage": "{color}{player}使用了{character}的“{skill}”技能，落下了幽灵般的一手，应该没人发现吧。。。",
        "enabled": true
      }
    },
    {
      "slug": "lynae",
      "name": "琳奈",
      "description": "“只有黑白色那多无趣啊，让我来加点色彩吧！”",
      "portraitUrl": "/assets/characters/lynae_centered.webp",
      "portraitSource": "url",
      "acquisitionMethod": "招募获得",
      "cvName": "云生",
      "cvUrl": "https://space.bilibili.com/37599062",
      "source": "default",
      "palette": "#38d7c2",
      "enabled": true,
      "sortOrder": 3,
      "skill": {
        "effectType": "spray-stone",
        "name": "流光溢彩",
        "description": "指定棋盘上一枚棋子，将其变成喷涂棋子（喷涂棋子：一种中立棋子）。同时，随机将棋盘上另一枚可视棋子也变成喷涂棋子。超频：2",
        "uses": 1,
        "freeTurn": false,
        "targetRule": "stone",
        "paramsJson": "{}",
        "costType": "numeric",
        "costValue": "2",
        "systemMessage": "{fromColor}{player}使用了{character}的“{skill}”技能，将棋盘上一些棋子撒上了颜料。",
        "enabled": true
      }
    },
    {
      "slug": "mornye",
      "name": "莫宁",
      "description": "“关于围棋和AI吗？AI的出现，并非是替人类踏尽了这片星空，而更像是在黑夜里递来的一架天文望远镜。透过它，我们第一次望见了那些曾隐没于深邃之中的天体、星云与遥远光带。然而，星系之间的航路，棋盘深处的奥秘，以及每一次落子时，人心与未知相遇的微光与震颤——这一切，并不会因那枚透镜而黯淡半分。人类仍可以在每一局棋的旅程中，凝望、诘问、反思，无止境地继续寻找只属于自己的答案。”",
      "portraitUrl": "/assets/characters/mornye.png",
      "portraitSource": "url",
      "acquisitionMethod": "招募获得",
      "cvName": "璃音",
      "cvUrl": "https://space.bilibili.com/68435776",
      "source": "default",
      "palette": "#8aa0ff",
      "enabled": true,
      "sortOrder": 4,
      "skill": {
        "effectType": "protocol-takeover",
        "name": "协议接管",
        "description": "指定棋盘一处空置交叉点，将其变为对方的禁入点（对方无法指定该交叉点落子或发动技能）（使用该技能不消耗本次落子）。超频：2",
        "uses": 1,
        "freeTurn": true,
        "targetRule": "empty-point",
        "paramsJson": "{}",
        "costType": "numeric",
        "costValue": "2",
        "systemMessage": "{fromColor}{player}使用了{character}的“{skill}”技能，对{point}点位进行了权限管制。",
        "enabled": true
      }
    },
    {
      "slug": "chisa",
      "name": "千咲",
      "description": "“嗯...我是听说参加围棋部有学分，所以就来了...还请多多指教。”",
      "portraitUrl": "/assets/characters/chisa.png",
      "portraitSource": "url",
      "acquisitionMethod": "招募获得",
      "cvName": "云生",
      "cvUrl": "https://space.bilibili.com/37599062",
      "source": "default",
      "palette": "#d74255",
      "enabled": true,
      "sortOrder": 5,
      "skill": {
        "effectType": "liberty-purge",
        "name": "虚湮解弦",
        "description": "指定一个有效交叉点落子，然后，移除场上所有仅剩1口气的棋块。每移除一颗非己方棋子，超频+1；每移除一颗己方棋子，超频-1。",
        "uses": 1,
        "freeTurn": false,
        "targetRule": "legal-move-point",
        "paramsJson": "{}",
        "costType": "numeric",
        "costValue": "0",
        "systemMessage": "{fromColor}{player}使用了{character}的“{skill}”技能，湮灭了棋盘上所有只剩1口气的棋块。",
        "enabled": true
      }
    },
    {
      "slug": "changli",
      "name": "长离",
      "description": "“听说这里有下围棋的地方，我就过来看看~”",
      "portraitUrl": "/assets/characters/changli.png",
      "portraitSource": "url",
      "acquisitionMethod": "招募获得",
      "cvName": "云生",
      "cvUrl": "https://space.bilibili.com/37599062",
      "source": "default",
      "palette": "#e96c7d",
      "enabled": true,
      "sortOrder": 6,
      "skill": {
        "effectType": "double-move",
        "name": "谋定后动",
        "description": "【仅限对手发动过主动技能后才可以发动】本回合，获得一把“飞刀”（可以连下2手）（使用该技能不消耗本次落子）。超频：3",
        "uses": 1,
        "freeTurn": true,
        "targetRule": "none",
        "paramsJson": "{\"moves\":2}",
        "costType": "numeric",
        "costValue": "3",
        "systemMessage": "{fromColor}{player}使用了{character}的“{skill}”技能，获得了一把“飞刀”。",
        "enabled": true
      }
    },
    {
      "slug": "qiuyuan",
      "name": "仇远",
      "description": "“黑白色的世界吗...其实我早就已经习惯了。”",
      "portraitUrl": "/assets/characters/qiuyuan.png",
      "portraitSource": "url",
      "acquisitionMethod": "招募获得",
      "cvName": "mo",
      "cvUrl": "",
      "source": "default",
      "palette": "#2f3a3d",
      "enabled": true,
      "sortOrder": 7,
      "skill": {
        "effectType": "row-slash",
        "name": "一斩足矣",
        "description": "指定棋盘上一枚棋子或交叉点，移除其所在行的所有棋子。每移除一枚棋子，超频+1。",
        "uses": 1,
        "freeTurn": false,
        "targetRule": "any-point",
        "paramsJson": "{}",
        "costType": "numeric",
        "costValue": "0",
        "systemMessage": "{fromColor}{player}使用了{character}的“{skill}”技能，一斩砍飞了一排棋子。",
        "enabled": true
      }
    },
    {
      "slug": "nabomo",
      "name": "娜波摩",
      "description": "“作为残星会会长，这种较量简直不在话下...啊，你说残星会是什么？怎么，有兴趣加入我创立的社团吗？”——在这个平行宇宙中，娜波摩不过是个喜欢说中二话的普通学生罢了。",
      "portraitUrl": "/assets/nabomo.webp",
      "portraitSource": "url",
      "acquisitionMethod": "首次升上6段后自动获得",
      "cvName": "璃音",
      "cvUrl": "https://space.bilibili.com/68435776",
      "source": "default",
      "palette": "#8fb4f7",
      "enabled": true,
      "sortOrder": 8,
      "skill": {
        "effectType": "color-illusion-passive",
        "name": "？？？",
        "description": "被动技。自己的落子有80%概率在对手视角里会变成对手棋子颜色。",
        "uses": 0,
        "freeTurn": true,
        "targetRule": "none",
        "paramsJson": "{\"probability\":0.8}",
        "costType": "numeric",
        "costValue": "0",
        "systemMessage": "{fromColor}{player}使用了{character}的“{skill}”技能，能看穿我是谁吗？",
        "enabled": true
      }
    },
    {
      "slug": "baconbits",
      "name": "猪小仙",
      "description": "“猪小仙必须得被打爆！”——莫名",
      "portraitUrl": "/assets/baconbits.webp",
      "portraitSource": "url",
      "acquisitionMethod": "？？？",
      "cvName": "",
      "cvUrl": "",
      "source": "default",
      "palette": "#f59ab2",
      "enabled": true,
      "sortOrder": 9,
      "skill": {
        "effectType": "random-blast",
        "name": "猪小仙爆炸",
        "description": "随机以某个场上棋子为目标（除一路的棋子外），移除其为中心的3*3区域的棋子（使用该技能不消耗本次落子）。\n超频：0",
        "uses": 1,
        "freeTurn": true,
        "targetRule": "none",
        "paramsJson": "{\"size\":3}",
        "costType": "numeric",
        "costValue": "0",
        "systemMessage": "{fromColor}{player}使用了{character}的“{skill}”技能，随机摧毁了一片区域的棋子。",
        "enabled": true
      }
    }
  ],
  "decorations": [
    {
      "slug": "codex-deco-906981",
      "name": "Codex Deco 69906981",
      "description": "smoke patch",
      "imageUrl": "/assets/decorations/paw-stone-preview.png",
      "source": "default",
      "enabled": true,
      "sortOrder": 998
    }
  ],
  "shopItems": [
    {
      "name": "猪小仙",
      "category": "character",
      "targetId": "baconbits",
      "itemTargetType": "self",
      "stockQuantity": -1,
      "priceCoins": 9999,
      "discountPercent": 0,
      "purchasable": false,
      "enabled": false,
      "sortOrder": 100,
      "description": "获得角色猪小仙。",
      "imageUrl": "/assets/baconbits.png",
      "illustName": "",
      "illustUrl": "",
      "source": "default"
    },
    {
      "name": "招新贴报",
      "category": "item",
      "targetId": "campus-recruitment-poster",
      "itemTargetType": "self",
      "stockQuantity": -1,
      "priceCoins": 120,
      "discountPercent": 0,
      "purchasable": true,
      "enabled": true,
      "sortOrder": 120,
      "description": "“老大，我们贴报画成这样，真的会有人来吗？”",
      "imageUrl": "/assets/items/recruitment-poster.webp",
      "illustName": "",
      "illustUrl": "",
      "source": "default"
    },
    {
      "name": "先约电台广播券",
      "category": "item",
      "targetId": "radio-recruitment-ticket",
      "itemTargetType": "self",
      "stockQuantity": -1,
      "priceCoins": 180,
      "discountPercent": 0,
      "purchasable": true,
      "enabled": true,
      "sortOrder": 121,
      "description": "可以使用一次先行公约的广播，似乎可以把消息发送到千里之外...",
      "imageUrl": "/assets/items/radio-recruitment-ticket.webp",
      "illustName": "",
      "illustUrl": "",
      "source": "default"
    },
    {
      "name": "彩虹豆豆跳跳糖",
      "category": "item",
      "targetId": "rainbow-bean-candy",
      "itemTargetType": "character",
      "stockQuantity": 99,
      "priceCoins": 10,
      "discountPercent": 0,
      "purchasable": true,
      "enabled": true,
      "sortOrder": 150,
      "description": "产地不明的糖果，据说有神秘的效果",
      "imageUrl": "/assets/items/rainbow-bean-candy.webp",
      "illustName": "",
      "illustUrl": "",
      "source": "default"
    },
    {
      "name": "爪印棋子",
      "category": "decoration",
      "targetId": "paw-stone",
      "itemTargetType": "self",
      "stockQuantity": -1,
      "priceCoins": 500,
      "discountPercent": 0,
      "purchasable": true,
      "enabled": true,
      "sortOrder": 200,
      "description": "曾经风靡一时，但现在过气了的猫爪棋子。",
      "imageUrl": "/assets/decorations/paw-stone-preview.png",
      "illustName": "",
      "illustUrl": "",
      "source": "default"
    },
    {
      "name": "耙耙柑和水蜜桃",
      "category": "decoration",
      "targetId": "papagan-peach-stone",
      "itemTargetType": "self",
      "stockQuantity": -1,
      "priceCoins": 1000,
      "discountPercent": 0,
      "purchasable": true,
      "enabled": true,
      "sortOrder": 201,
      "description": "吃过的人都说好！",
      "imageUrl": "/assets/decorations/papagan-peach-stone-preview.png",
      "illustName": "憨态喵",
      "illustUrl": "https://space.bilibili.com/392815021",
      "source": "default"
    },
    {
      "name": "肘我",
      "category": "music",
      "targetId": "qiuyuan-skill-zhouwo",
      "itemTargetType": "self",
      "stockQuantity": -1,
      "priceCoins": 800,
      "discountPercent": 0,
      "purchasable": true,
      "enabled": true,
      "sortOrder": 320,
      "description": "仇远的第二版技能 BGM",
      "imageUrl": "/assets/items/qiuyuan-zhouwo.webp",
      "illustName": "",
      "illustUrl": "",
      "source": "default"
    }
  ],
  "gachaPools": [
    {
      "id": "cmqb3hn4d00007kd0bprgqp6z",
      "name": "血亏卡池",
      "description": "大苏打实打实打算是",
      "enabled": true,
      "permanent": true,
      "singleDrawPrice": 50,
      "tenDrawPrice": 500,
      "featuredPrizeId": "cmqb3hn4i00027kd01666gee0",
      "featuredPrizeIds": "[\"cmqb3hn4i00027kd01666gee0\",\"cmqb3hn4l00067kd0nkrwkgra\",\"cmqb3hn4m00087kd02cu6z54p\"]",
      "sortOrder": 0,
      "startsAt": null,
      "endsAt": null,
      "prizes": [
        {
          "id": "cmqb3hn4i00027kd01666gee0",
          "type": "character",
          "targetId": "sigrika",
          "quantity": 1,
          "probabilityBasisPoints": 50,
          "enabled": true,
          "name": "西格莉卡",
          "imageUrl": "/assets/sigrika_centered.png",
          "sortOrder": 0
        },
        {
          "id": "cmqb3hn4k00047kd0op5deqxx",
          "type": "coins",
          "targetId": "",
          "quantity": 60,
          "probabilityBasisPoints": 2350,
          "enabled": true,
          "name": "金币奖励",
          "imageUrl": "",
          "sortOrder": 0
        },
        {
          "id": "cmqb3hn4l00067kd0nkrwkgra",
          "type": "decoration",
          "targetId": "papagan-peach-stone",
          "quantity": 1,
          "probabilityBasisPoints": 100,
          "enabled": true,
          "name": "耙耙柑和水蜜桃",
          "imageUrl": "/assets/decorations/papagan-peach-stone-preview.webp",
          "sortOrder": 0
        },
        {
          "id": "cmqb3hn4m00087kd02cu6z54p",
          "type": "character",
          "targetId": "denia",
          "quantity": 1,
          "probabilityBasisPoints": 50,
          "enabled": true,
          "name": "达妮娅",
          "imageUrl": "/assets/Danea_centered.png",
          "sortOrder": 0
        },
        {
          "id": "cmqb3hn4n000a7kd08mtohpfd",
          "type": "character",
          "targetId": "aemeath",
          "quantity": 1,
          "probabilityBasisPoints": 50,
          "enabled": true,
          "name": "爱弥斯",
          "imageUrl": "/assets/Aemeath_centered.png",
          "sortOrder": 0
        },
        {
          "id": "cmqb3hn4n000c7kd060dlgfvq",
          "type": "character",
          "targetId": "baconbits",
          "quantity": 1,
          "probabilityBasisPoints": 50,
          "enabled": true,
          "name": "猪小仙",
          "imageUrl": "/assets/baconbits.png",
          "sortOrder": 0
        },
        {
          "id": "cmqb3hn4o000e7kd0hn39dbd2",
          "type": "character",
          "targetId": "nabomo",
          "quantity": 1,
          "probabilityBasisPoints": 50,
          "enabled": true,
          "name": "娜波摩",
          "imageUrl": "/assets/nabomo.png",
          "sortOrder": 0
        },
        {
          "id": "cmqb3hn4p000g7kd0a0mowmce",
          "type": "item",
          "targetId": "rainbow-bean-candy",
          "quantity": 3,
          "probabilityBasisPoints": 5000,
          "enabled": true,
          "name": "彩虹豆豆跳跳糖",
          "imageUrl": "/assets/items/rainbow-bean-candy.png",
          "sortOrder": 0
        },
        {
          "id": "cmqb3hn4q000i7kd06izorcqp",
          "type": "decoration",
          "targetId": "paw-stone",
          "quantity": 1,
          "probabilityBasisPoints": 300,
          "enabled": true,
          "name": "爪印棋子",
          "imageUrl": "/assets/decorations/paw-stone-preview.webp",
          "sortOrder": 0
        },
        {
          "id": "cmqb3hn4r000k7kd0qts1v6ll",
          "type": "coins",
          "targetId": "",
          "quantity": 40,
          "probabilityBasisPoints": 2000,
          "enabled": true,
          "name": "金币奖励",
          "imageUrl": "",
          "sortOrder": 0
        }
      ]
    }
  ],
  "achievementRewardAssets": [
    {
      "id": "reward-denia-rainbow-bean-candy-coins",
      "type": "currency",
      "name": "你给我吃了什么！？奖励",
      "description": "请达妮娅吃了彩虹豆豆跳跳糖",
      "imageUrl": "",
      "text": "100 金币",
      "targetType": "coins",
      "targetId": "",
      "amount": 100,
      "enabled": true,
      "sortOrder": 100,
      "deletedAt": null
    },
    {
      "id": "reward-sigrika-spark-100-wins-nameplate",
      "type": "nameplate",
      "name": "点亮语义！",
      "description": "使用西格莉卡在星炬对弈中获得100胜",
      "imageUrl": "/assets/achievements/semantic-nameplate.png",
      "text": "用户名背景",
      "targetType": "",
      "targetId": "",
      "amount": 0,
      "enabled": true,
      "sortOrder": 110,
      "deletedAt": null
    }
  ],
  "achievements": [
    {
      "id": "achievement-denia-rainbow-bean-candy",
      "key": "denia-rainbow-bean-candy",
      "name": "你给我吃了什么！？",
      "content": "请达妮娅吃了彩虹豆豆跳跳糖",
      "conditionType": "trigger_event",
      "conditionParams": "{\"event\":\"denia-rainbow-bean-candy\"}",
      "rewardAssetId": "reward-denia-rainbow-bean-candy-coins",
      "enabled": true,
      "sortOrder": 100,
      "deletedAt": null
    },
    {
      "id": "achievement-sigrika-spark-100-wins",
      "key": "sigrika-spark-100-wins",
      "name": "点亮语义！",
      "content": "使用西格莉卡在星炬对弈中获得100胜",
      "conditionType": "mode_character_wins",
      "conditionParams": "{\"mode\":\"spark\",\"characterId\":\"sigrika\",\"value\":100}",
      "rewardAssetId": "reward-sigrika-spark-100-wins-nameplate",
      "enabled": true,
      "sortOrder": 110,
      "deletedAt": null
    }
  ],
  "musicTrackSettings": [
    {
      "id": "aemeath-skill-default",
      "displayName": "靛青宇宙"
    },
    {
      "id": "aemeath-voyage-star-default",
      "displayName": "「拉海洛」之心"
    },
    {
      "id": "baconbits-skill-default",
      "displayName": "焼き立てポークシー"
    },
    {
      "id": "battle-default",
      "displayName": "山霁浮古今"
    },
    {
      "id": "changli-skill-default",
      "displayName": "炽羽策阵星"
    },
    {
      "id": "chisa-skill-default",
      "displayName": "无人之境的新花"
    },
    {
      "id": "denia-skill-default",
      "displayName": "枯音泡影无凭裂章"
    },
    {
      "id": "home-default",
      "displayName": "庆典爱丽丝"
    },
    {
      "id": "lynae-skill-default",
      "displayName": "Deadline Disco"
    },
    {
      "id": "mornye-skill-default",
      "displayName": "若能触及群星"
    },
    {
      "id": "nabomo-skill-default",
      "displayName": "？？？"
    },
    {
      "id": "qiuyuan-skill-default",
      "displayName": "剑匣破"
    },
    {
      "id": "sigrika-skill-default",
      "displayName": "致那暖明黄金"
    }
  ],
  "storyScripts": [
    {
      "id": "item.rainbow-bean-candy.denia",
      "key": "item.rainbow-bean-candy.denia",
      "title": "达妮娅的彩虹豆豆跳跳糖",
      "triggerType": "item-character-use",
      "triggerParamsJson": "{\"itemId\":\"rainbow-bean-candy\",\"characterId\":\"denia\"}",
      "draftStartNodeId": "start",
      "draftInitialBoardJson": "",
      "draftNodesJson": "[{\"id\":\"start\",\"speakerName\":\"达妮娅\",\"characterId\":\"denia\",\"text\":\"zzz...zzz...\",\"nextNodeId\":\"\",\"options\":[{\"label\":\"偷偷把彩虹糖塞进达妮娅嘴里\",\"nextNodeId\":\"node-2\"}]},{\"id\":\"node-2\",\"speakerName\":\"\",\"characterId\":\"denia\",\"text\":\"唔！咕咕！（咽下）\",\"nextNodeId\":\"node-3\",\"options\":[]},{\"id\":\"node-3\",\"speakerName\":\"达妮娅\",\"characterId\":\"denia-rainbow-glow\",\"text\":\"{username}！你给我吃了什么！\",\"nextNodeId\":\"\",\"options\":[{\"label\":\"泥给卢达哟\",\"nextNodeId\":\"\"}]}]",
      "isPublished": true,
      "publishedStartNodeId": "start",
      "publishedInitialBoardJson": "",
      "publishedNodesJson": "[{\"id\":\"start\",\"speakerName\":\"达妮娅\",\"characterId\":\"denia\",\"text\":\"zzz...zzz...\",\"nextNodeId\":\"\",\"options\":[{\"label\":\"偷偷把彩虹糖塞进达妮娅嘴里\",\"nextNodeId\":\"node-2\"}]},{\"id\":\"node-2\",\"speakerName\":\"\",\"characterId\":\"denia\",\"text\":\"唔！咕咕！（咽下）\",\"nextNodeId\":\"node-3\",\"options\":[]},{\"id\":\"node-3\",\"speakerName\":\"达妮娅\",\"characterId\":\"denia-rainbow-glow\",\"text\":\"{username}！你给我吃了什么！\",\"nextNodeId\":\"\",\"options\":[{\"label\":\"泥给卢达哟\",\"nextNodeId\":\"\"}]}]",
      "firstPublishedAt": "2026-06-28T14:02:27.086Z",
      "publishedAt": "2026-06-28T14:50:54.569Z"
    },
    {
      "id": "item.rainbow-bean-candy.sigrika",
      "key": "item.rainbow-bean-candy.sigrika",
      "title": "西格莉卡的彩虹豆豆跳跳糖",
      "triggerType": "item-character-use",
      "triggerParamsJson": "{\"itemId\":\"rainbow-bean-candy\",\"characterId\":\"sigrika\"}",
      "draftStartNodeId": "start",
      "draftInitialBoardJson": "null",
      "draftNodesJson": "[{\"id\":\"start\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"这是什么糖果？等一下，我怎么一直在打嗝！\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-2\",\"options\":[]},{\"id\":\"story-2\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"西格莉卡边打嗝边跑掉了，可能是找陆医生去了...暂时没法找她下棋了。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[]}]",
      "isPublished": true,
      "publishedStartNodeId": "start",
      "publishedInitialBoardJson": "null",
      "publishedNodesJson": "[{\"id\":\"start\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"这是什么糖果？等一下，我怎么一直在打嗝！\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-2\",\"options\":[]},{\"id\":\"story-2\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"西格莉卡边打嗝边跑掉了，可能是找陆医生去了...暂时没法找她下棋了。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[]}]",
      "firstPublishedAt": "2026-06-28T14:02:27.073Z",
      "publishedAt": "2026-07-06T09:09:25.846Z"
    },
    {
      "id": "onboarding.default",
      "key": "onboarding.default",
      "title": "新手引导",
      "triggerType": "onboarding",
      "triggerParamsJson": "{}",
      "draftStartNodeId": "node-1",
      "draftInitialBoardJson": "null",
      "draftNodesJson": "[{\"id\":\"node-1\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"哇，来了新的同学耶！是{username}同学吗？\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-2\",\"options\":[{\"label\":\"你怎么知道的\",\"nextNodeId\":\"node-2\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"node-2\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"嘿嘿，我注意到你身上挂着的学生证。我们这里是星炬学院围棋部，请问{username}是想加入我们围棋部吗？\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-3\",\"options\":[{\"label\":\"是的\",\"nextNodeId\":\"node-3\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"node-3\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"那太好了！那请问{username}你会下围棋吗？水平怎么样？\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[{\"label\":\"其实我完全不会下围棋...\",\"nextNodeId\":\"node-4\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"},{\"label\":\"略懂一些\",\"nextNodeId\":\"story-46\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"},{\"label\":\"我超强的哦!\",\"nextNodeId\":\"story-15\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"node-4\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"是新手啊...没事的，我可以手把手教你！\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-4-1\",\"options\":[]},{\"id\":\"node-4-1\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"long-text-compress-portrait\",\"text\":\"围棋呢，是由黑白双方在棋盘的交叉点上轮流落子，通常黑棋先行，白棋后行。棋子一旦落在棋盘上，原则上不能移动，只能通过后续行棋来扩大自己的势力或限制对方。棋子上下左右相邻的空点叫作“气”，同色棋子如果横向或纵向相连，就组成一块棋，并共同拥有这些气。只要一块棋还有气，它就能留在棋盘上；如果它的气被对方全部占住，就要被提掉，这叫“提子”。落子时要注意，不能把自己的棋下到完全没有气的位置，这种点通常叫“禁入点”。不过，如果这一手能同时提掉对方棋子，使自己的棋重新获得气，那就是可以下的。围棋中还有“劫”的规则：如果双方反复在同一处立即提来提去，棋局就会无限重复，所以被提的一方不能马上提回，必须先在别处下一手。围棋的目标不是单纯吃子，而是在保证自己棋子存活的基础上，尽量围取更多地域。棋盘上由己方棋子围住、对方无法有效进入的空点，通常称为“目”。到了双方都认为继续落子已经没有收益时，棋局进入终局，需要确认哪些棋是活棋，哪些棋是死棋。最后根据所采用的规则，按“数目”或“数子”的方式计算胜负，并把白棋的“贴目”加入结果中。总数较多的一方获胜......\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-4-2\",\"options\":[{\"label\":\"...\",\"nextNodeId\":\"node-4-2\",\"revealDelaySeconds\":2,\"transitionDelaySeconds\":\"\"}]},{\"id\":\"story-15\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"这么厉害的吗？哼哼，那要不现在跟我下一盘试试看？\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-16\",\"options\":[]},{\"id\":\"story-16\",\"name\":\"\",\"type\":\"board-setup\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"sigrika\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":2,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":{\"mode\":\"spark\",\"stones\":[{\"pointId\":\"2,2\",\"color\":\"white\"},{\"pointId\":\"5,3\",\"color\":\"white\"},{\"pointId\":\"6,3\",\"color\":\"black\"},{\"pointId\":\"9,3\",\"color\":\"black\"},{\"pointId\":\"4,4\",\"color\":\"white\"},{\"pointId\":\"5,4\",\"color\":\"black\"},{\"pointId\":\"6,4\",\"color\":\"black\"},{\"pointId\":\"7,4\",\"color\":\"white\"},{\"pointId\":\"3,5\",\"color\":\"white\"},{\"pointId\":\"4,5\",\"color\":\"black\"},{\"pointId\":\"5,5\",\"color\":\"black\"},{\"pointId\":\"6,5\",\"color\":\"white\"},{\"pointId\":\"1,6\",\"color\":\"white\"},{\"pointId\":\"2,6\",\"color\":\"white\"},{\"pointId\":\"3,6\",\"color\":\"black\"},{\"pointId\":\"4,6\",\"color\":\"black\"},{\"pointId\":\"5,6\",\"color\":\"white\"},{\"pointId\":\"1,7\",\"color\":\"black\"},{\"pointId\":\"2,7\",\"color\":\"white\"},{\"pointId\":\"3,7\",\"color\":\"black\"},{\"pointId\":\"4,7\",\"color\":\"white\"},{\"pointId\":\"2,8\",\"color\":\"black\"},{\"pointId\":\"3,8\",\"color\":\"white\"},{\"pointId\":\"2,9\",\"color\":\"black\"},{\"pointId\":\"3,9\",\"color\":\"white\"},{\"pointId\":\"2,10\",\"color\":\"black\"},{\"pointId\":\"3,10\",\"color\":\"white\"},{\"pointId\":\"9,10\",\"color\":\"black\"},{\"pointId\":\"1,11\",\"color\":\"black\"},{\"pointId\":\"3,11\",\"color\":\"black\"},{\"pointId\":\"4,11\",\"color\":\"white\"},{\"pointId\":\"2,12\",\"color\":\"black\"}]},\"nextNodeId\":\"story-17\",\"options\":[]},{\"id\":\"story-17\",\"name\":\"\",\"type\":\"npc-move\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"打吃！\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"6,2\",\"color\":\"white\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-18\",\"options\":[]},{\"id\":\"story-18\",\"name\":\"\",\"type\":\"player-move\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"7,3\",\"color\":\"black\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-24\",\"options\":[]},{\"id\":\"story-24\",\"name\":\"\",\"type\":\"npc-move\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"再打吃！\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"8,3\",\"color\":\"white\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":2,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-26\",\"options\":[]},{\"id\":\"story-26\",\"name\":\"\",\"type\":\"player-choice\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-25\",\"options\":[{\"label\":\"...\",\"nextNodeId\":\"branch-25\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":0.1}]},{\"id\":\"story-25\",\"name\":\"\",\"type\":\"player-move\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"7,2\",\"color\":\"black\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-46\",\"options\":[]},{\"id\":\"story-46\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"那看来你应该已经懂围棋规则了。要不跟我实战下一盘怎么样？\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-21\",\"options\":[{\"label\":\"好的\",\"nextNodeId\":\"story-16\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"story-21\",\"name\":\"\",\"type\":\"npc-skill\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"sigrika\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"哼哼，现在让你看看我的本领！\",\"wrongClickMessage\":\"\",\"pointId\":\"7,1\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-22\",\"options\":[]},{\"id\":\"story-22\",\"name\":\"\",\"type\":\"npc-move\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"8,2\",\"color\":\"white\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[]},{\"id\":\"node-4-2\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"denia\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"西西，你这样介绍，人家听不懂的啦...\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-4-3\",\"options\":[]},{\"id\":\"node-4-3\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"诶，这样的吗？我是按照莫宁教授上课的口吻说的，还以为说的很详细了。嗯，那我想想...\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-4-4\",\"options\":[]},{\"id\":\"node-4-4\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"打个比方呢，围棋就像两队黑白小鸟在棋盘上“抢地盘”。黑棋先走，白棋后走，大家轮流把棋子放在交叉点上，放下去就不能搬家啦。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-4-4-1\",\"options\":[]},{\"id\":\"node-4-5\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"围棋基础规则还是简单的。难点就是如何去高效地抢地盘，这个学问就多了...\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-4-6\",\"options\":[]},{\"id\":\"node-4-6\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"达妮娅\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"不要把围棋想得太难哦。当初西西手把手教我下围棋，我也只花了半天时间就学会了。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-4-7\",\"options\":[]},{\"id\":\"node-4-7\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"那不是我教的好的缘故啦...对了，如果有不懂的地方，我们部有很多棋书，可以随便看哦。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-4-8\",\"options\":[]},{\"id\":\"node-4-8\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"不过呢，想学一门东西的话还是得多实践才重要！所以平时也要多来下棋哦！\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[]},{\"id\":\"node-4-4-1\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"每颗棋子旁边上下左右的空点叫“气”，有气才能活；如果一片棋子的气全被对方堵住，就会被“吃掉”，乖乖拿出棋盘。下棋时不能让自己的棋子刚落下就没气，这个点就叫禁入点。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-4-4-2\",\"options\":[]},{\"id\":\"node-4-4-2\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"等下到双方都觉得“嗯，没啥好占的了”，就可以停手数地盘，比看谁围住的空点更多。简单说，围得多、活得稳、吃得巧的一方就是赢家。围棋不只是打架，更像一场安静又聪明的圈地小冒险~\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-4-5\",\"options\":[]},{\"id\":\"branch-25\",\"name\":\"\",\"type\":\"player-choice\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[{\"label\":\"呃...你真的会下棋吗？这不是明显征不掉吗？\",\"nextNodeId\":\"branch-26\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"branch-26\",\"name\":\"\",\"type\":\"player-move\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"7,2\",\"color\":\"black\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":2,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-27\",\"options\":[]},{\"id\":\"story-27\",\"name\":\"\",\"type\":\"npc-dialogue\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"哼哼，不要小瞧我！\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":1,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-28\",\"options\":[]},{\"id\":\"story-28\",\"name\":\"\",\"type\":\"npc-dialogue\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"看看这招！\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":1,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-29\",\"options\":[]},{\"id\":\"story-29\",\"name\":\"\",\"type\":\"npc-skill\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"sigrika\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"7,1\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-30\",\"options\":[]},{\"id\":\"story-30\",\"name\":\"\",\"type\":\"npc-move\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"8,2\",\"color\":\"white\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":2,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-31\",\"options\":[]},{\"id\":\"story-31\",\"name\":\"\",\"type\":\"player-choice\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[{\"label\":\"啊？\",\"nextNodeId\":\"branch-32\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"branch-32\",\"name\":\"\",\"type\":\"player-choice\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[{\"label\":\"这是作弊了吧！\",\"nextNodeId\":\"branch-33\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"branch-33\",\"name\":\"\",\"type\":\"npc-dialogue\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"这你就不懂啦。这是我的共鸣技能【星辉符文】，可以抹除棋盘上的一个交叉点，然后还可以继续落子。这样的话你只有两口气的棋，我一回合就可以消灭掉哦~\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-34\",\"options\":[]},{\"id\":\"story-34\",\"name\":\"\",\"type\":\"npc-dialogue\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"这就是我们星炬围棋的特殊之处，可以让共鸣能力和棋盘共融，产生意想不到的战术效果~\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-35\",\"options\":[]},{\"id\":\"story-35\",\"name\":\"\",\"type\":\"npc-dialogue\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"不过呢，这些技能通常只能一盘棋使用一次，而且有些技能会有超频的负面代价。比如我使用的这个技能，超频为3，代表我到数子阶段要多贴你3个子，相当于6目棋呢。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":0,\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-36\",\"options\":[]},{\"id\":\"story-36\",\"name\":\"\",\"type\":\"npc-dialogue\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"所以考虑使用技能的场合、判断得失，也是在我们星炬围棋需要思考的博弈的一环呢。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":2,\"autoContinueDelaySeconds\":1,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[{\"label\":\"听起来挺有趣的...\",\"nextNodeId\":\"branch-37\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"branch-37\",\"name\":\"\",\"type\":\"player-choice\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[{\"label\":\"不过现在死了这么多棋，只能认输了...\",\"nextNodeId\":\"branch-38\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"branch-38\",\"name\":\"\",\"type\":\"resign\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"请点击认输键\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"black\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"player\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":2,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-39\",\"options\":[]},{\"id\":\"story-39\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"怎么样，这下对我们围棋部应该有所了解了吧。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-47\",\"options\":[]},{\"id\":\"story-40\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"咳咳。总之，我们围棋部还有好多部员，每个部员都有不同的共鸣能力技能。{username}同学以后可以多去认识认识~\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-43\",\"options\":[]},{\"id\":\"story-47\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"噢，对了。娅娅，快醒醒，该到你展示的时候了\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-48\",\"options\":[]},{\"id\":\"story-48\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"denia\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"...嗯？怎么，要我做什么吗？\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-49\",\"options\":[]},{\"id\":\"story-49\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"来跟我下一盘，给{username}同学展示一下你的能力~\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-50\",\"options\":[]},{\"id\":\"story-50\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"denia\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"呜哇，好麻烦。好吧。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-51\",\"options\":[]},{\"id\":\"story-51\",\"name\":\"\",\"type\":\"board-setup\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"white\",\"playerCharacterId\":\"denia\",\"npcCharacterId\":\"sigrika\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":4,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":{\"mode\":\"spark\",\"stones\":[{\"pointId\":\"8,1\",\"color\":\"black\"},{\"pointId\":\"3,2\",\"color\":\"white\"},{\"pointId\":\"9,2\",\"color\":\"black\"},{\"pointId\":\"10,2\",\"color\":\"white\"},{\"pointId\":\"6,3\",\"color\":\"black\"},{\"pointId\":\"7,3\",\"color\":\"white\"},{\"pointId\":\"8,3\",\"color\":\"white\"},{\"pointId\":\"9,3\",\"color\":\"black\"},{\"pointId\":\"10,3\",\"color\":\"white\"},{\"pointId\":\"2,4\",\"color\":\"black\"},{\"pointId\":\"6,4\",\"color\":\"white\"},{\"pointId\":\"7,4\",\"color\":\"black\"},{\"pointId\":\"8,4\",\"color\":\"black\"},{\"pointId\":\"9,4\",\"color\":\"white\"},{\"pointId\":\"10,4\",\"color\":\"white\"},{\"pointId\":\"11,4\",\"color\":\"black\"},{\"pointId\":\"6,5\",\"color\":\"white\"},{\"pointId\":\"7,5\",\"color\":\"black\"},{\"pointId\":\"8,5\",\"color\":\"white\"},{\"pointId\":\"9,5\",\"color\":\"black\"},{\"pointId\":\"10,5\",\"color\":\"black\"},{\"pointId\":\"11,5\",\"color\":\"white\"},{\"pointId\":\"5,6\",\"color\":\"white\"},{\"pointId\":\"6,6\",\"color\":\"black\"},{\"pointId\":\"7,6\",\"color\":\"black\"},{\"pointId\":\"8,6\",\"color\":\"white\"},{\"pointId\":\"11,6\",\"color\":\"black\"},{\"pointId\":\"4,7\",\"color\":\"white\"},{\"pointId\":\"5,7\",\"color\":\"black\"},{\"pointId\":\"6,7\",\"color\":\"black\"},{\"pointId\":\"7,7\",\"color\":\"white\"},{\"pointId\":\"3,8\",\"color\":\"white\"},{\"pointId\":\"4,8\",\"color\":\"black\"},{\"pointId\":\"5,8\",\"color\":\"black\"},{\"pointId\":\"6,8\",\"color\":\"white\"},{\"pointId\":\"2,9\",\"color\":\"white\"},{\"pointId\":\"4,9\",\"color\":\"black\"},{\"pointId\":\"5,9\",\"color\":\"white\"},{\"pointId\":\"4,10\",\"color\":\"white\"},{\"pointId\":\"9,10\",\"color\":\"black\"}]},\"nextNodeId\":\"story-52\",\"options\":[]},{\"id\":\"story-52\",\"name\":\"\",\"type\":\"player-choice\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-41\",\"options\":[{\"label\":\"怎么又是这种征子局面...\",\"nextNodeId\":\"story-53\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"story-54\",\"name\":\"学会\",\"type\":\"npc-dialogue\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"嘿嘿，看来你已经学会了嘛！\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":1,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-55\",\"options\":[]},{\"id\":\"story-55\",\"name\":\"\",\"type\":\"npc-skill\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"sigrika\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"5,10\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-56\",\"options\":[]},{\"id\":\"story-56\",\"name\":\"\",\"type\":\"npc-move\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"6,9\",\"color\":\"black\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":3,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-57\",\"options\":[]},{\"id\":\"story-57\",\"name\":\"\",\"type\":\"player-choice\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[{\"label\":\"黑棋死里逃生了，这下白棋应该不行了\",\"nextNodeId\":\"story-58\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"story-58\",\"name\":\"\",\"type\":\"npc-dialogue\",\"speakerName\":\"\",\"characterId\":\"denia\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"嗯哼？\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-59\",\"options\":[]},{\"id\":\"story-59\",\"name\":\"\",\"type\":\"player-skill\",\"speakerName\":\"\",\"characterId\":\"denia\",\"skillCharacterId\":\"denia\",\"skillId\":\"denia\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"请点击技能按钮，然后选择目标棋子\",\"wrongClickMessage\":\"\",\"pointId\":\"5,8\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":3,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-60\",\"options\":[]},{\"id\":\"story-60\",\"name\":\"\",\"type\":\"player-choice\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[{\"label\":\"哇，好酷炫！这就是达妮娅的技能吗！\",\"nextNodeId\":\"story-61\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"story-61\",\"name\":\"反色\",\"type\":\"npc-dialogue\",\"speakerName\":\"\",\"characterId\":\"denia\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"是的，我的技能是让场上一枚棋子反色。不过使用这个技能的回合我不能继续落子就是了。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-62\",\"options\":[]},{\"id\":\"story-62\",\"name\":\"没法继续\",\"type\":\"npc-dialogue\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"呃，娅娅的技能还是太超模了，这棋可没法继续下了...\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-63\",\"options\":[]},{\"id\":\"story-63\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"denia\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"（哈欠）下盘棋真的好累啊。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-64\",\"options\":[]},{\"id\":\"story-64\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"呜...这盘棋只是给{username}同学演示一下啦。认真下的话，刚刚我应该用技能去吃上面的2个子的，这样就不会被一口气反吃了。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-40\",\"options\":[]},{\"id\":\"story-53\",\"name\":\"我懂了\",\"type\":\"player-choice\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[{\"label\":\"啊，我懂了，你要发动那个了是吧\",\"nextNodeId\":\"story-54\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"story-41\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"denia\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"比如我的共鸣技能是让棋盘上一颗棋子反色哦~虽然用了这技能以后不能再落子就是了。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-42\",\"options\":[]},{\"id\":\"story-42\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"娅娅的技能说实话实战能力挺强的...我好多大优的棋，被她使用技能逆转了好多次...真是好赖皮的技能！\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-43\",\"options\":[]},{\"id\":\"story-43\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"另外呢，我们围棋部也可以下正常的19路的标准围棋哦~如果是下这个的话，我们大家都约定好了，不允许使用技能。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-44\",\"options\":[]},{\"id\":\"story-44\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"如果下围棋下累了，还可以下下五子棋放松一下~\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-45\",\"options\":[]},{\"id\":\"story-45\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"哦对了，忘记自我介绍了。我是星炬学院围棋部部长，西格莉卡！{username}同学，以后还请多多指教呢！\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[]}]",
      "isPublished": true,
      "publishedStartNodeId": "node-1",
      "publishedInitialBoardJson": "null",
      "publishedNodesJson": "[{\"id\":\"node-1\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"哇，来了新的同学耶！是{username}同学吗？\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-2\",\"options\":[{\"label\":\"你怎么知道的\",\"nextNodeId\":\"node-2\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"node-2\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"嘿嘿，我注意到你身上挂着的学生证。我们这里是星炬学院围棋部，请问{username}是想加入我们围棋部吗？\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-3\",\"options\":[{\"label\":\"是的\",\"nextNodeId\":\"node-3\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"node-3\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"那太好了！那请问{username}你会下围棋吗？水平怎么样？\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[{\"label\":\"其实我完全不会下围棋...\",\"nextNodeId\":\"node-4\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"},{\"label\":\"略懂一些\",\"nextNodeId\":\"story-46\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"},{\"label\":\"我超强的哦!\",\"nextNodeId\":\"story-15\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"node-4\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"是新手啊...没事的，我可以手把手教你！\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-4-1\",\"options\":[]},{\"id\":\"node-4-1\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"long-text-compress-portrait\",\"text\":\"围棋呢，是由黑白双方在棋盘的交叉点上轮流落子，通常黑棋先行，白棋后行。棋子一旦落在棋盘上，原则上不能移动，只能通过后续行棋来扩大自己的势力或限制对方。棋子上下左右相邻的空点叫作“气”，同色棋子如果横向或纵向相连，就组成一块棋，并共同拥有这些气。只要一块棋还有气，它就能留在棋盘上；如果它的气被对方全部占住，就要被提掉，这叫“提子”。落子时要注意，不能把自己的棋下到完全没有气的位置，这种点通常叫“禁入点”。不过，如果这一手能同时提掉对方棋子，使自己的棋重新获得气，那就是可以下的。围棋中还有“劫”的规则：如果双方反复在同一处立即提来提去，棋局就会无限重复，所以被提的一方不能马上提回，必须先在别处下一手。围棋的目标不是单纯吃子，而是在保证自己棋子存活的基础上，尽量围取更多地域。棋盘上由己方棋子围住、对方无法有效进入的空点，通常称为“目”。到了双方都认为继续落子已经没有收益时，棋局进入终局，需要确认哪些棋是活棋，哪些棋是死棋。最后根据所采用的规则，按“数目”或“数子”的方式计算胜负，并把白棋的“贴目”加入结果中。总数较多的一方获胜......\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-4-2\",\"options\":[{\"label\":\"...\",\"nextNodeId\":\"node-4-2\",\"revealDelaySeconds\":2,\"transitionDelaySeconds\":\"\"}]},{\"id\":\"story-15\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"这么厉害的吗？哼哼，那要不现在跟我下一盘试试看？\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-16\",\"options\":[]},{\"id\":\"story-16\",\"name\":\"\",\"type\":\"board-setup\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"sigrika\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":2,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":{\"mode\":\"spark\",\"stones\":[{\"pointId\":\"2,2\",\"color\":\"white\"},{\"pointId\":\"5,3\",\"color\":\"white\"},{\"pointId\":\"6,3\",\"color\":\"black\"},{\"pointId\":\"9,3\",\"color\":\"black\"},{\"pointId\":\"4,4\",\"color\":\"white\"},{\"pointId\":\"5,4\",\"color\":\"black\"},{\"pointId\":\"6,4\",\"color\":\"black\"},{\"pointId\":\"7,4\",\"color\":\"white\"},{\"pointId\":\"3,5\",\"color\":\"white\"},{\"pointId\":\"4,5\",\"color\":\"black\"},{\"pointId\":\"5,5\",\"color\":\"black\"},{\"pointId\":\"6,5\",\"color\":\"white\"},{\"pointId\":\"1,6\",\"color\":\"white\"},{\"pointId\":\"2,6\",\"color\":\"white\"},{\"pointId\":\"3,6\",\"color\":\"black\"},{\"pointId\":\"4,6\",\"color\":\"black\"},{\"pointId\":\"5,6\",\"color\":\"white\"},{\"pointId\":\"1,7\",\"color\":\"black\"},{\"pointId\":\"2,7\",\"color\":\"white\"},{\"pointId\":\"3,7\",\"color\":\"black\"},{\"pointId\":\"4,7\",\"color\":\"white\"},{\"pointId\":\"2,8\",\"color\":\"black\"},{\"pointId\":\"3,8\",\"color\":\"white\"},{\"pointId\":\"2,9\",\"color\":\"black\"},{\"pointId\":\"3,9\",\"color\":\"white\"},{\"pointId\":\"2,10\",\"color\":\"black\"},{\"pointId\":\"3,10\",\"color\":\"white\"},{\"pointId\":\"9,10\",\"color\":\"black\"},{\"pointId\":\"1,11\",\"color\":\"black\"},{\"pointId\":\"3,11\",\"color\":\"black\"},{\"pointId\":\"4,11\",\"color\":\"white\"},{\"pointId\":\"2,12\",\"color\":\"black\"}]},\"nextNodeId\":\"story-17\",\"options\":[]},{\"id\":\"story-17\",\"name\":\"\",\"type\":\"npc-move\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"打吃！\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"6,2\",\"color\":\"white\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-18\",\"options\":[]},{\"id\":\"story-18\",\"name\":\"\",\"type\":\"player-move\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"7,3\",\"color\":\"black\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-24\",\"options\":[]},{\"id\":\"story-24\",\"name\":\"\",\"type\":\"npc-move\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"再打吃！\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"8,3\",\"color\":\"white\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":2,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-26\",\"options\":[]},{\"id\":\"story-26\",\"name\":\"\",\"type\":\"player-choice\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-25\",\"options\":[{\"label\":\"...\",\"nextNodeId\":\"branch-25\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":0.1}]},{\"id\":\"story-25\",\"name\":\"\",\"type\":\"player-move\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"7,2\",\"color\":\"black\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-46\",\"options\":[]},{\"id\":\"story-46\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"那看来你应该已经懂围棋规则了。要不跟我实战下一盘怎么样？\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-21\",\"options\":[{\"label\":\"好的\",\"nextNodeId\":\"story-16\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"story-21\",\"name\":\"\",\"type\":\"npc-skill\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"sigrika\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"哼哼，现在让你看看我的本领！\",\"wrongClickMessage\":\"\",\"pointId\":\"7,1\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-22\",\"options\":[]},{\"id\":\"story-22\",\"name\":\"\",\"type\":\"npc-move\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"8,2\",\"color\":\"white\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[]},{\"id\":\"node-4-2\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"denia\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"西西，你这样介绍，人家听不懂的啦...\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-4-3\",\"options\":[]},{\"id\":\"node-4-3\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"诶，这样的吗？我是按照莫宁教授上课的口吻说的，还以为说的很详细了。嗯，那我想想...\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-4-4\",\"options\":[]},{\"id\":\"node-4-4\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"打个比方呢，围棋就像两队黑白小鸟在棋盘上“抢地盘”。黑棋先走，白棋后走，大家轮流把棋子放在交叉点上，放下去就不能搬家啦。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-4-4-1\",\"options\":[]},{\"id\":\"node-4-5\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"围棋基础规则还是简单的。难点就是如何去高效地抢地盘，这个学问就多了...\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-4-6\",\"options\":[]},{\"id\":\"node-4-6\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"达妮娅\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"不要把围棋想得太难哦。当初西西手把手教我下围棋，我也只花了半天时间就学会了。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-4-7\",\"options\":[]},{\"id\":\"node-4-7\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"那不是我教的好的缘故啦...对了，如果有不懂的地方，我们部有很多棋书，可以随便看哦。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-4-8\",\"options\":[]},{\"id\":\"node-4-8\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"不过呢，想学一门东西的话还是得多实践才重要！所以平时也要多来下棋哦！\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[]},{\"id\":\"node-4-4-1\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"每颗棋子旁边上下左右的空点叫“气”，有气才能活；如果一片棋子的气全被对方堵住，就会被“吃掉”，乖乖拿出棋盘。下棋时不能让自己的棋子刚落下就没气，这个点就叫禁入点。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-4-4-2\",\"options\":[]},{\"id\":\"node-4-4-2\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"等下到双方都觉得“嗯，没啥好占的了”，就可以停手数地盘，比看谁围住的空点更多。简单说，围得多、活得稳、吃得巧的一方就是赢家。围棋不只是打架，更像一场安静又聪明的圈地小冒险~\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"node-4-5\",\"options\":[]},{\"id\":\"branch-25\",\"name\":\"\",\"type\":\"player-choice\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[{\"label\":\"呃...你真的会下棋吗？这不是明显征不掉吗？\",\"nextNodeId\":\"branch-26\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"branch-26\",\"name\":\"\",\"type\":\"player-move\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"7,2\",\"color\":\"black\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":2,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-27\",\"options\":[]},{\"id\":\"story-27\",\"name\":\"\",\"type\":\"npc-dialogue\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"哼哼，不要小瞧我！\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":1,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-28\",\"options\":[]},{\"id\":\"story-28\",\"name\":\"\",\"type\":\"npc-dialogue\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"看看这招！\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":1,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-29\",\"options\":[]},{\"id\":\"story-29\",\"name\":\"\",\"type\":\"npc-skill\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"sigrika\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"7,1\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-30\",\"options\":[]},{\"id\":\"story-30\",\"name\":\"\",\"type\":\"npc-move\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"8,2\",\"color\":\"white\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":2,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-31\",\"options\":[]},{\"id\":\"story-31\",\"name\":\"\",\"type\":\"player-choice\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[{\"label\":\"啊？\",\"nextNodeId\":\"branch-32\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"branch-32\",\"name\":\"\",\"type\":\"player-choice\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[{\"label\":\"这是作弊了吧！\",\"nextNodeId\":\"branch-33\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"branch-33\",\"name\":\"\",\"type\":\"npc-dialogue\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"这你就不懂啦。这是我的共鸣技能【星辉符文】，可以抹除棋盘上的一个交叉点，然后还可以继续落子。这样的话你只有两口气的棋，我一回合就可以消灭掉哦~\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-34\",\"options\":[]},{\"id\":\"story-34\",\"name\":\"\",\"type\":\"npc-dialogue\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"这就是我们星炬围棋的特殊之处，可以让共鸣能力和棋盘共融，产生意想不到的战术效果~\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-35\",\"options\":[]},{\"id\":\"story-35\",\"name\":\"\",\"type\":\"npc-dialogue\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"不过呢，这些技能通常只能一盘棋使用一次，而且有些技能会有超频的负面代价。比如我使用的这个技能，超频为3，代表我到数子阶段要多贴你3个子，相当于6目棋呢。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":0,\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-36\",\"options\":[]},{\"id\":\"story-36\",\"name\":\"\",\"type\":\"npc-dialogue\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"所以考虑使用技能的场合、判断得失，也是在我们星炬围棋需要思考的博弈的一环呢。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":2,\"autoContinueDelaySeconds\":1,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[{\"label\":\"听起来挺有趣的...\",\"nextNodeId\":\"branch-37\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"branch-37\",\"name\":\"\",\"type\":\"player-choice\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[{\"label\":\"不过现在死了这么多棋，只能认输了...\",\"nextNodeId\":\"branch-38\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"branch-38\",\"name\":\"\",\"type\":\"resign\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"请点击认输键\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"black\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"player\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":2,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-39\",\"options\":[]},{\"id\":\"story-39\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"怎么样，这下对我们围棋部应该有所了解了吧。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-47\",\"options\":[]},{\"id\":\"story-40\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"咳咳。总之，我们围棋部还有好多部员，每个部员都有不同的共鸣能力技能。{username}同学以后可以多去认识认识~\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-43\",\"options\":[]},{\"id\":\"story-47\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"噢，对了。娅娅，快醒醒，该到你展示的时候了\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-48\",\"options\":[]},{\"id\":\"story-48\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"denia\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"...嗯？怎么，要我做什么吗？\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-49\",\"options\":[]},{\"id\":\"story-49\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"来跟我下一盘，给{username}同学展示一下你的能力~\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-50\",\"options\":[]},{\"id\":\"story-50\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"denia\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"呜哇，好麻烦。好吧。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-51\",\"options\":[]},{\"id\":\"story-51\",\"name\":\"\",\"type\":\"board-setup\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"white\",\"playerCharacterId\":\"denia\",\"npcCharacterId\":\"sigrika\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":4,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":{\"mode\":\"spark\",\"stones\":[{\"pointId\":\"8,1\",\"color\":\"black\"},{\"pointId\":\"3,2\",\"color\":\"white\"},{\"pointId\":\"9,2\",\"color\":\"black\"},{\"pointId\":\"10,2\",\"color\":\"white\"},{\"pointId\":\"6,3\",\"color\":\"black\"},{\"pointId\":\"7,3\",\"color\":\"white\"},{\"pointId\":\"8,3\",\"color\":\"white\"},{\"pointId\":\"9,3\",\"color\":\"black\"},{\"pointId\":\"10,3\",\"color\":\"white\"},{\"pointId\":\"2,4\",\"color\":\"black\"},{\"pointId\":\"6,4\",\"color\":\"white\"},{\"pointId\":\"7,4\",\"color\":\"black\"},{\"pointId\":\"8,4\",\"color\":\"black\"},{\"pointId\":\"9,4\",\"color\":\"white\"},{\"pointId\":\"10,4\",\"color\":\"white\"},{\"pointId\":\"11,4\",\"color\":\"black\"},{\"pointId\":\"6,5\",\"color\":\"white\"},{\"pointId\":\"7,5\",\"color\":\"black\"},{\"pointId\":\"8,5\",\"color\":\"white\"},{\"pointId\":\"9,5\",\"color\":\"black\"},{\"pointId\":\"10,5\",\"color\":\"black\"},{\"pointId\":\"11,5\",\"color\":\"white\"},{\"pointId\":\"5,6\",\"color\":\"white\"},{\"pointId\":\"6,6\",\"color\":\"black\"},{\"pointId\":\"7,6\",\"color\":\"black\"},{\"pointId\":\"8,6\",\"color\":\"white\"},{\"pointId\":\"11,6\",\"color\":\"black\"},{\"pointId\":\"4,7\",\"color\":\"white\"},{\"pointId\":\"5,7\",\"color\":\"black\"},{\"pointId\":\"6,7\",\"color\":\"black\"},{\"pointId\":\"7,7\",\"color\":\"white\"},{\"pointId\":\"3,8\",\"color\":\"white\"},{\"pointId\":\"4,8\",\"color\":\"black\"},{\"pointId\":\"5,8\",\"color\":\"black\"},{\"pointId\":\"6,8\",\"color\":\"white\"},{\"pointId\":\"2,9\",\"color\":\"white\"},{\"pointId\":\"4,9\",\"color\":\"black\"},{\"pointId\":\"5,9\",\"color\":\"white\"},{\"pointId\":\"4,10\",\"color\":\"white\"},{\"pointId\":\"9,10\",\"color\":\"black\"}]},\"nextNodeId\":\"story-52\",\"options\":[]},{\"id\":\"story-52\",\"name\":\"\",\"type\":\"player-choice\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-41\",\"options\":[{\"label\":\"怎么又是这种征子局面...\",\"nextNodeId\":\"story-53\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"story-54\",\"name\":\"学会\",\"type\":\"npc-dialogue\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"嘿嘿，看来你已经学会了嘛！\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":1,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-55\",\"options\":[]},{\"id\":\"story-55\",\"name\":\"\",\"type\":\"npc-skill\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"sigrika\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"5,10\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-56\",\"options\":[]},{\"id\":\"story-56\",\"name\":\"\",\"type\":\"npc-move\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"6,9\",\"color\":\"black\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":3,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-57\",\"options\":[]},{\"id\":\"story-57\",\"name\":\"\",\"type\":\"player-choice\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[{\"label\":\"黑棋死里逃生了，这下白棋应该不行了\",\"nextNodeId\":\"story-58\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"story-58\",\"name\":\"\",\"type\":\"npc-dialogue\",\"speakerName\":\"\",\"characterId\":\"denia\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"嗯哼？\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-59\",\"options\":[]},{\"id\":\"story-59\",\"name\":\"\",\"type\":\"player-skill\",\"speakerName\":\"\",\"characterId\":\"denia\",\"skillCharacterId\":\"denia\",\"skillId\":\"denia\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"请点击技能按钮，然后选择目标棋子\",\"wrongClickMessage\":\"\",\"pointId\":\"5,8\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":3,\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-60\",\"options\":[]},{\"id\":\"story-60\",\"name\":\"\",\"type\":\"player-choice\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[{\"label\":\"哇，好酷炫！这就是达妮娅的技能吗！\",\"nextNodeId\":\"story-61\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"story-61\",\"name\":\"反色\",\"type\":\"npc-dialogue\",\"speakerName\":\"\",\"characterId\":\"denia\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"是的，我的技能是让场上一枚棋子反色。不过使用这个技能的回合我不能继续落子就是了。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-62\",\"options\":[]},{\"id\":\"story-62\",\"name\":\"没法继续\",\"type\":\"npc-dialogue\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"呃，娅娅的技能还是太超模了，这棋可没法继续下了...\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"story-63\",\"options\":[]},{\"id\":\"story-63\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"denia\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"（哈欠）下盘棋真的好累啊。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-64\",\"options\":[]},{\"id\":\"story-64\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"呜...这盘棋只是给{username}同学演示一下啦。认真下的话，刚刚我应该用技能去吃上面的2个子的，这样就不会被一口气反吃了。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-40\",\"options\":[]},{\"id\":\"story-53\",\"name\":\"我懂了\",\"type\":\"player-choice\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":false,\"autoContinueEnabled\":true,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[{\"label\":\"啊，我懂了，你要发动那个了是吧\",\"nextNodeId\":\"story-54\",\"revealDelaySeconds\":\"\",\"transitionDelaySeconds\":\"\"}]},{\"id\":\"story-41\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"denia\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"比如我的共鸣技能是让棋盘上一颗棋子反色哦~虽然用了这技能以后不能再落子就是了。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-42\",\"options\":[]},{\"id\":\"story-42\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"娅娅的技能说实话实战能力挺强的...我好多大优的棋，被她使用技能逆转了好多次...真是好赖皮的技能！\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-43\",\"options\":[]},{\"id\":\"story-43\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"另外呢，我们围棋部也可以下正常的19路的标准围棋哦~如果是下这个的话，我们大家都约定好了，不允许使用技能。\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-44\",\"options\":[]},{\"id\":\"story-44\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"如果下围棋下累了，还可以下下五子棋放松一下~\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"story-45\",\"options\":[]},{\"id\":\"story-45\",\"name\":\"\",\"type\":\"story\",\"speakerName\":\"\",\"characterId\":\"sigrika\",\"skillCharacterId\":\"\",\"skillId\":\"\",\"effect\":\"\",\"text\":\"哦对了，忘记自我介绍了。我是星炬学院围棋部部长，西格莉卡！{username}同学，以后还请多多指教呢！\",\"prompt\":\"\",\"wrongClickMessage\":\"\",\"pointId\":\"\",\"color\":\"\",\"playerColor\":\"black\",\"playerCharacterId\":\"\",\"npcCharacterId\":\"denia\",\"npcName\":\"\",\"entryText\":\"\",\"actor\":\"\",\"actionStartDelaySeconds\":\"\",\"replyDelaySeconds\":\"\",\"autoContinueDelaySeconds\":\"\",\"manualContinueEnabled\":true,\"autoContinueEnabled\":false,\"boardSetup\":null,\"nextNodeId\":\"\",\"options\":[]}]",
      "firstPublishedAt": "2026-06-28T10:49:55.642Z",
      "publishedAt": "2026-07-02T12:30:29.669Z"
    }
  ],
  "announcementEntries": [
    {
      "id": "cmqx8ga5v000a7kzk50jv9xhp",
      "kind": "announcement",
      "title": "欢迎来到星炬学院围棋部！",
      "body": "试运行阶段，有建议或bug都可以通过右上留言板反馈哦~！",
      "isPublished": true,
      "pinned": true,
      "firstPublishedAt": "2026-06-28T03:32:11.249Z",
      "deletedAt": null
    },
    {
      "id": "cmqx8guub000c7kzkrmerdiqt",
      "kind": "changelog",
      "title": "2026.6.28更新",
      "body": "·更新了公告栏",
      "isPublished": true,
      "pinned": false,
      "firstPublishedAt": "2026-06-28T03:32:38.049Z",
      "deletedAt": null
    }
  ],
  "onboardingStoryScripts": [
    {
      "id": "singleton",
      "draftStartNodeId": "node-1",
      "draftNodesJson": "[{\"id\":\"node-1\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"哇，来了新的同学耶！\",\"nextNodeId\":\"node-2\",\"options\":[]},{\"id\":\"node-2\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"我们这里是星炬学院围棋部，请问同学是加入咱们围棋部吗？\",\"nextNodeId\":\"node-3\",\"options\":[{\"label\":\"是的\",\"nextNodeId\":\"node-3\"}]},{\"id\":\"node-3\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"那太好了！请问同学你会下围棋吗？水平怎么样？\",\"nextNodeId\":\"\",\"options\":[{\"label\":\"其实我完全不会下围棋...\",\"nextNodeId\":\"node-4\"},{\"label\":\"略懂一些\",\"nextNodeId\":\"node-5\"},{\"label\":\"我超强的哦!\",\"nextNodeId\":\"node-5\"}]},{\"id\":\"node-4\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"是新手啊...没事的，我可以手把手教你！\",\"nextNodeId\":\"node-4-1\",\"options\":[]},{\"id\":\"node-4-1\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"围棋呢，是由黑白双方在棋盘的交叉点上轮流落子，通常黑棋先行，白棋后行。棋子一旦落在棋盘上，原则上不能移动，只能通过后续行棋来扩大自己的势力或限制对方。棋子上下左右相邻的空点叫作“气”，同色棋子如果横向或纵向相连，就组成一块棋，并共同拥有这些气。只要一块棋还有气，它就能留在棋盘上；如果它的气被对方全部占住，就要被提掉，这叫“提子”。落子时要注意，不能把自己的棋下到完全没有气的位置，这种点通常叫“禁入点”。不过，如果这一手能同时提掉对方棋子，使自己的棋重新获得气，那就是可以下的。围棋中还有“劫”的规则：如果双方反复在同一处立即提来提去，棋局就会无限重复，所以被提的一方不能马上提回，必须先在别处下一手。围棋的目标不是单纯吃子，而是在保证自己棋子存活的基础上，尽量围取更多地域。棋盘上由己方棋子围住、对方无法有效进入的空点，通常称为“目”。到了双方都认为继续落子已经没有收益时，棋局进入终局，需要确认哪些棋是活棋，哪些棋是死棋。最后根据所采用的规则，按“数目”或“数子”的方式计算胜负，并把白棋的“贴目”加入结果中。总数较多的一方获胜......\",\"nextNodeId\":\"node-4-2\",\"options\":[]},{\"id\":\"node-4-2\",\"speakerName\":\"\",\"characterId\":\"达妮娅\",\"text\":\"西西，你这样介绍，人家听不懂的啦...\",\"nextNodeId\":\"node-4-3\",\"options\":[]},{\"id\":\"node-4-3\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"诶，这样的吗？我是按照莫宁教授上课的口吻说的，还以为说的很详细了。嗯，那我想想...\",\"nextNodeId\":\"node-4-4\",\"options\":[]},{\"id\":\"node-4-4\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"打个比方呢，围棋就像两队黑白小鸟在棋盘上“抢地盘”。黑棋先走，白棋后走，大家轮流把棋子放在交叉点上，放下去就不能搬家啦。每颗棋子旁边上下左右的空点叫“气”，有气才能活；如果一片棋子的气全被对方堵住，就会被“吃掉”，乖乖拿出棋盘。下棋时不能让自己的棋子刚落下就没气，这个点就叫禁入点。等双方都觉得“嗯，没啥好占的了”，就可以停手数地盘，比看谁围住的空点更多。简单说，围得多、活得稳、吃得巧的一方就是赢家。围棋不只是打架，更像一场安静又聪明的圈地小冒险~\",\"nextNodeId\":\"node-4-5\",\"options\":[]},{\"id\":\"node-4-5\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"围棋基础规则还是简单的。难点就是如何去高效地抢地盘，这个学问就多了...\",\"nextNodeId\":\"node-4-6\",\"options\":[]},{\"id\":\"node-4-6\",\"speakerName\":\"\",\"characterId\":\"达妮娅\",\"text\":\"不要把围棋想得太难哦。当初西西手把手教我下围棋，我也只花了半天就学会了。\",\"nextNodeId\":\"node-4-7\",\"options\":[]},{\"id\":\"node-4-7\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"那不是我教的好的缘故啦...对了，如果有不懂的地方，我们部有很多棋书，可以随便看哦。\",\"nextNodeId\":\"node-4-8\",\"options\":[]},{\"id\":\"node-4-8\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"不过呢，想学一门东西的话还是得多实践才重要！所以平时也要多来下棋哦！\",\"nextNodeId\":\"node-5\",\"options\":[]},{\"id\":\"node-5\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"对了，还没自我介绍呢。我是星炬学院围棋部的部长西格莉卡。以后还请多多指教呢！\",\"nextNodeId\":\"\",\"options\":[]}]",
      "isPublished": true,
      "publishedStartNodeId": "node-1",
      "publishedNodesJson": "[{\"id\":\"node-1\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"哇，来了新的同学耶！\",\"nextNodeId\":\"node-2\",\"options\":[]},{\"id\":\"node-2\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"我们这里是星炬学院围棋部，请问同学是加入咱们围棋部吗？\",\"nextNodeId\":\"node-3\",\"options\":[{\"label\":\"是的\",\"nextNodeId\":\"node-3\"}]},{\"id\":\"node-3\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"那太好了！请问同学你会下围棋吗？水平怎么样？\",\"nextNodeId\":\"\",\"options\":[{\"label\":\"其实我完全不会下围棋...\",\"nextNodeId\":\"node-4\"},{\"label\":\"略懂一些\",\"nextNodeId\":\"node-5\"},{\"label\":\"我超强的哦!\",\"nextNodeId\":\"node-5\"}]},{\"id\":\"node-4\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"是新手啊...没事的，我可以手把手教你！\",\"nextNodeId\":\"node-4-1\",\"options\":[]},{\"id\":\"node-4-1\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"围棋呢，是由黑白双方在棋盘的交叉点上轮流落子，通常黑棋先行，白棋后行。棋子一旦落在棋盘上，原则上不能移动，只能通过后续行棋来扩大自己的势力或限制对方。棋子上下左右相邻的空点叫作“气”，同色棋子如果横向或纵向相连，就组成一块棋，并共同拥有这些气。只要一块棋还有气，它就能留在棋盘上；如果它的气被对方全部占住，就要被提掉，这叫“提子”。落子时要注意，不能把自己的棋下到完全没有气的位置，这种点通常叫“禁入点”。不过，如果这一手能同时提掉对方棋子，使自己的棋重新获得气，那就是可以下的。围棋中还有“劫”的规则：如果双方反复在同一处立即提来提去，棋局就会无限重复，所以被提的一方不能马上提回，必须先在别处下一手。围棋的目标不是单纯吃子，而是在保证自己棋子存活的基础上，尽量围取更多地域。棋盘上由己方棋子围住、对方无法有效进入的空点，通常称为“目”。到了双方都认为继续落子已经没有收益时，棋局进入终局，需要确认哪些棋是活棋，哪些棋是死棋。最后根据所采用的规则，按“数目”或“数子”的方式计算胜负，并把白棋的“贴目”加入结果中。总数较多的一方获胜......\",\"nextNodeId\":\"node-4-2\",\"options\":[]},{\"id\":\"node-4-2\",\"speakerName\":\"\",\"characterId\":\"达妮娅\",\"text\":\"西西，你这样介绍，人家听不懂的啦...\",\"nextNodeId\":\"node-4-3\",\"options\":[]},{\"id\":\"node-4-3\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"诶，这样的吗？我是按照莫宁教授上课的口吻说的，还以为说的很详细了。嗯，那我想想...\",\"nextNodeId\":\"node-4-4\",\"options\":[]},{\"id\":\"node-4-4\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"打个比方呢，围棋就像两队黑白小鸟在棋盘上“抢地盘”。黑棋先走，白棋后走，大家轮流把棋子放在交叉点上，放下去就不能搬家啦。每颗棋子旁边上下左右的空点叫“气”，有气才能活；如果一片棋子的气全被对方堵住，就会被“吃掉”，乖乖拿出棋盘。下棋时不能让自己的棋子刚落下就没气，这个点就叫禁入点。等双方都觉得“嗯，没啥好占的了”，就可以停手数地盘，比看谁围住的空点更多。简单说，围得多、活得稳、吃得巧的一方就是赢家。围棋不只是打架，更像一场安静又聪明的圈地小冒险~\",\"nextNodeId\":\"node-4-5\",\"options\":[]},{\"id\":\"node-4-5\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"围棋基础规则还是简单的。难点就是如何去高效地抢地盘，这个学问就多了...\",\"nextNodeId\":\"node-4-6\",\"options\":[]},{\"id\":\"node-4-6\",\"speakerName\":\"\",\"characterId\":\"达妮娅\",\"text\":\"不要把围棋想得太难哦。当初西西手把手教我下围棋，我也只花了半天就学会了。\",\"nextNodeId\":\"node-4-7\",\"options\":[]},{\"id\":\"node-4-7\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"那不是我教的好的缘故啦...对了，如果有不懂的地方，我们部有很多棋书，可以随便看哦。\",\"nextNodeId\":\"node-4-8\",\"options\":[]},{\"id\":\"node-4-8\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"不过呢，想学一门东西的话还是得多实践才重要！所以平时也要多来下棋哦！\",\"nextNodeId\":\"node-5\",\"options\":[]},{\"id\":\"node-5\",\"speakerName\":\"\",\"characterId\":\"西格莉卡\",\"text\":\"对了，还没自我介绍呢。我是星炬学院围棋部的部长西格莉卡。以后还请多多指教呢！\",\"nextNodeId\":\"\",\"options\":[]}]",
      "firstPublishedAt": "2026-06-28T10:49:55.642Z",
      "publishedAt": "2026-06-28T10:49:55.642Z"
    }
  ]
};
