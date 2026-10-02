from pathlib import Path
import subprocess,re,json
run=lambda *args:subprocess.check_output(args).decode('utf-8')
files=['src/room/PlayerInfo.jsx','src/room/PlayerInfo.test.js','src/room/BattleUserIdentity.jsx','src/room/TimeBar.test.js','src/styles/room.css','src/styles/room/team-match.css','src/styles/room/team-portraits.css']
files += ['src/styles/mobile-adaptive/'+x for x in ['battle-paper-panels.css','battle-paper-panels-mobile.css','battle-paper-portrait.css','battle-paper-player-mobile.css','battle-paper-skill-mobile.css','battle-paper-nameplate-mobile.css','battle-info-typography.css']]
subprocess.run(['git','add','--',*files],check=True)
def stage(path,text):
 sha=subprocess.check_output(['git','hash-object','-w','--stdin'],input=text.encode()).decode().strip()
 subprocess.run(['git','update-index','--add','--cacheinfo','100644',sha,path],check=True)
p='src/styles/mobile-adaptive.css';stage(p,Path(p).read_text(encoding='utf-8').replace('@import "./mobile-adaptive/rank-progress.css";\n',''))
for p,marker in [('docs/system-design.md','- 移动竖屏棋盘统一'),('docs/system-design/06-ui-theme-mobile.md','### 棋盘比例与队际赛头像'),('.trellis/spec/frontend/css-architecture.md','### Portrait board geometry')]:
 current=Path(p).read_text(encoding='utf-8');stage(p,run('git','show','HEAD:'+p).rstrip()+'\n\n'+current[current.index(marker):])
# Compute an exact CSS baseline for the staged snapshot, excluding other pending styles.
paths=run('git','ls-files','src/styles').splitlines();css=[run('git','show',':'+p) for p in paths if p.endswith('.css')]
p='src/styles/cssLayerInventory.js';s=run('git','show','HEAD:'+p)
metrics={'totalFiles':len(css),'totalBytes':sum(len(x.encode()) for x in css),'importantCount':sum(x.count('!important') for x in css),'importantFiles':sum('!important' in x for x in css),'hardcodedHexCount':sum(len(re.findall(r'#[0-9a-fA-F]{3,8}\b',x)) for x in css),'mediaFiles':sum('@media' in x for x in css)}
for k,v in metrics.items():s=re.sub(r'('+k+r': )\d+',lambda m:m[1]+str(v),s,count=1)
s='// Battle cards: bounded mobile owners, square board, team portrait slices and numeric typography.\n'+s
stage(p,s)
parts=['docs/system-design.md']+sorted(p for p in run('git','ls-files','docs/system-design').splitlines() if p.endswith('.md'))
Path('.codex-run/staged-system-design.md').write_text('\n\n---\n\n'.join(run('git','show',':'+p).strip() for p in parts)+'\n',encoding='utf-8')
