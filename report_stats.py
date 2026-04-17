import json, math

d = json.load(open('ui/src/data/wardFilterData.json'))

print('=== WARD STATS ===')
for w in sorted(d['wards'].keys(), key=int):
    wd = d['wards'][w]
    print(f"Ward {w}: cit={wd['citations']:,} fines=${wd['fineRevenue']:,.0f} avg=${wd['avgFine']:.2f} top={wd['topViolation']} bayes={wd['bayesScore']:.6f} inc=${wd['medianIncome']:,} pov={wd['povertyRate']:.1%} pop={wd['population']:,}")

total_c = sum(d['wards'][w]['citations'] for w in d['wards'])
total_f = sum(d['wards'][w]['fineRevenue'] for w in d['wards'])
print(f"\nTotal citations: {total_c:,}")
print(f"Total fines: ${total_f:,.0f}")
print(f"Violation types: {len(d['violationTypes'])}")

def pearson(xs, ys):
    n = len(xs)
    mx = sum(xs)/n
    my = sum(ys)/n
    num = sum((x-mx)*(y-my) for x,y in zip(xs,ys))
    dx = math.sqrt(sum((x-mx)**2 for x in xs))
    dy = math.sqrt(sum((y-my)**2 for y in ys))
    return num/(dx*dy) if dx*dy else 0

wards = sorted(d['wards'].keys(), key=int)
cit = [d['wards'][w]['citations'] for w in wards]
inc = [d['wards'][w]['medianIncome'] for w in wards]
pov = [d['wards'][w]['povertyRate'] for w in wards]
pop = [d['wards'][w]['population'] for w in wards]
poc = [1 - d['wards'][w]['whiteShare'] for w in wards]
cit_pc = [d['wards'][w]['citations'] / (d['wards'][w]['population']/1000) for w in wards]

print(f"\n=== PEARSON CORRELATIONS (total) ===")
print(f"Citations vs Income: r = {pearson(inc, cit):.3f}")
print(f"Citations vs Poverty: r = {pearson(pov, cit):.3f}")
print(f"Citations vs POC: r = {pearson(poc, cit):.3f}")

print(f"\n=== PEARSON CORRELATIONS (per 1k residents) ===")
print(f"Citations/1k vs Income: r = {pearson(inc, cit_pc):.3f}")
print(f"Citations/1k vs Poverty: r = {pearson(pov, cit_pc):.3f}")
print(f"Citations/1k vs POC: r = {pearson(poc, cit_pc):.3f}")

print(f"\n=== HOURLY PEAKS (all wards combined) ===")
hourly_totals = {}
for w in wards:
    for h, c in d['wards'][w]['hourly'].items():
        hourly_totals[int(h)] = hourly_totals.get(int(h), 0) + c
for h in sorted(hourly_totals.keys()):
    print(f"  Hour {h:2d}: {hourly_totals[h]:,}")

print(f"\n=== MONTHLY (all wards) ===")
monthly_totals = {}
for w in wards:
    for m, c in d['wards'][w]['monthly'].items():
        monthly_totals[int(m)] = monthly_totals.get(int(m), 0) + c
for m in sorted(monthly_totals.keys()):
    print(f"  Month {m:2d}: {monthly_totals[m]:,}")

b = json.load(open('ui/src/data/blockLookup.json'))
grades = {}
for blk in b.values():
    g = blk.get('g', '?')
    grades[g] = grades.get(g, 0) + 1
print(f"\n=== BLOCK GRADES ===")
print(f"Total blocks: {len(b):,}")
for g in ['A','B','C','D','F']:
    print(f"  {g}: {grades.get(g,0):,} ({grades.get(g,0)/len(b)*100:.1f}%)")

print(f"\n=== TOP RISK BLOCKS (ward 2 example) ===")
for blk in d['wards']['2']['topBlocks'][:5]:
    print(f"  {blk['block']}: score={blk['score']:.6f} tickets={blk['tickets']}")

# Day of week
days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
day_totals = {day: 0 for day in days}
for w in wards:
    for key, val in d['wards'][w]['breakdown'].items():
        dow = key.split('|')[3]
        day_totals[dow] += val['c']
print(f"\n=== DAY OF WEEK ===")
for day in days:
    print(f"  {day}: {day_totals[day]:,}")

# Season
seasons = ['Winter','Spring','Summer','Fall']
season_totals = {s: 0 for s in seasons}
for w in wards:
    for key, val in d['wards'][w]['breakdown'].items():
        seas = key.split('|')[2]
        season_totals[seas] += val['c']
print(f"\n=== SEASON ===")
for s in seasons:
    print(f"  {s}: {season_totals[s]:,}")

# Top violations
viol_totals = {}
for w in wards:
    for key, val in d['wards'][w]['breakdown'].items():
        v = key.split('|')[0]
        viol_totals[v] = viol_totals.get(v, 0) + val['c']
print(f"\n=== TOP VIOLATIONS ===")
for v, c in sorted(viol_totals.items(), key=lambda x: -x[1])[:8]:
    print(f"  {c:>8,}  {v}")

# Per capita
print(f"\n=== PER CAPITA (per 1k) ===")
for w in wards:
    wd = d['wards'][w]
    pc = wd['citations'] / (wd['population']/1000)
    print(f"  Ward {w}: {pc:,.0f}/1k  avgFine=${wd['avgFine']:.2f}")
