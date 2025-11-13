// Data mapping utilities to convert between backend and frontend formats

import type {
  User,
  MethodicalWork,
  ResearchWork,
  Certificate,
  SoftwareCertificate,
  Role,
  Language,
  MethodicalWorkType,
  ResearchWorkType,
  CertificateType,
  SoftwareCertificateType,
  Position,
} from "./types"

// Academic year utilities
function formatAcademicYear(year: number | string): string {
  const yearNum = typeof year === "string" ? parseInt(year) : year
  return `${yearNum}-${yearNum + 1}`
}

function parseAcademicYear(yearStr: string): string {
  // If format is "2024-2025", extract first year and return as "2024-2025"
  if (yearStr.includes("-")) {
    return yearStr
  }
  // If format is just "2024", convert to "2024-2025"
  const year = parseInt(yearStr)
  if (!isNaN(year)) {
    return formatAcademicYear(year)
  }
  return yearStr
}

// Backend API response types
interface BackendUser {
  id: number
  username: string
  first_name: string
  last_name: string
  email?: string
  role: "ADMIN" | "HOD" | "TEACHER"
  department?: { id: number; name: string } | null
  position?: string | null
  phone?: string
  birth_date?: string
  scopus?: string
  scholar?: string
  research_id?: string
  user_id?: string
}

interface BackendMethodicalWork {
  id: number
  title: string
  year: number | string // Can be number (2024) or string ("2024-2025")
  language: "UZ" | "RU" | "EN" | "OTHER"
  type: "INSTRUCTION" | "GUIDE" | "STUDY_GUIDE" | "TEXTBOOK"
  publisher?: string
  file_url?: string
  permission_file_url?: string
  description?: string
  authors: Array<{ id: number; full_name: string; role: string; user_id_str: string }>
  owner: { id: number; full_name: string; role: string; user_id_str: string }
  department?: { id: number; name: string } | null
  is_department_visible: boolean
  created_at: string
  updated_at: string
}

interface BackendResearchWork {
  id: number
  title: string
  year: number | string // Can be number (2024) or string ("2024-2025")
  language: "UZ" | "RU" | "EN" | "OTHER"
  type: "LOCAL_ARTICLE" | "FOREIGN_ARTICLE" | "LOCAL_THESIS" | "FOREIGN_THESIS" | "LOCAL_MONOGRAPH" | "FOREIGN_MONOGRAPH"
  venue: string
  file_url?: string
  link?: string
  authors: Array<{ id: number; full_name: string; role: string; user_id_str: string }>
  owner: { id: number; full_name: string; role: string; user_id_str: string }
  department?: { id: number; name: string } | null
  is_department_visible: boolean
  created_at: string
  updated_at: string
}

interface BackendCertificate {
  id: number
  title: string
  year: number | string // Can be number (2024) or string ("2024-2025")
  language: "UZ" | "RU" | "EN" | "OTHER"
  type: "LOCAL" | "INTERNATIONAL"
  publisher: string
  file_url?: string
  description?: string
  authors: Array<{ id: number; full_name: string; role: string; user_id_str: string }>
  owner: { id: number; full_name: string; role: string; user_id_str: string }
  department?: { id: number; name: string } | null
  is_department_visible: boolean
  created_at: string
  updated_at: string
}

interface BackendSoftwareCertificate {
  id: number
  title: string
  year: number
  language: "UZ" | "RU" | "EN" | "OTHER"
  type: "DGU" | "BGU"
  issued_by: string
  approval_date: string
  cert_number?: string
  file_url?: string
  authors: Array<{ id: number; full_name: string; role: string; user_id_str: string }>
  owner: { id: number; full_name: string; role: string; user_id_str: string }
  department?: { id: number; name: string } | null
  is_department_visible: boolean
  created_at: string
  updated_at: string
}

