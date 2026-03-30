import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from 'renderer/components/ui/card'
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
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const greetings: Record<string, string[]> = {
  morning: [
    'God morgen, solstråle! ☀️',
    'God morgen! Klar til at hjælpe verden?',
    'Godmorgen! Håber kaffen er klar ☕',
    'Hey, god morgen! Frisk på en ny dag?',
    'Morgen! Lad os knække nogle sager.',
    'God morgen! Supporthelten er mødt ind.',
  ],
  afternoon: [
    'God eftermiddag! Du klarer det skarpt.',
    'Hej! Håber dagen kører smooth.',
    'God eftermiddag! Halvvejs — du er on fire.',
    'Eftermiddagskaffen kalder ☕',
    'Hej! Keep it up, du gør det fantastisk.',
    'Hey hey! Sidste halvleg — let\'s go.',
  ],
  evening: [
    'God aften! Du ser godt ud i dag ✨',
    'God aften! Sidste sprint for i dag?',
    'Hej! Næsten fyraften — du har fortjent det.',
    'God aften! Tak for din indsats i dag.',
    'God aften! Snart tid til at lukke ned 🌙',
    'Hey! Du har knoklet — snart fri.',
  ],
}

function getGreeting(): string {
  const hour = new Date().getHours()
  const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const options = greetings[period]
  return options[Math.floor(Math.random() * options.length)]
}

function countBy(data: Record<string, any>[], field: string) {
  const counts: Record<string, number> = {}
  for (const d of data) {
    const val = d[field]
    if (val) counts[val] = (counts[val] || 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
}

const COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-muted-foreground)',
]

