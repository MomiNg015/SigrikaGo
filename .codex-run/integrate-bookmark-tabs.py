from pathlib import Path
import re

root = Path.cwd()
targets = {
 'src/modals/SettingsModal.jsx': ('settings-tabs', 'div', './WindowBookmarkTabs.jsx', False),
 'src/modals/LeaderboardModal.jsx': ('mode-tabs', 'div', './WindowBookmarkTabs.jsx', False),
 'src/modals/WatchModal.jsx': ('mode-tabs window-mode-tabs', 'div', './WindowBookmarkTabs.jsx', False),
 'src/modals/ProfileResumeView.jsx': ('mode-tabs window-mode-tabs profile-mode-tabs', 'div', './WindowBookmarkTabs.jsx', False),
 'src/modals/AchievementModal.jsx': ('achievement-tabs', 'div', './WindowBookmarkTabs.jsx', False),
 'src/modals/AnnouncementModal.jsx': ('announcement-tabs', 'div', './WindowBookmarkTabs.jsx', False),
 'src/modals/friends/FriendsToolbar.jsx': ('friends-tabs', 'div', '../WindowBookmarkTabs.jsx', False),
 'src/modals/shop/ShopTabs.jsx': ('shop-tabs', 'div', '../WindowBookmarkTabs.jsx', False),
 'src/modals/RecruitmentModal.jsx': ('recruitment-item-strip', 'div', './WindowBookmarkTabs.jsx', True),
 'src/modals/GachaModal.jsx': ('gacha-pool-tabs', 'aside', './WindowBookmarkTabs.jsx', True),
}
for name,(css,tag,source,rich) in targets.items():
 p = root/name
 text = p.read_text(encoding='utf-8')
 marker = f'className="{css}"'
 pos = text.index(marker)
 start = text.rfind('<'+tag, 0, pos)
 depth = 0
 end = None
 for match in re.finditer(r'</?'+tag+r'\b', text[start:]):
  depth += -1 if match.group().startswith('</') else 1
  if depth == 0:
   end = start+match.start()
   break
 assert end is not None, name
 text = text[:end] + text[end:].replace('</'+tag+'>','</WindowBookmarkTabs>',1)
 attrs = (' as="aside"' if tag == 'aside' else '') + (' rich' if rich else '')
 text = text[:start]+text[start:].replace('<'+tag,'<WindowBookmarkTabs'+attrs,1)
 text = f'import WindowBookmarkTabs from "{source}";\n'+text
 p.write_text(text,encoding='utf-8',newline='')

replacements = {
 'src/modals/SettingsModal.jsx': [('settings-modal settings-modal-content window-sticker-host','settings-modal settings-modal-content window-sticker-host window-bookmark-host')],
 'src/modals/ResumeModal.jsx': [('profile-dossier-modal window-sticker-host','profile-dossier-modal window-sticker-host window-bookmark-host')],
 'src/modals/UserProfileCard.jsx': [('profile-dossier-modal user-profile-card${titleStickers ? " window-sticker-host"','profile-dossier-modal user-profile-card${titleStickers ? " window-sticker-host window-bookmark-host"')],
 'src/modals/LeaderboardModal.jsx': [('leaderboard-modal window-sticker-host','leaderboard-modal window-sticker-host window-bookmark-host')],
 'src/modals/WatchModal.jsx': [('watch-list-modal window-sticker-host','watch-list-modal window-sticker-host window-bookmark-host')],
 'src/modals/FriendsModal.jsx': [('friends-modal window-sticker-host','friends-modal window-sticker-host window-bookmark-host')],
 'src/modals/AchievementModal.jsx': [('achievement-modal window-sticker-host','achievement-modal window-sticker-host window-bookmark-host')],
 'src/modals/AnnouncementModal.jsx': [('modalClassName="announcement-modal"','modalClassName="announcement-modal window-bookmark-host"')],
 'src/modals/ShopModal.jsx': [('className="shop-modal shop-window"','className="shop-modal shop-window window-bookmark-host"')],
 'src/modals/RecruitmentModal.jsx': [('className={`recruitment-modal ${','className={`recruitment-modal window-bookmark-host ${')],
 'src/modals/GachaModal.jsx': [('className={`gacha-modal ${','className={`gacha-modal window-bookmark-host ${')],
}
for name, pairs in replacements.items():
 p=root/name
 text=p.read_text(encoding='utf-8')
 for old,new in pairs:
  assert old in text, (name,old)
  text=text.replace(old,new,1)
 p.write_text(text,encoding='utf-8',newline='')
print('Integrated shared tab wrapper and explicit hosts.')
