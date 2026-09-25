"""Download newly researched public reference assets; never read old project designs."""
import concurrent.futures
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).parent / 'references'
ROOT.mkdir(exist_ok=True)
URLS = {
    'lynae-official.png': 'https://patchwiki.biligame.com/images/wutheringwaves/d/d9/irb1d97nbvuwdbczcz1dqz3bambgzio.png',
    'changli-official.png': 'https://patchwiki.biligame.com/images/wutheringwaves/2/25/rwnmwv8y5wjcn98wix521fksfqddhgq.png',
    'chisa-official.png': 'https://patchwiki.biligame.com/images/wutheringwaves/f/f1/0js5t58l15sh8owhlf0qzwtd42wzqz6.png',
    'sigrika-official.png': 'https://patchwiki.biligame.com/images/wutheringwaves/c/c8/rwfyqhk04aoswbxp05nphwnqcmj1ts3.png',
    'denia-official.png': 'https://patchwiki.biligame.com/images/wutheringwaves/a/af/6acl4kwx70rsngp29y1ehmnqx4iippw.png',
    'aemeath-official.png': 'https://patchwiki.biligame.com/images/wutheringwaves/d/db/fvpa52ml6jzobahuyw5vbmn8wfkd66i.png',
    'qiuyuan-official.png': 'https://patchwiki.biligame.com/images/wutheringwaves/3/36/bkto4fox3couswsbhuondiuvlgayiof.png',
    'mornye-official.png': 'https://patchwiki.biligame.com/images/wutheringwaves/8/8d/mvu0v6rasvlf6k5niw8on278d6fm5js.png',
    'go-grip-instruction.jpg': 'https://k.sinaimg.cn/n/sinacn20121/192/w440h552/20190103/3ecd-hqzxptp2714009.jpg/w700d1q75cms.jpg',
}

def fetch(item):
    name, url = item
    path = ROOT / name
    if not path.exists():
        request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(request, timeout=30) as response:
            path.write_bytes(response.read())
    return {'file': name, 'url': url, 'bytes': path.stat().st_size}

if __name__ == '__main__':
    results = list(concurrent.futures.ThreadPoolExecutor(max_workers=4).map(fetch, URLS.items()))
    (ROOT / 'sources.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(results, ensure_ascii=False, indent=2))
