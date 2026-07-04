import { Archive, CircleDotDashed, Eye, ShoppingBag, Trophy, UsersRound } from "lucide-react";

const UTILITY_ITEMS = [
  {
    key: "recruitment",
    className: "recruitment-entry",
    tone: "pink",
    title: "招募",
    image: "/assets/home/home-utility-recruitment.webp",
    Icon: CircleDotDashed,
    handler: "onOpenRecruitment"
  },
  {
    key: "shop",
    className: "shop-entry",
    tone: "cream",
    title: "商店",
    image: "/assets/home/home-utility-shop.webp",
    Icon: ShoppingBag,
    handler: "onOpenShop"
  },
  {
    key: "warehouse",
    className: "warehouse-entry",
    tone: "mint",
    title: "仓库",
    image: "/assets/home/home-utility-warehouse.webp",
    Icon: Archive,
    handler: "onOpenWarehouse"
  },
  {
    key: "leaderboard",
    className: "leaderboard-entry",
    tone: "blue",
    title: "排行",
    image: "/assets/home/home-utility-leaderboard.webp",
    Icon: Trophy,
    handler: "onOpenLeaderboard"
  },
  {
    key: "watch",
    className: "watch-entry",
    tone: "teal",
    title: "观战",
    image: "/assets/home/home-utility-watch.webp",
    Icon: Eye,
    handler: "onOpenWatch"
  },
  {
    key: "friends",
    className: "friends-entry",
    tone: "violet",
    title: "好友",
    image: "/assets/home/home-utility-friends.webp",
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
      {UTILITY_ITEMS.map(({ key, className, tone, title, image, Icon, handler }) => (
        <button
          aria-label={title}
          className={`home-entry utility-entry utility-image-entry ${className} utility-tone-${tone} ${key === "recruitment" && recruitmentReady ? "has-alert" : ""}`}
          data-ui-sound="none"
          key={key}
          onClick={handlers[handler]}
          title={title}
          type="button"
        >
          <img className="utility-entry-art" src={image} alt="" aria-hidden="true" decoding="async" />
          <i className="utility-entry-icon" aria-hidden="true">
            <Icon size={24} />
          </i>
          <strong>{title}</strong>
        </button>
      ))}
    </nav>
  );
}
