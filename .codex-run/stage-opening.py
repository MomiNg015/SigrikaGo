from pathlib import Path
import subprocess, re

def git(*args, data=None):
    return subprocess.run(['git', *args], input=data, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True).stdout
def head(path): return git('show','HEAD:'+path).decode('utf-8')
def work(path): return Path(path).read_text(encoding='utf-8')
def stage(path, content):
    oid=git('hash-object','-w','--stdin', data=content.encode('utf-8')).decode().strip()
    git('update-index','--add','--cacheinfo','100644',oid,path)

assert not git('diff','--cached','--name-only').strip(), 'Index not empty'
full=['.trellis/spec/backend/index.md','.trellis/spec/backend/opening-clock-contract.md','.trellis/spec/frontend/component-guidelines.md',
'server/roomView.test.js','src/app/roomSnapshot.js','src/app/roomSnapshot.test.js','src/app/socketHandlers.js','src/app/socketHandlers.test.js',
'src/modals/gameLifecycle/OpeningDuelPresentation.jsx','src/room/RoomScreen.jsx','src/styles/modals.css','src/styles/modals/opening-duel.css','src/styles/styleContract.test.js',
'.trellis/tasks/09-23-nigiri-portrait-entrance/prd.md','.trellis/tasks/09-23-nigiri-portrait-entrance/task.json']
git('add','--',*full)
p='server/roomView.js'; s=head(p); line=next(x for x in work(p).splitlines() if 'openingServerNow:' in x); s=s.replace('    openingEndsAt: room.openingEndsAt,','    openingEndsAt: room.openingEndsAt,\n'+line); stage(p,s)
p='src/modals/gameLifecycle/OpeningModal.jsx'; s=work(p); s=re.sub(r'^import .*isCaptureChallenge.*\n','',s,flags=re.M); s=s.replace(' && !isCaptureChallenge(room)',''); s=re.sub(r'^.*\{isCaptureChallenge\(room\).*\n','',s,flags=re.M); stage(p,s)
p='src/modals/gameLifecycle/OpeningDuelPresentation.dom.test.jsx'; s=work(p); s=re.sub(r'\n  it\("preserves capture challenge rules in the cinematic", \(\) => \{.*?\n  \}\);\n','\n',s,flags=re.S); stage(p,s)
p='src/styles/cssLayerInventory.js'; s=head(p); size=len(work('src/styles/modals/opening-duel.css').encode());
for key,delta in [('totalFiles',1),('totalBytes',size+37),('mediaFiles',1),('reducedMotionFiles',1)]:
    s=re.sub(r'('+key+r': )(\d+)',lambda m:m[1]+str(int(m[2])+delta),s,count=1)
line=next(x for x in work(p).splitlines() if '2026-09-23: opening duel' in x); s=s.replace('  featureDeltas: [','  featureDeltas: [\n'+line); stage(p,s)
p='docs/system-design.md'; s=head(p); lines=[x for x in work(p).splitlines() if x.startswith(('对决开场按','开局展示不再','准时宝对局的','猜先阶段采用'))]; first=s.index('\n'); s=s[:first+1]+'\n'+'\n\n'.join(lines)+'\n'+s[first+1:]; stage(p,s)
p='docs/system-design/03-backend-realtime-api.md'; s=head(p); line=next(x for x in work(p).splitlines() if x.startswith('opening 阶段房间快照增加')); first=s.index('\n'); stage(p,s[:first+1]+'\n'+line+'\n'+s[first+1:])
p='docs/system-design/01-project-overview.md'; s=head(p); line=next(x for x in work(p).splitlines() if x.startswith('- `OpeningDuelPresentation`')); anchor='- 匹配成功弹窗倒计时期间'; index=s.index(anchor); s=s[:index]+line+'\n'+s[index:]; stage(p,s)
# Restore only our newline churn, preserving all text.
assert s.replace('\r\n','\n')==work(p)
Path(p).write_bytes(s.encode('utf-8'))
print('Scoped staging complete')
