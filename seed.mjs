// Seed script — generates 200 realistic mock entries and writes to electron-store
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const kanaler = ['Telefon', 'Intercom']
const brugertyper = ['Ansøger', 'Fond / administrator']
const kategorier = [
  'Login og adgang',
  'Ansøgningsskema og udfyldelse',
  'Upload af bilag',
  'Delt adgang / flere brugere',
  'Teknisk fejl på platformen',
  'Afslag og bevilling',
  'Onboarding',
  'Afrapportering',
  'Andet',
]
const tider = ['Kort (under 5 min)', 'Medium (5–15 min)', 'Lang (over 15 min)']
const losninger = [
  'Løst i samtalen',
  'Henvist til vejledning',
  'Eskaleret internt',
  'Fejl rapporteret til udvikling',
  'Ikke løst',
]
const forebyg = [
  'Ukendt',
  'Ja – bedre vejledning',
  'Ja – platformsforbedring',
  'Ja – bedre kommunikation',
  'Nej',
]
const fonde = ['', '', '', 'Novo Nordisk Fonden', 'Villum Fonden', 'Carlsbergfondet', 'Realdania', 'Augustinus Fonden', 'Velux Fonden', '']
const noter = [
  'Ansøger kunne ikke logge ind – glemt password.',
  'Fond spurgte til opsætning af nyt ansøgningsskema.',
  'Upload fejlede – filstørrelse for stor (>25MB).',
  'Ansøger havde problemer med delt adgang til ansøgning.',
  'Teknisk fejl: siden frøs ved indsendelse.',
  'Spørgsmål om afslag – forstod ikke begrundelsen.',
  'Ny fond onboardet – gennemgik hele platformen.',
  'Afrapportering: ansøger manglede bilag-knap.',
  'Intercom chat – hurtig hjælp med login.',
  'Fond ville ændre deadline på aktivt opslag.',
  'Ansøger spurgte om status på ansøgning.',
  'Kunne ikke finde "gem kladde"-knappen.',
  'Fejl i PDF-generering af ansøgning.',
  'Ansøger ringede – ville have hjælp til budget-ark.',
  'Fond bad om hjælp til evaluering af ansøgninger.',
  'Bruger var forvirret over roller og rettigheder.',
  'Henvist til FAQ om filformater.',
  'Eskaleret: gentagen fejl ved upload af regnskab.',
  'Ansøger takkede for hjælp – løst hurtigt.',
  'Fond ville gerne have eksport af alle ansøgninger.',
  '',
  '',
]

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function weightedPick(arr, weights) {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i]
    if (r <= 0) return arr[i]
  }
  return arr[arr.length - 1]
}

function randomDate(start, end) {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return d.toISOString().split('T')[0]
}

const entries = []
const now = new Date()
const threeMonthsAgo = new Date(now)
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

for (let i = 0; i < 200; i++) {
  // Weighted distributions for realism
  const kanal = weightedPick(kanaler, [35, 65]) // more intercom
  const brugertype = weightedPick(brugertyper, [70, 30]) // more ansøgere
  const kategori = weightedPick(kategorier, [25, 20, 15, 8, 12, 5, 5, 5, 5])
  const tid = weightedPick(tider, [45, 35, 20])
  const losning = weightedPick(losninger, [50, 20, 12, 10, 8])
  const fb = weightedPick(forebyg, [20, 25, 15, 10, 30])

  // More issues in recent weeks (trending up)
  const recentBias = Math.random() < 0.4
  const dato = recentBias
    ? randomDate(new Date(now.getTime() - 14 * 86400000), now)
    : randomDate(threeMonthsAgo, now)

  entries.push({
    id: Date.now() - i * 100000 + Math.floor(Math.random() * 1000),
    dato,
    kanal,
    brugertype,
    kategori,
    tid,
    losning,
    forebyg: fb,
    fond: pick(fonde),
    note: pick(noter),
  })
}

// Sort newest first
entries.sort((a, b) => b.dato.localeCompare(a.dato))

// Write directly to electron-store location
const storePath = join(homedir(), 'Library', 'Application Support', 'grant-compass-supporttracker')
if (!existsSync(storePath)) mkdirSync(storePath, { recursive: true })

const storeFile = join(storePath, 'gc_support_data.json')

// Read existing store or create new
let store = {}
try {
  const existing = await import('fs').then(f => f.readFileSync(storeFile, 'utf8'))
  store = JSON.parse(existing)
} catch {}

store.gc_support_v1 = entries

writeFileSync(storeFile, JSON.stringify(store, null, 2))
console.log(`✅ Wrote ${entries.length} entries to ${storeFile}`)
