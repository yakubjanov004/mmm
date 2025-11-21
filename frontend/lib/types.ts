// Roles
export type Role = "Admin" | "Head of Department" | "Teacher"
export type RoleInternal = "Admin" | "Kafedra mudiri" | "O'qituvchi" // Internal storage

export const ROLES = [
  { id: 1, name: "Admin", internal: "Admin" as RoleInternal },
  { id: 2, name: "Head of Department", internal: "Kafedra mudiri" as RoleInternal },
  { id: 3, name: "Teacher", internal: "O'qituvchi" as RoleInternal },
] as const

// Positions
export type Position =
  | "Kafedra mudiri"
  | "Professor"
  | "Dotsent"
  | "Katta o'qituvchi"
  | "Assistent"
  | "Stajer-o'qituvchi"

export const POSITIONS = [
  "Kafedra mudiri",
  "Professor",
  "Dotsent",
  "Katta o'qituvchi",
  "Assistent",
  "Stajer-o'qituvchi",
] as const

// Profile Name (multi-language)
export interface ProfileName {
  language: "uz" | "uzc" | "ru" | "en"
  first_name: string
  last_name: string
  father_name?: string
}

// Employment
export interface Employment {
  id: number
  employment_type: "MAIN" | "INTERNAL" | "EXTERNAL"
  rate: string // Decimal as string (e.g., "1.00", "0.75")
  department?: { id: number; name: string } | null
  position?: { id: number; name: string } | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// User
export interface User {
  id: number
  ism: string
  familiya: string
  otasining_ismi: string
  tugilgan_yili: string // YYYY format (for backwards compatibility)
  tugilgan_sana?: string // YYYY-MM-DD format (full date)
  lavozimi?: Position // Optional - can be null/undefined
  telefon_raqami: string // +998xxxxxxxxx
  roli: Role // Display role (English)
  roli_internal: RoleInternal // Internal storage
  available_roles?: string[] // Available roles (e.g., ["HOD", "TEACHER"] for HOD)
  user_id: string
  username: string // For login
  password: string // Plaintext for demo
  kafedra_id?: number // For department filtering
  department?: string // Department name
  scopus_link?: string
  google_scholar_link?: string
  research_id_link?: string
  // Multi-language names
  names?: ProfileName[] // All language variants
  full_name?: string // Default/uz name
  full_name_uzc?: string // Uzbek Cyrillic name
  full_name_ru?: string // Russian name
  full_name_en?: string // English name
  // Employments
  employments?: Employment[] // All employment records
  // Avatar
  avatar?: string // Avatar image URL
}

// Methodical Work
export type MethodicalWorkType =
  | "Uslubiy ko'rsatma"
  | "Uslubiy qo'llanma"
  | "O'quv qo'llanma"
  | "Darslik"

export type Language = "O'zbek" | "Rus" | "Ingliz" | "Boshqa"

export interface MethodicalWork {
  id: number
  nomi: string
  yili: string // YYYY-YYYY formatida (masalan: 2024-2025)
  nashiryot_nomi?: string
  mualliflar: number[] // User IDs (co-authors)
  ish_turi: MethodicalWorkType
  tili: Language
  uslubiy_ish_fayli?: string
  nashr_ruxsat_fayli?: string
  desc?: string
  created_by: number // User ID
  department?: { id: number; name: string } // Department info for access control
  department_visible?: boolean // Visible to all department teachers (read-only unless co-author)
  created_at: string
}

// Research Work
export type ResearchWorkType =
  | "Mahalliy maqola"
  | "Xorijiy maqola"
  | "Mahalliy tezis"
  | "Xorijiy tezis"
  | "Mahalliy monografiya"
  | "Xorijiy monografiya"

export interface ResearchWork {
  id: number
  mualliflar: number[] // User IDs (co-authors)
  ilmiy_ish_nomi: string
  anjuman_yoki_jurnal_nomi: string
  yili: string // YYYY-YYYY formatida (masalan: 2024-2025)
  tili: Language
  ilmiy_ish_turi: ResearchWorkType
  ilmiy_ish_fayli?: string
  link?: string // DOI/journal link
  created_by: number // User ID
  department?: { id: number; name: string } // Department info for access control
  department_visible?: boolean // Visible to all department teachers (read-only unless co-author)
  created_at: string
}

// Certificate
export type CertificateType = "Mahalliy" | "Xalqaro"

export interface Certificate {
  id: number
  nomi: string
  yili: string // YYYY-YYYY formatida (masalan: 2024-2025)
  nashriyot_nomi?: string
  mualliflar: number[] // User IDs (co-authors)
  sertifikat_turi: CertificateType
  tili: Language
  sertifikat_fayli?: string
  desc?: string
  created_by: number // User ID
  department?: { id: number; name: string } // Department info for access control
  department_visible?: boolean // Visible to all department teachers (read-only unless co-author)
  created_at: string
}

// Software Certificate
export type SoftwareCertificateType = "DGU" | "BGU"

export interface SoftwareCertificate {
  id: number
  mualliflar: number[] // User IDs (co-authors)
  nomi: string
  tasdiqlangan_sana: string // YYYY-MM-DD
  berilgan_joy?: string
  guvohnoma_nomeri?: string
  guvohnoma_turi: SoftwareCertificateType
  fayl_url?: string
  created_by: number // User ID
  department?: { id: number; name: string } // Department info for access control
  department_visible?: boolean // Visible to all department teachers (read-only unless co-author)
  created_at: string
}

// File
export interface File {
  id: number
  fayl_url: string
  foydalanuvchi_id: number
  fayl_nomi?: string
  fayl_hajmi?: string
  created_at: string
}

