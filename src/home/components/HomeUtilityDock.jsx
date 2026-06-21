import { Archive, CircleDotDashed, Eye, ShoppingBag, Trophy, UsersRound } from "lucide-react";

export default function HomeUtilityDock({ onOpenFriends, onOpenGacha, onOpenLeaderboard, onOpenShop, onOpenWarehouse, onOpenWatch }) {
  return (
    <div className="home-utility-grid tactical-nav-grid">
      <button className="home-entry utility-entry gacha-entry recruitment-entry" onClick={onOpenGacha} title="招募暂未开放" aria-label="招募暂未开放" disabled>
        <CircleDotDashed size={28} />
        <strong>招募</strong>
      </button>
      <button className="home-entry utility-entry shop-entry" data-ui-sound="none" onClick={onOpenShop} title="商店">
        <ShoppingBag size={28} />
        <strong>商店</strong>
      </button>
      <button className="home-entry utility-entry warehouse-entry" onClick={onOpenWarehouse} title="仓库">
        <Archive size={28} />
        <strong>仓库</strong>
      </button>
      <button className="home-entry utility-entry leaderboard-entry" onClick={onOpenLeaderboard} title="排行榜">
        <Trophy size={28} />
        <strong>排行榜</strong>
      </button>
      <button className="home-entry utility-entry watch-entry" onClick={onOpenWatch} title="观战">
        <Eye size={28} />
        <strong>观战</strong>
      </button>
      <button className="home-entry utility-entry friends-entry" onClick={onOpenFriends} title="好友">
        <UsersRound size={28} />
        <strong>好友</strong>
      </button>
    </div>
  );
}
