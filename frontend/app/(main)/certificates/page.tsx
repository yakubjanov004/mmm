"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb"
import { MultiSelect } from "@/components/ui/multi-select"
import { Edit, Search, Plus, Trash2, Eye, Loader2, X, FileText } from "lucide-react"
import { getCurrentUserSync, canEditRecord, canCreateRecord, filterRecordsByRole } from "@/lib/auth"
import { worksAPI, usersAPI } from "@/lib/api"
import { mapBackendCertificateToFrontend, mapFrontendCertificateToBackend, mapBackendUserToFrontend } from "@/lib/api-mappers"
import { toast } from "sonner"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n"
import type { Certificate, CertificateType, Language, User, Role } from "@/lib/types"

export default function CertificatesPage() {
  const { t, language } = useTranslation()
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUserSync())
  const [searchQuery, setSearchQuery] = useState("")
  const [yearFilter, setYearFilter] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [languageFilter, setLanguageFilter] = useState<string>("")
  const [editingCert, setEditingCert] = useState<Certificate | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<Certificate>>({})
  const [fileData, setFileData] = useState<{
    file?: File | null
    existingFileUrl?: string | null
  }>({})

  // Admin cannot access this page
  if (currentUser?.roli === "Admin") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-destructive/10 p-4 rounded-full">
                  <Eye className="w-12 h-12 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl">{t("errors.accessDenied")}</CardTitle>
              <CardDescription className="text-base mt-2">
                {t("errors.onlyTeacherAndHodCertificates")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/dashboard">{t("errors.backToDashboard")}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Data states
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [roleChanged, setRoleChanged] = useState(0) // Force re-render when role changes
  const hasFetchedRef = useRef(false)

  // Listen for role changes and update current user
  useEffect(() => {
    const handleRoleChange = () => {
      // Update current user to reflect role change
      setCurrentUser(getCurrentUserSync())
      // Reset fetch flag to allow re-fetch
      hasFetchedRef.current = false
      setRoleChanged(prev => prev + 1)
    }
    window.addEventListener("roleChanged", handleRoleChange as EventListener)
    return () => {
      window.removeEventListener("roleChanged", handleRoleChange as EventListener)
    }
  }, [])

  // Fetch data from API
  useEffect(() => {
    if (hasFetchedRef.current) return
    if (!currentUser) return

    hasFetchedRef.current = true

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [certsData, usersData] = await Promise.all([
          worksAPI.certificates.list().catch(() => ({ results: [] })),
          // Load users for all roles to display author names
          usersAPI.list().catch((err) => {
            console.warn("Users API error:", err)
            return []
          }),
        ])

        const certsList = ((certsData as any)?.results || certsData || []).map((cert: any) => {
          console.log("Certificate data:", cert)
          console.log("Certificate authors:", cert.authors)
          return mapBackendCertificateToFrontend(cert)
        })
        console.log("Mapped certificates:", certsList)
        setCertificates(certsList)
        
        // Map users data using mapBackendUserToFrontend to preserve all language variants
        // Filter out admin and djangoadmin users
        const rawUsers = (usersData as any)?.results || usersData || []
        const mappedUsers: User[] = Array.isArray(rawUsers) ? rawUsers
          .filter((u: any) => {
            const username = (u.username || u.profile?.username || "").toLowerCase()
            const role = (u.profile?.role || "TEACHER").toUpperCase()
            // Exclude admin users and djangoadmin
            return username !== "admin" && username !== "djangoadmin" && role !== "ADMIN"
          })
          .map((u: any) => {
            // Handle different response formats - prepare backend user format
            const profile = u.profile || u
            const backendUserData = {
              id: u.id,
              username: u.username || profile?.username || "",
              first_name: u.first_name || profile?.first_name || "",
              last_name: u.last_name || profile?.last_name || "",
              email: u.email || profile?.email || "",
              role: (profile?.role || "TEACHER") as "ADMIN" | "HOD" | "TEACHER",
              available_roles: profile?.available_roles || [],
              department: profile?.department || null,
              position: profile?.position || null,
              phone: profile?.phone || "",
              birth_date: profile?.birth_date || "",
              avatar: profile?.avatar || null,
              scopus: profile?.scopus || "",
              scholar: profile?.scholar || "",
              research_id: profile?.research_id || "",
              user_id: profile?.user_id || profile?.user_id_str || "",
              // Multi-language names - preserve from backend
              names: profile?.names || [],
              full_name: profile?.full_name,
              full_name_uzc: profile?.full_name_uzc,
              full_name_ru: profile?.full_name_ru,
              full_name_en: profile?.full_name_en,
              // Employments
              employments: profile?.employments || [],
            }
            return mapBackendUserToFrontend(backendUserData)
          }) : []
        setUsers(mappedUsers)
      } catch (error: any) {
        toast.error("Ma'lumotlarni yuklashda xatolik: " + (error.message || "Noma'lum xatolik"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentUser, roleChanged])

  const filteredCerts = useMemo(() => {
    // First filter by role (HOD sees all department, TEACHER sees only own)
    let filtered = filterRecordsByRole(certificates, currentUser)

    // Then apply search and other filters
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((cert) => cert.nomi.toLowerCase().includes(query))
    }
    if (yearFilter) filtered = filtered.filter((cert) => cert.yili === yearFilter)
    if (typeFilter) filtered = filtered.filter((cert) => cert.sertifikat_turi === typeFilter)
    if (languageFilter) filtered = filtered.filter((cert) => cert.tili === languageFilter)
    return filtered
  }, [certificates, currentUser, searchQuery, yearFilter, typeFilter, languageFilter, roleChanged, language])

  const handleCreate = () => {
    setEditingCert(null)
    const currentYear = new Date().getFullYear()
    const academicYear = `${currentYear}-${currentYear + 1}`
    setFormData({
      nomi: "",
      yili: academicYear,
      nashriyot_nomi: "",
      mualliflar: currentUser ? [currentUser.id] : [],
      sertifikat_turi: "Mahalliy",
      tili: "O'zbek",
      desc: "",
    })
    setFileData({
      file: null,
      existingFileUrl: null,
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (cert: Certificate) => {
    setEditingCert(cert)
    setFormData(cert)
    setFileData({
      file: null,
      existingFileUrl: cert.sertifikat_fayli || null,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nomi) {
      toast.error(t("certificates.nameRequired"))
      return
    }

    try {
      const backendData = mapFrontendCertificateToBackend(formData)
      const formDataToSend = new FormData()

      Object.entries(backendData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "authors" && Array.isArray(value)) {
            value.forEach((id: number) => {
              formDataToSend.append("authors", String(id))
            })
          } else {
            formDataToSend.append(key, String(value))
          }
        }
      })

      // Add file if new file is selected
      if (fileData.file) {
        formDataToSend.append("file", fileData.file)
      }

      if (editingCert) {
        await worksAPI.certificates.update(editingCert.id, formDataToSend)
        toast.success(t("certificates.updated"))
      } else {
        await worksAPI.certificates.create(formDataToSend)
        toast.success(t("certificates.created"))
      }

      // Refresh data
      const certsData = await worksAPI.certificates.list()
      const certsList = ((certsData as any)?.results || certsData || []).map(mapBackendCertificateToFrontend)
      setCertificates(certsList)

      setIsDialogOpen(false)
      setEditingCert(null)
      setFormData({})
    } catch (error: any) {
      toast.error(t("errors.error") + ": " + (error.message || t("errors.unknownError")))
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await worksAPI.certificates.delete(id)
      toast.success(t("certificates.deleted"))

      // Refresh data
      const certsData = await worksAPI.certificates.list()
      const certsList = ((certsData as any)?.results || certsData || []).map(mapBackendCertificateToFrontend)
      setCertificates(certsList)

      setDeleteId(null)
    } catch (error: any) {
      toast.error(t("errors.error") + ": " + (error.message || t("errors.unknownError")))
    }
  }

  // Get author name in current language, with fallback to default (uz) if not found
  // Use useMemo to ensure it updates when language changes
  const getAuthorDisplayName = useMemo(() => {
    return (user: User): string => {
      // Try current language first
      let displayName: string | undefined
      
      switch (language) {
        case "uz":
          displayName = user.full_name
          break
        case "uzc":
          displayName = user.full_name_uzc
          break
        case "ru":
          displayName = user.full_name_ru
          break
        case "en":
          displayName = user.full_name_en
          break
        default:
          displayName = user.full_name
      }
      
      // If found and not empty, return it
      if (displayName && displayName.trim()) {
        return displayName
      }
      
      // Fallback to default (uz) language
      if (user.full_name && user.full_name.trim()) {
        return user.full_name
      }
      
      // Try other languages as fallback
      if (user.full_name_uzc && user.full_name_uzc.trim()) {
        return user.full_name_uzc
      }
      if (user.full_name_ru && user.full_name_ru.trim()) {
        return user.full_name_ru
      }
      if (user.full_name_en && user.full_name_en.trim()) {
        return user.full_name_en
      }
      
      // Final fallback to default name construction
      return `${user.ism} ${user.familiya}`.trim() || user.username
    }
  }, [language])

  const getAuthorNames = (authorIds: number[]) => {
    return authorIds
      .map((id) => {
        const user = users.find((u) => u.id === id)
        return user ? getAuthorDisplayName(user) : ""
      })
      .filter(Boolean)
      .join(", ")
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">{t("dashboard.title")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>{t("certificates.title")}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("certificates.title")}</h1>
          <p className="text-muted-foreground">{t("certificates.subtitle")}</p>
        </div>
        {canCreateRecord(currentUser) && (
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            {t("certificates.create")}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("certificates.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{t("certificates.search")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("certificates.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Yil</Label>
              <Select value={yearFilter || "all"} onValueChange={(value) => setYearFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.allYears")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allYears")}</SelectItem>
                  {Array.from(new Set(certificates.map((c) => c.yili))).map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("certificates.certificateType")}</Label>
              <Select value={typeFilter || "all"} onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.allTypes")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
                  <SelectItem value="Mahalliy">{t("certificates.certificateTypes.local")}</SelectItem>
                  <SelectItem value="Xalqaro">{t("certificates.certificateTypes.international")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("certificates.language")}</Label>
              <Select value={languageFilter || "all"} onValueChange={(value) => setLanguageFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.allLanguages")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allLanguages")}</SelectItem>
                  <SelectItem value="O'zbek">{t("methodicalWorks.languages.uzbek")}</SelectItem>
                  <SelectItem value="Rus">{t("methodicalWorks.languages.russian")}</SelectItem>
                  <SelectItem value="Ingliz">{t("methodicalWorks.languages.english")}</SelectItem>
                  <SelectItem value="Boshqa">{t("methodicalWorks.languages.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("certificates.list")}</CardTitle>
          <CardDescription>{filteredCerts.length} {t("certificates.found")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("certificates.noRecords")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>{t("certificates.tableHeaders.id")}</TableHead>
                  <TableHead>{t("certificates.tableHeaders.name")}</TableHead>
                  <TableHead>{t("certificates.tableHeaders.year")}</TableHead>
                  <TableHead>{t("certificates.tableHeaders.publisher")}</TableHead>
                  <TableHead>{t("certificates.tableHeaders.authors")}</TableHead>
                  <TableHead>{t("certificates.tableHeaders.type")}</TableHead>
                  <TableHead>{t("certificates.tableHeaders.language")}</TableHead>
                  <TableHead>{t("certificates.tableHeaders.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCerts.map((cert) => {
                  const canEdit = canEditRecord(cert, currentUser)
                  return (
                    <TableRow 
                      key={cert.id}
                      className="hover:bg-blue-600 hover:text-white cursor-pointer transition-colors [&_*]:hover:text-white [&_*]:hover:border-white/20"
                    >
                      <TableCell className="hover:text-white">{cert.id}</TableCell>
                      <TableCell className="font-medium hover:text-white">{cert.nomi}</TableCell>
                      <TableCell className="hover:text-white">{cert.yili}</TableCell>
                      <TableCell className="hover:text-white">{cert.nashriyot_nomi || "-"}</TableCell>
                      <TableCell className="max-w-xs hover:text-white">
                        {cert.mualliflar && cert.mualliflar.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {cert.mualliflar.map((id) => {
                              const user = users.find((u) => u.id === id)
                              return user ? (
                                <div key={id} className="text-sm whitespace-normal break-words">
                                  {getAuthorDisplayName(user)}
                                </div>
                              ) : null
                            })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hover:text-white">
                        <Badge variant="outline" className="hover:border-white/20 hover:text-white">{cert.sertifikat_turi}</Badge>
                      </TableCell>
                      <TableCell className="hover:text-white">
                        <Badge variant="secondary" className="hover:bg-white/20 hover:text-white">{cert.tili}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-white/20 hover:text-white"
                            onClick={() => {
                              setViewingCert(cert)
                              setIsViewDialogOpen(true)
                            }}
                            title="To'liq ma'lumotlarni ko'rish"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canEdit && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-white/20 hover:text-white"
                                onClick={() => handleEdit(cert)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-white/20 hover:text-white hover:text-red-200"
                                onClick={() => setDeleteId(cert.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCert ? t("certificates.edit") : t("certificates.createNew")}
            </DialogTitle>
            <DialogDescription>
              {editingCert ? t("methodicalWorks.editDescription") : t("methodicalWorks.createDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nomi">
                {t("certificates.name")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nomi"
                value={formData.nomi || ""}
                onChange={(e) => setFormData({ ...formData, nomi: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yili">{t("certificates.year")}</Label>
                <Select
                  value={formData.yili || ""}
                  onValueChange={(value) => setFormData({ ...formData, yili: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("methodicalWorks.selectYear")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => {
                      const startYear = new Date().getFullYear() - 5 + i
                      const endYear = startYear + 1
                      const yearValue = `${startYear}-${endYear}`
                      return (
                        <SelectItem key={yearValue} value={yearValue}>
                          {yearValue}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nashriyot_nomi">{t("certificates.publisher")}</Label>
                <Input
                  id="nashriyot_nomi"
                  value={formData.nashriyot_nomi || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, nashriyot_nomi: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mualliflar">{t("certificates.authors")}</Label>
              {users.length > 0 ? (
                <MultiSelect
                  options={users
                    .filter((user) => user.ism || user.familiya)
                    .map((user) => ({
                      value: String(user.id),
                      label: `${user.ism || ""} ${user.familiya || ""}`.trim() || `User ${user.id}`,
                    }))}
                  selected={(formData.mualliflar || []).map((id) => String(id))}
                  onChange={(selected) =>
                    setFormData({
                      ...formData,
                      mualliflar: selected.map(Number).filter((id) => !isNaN(id)),
                    })
                  }
                  placeholder="Mualliflarni tanlang yoki qidiring..."
                />
              ) : (
                <div className="text-sm text-muted-foreground">Mualliflar yuklanmoqda...</div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sertifikat_turi">{t("certificates.certificateType")}</Label>
                <Select
                  value={formData.sertifikat_turi}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sertifikat_turi: value as CertificateType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mahalliy">{t("certificates.certificateTypes.local")}</SelectItem>
                    <SelectItem value="Xalqaro">{t("certificates.certificateTypes.international")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tili">{t("certificates.tili")}</Label>
                <Select
                  value={formData.tili}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tili: value as Language })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="O'zbek">{t("methodicalWorks.languages.uzbek")}</SelectItem>
                    <SelectItem value="Rus">{t("methodicalWorks.languages.russian")}</SelectItem>
                    <SelectItem value="Ingliz">{t("methodicalWorks.languages.english")}</SelectItem>
                    <SelectItem value="Boshqa">{t("methodicalWorks.languages.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sertifikat_fayli">{t("certificates.file")}</Label>
              {fileData.existingFileUrl && !fileData.file && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md mb-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm flex-1">{t("methodicalWorks.existingFileLoaded")}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFileData({ ...fileData, existingFileUrl: null })}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {fileData.file && (
                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-md mb-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm flex-1">{fileData.file.name} ({(fileData.file.size / 1024).toFixed(2)} KB)</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFileData({ ...fileData, file: null })}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <Input
                id="sertifikat_fayli"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    toast.success(`${t("methodicalWorks.fileSelected")}: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
                    setFileData({ ...fileData, file, existingFileUrl: null })
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">{t("certificates.description")}</Label>
              <Textarea
                id="desc"
                value={formData.desc || ""}
                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("methodicalWorks.workDetails")}</DialogTitle>
            <DialogDescription>{t("methodicalWorks.fullDetails")}</DialogDescription>
          </DialogHeader>
          {viewingCert && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">{t("certificates.tableHeaders.id")}</Label>
                  <p className="text-sm">{viewingCert.id}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">{t("certificates.tableHeaders.year")}</Label>
                  <p className="text-sm">{viewingCert.yili}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">{t("certificates.tableHeaders.name")}</Label>
                <p className="text-sm">{viewingCert.nomi}</p>
              </div>
              {viewingCert.nashriyot_nomi && (
                <div className="space-y-2">
                  <Label className="font-semibold">{t("certificates.publisher")}</Label>
                  <p className="text-sm">{viewingCert.nashriyot_nomi}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">{t("certificates.certificateType")}</Label>
                  <p className="text-sm">
                    <Badge variant="outline">{viewingCert.sertifikat_turi}</Badge>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">{t("certificates.tili")}</Label>
                  <p className="text-sm">
                    <Badge variant="secondary">{viewingCert.tili}</Badge>
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">{t("certificates.authors")}</Label>
                {viewingCert.mualliflar && viewingCert.mualliflar.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {viewingCert.mualliflar.map((id) => {
                      const user = users.find((u) => u.id === id)
                      return user ? (
                        <p key={id} className="text-sm">
                          {getAuthorDisplayName(user)}
                        </p>
                      ) : null
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("methodicalWorks.authorsNotShown")}</p>
                )}
              </div>
              {viewingCert.desc && (
                <div className="space-y-2">
                  <Label className="font-semibold">{t("certificates.description")}</Label>
                  <p className="text-sm whitespace-pre-wrap">{viewingCert.desc}</p>
                </div>
              )}
              {viewingCert.sertifikat_fayli && typeof viewingCert.sertifikat_fayli === 'string' && viewingCert.sertifikat_fayli.trim() !== "" && (
                <div className="space-y-2">
                  <Label className="font-semibold">{t("methodicalWorks.workFile")}</Label>
                  <div className="flex items-center gap-2">
                    <a
                      href={viewingCert.sertifikat_fayli}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {t("methodicalWorks.viewFile")}
                    </a>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Yaratilgan sana</Label>
                  <p className="text-sm">
                    {viewingCert.created_at ? new Date(viewingCert.created_at).toLocaleString('uz-UZ') : "-"}
                  </p>
                </div>
                {viewingCert.department && (
                  <div className="space-y-2">
                    <Label className="font-semibold">Kafedra</Label>
                    <p className="text-sm">{viewingCert.department.name}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Yopish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("certificates.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("certificates.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

