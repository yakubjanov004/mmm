"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Edit, Search, Plus, Trash2, Eye, Loader2 } from "lucide-react"
import { getCurrentUserSync, canEditRecord, canCreateRecord, filterRecordsByRole } from "@/lib/auth"
import { worksAPI, usersAPI } from "@/lib/api"
import { mapBackendSoftwareCertificateToFrontend, mapFrontendSoftwareCertificateToBackend, mapBackendUserToFrontend } from "@/lib/api-mappers"
import { toast } from "sonner"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n"
import type { SoftwareCertificate, SoftwareCertificateType, User, Role } from "@/lib/types"

export default function SoftwareCertificatesPage() {
  const { t, language } = useTranslation()
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUserSync())
  const [searchQuery, setSearchQuery] = useState("")
  const [yearFilter, setYearFilter] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [editingCert, setEditingCert] = useState<SoftwareCertificate | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewingCert, setViewingCert] = useState<SoftwareCertificate | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<SoftwareCertificate>>({})

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
                {t("errors.onlyTeacherAndHodSoftwareCertificates")}
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
  const [certificates, setCertificates] = useState<SoftwareCertificate[]>([])
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
          worksAPI.softwareCertificates.list().catch(() => ({ results: [] })),
          // Load users for all roles to display author names
          usersAPI.list().catch((err) => {
            console.warn("Users API error:", err)
            return []
          }),
        ])

        const certsList = ((certsData as any)?.results || certsData || []).map((cert: any) => {
          console.log("Software Certificate data:", cert)
          console.log("Software Certificate authors:", cert.authors)
          return mapBackendSoftwareCertificateToFrontend(cert)
        })
        console.log("Mapped software certificates:", certsList)
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
        toast.error(t("errors.loadDataError") + ": " + (error.message || t("errors.unknownError")))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentUser, roleChanged, t])

  const filteredCerts = useMemo(() => {
    // First filter by role (HOD sees all department, TEACHER sees only own)
    let filtered = filterRecordsByRole(certificates, currentUser)

    // Then apply search and other filters
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((cert) => cert.nomi.toLowerCase().includes(query))
    }
    if (yearFilter) {
      filtered = filtered.filter(
        (cert) => cert.tasdiqlangan_sana.split("-")[0] === yearFilter,
      )
    }
    if (typeFilter) {
      filtered = filtered.filter((cert) => cert.guvohnoma_turi === typeFilter)
    }
    return filtered
  }, [certificates, currentUser, searchQuery, yearFilter, typeFilter, roleChanged, language])

  const handleCreate = () => {
    setEditingCert(null)
    setFormData({
      mualliflar: currentUser ? [currentUser.id] : [],
      nomi: "",
      tasdiqlangan_sana: new Date().toISOString().split("T")[0],
      berilgan_joy: "",
      guvohnoma_nomeri: "",
      guvohnoma_turi: "DGU",
      fayl_url: "",
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (cert: SoftwareCertificate) => {
    setEditingCert(cert)
    setFormData(cert)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nomi) {
      toast.error(t("softwareCertificates.nameRequired"))
      return
    }
    if (formData.tasdiqlangan_sana && !/^\d{4}-\d{2}-\d{2}$/.test(formData.tasdiqlangan_sana)) {
      toast.error(t("softwareCertificates.dateFormat"))
      return
    }

    try {
      const backendData = mapFrontendSoftwareCertificateToBackend(formData)
      const formDataToSend = new FormData()

      Object.entries(backendData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "authors" && Array.isArray(value)) {
            value.forEach((id: number) => {
              formDataToSend.append("authors", String(id))
            })
          } else if (key === "file" && value instanceof File) {
            formDataToSend.append("file", value)
          } else {
            formDataToSend.append(key, String(value))
          }
        }
      })

      if (editingCert) {
        await worksAPI.softwareCertificates.update(editingCert.id, formDataToSend)
        toast.success(t("softwareCertificates.updated"))
      } else {
        await worksAPI.softwareCertificates.create(formDataToSend)
        toast.success(t("softwareCertificates.created"))
      }

      // Refresh data
      const certsData = await worksAPI.softwareCertificates.list()
      const certsList = ((certsData as any)?.results || certsData || []).map(mapBackendSoftwareCertificateToFrontend)
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
      await worksAPI.softwareCertificates.delete(id)
      toast.success(t("softwareCertificates.deleted"))

      // Refresh data
      const certsData = await worksAPI.softwareCertificates.list()
      const certsList = ((certsData as any)?.results || certsData || []).map(mapBackendSoftwareCertificateToFrontend)
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
          <BreadcrumbItem>{t("softwareCertificates.title")}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("softwareCertificates.title")}</h1>
          <p className="text-muted-foreground">{t("softwareCertificates.subtitle")}</p>
        </div>
        {canCreateRecord(currentUser) && (
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            {t("softwareCertificates.create")}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("softwareCertificates.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t("softwareCertificates.search")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("softwareCertificates.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("filters.year")}</Label>
              <Select value={yearFilter || "all"} onValueChange={(value) => setYearFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.allYears")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allYears")}</SelectItem>
                  {Array.from(
                    new Set(certificates.map((c) => c.tasdiqlangan_sana.split("-")[0])),
                  ).map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("softwareCertificates.certificateType")}</Label>
              <Select value={typeFilter || "all"} onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.allTypes")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
                  <SelectItem value="DGU">{t("softwareCertificates.certificateTypes.dgu")}</SelectItem>
                  <SelectItem value="BGU">{t("softwareCertificates.certificateTypes.bgu")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("softwareCertificates.list")}</CardTitle>
          <CardDescription>
            {filteredCerts.length} {t("softwareCertificates.found")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("softwareCertificates.noRecords")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>{t("softwareCertificates.tableHeaders.id")}</TableHead>
                  <TableHead>{t("softwareCertificates.tableHeaders.name")}</TableHead>
                  <TableHead>{t("softwareCertificates.tableHeaders.confirmationDate")}</TableHead>
                  <TableHead>{t("softwareCertificates.tableHeaders.issuedPlace")}</TableHead>
                  <TableHead>{t("softwareCertificates.tableHeaders.authors")}</TableHead>
                  <TableHead>{t("softwareCertificates.tableHeaders.certificateNumber")}</TableHead>
                  <TableHead>{t("softwareCertificates.tableHeaders.type")}</TableHead>
                  <TableHead>{t("softwareCertificates.tableHeaders.actions")}</TableHead>
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
                      <TableCell className="hover:text-white">{cert.tasdiqlangan_sana}</TableCell>
                      <TableCell className="hover:text-white">{cert.berilgan_joy || "-"}</TableCell>
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
                      <TableCell className="hover:text-white">{cert.guvohnoma_nomeri || "-"}</TableCell>
                      <TableCell className="hover:text-white">
                        <Badge variant="outline" className="hover:border-white/20 hover:text-white">{cert.guvohnoma_turi}</Badge>
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
                            title={t("methodicalWorks.workDetails")}
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
              {editingCert ? t("softwareCertificates.edit") : t("softwareCertificates.createNew")}
            </DialogTitle>
            <DialogDescription>
              {editingCert ? t("methodicalWorks.editDescription") : t("methodicalWorks.createDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mualliflar">{t("softwareCertificates.authors")}</Label>
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
            <div className="space-y-2">
              <Label htmlFor="nomi">
                {t("softwareCertificates.name")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nomi"
                value={formData.nomi || ""}
                onChange={(e) => setFormData({ ...formData, nomi: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tasdiqlangan_sana">{t("softwareCertificates.confirmationDate")}</Label>
                <Input
                  id="tasdiqlangan_sana"
                  type="date"
                  value={formData.tasdiqlangan_sana || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, tasdiqlangan_sana: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="berilgan_joy">{t("softwareCertificates.issuedPlace")}</Label>
                <Input
                  id="berilgan_joy"
                  value={formData.berilgan_joy || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, berilgan_joy: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guvohnoma_nomeri">{t("softwareCertificates.certificateNumber")}</Label>
                <Input
                  id="guvohnoma_nomeri"
                  value={formData.guvohnoma_nomeri || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, guvohnoma_nomeri: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guvohnoma_turi">{t("softwareCertificates.certificateType")}</Label>
                <Select
                  value={formData.guvohnoma_turi}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      guvohnoma_turi: value as SoftwareCertificateType,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DGU">{t("softwareCertificates.certificateTypes.dgu")}</SelectItem>
                    <SelectItem value="BGU">{t("softwareCertificates.certificateTypes.bgu")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fayl_url">{t("softwareCertificates.fileUrl")}</Label>
              <Input
                id="fayl_url"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    toast.success(`${t("softwareCertificates.fileUploaded")}: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
                    setFormData({
                      ...formData,
                      fayl_url: `/demo/${file.name}`,
                    })
                  }
                }}
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
                  <Label className="font-semibold">{t("softwareCertificates.tableHeaders.id")}</Label>
                  <p className="text-sm">{viewingCert.id}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">{t("softwareCertificates.tableHeaders.confirmationDate")}</Label>
                  <p className="text-sm">
                    {viewingCert.tasdiqlangan_sana ? new Date(viewingCert.tasdiqlangan_sana).toLocaleDateString('uz-UZ') : "-"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">{t("softwareCertificates.tableHeaders.name")}</Label>
                <p className="text-sm">{viewingCert.nomi}</p>
              </div>
              {viewingCert.berilgan_joy && (
                <div className="space-y-2">
                  <Label className="font-semibold">{t("softwareCertificates.issuedPlace")}</Label>
                  <p className="text-sm">{viewingCert.berilgan_joy}</p>
                </div>
              )}
              {viewingCert.guvohnoma_nomeri && (
                <div className="space-y-2">
                  <Label className="font-semibold">{t("softwareCertificates.tableHeaders.certificateNumber")}</Label>
                  <p className="text-sm">{viewingCert.guvohnoma_nomeri}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label className="font-semibold">{t("softwareCertificates.certificateType")}</Label>
                <p className="text-sm">
                  <Badge variant="outline">{viewingCert.guvohnoma_turi}</Badge>
                </p>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">{t("softwareCertificates.authors")}</Label>
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
              {viewingCert.fayl_url && typeof viewingCert.fayl_url === 'string' && viewingCert.fayl_url.trim() !== "" && (
                <div className="space-y-2">
                  <Label className="font-semibold">{t("methodicalWorks.workFile")}</Label>
                  <div className="flex items-center gap-2">
                    <a
                      href={viewingCert.fayl_url}
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
            <AlertDialogTitle>{t("softwareCertificates.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("softwareCertificates.deleteDescription")}
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

