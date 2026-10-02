from pathlib import Path
s=Path('.codex-run/mobile-info-options/index.html').read_text(encoding='utf-8')
s=s.replace('耗子','超频').replace('紧凑纸条','错落便签').replace('独立棋钟','横向拼贴').replace('分层信息卡','双层档案').replace('同一套信息，三种排布','错落排布 · 五项关键元素完整展示')
css='''
.phone .card{border:0;background:none;box-shadow:none;border-radius:0;padding:0;gap:8px;grid-template-rows:none;margin-bottom:34px}
.phone .card::before{display:none}.phone .portrait{height:116px;width:100%;margin:0;align-self:center}
.phone .identity{font-size:13px;min-height:29px;background:#fffaf0;border:1px solid #655045;padding:4px 9px;box-shadow:2px 2px #d7c6b3;border-radius:3px;rotate:-1deg}
.phone .rank{font-size:11px}.phone .timer{border:1.5px solid #655045;border-radius:8px;background:#fffaf0;box-shadow:3px 3px #d7c6b3;padding:8px 12px;flex-direction:row;align-items:center;justify-content:space-between;rotate:1deg;gap:5px}
.phone .timer strong{font-size:34px;letter-spacing:-1px;margin:0;order:0}.phone .timer small{font-size:11px;line-height:1.4;margin:0}.phone .active .timer{background:#ffe9a8;box-shadow:3px 3px #655045}
.phone .stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;border:0;padding:0;font-size:12px;white-space:normal;grid-column:auto;line-height:1.2}
.phone .stats span{display:flex;justify-content:space-between;align-items:center;gap:3px;background:#fffaf0;border:1px solid #7b6555;border-radius:4px;padding:7px 6px;min-height:43px;color:#655045;box-shadow:2px 2px #d7c6b3}
.phone .stats span:nth-child(2){translate:0 4px;background:#eaf1e9}.phone .stats span:nth-child(3){translate:0 -2px;background:#f6e7dc}.phone .stats b{font-size:20px;margin:0}
.phone .skill{background:#e6efed;border:1.5px solid #655045;border-radius:5px;padding:9px 11px;min-height:43px;font-size:13px;box-shadow:2px 3px #c2d5d0;rotate:-1deg;overflow:hidden}.phone .skill b{font-size:12px}.phone .skill span{white-space:normal}
.phone.a .card{grid-template-columns:103px minmax(0,1fr);grid-template-areas:'art id' 'art clock' 'art stats' 'skill skill';grid-template-rows:30px 55px 47px 43px}.phone.a .portrait{height:131px;align-self:end}.phone.a .skill{margin:3px 10px 0 18px}.phone.a .stats span{flex-direction:column;gap:3px;padding:5px 2px}.phone.a .timer small{max-width:24px}.phone.a .timer strong{font-size:35px}
.phone.b .card{grid-template-columns:92px minmax(0,1fr) minmax(0,.8fr);grid-template-areas:'art id id' 'art clock skill' 'stats stats stats';grid-template-rows:30px 73px 47px}.phone.b .portrait{height:111px;align-self:end}.phone.b .timer{flex-direction:column;justify-content:center;padding:7px;rotate:-2deg}.phone.b .timer strong{font-size:30px}.phone.b .skill{display:flex;flex-direction:column;justify-content:center;text-align:center;padding:7px 4px;rotate:2deg}.phone.b .stats{margin:5px 7px 0}.phone.b .stats span:nth-child(1){rotate:-2deg}.phone.b .stats span:nth-child(3){rotate:2deg}
.phone.c .card{grid-template-columns:108px minmax(0,1fr);grid-template-areas:'id id' 'art clock' 'art stats' 'skill skill';grid-template-rows:30px 61px 48px 43px;gap:8px 12px}.phone.c .identity{margin:0 25px 0 4px;rotate:-2deg}.phone.c .portrait{height:119px}.phone.c .timer{rotate:2deg;border-radius:4px 14px 4px 4px}.phone.c .timer small{max-width:24px}.phone.c .stats span{flex-direction:column;gap:3px;padding:5px 2px}.phone.c .skill{margin:3px 0 0 35px;rotate:1deg;background:#fff0c9}.phone .label{margin-bottom:18px}.phone .foot{margin-top:8px}.explain{max-width:280px}
'''
s=s.replace('</style>',css+'</style>')
start=s.index('const data=');end=s.index(';function show',start)
s=s[:start]+'''const data={a:["A · 错落便签","头像靠左出框；右侧姓名签、棋钟和三枚统计签逐层错开，技能横签托底。五项信息都有独立位置，高约 200px。"],b:["B · 横向拼贴","头像、棋钟、技能并列；提子、除子、超频三张数字签横向展开。最紧凑的一版，高约 166px。"],c:["C · 双层档案","姓名纸签跨在上方，头像与棋钟形成高低差，三枚统计签嵌在右侧，技能纸签向右错开。留白更多，高约 206px。"]}'''+s[end:]
Path('.codex-run/mobile-info-staggered/index.html').write_text(s,encoding='utf-8')