// Role mapping
function mapBackendRoleToFrontend(role: string): Role {
  const roleMap: Record<string, Role> = {
    ADMIN: "Admin",
    HOD: "Head of Department",
    TEACHER: "Teacher",
  }
  return roleMap[role] || "Teacher"
}

function mapFrontendRoleToBackend(role: Role): string {
  const roleMap: Record<Role, string> = {
    Admin: "ADMIN",
    "Head of Department": "HOD",
    Teacher: "TEACHER",
  }
  return roleMap[role] || "TEACHER"
}

// Language mapping
function mapBackendLanguageToFrontend(lang: string): Language {
  const langMap: Record<string, Language> = {
    UZ: "O'zbek",
    RU: "Rus",
    EN: "Ingliz",
    OTHER: "Boshqa",
  }
  return langMap[lang] || "O'zbek"
}

function mapFrontendLanguageToBackend(lang: Language): string {
  const langMap: Record<Language, string> = {
    "O'zbek": "UZ",
    Rus: "RU",
    Ingliz: "EN",
    Boshqa: "OTHER",
  }
  return langMap[lang] || "UZ"
}

// Methodical Work Type mapping
function mapBackendMethodicalTypeToFrontend(type: string): MethodicalWorkType {
  const typeMap: Record<string, MethodicalWorkType> = {
    INSTRUCTION: "Uslubiy ko'rsatma",
    GUIDE: "Uslubiy qo'llanma",
    STUDY_GUIDE: "O'quv qo'llanma",
    TEXTBOOK: "Darslik",
  }
  return typeMap[type] || "Uslubiy ko'rsatma"
}

function mapFrontendMethodicalTypeToBackend(type: MethodicalWorkType): string {
  const typeMap: Record<MethodicalWorkType, string> = {
    "Uslubiy ko'rsatma": "INSTRUCTION",
    "Uslubiy qo'llanma": "GUIDE",
    "O'quv qo'llanma": "STUDY_GUIDE",
    Darslik: "TEXTBOOK",
  }
  return typeMap[type] || "INSTRUCTION"
}

// Research Work Type mapping
function mapBackendResearchTypeToFrontend(type: string): ResearchWorkType {
  const typeMap: Record<string, ResearchWorkType> = {
    LOCAL_ARTICLE: "Mahalliy maqola",
    FOREIGN_ARTICLE: "Xorijiy maqola",
    LOCAL_THESIS: "Mahalliy tezis",
    FOREIGN_THESIS: "Xorijiy tezis",
    LOCAL_MONOGRAPH: "Mahalliy monografiya",
    FOREIGN_MONOGRAPH: "Xorijiy monografiya",
  }
  return typeMap[type] || "Mahalliy maqola"
}

function mapFrontendResearchTypeToBackend(type: ResearchWorkType): string {
  const typeMap: Record<ResearchWorkType, string> = {
    "Mahalliy maqola": "LOCAL_ARTICLE",
    "Xorijiy maqola": "FOREIGN_ARTICLE",
    "Mahalliy tezis": "LOCAL_THESIS",
    "Xorijiy tezis": "FOREIGN_THESIS",
    "Mahalliy monografiya": "LOCAL_MONOGRAPH",
    "Xorijiy monografiya": "FOREIGN_MONOGRAPH",
  }
  return typeMap[type] || "LOCAL_ARTICLE"
}

// Certificate Type mapping
function mapBackendCertificateTypeToFrontend(type: string): CertificateType {
  const typeMap: Record<string, CertificateType> = {
    LOCAL: "Mahalliy",
    INTERNATIONAL: "Xalqaro",
  }
  return typeMap[type] || "Mahalliy"
}

function mapFrontendCertificateTypeToBackend(type: CertificateType): string {
  const typeMap: Record<CertificateType, string> = {
    Mahalliy: "LOCAL",
    Xalqaro: "INTERNATIONAL",
  }
  return typeMap[type] || "LOCAL"
}

