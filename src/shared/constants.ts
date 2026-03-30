import type { FieldsConfig } from './types'

export const ENVIRONMENT = {
  IS_DEV: process.env.NODE_ENV === 'development',
}

export const PLATFORM = {
  IS_MAC: process.platform === 'darwin',
  IS_WINDOWS: process.platform === 'win32',
  IS_LINUX: process.platform === 'linux',
}

export const STORE_KEYS = {
  DATA: 'st_data_v1',
  SETTINGS: 'st_fields_v1',
  THEME: 'st_theme',
  BRANDING: 'st_branding',
} as const

export const DEFAULT_BRANDING = {
  orgName: 'SupportTracker',
  subtitle: 'Supporttracker',
}

export const DEFAULT_FIELDS: FieldsConfig = {
  kanal: {
    label: 'Kanal',
    type: 'toggle',
    required: true,
    options: ['Telefon', 'Intercom'],
  },
  brugertype: {
    label: 'Brugertype',
    type: 'select',
    required: true,
    options: ['Ansøger', 'Fond / administrator'],
  },
  kategori: {
    label: 'Kategori',
    type: 'select',
    required: true,
    options: [
      'Login og adgang',
      'Ansøgningsskema og udfyldelse',
      'Upload af bilag',
      'Delt adgang / flere brugere',
      'Teknisk fejl på platformen',
      'Afslag og bevilling',
      'Onboarding',
      'Afrapportering',
      'Andet',
    ],
  },
  tid: {
    label: 'Tidsforbrug',
    type: 'select',
    required: true,
    options: ['Kort (under 5 min)', 'Medium (5–15 min)', 'Lang (over 15 min)'],
  },
  losning: {
    label: 'Løsning',
    type: 'select',
    required: true,
    options: [
      'Løst i samtalen',
      'Henvist til vejledning',
      'Eskaleret internt',
      'Fejl rapporteret til udvikling',
      'Ikke løst',
    ],
  },
  forebyg: {
    label: 'Forebyggelig',
    type: 'select',
    required: false,
    options: [
      'Ukendt',
      'Ja – bedre vejledning',
      'Ja – platformsforbedring',
      'Ja – bedre kommunikation',
      'Nej',
    ],
  },
  fond: {
    label: 'Fond',
    type: 'combobox',
    required: false,
    options: [
      'Novo Nordisk Fonden',
      'Villum Fonden',
      'Carlsbergfondet',
      'Realdania',
      'Augustinus Fonden',
      'Velux Fonden',
    ],
    placeholder: 'Søg eller tilføj fond...',
  },
  note: {
    label: 'Beskrivelse',
    type: 'textarea',
    required: false,
    full: true,
    placeholder: 'Kort beskrivelse af henvendelsen...',
  },
}
