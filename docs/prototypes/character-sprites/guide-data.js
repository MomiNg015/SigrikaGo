// Generated offline copy. Run node docs/prototypes/character-sprites/sync-guide.mjs.
window.GuideSampleData = {
  "source": "server/adminDefaultSnapshot.js / onboarding.default",
  "startNodeId": "node-1",
  "nodes": [
    {
      "id": "node-1",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "哇，是新同学！你就是{username}吧？",
      "prompt": "",
      "expressionId": "surprised",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "node-2",
      "options": [
        {
          "label": "你怎么知道的？",
          "nextNodeId": "node-2",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": ""
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "node-2",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "嘿嘿，你腰上挂着的学生证都告诉我啦。这里是星炬学院围棋部——你是准备来加入我们的吗？",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "node-3",
      "options": [
        {
          "label": "是的。",
          "nextNodeId": "node-3",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": ""
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "node-3",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "太好啦，欢迎加入围棋部！对了，{username}以前接触过围棋吗？",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [
        {
          "label": "其实我完全不会下围棋……",
          "nextNodeId": "node-4",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": ""
        },
        {
          "label": "略懂一点",
          "nextNodeId": "story-46",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": ""
        },
        {
          "label": "我超强的哦！",
          "nextNodeId": "story-15",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": ""
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "node-4",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "是新手啊！没事的，我可以手把手教你！",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "node-4-1",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "node-4-1",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "围棋呢，是由黑白双方在棋盘的交叉点上轮流落子，通常黑棋先行，白棋后行。棋子一旦落在棋盘上，原则上不能移动，只能通过后续行棋来扩大自己的势力或限制对方。棋子上下左右相邻的空点叫作“气”，同色棋子如果横向或纵向相连，就组成一块棋，并共同拥有这些气。只要一块棋还有气，它就能留在棋盘上；如果它的气被对方全部占住，就要被提掉，这叫“提子”。落子时要注意，不能把自己的棋下到完全没有气的位置，这种点通常叫“禁入点”。不过，如果这一手能同时提掉对方棋子，使自己的棋重新获得气，那就是可以下的。围棋中还有“劫”的规则：如果双方反复在同一处立即提来提去，棋局就会无限重复，所以被提的一方不能马上提回，必须先在别处下一手。围棋的目标不是单纯吃子，而是在保证自己棋子存活的基础上，尽量围取更多地域。棋盘上由己方棋子围住、对方无法有效进入的空点，通常称为“目”。到了双方都认为继续落子已经没有收益时，棋局进入终局，需要确认哪些棋是活棋，哪些棋是死棋。最后根据所采用的规则，按“数目”或“数子”的方式计算胜负，并把白棋的“贴目”加入结果中。总数较多的一方获胜......",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "node-4-2",
      "options": [
        {
          "label": "...",
          "nextNodeId": "node-4-2",
          "revealDelaySeconds": 2,
          "transitionDelaySeconds": ""
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "node-4-2",
      "type": "story",
      "characterId": "denia",
      "speakerName": "",
      "text": "西西，你这样介绍，人家听不懂的啦...",
      "prompt": "",
      "expressionId": "annoyed",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "node-4-3",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "node-4-3",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "诶，这样的吗？我是按照莫宁教授上课的口吻说的，还以为说的很详细了。嗯，那我想想...",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "node-4-4",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "node-4-4",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "打个比方呢，围棋就像两队黑白小鸟在棋盘上“抢地盘”。黑棋先走，白棋后走，大家轮流把棋子放在交叉点上，放下去就不能搬家啦。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "node-4-4-1",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "node-4-4-1",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "每颗棋子旁边上下左右的空点叫“气”，有气才能活；如果一片棋子的气全被对方堵住，就会被“吃掉”，乖乖拿出棋盘。下棋时不能让自己的棋子刚落下就没气，这个点就叫禁入点。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "node-4-4-2",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "node-4-4-2",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "等下到双方都觉得“嗯，没啥好占的了”，就可以停手数地盘，比看谁围住的空点更多。简单说，围得多、活得稳、吃得巧的一方就是赢家。围棋不只是打架，更像一场安静又聪明的圈地小冒险~",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "node-4-4-3",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "node-4-4-3",
      "type": "story",
      "characterId": "denia",
      "speakerName": "",
      "text": "西西，虽然我知道你喜欢鸟。但是打比方的话，我觉得用拉海洛方块更合适呢。",
      "prompt": "",
      "expressionId": "playful",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "node-4-4-5",
      "options": [
        {
          "label": "听你们这么说，感觉有点像贪吃蛇。",
          "nextNodeId": "node-4-4-5",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "node-4-4-5",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "不要纠结这种地方嘛！",
      "prompt": "",
      "expressionId": "embarrassed",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "node-4-4-6",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "node-4-4-6",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "唔......那就不纸上谈兵啦！{username}，坐到这边来，我们还是从棋盘上走一遍吧。",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-setup-1",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-setup-1",
      "type": "board-setup",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "doc-liberty-intro",
      "options": [],
      "boardSetup": {
        "mode": "spark",
        "stones": [
          {
            "pointId": "9,2",
            "color": "black"
          },
          {
            "pointId": "3,3",
            "color": "black"
          },
          {
            "pointId": "9,3",
            "color": "black"
          },
          {
            "pointId": "3,8",
            "color": "black"
          },
          {
            "pointId": "2,9",
            "color": "black"
          },
          {
            "pointId": "3,9",
            "color": "black"
          },
          {
            "pointId": "4,9",
            "color": "black"
          },
          {
            "pointId": "12,9",
            "color": "black"
          },
          {
            "pointId": "2,10",
            "color": "black"
          },
          {
            "pointId": "3,10",
            "color": "black"
          },
          {
            "pointId": "12,10",
            "color": "black"
          },
          {
            "pointId": "10,11",
            "color": "black"
          },
          {
            "pointId": "11,11",
            "color": "black"
          },
          {
            "pointId": "12,11",
            "color": "black"
          },
          {
            "pointId": "11,8",
            "color": "white"
          },
          {
            "pointId": "12,8",
            "color": "white"
          },
          {
            "pointId": "11,9",
            "color": "white"
          },
          {
            "pointId": "1,10",
            "color": "white"
          },
          {
            "pointId": "9,10",
            "color": "white"
          },
          {
            "pointId": "11,10",
            "color": "white"
          },
          {
            "pointId": "2,11",
            "color": "white"
          }
        ],
        "lastMovePointId": "9,10"
      },
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "sigrika",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.8
    },
    {
      "id": "doc-liberty-intro",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "我们先来说说气的概念吧~",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-liberty-left-top",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-liberty-left-top",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "首先来看看棋盘左上角这颗黑子，上下左右有4个空置交叉点，所以是有4口气。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-liberty-right-top",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-liberty-right-top",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "再看看右上角的两颗黑子，他们上下或左右连在一起，所以是一个棋块，数数他们周围，是有6个空置交叉点，所以是有6口气。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-liberty-question-1",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-liberty-question-1",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "那么再来看看左下角这一团黑棋，一部分还挨着白棋，那这团黑棋是有多少气呢？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [
        {
          "label": "7",
          "nextNodeId": "doc-liberty-question-2",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        },
        {
          "label": "9",
          "nextNodeId": "doc-liberty-wrong-1",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        },
        {
          "label": "14",
          "nextNodeId": "doc-liberty-wrong-1",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-liberty-wrong-1",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "棋子上下左右空置的交叉点才算做气哦~再想想看？",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-liberty-question-1",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "doc-liberty-question-2",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "对啦！那再稍微提高点难度，看看右下角的黑棋有多少口气？",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [
        {
          "label": "8",
          "nextNodeId": "doc-liberty-wrong-2",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        },
        {
          "label": "6",
          "nextNodeId": "doc-liberty-wrong-2",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        },
        {
          "label": "5",
          "nextNodeId": "doc-liberty-correct",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-liberty-wrong-2",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "棋子挨到棋盘边缘再往外是没有气的啦~再想想？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-liberty-question-2",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "doc-liberty-correct",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "看来你已经完全掌握气的概念了。那让我们接下来看看棋子没有气会发生什么吧！",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-setup-2",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-setup-2",
      "type": "board-setup",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "doc-capture-question",
      "options": [],
      "boardSetup": {
        "mode": "spark",
        "stones": [
          {
            "pointId": "3,2",
            "color": "black"
          },
          {
            "pointId": "10,2",
            "color": "black"
          },
          {
            "pointId": "2,3",
            "color": "black"
          },
          {
            "pointId": "4,3",
            "color": "black"
          },
          {
            "pointId": "9,3",
            "color": "black"
          },
          {
            "pointId": "11,3",
            "color": "black"
          },
          {
            "pointId": "8,4",
            "color": "black"
          },
          {
            "pointId": "10,9",
            "color": "black"
          },
          {
            "pointId": "11,9",
            "color": "black"
          },
          {
            "pointId": "0,10",
            "color": "black"
          },
          {
            "pointId": "1,10",
            "color": "black"
          },
          {
            "pointId": "9,10",
            "color": "black"
          },
          {
            "pointId": "11,10",
            "color": "black"
          },
          {
            "pointId": "12,10",
            "color": "black"
          },
          {
            "pointId": "1,11",
            "color": "black"
          },
          {
            "pointId": "2,11",
            "color": "black"
          },
          {
            "pointId": "10,11",
            "color": "black"
          },
          {
            "pointId": "12,11",
            "color": "black"
          },
          {
            "pointId": "2,12",
            "color": "black"
          },
          {
            "pointId": "10,12",
            "color": "black"
          },
          {
            "pointId": "11,12",
            "color": "black"
          },
          {
            "pointId": "12,12",
            "color": "black"
          },
          {
            "pointId": "3,3",
            "color": "white"
          },
          {
            "pointId": "8,3",
            "color": "white"
          },
          {
            "pointId": "10,3",
            "color": "white"
          },
          {
            "pointId": "9,4",
            "color": "white"
          },
          {
            "pointId": "11,4",
            "color": "white"
          },
          {
            "pointId": "10,5",
            "color": "white"
          },
          {
            "pointId": "9,8",
            "color": "white"
          },
          {
            "pointId": "10,8",
            "color": "white"
          },
          {
            "pointId": "11,8",
            "color": "white"
          },
          {
            "pointId": "12,8",
            "color": "white"
          },
          {
            "pointId": "1,9",
            "color": "white"
          },
          {
            "pointId": "2,9",
            "color": "white"
          },
          {
            "pointId": "8,9",
            "color": "white"
          },
          {
            "pointId": "9,9",
            "color": "white"
          },
          {
            "pointId": "12,9",
            "color": "white"
          },
          {
            "pointId": "2,10",
            "color": "white"
          },
          {
            "pointId": "3,10",
            "color": "white"
          },
          {
            "pointId": "7,10",
            "color": "white"
          },
          {
            "pointId": "0,11",
            "color": "white"
          },
          {
            "pointId": "3,11",
            "color": "white"
          },
          {
            "pointId": "7,11",
            "color": "white"
          },
          {
            "pointId": "8,11",
            "color": "white"
          },
          {
            "pointId": "9,11",
            "color": "white"
          },
          {
            "pointId": "1,12",
            "color": "white"
          },
          {
            "pointId": "3,12",
            "color": "white"
          },
          {
            "pointId": "9,12",
            "color": "white"
          }
        ],
        "lastMovePointId": "12,9"
      },
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "sigrika",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.8
    },
    {
      "id": "doc-capture-question",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "先看左上角，白棋只有一口气了。轮到你执黑棋下，怎样才能吃掉这颗白棋呢？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-capture-move",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-capture-move",
      "type": "player-move",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "doc-capture-correct",
      "options": [],
      "boardSetup": null,
      "pointId": "3,4",
      "targetHighlightEnabled": false,
      "color": "black",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.5
    },
    {
      "id": "doc-capture-wrong",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "嗯哼？不吃颗白子尝尝味道吗？",
      "prompt": "",
      "expressionId": "playful",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-capture-move",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "doc-capture-correct",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "就是这样！这样这颗白棋就没气了，所以得从棋盘上拿走。这个行为我们称之为“提子”，顾名思义，把没气的棋子提起来拿出棋盘，很形象吧~",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-forbidden-explain",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-forbidden-explain",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "那么我们来看刚刚被提掉子的位置，对白棋而言，往这里落子的话还是会被提掉，所以我们称之这里为白棋的禁入点，规则上白棋不能在自己的禁入点上落子。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-forbidden-question",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-forbidden-question",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "但凡事总有例外。我们来看看右上角，白棋搭起来了类似的棋形。那么黑棋可不可以落在坐标L9的位置呢？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [
        {
          "label": "不可以，因为这是黑棋的禁入点",
          "nextNodeId": "doc-forbidden-wrong",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        },
        {
          "label": "可以，因为黑棋可以落在这里提子。",
          "nextNodeId": "doc-forbidden-correct",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-forbidden-wrong",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "看白棋上面那颗子，是不是也只有1口气？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-forbidden-question",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "doc-forbidden-correct",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "嗯嗯，那你落子试试看？",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-forbidden-move",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-forbidden-move",
      "type": "player-move",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "doc-forbidden-result",
      "options": [],
      "boardSetup": null,
      "pointId": "10,4",
      "targetHighlightEnabled": true,
      "color": "black",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.5
    },
    {
      "id": "doc-forbidden-result",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "没错，如果落子在禁入点可以提子的话，那这里此时就不算作禁入点。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-ko-user",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-ko-user",
      "type": "player-choice",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "",
      "options": [
        {
          "label": "那此时刚刚落下的黑棋又刚好只有一口气，白棋是不是可以马上提回来呢？那岂不是可以一直循环来回提子。",
          "nextNodeId": "doc-ko-1",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-ko-1",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "嘿嘿，你抓到重点了。但为了规避这种无限循环的情况，围棋规则上对此是有额外约束的。",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-ko-2",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-ko-2",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "比如就现在右上角的情形，黑棋刚提了白棋的子，那白棋必须在其它地方落一手后，才能再提回来。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-ko-3",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-ko-3",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "这种情况我们称之为“打劫”哟。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-ko-user-2",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-ko-user-2",
      "type": "player-choice",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "",
      "options": [
        {
          "label": "打劫？我身上可没带钱啊...",
          "nextNodeId": "doc-ko-4",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-ko-4",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "不是这个打劫啦。嗯...关于这个词，我记得莫宁教授说过，“劫”这个词源自佛家的“劫数”这个概念，喻指难以摆脱的困境或循环，而“打”代表经历这个过程。",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-ko-5",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-ko-5",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "所以这个来回提子的循环过程就叫“打劫”啦。另外，前面说的“白棋必须在其它地方落一手后才能再提回来”的行为，我们称之为“找劫材”。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-ko-6",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-ko-6",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "这就是所谓要付出一定的代价，才能打破这个无限的循环嘛。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-ko-7",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-ko-7",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "总之打劫作为一项特殊的规则，要稍微记在脑海里哟。如果实战中碰到打劫的情形，对方提子你又马上提回去的话，是要判作违规的。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-ko-8",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-ko-8",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "不过实际上还有会存在一些无法避免的循环情形，比如三劫循环、长生等等...",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-ko-9",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-ko-9",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "娅娅，这个太超纲啦！而且这些情形出现概率堪比娜波摩现在从天上掉下来...咳咳，{username}如果感兴趣的话可以在自己去搜搜，这里就不展开了...",
      "prompt": "",
      "expressionId": "embarrassed",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-lower-left-choice",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-lower-left-choice",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "让我们看看左下角，你觉得目前这是怎么个情况？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [
        {
          "label": "我觉得黑棋只有一口气，很危险",
          "nextNodeId": "doc-a1-question",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        },
        {
          "label": "我感觉可以吃掉白棋",
          "nextNodeId": "doc-a1-question",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-a1-question",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "没错，现在左下角黑棋只有一口气，很危险。白棋左下角1·1的位置看起来搭了个禁入点，但白棋两颗子各只有一口气，所以让你来下黑棋，该下哪呢？",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-a1-move",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-a1-move",
      "type": "player-move",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "doc-eye-1",
      "options": [],
      "boardSetup": null,
      "pointId": "0,12",
      "targetHighlightEnabled": false,
      "color": "black",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.5
    },
    {
      "id": "doc-a1-wrong-npc",
      "type": "npc-move",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-a1-wrong-reply",
      "options": [],
      "boardSetup": null,
      "pointId": "0,9",
      "targetHighlightEnabled": true,
      "color": "white",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "doc-a1-wrong-reply",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "那我就吃掉你啦~再重新试试？",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-a1-reset",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-a1-reset",
      "type": "board-setup",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "doc-a1-question",
      "options": [],
      "boardSetup": {
        "mode": "spark",
        "stones": [
          {
            "pointId": "3,2",
            "color": "black"
          },
          {
            "pointId": "10,2",
            "color": "black"
          },
          {
            "pointId": "2,3",
            "color": "black"
          },
          {
            "pointId": "4,3",
            "color": "black"
          },
          {
            "pointId": "9,3",
            "color": "black"
          },
          {
            "pointId": "11,3",
            "color": "black"
          },
          {
            "pointId": "8,4",
            "color": "black"
          },
          {
            "pointId": "10,9",
            "color": "black"
          },
          {
            "pointId": "11,9",
            "color": "black"
          },
          {
            "pointId": "0,10",
            "color": "black"
          },
          {
            "pointId": "1,10",
            "color": "black"
          },
          {
            "pointId": "9,10",
            "color": "black"
          },
          {
            "pointId": "11,10",
            "color": "black"
          },
          {
            "pointId": "12,10",
            "color": "black"
          },
          {
            "pointId": "1,11",
            "color": "black"
          },
          {
            "pointId": "2,11",
            "color": "black"
          },
          {
            "pointId": "10,11",
            "color": "black"
          },
          {
            "pointId": "12,11",
            "color": "black"
          },
          {
            "pointId": "2,12",
            "color": "black"
          },
          {
            "pointId": "10,12",
            "color": "black"
          },
          {
            "pointId": "11,12",
            "color": "black"
          },
          {
            "pointId": "12,12",
            "color": "black"
          },
          {
            "pointId": "3,3",
            "color": "white"
          },
          {
            "pointId": "8,3",
            "color": "white"
          },
          {
            "pointId": "10,3",
            "color": "white"
          },
          {
            "pointId": "9,4",
            "color": "white"
          },
          {
            "pointId": "11,4",
            "color": "white"
          },
          {
            "pointId": "10,5",
            "color": "white"
          },
          {
            "pointId": "9,8",
            "color": "white"
          },
          {
            "pointId": "10,8",
            "color": "white"
          },
          {
            "pointId": "11,8",
            "color": "white"
          },
          {
            "pointId": "12,8",
            "color": "white"
          },
          {
            "pointId": "1,9",
            "color": "white"
          },
          {
            "pointId": "2,9",
            "color": "white"
          },
          {
            "pointId": "8,9",
            "color": "white"
          },
          {
            "pointId": "9,9",
            "color": "white"
          },
          {
            "pointId": "12,9",
            "color": "white"
          },
          {
            "pointId": "2,10",
            "color": "white"
          },
          {
            "pointId": "3,10",
            "color": "white"
          },
          {
            "pointId": "7,10",
            "color": "white"
          },
          {
            "pointId": "0,11",
            "color": "white"
          },
          {
            "pointId": "3,11",
            "color": "white"
          },
          {
            "pointId": "7,11",
            "color": "white"
          },
          {
            "pointId": "8,11",
            "color": "white"
          },
          {
            "pointId": "9,11",
            "color": "white"
          },
          {
            "pointId": "1,12",
            "color": "white"
          },
          {
            "pointId": "3,12",
            "color": "white"
          },
          {
            "pointId": "9,12",
            "color": "white"
          }
        ],
        "lastMovePointId": "12,9"
      },
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "sigrika",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "doc-eye-1",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "嗯嗯。现在我们来看看这块黑棋，看起来是不是只有3口气，好像很危险的样子。",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-eye-2",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-eye-2",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "但是经过刚刚提子，我们看到是不是有了两个白棋的禁入点？因为白棋不可能同时下两手棋占据禁入点，所以这块黑棋我们可以认为是没有后顾之忧了。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-eye-3",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-eye-3",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "这样的禁入点我们也称之为“眼”，而有两个“真眼”的棋我们就称之为活棋了。所谓活棋，也就是未来基本不会被提掉的棋。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-eye-user",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-eye-user",
      "type": "player-choice",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "",
      "options": [
        {
          "label": "真眼？眼还有真假的区分吗？",
          "nextNodeId": "doc-false-eye-1",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-false-eye-1",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "我就猜到你会这么问啦。我们看看右下角的黑棋，是不是好像也搭了两个眼？",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-false-eye-2",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-false-eye-2",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "但是有的眼就像豆腐渣工程，是禁不起未来时间考验的，我们称之为假眼。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-false-eye-question",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-false-eye-question",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "想想我们前面的内容，你觉得右下角哪个是假眼呢？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [
        {
          "label": "左上那个",
          "nextNodeId": "doc-false-eye-correct",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        },
        {
          "label": "右下那个",
          "nextNodeId": "doc-false-eye-wrong",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        },
        {
          "label": "我觉得都是真眼啊！",
          "nextNodeId": "doc-false-eye-wrong",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-false-eye-wrong",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "想想前面说的可以落子在禁入点的情况，再看看哪个眼是肯能被白棋率先攻破的？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-false-eye-question",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "doc-false-eye-correct",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "bingo！",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-false-eye-demo",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.5
    },
    {
      "id": "doc-false-eye-demo",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "那让我们实际演示看看吧。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-false-eye-j3",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-false-eye-j3",
      "type": "npc-move",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-false-eye-l3",
      "options": [],
      "boardSetup": null,
      "pointId": "8,10",
      "targetHighlightEnabled": true,
      "color": "white",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "doc-false-eye-l3",
      "type": "npc-move",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-false-eye-3",
      "options": [],
      "boardSetup": null,
      "pointId": "10,10",
      "targetHighlightEnabled": true,
      "color": "white",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "doc-false-eye-3",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "看，左上黑棋的眼顿时荡然无存了。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-false-eye-4",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-false-eye-4",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "也就是说，如果搭建眼的棋子如果未来会被提子，那这个眼我们就称之为假眼。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-false-eye-5",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-false-eye-5",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "这块只有一个真眼的黑棋最后也难逃毁灭的命运。",
      "prompt": "",
      "expressionId": "playful",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-false-eye-6",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-false-eye-6",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "所以记住活棋的基础是有两个“真眼”哦。瞎掉一只眼或没有眼的棋都不能称之为活棋，很形象吧。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-false-eye-7",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-false-eye-7",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "嗯，除非你想不开自己把真眼填掉...",
      "prompt": "",
      "expressionId": "playful",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-false-eye-8",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-false-eye-8",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "由此我们再拓展看看~",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-setup-3",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-setup-3",
      "type": "board-setup",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "doc-b11-question",
      "options": [],
      "boardSetup": {
        "mode": "spark",
        "stones": [
          {
            "pointId": "1,0",
            "color": "black"
          },
          {
            "pointId": "2,0",
            "color": "black"
          },
          {
            "pointId": "3,0",
            "color": "black"
          },
          {
            "pointId": "9,0",
            "color": "black"
          },
          {
            "pointId": "0,1",
            "color": "black"
          },
          {
            "pointId": "2,1",
            "color": "black"
          },
          {
            "pointId": "4,1",
            "color": "black"
          },
          {
            "pointId": "9,1",
            "color": "black"
          },
          {
            "pointId": "10,1",
            "color": "black"
          },
          {
            "pointId": "11,1",
            "color": "black"
          },
          {
            "pointId": "12,1",
            "color": "black"
          },
          {
            "pointId": "0,2",
            "color": "black"
          },
          {
            "pointId": "4,2",
            "color": "black"
          },
          {
            "pointId": "0,6",
            "color": "black"
          },
          {
            "pointId": "1,6",
            "color": "black"
          },
          {
            "pointId": "2,6",
            "color": "black"
          },
          {
            "pointId": "11,6",
            "color": "black"
          },
          {
            "pointId": "2,7",
            "color": "black"
          },
          {
            "pointId": "10,7",
            "color": "black"
          },
          {
            "pointId": "11,7",
            "color": "black"
          },
          {
            "pointId": "3,8",
            "color": "black"
          },
          {
            "pointId": "10,8",
            "color": "black"
          },
          {
            "pointId": "3,9",
            "color": "black"
          },
          {
            "pointId": "9,9",
            "color": "black"
          },
          {
            "pointId": "3,10",
            "color": "black"
          },
          {
            "pointId": "9,10",
            "color": "black"
          },
          {
            "pointId": "3,11",
            "color": "black"
          },
          {
            "pointId": "7,11",
            "color": "black"
          },
          {
            "pointId": "9,11",
            "color": "black"
          },
          {
            "pointId": "0,12",
            "color": "black"
          },
          {
            "pointId": "1,12",
            "color": "black"
          },
          {
            "pointId": "2,12",
            "color": "black"
          },
          {
            "pointId": "3,12",
            "color": "black"
          },
          {
            "pointId": "4,0",
            "color": "white"
          },
          {
            "pointId": "5,0",
            "color": "white"
          },
          {
            "pointId": "8,0",
            "color": "white"
          },
          {
            "pointId": "5,1",
            "color": "white"
          },
          {
            "pointId": "8,1",
            "color": "white"
          },
          {
            "pointId": "2,2",
            "color": "white"
          },
          {
            "pointId": "6,2",
            "color": "white"
          },
          {
            "pointId": "8,2",
            "color": "white"
          },
          {
            "pointId": "9,2",
            "color": "white"
          },
          {
            "pointId": "10,2",
            "color": "white"
          },
          {
            "pointId": "11,2",
            "color": "white"
          },
          {
            "pointId": "12,2",
            "color": "white"
          },
          {
            "pointId": "0,3",
            "color": "white"
          },
          {
            "pointId": "1,3",
            "color": "white"
          },
          {
            "pointId": "2,3",
            "color": "white"
          },
          {
            "pointId": "3,3",
            "color": "white"
          },
          {
            "pointId": "4,3",
            "color": "white"
          },
          {
            "pointId": "5,3",
            "color": "white"
          },
          {
            "pointId": "6,3",
            "color": "white"
          },
          {
            "pointId": "0,7",
            "color": "white"
          },
          {
            "pointId": "1,7",
            "color": "white"
          },
          {
            "pointId": "1,8",
            "color": "white"
          },
          {
            "pointId": "2,8",
            "color": "white"
          },
          {
            "pointId": "11,8",
            "color": "white"
          },
          {
            "pointId": "2,9",
            "color": "white"
          },
          {
            "pointId": "10,9",
            "color": "white"
          },
          {
            "pointId": "12,9",
            "color": "white"
          },
          {
            "pointId": "2,10",
            "color": "white"
          },
          {
            "pointId": "10,10",
            "color": "white"
          },
          {
            "pointId": "0,11",
            "color": "white"
          },
          {
            "pointId": "1,11",
            "color": "white"
          },
          {
            "pointId": "2,11",
            "color": "white"
          },
          {
            "pointId": "10,11",
            "color": "white"
          }
        ],
        "lastMovePointId": "7,11"
      },
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "sigrika",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.8
    },
    {
      "id": "doc-b11-question",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "先看左上角，一堆黑子被白棋包围了。目前看起来有一个真眼，那该怎么做出第二个真眼呢？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-b11-move",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-b11-move",
      "type": "player-move",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "doc-b11-correct",
      "options": [],
      "boardSetup": null,
      "pointId": "1,2",
      "targetHighlightEnabled": false,
      "color": "black",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.5
    },
    {
      "id": "doc-b11-counter",
      "type": "npc-move",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-b11-wrong",
      "options": [],
      "boardSetup": null,
      "pointId": "1,2",
      "targetHighlightEnabled": true,
      "color": "white",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "doc-b11-wrong",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "你好像做了只假眼呢，这下失去活棋的机会了。再想想？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-b11-reset",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": 0.5
    },
    {
      "id": "doc-b11-reset",
      "type": "board-setup",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "doc-b11-question",
      "options": [],
      "boardSetup": {
        "mode": "spark",
        "stones": [
          {
            "pointId": "1,0",
            "color": "black"
          },
          {
            "pointId": "2,0",
            "color": "black"
          },
          {
            "pointId": "3,0",
            "color": "black"
          },
          {
            "pointId": "9,0",
            "color": "black"
          },
          {
            "pointId": "0,1",
            "color": "black"
          },
          {
            "pointId": "2,1",
            "color": "black"
          },
          {
            "pointId": "4,1",
            "color": "black"
          },
          {
            "pointId": "9,1",
            "color": "black"
          },
          {
            "pointId": "10,1",
            "color": "black"
          },
          {
            "pointId": "11,1",
            "color": "black"
          },
          {
            "pointId": "12,1",
            "color": "black"
          },
          {
            "pointId": "0,2",
            "color": "black"
          },
          {
            "pointId": "4,2",
            "color": "black"
          },
          {
            "pointId": "0,6",
            "color": "black"
          },
          {
            "pointId": "1,6",
            "color": "black"
          },
          {
            "pointId": "2,6",
            "color": "black"
          },
          {
            "pointId": "11,6",
            "color": "black"
          },
          {
            "pointId": "2,7",
            "color": "black"
          },
          {
            "pointId": "10,7",
            "color": "black"
          },
          {
            "pointId": "11,7",
            "color": "black"
          },
          {
            "pointId": "3,8",
            "color": "black"
          },
          {
            "pointId": "10,8",
            "color": "black"
          },
          {
            "pointId": "3,9",
            "color": "black"
          },
          {
            "pointId": "9,9",
            "color": "black"
          },
          {
            "pointId": "3,10",
            "color": "black"
          },
          {
            "pointId": "9,10",
            "color": "black"
          },
          {
            "pointId": "3,11",
            "color": "black"
          },
          {
            "pointId": "7,11",
            "color": "black"
          },
          {
            "pointId": "9,11",
            "color": "black"
          },
          {
            "pointId": "0,12",
            "color": "black"
          },
          {
            "pointId": "1,12",
            "color": "black"
          },
          {
            "pointId": "2,12",
            "color": "black"
          },
          {
            "pointId": "3,12",
            "color": "black"
          },
          {
            "pointId": "4,0",
            "color": "white"
          },
          {
            "pointId": "5,0",
            "color": "white"
          },
          {
            "pointId": "8,0",
            "color": "white"
          },
          {
            "pointId": "5,1",
            "color": "white"
          },
          {
            "pointId": "8,1",
            "color": "white"
          },
          {
            "pointId": "2,2",
            "color": "white"
          },
          {
            "pointId": "6,2",
            "color": "white"
          },
          {
            "pointId": "8,2",
            "color": "white"
          },
          {
            "pointId": "9,2",
            "color": "white"
          },
          {
            "pointId": "10,2",
            "color": "white"
          },
          {
            "pointId": "11,2",
            "color": "white"
          },
          {
            "pointId": "12,2",
            "color": "white"
          },
          {
            "pointId": "0,3",
            "color": "white"
          },
          {
            "pointId": "1,3",
            "color": "white"
          },
          {
            "pointId": "2,3",
            "color": "white"
          },
          {
            "pointId": "3,3",
            "color": "white"
          },
          {
            "pointId": "4,3",
            "color": "white"
          },
          {
            "pointId": "5,3",
            "color": "white"
          },
          {
            "pointId": "6,3",
            "color": "white"
          },
          {
            "pointId": "0,7",
            "color": "white"
          },
          {
            "pointId": "1,7",
            "color": "white"
          },
          {
            "pointId": "1,8",
            "color": "white"
          },
          {
            "pointId": "2,8",
            "color": "white"
          },
          {
            "pointId": "11,8",
            "color": "white"
          },
          {
            "pointId": "2,9",
            "color": "white"
          },
          {
            "pointId": "10,9",
            "color": "white"
          },
          {
            "pointId": "12,9",
            "color": "white"
          },
          {
            "pointId": "2,10",
            "color": "white"
          },
          {
            "pointId": "10,10",
            "color": "white"
          },
          {
            "pointId": "0,11",
            "color": "white"
          },
          {
            "pointId": "1,11",
            "color": "white"
          },
          {
            "pointId": "2,11",
            "color": "white"
          },
          {
            "pointId": "10,11",
            "color": "white"
          }
        ],
        "lastMovePointId": "7,11"
      },
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "sigrika",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "doc-b11-correct",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "看来你应该已经懂真眼和假眼的区别了。没错，这样下黑棋成功做出两只真眼，确保是活棋了。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-m13-question",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-m13-question",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "再看看右上，根据你的感觉或计算，黑棋该走哪里才能活？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-m13-move",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-m13-move",
      "type": "player-move",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "doc-m13-correct",
      "options": [],
      "boardSetup": null,
      "pointId": "11,0",
      "targetHighlightEnabled": false,
      "color": "black",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.5
    },
    {
      "id": "doc-m13-correct",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "正解！相反，如果让白棋下到这个位置，那黑棋无论如何也只有一只眼，活不了了。",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-knife-1",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-knife-1",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "再稍微拓展下吧。左下角白棋这个棋形我们称之为“刀把五”，看起来空间很大，白棋似乎高枕无忧。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-knife-a4",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-knife-a4",
      "type": "npc-move",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-knife-2",
      "options": [],
      "boardSetup": null,
      "pointId": "0,9",
      "targetHighlightEnabled": true,
      "color": "black",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "doc-knife-2",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "但若被黑棋这么一点，白棋就无力回天了，怎么也做不出两只眼。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-knife-3",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-knife-3",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "至于为什么做不出两只眼，你有空可以自己拿白棋摆摆哦~",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-life-1",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-life-1",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "以上这些局部，我们都称之为死活题。我们需要思考如何杀棋或活棋，可以很好地锻炼思维能力哦~像右上和左下的棋形属于实战常见死活，我们需要记一下，这样实战真遇到了就不需要花时间计算了。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-pig-question",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-pig-question",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "再来看看右下，也算是一道死活题，该怎么杀黑棋呢？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-pig-user",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-pig-user",
      "type": "player-choice",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "",
      "options": [
        {
          "label": "......",
          "nextNodeId": "doc-pig-1",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-pig-1",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "西西，没想到你还会耍坏呢。",
      "prompt": "",
      "expressionId": "playful",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-pig-2",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-pig-2",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "没有没有，我只是摆个例子而已啦。对于目前刚入门的{username}来说解这道题确实有点超纲了。",
      "prompt": "",
      "expressionId": "embarrassed",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-pig-3",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-pig-3",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "这道题是黑先杀白，棋形名叫“大猪嘴”，很形象吧？也是一道经典的实战常见死活。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-pig-4",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-pig-4",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "相信{username}未来下棋时总会碰到的。不过现在的话先暂且不展开了吧~",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-territory-intro",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-territory-intro",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "前面说的都是死活方面的东西。但围棋终归是通过围空来判定胜负的游戏，吃子只是围空的手段。所以我们接下来聊聊数目和围空。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-setup-4",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-setup-4",
      "type": "board-setup",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "doc-territory-1",
      "options": [],
      "boardSetup": {
        "mode": "spark",
        "stones": [
          {
            "pointId": "3,0",
            "color": "black"
          },
          {
            "pointId": "9,0",
            "color": "black"
          },
          {
            "pointId": "3,1",
            "color": "black"
          },
          {
            "pointId": "9,1",
            "color": "black"
          },
          {
            "pointId": "3,2",
            "color": "black"
          },
          {
            "pointId": "9,2",
            "color": "black"
          },
          {
            "pointId": "10,2",
            "color": "black"
          },
          {
            "pointId": "11,2",
            "color": "black"
          },
          {
            "pointId": "12,2",
            "color": "black"
          },
          {
            "pointId": "0,3",
            "color": "black"
          },
          {
            "pointId": "1,3",
            "color": "black"
          },
          {
            "pointId": "2,3",
            "color": "black"
          },
          {
            "pointId": "3,3",
            "color": "black"
          },
          {
            "pointId": "1,8",
            "color": "black"
          },
          {
            "pointId": "2,8",
            "color": "black"
          },
          {
            "pointId": "3,8",
            "color": "black"
          },
          {
            "pointId": "8,8",
            "color": "black"
          },
          {
            "pointId": "9,8",
            "color": "black"
          },
          {
            "pointId": "10,8",
            "color": "black"
          },
          {
            "pointId": "11,8",
            "color": "black"
          },
          {
            "pointId": "12,8",
            "color": "black"
          },
          {
            "pointId": "0,9",
            "color": "black"
          },
          {
            "pointId": "1,9",
            "color": "black"
          },
          {
            "pointId": "3,9",
            "color": "black"
          },
          {
            "pointId": "4,9",
            "color": "black"
          },
          {
            "pointId": "8,9",
            "color": "black"
          },
          {
            "pointId": "0,10",
            "color": "black"
          },
          {
            "pointId": "4,10",
            "color": "black"
          },
          {
            "pointId": "8,10",
            "color": "black"
          },
          {
            "pointId": "9,10",
            "color": "black"
          },
          {
            "pointId": "10,10",
            "color": "black"
          },
          {
            "pointId": "11,10",
            "color": "black"
          },
          {
            "pointId": "12,10",
            "color": "black"
          },
          {
            "pointId": "3,11",
            "color": "black"
          },
          {
            "pointId": "4,11",
            "color": "black"
          },
          {
            "pointId": "2,12",
            "color": "black"
          },
          {
            "pointId": "3,12",
            "color": "black"
          },
          {
            "pointId": "10,12",
            "color": "black"
          },
          {
            "pointId": "10,0",
            "color": "white"
          },
          {
            "pointId": "11,0",
            "color": "white"
          },
          {
            "pointId": "10,1",
            "color": "white"
          },
          {
            "pointId": "11,1",
            "color": "white"
          },
          {
            "pointId": "2,9",
            "color": "white"
          },
          {
            "pointId": "1,10",
            "color": "white"
          },
          {
            "pointId": "3,10",
            "color": "white"
          },
          {
            "pointId": "0,11",
            "color": "white"
          },
          {
            "pointId": "2,11",
            "color": "white"
          },
          {
            "pointId": "8,11",
            "color": "white"
          },
          {
            "pointId": "9,11",
            "color": "white"
          },
          {
            "pointId": "10,11",
            "color": "white"
          },
          {
            "pointId": "11,11",
            "color": "white"
          },
          {
            "pointId": "12,11",
            "color": "white"
          },
          {
            "pointId": "1,12",
            "color": "white"
          },
          {
            "pointId": "8,12",
            "color": "white"
          },
          {
            "pointId": "11,12",
            "color": "white"
          }
        ],
        "lastMovePointId": "12,8"
      },
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "sigrika",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.8
    },
    {
      "id": "doc-territory-1",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "我们先来看左上角吧。看起来黑棋是不是围了一块3*3的小地盘？我们这里暂且认为白棋无法侵入这块地盘，那这里黑棋围住的每个交叉点都称为“目”，那显然黑棋这里围了9目的空。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-territory-2",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-territory-2",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "那再看看右上角。这里有个白棋方块被黑棋围住了，而且很显然做不出两只眼。根据前面我们所学的死活知识，这块白棋应该算作死棋。那有死棋的地盘该怎么数目呢？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-territory-question-1",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-territory-question-1",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "这里我们记住1颗死子等于2目。那么这里有多少目呢？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [
        {
          "label": "6目",
          "nextNodeId": "doc-territory-wrong-1",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        },
        {
          "label": "10目",
          "nextNodeId": "doc-territory-correct-1",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        },
        {
          "label": "12目",
          "nextNodeId": "doc-territory-wrong-1",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-territory-wrong-1",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "别忘了1颗死子等于2目哦，这里可是有4颗死子呢。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-territory-question-1",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "doc-territory-correct-1",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "答对啦！至于为什么说1颗死子等于2目嘛...你想一颗棋子算作1目，死子提走以后产生的交叉点也是1目，因此就算做2目啦。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-territory-3",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-territory-3",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "举一反三下，如果你一口气提掉对方5个子，那就相当于你已经获得了因提子得到的5目，再加上提走后留下的5个交叉点，就相当于是你围的空，那合在一起就是10目啦。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-territory-4",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-territory-4",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "不过提完子后的空交叉点有时不能保证一定会是你围的空。所以最后还是提子数+实空来数目最保险。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-territory-question-2",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-territory-question-2",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "那我们看看左下角。你觉得这是什么情况？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [
        {
          "label": "白棋活棋，白棋围了3目空",
          "nextNodeId": "doc-territory-wrong-2",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        },
        {
          "label": "白棋全死了，黑棋围了15目空",
          "nextNodeId": "doc-territory-correct-2",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-territory-wrong-2",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "嗯哼？白棋真的有两只真眼吗？",
      "prompt": "",
      "expressionId": "playful",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-territory-question-2",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "doc-territory-correct-2",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "没错没错！那我们看看右下角，白棋和黑棋都围了一些空，哪一方围得更多呢？",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [
        {
          "label": "黑方围得多",
          "nextNodeId": "doc-territory-wrong-3",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        },
        {
          "label": "一样多",
          "nextNodeId": "doc-territory-correct-3",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        },
        {
          "label": "白方围得多",
          "nextNodeId": "doc-territory-wrong-3",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-territory-wrong-3",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "稍微再数数看？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-territory-correct-2",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "doc-territory-correct-3",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "答对啦！{username}理解得真快呢。那数目这方面基本是过关啦！",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-global-intro",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-global-intro",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "前面都是介绍局部的例子，那让我们来看看全局吧。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-setup-5",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-setup-5",
      "type": "board-setup",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "doc-final-count-1",
      "options": [],
      "boardSetup": {
        "mode": "spark",
        "stones": [
          {
            "pointId": "1,0",
            "color": "black"
          },
          {
            "pointId": "7,0",
            "color": "black"
          },
          {
            "pointId": "1,1",
            "color": "black"
          },
          {
            "pointId": "2,1",
            "color": "black"
          },
          {
            "pointId": "3,1",
            "color": "black"
          },
          {
            "pointId": "5,1",
            "color": "black"
          },
          {
            "pointId": "6,1",
            "color": "black"
          },
          {
            "pointId": "7,1",
            "color": "black"
          },
          {
            "pointId": "8,1",
            "color": "black"
          },
          {
            "pointId": "2,2",
            "color": "black"
          },
          {
            "pointId": "8,2",
            "color": "black"
          },
          {
            "pointId": "9,2",
            "color": "black"
          },
          {
            "pointId": "0,3",
            "color": "black"
          },
          {
            "pointId": "1,3",
            "color": "black"
          },
          {
            "pointId": "2,3",
            "color": "black"
          },
          {
            "pointId": "9,3",
            "color": "black"
          },
          {
            "pointId": "2,4",
            "color": "black"
          },
          {
            "pointId": "3,4",
            "color": "black"
          },
          {
            "pointId": "9,4",
            "color": "black"
          },
          {
            "pointId": "8,5",
            "color": "black"
          },
          {
            "pointId": "9,5",
            "color": "black"
          },
          {
            "pointId": "2,6",
            "color": "black"
          },
          {
            "pointId": "3,6",
            "color": "black"
          },
          {
            "pointId": "4,6",
            "color": "black"
          },
          {
            "pointId": "6,6",
            "color": "black"
          },
          {
            "pointId": "7,6",
            "color": "black"
          },
          {
            "pointId": "5,7",
            "color": "black"
          },
          {
            "pointId": "5,8",
            "color": "black"
          },
          {
            "pointId": "6,8",
            "color": "black"
          },
          {
            "pointId": "7,8",
            "color": "black"
          },
          {
            "pointId": "9,8",
            "color": "black"
          },
          {
            "pointId": "1,9",
            "color": "black"
          },
          {
            "pointId": "3,9",
            "color": "black"
          },
          {
            "pointId": "8,9",
            "color": "black"
          },
          {
            "pointId": "0,10",
            "color": "black"
          },
          {
            "pointId": "1,10",
            "color": "black"
          },
          {
            "pointId": "2,10",
            "color": "black"
          },
          {
            "pointId": "3,10",
            "color": "black"
          },
          {
            "pointId": "4,10",
            "color": "black"
          },
          {
            "pointId": "5,10",
            "color": "black"
          },
          {
            "pointId": "9,10",
            "color": "black"
          },
          {
            "pointId": "4,11",
            "color": "black"
          },
          {
            "pointId": "9,11",
            "color": "black"
          },
          {
            "pointId": "10,11",
            "color": "black"
          },
          {
            "pointId": "1,12",
            "color": "black"
          },
          {
            "pointId": "4,12",
            "color": "black"
          },
          {
            "pointId": "5,12",
            "color": "black"
          },
          {
            "pointId": "10,12",
            "color": "black"
          },
          {
            "pointId": "2,0",
            "color": "white"
          },
          {
            "pointId": "3,0",
            "color": "white"
          },
          {
            "pointId": "4,0",
            "color": "white"
          },
          {
            "pointId": "5,0",
            "color": "white"
          },
          {
            "pointId": "6,0",
            "color": "white"
          },
          {
            "pointId": "0,1",
            "color": "white"
          },
          {
            "pointId": "4,1",
            "color": "white"
          },
          {
            "pointId": "0,2",
            "color": "white"
          },
          {
            "pointId": "3,2",
            "color": "white"
          },
          {
            "pointId": "4,2",
            "color": "white"
          },
          {
            "pointId": "5,2",
            "color": "white"
          },
          {
            "pointId": "6,2",
            "color": "white"
          },
          {
            "pointId": "7,2",
            "color": "white"
          },
          {
            "pointId": "3,3",
            "color": "white"
          },
          {
            "pointId": "5,3",
            "color": "white"
          },
          {
            "pointId": "7,3",
            "color": "white"
          },
          {
            "pointId": "8,3",
            "color": "white"
          },
          {
            "pointId": "1,4",
            "color": "white"
          },
          {
            "pointId": "4,4",
            "color": "white"
          },
          {
            "pointId": "8,4",
            "color": "white"
          },
          {
            "pointId": "1,5",
            "color": "white"
          },
          {
            "pointId": "4,5",
            "color": "white"
          },
          {
            "pointId": "5,5",
            "color": "white"
          },
          {
            "pointId": "6,5",
            "color": "white"
          },
          {
            "pointId": "7,5",
            "color": "white"
          },
          {
            "pointId": "1,6",
            "color": "white"
          },
          {
            "pointId": "5,6",
            "color": "white"
          },
          {
            "pointId": "4,7",
            "color": "white"
          },
          {
            "pointId": "0,8",
            "color": "white"
          },
          {
            "pointId": "1,8",
            "color": "white"
          },
          {
            "pointId": "2,8",
            "color": "white"
          },
          {
            "pointId": "3,8",
            "color": "white"
          },
          {
            "pointId": "4,8",
            "color": "white"
          },
          {
            "pointId": "0,9",
            "color": "white"
          },
          {
            "pointId": "2,9",
            "color": "white"
          },
          {
            "pointId": "4,9",
            "color": "white"
          },
          {
            "pointId": "5,9",
            "color": "white"
          },
          {
            "pointId": "6,9",
            "color": "white"
          },
          {
            "pointId": "7,9",
            "color": "white"
          },
          {
            "pointId": "6,10",
            "color": "white"
          },
          {
            "pointId": "8,10",
            "color": "white"
          },
          {
            "pointId": "5,11",
            "color": "white"
          },
          {
            "pointId": "6,11",
            "color": "white"
          },
          {
            "pointId": "8,11",
            "color": "white"
          },
          {
            "pointId": "6,12",
            "color": "white"
          },
          {
            "pointId": "8,12",
            "color": "white"
          },
          {
            "pointId": "9,12",
            "color": "white"
          }
        ],
        "lastMovePointId": "7,0"
      },
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "sigrika",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.8
    },
    {
      "id": "doc-final-count-1",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "这是一盘终局情形。看起来右边黑棋围了很大一块空，但白棋也吃掉了黑棋左上方一大串棋子。双方没有任何提子。那你现在数数看，黑棋和白棋各围了多少空？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-final-count-2",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-final-count-2",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "不要太着急哦，这次可以慢慢数。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "",
      "options": [
        {
          "label": "黑55目，白45目",
          "nextNodeId": "doc-final-count-correct",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        },
        {
          "label": "黑55目，白32目",
          "nextNodeId": "doc-final-count-wrong",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        },
        {
          "label": "黑48目，白40目",
          "nextNodeId": "doc-final-count-wrong",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-final-count-wrong",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "左上角黑棋可是有13颗死子呢。再数数看？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-final-count-2",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "doc-final-count-correct",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "就是这样。因为这是终局了嘛，所以我们计算双方目差，可以判断出黑方比白方多围了10目。我们称之为“黑盘面10目”。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-komi-1",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-komi-1",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "不过你想想，围棋是黑方先行的游戏，先行的一方显然有优势。为了平衡，我们通常会规定黑方贴多少目或子给白方。像我们这种13路棋盘，我们规定黑贴5.5目，也就是贴2又3/4子。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-komi-2",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-komi-2",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "因此，在最后如果是数目判定胜负的话，黑棋的目数要扣除贴目，然后再和白棋的目数比较，谁多就谁赢。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-komi-3",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-komi-3",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "前面我们算的是黑盘面10目，那扣除贴目5.5目，那相当于黑优势4.5目。如果双方认定现在是终局，那我们就可以认定这盘棋是黑胜4.5目。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-counting-method",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-counting-method",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "如果是数子的话，就是将一方的目和活着的棋子加起来后再作比较。但就结果而言和数目相比没太大区别，不会出现相同贴目下，数子和数目胜负不一样的情况。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-capture-note",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-capture-note",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "所以说吃子再多也不代表最后能赢下来哦。吃子只是手段之一，最后还是要比谁围的空更多。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-go-name",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-go-name",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "哼哼，毕竟是叫“围棋”嘛。",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-clear-board",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": 0.5
    },
    {
      "id": "doc-clear-board",
      "type": "board-setup",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "doc-opening-1",
      "options": [],
      "boardSetup": {
        "mode": "spark",
        "stones": []
      },
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "sigrika",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "doc-opening-1",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "讲到现在，基本的围棋规则你应该都了解了。嗯...为了你方便上手下棋，还是稍微教你一下开局小窍门吧。",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-opening-2",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-opening-2",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "啊，我都忘了跟你说边角和中腹的概念了，不过这个应该一说你就懂了。角就是指四个角，边指的就是四条边，中腹就是中间一大块区域。",
      "prompt": "",
      "expressionId": "embarrassed",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-opening-question",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-opening-question",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "那么考你个问题，用相同数量的棋子，去角、边、中腹各围一块空，哪个区域能围得更多呢？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [
        {
          "label": "角",
          "nextNodeId": "doc-opening-correct",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        },
        {
          "label": "边",
          "nextNodeId": "doc-opening-wrong",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        },
        {
          "label": "中腹",
          "nextNodeId": "doc-opening-wrong",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-opening-wrong",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "发挥你的想象力，再好好想想哦。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-opening-question",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "doc-opening-correct",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "嗯嗯，我们用6颗棋子来举例例子吧。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-setup-6",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-setup-6",
      "type": "board-setup",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "doc-efficiency-1",
      "options": [],
      "boardSetup": {
        "mode": "spark",
        "stones": [
          {
            "pointId": "3,0",
            "color": "black"
          },
          {
            "pointId": "3,1",
            "color": "black"
          },
          {
            "pointId": "3,2",
            "color": "black"
          },
          {
            "pointId": "0,3",
            "color": "black"
          },
          {
            "pointId": "1,3",
            "color": "black"
          },
          {
            "pointId": "2,3",
            "color": "black"
          },
          {
            "pointId": "6,5",
            "color": "black"
          },
          {
            "pointId": "7,5",
            "color": "black"
          },
          {
            "pointId": "5,6",
            "color": "black"
          },
          {
            "pointId": "8,6",
            "color": "black"
          },
          {
            "pointId": "6,7",
            "color": "black"
          },
          {
            "pointId": "7,7",
            "color": "black"
          },
          {
            "pointId": "5,10",
            "color": "black"
          },
          {
            "pointId": "6,10",
            "color": "black"
          },
          {
            "pointId": "4,11",
            "color": "black"
          },
          {
            "pointId": "7,11",
            "color": "black"
          },
          {
            "pointId": "4,12",
            "color": "black"
          },
          {
            "pointId": "7,12",
            "color": "black"
          }
        ],
        "lastMovePointId": "7,12"
      },
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "sigrika",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.8
    },
    {
      "id": "doc-efficiency-1",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "看，同样是6颗棋子，角上围了9目空，边上围了4目空，中腹只围了2目空。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-efficiency-2",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-efficiency-2",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "这个说明什么呢？说明对于围空而言，把棋子优先投入到占据角部是最有效率的。其次为边，最后是中腹。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-efficiency-3",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-efficiency-3",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "不知道你有没有听过一句谚语“金角银边草肚皮”，说的就是这个啦。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-efficiency-4",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-efficiency-4",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "所以你看，棋盘刚好有4个角，那开局常规下法，就是双方各占两个角。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-setup-7",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-setup-7",
      "type": "board-setup",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "doc-opening-lines",
      "options": [],
      "boardSetup": {
        "mode": "spark",
        "stones": [
          {
            "pointId": "9,3",
            "color": "black"
          },
          {
            "pointId": "9,10",
            "color": "black"
          },
          {
            "pointId": "2,2",
            "color": "white"
          },
          {
            "pointId": "2,9",
            "color": "white"
          }
        ],
        "lastMovePointId": "2,2"
      },
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "sigrika",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.8
    },
    {
      "id": "doc-opening-lines",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "至于占在几路线上，3路和4路都可以。毕竟2路太低，5路太高了。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-opening-etiquette",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-opening-etiquette",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "啊啊，对了，假如你是下黑棋，那第一手最好要下在自己的右上角。这是一种下棋的礼仪，可千万不要忘了哦。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-story-143",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-143",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "呜哇，不知不觉讲了这么多。{username}，这下关于围棋基础知识你应该有所了解了吧。",
      "prompt": "",
      "expressionId": "embarrassed",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-story-144",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-144",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "学会了基础知识后就可以尝试下棋了。之后所有进阶的内容无非就是为了“如何取胜”了。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-story-145",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-145",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "比如定式、布局、中盘、官子、死活、打入、进攻、侵消...",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-story-146",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-146",
      "type": "story",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "西西，不要念经了...",
      "prompt": "",
      "expressionId": "annoyed",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-story-147",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-147",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "咳咳，不好意思。总之如果还想学进阶的内容的话，可以去我们学院的图书馆，IRIS数据档案库里有充足的知识呢。",
      "prompt": "",
      "expressionId": "embarrassed",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-story-148",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-148",
      "type": "story",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "（眨眼睛，眨眼睛）",
      "prompt": "",
      "expressionId": "playful",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-story-149",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-149",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "嗯...嗯？娅娅，你想说些什么吗？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-story-150",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-150",
      "type": "story",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "西西，你是不是忘了些什么。",
      "prompt": "",
      "expressionId": "playful",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-story-151",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-151",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "嗯，我忘了...啊！",
      "prompt": "",
      "expressionId": "surprised",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-story-153",
      "options": [
        {
          "label": "（看着西格莉卡把自己的脸颊拍扁了）",
          "nextNodeId": "doc-story-153",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-153",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "{username}！请你看看我跟娅娅的对局吧。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-skill-setup",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-skill-setup",
      "type": "board-setup",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "doc-skill-user-157",
      "options": [],
      "boardSetup": {
        "mode": "spark",
        "stones": [
          {
            "pointId": "8,1",
            "color": "black"
          },
          {
            "pointId": "3,2",
            "color": "white"
          },
          {
            "pointId": "9,2",
            "color": "black"
          },
          {
            "pointId": "10,2",
            "color": "white"
          },
          {
            "pointId": "6,3",
            "color": "black"
          },
          {
            "pointId": "7,3",
            "color": "white"
          },
          {
            "pointId": "8,3",
            "color": "white"
          },
          {
            "pointId": "9,3",
            "color": "black"
          },
          {
            "pointId": "10,3",
            "color": "white"
          },
          {
            "pointId": "2,4",
            "color": "black"
          },
          {
            "pointId": "6,4",
            "color": "white"
          },
          {
            "pointId": "7,4",
            "color": "black"
          },
          {
            "pointId": "8,4",
            "color": "black"
          },
          {
            "pointId": "9,4",
            "color": "white"
          },
          {
            "pointId": "10,4",
            "color": "white"
          },
          {
            "pointId": "11,4",
            "color": "black"
          },
          {
            "pointId": "6,5",
            "color": "white"
          },
          {
            "pointId": "7,5",
            "color": "black"
          },
          {
            "pointId": "8,5",
            "color": "white"
          },
          {
            "pointId": "9,5",
            "color": "black"
          },
          {
            "pointId": "10,5",
            "color": "black"
          },
          {
            "pointId": "11,5",
            "color": "white"
          },
          {
            "pointId": "5,6",
            "color": "white"
          },
          {
            "pointId": "6,6",
            "color": "black"
          },
          {
            "pointId": "7,6",
            "color": "black"
          },
          {
            "pointId": "8,6",
            "color": "white"
          },
          {
            "pointId": "11,6",
            "color": "black"
          },
          {
            "pointId": "4,7",
            "color": "white"
          },
          {
            "pointId": "5,7",
            "color": "black"
          },
          {
            "pointId": "6,7",
            "color": "black"
          },
          {
            "pointId": "7,7",
            "color": "white"
          },
          {
            "pointId": "3,8",
            "color": "white"
          },
          {
            "pointId": "4,8",
            "color": "black"
          },
          {
            "pointId": "5,8",
            "color": "black"
          },
          {
            "pointId": "6,8",
            "color": "white"
          },
          {
            "pointId": "2,9",
            "color": "white"
          },
          {
            "pointId": "4,9",
            "color": "black"
          },
          {
            "pointId": "5,9",
            "color": "white"
          },
          {
            "pointId": "4,10",
            "color": "white"
          },
          {
            "pointId": "9,10",
            "color": "black"
          }
        ]
      },
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "sigrika",
      "npcName": "",
      "playerColor": "white",
      "playerCharacterId": "denia",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.8
    },
    {
      "id": "doc-skill-user-157",
      "type": "player-choice",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "",
      "options": [
        {
          "label": "（这个棋好像爬楼梯啊...）",
          "nextNodeId": "doc-skill-user-158",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-skill-user-158",
      "type": "player-choice",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "",
      "options": [
        {
          "label": "（总觉得...）",
          "nextNodeId": "doc-skill-159",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-skill-159",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "{username}，你觉得现在黑棋怎么样？",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-skill-user-160",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-skill-user-160",
      "type": "player-choice",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "",
      "options": [
        {
          "label": "我感觉...黑棋是不是逃不出去了。",
          "nextNodeId": "doc-skill-161",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-skill-161",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "嗯嗯，你的判断很正确。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-skill-162",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-skill-162",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "但是！",
      "prompt": "",
      "expressionId": "original",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-skill-f3",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.4
    },
    {
      "id": "doc-skill-f3",
      "type": "npc-skill",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-skill-g4",
      "options": [],
      "boardSetup": null,
      "pointId": "5,10",
      "targetHighlightEnabled": true,
      "color": "black",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "sigrika",
      "skillId": "sigrika",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "doc-skill-g4",
      "type": "npc-move",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-skill-user-165",
      "options": [],
      "boardSetup": null,
      "pointId": "6,9",
      "targetHighlightEnabled": true,
      "color": "black",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "doc-skill-user-165",
      "type": "player-choice",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "",
      "options": [
        {
          "label": "！",
          "nextNodeId": "doc-skill-user-166",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-skill-user-166",
      "type": "player-choice",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "",
      "options": [
        {
          "label": "这颗被提掉的白子不是有2口气吗？怎么突然没气了。",
          "nextNodeId": "doc-skill-167",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-skill-167",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "哼哼，这就是我们星炬围棋的特殊之处。我们可以将自己的共鸣力融合进棋盘之中，发动出强力的技能。",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-skill-168",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-skill-168",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "我刚刚发动了“星辉符文”这个技能，可以抹除棋盘上一个交叉点。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-skill-169",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-skill-169",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "这么一来，刚刚那颗白子就少了一口气，我就可以落子提掉它了。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [
        {
          "label": "哦哦哦！！",
          "nextNodeId": "doc-skill-172",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        },
        {
          "label": "好赖皮！",
          "nextNodeId": "doc-skill-172",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-skill-172",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "不过这种技能通常一盘棋只能用一次，而是还是有代价的，也就是“超频”。我刚刚因为发动技能也同时获得了3子的超频。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-skill-173",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-skill-173",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "也就是说我要额外贴对方3个子，就相当于是贴6目棋，也是不小的代价呢。",
      "prompt": "",
      "expressionId": "worried",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-skill-174",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-skill-174",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "好啦，娅娅，该你表演啦~",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-skill-175",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-skill-175",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "嗯哼？",
      "prompt": "",
      "expressionId": "playful",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-skill-f5",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.5
    },
    {
      "id": "doc-skill-f5",
      "type": "player-skill",
      "characterId": "denia",
      "speakerName": "",
      "text": "",
      "prompt": "请点击达妮娅技能，然后选择F-5处的棋子发动技能",
      "expressionId": "serious",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-skill-user-178",
      "options": [],
      "boardSetup": null,
      "pointId": "5,8",
      "targetHighlightEnabled": true,
      "color": "white",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "denia",
      "skillId": "denia",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.5
    },
    {
      "id": "doc-skill-user-178",
      "type": "player-choice",
      "characterId": "",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "nextNodeId": "",
      "options": [
        {
          "label": "！？好酷炫？！这就是达妮娅的技能吗？",
          "nextNodeId": "doc-skill-179",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-skill-179",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "我的共鸣技能是让场上一枚黑或白棋反色。不过释放这个技能的回合我不能继续落子就是了。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-skill-180",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-skill-180",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "呜呜...娅娅的技能还是太超模了。这棋没法下了，只能认输了...",
      "prompt": "",
      "expressionId": "worried",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-story-182",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-182",
      "type": "story",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "（哈欠）下棋真的好累...",
      "prompt": "",
      "expressionId": "sleepy",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-story-183",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-183",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "仔细想想，刚刚如果我选择去吃上面的2颗白子的话，这棋应该就不会这么快结束...",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-story-184",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-184",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "不过这都是为了让{username}更直观地看到我们技能的效果...呜呜，输棋果然还是超苦娅西！",
      "prompt": "",
      "expressionId": "worried",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-story-185",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-185",
      "type": "story",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "（摸摸头）",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-story-186",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-186",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "咳咳。总之，这下子{username}应该能了解我们星炬围棋的特点了吧。",
      "prompt": "",
      "expressionId": "embarrassed",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-story-187",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-187",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "把棋局引导向适合自己技能发动的局面，从而实现出奇制胜。怎么样，有趣吧~",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-story-188",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-188",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "另外，我们围棋部还有其它部员。每个部员都有自己独一无二的技能，{username}可以多去认识认识。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-story-189-sigrika",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-189-sigrika",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "不过，大多数共鸣技能还是会遵循围棋的基本规则，不会太乱来啦……",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-story-189-denia",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-189-denia",
      "type": "story",
      "characterId": "denia",
      "speakerName": "达妮娅",
      "text": "我记得之前来过一位在学院里很火的粉色系偶像歌手。她一发动技能，连棋盘都被摧毁了。",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "doc-story-190",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-190",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "不许说她坏话啦！虽然她那个时候不小心把棋盘炸毁了，但后面她送了我们几十块棋盘！也算是给我们部提供物资支持啦~",
      "prompt": "",
      "expressionId": "angry",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-story-191",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-191",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "咳咳。总之呢，{username}平时有空的话可以多来我们围棋部下下棋，毕竟熟能生巧嘛。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-story-192",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-192",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "我们这里还有19路的标准围棋盘。我们围棋部约定好了，如果用19路棋盘下棋，就不允许使用技能。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-story-193",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-193",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "要是围棋下累了，也可以来盘五子棋放松一下~",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-story-194",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "doc-story-194",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "西格莉卡",
      "text": "哦对了，忘记自我介绍了。我是星炬学院围棋部部长，西格莉卡！{username}，以后还请多多指教呢！",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-15",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "这么厉害的吗？哼哼，那要不现在跟我下一盘试试看？",
      "prompt": "",
      "expressionId": "surprised",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-16",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-16",
      "type": "board-setup",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-17",
      "options": [],
      "boardSetup": {
        "mode": "spark",
        "stones": [
          {
            "pointId": "2,2",
            "color": "white"
          },
          {
            "pointId": "5,3",
            "color": "white"
          },
          {
            "pointId": "6,3",
            "color": "black"
          },
          {
            "pointId": "9,3",
            "color": "black"
          },
          {
            "pointId": "4,4",
            "color": "white"
          },
          {
            "pointId": "5,4",
            "color": "black"
          },
          {
            "pointId": "6,4",
            "color": "black"
          },
          {
            "pointId": "7,4",
            "color": "white"
          },
          {
            "pointId": "3,5",
            "color": "white"
          },
          {
            "pointId": "4,5",
            "color": "black"
          },
          {
            "pointId": "5,5",
            "color": "black"
          },
          {
            "pointId": "6,5",
            "color": "white"
          },
          {
            "pointId": "1,6",
            "color": "white"
          },
          {
            "pointId": "2,6",
            "color": "white"
          },
          {
            "pointId": "3,6",
            "color": "black"
          },
          {
            "pointId": "4,6",
            "color": "black"
          },
          {
            "pointId": "5,6",
            "color": "white"
          },
          {
            "pointId": "1,7",
            "color": "black"
          },
          {
            "pointId": "2,7",
            "color": "white"
          },
          {
            "pointId": "3,7",
            "color": "black"
          },
          {
            "pointId": "4,7",
            "color": "white"
          },
          {
            "pointId": "2,8",
            "color": "black"
          },
          {
            "pointId": "3,8",
            "color": "white"
          },
          {
            "pointId": "2,9",
            "color": "black"
          },
          {
            "pointId": "3,9",
            "color": "white"
          },
          {
            "pointId": "2,10",
            "color": "black"
          },
          {
            "pointId": "3,10",
            "color": "white"
          },
          {
            "pointId": "9,10",
            "color": "black"
          },
          {
            "pointId": "1,11",
            "color": "black"
          },
          {
            "pointId": "3,11",
            "color": "black"
          },
          {
            "pointId": "4,11",
            "color": "white"
          },
          {
            "pointId": "2,12",
            "color": "black"
          }
        ]
      },
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "sigrika",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 1
    },
    {
      "id": "story-17",
      "type": "npc-move",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "打吃！",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-18",
      "options": [],
      "boardSetup": null,
      "pointId": "6,2",
      "targetHighlightEnabled": true,
      "color": "white",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.75
    },
    {
      "id": "story-18",
      "type": "player-move",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-24",
      "options": [],
      "boardSetup": null,
      "pointId": "7,3",
      "targetHighlightEnabled": true,
      "color": "black",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-24",
      "type": "npc-move",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "再打吃！",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-26",
      "options": [],
      "boardSetup": null,
      "pointId": "8,3",
      "targetHighlightEnabled": true,
      "color": "white",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.85
    },
    {
      "id": "story-26",
      "type": "player-choice",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-25",
      "options": [
        {
          "label": "...",
          "nextNodeId": "branch-25",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-25",
      "type": "player-move",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-46",
      "options": [],
      "boardSetup": null,
      "pointId": "7,2",
      "targetHighlightEnabled": true,
      "color": "black",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-46",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "原来已经接触过一些啦，那要不要跟我下一盘试试？",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-21",
      "options": [
        {
          "label": "好的",
          "nextNodeId": "story-16",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-21",
      "type": "npc-skill",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "哼哼，现在让你看看我的本领！",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-22",
      "options": [],
      "boardSetup": null,
      "pointId": "7,1",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "sigrika",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-22",
      "type": "npc-move",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [],
      "boardSetup": null,
      "pointId": "8,2",
      "targetHighlightEnabled": true,
      "color": "white",
      "npcCharacterId": "",
      "npcName": "",
      "playerColor": "",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "branch-25",
      "type": "player-choice",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [
        {
          "label": "等等，这样一路追下去……不是征不掉吗？",
          "nextNodeId": "branch-26",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "branch-26",
      "type": "player-move",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-27",
      "options": [],
      "boardSetup": null,
      "pointId": "7,2",
      "targetHighlightEnabled": true,
      "color": "black",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.35
    },
    {
      "id": "story-27",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "哼哼，普通的围棋或许是这样，但是——",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-28",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 1.2
    },
    {
      "id": "story-28",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "看看这招！",
      "prompt": "",
      "expressionId": "original",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-29",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 1
    },
    {
      "id": "story-29",
      "type": "npc-skill",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-30",
      "options": [],
      "boardSetup": null,
      "pointId": "7,1",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "sigrika",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.3
    },
    {
      "id": "story-30",
      "type": "npc-move",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-31",
      "options": [],
      "boardSetup": null,
      "pointId": "8,2",
      "targetHighlightEnabled": true,
      "color": "white",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.65
    },
    {
      "id": "story-31",
      "type": "player-choice",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [
        {
          "label": "啊？",
          "nextNodeId": "branch-32",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "branch-32",
      "type": "player-choice",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [
        {
          "label": "这、这是作弊了吧！",
          "nextNodeId": "branch-33",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "branch-33",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "这你就不懂啦。这是我的共鸣技能【星辉符文】，可以抹除棋盘上的一个交叉点，然后还可以继续落子。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-225",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-225",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "这样一来你原本只有两口气的棋，我一回合就可以消灭掉哦~",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-34",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-34",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "这就是我们星炬围棋的特别之处：让共鸣能力融入棋盘，创造普通围棋里不会出现的战术。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-35",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-35",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "不过呢，这些技能通常只能一盘棋使用一次，而且有些技能会有超频的负面代价。比如我使用的这个技能，超频为3子，代表我到数子阶段要多贴你3个子，相当于6目棋呢。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-36",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": 0
    },
    {
      "id": "story-36",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "所以，考虑什么时候发动技能、值不值得付出代价，也是星炬围棋中很重要的一环呢。",
      "prompt": "",
      "expressionId": "thinking",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [
        {
          "label": "听起来还挺有意思的...",
          "nextNodeId": "branch-37",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.35
    },
    {
      "id": "branch-37",
      "type": "player-choice",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [
        {
          "label": "不过，我已经死了这么多棋……这盘只能认输了。",
          "nextNodeId": "branch-38",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "branch-38",
      "type": "resign",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "请点击认输键",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-39",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "black",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.8
    },
    {
      "id": "story-39",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "怎么样，这下应该明白我们围棋部的“特别之处”了吧？",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-47",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-40",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "咳咳。总之，我们围棋部还有好多部员，每个部员都有不同的共鸣能力技能。{username}同学以后可以多去认识认识~",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-43",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-47",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "噢，对了——娅娅，快醒醒！该轮到你展示啦。",
      "prompt": "",
      "expressionId": "original",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-48",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-48",
      "type": "story",
      "characterId": "denia",
      "speakerName": "",
      "text": "......嗯？怎么了，要我做什么吗？",
      "prompt": "",
      "expressionId": "sleepy",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "story-49",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-49",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "来陪我走几手，给{username}看看你的能力嘛~",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-50",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-50",
      "type": "story",
      "characterId": "denia",
      "speakerName": "",
      "text": "呜哇，好麻烦。好吧...",
      "prompt": "",
      "expressionId": "annoyed",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "story-51",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-51",
      "type": "board-setup",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-52",
      "options": [],
      "boardSetup": {
        "mode": "spark",
        "stones": [
          {
            "pointId": "8,1",
            "color": "black"
          },
          {
            "pointId": "3,2",
            "color": "white"
          },
          {
            "pointId": "9,2",
            "color": "black"
          },
          {
            "pointId": "10,2",
            "color": "white"
          },
          {
            "pointId": "6,3",
            "color": "black"
          },
          {
            "pointId": "7,3",
            "color": "white"
          },
          {
            "pointId": "8,3",
            "color": "white"
          },
          {
            "pointId": "9,3",
            "color": "black"
          },
          {
            "pointId": "10,3",
            "color": "white"
          },
          {
            "pointId": "2,4",
            "color": "black"
          },
          {
            "pointId": "6,4",
            "color": "white"
          },
          {
            "pointId": "7,4",
            "color": "black"
          },
          {
            "pointId": "8,4",
            "color": "black"
          },
          {
            "pointId": "9,4",
            "color": "white"
          },
          {
            "pointId": "10,4",
            "color": "white"
          },
          {
            "pointId": "11,4",
            "color": "black"
          },
          {
            "pointId": "6,5",
            "color": "white"
          },
          {
            "pointId": "7,5",
            "color": "black"
          },
          {
            "pointId": "8,5",
            "color": "white"
          },
          {
            "pointId": "9,5",
            "color": "black"
          },
          {
            "pointId": "10,5",
            "color": "black"
          },
          {
            "pointId": "11,5",
            "color": "white"
          },
          {
            "pointId": "5,6",
            "color": "white"
          },
          {
            "pointId": "6,6",
            "color": "black"
          },
          {
            "pointId": "7,6",
            "color": "black"
          },
          {
            "pointId": "8,6",
            "color": "white"
          },
          {
            "pointId": "11,6",
            "color": "black"
          },
          {
            "pointId": "4,7",
            "color": "white"
          },
          {
            "pointId": "5,7",
            "color": "black"
          },
          {
            "pointId": "6,7",
            "color": "black"
          },
          {
            "pointId": "7,7",
            "color": "white"
          },
          {
            "pointId": "3,8",
            "color": "white"
          },
          {
            "pointId": "4,8",
            "color": "black"
          },
          {
            "pointId": "5,8",
            "color": "black"
          },
          {
            "pointId": "6,8",
            "color": "white"
          },
          {
            "pointId": "2,9",
            "color": "white"
          },
          {
            "pointId": "4,9",
            "color": "black"
          },
          {
            "pointId": "5,9",
            "color": "white"
          },
          {
            "pointId": "4,10",
            "color": "white"
          },
          {
            "pointId": "9,10",
            "color": "black"
          }
        ]
      },
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "sigrika",
      "npcName": "",
      "playerColor": "white",
      "playerCharacterId": "denia",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 1
    },
    {
      "id": "story-52",
      "type": "player-choice",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-41",
      "options": [
        {
          "label": "怎么又是这种征子局面...",
          "nextNodeId": "story-53",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-54",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "嘿嘿，看来你已经学会了嘛！",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-55",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 1.2
    },
    {
      "id": "story-55",
      "type": "npc-skill",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-56",
      "options": [],
      "boardSetup": null,
      "pointId": "5,10",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "sigrika",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.35
    },
    {
      "id": "story-56",
      "type": "npc-move",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-57",
      "options": [],
      "boardSetup": null,
      "pointId": "6,9",
      "targetHighlightEnabled": true,
      "color": "black",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.7
    },
    {
      "id": "story-57",
      "type": "player-choice",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [
        {
          "label": "黑棋死里逃生了，这下白棋应该不行了",
          "nextNodeId": "story-58",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-58",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "",
      "text": "嗯哼？",
      "prompt": "",
      "expressionId": "playful",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "story-59",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 1
    },
    {
      "id": "story-59",
      "type": "player-skill",
      "characterId": "denia",
      "speakerName": "",
      "text": "",
      "prompt": "请点击技能按钮，然后选择目标棋子",
      "expressionId": "serious",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "story-60",
      "options": [],
      "boardSetup": null,
      "pointId": "5,8",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "denia",
      "skillId": "denia",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": 0.8
    },
    {
      "id": "story-60",
      "type": "player-choice",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "expressionId": "worried",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [
        {
          "label": "哇，好酷炫！这就是达妮娅的技能吗！",
          "nextNodeId": "story-61",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-61",
      "type": "npc-dialogue",
      "characterId": "denia",
      "speakerName": "",
      "text": "是的，我的技能是让场上一枚棋子反色。不过使用这个技能的回合我不能继续落子就是了。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "story-62",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-62",
      "type": "npc-dialogue",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "呜呜，娅娅的技能还是太超模了。被吃了这么多，只能认输了...",
      "prompt": "",
      "expressionId": "worried",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "doc-story-182",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-63",
      "type": "story",
      "characterId": "denia",
      "speakerName": "",
      "text": "（哈欠）下盘棋真的好累啊。",
      "prompt": "",
      "expressionId": "sleepy",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "story-64",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-64",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "呜...这盘棋只是给{username}同学演示一下啦。认真下的话，刚刚我应该用技能去吃上面的2个子的，这样就不会被一口气反吃了。",
      "prompt": "",
      "expressionId": "embarrassed",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-40",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-53",
      "type": "player-choice",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [
        {
          "label": "啊，我懂了，你要发动那个了是吧",
          "nextNodeId": "story-54",
          "revealDelaySeconds": "",
          "transitionDelaySeconds": 0.2
        }
      ],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": false,
      "autoContinueEnabled": true,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-41",
      "type": "story",
      "characterId": "denia",
      "speakerName": "",
      "text": "比如我的共鸣技能是让棋盘上一颗棋子反色哦~虽然用了这技能以后不能再落子就是了。",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "denia-standard-v1",
      "nextNodeId": "story-42",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-42",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "娅娅的技能说实话实战能力挺强的...我好多大优的棋，被她使用技能逆转了好多次...真是好赖皮的技能！",
      "prompt": "",
      "expressionId": "angry",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-43",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-43",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "另外呢，我们围棋部也可以下正常的19路的标准围棋哦~如果是下这个的话，我们大家都约定好了，不允许使用技能。",
      "prompt": "",
      "expressionId": "serious",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-44",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-44",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "如果下围棋下累了，还可以下下五子棋放松一下~",
      "prompt": "",
      "expressionId": "closed_smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "story-45",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    },
    {
      "id": "story-45",
      "type": "story",
      "characterId": "sigrika",
      "speakerName": "",
      "text": "哦对了，忘记自我介绍了。我是星炬学院围棋部部长，西格莉卡！{username}同学，以后还请多多指教呢！",
      "prompt": "",
      "expressionId": "smile",
      "appearanceId": "sigrika-standard-v1",
      "nextNodeId": "",
      "options": [],
      "boardSetup": null,
      "pointId": "",
      "targetHighlightEnabled": true,
      "color": "",
      "npcCharacterId": "denia",
      "npcName": "",
      "playerColor": "black",
      "playerCharacterId": "",
      "skillCharacterId": "",
      "skillId": "",
      "manualContinueEnabled": true,
      "autoContinueEnabled": false,
      "autoContinueDelaySeconds": ""
    }
  ],
  "home": [
    {
      "id": "hello",
      "text": "对了，之前光聊围棋了，还没向你介绍我们围棋部呢。",
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "smile"
    },
    {
      "id": "handbook",
      "text": "这是你的部员手册，翻开来看看吧~",
      "target": "handbook",
      "action": true,
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "closed_smile"
    },
    {
      "id": "handbook-intro",
      "text": "部员手册可以查看围棋部里现在有哪些部员，点击部员卡片可以查看相应部员的具体信息哦~",
      "window": "house",
      "surface": ".house-modal",
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "serious"
    },
    {
      "id": "sigrika",
      "text": "",
      "target": "sigrika-card",
      "window": "house",
      "action": true,
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "smile"
    },
    {
      "id": "skill",
      "text": "看，在这里你能看到我的共鸣技能以及其它的所有信息。",
      "window": "house",
      "surface": ".character-details-modal",
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "smile"
    },
    {
      "id": "know-members",
      "text": "有空的时候也记得看看其它部员的哦。毕竟知己知彼方能百战百胜嘛。",
      "window": "house",
      "surface": ".character-details-modal",
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "serious"
    },
    {
      "id": "match",
      "text": "再回到我们棋盘前面，点击这个试试吧。",
      "target": "match",
      "action": true,
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "smile"
    },
    {
      "id": "match-intro",
      "text": "你可以在这里选择对局模式，选择模式后会自动帮你匹配选择了同一模式的在线玩家。匹配成功后就可以进行对局了哦。",
      "window": "matchModePicker",
      "surface": ".match-mode-modal",
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "serious"
    },
    {
      "id": "practice",
      "text": "嘿嘿，我们围棋部里还配置了准时宝机器人当陪练。虽然水平不怎么样，但是当你想熟悉部员技能或者星炬对弈模式，都可以找它练练手~",
      "window": "matchModePicker",
      "target": "practice",
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "closed_smile"
    },
    {
      "id": "resume",
      "text": "再看看你的学生证吧~刚刚已经帮你登记进围棋部系统了。",
      "target": "resume",
      "action": true,
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "smile"
    },
    {
      "id": "resume-intro",
      "text": "这是你的围棋部履历，可以看到你在我们围棋部中的各种胜负、段位数据，还可以查看你的历史对局记录。",
      "window": "resume",
      "surface": ".resume-modal",
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "serious"
    },
    {
      "id": "player-choice",
      "text": "",
      "choice": "可是我看围棋部里好像只有你和达妮娅，其它部员呢？",
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "smile"
    },
    {
      "id": "new-club",
      "text": "诶嘿嘿，其实我们围棋部才刚开张不久，还没来得及招新呢...",
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "embarrassed"
    },
    {
      "id": "recruitment",
      "text": "不过我都想好办法了，点开这个看看吧。",
      "target": "recruitment",
      "action": true,
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "smile"
    },
    {
      "id": "recruitment-intro",
      "text": "铛铛，这就是我们的招募系统啦。我们可以准备招新物品来招募新部员。",
      "window": "recruitment",
      "surface": ".recruitment-modal",
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "original"
    },
    {
      "id": "recruitment-items",
      "text": "目前来说，招募我们学院内的最好用招新海报，如果想找学院外的就只能通过电台广播来找啦。",
      "window": "recruitment",
      "surface": ".recruitment-modal",
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "serious"
    },
    {
      "id": "recruitment-result",
      "text": "使用了招募物品后，过一段时间就会有招募结果呢。可能一开始不太好招，但坚持下去相信总会吸引到新部员上门的！",
      "window": "recruitment",
      "surface": ".recruitment-modal",
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "smile"
    },
    {
      "id": "recruitment-gift",
      "text": "我过一会会准备一些招募物品发到你的邮箱，到时候记得查收哦。",
      "window": "recruitment",
      "surface": ".recruitment-modal",
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "closed_smile"
    },
    {
      "id": "shop",
      "text": "不过我准备的招募物品数量有限...我先带你去扎希拉姐姐的商店吧。",
      "target": "shop",
      "action": true,
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "worried"
    },
    {
      "id": "shop-intro",
      "text": "这里就是扎希拉姐姐的商店了。在这里除了招募物品外，还可以买到其它各种小玩意儿哦~",
      "window": "shop",
      "surface": ".shop-modal",
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "smile"
    },
    {
      "id": "shop-explore",
      "text": "不过我就不一一介绍了，你可以自己再摸索一下。",
      "window": "shop",
      "surface": ".shop-modal",
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "closed_smile"
    },
    {
      "id": "mailbox",
      "text": "你说邮箱在哪？嗯，这个应该在你的学生系统里的。我指给你看吧。",
      "target": "mailbox",
      "action": true,
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "thinking"
    },
    {
      "id": "mailbox-intro",
      "text": "未来各种讯息、围棋部的奖励等等都会送到你的邮箱里哦~所以要记得定时查看一下。",
      "window": "mailbox",
      "surface": ".mailbox-modal",
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "serious"
    },
    {
      "id": "goodbye",
      "text": "嗯...我想应该介绍的差不多了。啊，差不多到上课的时间了，那我先走啦~拜拜~",
      "characterId": "sigrika",
      "appearanceId": "sigrika-standard-v1",
      "expressionId": "smile"
    }
  ],
  "boardSnapshots": {
    "story-18": {
      "stones": [
        {
          "pointId": "2,2",
          "color": "white"
        },
        {
          "pointId": "6,2",
          "color": "white"
        },
        {
          "pointId": "5,3",
          "color": "white"
        },
        {
          "pointId": "6,3",
          "color": "black"
        },
        {
          "pointId": "9,3",
          "color": "black"
        },
        {
          "pointId": "4,4",
          "color": "white"
        },
        {
          "pointId": "5,4",
          "color": "black"
        },
        {
          "pointId": "6,4",
          "color": "black"
        },
        {
          "pointId": "7,4",
          "color": "white"
        },
        {
          "pointId": "3,5",
          "color": "white"
        },
        {
          "pointId": "4,5",
          "color": "black"
        },
        {
          "pointId": "5,5",
          "color": "black"
        },
        {
          "pointId": "6,5",
          "color": "white"
        },
        {
          "pointId": "1,6",
          "color": "white"
        },
        {
          "pointId": "2,6",
          "color": "white"
        },
        {
          "pointId": "3,6",
          "color": "black"
        },
        {
          "pointId": "4,6",
          "color": "black"
        },
        {
          "pointId": "5,6",
          "color": "white"
        },
        {
          "pointId": "1,7",
          "color": "black"
        },
        {
          "pointId": "2,7",
          "color": "white"
        },
        {
          "pointId": "3,7",
          "color": "black"
        },
        {
          "pointId": "4,7",
          "color": "white"
        },
        {
          "pointId": "2,8",
          "color": "black"
        },
        {
          "pointId": "3,8",
          "color": "white"
        },
        {
          "pointId": "2,9",
          "color": "black"
        },
        {
          "pointId": "3,9",
          "color": "white"
        },
        {
          "pointId": "2,10",
          "color": "black"
        },
        {
          "pointId": "3,10",
          "color": "white"
        },
        {
          "pointId": "9,10",
          "color": "black"
        },
        {
          "pointId": "1,11",
          "color": "black"
        },
        {
          "pointId": "3,11",
          "color": "black"
        },
        {
          "pointId": "4,11",
          "color": "white"
        },
        {
          "pointId": "2,12",
          "color": "black"
        }
      ],
      "invalidPoints": [],
      "lastMovePointId": "6,2",
      "captures": {
        "black": 0,
        "white": 0
      },
      "ko": null
    },
    "story-24": {
      "stones": [
        {
          "pointId": "2,2",
          "color": "white"
        },
        {
          "pointId": "6,2",
          "color": "white"
        },
        {
          "pointId": "5,3",
          "color": "white"
        },
        {
          "pointId": "6,3",
          "color": "black"
        },
        {
          "pointId": "7,3",
          "color": "black"
        },
        {
          "pointId": "9,3",
          "color": "black"
        },
        {
          "pointId": "4,4",
          "color": "white"
        },
        {
          "pointId": "5,4",
          "color": "black"
        },
        {
          "pointId": "6,4",
          "color": "black"
        },
        {
          "pointId": "7,4",
          "color": "white"
        },
        {
          "pointId": "3,5",
          "color": "white"
        },
        {
          "pointId": "4,5",
          "color": "black"
        },
        {
          "pointId": "5,5",
          "color": "black"
        },
        {
          "pointId": "6,5",
          "color": "white"
        },
        {
          "pointId": "1,6",
          "color": "white"
        },
        {
          "pointId": "2,6",
          "color": "white"
        },
        {
          "pointId": "3,6",
          "color": "black"
        },
        {
          "pointId": "4,6",
          "color": "black"
        },
        {
          "pointId": "5,6",
          "color": "white"
        },
        {
          "pointId": "1,7",
          "color": "black"
        },
        {
          "pointId": "2,7",
          "color": "white"
        },
        {
          "pointId": "3,7",
          "color": "black"
        },
        {
          "pointId": "4,7",
          "color": "white"
        },
        {
          "pointId": "2,8",
          "color": "black"
        },
        {
          "pointId": "3,8",
          "color": "white"
        },
        {
          "pointId": "2,9",
          "color": "black"
        },
        {
          "pointId": "3,9",
          "color": "white"
        },
        {
          "pointId": "2,10",
          "color": "black"
        },
        {
          "pointId": "3,10",
          "color": "white"
        },
        {
          "pointId": "9,10",
          "color": "black"
        },
        {
          "pointId": "1,11",
          "color": "black"
        },
        {
          "pointId": "3,11",
          "color": "black"
        },
        {
          "pointId": "4,11",
          "color": "white"
        },
        {
          "pointId": "2,12",
          "color": "black"
        }
      ],
      "invalidPoints": [],
      "lastMovePointId": "7,3",
      "captures": {
        "black": 0,
        "white": 0
      },
      "ko": null
    },
    "doc-ko-user": {
      "stones": [
        {
          "pointId": "3,2",
          "color": "black"
        },
        {
          "pointId": "10,2",
          "color": "black"
        },
        {
          "pointId": "2,3",
          "color": "black"
        },
        {
          "pointId": "4,3",
          "color": "black"
        },
        {
          "pointId": "8,3",
          "color": "white"
        },
        {
          "pointId": "9,3",
          "color": "black"
        },
        {
          "pointId": "11,3",
          "color": "black"
        },
        {
          "pointId": "3,4",
          "color": "black"
        },
        {
          "pointId": "8,4",
          "color": "black"
        },
        {
          "pointId": "9,4",
          "color": "white"
        },
        {
          "pointId": "10,4",
          "color": "black"
        },
        {
          "pointId": "11,4",
          "color": "white"
        },
        {
          "pointId": "10,5",
          "color": "white"
        },
        {
          "pointId": "9,8",
          "color": "white"
        },
        {
          "pointId": "10,8",
          "color": "white"
        },
        {
          "pointId": "11,8",
          "color": "white"
        },
        {
          "pointId": "12,8",
          "color": "white"
        },
        {
          "pointId": "1,9",
          "color": "white"
        },
        {
          "pointId": "2,9",
          "color": "white"
        },
        {
          "pointId": "8,9",
          "color": "white"
        },
        {
          "pointId": "9,9",
          "color": "white"
        },
        {
          "pointId": "10,9",
          "color": "black"
        },
        {
          "pointId": "11,9",
          "color": "black"
        },
        {
          "pointId": "12,9",
          "color": "white"
        },
        {
          "pointId": "0,10",
          "color": "black"
        },
        {
          "pointId": "1,10",
          "color": "black"
        },
        {
          "pointId": "2,10",
          "color": "white"
        },
        {
          "pointId": "3,10",
          "color": "white"
        },
        {
          "pointId": "7,10",
          "color": "white"
        },
        {
          "pointId": "9,10",
          "color": "black"
        },
        {
          "pointId": "11,10",
          "color": "black"
        },
        {
          "pointId": "12,10",
          "color": "black"
        },
        {
          "pointId": "0,11",
          "color": "white"
        },
        {
          "pointId": "1,11",
          "color": "black"
        },
        {
          "pointId": "2,11",
          "color": "black"
        },
        {
          "pointId": "3,11",
          "color": "white"
        },
        {
          "pointId": "7,11",
          "color": "white"
        },
        {
          "pointId": "8,11",
          "color": "white"
        },
        {
          "pointId": "9,11",
          "color": "white"
        },
        {
          "pointId": "10,11",
          "color": "black"
        },
        {
          "pointId": "12,11",
          "color": "black"
        },
        {
          "pointId": "1,12",
          "color": "white"
        },
        {
          "pointId": "2,12",
          "color": "black"
        },
        {
          "pointId": "3,12",
          "color": "white"
        },
        {
          "pointId": "9,12",
          "color": "white"
        },
        {
          "pointId": "10,12",
          "color": "black"
        },
        {
          "pointId": "11,12",
          "color": "black"
        },
        {
          "pointId": "12,12",
          "color": "black"
        }
      ],
      "invalidPoints": [],
      "lastMovePointId": "10,4",
      "captures": {
        "black": 2,
        "white": 0
      },
      "ko": "10,3"
    },
    "doc-capture-correct": {
      "stones": [
        {
          "pointId": "3,2",
          "color": "black"
        },
        {
          "pointId": "10,2",
          "color": "black"
        },
        {
          "pointId": "2,3",
          "color": "black"
        },
        {
          "pointId": "4,3",
          "color": "black"
        },
        {
          "pointId": "8,3",
          "color": "white"
        },
        {
          "pointId": "9,3",
          "color": "black"
        },
        {
          "pointId": "10,3",
          "color": "white"
        },
        {
          "pointId": "11,3",
          "color": "black"
        },
        {
          "pointId": "3,4",
          "color": "black"
        },
        {
          "pointId": "8,4",
          "color": "black"
        },
        {
          "pointId": "9,4",
          "color": "white"
        },
        {
          "pointId": "11,4",
          "color": "white"
        },
        {
          "pointId": "10,5",
          "color": "white"
        },
        {
          "pointId": "9,8",
          "color": "white"
        },
        {
          "pointId": "10,8",
          "color": "white"
        },
        {
          "pointId": "11,8",
          "color": "white"
        },
        {
          "pointId": "12,8",
          "color": "white"
        },
        {
          "pointId": "1,9",
          "color": "white"
        },
        {
          "pointId": "2,9",
          "color": "white"
        },
        {
          "pointId": "8,9",
          "color": "white"
        },
        {
          "pointId": "9,9",
          "color": "white"
        },
        {
          "pointId": "10,9",
          "color": "black"
        },
        {
          "pointId": "11,9",
          "color": "black"
        },
        {
          "pointId": "12,9",
          "color": "white"
        },
        {
          "pointId": "0,10",
          "color": "black"
        },
        {
          "pointId": "1,10",
          "color": "black"
        },
        {
          "pointId": "2,10",
          "color": "white"
        },
        {
          "pointId": "3,10",
          "color": "white"
        },
        {
          "pointId": "7,10",
          "color": "white"
        },
        {
          "pointId": "9,10",
          "color": "black"
        },
        {
          "pointId": "11,10",
          "color": "black"
        },
        {
          "pointId": "12,10",
          "color": "black"
        },
        {
          "pointId": "0,11",
          "color": "white"
        },
        {
          "pointId": "1,11",
          "color": "black"
        },
        {
          "pointId": "2,11",
          "color": "black"
        },
        {
          "pointId": "3,11",
          "color": "white"
        },
        {
          "pointId": "7,11",
          "color": "white"
        },
        {
          "pointId": "8,11",
          "color": "white"
        },
        {
          "pointId": "9,11",
          "color": "white"
        },
        {
          "pointId": "10,11",
          "color": "black"
        },
        {
          "pointId": "12,11",
          "color": "black"
        },
        {
          "pointId": "1,12",
          "color": "white"
        },
        {
          "pointId": "2,12",
          "color": "black"
        },
        {
          "pointId": "3,12",
          "color": "white"
        },
        {
          "pointId": "9,12",
          "color": "white"
        },
        {
          "pointId": "10,12",
          "color": "black"
        },
        {
          "pointId": "11,12",
          "color": "black"
        },
        {
          "pointId": "12,12",
          "color": "black"
        }
      ],
      "invalidPoints": [],
      "lastMovePointId": "3,4",
      "captures": {
        "black": 1,
        "white": 0
      },
      "ko": null
    },
    "doc-forbidden-result": {
      "stones": [
        {
          "pointId": "3,2",
          "color": "black"
        },
        {
          "pointId": "10,2",
          "color": "black"
        },
        {
          "pointId": "2,3",
          "color": "black"
        },
        {
          "pointId": "4,3",
          "color": "black"
        },
        {
          "pointId": "8,3",
          "color": "white"
        },
        {
          "pointId": "9,3",
          "color": "black"
        },
        {
          "pointId": "11,3",
          "color": "black"
        },
        {
          "pointId": "3,4",
          "color": "black"
        },
        {
          "pointId": "8,4",
          "color": "black"
        },
        {
          "pointId": "9,4",
          "color": "white"
        },
        {
          "pointId": "10,4",
          "color": "black"
        },
        {
          "pointId": "11,4",
          "color": "white"
        },
        {
          "pointId": "10,5",
          "color": "white"
        },
        {
          "pointId": "9,8",
          "color": "white"
        },
        {
          "pointId": "10,8",
          "color": "white"
        },
        {
          "pointId": "11,8",
          "color": "white"
        },
        {
          "pointId": "12,8",
          "color": "white"
        },
        {
          "pointId": "1,9",
          "color": "white"
        },
        {
          "pointId": "2,9",
          "color": "white"
        },
        {
          "pointId": "8,9",
          "color": "white"
        },
        {
          "pointId": "9,9",
          "color": "white"
        },
        {
          "pointId": "10,9",
          "color": "black"
        },
        {
          "pointId": "11,9",
          "color": "black"
        },
        {
          "pointId": "12,9",
          "color": "white"
        },
        {
          "pointId": "0,10",
          "color": "black"
        },
        {
          "pointId": "1,10",
          "color": "black"
        },
        {
          "pointId": "2,10",
          "color": "white"
        },
        {
          "pointId": "3,10",
          "color": "white"
        },
        {
          "pointId": "7,10",
          "color": "white"
        },
        {
          "pointId": "9,10",
          "color": "black"
        },
        {
          "pointId": "11,10",
          "color": "black"
        },
        {
          "pointId": "12,10",
          "color": "black"
        },
        {
          "pointId": "0,11",
          "color": "white"
        },
        {
          "pointId": "1,11",
          "color": "black"
        },
        {
          "pointId": "2,11",
          "color": "black"
        },
        {
          "pointId": "3,11",
          "color": "white"
        },
        {
          "pointId": "7,11",
          "color": "white"
        },
        {
          "pointId": "8,11",
          "color": "white"
        },
        {
          "pointId": "9,11",
          "color": "white"
        },
        {
          "pointId": "10,11",
          "color": "black"
        },
        {
          "pointId": "12,11",
          "color": "black"
        },
        {
          "pointId": "1,12",
          "color": "white"
        },
        {
          "pointId": "2,12",
          "color": "black"
        },
        {
          "pointId": "3,12",
          "color": "white"
        },
        {
          "pointId": "9,12",
          "color": "white"
        },
        {
          "pointId": "10,12",
          "color": "black"
        },
        {
          "pointId": "11,12",
          "color": "black"
        },
        {
          "pointId": "12,12",
          "color": "black"
        }
      ],
      "invalidPoints": [],
      "lastMovePointId": "10,4",
      "captures": {
        "black": 2,
        "white": 0
      },
      "ko": "10,3"
    },
    "doc-skill-g4": {
      "stones": [
        {
          "pointId": "8,1",
          "color": "black"
        },
        {
          "pointId": "3,2",
          "color": "white"
        },
        {
          "pointId": "9,2",
          "color": "black"
        },
        {
          "pointId": "10,2",
          "color": "white"
        },
        {
          "pointId": "6,3",
          "color": "black"
        },
        {
          "pointId": "7,3",
          "color": "white"
        },
        {
          "pointId": "8,3",
          "color": "white"
        },
        {
          "pointId": "9,3",
          "color": "black"
        },
        {
          "pointId": "10,3",
          "color": "white"
        },
        {
          "pointId": "2,4",
          "color": "black"
        },
        {
          "pointId": "6,4",
          "color": "white"
        },
        {
          "pointId": "7,4",
          "color": "black"
        },
        {
          "pointId": "8,4",
          "color": "black"
        },
        {
          "pointId": "9,4",
          "color": "white"
        },
        {
          "pointId": "10,4",
          "color": "white"
        },
        {
          "pointId": "11,4",
          "color": "black"
        },
        {
          "pointId": "6,5",
          "color": "white"
        },
        {
          "pointId": "7,5",
          "color": "black"
        },
        {
          "pointId": "8,5",
          "color": "white"
        },
        {
          "pointId": "9,5",
          "color": "black"
        },
        {
          "pointId": "10,5",
          "color": "black"
        },
        {
          "pointId": "11,5",
          "color": "white"
        },
        {
          "pointId": "5,6",
          "color": "white"
        },
        {
          "pointId": "6,6",
          "color": "black"
        },
        {
          "pointId": "7,6",
          "color": "black"
        },
        {
          "pointId": "8,6",
          "color": "white"
        },
        {
          "pointId": "11,6",
          "color": "black"
        },
        {
          "pointId": "4,7",
          "color": "white"
        },
        {
          "pointId": "5,7",
          "color": "black"
        },
        {
          "pointId": "6,7",
          "color": "black"
        },
        {
          "pointId": "7,7",
          "color": "white"
        },
        {
          "pointId": "3,8",
          "color": "white"
        },
        {
          "pointId": "4,8",
          "color": "black"
        },
        {
          "pointId": "5,8",
          "color": "black"
        },
        {
          "pointId": "6,8",
          "color": "white"
        },
        {
          "pointId": "2,9",
          "color": "white"
        },
        {
          "pointId": "4,9",
          "color": "black"
        },
        {
          "pointId": "5,9",
          "color": "white"
        },
        {
          "pointId": "4,10",
          "color": "white"
        },
        {
          "pointId": "9,10",
          "color": "black"
        }
      ],
      "invalidPoints": [
        "5,10"
      ],
      "lastMovePointId": "",
      "captures": {
        "black": 0,
        "white": 0
      },
      "ko": null
    },
    "doc-skill-user-165": {
      "stones": [
        {
          "pointId": "8,1",
          "color": "black"
        },
        {
          "pointId": "3,2",
          "color": "white"
        },
        {
          "pointId": "9,2",
          "color": "black"
        },
        {
          "pointId": "10,2",
          "color": "white"
        },
        {
          "pointId": "6,3",
          "color": "black"
        },
        {
          "pointId": "7,3",
          "color": "white"
        },
        {
          "pointId": "8,3",
          "color": "white"
        },
        {
          "pointId": "9,3",
          "color": "black"
        },
        {
          "pointId": "10,3",
          "color": "white"
        },
        {
          "pointId": "2,4",
          "color": "black"
        },
        {
          "pointId": "6,4",
          "color": "white"
        },
        {
          "pointId": "7,4",
          "color": "black"
        },
        {
          "pointId": "8,4",
          "color": "black"
        },
        {
          "pointId": "9,4",
          "color": "white"
        },
        {
          "pointId": "10,4",
          "color": "white"
        },
        {
          "pointId": "11,4",
          "color": "black"
        },
        {
          "pointId": "6,5",
          "color": "white"
        },
        {
          "pointId": "7,5",
          "color": "black"
        },
        {
          "pointId": "8,5",
          "color": "white"
        },
        {
          "pointId": "9,5",
          "color": "black"
        },
        {
          "pointId": "10,5",
          "color": "black"
        },
        {
          "pointId": "11,5",
          "color": "white"
        },
        {
          "pointId": "5,6",
          "color": "white"
        },
        {
          "pointId": "6,6",
          "color": "black"
        },
        {
          "pointId": "7,6",
          "color": "black"
        },
        {
          "pointId": "8,6",
          "color": "white"
        },
        {
          "pointId": "11,6",
          "color": "black"
        },
        {
          "pointId": "4,7",
          "color": "white"
        },
        {
          "pointId": "5,7",
          "color": "black"
        },
        {
          "pointId": "6,7",
          "color": "black"
        },
        {
          "pointId": "7,7",
          "color": "white"
        },
        {
          "pointId": "3,8",
          "color": "white"
        },
        {
          "pointId": "4,8",
          "color": "black"
        },
        {
          "pointId": "5,8",
          "color": "black"
        },
        {
          "pointId": "6,8",
          "color": "white"
        },
        {
          "pointId": "2,9",
          "color": "white"
        },
        {
          "pointId": "4,9",
          "color": "black"
        },
        {
          "pointId": "6,9",
          "color": "black"
        },
        {
          "pointId": "4,10",
          "color": "white"
        },
        {
          "pointId": "9,10",
          "color": "black"
        }
      ],
      "invalidPoints": [
        "5,10"
      ],
      "lastMovePointId": "6,9",
      "captures": {
        "black": 1,
        "white": 0
      },
      "ko": null
    },
    "doc-skill-174": {
      "stones": [
        {
          "pointId": "8,1",
          "color": "black"
        },
        {
          "pointId": "3,2",
          "color": "white"
        },
        {
          "pointId": "9,2",
          "color": "black"
        },
        {
          "pointId": "10,2",
          "color": "white"
        },
        {
          "pointId": "6,3",
          "color": "black"
        },
        {
          "pointId": "7,3",
          "color": "white"
        },
        {
          "pointId": "8,3",
          "color": "white"
        },
        {
          "pointId": "9,3",
          "color": "black"
        },
        {
          "pointId": "10,3",
          "color": "white"
        },
        {
          "pointId": "2,4",
          "color": "black"
        },
        {
          "pointId": "6,4",
          "color": "white"
        },
        {
          "pointId": "7,4",
          "color": "black"
        },
        {
          "pointId": "8,4",
          "color": "black"
        },
        {
          "pointId": "9,4",
          "color": "white"
        },
        {
          "pointId": "10,4",
          "color": "white"
        },
        {
          "pointId": "11,4",
          "color": "black"
        },
        {
          "pointId": "6,5",
          "color": "white"
        },
        {
          "pointId": "7,5",
          "color": "black"
        },
        {
          "pointId": "8,5",
          "color": "white"
        },
        {
          "pointId": "9,5",
          "color": "black"
        },
        {
          "pointId": "10,5",
          "color": "black"
        },
        {
          "pointId": "11,5",
          "color": "white"
        },
        {
          "pointId": "5,6",
          "color": "white"
        },
        {
          "pointId": "6,6",
          "color": "black"
        },
        {
          "pointId": "7,6",
          "color": "black"
        },
        {
          "pointId": "8,6",
          "color": "white"
        },
        {
          "pointId": "11,6",
          "color": "black"
        },
        {
          "pointId": "4,7",
          "color": "white"
        },
        {
          "pointId": "5,7",
          "color": "black"
        },
        {
          "pointId": "6,7",
          "color": "black"
        },
        {
          "pointId": "7,7",
          "color": "white"
        },
        {
          "pointId": "3,8",
          "color": "white"
        },
        {
          "pointId": "4,8",
          "color": "black"
        },
        {
          "pointId": "5,8",
          "color": "black"
        },
        {
          "pointId": "6,8",
          "color": "white"
        },
        {
          "pointId": "2,9",
          "color": "white"
        },
        {
          "pointId": "4,9",
          "color": "black"
        },
        {
          "pointId": "6,9",
          "color": "black"
        },
        {
          "pointId": "4,10",
          "color": "white"
        },
        {
          "pointId": "9,10",
          "color": "black"
        }
      ],
      "invalidPoints": [
        "5,10"
      ],
      "lastMovePointId": "6,9",
      "captures": {
        "black": 1,
        "white": 0
      },
      "ko": null
    },
    "doc-skill-user-178": {
      "stones": [
        {
          "pointId": "8,1",
          "color": "black"
        },
        {
          "pointId": "3,2",
          "color": "white"
        },
        {
          "pointId": "9,2",
          "color": "black"
        },
        {
          "pointId": "10,2",
          "color": "white"
        },
        {
          "pointId": "6,3",
          "color": "black"
        },
        {
          "pointId": "7,3",
          "color": "white"
        },
        {
          "pointId": "8,3",
          "color": "white"
        },
        {
          "pointId": "9,3",
          "color": "black"
        },
        {
          "pointId": "10,3",
          "color": "white"
        },
        {
          "pointId": "2,4",
          "color": "black"
        },
        {
          "pointId": "6,4",
          "color": "white"
        },
        {
          "pointId": "9,4",
          "color": "white"
        },
        {
          "pointId": "10,4",
          "color": "white"
        },
        {
          "pointId": "11,4",
          "color": "black"
        },
        {
          "pointId": "6,5",
          "color": "white"
        },
        {
          "pointId": "8,5",
          "color": "white"
        },
        {
          "pointId": "9,5",
          "color": "black"
        },
        {
          "pointId": "10,5",
          "color": "black"
        },
        {
          "pointId": "11,5",
          "color": "white"
        },
        {
          "pointId": "5,6",
          "color": "white"
        },
        {
          "pointId": "8,6",
          "color": "white"
        },
        {
          "pointId": "11,6",
          "color": "black"
        },
        {
          "pointId": "4,7",
          "color": "white"
        },
        {
          "pointId": "7,7",
          "color": "white"
        },
        {
          "pointId": "3,8",
          "color": "white"
        },
        {
          "pointId": "4,8",
          "color": "black"
        },
        {
          "pointId": "5,8",
          "color": "white"
        },
        {
          "pointId": "6,8",
          "color": "white"
        },
        {
          "pointId": "2,9",
          "color": "white"
        },
        {
          "pointId": "4,9",
          "color": "black"
        },
        {
          "pointId": "6,9",
          "color": "black"
        },
        {
          "pointId": "4,10",
          "color": "white"
        },
        {
          "pointId": "9,10",
          "color": "black"
        }
      ],
      "invalidPoints": [
        "5,10"
      ],
      "lastMovePointId": "6,9",
      "captures": {
        "black": 1,
        "white": 0
      },
      "ko": null
    }
  }
};