// Software Certificate Type mapping (already same)
function mapBackendSoftwareCertificateTypeToFrontend(type: string): SoftwareCertificateType {
  return type as SoftwareCertificateType
}

// User mapping
export function mapBackendUserToFrontend(backend: BackendUser): User {
  const nameParts = (backend.first_name || "").split(" ")
  const ism = nameParts[0] || ""
  const otasining_ismi = nameParts.slice(1).join(" ") || ""
  const familiya = backend.last_name || ""

  const roli = mapBackendRoleToFrontend(backend.role)
  const roli_internal = backend.role === "HOD" ? "Kafedra mudiri" : backend.role === "ADMIN" ? "Admin" : "O'qituvchi"

  return {
    id: backend.id,
    ism,
    familiya,
    otasining_ismi,
    tugilgan_yili: backend.birth_date ? backend.birth_date.split("-")[0] : "",
    tugilgan_sana: backend.birth_date || undefined,
    lavozimi: (backend.position as Position | undefined) || undefined, // Keep as undefined if null/empty
    telefon_raqami: backend.phone || "",
    roli,
    roli_internal,
    user_id: backend.user_id || "",
    username: backend.username,
    password: "", // Not returned from backend
    kafedra_id: backend.department?.id,
    department: backend.department?.name,
    scopus_link: backend.scopus,
    google_scholar_link: backend.scholar,
    research_id_link: backend.research_id,
  }
}

// Methodical Work mapping
export function mapBackendMethodicalWorkToFrontend(backend: BackendMethodicalWork): MethodicalWork {
  // Backend now returns year as "2024-2025" string, but handle both formats
  const yearStr = typeof backend.year === "string" ? backend.year : String(backend.year)
  return {
    id: backend.id,
    nomi: backend.title,
    yili: parseAcademicYear(yearStr),
    nashiryot_nomi: backend.publisher,
    mualliflar: backend.authors.map((a) => a.id),
    ish_turi: mapBackendMethodicalTypeToFrontend(backend.type),
    tili: mapBackendLanguageToFrontend(backend.language),
    uslubiy_ish_fayli: backend.file_url,
    nashr_ruxsat_fayli: backend.permission_file_url,
    desc: backend.description,
    created_by: backend.owner.id,
    department: backend.department || undefined,
    department_visible: backend.is_department_visible,
    created_at: backend.created_at,
  }
}

// Research Work mapping
export function mapBackendResearchWorkToFrontend(backend: BackendResearchWork): ResearchWork {
  // Backend now returns year as "2024-2025" string, but handle both formats
  const yearStr = typeof backend.year === "string" ? backend.year : String(backend.year)
  return {
    id: backend.id,
    mualliflar: backend.authors.map((a) => a.id),
    ilmiy_ish_nomi: backend.title,
    anjuman_yoki_jurnal_nomi: backend.venue,
    yili: parseAcademicYear(yearStr),
    tili: mapBackendLanguageToFrontend(backend.language),
    ilmiy_ish_turi: mapBackendResearchTypeToFrontend(backend.type),
    ilmiy_ish_fayli: backend.file_url,
    link: backend.link,
    created_by: backend.owner.id,
    department: backend.department || undefined,
    department_visible: backend.is_department_visible,
    created_at: backend.created_at,
  }
}

// Certificate mapping
export function mapBackendCertificateToFrontend(backend: BackendCertificate): Certificate {
  // Backend now returns year as "2024-2025" string, but handle both formats
  const yearStr = typeof backend.year === "string" ? backend.year : String(backend.year)
  return {
    id: backend.id,
    nomi: backend.title,
    yili: parseAcademicYear(yearStr),
    nashriyot_nomi: backend.publisher,
    mualliflar: backend.authors.map((a) => a.id),
    sertifikat_turi: mapBackendCertificateTypeToFrontend(backend.type),
    tili: mapBackendLanguageToFrontend(backend.language),
    sertifikat_fayli: backend.file_url,
    desc: backend.description,
    created_by: backend.owner.id,
    department: backend.department || undefined,
    department_visible: backend.is_department_visible,
    created_at: backend.created_at,
  }
}

