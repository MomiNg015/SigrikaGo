// Generated from prisma/dev.db non-user admin configuration on 2026-07-06.
// Do not include users, audit logs, feedback, reports, game records, mailbox history, or live state here.

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
      "description": "用于贴在学院公告栏上的招新贴报，可以招募星炬学院内的人。",
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
      "description": "使用先约电台的广播券，可以招募星炬学院外的人。",
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
      "description": "吃过的人都说好！\n（illust：憨态喵）",
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
          "imageUrl": "/assets/items/rainbow-bean-candy.webp",
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
      "displayName": "不死者"
    },
    {
      "id": "qiuyuan-skill-default",
      "displayName": "剑匣破"
    },
    {
      "id": "sigrika-skill-default",
      "displayName": "致那暖明黄金"
    }
  ]
};
