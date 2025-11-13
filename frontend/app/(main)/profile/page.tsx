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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Edit, 
  Search, 
  Plus, 
  Loader2, 
  User as UserIcon, 
  Phone, 
  Mail, 
  Calendar, 
  Briefcase, 
  Building2, 
  ExternalLink,
  Award,
  GraduationCap
} from "lucide-react"
import { getCurrentUserSync, getCurrentUser } from "@/lib/auth"
import { authAPI, usersAPI, departmentsAPI, positionsAPI } from "@/lib/api"
import { mapBackendUserToFrontend } from "@/lib/api-mappers"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { User, Position, Role } from "@/lib/types"
import { POSITIONS, ROLES } from "@/lib/types"

export default function ProfilePage() {
  const router = useRouter()
  const currentUserSync = getCurrentUserSync()
  const [currentUser, setCurrentUser] = useState<User | null>(currentUserSync)
  
  // Admin cannot access profile page - redirect to dashboard
  useEffect(() => {
    if (currentUserSync?.roli === "Admin") {
      router.push("/dashboard")
    }
  }, [currentUserSync, router])
  
  if (currentUserSync?.roli === "Admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  const [searchQuery, setSearchQuery] = useState("")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<User>>({})
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([])
  const [positions, setPositions] = useState<Array<{ id: number; name: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const hasFetchedRef = useRef(false)

  // Fetch current user data and related data
  useEffect(() => {
    if (hasFetchedRef.current) return
    if (!currentUserSync) return
    
    hasFetchedRef.current = true
    
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [userData, deptsData, posData] = await Promise.all([
          getCurrentUser(),
          departmentsAPI.list().catch(() => []),
          positionsAPI.list().catch(() => []),
        ])

        if (userData) {
          setCurrentUser(userData)
        }
        setDepartments(Array.isArray(deptsData) ? deptsData : [])
        setPositions(Array.isArray(posData) ? posData : [])
      } catch (error: any) {
        toast.error("Ma'lumotlarni yuklashda xatolik: " + (error.message || "Noma'lum xatolik"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentUserSync])

  // Filter users by role (for viewing other users in department)
  const visibleUsers = useMemo(() => {
    if (!currentUser) return []
    // For now, only show current user's profile
    return [currentUser]
  }, [currentUser])

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return visibleUsers
    const query = searchQuery.toLowerCase()
    return visibleUsers.filter(
      (user) =>
        user.ism.toLowerCase().includes(query) ||
        user.familiya.toLowerCase().includes(query) ||
        user.user_id.toLowerCase().includes(query),
    )
  }, [visibleUsers, searchQuery])

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData(user)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingUser || !currentUser) return

    // Validate required fields
    if (!formData.ism || !formData.familiya) {
      toast.error("Ism va Familiya majburiy maydonlar")
      return
    }

    // Validate phone format
    if (formData.telefon_raqami && !/^\+998\d{9}$/.test(formData.telefon_raqami)) {
      toast.error("Telefon raqami +998xxxxxxxxx formatida bo'lishi kerak")
      return
    }

    // Validate URLs
    const urlFields = ["scopus_link", "google_scholar_link", "research_id_link"]
    for (const field of urlFields) {
      const value = formData[field as keyof User] as string | undefined
      if (value && !value.startsWith("http://") && !value.startsWith("https://")) {
        toast.error(`${field} to'g'ri URL formatida bo'lishi kerak (http:// yoki https://)`)
        return
      }
    }

    try {
      const profileData = {
        first_name: formData.ism || "",
        last_name: formData.familiya || "",
        phone: formData.telefon_raqami || "",
        birth_date: formData.tugilgan_sana || (formData.tugilgan_yili ? `${formData.tugilgan_yili}-01-01` : null),
        scopus: formData.scopus_link || "",
        scholar: formData.google_scholar_link || "",
        research_id: formData.research_id_link || "",
        user_id: formData.user_id || "",
      }

      await authAPI.updateProfile(profileData)
      toast.success("Profil muvaffaqiyatli yangilandi")
      
      // Refresh user data
      const userDataNew = await getCurrentUser()
      if (userDataNew) {
        setCurrentUser(userDataNew)
      }
      
      setIsDialogOpen(false)
      setEditingUser(null)
      setFormData({})
    } catch (error: any) {
      toast.error("Xatolik: " + (error.message || "Noma'lum xatolik"))
    }
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
          <BreadcrumbItem>Profil</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profil</h1>
          <p className="text-muted-foreground">Shaxsiy ma'lumotlaringiz va profil sozlamalari</p>
        </div>
        {currentUser && (
          <Button onClick={() => handleEdit(currentUser)}>
            <Edit className="w-4 h-4 mr-2" />
            Profilni tahrirlash
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : currentUser ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Header Card */}
          <Card className="lg:col-span-3">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {currentUser.ism?.[0]?.toUpperCase() || ""}
                    {currentUser.familiya?.[0]?.toUpperCase() || ""}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-bold">
                      {currentUser.ism} {currentUser.familiya}
                      {currentUser.otasining_ismi && ` ${currentUser.otasining_ismi}`}
                    </h2>
                    <Badge
                      variant={
                        currentUser.roli === "Admin"
                          ? "destructive"
                          : currentUser.roli === "Head of Department"
                            ? "default"
                            : "secondary"
                      }
                      className="text-sm"
                    >
                      {currentUser.roli}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {currentUser.user_id && (
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        <span>ID: {currentUser.user_id}</span>
                      </div>
                    )}
                    {currentUser.lavozimi && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        <span>{currentUser.lavozimi}</span>
                      </div>
                    )}
                    {currentUser.department && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>{currentUser.department}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Shaxsiy ma'lumotlar
              </CardTitle>
              <CardDescription>Asosiy profil ma'lumotlari</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Ism</Label>
                  <p className="font-medium">{currentUser.ism || "—"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Familiya</Label>
                  <p className="font-medium">{currentUser.familiya || "—"}</p>
                </div>
                {currentUser.otasining_ismi && (
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Otasining ismi</Label>
                    <p className="font-medium">{currentUser.otasining_ismi}</p>
                  </div>
                )}
                {(currentUser.tugilgan_sana || currentUser.tugilgan_yili) && (
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Tug'ilgan sanasi
                    </Label>
                    <p className="font-medium">
                      {currentUser.tugilgan_sana 
                        ? new Date(currentUser.tugilgan_sana).toLocaleDateString("uz-UZ", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })
                        : currentUser.tugilgan_yili
                      }
                    </p>
                  </div>
                )}
                {currentUser.telefon_raqami && (
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Telefon raqami
                    </Label>
                    <p className="font-medium">{currentUser.telefon_raqami}</p>
                  </div>
                )}
                {currentUser.username && (
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Username
                    </Label>
                    <p className="font-medium">{currentUser.username}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Kasbiy ma'lumotlar
              </CardTitle>
              <CardDescription>Ish va lavozim ma'lumotlari</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {currentUser.lavozimi && (
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Lavozimi</Label>
                    <p className="font-medium">{currentUser.lavozimi}</p>
                  </div>
                )}
                {currentUser.department && (
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Kafedra</Label>
                    <p className="font-medium">{currentUser.department}</p>
                  </div>
                )}
                {currentUser.roli && (
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Roli</Label>
                    <Badge
                      variant={
                        currentUser.roli === "Admin"
                          ? "destructive"
                          : currentUser.roli === "Head of Department"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {currentUser.roli}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Research Links */}
          {(currentUser.scopus_link || currentUser.google_scholar_link || currentUser.research_id_link) && (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Ilmiy faoliyat
                </CardTitle>
                <CardDescription>Scopus, Google Scholar va boshqa ilmiy profillar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentUser.scopus_link && (
                    <a
                      href={currentUser.scopus_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <Award className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Scopus</p>
                        <p className="text-xs text-muted-foreground truncate">Profil linki</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  )}
                  {currentUser.google_scholar_link && (
                    <a
                      href={currentUser.google_scholar_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <GraduationCap className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Google Scholar</p>
                        <p className="text-xs text-muted-foreground truncate">Profil linki</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  )}
                  {currentUser.research_id_link && (
                    <a
                      href={currentUser.research_id_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <Award className="w-5 h-5 text-purple-600" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Research ID</p>
                        <p className="text-xs text-muted-foreground truncate">Profil linki</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <UserIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Profil ma'lumotlari topilmadi</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profilni tahrirlash</DialogTitle>
            <DialogDescription>
              Foydalanuvchi ma'lumotlarini yangilang
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id">ID</Label>
                <Input id="id" value={formData.id || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ism">
                  Ism <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ism"
                  value={formData.ism || ""}
                  onChange={(e) => setFormData({ ...formData, ism: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="familiya">
                  Familiya <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="familiya"
                  value={formData.familiya || ""}
                  onChange={(e) => setFormData({ ...formData, familiya: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otasining_ismi">Otasining ismi</Label>
                <Input
                  id="otasining_ismi"
                  value={formData.otasining_ismi || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, otasining_ismi: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tugilgan_sana">Tug'ilgan sanasi</Label>
                <Input
                  id="tugilgan_sana"
                  type="date"
                  value={formData.tugilgan_sana || formData.tugilgan_yili ? 
                    (formData.tugilgan_sana || `${formData.tugilgan_yili}-01-01`) : ""
                  }
                  onChange={(e) => {
                    const dateValue = e.target.value
                    const yearOnly = dateValue ? dateValue.split("-")[0] : ""
                    setFormData({ 
                      ...formData, 
                      tugilgan_sana: dateValue,
                      tugilgan_yili: yearOnly
                    })
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lavozimi">Lavozimi</Label>
                <Select
                  value={formData.lavozimi}
                  onValueChange={(value) =>
                    setFormData({ ...formData, lavozimi: value as Position })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Lavozimni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefon_raqami">Telefon raqami (+998xxxxxxxxx)</Label>
              <Input
                id="telefon_raqami"
                value={formData.telefon_raqami || ""}
                onChange={(e) =>
                  setFormData({ ...formData, telefon_raqami: e.target.value })
                }
                placeholder="+998901234567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roli">Roli</Label>
              <Select
                value={formData.roli}
                onValueChange={(value) =>
                  setFormData({ ...formData, roli: value as Role })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rolni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user_id">User ID</Label>
              <Input
                id="user_id"
                value={formData.user_id || ""}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scopus_link">Scopus link</Label>
              <Input
                id="scopus_link"
                value={formData.scopus_link || ""}
                onChange={(e) =>
                  setFormData({ ...formData, scopus_link: e.target.value })
                }
                placeholder="https://www.scopus.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="google_scholar_link">Google Scholar link</Label>
              <Input
                id="google_scholar_link"
                value={formData.google_scholar_link || ""}
                onChange={(e) =>
                  setFormData({ ...formData, google_scholar_link: e.target.value })
                }
                placeholder="https://scholar.google.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="research_id_link">Research ID link</Label>
              <Input
                id="research_id_link"
                value={formData.research_id_link || ""}
                onChange={(e) =>
                  setFormData({ ...formData, research_id_link: e.target.value })
                }
                placeholder="https://www.researchgate.net/..."
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
    </div>
  )
}

