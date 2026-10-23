// Imported only by this standalone preview. Every /api request stays local.
const params = new URLSearchParams(location.search);
const empty = params.get('fixture') === 'empty';
const long = params.get('fixture') === 'long';
const today = Date.now();
const ago = days => new Date(today - days * 86400000).toISOString();
const announcementBody = '致围棋部的各位同学：\n\n秋日的棋盘已经摆好，放学后，一起在社团教室见吧。无论是刚刚学会落子的新人，还是熟悉棋路的老朋友，都欢迎来参加本周的社团活动。\n\n## 本周的棋局，等你落子\n\n- **自由对弈**：约上好友，在熟悉的棋盘上试一试新的想法。\n- **围观好棋**：打开观战窗口，看看其他同学的精彩对局。\n- **认识部员**：翻翻部员手册，了解伙伴们各不相同的技能。\n\n胜负之外，还有很多值得记住的瞬间。\n\n星炬学院围棋部';
let announcements = empty ? [] : [
  ['club', 'announcement', '秋日社团活动 · 下一手，与你相遇', true, true, 0],
  ['welcome', 'announcement', '致新部员的一封欢迎信', false, true, 1],
  ['notice', 'announcement', '周末自由对弈室开放通知', false, true, 2],
  ['match', 'announcement', '社团友谊赛 · 参与须知', false, false, 3],
  ['maintenance', 'announcement', '对局服务维护已完成', false, false, 5],
  ['autumn', 'announcement', '这个秋天，来下一盘棋吧', false, false, 7],
  ['log-latest', 'changelog', '体验更新 · 让每一步更顺手', true, true, 0],
  ['log-old', 'changelog', '社团日志 · 新的相遇', false, false, 6],
].map(([id, kind, title, pinned, isUnread, days]) => ({
  id, kind, title: title + (long ? ' —— 关于新学期全部社团活动安排及参与方式的补充说明' : ''),
  pinned, isUnread, firstPublishedAt: ago(days), updatedAt: ago(days),
  body: kind === 'changelog' ? '## 本次调整\n\n- 改善部分窗口的阅读体验。\n- 优化窄屏设备上的内容排布。\n- 保留熟悉的操作方式与动态反馈。\n\n感谢每一位提供建议的同学。' : announcementBody.repeat(long ? 5 : 1),
}));
let messages = empty ? [] : [
  { id: 'gift', title: '新学期，送你一份小小的见面礼', sender: '星炬学院围棋部', createdAt: ago(0), isRead: false, claimable: true, deletable: false,
    body: '亲爱的部员：\n\n欢迎回到围棋部！新学期的第一份招募海报已经为你备好，希望能帮你结识新的伙伴。\n\n窗外的风刚刚好，棋盘也已经摆好。\n\n**下一局，一起下吧。**\n\n星炬学院围棋部',
    attachment: { type: 'item', itemId: 'campus-recruitment-poster', itemName: '招募海报', itemDescription: '贴上一张招募海报，邀请新的伙伴加入围棋部。', imageUrl: '/assets/items/recruitment-poster.webp', quantity: 3 } },
  { id: 'coins', title: '社团活动奖励已送达', sender: '活动筹备组', createdAt: ago(1), isRead: false, claimable: true, deletable: false, body: '感谢你参加本次社团活动！\n\n这份奖励是大家一起留下的纪念，请收下。', attachment: { type: 'coins', amount: 800 } },
  { id: 'recruit', title: '电台传来了一段新的声音', sender: '社团广播站', createdAt: ago(2), isRead: true, claimable: true, deletable: false, body: '今天的电台招募券已经寄出。\n\n调好频率，听一听下一位伙伴的声音吧。', attachment: { type: 'item', itemId: 'radio-recruitment-ticket', itemName: '电台招募券', itemDescription: '一张承载相遇的电台招募券。', imageUrl: '/assets/items/radio-recruitment-ticket.webp', quantity: 1 } },
  { id: 'letter', title: '欢迎加入星炬学院围棋部', sender: '围棋部', createdAt: ago(3), isRead: false, claimable: false, deletable: true, body: '欢迎加入围棋部。\n\n这里有等你结识的伙伴，也有等待下一手的棋盘。期待和你一起度过更多有趣的放学时光。', attachment: null },
  { id: 'claimed', title: '上周的对弈奖励', sender: '活动筹备组', createdAt: ago(5), isRead: true, claimable: false, deletable: true, body: '本周奖励已领取。\n\n下一盘棋，再见！', attachment: { type: 'coins', amount: 500 } },
  { id: 'read', title: '社团教室开放时间调整', sender: '围棋部', createdAt: ago(8), isRead: true, claimable: false, deletable: true, body: '社团教室的开放时间已调整。\n\n欢迎大家课后来坐坐。', attachment: null },
];
if (long) messages = messages.map(message => ({ ...message, title: message.title + ' —— 关于新学期活动安排与奖励发放的补充说明', body: message.body.repeat(8), attachment: message.attachment?.type === 'item' ? { ...message.attachment, quantity: 9999 } : message.attachment }));
const nativeFetch = window.fetch.bind(window);
window.__sampleRequests = [];
window.fetch = async (input, options = {}) => {
  const url = new URL(input instanceof Request ? input.url : String(input), location.href);
  if (!url.pathname.startsWith('/api/')) return nativeFetch(input, options);
  const path = url.pathname;
  const method = options.method || (input instanceof Request ? input.method : 'GET');
  window.__sampleRequests.push({ path, method });
  await new Promise(resolve => setTimeout(resolve, 120));
  if (path === '/api/announcements' && method === 'GET') {
    const items = announcements.filter(item => item.kind === url.searchParams.get('kind'));
    return Response.json({ items, hasMore: false, nextOffset: items.length });
  }
  const noticeMatch = path.match(/^\/api\/announcements\/([^/]+)(\/read)?$/);
  if (noticeMatch) {
    const entry = announcements.find(item => item.id === noticeMatch[1]);
    if (!entry) return Response.json({ error: '公告不存在' }, { status: 404 });
    if (noticeMatch[2] && method === 'POST') {
      announcements = announcements.map(item => item.id === entry.id ? { ...item, isUnread: false } : item);
      return Response.json({ summary: { unreadByKind: { announcement: announcements.filter(item => item.kind === 'announcement' && item.isUnread).length, changelog: announcements.filter(item => item.kind === 'changelog' && item.isUnread).length } } });
    }
    if (!noticeMatch[2] && method === 'GET') return Response.json({ entry });
  }
  if (path === '/api/mailbox' && method === 'GET') return Response.json({ messages });
  const mailMatch = path.match(/^\/api\/mailbox\/([^/]+)(?:\/(read|claim))?$/);
  if (mailMatch) {
    const message = messages.find(item => item.id === mailMatch[1]);
    if (!message) return Response.json({ error: '邮件不存在' }, { status: 404 });
    if (mailMatch[2] === 'read' && method === 'POST') {
      messages = messages.map(item => item.id === message.id ? { ...item, isRead: true } : item);
      return Response.json({ ok: true });
    }
    if (mailMatch[2] === 'claim' && method === 'POST' && message.claimable) {
      messages = messages.map(item => item.id === message.id ? { ...item, isRead: true, claimable: false, deletable: true } : item);
      return Response.json({ ok: true });
    }
    if (!mailMatch[2] && method === 'DELETE' && message.deletable) {
      messages = messages.filter(item => item.id !== message.id);
      return Response.json({ ok: true });
    }
  }
  return Response.json({ error: '此操作不在本地样板范围内' }, { status: 501 });
};
