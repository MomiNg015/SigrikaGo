# 复用依据

- `src/modals/WatchModal.jsx`：全玩法请求；trim + lowercase 按房间号与双方名字本地筛选；原生刷新、错误、空态。
- `src/modals/watch/WatchRoomRow.jsx`：整卡按钮、共享角色头像与身份渲染、人数／手数／状态。
- `src/styles/mobile-adaptive/friends-companion-search.css`：已确认的纸框输入样式，无聚焦外框。
- `src/styles/mobile-adaptive/watch-ledger.css`、`watch-ledger-mobile.css`：现有桌面表头及竖屏层级；新样式仅限定预览根类。
- `docs/design-samples/watch-mobile-2026-10-13/fixtures.js`：复用七场示例、空态、长名称、多房间。
- `.trellis/spec/frontend/css-architecture.md`：保留滚动卡片阴影和变换余量。
- `DESIGN.md`：既有校园纸色、墨色、霞鹜字体，禁止借此更改整个产品风格。
