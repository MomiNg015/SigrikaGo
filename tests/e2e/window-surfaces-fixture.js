export const windowSurfaces = {
  Warehouse: ".warehouse-modal", Resume: ".resume-modal", Profile: ".user-profile-modal",
  House: ".house-modal", Achievements: ".achievement-modal", Personalization: ".personalization-modal",
  Recruitment: ".recruitment-modal", Shop: ".shop-modal", Leaderboard: ".leaderboard-modal",
  Friends: ".friends-modal", Mailbox: ".mailbox-modal", Announcements: ".announcement-modal",
  MessageBoard: ".message-board-modal", Settings: ".settings-modal", Watch: ".watch-list-modal", Confirm: ".confirm-modal"
};

export async function mockWindowData(page) {
  await page.route("**/api/**", route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith("/api/")) return route.continue();
    const data = { items: [], players: [], rooms: [], friends: [], blacklist: [], messages: [], announcements: [], achievements: [], costumes: [], traits: [], tracks: [], options: [], equipment: {}, summary: {}, unreadCount: 0, total: 0, hasMore: false };
    if (url.pathname === "/api/items/inventory") data.items = [{ itemId: "candy", name: "彩虹糖", quantity: 3, description: "彩色的糖果，带来甜甜的好心情。", type: "consumable", imageUrl: "/assets/items/rainbow-candy.webp" }];
    return route.fulfill({ json: data });
  });
}

export async function settleWindow(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
    .map(animation => animation.finished.catch(() => {}))));
}
