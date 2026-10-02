from pathlib import Path
for name in ['docs/system-design.md','docs/system-design/06-ui-theme-mobile.md']:
 p=Path(name);s=p.read_text(encoding='utf-8');s=s.replace('优先一屏容纳全部对弈内容','优先一屏容纳全部对弈内容；手机身份行按内容占宽，姓名、段位和积分同行，移除多余外框但保留装备姓名牌').replace('桌面 owner 未变。','桌面 owner 未变。');
 if name.endswith('06-ui-theme-mobile.md'): s=s.replace('66px 立绘列、自适应身份／技能列、108px 棋钟／统计列。','66px 立绘列、自适应身份／技能列、108px 棋钟／统计列。身份行使用 fit-content，姓名／段位／积分同行，透明无框；不拉伸身份行，也不移除用户装备的姓名牌。')
 p.write_text(s,encoding='utf-8')
