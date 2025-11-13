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
import { getCurrentUserSync, canEditRecord } from "@/lib/auth"
import { worksAPI, usersAPI } from "@/lib/api"
import { mapBackendCertificateToFrontend, mapFrontendCertificateToBackend } from "@/lib/api-mappers"
import { toast } from "sonner"
import Link from "next/link"
import type { Certificate, CertificateType, Language, User } from "@/lib/types"

export default function CertificatesPage() {
  const currentUser = getCurrentUserSync()
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
              <CardTitle className="text-2xl">403: Kirish huquqi yo'q</CardTitle>
              <CardDescription className="text-base mt-2">
                Admin foydalanuvchilar sertifikatlar sahifasiga kirishlari mumkin emas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/dashboard">Dashboardga qaytish</Link>
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
  const hasFetchedRef = useRef(false)

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
          usersAPI.list().catch(() => []),
        ])

        const certsList = ((certsData as any)?.results || certsData || []).map(mapBackendCertificateToFrontend)
        setCertificates(certsList)
        setUsers(Array.isArray(usersData) ? usersData.map((u: any) => ({
          id: u.id,
          ism: u.profile?.first_name || "",
          familiya: u.profile?.last_name || "",
          otasining_ismi: "",
          tugilgan_yili: "",
          lavozimi: u.profile?.position || undefined,
          telefon_raqami: u.profile?.phone || "",
          roli: u.profile?.role === "ADMIN" ? "Admin" : u.profile?.role === "HOD" ? "Head of Department" : "Teacher",
          roli_internal: u.profile?.role || "TEACHER",
          user_id: u.profile?.user_id || "",
          username: u.username || "",
          password: "",
          kafedra_id: u.profile?.department?.id,
          department: u.profile?.department?.name,
        })) : [])
      } catch (error: any) {
        toast.error("Ma'lumotlarni yuklashda xatolik: " + (error.message || "Noma'lum xatolik"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentUser])

  const filteredCerts = useMemo(() => {
    let filtered = certificates
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((cert) => cert.nomi.toLowerCase().includes(query))
    }
    if (yearFilter) filtered = filtered.filter((cert) => cert.yili === yearFilter)
    if (typeFilter) filtered = filtered.filter((cert) => cert.sertifikat_turi === typeFilter)
    if (languageFilter) filtered = filtered.filter((cert) => cert.tili === languageFilter)
    return filtered
  }, [certificates, searchQuery, yearFilter, typeFilter, languageFilter])

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
      toast.error("Nomi majburiy maydon")
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
        toast.success("Sertifikat yangilandi")
      } else {
        await worksAPI.certificates.create(formDataToSend)
        toast.success("Sertifikat yaratildi")
      }
      
      // Refresh data
      const certsData = await worksAPI.certificates.list()
      const certsList = ((certsData as any)?.results || certsData || []).map(mapBackendCertificateToFrontend)
      setCertificates(certsList)
      
      setIsDialogOpen(false)
      setEditingCert(null)
      setFormData({})
    } catch (error: any) {
      toast.error("Xatolik: " + (error.message || "Noma'lum xatolik"))
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await worksAPI.certificates.delete(id)
      toast.success("Sertifikat o'chirildi")
      
      // Refresh data
      const certsData = await worksAPI.certificates.list()
      const certsList = ((certsData as any)?.results || certsData || []).map(mapBackendCertificateToFrontend)
      setCertificates(certsList)
      
      setDeleteId(null)
    } catch (error: any) {
      toast.error("Xatolik: " + (error.message || "Noma'lum xatolik"))
    }
  }

  const getAuthorNames = (authorIds: number[]) => {
    return authorIds
      .map((id) => {
        const user = users.find((u) => u.id === id)
        return user ? `${user.ism} ${user.familiya}` : ""
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
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>Sertifikatlar</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sertifikatlar</h1>
          <p className="text-muted-foreground">Sertifikatlar ro'yxati</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Yangi sertifikat
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filterlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Qidiruv</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nomi bo'yicha qidirish..."
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
                  <SelectValue placeholder="Barcha yillar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha yillar</SelectItem>
                  {Array.from(new Set(certificates.map((c) => c.yili))).map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sertifikat turi</Label>
              <Select value={typeFilter || "all"} onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Barcha turlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha turlar</SelectItem>
                  <SelectItem value="Mahalliy">Mahalliy</SelectItem>
                  <SelectItem value="Xalqaro">Xalqaro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Til</Label>
              <Select value={languageFilter || "all"} onValueChange={(value) => setLanguageFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Barcha tillar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha tillar</SelectItem>
                  <SelectItem value="O'zbek">O'zbek</SelectItem>
                  <SelectItem value="Rus">Rus</SelectItem>
                  <SelectItem value="Ingliz">Ingliz</SelectItem>
                  <SelectItem value="Boshqa">Boshqa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ro'yxat</CardTitle>
          <CardDescription>{filteredCerts.length} ta sertifikat topildi</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Hali yozuv yo'q — Yaratish tugmasini bosing
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nomi</TableHead>
                  <TableHead>Yili</TableHead>
                  <TableHead>Nashriyot</TableHead>
                  <TableHead>Mualliflar</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Til</TableHead>
                  <TableHead>Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCerts.map((cert) => {
                  const canEdit = canEditRecord(cert, currentUser)
                  return (
                    <TableRow key={cert.id}>
                      <TableCell>{cert.id}</TableCell>
                      <TableCell className="font-medium">{cert.nomi}</TableCell>
                      <TableCell>{cert.yili}</TableCell>
                      <TableCell>{cert.nashriyot_nomi || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {getAuthorNames(cert.mualliflar)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{cert.sertifikat_turi}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{cert.tili}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
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
                                onClick={() => handleEdit(cert)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteId(cert.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
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
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCert ? "Sertifikatni tahrirlash" : "Yangi sertifikat"}
            </DialogTitle>
            <DialogDescription>
              {editingCert ? "Sertifikat ma'lumotlarini yangilang" : "Yangi sertifikat qo'shing"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nomi">
                Nomi <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nomi"
                value={formData.nomi || ""}
                onChange={(e) => setFormData({ ...formData, nomi: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yili">O'quv yili</Label>
                <Select
                  value={formData.yili || ""}
                  onValueChange={(value) => setFormData({ ...formData, yili: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="O'quv yilini tanlang" />
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
                <Label htmlFor="nashriyot_nomi">Nashriyot nomi</Label>
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
              <Label htmlFor="mualliflar">Mualliflar</Label>
              <MultiSelect
                options={users.map((user) => ({
                  value: String(user.id),
                  label: `${user.ism} ${user.familiya}`,
                }))}
                selected={formData.mualliflar?.map(String) || []}
                onChange={(selected) =>
                  setFormData({
                    ...formData,
                    mualliflar: selected.map(Number),
                  })
                }
                placeholder="Mualliflarni tanlang"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sertifikat_turi">Sertifikat turi</Label>
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
                    <SelectItem value="Mahalliy">Mahalliy</SelectItem>
                    <SelectItem value="Xalqaro">Xalqaro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tili">Til</Label>
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
                    <SelectItem value="O'zbek">O'zbek</SelectItem>
                    <SelectItem value="Rus">Rus</SelectItem>
                    <SelectItem value="Ingliz">Ingliz</SelectItem>
                    <SelectItem value="Boshqa">Boshqa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sertifikat_fayli">Sertifikat fayli</Label>
              {fileData.existingFileUrl && !fileData.file && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md mb-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm flex-1">Mavjud fayl yuklangan</span>
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
                    toast.success(`Fayl tanlandi: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
                    setFileData({ ...fileData, file, existingFileUrl: null })
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Tavsif (ixtiyoriy)</Label>
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
              Bekor qilish
            </Button>
            <Button onClick={handleSave}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sertifikat ma'lumotlari</DialogTitle>
            <DialogDescription>To'liq ma'lumotlar</DialogDescription>
          </DialogHeader>
          {viewingCert && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">ID</Label>
                  <p className="text-sm">{viewingCert.id}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Yili</Label>
                  <p className="text-sm">{viewingCert.yili}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Nomi</Label>
                <p className="text-sm">{viewingCert.nomi}</p>
              </div>
              {viewingCert.nashriyot_nomi && (
                <div className="space-y-2">
                  <Label className="font-semibold">Nashriyot nomi</Label>
                  <p className="text-sm">{viewingCert.nashriyot_nomi}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Sertifikat turi</Label>
                  <p className="text-sm">
                    <Badge variant="outline">{viewingCert.sertifikat_turi}</Badge>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Til</Label>
                  <p className="text-sm">
                    <Badge variant="secondary">{viewingCert.tili}</Badge>
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Mualliflar</Label>
                <p className="text-sm">
                  {getAuthorNames(viewingCert.mualliflar) || "Mualliflar ko'rsatilmagan"}
                </p>
              </div>
              {viewingCert.desc && (
                <div className="space-y-2">
                  <Label className="font-semibold">Tavsif</Label>
                  <p className="text-sm whitespace-pre-wrap">{viewingCert.desc}</p>
                </div>
              )}
              {viewingCert.sertifikat_fayli && typeof viewingCert.sertifikat_fayli === 'string' && viewingCert.sertifikat_fayli.trim() !== "" && (
                <div className="space-y-2">
                  <Label className="font-semibold">Sertifikat fayli</Label>
                  <div className="flex items-center gap-2">
                    <a 
                      href={viewingCert.sertifikat_fayli} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Faylni ko'rish
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
            <AlertDialogTitle>O'chirishni tasdiqlaysizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

