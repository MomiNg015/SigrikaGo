import subprocess
from pathlib import Path
for name in ['docs/system-design.md','docs/system-design.html']:
    base=subprocess.check_output(['git','show','HEAD:'+name]).decode('utf-8')
    current=Path(name).read_text(encoding='utf-8')
    if name.endswith('.md'):
        paragraphs=[p for p in current.split('\n\n') if p.startswith('科技风第二轮主界面') or p.startswith('星炬科技界面探索入口')]
        marker='# SigrikaGo 系统设计\n\n'
        assert base.count(marker)==1 and len(paragraphs)==2
        staged=base.replace(marker,marker+'\n\n'.join(paragraphs)+'\n\n',1)
    else:
        lines=[line for line in current.splitlines() if line.startswith('<p>科技风第二轮主界面') or line.startswith('<p>星炬科技界面探索入口')]
        anchor=next(line for line in base.splitlines() if line.startswith('<p>整体界面改造样板入口'))
        assert len(lines)==2 and base.count(anchor)==1
        staged=base.replace(anchor,'\n'.join(lines)+'\n'+anchor,1)
    blob=subprocess.check_output(['git','hash-object','-w','--stdin'],input=staged.encode()).decode().strip()
    subprocess.run(['git','update-index','--cacheinfo','100644',blob,name],check=True)