// Software Certificate mapping
export function mapBackendSoftwareCertificateToFrontend(
  backend: BackendSoftwareCertificate
): SoftwareCertificate {
  return {
    id: backend.id,
    mualliflar: backend.authors.map((a) => a.id),
    nomi: backend.title,
    tasdiqlangan_sana: backend.approval_date,
    berilgan_joy: backend.issued_by,
    guvohnoma_nomeri: backend.cert_number,
    guvohnoma_turi: mapBackendSoftwareCertificateTypeToFrontend(backend.type),
    fayl_url: backend.file_url,
    created_by: backend.owner.id,
    department: backend.department || undefined,
    department_visible: backend.is_department_visible,
    created_at: backend.created_at,
  }
}

// Reverse mappings (for sending data to backend)
export function mapFrontendMethodicalWorkToBackend(frontend: Partial<MethodicalWork>): any {
  // Frontend sends "2024-2025", backend expects "2024-2025" (AcademicYearField handles conversion)
  return {
    title: frontend.nomi,
    year: frontend.yili || undefined, // Send as "2024-2025" string, AcademicYearField will parse it
    language: frontend.tili ? mapFrontendLanguageToBackend(frontend.tili) : undefined,
    type: frontend.ish_turi ? mapFrontendMethodicalTypeToBackend(frontend.ish_turi) : undefined,
    publisher: frontend.nashiryot_nomi,
    description: frontend.desc,
    authors: frontend.mualliflar,
    is_department_visible: frontend.department_visible,
  }
}

export function mapFrontendResearchWorkToBackend(frontend: Partial<ResearchWork>): any {
  // Frontend sends "2024-2025", backend expects "2024-2025" (AcademicYearField handles conversion)
  return {
    title: frontend.ilmiy_ish_nomi,
    year: frontend.yili || undefined, // Send as "2024-2025" string, AcademicYearField will parse it
    language: frontend.tili ? mapFrontendLanguageToBackend(frontend.tili) : undefined,
    type: frontend.ilmiy_ish_turi ? mapFrontendResearchTypeToBackend(frontend.ilmiy_ish_turi) : undefined,
    venue: frontend.anjuman_yoki_jurnal_nomi,
    link: frontend.link,
    authors: frontend.mualliflar,
    is_department_visible: frontend.department_visible,
  }
}

export function mapFrontendCertificateToBackend(frontend: Partial<Certificate>): any {
  // Frontend sends "2024-2025", backend expects "2024-2025" (AcademicYearField handles conversion)
  return {
    title: frontend.nomi,
    year: frontend.yili || undefined, // Send as "2024-2025" string, AcademicYearField will parse it
    language: frontend.tili ? mapFrontendLanguageToBackend(frontend.tili) : undefined,
    type: frontend.sertifikat_turi ? mapFrontendCertificateTypeToBackend(frontend.sertifikat_turi) : undefined,
    publisher: frontend.nashriyot_nomi,
    description: frontend.desc,
    authors: frontend.mualliflar,
    is_department_visible: frontend.department_visible,
  }
}

export function mapFrontendSoftwareCertificateToBackend(frontend: Partial<SoftwareCertificate>): any {
  return {
    title: frontend.nomi,
    year: frontend.tasdiqlangan_sana ? new Date(frontend.tasdiqlangan_sana).getFullYear() : undefined,
    language: "UZ", // Default
    type: frontend.guvohnoma_turi,
    issued_by: frontend.berilgan_joy,
    approval_date: frontend.tasdiqlangan_sana,
    cert_number: frontend.guvohnoma_nomeri,
    authors: frontend.mualliflar,
    is_department_visible: frontend.department_visible,
  }
}

