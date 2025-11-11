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
import { getCurrentUserSync, canEditRecord } from "@/lib/auth"
import { worksAPI, usersAPI } from "@/lib/api"
import { mapBackendSoftwareCertificateToFrontend, mapFrontendSoftwareCertificateToBackend } from "@/lib/api-mappers"
import { toast } from "sonner"
import Link from "next/link"
import type { SoftwareCertificate, SoftwareCertificateType, User } from "@/lib/types"

export default function SoftwareCertificatesPage() {
  const currentUser = getCurrentUserSync()
  const [searchQuery, setSearchQuery] = useState("")
  const [yearFilter, setYearFilter] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [editingCert, setEditingCert] = useState<SoftwareCertificate | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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
              <CardTitle className="text-2xl">403: Kirish huquqi yo'q</CardTitle>
              <CardDescription className="text-base mt-2">
                Admin foydalanuvchilar dasturiy guvohnomalar sahifasiga kirishlari mumkin emas.
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
  const [certificates, setCertificates] = useState<SoftwareCertificate[]>([])
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
          worksAPI.softwareCertificates.list().catch(() => ({ results: [] })),
          usersAPI.list().catch(() => []),
        ])

        const certsList = (certsData.results || certsData || []).map(mapBackendSoftwareCertificateToFrontend)
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
    if (yearFilter) {
      filtered = filtered.filter(
        (cert) => cert.tasdiqlangan_sana.split("-")[0] === yearFilter,
      )
    }
    if (typeFilter) {
      filtered = filtered.filter((cert) => cert.guvohnoma_turi === typeFilter)
    }
    return filtered
  }, [certificates, searchQuery, yearFilter, typeFilter])

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
      toast.error("Nomi majburiy maydon")
      return
    }
    if (formData.tasdiqlangan_sana && !/^\d{4}-\d{2}-\d{2}$/.test(formData.tasdiqlangan_sana)) {
      toast.error("Sana YYYY-MM-DD formatida bo'lishi kerak")
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
        toast.success("Dasturiy guvohnoma yangilandi")
      } else {
        await worksAPI.softwareCertificates.create(formDataToSend)
        toast.success("Dasturiy guvohnoma yaratildi")
      }
      
      // Refresh data
      const certsData = await worksAPI.softwareCertificates.list()
      const certsList = (certsData.results || certsData || []).map(mapBackendSoftwareCertificateToFrontend)
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
      await worksAPI.softwareCertificates.delete(id)
      toast.success("Dasturiy guvohnoma o'chirildi")
      
      // Refresh data
      const certsData = await worksAPI.softwareCertificates.list()
      const certsList = (certsData.results || certsData || []).map(mapBackendSoftwareCertificateToFrontend)
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
          <BreadcrumbItem>Dasturiy guvohnomalar</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dasturiy guvohnomalar</h1>
          <p className="text-muted-foreground">Dasturiy guvohnomalar ro'yxati</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Yangi dasturiy guvohnoma
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filterlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label>Guvohnoma turi</Label>
              <Select value={typeFilter || "all"} onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Barcha turlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha turlar</SelectItem>
                  <SelectItem value="DGU">DGU</SelectItem>
                  <SelectItem value="BGU">BGU</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ro'yxat</CardTitle>
          <CardDescription>
            {filteredCerts.length} ta dasturiy guvohnoma topildi
          </CardDescription>
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
                  <TableHead>Tasdiqlangan sana</TableHead>
                  <TableHead>Berilgan joy</TableHead>
                  <TableHead>Mualliflar</TableHead>
                  <TableHead>Guvohnoma nomeri</TableHead>
                  <TableHead>Turi</TableHead>
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
                      <TableCell>{cert.tasdiqlangan_sana}</TableCell>
                      <TableCell>{cert.berilgan_joy || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {getAuthorNames(cert.mualliflar)}
                      </TableCell>
                      <TableCell>{cert.guvohnoma_nomeri || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{cert.guvohnoma_turi}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
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
              {editingCert ? "Dasturiy guvohnomani tahrirlash" : "Yangi dasturiy guvohnoma"}
            </DialogTitle>
            <DialogDescription>
              {editingCert
                ? "Dasturiy guvohnoma ma'lumotlarini yangilang"
                : "Yangi dasturiy guvohnoma qo'shing"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
                <Label htmlFor="tasdiqlangan_sana">Tasdiqlangan sana (YYYY-MM-DD)</Label>
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
                <Label htmlFor="berilgan_joy">Berilgan joy</Label>
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
                <Label htmlFor="guvohnoma_nomeri">Guvohnoma nomeri</Label>
                <Input
                  id="guvohnoma_nomeri"
                  value={formData.guvohnoma_nomeri || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, guvohnoma_nomeri: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guvohnoma_turi">Guvohnoma turi</Label>
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
                    <SelectItem value="DGU">DGU</SelectItem>
                    <SelectItem value="BGU">BGU</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fayl_url">Fayl URL (ixtiyoriy)</Label>
              <Input
                id="fayl_url"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    toast.success(`Fayl: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
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
              Bekor qilish
            </Button>
            <Button onClick={handleSave}>Saqlash</Button>
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

