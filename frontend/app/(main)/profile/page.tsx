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
import { Edit, Search, Plus, Loader2 } from "lucide-react"
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
      const userData: any = {
        username: formData.username || currentUser.username,
        first_name: formData.ism || "",
        last_name: formData.familiya || "",
        email: "",
        role: formData.roli === "Admin" ? "ADMIN" : formData.roli === "Head of Department" ? "HOD" : "TEACHER",
        department: formData.kafedra_id || currentUser.kafedra_id || null,
        position: positions.find(p => p.name === formData.lavozimi)?.id || null,
        phone: formData.telefon_raqami || "",
        birth_date: formData.tugilgan_yili ? `${formData.tugilgan_yili}-01-01` : null,
        scopus: formData.scopus_link || "",
        scholar: formData.google_scholar_link || "",
        research_id: formData.research_id_link || "",
        user_id: formData.user_id || "",
      }

      await usersAPI.update(currentUser.id, userData)
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
          <p className="text-muted-foreground">Foydalanuvchilar ro'yxati</p>
        </div>
        {currentUser?.roli === "Admin" && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Yangi foydalanuvchi
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Qidiruv (ism, familiya, user_id)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Foydalanuvchilar</CardTitle>
          <CardDescription>
            {filteredUsers.length} ta foydalanuvchi topildi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Foydalanuvchilar topilmadi
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Ism</TableHead>
                  <TableHead>Familiya</TableHead>
                  <TableHead>Otasining ismi</TableHead>
                  <TableHead>Tug'ilgan yili</TableHead>
                  <TableHead>Lavozimi</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Roli</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell className="font-medium">{user.ism}</TableCell>
                    <TableCell>{user.familiya}</TableCell>
                    <TableCell>{user.otasining_ismi}</TableCell>
                    <TableCell>{user.tugilgan_yili}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.lavozimi}</Badge>
                    </TableCell>
                    <TableCell>{user.telefon_raqami}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.roli === "Admin"
                            ? "destructive"
                            : user.roli === "Head of Department"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {user.roli}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.user_id}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
                <Label htmlFor="tugilgan_yili">Tug'ilgan yili (YYYY)</Label>
                <Input
                  id="tugilgan_yili"
                  value={formData.tugilgan_yili || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, tugilgan_yili: e.target.value })
                  }
                  placeholder="2024"
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

