import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'renderer/components/ui/card'
import { Badge } from 'renderer/components/ui/badge'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from 'renderer/components/ui/chart'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { useStore } from 'renderer/context/store'
import {
  Shield,
  BookOpen,
  Wrench,
  Timer,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Flame,
  Zap,
  BarChart3,
  Target,
} from 'lucide-react'
import type { ReactNode } from 'react'

function countBy(data: Record<string, any>[], field: string) {
  const counts: Record<string, number> = {}
  for (const d of data) {
    const val = d[field]
    if (val) counts[val] = (counts[val] || 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
}

function Insight({
  icon,
  children,
  variant = 'default',
}: {
  icon: ReactNode
  children: ReactNode
  variant?: 'default' | 'warning' | 'info'
}) {
  const bg =
    variant === 'warning'
      ? 'bg-chart-4/10 border-chart-4/20'
      : variant === 'info'
        ? 'bg-chart-3/10 border-chart-3/20'
        : 'bg-primary/5 border-primary/15'

  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-lg border ${bg}`}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="text-[13px] leading-relaxed">{children}</div>
    </div>
  )
}

const DONUT_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

export function InsightsView() {
  const { data } = useStore()
  const total = data.length

  if (total < 3) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Indsigter</h2>
          <p className="text-sm text-muted-foreground mt-1">Baseret på registrerede henvendelser</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <Lightbulb className="size-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Registrér mindst 3 henvendelser for at se indsigter</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const now = new Date()

  // ── Metrics ──
  const prevAll = data.filter((d) => typeof d.forebyg === 'string' && (d.forebyg as string).startsWith('Ja'))
  const prevPct = Math.round((prevAll.length / total) * 100)
  const loest = data.filter((d) => d.losning === 'Løst i samtalen').length
  const resRate = Math.round((loest / total) * 100)
  const lange = data.filter((d) => d.tid === 'Lang (over 15 min)')
  const langPct = Math.round((lange.length / total) * 100)
  const eskData = data.filter((d) => d.losning === 'Eskaleret internt')
  const ikkeLost = data.filter((d) => d.losning === 'Ikke løst')
  const prevVejl = data.filter((d) => d.forebyg === 'Ja – bedre vejledning')
  const prevPlatf = data.filter((d) => d.forebyg === 'Ja – platformsforbedring')
  const prevKomm = data.filter((d) => d.forebyg === 'Ja – bedre kommunikation')

  // Estimated time
  const totalMinutes = data.reduce((sum, d) => {
    if (d.tid === 'Kort (under 5 min)') return sum + 3
    if (d.tid === 'Medium (5–15 min)') return sum + 10
    if (d.tid === 'Lang (over 15 min)') return sum + 20
    return sum + 5
  }, 0)
  const totalHours = Math.round(totalMinutes / 60)
  const prevMinutes = prevAll.reduce((sum, d) => {
    if (d.tid === 'Kort (under 5 min)') return sum + 3
    if (d.tid === 'Medium (5–15 min)') return sum + 10
    if (d.tid === 'Lang (over 15 min)') return sum + 20
    return sum + 5
  }, 0)
  const savableHours = Math.round(prevMinutes / 60)

  // ── Weekly trend data ──
  const weeklyData = useMemo(() => {
    const weeks: Record<string, { total: number; preventable: number }> = {}
    for (const d of data) {
      const dt = new Date(d.dato as string)
      const ws = new Date(dt)
      ws.setDate(dt.getDate() - dt.getDay() + 1)
      const key = ws.toISOString().split('T')[0]
      if (!weeks[key]) weeks[key] = { total: 0, preventable: 0 }
      weeks[key].total++
      if (typeof d.forebyg === 'string' && (d.forebyg as string).startsWith('Ja')) {
        weeks[key].preventable++
      }
    }
    return Object.entries(weeks)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-10)
      .map(([week, counts]) => ({
        week: week.slice(5),
        total: counts.total,
        forebyggelig: counts.preventable,
      }))
  }, [data])

  const recentWeeks = weeklyData.slice(-8)
  const weekAvg = recentWeeks.length > 0 ? Math.round(recentWeeks.reduce((s, w) => s + w.total, 0) / recentWeeks.length) : 0

  // Volume trend %
  const trendPct = useMemo(() => {
    if (recentWeeks.length < 6) return 0
    const first = recentWeeks.slice(0, 3).reduce((s, w) => s + w.total, 0) / 3
    const last = recentWeeks.slice(-3).reduce((s, w) => s + w.total, 0) / 3
    return first > 0 ? Math.round(((last - first) / first) * 100) : 0
  }, [recentWeeks])

  // Preventable donut
  const prevDonutData = useMemo(() => {
    return [
      { name: 'Vejledning', value: prevVejl.length },
      { name: 'Platform', value: prevPlatf.length },
      { name: 'Kommunikation', value: prevKomm.length },
      { name: 'Ikke forebyggelig', value: total - prevAll.length },
    ].filter((d) => d.value > 0)
  }, [prevVejl, prevPlatf, prevKomm, prevAll, total])

  // Category-time heatmap data
  const categoryTimeData = useMemo(() => {
    const cats = countBy(data, 'kategori').slice(0, 5)
    return cats.map(([cat]) => {
      const catData = data.filter((d) => d.kategori === cat)
      const kort = catData.filter((d) => d.tid === 'Kort (under 5 min)').length
      const medium = catData.filter((d) => d.tid === 'Medium (5–15 min)').length
      const lang = catData.filter((d) => d.tid === 'Lang (over 15 min)').length
      return {
        name: cat.length > 18 ? cat.slice(0, 16) + '…' : cat,
        kort,
        medium,
        lang,
      }
    })
  }, [data])

  const areaConfig: ChartConfig = {
    total: { label: 'Alle', color: 'var(--color-chart-1)' },
    forebyggelig: { label: 'Forebyggelige', color: 'var(--color-chart-5)' },
  }

  const stackConfig: ChartConfig = {
    kort: { label: 'Kort', color: 'var(--color-chart-2)' },
    medium: { label: 'Medium', color: 'var(--color-chart-4)' },
    lang: { label: 'Lang', color: 'var(--color-chart-5)' },
  }

  // ── Month data ──
  const thisMonthData = data.filter((d) => {
    const dt = new Date(d.dato as string)
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear()
  })
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthData = data.filter((d) => {
    const dt = new Date(d.dato as string)
    return dt.getMonth() === lastMonthDate.getMonth() && dt.getFullYear() === lastMonthDate.getFullYear()
  })
  const eskPct = Math.round((eskData.length / total) * 100)

  // ── Cross-correlations ──

  // Which category is growing fastest? Compare last 2 weeks vs prior
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000)
  const fourWeeksAgo = new Date(now.getTime() - 28 * 86400000)
  const recentData = data.filter((d) => new Date(d.dato as string) >= twoWeeksAgo)
  const priorData = data.filter((d) => {
    const dt = new Date(d.dato as string)
    return dt >= fourWeeksAgo && dt < twoWeeksAgo
  })

  const growingCategories = useMemo(() => {
    const recentCats = countBy(recentData, 'kategori')
    const priorCats = Object.fromEntries(countBy(priorData, 'kategori'))
    return recentCats
      .map(([cat, count]) => {
        const prior = priorCats[cat] || 0
        const growth = prior > 0 ? Math.round(((count - prior) / prior) * 100) : count > 2 ? 999 : 0
        return { cat, count, prior, growth }
      })
      .filter((c) => c.growth > 20 && c.count >= 3)
      .sort((a, b) => b.growth - a.growth)
  }, [recentData, priorData])

  // "Biggest time sink" — category with most total estimated minutes
  const categoryTimeCost = useMemo(() => {
    const costs: Record<string, { total: number; count: number; preventable: number }> = {}
    for (const d of data) {
      const cat = d.kategori as string
      if (!cat) continue
      const mins = d.tid === 'Lang (over 15 min)' ? 20 : d.tid === 'Medium (5–15 min)' ? 10 : 3
      if (!costs[cat]) costs[cat] = { total: 0, count: 0, preventable: 0 }
      costs[cat].total += mins
      costs[cat].count++
      if (typeof d.forebyg === 'string' && (d.forebyg as string).startsWith('Ja')) {
        costs[cat].preventable += mins
      }
    }
    return Object.entries(costs)
      .map(([cat, v]) => ({ cat, ...v, avgMin: Math.round(v.total / v.count) }))
      .sort((a, b) => b.total - a.total)
  }, [data])

  // Repeat offenders — categories that are both high-volume AND high-preventable
  const highImpactCategories = useMemo(() => {
    return categoryTimeCost
      .filter((c) => c.preventable / c.total > 0.35 && c.count >= 5)
      .slice(0, 3)
  }, [categoryTimeCost])

  // Ansøger vs Fond pain points
  const userTypeInsights = useMemo(() => {
    const ansøgerData = data.filter((d) => d.brugertype === 'Ansøger')
    const fondData = data.filter((d) => d.brugertype === 'Fond / administrator')
    const ansøgerTop = countBy(ansøgerData, 'kategori')[0]
    const fondTop = fondData.length > 5 ? countBy(fondData, 'kategori')[0] : null
    return { ansøgerTop, fondTop, ansøgerCount: ansøgerData.length, fondCount: fondData.length }
  }, [data])

  // "Quick wins" — preventable + kort tid = easy to eliminate
  const quickWins = useMemo(() => {
    const quick = data.filter(
      (d) => d.tid === 'Kort (under 5 min)' && typeof d.forebyg === 'string' && (d.forebyg as string).startsWith('Ja')
    )
    if (quick.length < 3) return null
    const topCat = countBy(quick, 'kategori')[0]
    return { count: quick.length, topCat: topCat[0], topCount: topCat[1] }
  }, [data])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Indsigter</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {total} henvendelser · ~{totalHours} timer estimeret tidsforbrug
        </p>
      </div>

      {/* Hero metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="relative overflow-hidden">
          <CardContent className="pt-4 pb-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Ugentligt gns.</div>
            <div className="text-3xl font-bold mt-1">{weekAvg}</div>
            {trendPct !== 0 && (
              <Badge variant={trendPct > 0 ? 'destructive' : 'default'} className="mt-1 text-[10px]">
                {trendPct > 0 ? '↑' : '↓'} {Math.abs(trendPct)}%
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Løsningsrate</div>
            <div className="text-3xl font-bold mt-1">{resRate}%</div>
            <p className="text-[11px] text-muted-foreground mt-1">{loest} af {total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Tid brugt</div>
            <div className="text-3xl font-bold mt-1">~{totalHours}t</div>
            <p className="text-[11px] text-muted-foreground mt-1">{savableHours > 0 ? `${savableHours}t kan spares` : ''}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Forebyggelige</div>
            <div className="text-3xl font-bold mt-1">{prevPct}%</div>
            <p className="text-[11px] text-muted-foreground mt-1">{prevAll.length} sager</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Trend area chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Ugentlig trend</CardTitle>
            <CardDescription className="text-xs">Alle henvendelser vs. forebyggelige</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={areaConfig} className="h-[200px] w-full">
              <AreaChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="fillPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-5)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--color-chart-5)" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="total" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#fillTotal)" />
                <Area type="monotone" dataKey="forebyggelig" stroke="var(--color-chart-5)" strokeWidth={2} fill="url(#fillPrev)" strokeDasharray="4 2" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Preventable donut */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Forebyggelig fordeling</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-[140px] w-[140px] shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={prevDonutData}
                      dataKey="value"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {prevDonutData.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1">
                {prevDonutData.map(({ name, value }, i) => (
                  <div key={name} className="flex items-center gap-2 text-xs">
                    <div className="size-2.5 rounded-full shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="text-muted-foreground flex-1">{name}</span>
                    <span className="font-medium tabular-nums">{value}</span>
                    <span className="text-muted-foreground text-[10px] w-8 text-right">{Math.round((value / total) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category × Time stacked bar */}
      {categoryTimeData.length > 0 && (
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Kategori × tidsforbrug</CardTitle>
            <CardDescription className="text-xs">Top 5 kategorier fordelt på kort / medium / lang</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={stackConfig} className="h-[180px] w-full">
              <BarChart data={categoryTimeData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={120} className="fill-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="kort" stackId="tid" fill="var(--color-chart-2)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="medium" stackId="tid" fill="var(--color-chart-4)" />
                <Bar dataKey="lang" stackId="tid" fill="var(--color-chart-5)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* ── BRIEFING ── */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Left: Trends & Signals */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-chart-1" />
                <CardTitle className="text-sm">Tendenser</CardTitle>
              </div>
              <CardDescription className="text-xs">Hvad ændrer sig?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {Math.abs(trendPct) > 15 && (
                <Insight icon={trendPct > 0 ? <Flame className="size-4 text-chart-5" /> : <TrendingDown className="size-4 text-primary" />} variant={trendPct > 30 ? 'warning' : 'info'}>
                  Volumen <strong>{trendPct > 0 ? '+' : ''}{trendPct}%</strong> de seneste 3 uger.
                  {trendPct > 50 && ' Undersøg hvad der driver stigningen.'}
                </Insight>
              )}

              {growingCategories.length > 0 && (
                <Insight icon={<TrendingUp className="size-4 text-chart-5" />} variant="warning">
                  <strong>Voksende emner:</strong>{' '}
                  {growingCategories.slice(0, 2).map((c, i) => (
                    <span key={c.cat}>
                      {i > 0 && ', '}
                      <strong>{c.cat}</strong> ({c.prior}→{c.count}, +{c.growth === 999 ? 'ny' : c.growth + '%'})
                    </span>
                  ))}
                </Insight>
              )}

              {lastMonthData.length > 0 && thisMonthData.length > 0 && (
                <Insight icon={<BarChart3 className="size-4 text-chart-3" />} variant="info">
                  Denne måned: <strong>{thisMonthData.length}</strong> vs. forrige: <strong>{lastMonthData.length}</strong>
                  {thisMonthData.length > lastMonthData.length
                    ? ` (+${thisMonthData.length - lastMonthData.length})`
                    : thisMonthData.length < lastMonthData.length
                      ? ` (${thisMonthData.length - lastMonthData.length})`
                      : ' (uændret)'}
                </Insight>
              )}

              {resRate > 0 && (
                <Insight icon={<CheckCircle2 className="size-4 text-primary" />} variant="default">
                  <strong>{resRate}%</strong> løses direkte.
                  {resRate >= 60 ? ' Stærkt.' : resRate >= 40 ? ' Solidt, men plads til forbedring.' : ' Lav rate — overvej bedre redskaber.'}
                </Insight>
              )}
            </CardContent>
          </Card>

          {/* User-type pain points */}
          {(userTypeInsights.ansøgerTop || userTypeInsights.fondTop) && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-chart-3" />
                  <CardTitle className="text-sm">Brugertyper</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {userTypeInsights.ansøgerTop && (
                  <Insight icon={<span className="text-xs">👤</span>} variant="info">
                    <strong>Ansøgere</strong> ({userTypeInsights.ansøgerCount}) — hyppigste problem: <strong>{userTypeInsights.ansøgerTop[0]}</strong> ({userTypeInsights.ansøgerTop[1]} gange)
                  </Insight>
                )}
                {userTypeInsights.fondTop && (
                  <Insight icon={<span className="text-xs">🏛</span>} variant="info">
                    <strong>Fonde</strong> ({userTypeInsights.fondCount}) — hyppigste problem: <strong>{userTypeInsights.fondTop[0]}</strong> ({userTypeInsights.fondTop[1]} gange)
                  </Insight>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Risks & Opportunities */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-chart-5" />
                <CardTitle className="text-sm">Risici</CardTitle>
              </div>
              <CardDescription className="text-xs">Hvad kræver opmærksomhed?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {ikkeLost.length > 0 && (
                <Insight icon={<AlertTriangle className="size-4 text-chart-5" />} variant="warning">
                  <strong>{ikkeLost.length} uløste</strong> sager. Hyppigst: <strong>{countBy(ikkeLost, 'kategori')[0]?.[0]}</strong>. Kræver opfølgning.
                </Insight>
              )}

              {eskData.length >= 3 && (
                <Insight icon={<ArrowUpRight className="size-4 text-chart-5" />} variant="warning">
                  <strong>{eskData.length} eskaleringer</strong> ({eskPct}%). Hyppigst: <strong>{countBy(eskData, 'kategori')[0]?.[0]}</strong>.
                  {(() => {
                    const recentEsk = eskData.filter((d) => new Date(d.dato as string) >= twoWeeksAgo).length
                    return recentEsk > eskData.length * 0.4 ? ' Stigende tendens.' : ''
                  })()}
                </Insight>
              )}

              {langPct > 15 && (
                <Insight icon={<Timer className="size-4 text-chart-4" />} variant={langPct > 25 ? 'warning' : 'info'}>
                  <strong>{langPct}%</strong> tager over 15 min. Hyppigst: <strong>{countBy(lange, 'kategori')[0]?.[0]}</strong>.
                </Insight>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-primary" />
                <CardTitle className="text-sm">Muligheder</CardTitle>
              </div>
              <CardDescription className="text-xs">Hvor kan I spare tid?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {savableHours > 0 && (
                <Insight icon={<Clock className="size-4 text-primary" />} variant="default">
                  <strong>~{savableHours} timer</strong> bruges på forebyggelige sager. Det er tid I kan spare med målrettet indsats.
                </Insight>
              )}

              {quickWins && (
                <Insight icon={<Zap className="size-4 text-primary" />} variant="default">
                  <strong>Quick win:</strong> {quickWins.count} korte, forebyggelige sager — flest om <strong>{quickWins.topCat}</strong>. Lavthængende frugt.
                </Insight>
              )}

              {highImpactCategories.length > 0 && (
                <Insight icon={<Target className="size-4 text-primary" />} variant="default">
                  <strong>Højest ROI:</strong>{' '}
                  {highImpactCategories.map((c, i) => (
                    <span key={c.cat}>
                      {i > 0 && ', '}
                      <strong>{c.cat}</strong> ({Math.round(c.preventable / 60)}t sparbar)
                    </span>
                  ))}
                </Insight>
              )}

              {prevVejl.length >= 3 && (
                <Insight icon={<BookOpen className="size-4 text-primary" />} variant="default">
                  <strong>{prevVejl.length}</strong> sager løses med bedre vejledning. Start med <strong>{countBy(prevVejl, 'kategori')[0]?.[0]}</strong>.
                </Insight>
              )}

              {prevPlatf.length >= 3 && (
                <Insight icon={<Wrench className="size-4 text-chart-4" />} variant="warning">
                  <strong>{prevPlatf.length}</strong> kræver platformsændringer. Top: <strong>{countBy(prevPlatf, 'kategori')[0]?.[0]}</strong>.
                </Insight>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom: Prioritized actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Prioriterede handlinger</CardTitle>
          <CardDescription className="text-xs">Sorteret efter estimeret effekt</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {(() => {
              const actions: { action: string; reason: string; impact: number; icon: ReactNode; badge: string }[] = []

              if (highImpactCategories.length > 0) {
                const top = highImpactCategories[0]
                actions.push({
                  action: `Forebyg "${top.cat}" med bedre vejledning/UX`,
                  reason: `${top.count} sager, ${Math.round(top.preventable / 60)}t sparbar tid`,
                  impact: top.preventable,
                  icon: <Target className="size-3.5 text-primary" />,
                  badge: `~${Math.round(top.preventable / 60)}t`,
                })
              }

              if (prevPlatf.length >= 3) {
                const topCat = countBy(prevPlatf, 'kategori')[0]
                const mins = prevPlatf.reduce((s, d) => s + (d.tid === 'Lang (over 15 min)' ? 20 : d.tid === 'Medium (5–15 min)' ? 10 : 3), 0)
                actions.push({
                  action: `Meld platformsfejl: "${topCat[0]}"`,
                  reason: `${prevPlatf.length} sager peger på dette`,
                  impact: mins,
                  icon: <Wrench className="size-3.5 text-chart-4" />,
                  badge: `${prevPlatf.length} sager`,
                })
              }

              if (prevVejl.length >= 3) {
                const topCat = countBy(prevVejl, 'kategori')[0]
                actions.push({
                  action: `Opdatér FAQ / hjælpeartikel om "${topCat[0]}"`,
                  reason: `${prevVejl.length} henvendelser kan undgås`,
                  impact: prevVejl.length * 5,
                  icon: <BookOpen className="size-3.5 text-primary" />,
                  badge: `${prevVejl.length} sager`,
                })
              }

              if (eskData.length >= 3) {
                const topCat = countBy(eskData, 'kategori')[0]
                actions.push({
                  action: `Lav intern guide til "${topCat[0]}"`,
                  reason: `${eskData.length} eskaleringer — kan frontline løse det?`,
                  impact: eskData.length * 8,
                  icon: <ArrowUpRight className="size-3.5 text-chart-5" />,
                  badge: `${eskData.length} esk.`,
                })
              }

              if (ikkeLost.length > 0) {
                actions.push({
                  action: 'Følg op på uløste sager',
                  reason: `${ikkeLost.length} henvendelser uden løsning`,
                  impact: ikkeLost.length * 10,
                  icon: <AlertTriangle className="size-3.5 text-chart-5" />,
                  badge: `${ikkeLost.length} åbne`,
                })
              }

              if (quickWins) {
                actions.push({
                  action: `Quick win: automatisér svar på "${quickWins.topCat}"`,
                  reason: `${quickWins.count} korte, forebyggelige sager`,
                  impact: quickWins.count * 3,
                  icon: <Zap className="size-3.5 text-primary" />,
                  badge: 'Lav effort',
                })
              }

              if (growingCategories.length > 0) {
                const top = growingCategories[0]
                actions.push({
                  action: `Undersøg stigningen i "${top.cat}"`,
                  reason: `${top.prior}→${top.count} på 2 uger`,
                  impact: top.count * 4,
                  icon: <TrendingUp className="size-3.5 text-chart-5" />,
                  badge: `+${top.growth === 999 ? 'ny' : top.growth + '%'}`,
                })
              }

              return actions.sort((a, b) => b.impact - a.impact).map((item, i) => (
                <div key={item.action} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                  <span className="text-xs font-bold text-muted-foreground w-5 text-center shrink-0">{i + 1}</span>
                  <div className="shrink-0">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{item.action}</div>
                    <div className="text-xs text-muted-foreground">{item.reason}</div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{item.badge}</Badge>
                </div>
              ))
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
