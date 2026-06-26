import { Archive, CircleDotDashed, Eye, ShoppingBag, Trophy, UsersRound } from "lucide-react";

const UTILITY_ITEMS = [
  {
    key: "recruitment",
    className: "recruitment-entry",
    tone: "pink",
    title: "招募",
    description: "成员补给",
    Icon: CircleDotDashed,
    handler: "onOpenRecruitment"
  },
  {
    key: "shop",
    className: "shop-entry",
    tone: "cream",
    title: "商店",
    description: "物资购入",
    Icon: ShoppingBag,
    handler: "onOpenShop",
    sound: "none"
  },
  {
    key: "warehouse",
    className: "warehouse-entry",
    tone: "mint",
    title: "仓库",
    description: "道具管理",
    Icon: Archive,
    handler: "onOpenWarehouse"
  },
  {
    key: "leaderboard",
    className: "leaderboard-entry",
    tone: "blue",
    title: "排行",
    description: "天梯记录",
    Icon: Trophy,
    handler: "onOpenLeaderboard"
  },
  {
    key: "watch",
    className: "watch-entry",
    tone: "teal",
    title: "观战",
    description: "当前房间",
    Icon: Eye,
    handler: "onOpenWatch"
  },
  {
    key: "friends",
    className: "friends-entry",
    tone: "violet",
    title: "好友",
    description: "社交列表",
    Icon: UsersRound,
    handler: "onOpenFriends"
  }
];

export default function HomeUtilityDock({
  recruitmentReady = false,
  onOpenFriends,
  onOpenRecruitment,
  onOpenLeaderboard,
  onOpenShop,
  onOpenWarehouse,
  onOpenWatch
}) {
  const handlers = {
    onOpenFriends,
    onOpenRecruitment,
    onOpenLeaderboard,
    onOpenShop,
    onOpenWarehouse,
    onOpenWatch
  };

  return (
    <nav className="home-utility-grid tactical-nav-grid" aria-label="大厅工具箱">
      {UTILITY_ITEMS.map(({ key, className, tone, title, description, Icon, handler, sound }) => (
        <button
          className={`home-entry utility-entry ${className} utility-tone-${tone} ${key === "recruitment" && recruitmentReady ? "has-alert" : ""}`}
          data-ui-sound={sound}
          key={key}
          onClick={handlers[handler]}
          title={`${title}：${description}`}
          type="button"
        >
          <i className="utility-entry-icon" aria-hidden="true">
            <Icon size={24} />
          </i>
          <strong>{title}</strong>
          <span className="utility-entry-description">
            <small>{description}</small>
          </span>
        </button>
      ))}
    </nav>
  );
}