export function DashboardView() {
  const { data } = useStore()
  const total = data.length
  const now = new Date()
  const greeting = useMemo(() => getGreeting(), [])

  const thisMonth = data.filter((d) => {
    const dt = new Date(d.dato as string)
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear()
  })

  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonth = data.filter((d) => {
    const dt = new Date(d.dato as string)
    return dt.getMonth() === prevMonthDate.getMonth() && dt.getFullYear() === prevMonthDate.getFullYear()
  })

  const diff = thisMonth.length - prevMonth.length
  const ansøger = data.filter((d) => d.brugertype === 'Ansøger').length
  const fond = data.filter((d) => d.brugertype === 'Fond / administrator').length
  const prev = data.filter((d) => typeof d.forebyg === 'string' && d.forebyg.startsWith('Ja')).length
  const prevPct = total > 0 ? Math.round((prev / total) * 100) : 0
  const loest = data.filter((d) => d.losning === 'Løst i samtalen').length
  const resRate = total > 0 ? Math.round((loest / total) * 100) : 0

  // Weekly data for area chart
  const weeklyData = useMemo(() => {
    const weeks: Record<string, number> = {}
    for (const d of data) {
      const dt = new Date(d.dato as string)
      const weekStart = new Date(dt)
      weekStart.setDate(dt.getDate() - dt.getDay() + 1)
      const key = weekStart.toISOString().split('T')[0]
      weeks[key] = (weeks[key] || 0) + 1
    }
    return Object.entries(weeks)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-10)
      .map(([week, count]) => ({
        week: week.slice(5),
        antal: count,
      }))
  }, [data])

  // Category data for horizontal bar chart
  const categoryData = useMemo(() => {
    return countBy(data, 'kategori').slice(0, 6).map(([name, value]) => ({
      name: name.length > 22 ? name.slice(0, 20) + '…' : name,
      fullName: name,
      value,
    }))
  }, [data])

  // Kanal pie data
  const kanalData = useMemo(() => {
    return countBy(data, 'kanal').map(([name, value]) => ({ name, value }))
  }, [data])

  // Tid pie data
  const tidData = useMemo(() => {
    return countBy(data, 'tid').map(([name, value]) => ({
      name: name.includes('Kort') ? 'Kort' : name.includes('Medium') ? 'Medium' : 'Lang',
      fullName: name,
      value,
    }))
  }, [data])

  const areaConfig: ChartConfig = {
    antal: { label: 'Henvendelser', color: 'var(--color-chart-1)' },
  }

  const barConfig: ChartConfig = {
    value: { label: 'Antal', color: 'var(--color-chart-1)' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{greeting}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {total === 0
            ? 'Ingen henvendelser registreret endnu'
            : `${total} henvendelser registreret`}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">I alt</div>
            <div className="text-3xl font-bold mt-1">{total}</div>
            <p className="text-[11px] text-muted-foreground mt-1">siden opstart</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Denne måned</div>
            <div className="text-3xl font-bold mt-1">{thisMonth.length}</div>
            {prevMonth.length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                {diff > 0 ? <TrendingUp className="size-3 text-chart-5" /> : diff < 0 ? <TrendingDown className="size-3 text-primary" /> : <Minus className="size-3 text-muted-foreground" />}
                <span className="text-[11px] text-muted-foreground">{diff > 0 ? '+' : ''}{diff} ift. forrige</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Løsningsrate</div>
            <div className="text-3xl font-bold mt-1">{resRate}%</div>
            <p className="text-[11px] text-muted-foreground mt-1">{loest} løst direkte</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Forebyggelige</div>
            <div className="text-3xl font-bold mt-1">{prevPct}%</div>
            <p className="text-[11px] text-muted-foreground mt-1">{prev} henvendelser</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Ansøger / Fond</div>
            <div className="text-3xl font-bold mt-1">{total > 0 ? `${ansøger}/${fond}` : '–'}</div>
            <p className="text-[11px] text-muted-foreground mt-1">fordeling</p>
          </CardContent>
        </Card>
      </div>

      {/* Area chart — weekly trend */}
      {weeklyData.length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ugentlig udvikling</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={areaConfig} className="h-[180px] w-full">
              <AreaChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillAntal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="antal"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  fill="url(#fillAntal)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Category bar + donut charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Henvendelsestyper</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen data endnu</p>
            ) : (
              <ChartContainer config={barConfig} className="h-[220px] w-full">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={130} className="fill-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent nameKey="fullName" />} />
                  <Bar dataKey="value" fill="url(#barGradient)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Kanal donut */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">Kanal</CardTitle>
            </CardHeader>
            <CardContent>
              {kanalData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ingen data</p>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="h-[90px] w-[90px] shrink-0">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={kanalData}
                          dataKey="value"
                          innerRadius={25}
                          outerRadius={40}
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          {kanalData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5">
                    {kanalData.map(({ name, value }, i) => (
                      <div key={name} className="flex items-center gap-2 text-xs">
                        <div className="size-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground">{name}</span>
                        <span className="font-medium ml-auto">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tid donut */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">Tidsforbrug</CardTitle>
            </CardHeader>
            <CardContent>
              {tidData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ingen data</p>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="h-[90px] w-[90px] shrink-0">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={tidData}
                          dataKey="value"
                          innerRadius={25}
                          outerRadius={40}
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          <Cell fill="var(--color-chart-2)" />
                          <Cell fill="var(--color-chart-4)" />
                          <Cell fill="var(--color-chart-5)" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5">
                    {tidData.map(({ name, value }, i) => (
                      <div key={name} className="flex items-center gap-2 text-xs">
                        <div className="size-2 rounded-full shrink-0" style={{ background: ['var(--color-chart-2)', 'var(--color-chart-4)', 'var(--color-chart-5)'][i] }} />
                        <span className="text-muted-foreground">{name}</span>
                        <span className="font-medium ml-auto">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom row: løsning bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Løsningsmetode</CardTitle>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen data endnu</p>
          ) : (
            <ChartContainer config={barConfig} className="h-[160px] w-full">
              <BarChart
                data={countBy(data, 'losning').map(([name, value]) => ({
                  name: name.length > 18 ? name.slice(0, 16) + '…' : name,
                  fullName: name,
                  value,
                }))}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="losningGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent nameKey="fullName" />} />
                <Bar dataKey="value" fill="url(#losningGradient)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
