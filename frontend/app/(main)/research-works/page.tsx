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
import { Edit, Search, Plus, Trash2, Eye, Loader2, X, FileText } from "lucide-react"
import { getCurrentUserSync, canEditRecord } from "@/lib/auth"
import { worksAPI, usersAPI } from "@/lib/api"
import { mapBackendResearchWorkToFrontend, mapFrontendResearchWorkToBackend } from "@/lib/api-mappers"
import { toast } from "sonner"
import Link from "next/link"
import type { ResearchWork, ResearchWorkType, Language, User } from "@/lib/types"

export default function ResearchWorksPage() {
  const currentUser = getCurrentUserSync()
  const [searchQuery, setSearchQuery] = useState("")
  const [yearFilter, setYearFilter] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [languageFilter, setLanguageFilter] = useState<string>("")
  const [editingWork, setEditingWork] = useState<ResearchWork | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewingWork, setViewingWork] = useState<ResearchWork | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<ResearchWork>>({})
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
                Admin foydalanuvchilar ilmiy ishlar sahifasiga kirishlari mumkin emas.
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
  const [works, setWorks] = useState<ResearchWork[]>([])
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
        const [worksData, usersData] = await Promise.all([
          worksAPI.research.list().catch(() => ({ results: [] })),
          usersAPI.list().catch(() => []),
        ])

        const worksList = ((worksData as any).results || worksData || []).map(mapBackendResearchWorkToFrontend)
        setWorks(worksList)
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

  const filteredWorks = useMemo(() => {
    let filtered = works
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (work) =>
          work.ilmiy_ish_nomi.toLowerCase().includes(query) ||
          work.anjuman_yoki_jurnal_nomi.toLowerCase().includes(query),
      )
    }
    if (yearFilter) filtered = filtered.filter((work) => work.yili === yearFilter)
    if (typeFilter) filtered = filtered.filter((work) => work.ilmiy_ish_turi === typeFilter)
    if (languageFilter) filtered = filtered.filter((work) => work.tili === languageFilter)
    return filtered
  }, [works, searchQuery, yearFilter, typeFilter, languageFilter])

  const handleCreate = () => {
    setEditingWork(null)
    const currentYear = new Date().getFullYear()
    const academicYear = `${currentYear}-${currentYear + 1}`
    setFormData({
      mualliflar: currentUser ? [currentUser.id] : [],
      ilmiy_ish_nomi: "",
      anjuman_yoki_jurnal_nomi: "",
      yili: academicYear,
      tili: "O'zbek",
      ilmiy_ish_turi: "Mahalliy maqola",
      link: "",
    })
    setFileData({
      file: null,
      existingFileUrl: null,
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (work: ResearchWork) => {
    setEditingWork(work)
    setFormData(work)
    setFileData({
      file: null,
      existingFileUrl: work.ilmiy_ish_fayli || null,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.ilmiy_ish_nomi || !formData.anjuman_yoki_jurnal_nomi) {
      toast.error("Ilmiy ish nomi va Anjuman/Jurnal nomi majburiy maydonlar")
      return
    }
    if (formData.yili && !/^\d{4}-\d{4}$/.test(formData.yili)) {
      toast.error("Yil '2024-2025' formatida bo'lishi kerak")
      return
    }
    if (formData.yili) {
      const firstYear = parseInt(formData.yili.split("-")[0])
      const secondYear = parseInt(formData.yili.split("-")[1])
      if (isNaN(firstYear) || isNaN(secondYear) || secondYear !== firstYear + 1) {
        toast.error("Yil '2024-2025' formatida bo'lishi kerak (masalan: 2024-2025)")
        return
      }
      if (firstYear < 2000 || firstYear > 2035) {
        toast.error("Yil 2000-2035 oralig'ida bo'lishi kerak")
        return
      }
    }
    if (formData.link && !formData.link.startsWith("http")) {
      toast.error("Link http:// yoki https:// bilan boshlanishi kerak")
      return
    }

    try {
      const backendData = mapFrontendResearchWorkToBackend(formData)
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

      if (editingWork) {
        await worksAPI.research.update(editingWork.id, formDataToSend)
        toast.success("Ilmiy ish yangilandi")
      } else {
        await worksAPI.research.create(formDataToSend)
        toast.success("Ilmiy ish yaratildi")
      }
      
      // Refresh data
      const worksData = await worksAPI.research.list() as any
      const worksList = (worksData.results || worksData || []).map(mapBackendResearchWorkToFrontend)
      setWorks(worksList)
      
      setIsDialogOpen(false)
      setEditingWork(null)
      setFormData({})
    } catch (error: any) {
      toast.error("Xatolik: " + (error.message || "Noma'lum xatolik"))
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await worksAPI.research.delete(id)
      toast.success("Ilmiy ish o'chirildi")
      
      // Refresh data
      const worksData = await worksAPI.research.list() as any
      const worksList = (worksData.results || worksData || []).map(mapBackendResearchWorkToFrontend)
      setWorks(worksList)
      
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
          <BreadcrumbItem>Ilmiy ishlar</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ilmiy ishlar</h1>
          <p className="text-muted-foreground">Ilmiy ishlar ro'yxati</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Yangi ilmiy ish
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
                  {Array.from(new Set(works.map((w) => w.yili))).map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ish turi</Label>
              <Select value={typeFilter || "all"} onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Barcha turlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha turlar</SelectItem>
                  <SelectItem value="Mahalliy maqola">Mahalliy maqola</SelectItem>
                  <SelectItem value="Xorijiy maqola">Xorijiy maqola</SelectItem>
                  <SelectItem value="Mahalliy tezis">Mahalliy tezis</SelectItem>
                  <SelectItem value="Xorijiy tezis">Xorijiy tezis</SelectItem>
                  <SelectItem value="Mahalliy monografiya">Mahalliy monografiya</SelectItem>
                  <SelectItem value="Xorijiy monografiya">Xorijiy monografiya</SelectItem>
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
          <CardDescription>{filteredWorks.length} ta ilmiy ish topildi</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredWorks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Hali yozuv yo'q — Yaratish tugmasini bosing
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Ilmiy ish nomi</TableHead>
                  <TableHead>Anjuman/Jurnal</TableHead>
                  <TableHead>Yili</TableHead>
                  <TableHead>Mualliflar</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Til</TableHead>
                  <TableHead>Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorks.map((work) => {
                  const canEdit = canEditRecord(work, currentUser)
                  return (
                    <TableRow key={work.id}>
                      <TableCell>{work.id}</TableCell>
                      <TableCell className="font-medium">{work.ilmiy_ish_nomi}</TableCell>
                      <TableCell>{work.anjuman_yoki_jurnal_nomi}</TableCell>
                      <TableCell>{work.yili}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {getAuthorNames(work.mualliflar)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{work.ilmiy_ish_turi}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{work.tili}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setViewingWork(work)
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
                                onClick={() => handleEdit(work)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteId(work.id)}
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
              {editingWork ? "Ilmiy ishni tahrirlash" : "Yangi ilmiy ish"}
            </DialogTitle>
            <DialogDescription>
              {editingWork ? "Ilmiy ish ma'lumotlarini yangilang" : "Yangi ilmiy ish qo'shing"}
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
              <Label htmlFor="ilmiy_ish_nomi">
                Ilmiy ish nomi <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ilmiy_ish_nomi"
                value={formData.ilmiy_ish_nomi || ""}
                onChange={(e) =>
                  setFormData({ ...formData, ilmiy_ish_nomi: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anjuman_yoki_jurnal_nomi">
                Anjuman yoki jurnal nomi <span className="text-red-500">*</span>
              </Label>
              <Input
                id="anjuman_yoki_jurnal_nomi"
                value={formData.anjuman_yoki_jurnal_nomi || ""}
                onChange={(e) =>
                  setFormData({ ...formData, anjuman_yoki_jurnal_nomi: e.target.value })
                }
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
              <Label htmlFor="ilmiy_ish_turi">Ilmiy ish turi</Label>
              <Select
                value={formData.ilmiy_ish_turi}
                onValueChange={(value) =>
                  setFormData({ ...formData, ilmiy_ish_turi: value as ResearchWorkType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mahalliy maqola">Mahalliy maqola</SelectItem>
                  <SelectItem value="Xorijiy maqola">Xorijiy maqola</SelectItem>
                  <SelectItem value="Mahalliy tezis">Mahalliy tezis</SelectItem>
                  <SelectItem value="Xorijiy tezis">Xorijiy tezis</SelectItem>
                  <SelectItem value="Mahalliy monografiya">Mahalliy monografiya</SelectItem>
                  <SelectItem value="Xorijiy monografiya">Xorijiy monografiya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ilmiy_ish_fayli">Ilmiy ish fayli</Label>
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
                id="ilmiy_ish_fayli"
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
              <Label htmlFor="link">Link (DOI/Journal - ixtiyoriy)</Label>
              <Input
                id="link"
                value={formData.link || ""}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://doi.org/..."
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

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ilmiy ish ma'lumotlari</DialogTitle>
            <DialogDescription>To'liq ma'lumotlar</DialogDescription>
          </DialogHeader>
          {viewingWork && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">ID</Label>
                  <p className="text-sm">{viewingWork.id}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Yili</Label>
                  <p className="text-sm">{viewingWork.yili}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Ilmiy ish nomi</Label>
                <p className="text-sm">{viewingWork.ilmiy_ish_nomi}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Anjuman/Jurnal nomi</Label>
                <p className="text-sm">{viewingWork.anjuman_yoki_jurnal_nomi}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Ilmiy ish turi</Label>
                  <p className="text-sm">
                    <Badge variant="outline">{viewingWork.ilmiy_ish_turi}</Badge>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Til</Label>
                  <p className="text-sm">
                    <Badge variant="secondary">{viewingWork.tili}</Badge>
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Mualliflar</Label>
                <p className="text-sm">
                  {getAuthorNames(viewingWork.mualliflar) || "Mualliflar ko'rsatilmagan"}
                </p>
              </div>
              {viewingWork.link && (
                <div className="space-y-2">
                  <Label className="font-semibold">Havola (DOI/Journal link)</Label>
                  <p className="text-sm">
                    <a 
                      href={viewingWork.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {viewingWork.link}
                    </a>
                  </p>
                </div>
              )}
              {viewingWork.ilmiy_ish_fayli && typeof viewingWork.ilmiy_ish_fayli === 'string' && viewingWork.ilmiy_ish_fayli.trim() !== "" && (
                <div className="space-y-2">
                  <Label className="font-semibold">Ilmiy ish fayli</Label>
                  <div className="flex items-center gap-2">
                    <a 
                      href={viewingWork.ilmiy_ish_fayli} 
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
                    {viewingWork.created_at ? new Date(viewingWork.created_at).toLocaleString('uz-UZ') : "-"}
                  </p>
                </div>
                {viewingWork.department && (
                  <div className="space-y-2">
                    <Label className="font-semibold">Kafedra</Label>
                    <p className="text-sm">{viewingWork.department.name}</p>
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

