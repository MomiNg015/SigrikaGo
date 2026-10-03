"""Derive the bulb chamber mask and snapshot existing default loading tips."""
from pathlib import Path
import json
import re
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

here = Path(__file__).resolve().parent
project = here.parents[2]
bulb = Image.open(here/'assets/bulb.png').convert('RGBA')
alpha = np.array(bulb)[:,:,3]
barrier = Image.fromarray(np.where(alpha>35,255,0).astype('uint8')).filter(ImageFilter.MaxFilter(5))
ImageDraw.floodfill(barrier,(bulb.width//2,bulb.height//3),128)
chamber = (np.array(barrier)==128)
assert chamber.sum()>bulb.width*bulb.height*.2
assert not chamber[0,0]
assert not chamber[-1,bulb.width//2]
mask = np.full((bulb.height,bulb.width,4),255,dtype='uint8')
mask[:,:,3] = np.where(chamber,255,0).astype('uint8')
Image.fromarray(mask).save(here/'assets/bulb-interior.png')
rows = np.nonzero(chamber)[0]
geometry = {'top': int(rows.min())/bulb.height*100,
            'bottom': (int(rows.max())+1)/bulb.height*100}
(here/'bulb-geometry.js').write_text('window.SigrikaBulbChamber = '+json.dumps(geometry)+';\n',encoding='utf-8')
source = (project/'src/shared/siteSettings.js').read_text(encoding='utf-8')
match = re.search(r'preloadTips:\s*("(?:[^"\\]|\\.)*")',source)
tips = json.loads(match.group(1)).splitlines()
(here/'tips.js').write_text('window.SigrikaLoadingTips = '+json.dumps(tips,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
print('Prepared transparent bulb chamber and',len(tips),'existing default tips.')
