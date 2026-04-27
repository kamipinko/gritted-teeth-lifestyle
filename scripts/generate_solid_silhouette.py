from svgpathtools import parse_path
import re

SRC = 'public/reference/wakizashi_black_fill.svg'
DST = 'public/reference/wakizashi_solid_silhouette.svg'

with open(SRC, 'r', encoding='utf-8') as f:
    svg = f.read()

m = re.search(r'<path\s+d="([^"]+)"', svg, re.DOTALL)
if not m:
    raise SystemExit('no path found')
d = m.group(1)

p = parse_path(d)
subs = p.continuous_subpaths()

def bbox_area(sub):
    xmin, xmax, ymin, ymax = sub.bbox()
    return (xmax - xmin) * (ymax - ymin)

areas = [(i, bbox_area(s)) for i, s in enumerate(subs)]
areas.sort(key=lambda t: -t[1])
print('Top 5 subpaths by bbox area:')
for i, a in areas[:5]:
    print(f'  #{i}: {a:.1f}')

outer = max(subs, key=bbox_area)
outer_d = outer.d()

new_svg = svg[:m.start(1)] + outer_d + svg[m.end(1):]

with open(DST, 'w', encoding='utf-8') as f:
    f.write(new_svg)

print('Wrote', DST)
print('Kept subpath with bbox area:', bbox_area(outer))
print('Discarded', len(subs) - 1, 'inner subpaths (holes)')
