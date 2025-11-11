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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb"
import { Edit, Search, Plus, Trash2, Copy, Check, Loader2 } from "lucide-react"
import { getCurrentUserSync } from "@/lib/auth"
import { usersAPI, departmentsAPI, positionsAPI } from "@/lib/api"
import { mapBackendUserToFrontend } from "@/lib/api-mappers"
import { toast } from "sonner"
import Link from "next/link"
import type { User, Position, Role } from "@/lib/types"
import { POSITIONS, ROLES } from "@/lib/types"
import { useRouter } from "next/navigation"

export default function UsersPage() {
  const router = useRouter()
  const currentUser = getCurrentUserSync()
  const [searchQuery, setSearchQuery] = useState("")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [formData, setFormData] = useState<Partial<User>>({})
  const [copiedCredentials, setCopiedCredentials] = useState<number | null>(null)

  // Only Admin can access
  if (currentUser?.roli !== "Admin") {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            Only administrators can access this page.
          </p>
        </div>
      </div>
    )
  }

  // Data states
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([])
  const [positions, setPositions] = useState<Array<{ id: number; name: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const isFetchingRef = useRef(false)

  // Fetch data from API - only once on mount
  useEffect(() => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      return
    }
    
    isFetchingRef.current = true
    
    const fetchData = async () => {
      setIsLoading(true)
      try {
        console.log("Fetching users data...")
        const [usersData, deptsData, posData] = await Promise.all([
          usersAPI.list().catch((err) => {
            console.error("Users API error:", err)
            // Don't show toast for authentication errors (will redirect)
            if (err.message && !err.message.includes("Authentication failed") && !err.message.includes("token")) {
              toast.error("Foydalanuvchilarni yuklashda xatolik: " + (err.message || "Noma'lum xatolik"))
            }
            return []
          }),
          departmentsAPI.list().catch((err) => {
            console.error("Departments API error:", err)
            return []
          }),
          positionsAPI.list().catch((err) => {
            console.error("Positions API error:", err)
            // Don't show toast for authentication errors (will redirect)
            if (err.message && !err.message.includes("Authentication failed") && !err.message.includes("token")) {
              toast.error("Lavozimlarni yuklashda xatolik: " + (err.message || "Noma'lum xatolik"))
            }
            return []
          }),
        ])

        console.log("Users data received:", usersData)
        console.log("Users data type:", typeof usersData)
        console.log("Is array?", Array.isArray(usersData))
        console.log("Positions data received:", posData)
        console.log("Positions data type:", typeof posData)
        console.log("Is positions array?", Array.isArray(posData))
        console.log("Positions length:", Array.isArray(posData) ? posData.length : "N/A")
        
        // Backend returns paginated response: { count, next, previous, results: [...] }
        // Or direct array (for backward compatibility)
        const usersArray = Array.isArray(usersData) 
          ? usersData 
          : ((usersData as any)?.results || [])
        console.log("Processing", usersArray.length, "users")
        
        const usersList = usersArray.map((u: any, index: number) => {
          console.log(`Processing user ${index}:`, u)
          try {
            // Backend returns: { id, username, first_name, last_name, email, profile: { role, department, position, ... } }
            // We need to flatten it for mapBackendUserToFrontend
            const backendUserData = {
              id: u.id,
              username: u.username || u.profile?.username || "",
              first_name: u.first_name || u.profile?.first_name || "",
              last_name: u.last_name || u.profile?.last_name || "",
              email: u.email || u.profile?.email || "",
              role: (u.profile?.role || "TEACHER") as "ADMIN" | "HOD" | "TEACHER",
              department: u.profile?.department || null,
              position: u.profile?.position || null,
              phone: u.profile?.phone || "",
              birth_date: u.profile?.birth_date || "",
              scopus: u.profile?.scopus || "",
              scholar: u.profile?.scholar || "",
              research_id: u.profile?.research_id || "",
              user_id: u.profile?.user_id || u.profile?.user_id_str || "",
            }
            console.log(`Backend user data for ${index}:`, backendUserData)
            const mapped = mapBackendUserToFrontend(backendUserData)
            console.log(`Mapped user ${index}:`, mapped)
            return mapped
          } catch (err) {
            console.error(`Error mapping user ${index}:`, err, u)
            return null
          }
        }).filter((u: any) => u !== null) as User[]
        
        console.log("Final mapped users list:", usersList)
        console.log("Final users count:", usersList.length)
        setUsers(usersList)
        setDepartments(Array.isArray(deptsData) ? deptsData : [])
        
        // Handle positions - check if it's paginated or direct array
        const positionsArray = Array.isArray(posData) 
          ? posData 
          : ((posData as any)?.results || [])
        console.log("Setting positions:", positionsArray)
        console.log("Positions count:", positionsArray.length)
        
        // Ensure positions have the correct structure
        const formattedPositions = positionsArray.map((pos: any) => {
          if (typeof pos === 'string') {
            // If position is just a string, create an object
            return { id: 0, name: pos }
          }
          return {
            id: pos.id || pos.pk || 0,
            name: pos.name || pos.title || pos
          }
        })
        setPositions(formattedPositions)
      } catch (error: any) {
        console.error("Fetch data error:", error)
        toast.error("Ma'lumotlarni yuklashda xatolik: " + (error.message || "Noma'lum xatolik"))
      } finally {
        setIsLoading(false)
        isFetchingRef.current = false
      }
    }

    fetchData()
    
    // Cleanup function to reset ref if component unmounts
    return () => {
      isFetchingRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users
    const query = searchQuery.toLowerCase()
    return users.filter(
      (user) =>
        user.ism.toLowerCase().includes(query) ||
        user.familiya.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.user_id.toLowerCase().includes(query),
    )
  }, [users, searchQuery])

  const handleCreate = () => {
    setEditingUser(null)
    setFormData({
      ism: "",
      familiya: "",
      otasining_ismi: "",
      tugilgan_yili: new Date().getFullYear().toString(),
      lavozimi: undefined, // Will be set when Teacher role is selected
      telefon_raqami: "+998",
      roli: "Teacher",
      roli_internal: "O'qituvchi",
      user_id: "",
      username: "",
      password: "",
      kafedra_id: departments.length > 0 ? departments[0].id : undefined,
      department: departments.length > 0 ? departments[0].name : "",
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (user: User) => {
    console.log("Editing user:", user)
    console.log("User role:", user.roli)
    setEditingUser(user)
    setFormData(user)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.ism || !formData.familiya) {
      toast.error("First name and Last name are required")
      return
    }
    if (!formData.username) {
      toast.error("Username is required")
      return
    }
    if (!editingUser && !formData.password) {
      toast.error("Password is required for new users")
      return
    }
    if (formData.telefon_raqami && !/^\+998\d{9}$/.test(formData.telefon_raqami)) {
      toast.error("Phone must be in format +998xxxxxxxxx")
      return
    }

    try {
      // Map frontend role to backend role
      let backendRole: "ADMIN" | "HOD" | "TEACHER" = "TEACHER"
      if (formData.roli === "Admin") {
        backendRole = "ADMIN"
      } else if (formData.roli === "Head of Department") {
        backendRole = "HOD"
      } else {
        backendRole = "TEACHER"
      }
      
      console.log("Updating user role:", {
        frontendRole: formData.roli,
        backendRole: backendRole,
        username: formData.username
      })
      
      const userData: any = {
        username: formData.username,
        first_name: formData.ism,
        last_name: formData.familiya,
        email: "",
        role: backendRole,
        department: formData.kafedra_id || null,
        position: (() => {
          // If Admin or Head of Department, position should be null
          if (backendRole === "ADMIN" || backendRole === "HOD") {
            console.log("Admin or HOD role selected, setting position to null")
            return null
          }
          // Only set position for Teacher role
          if (!formData.lavozimi) {
            return null
          }
          // Find position by name in positions array (case-insensitive)
          const foundPosition = positions.find((p: { id: number; name: string }) => {
            const pName = (p.name || "").trim().toLowerCase()
            const formName = (formData.lavozimi || "").trim().toLowerCase()
            return pName === formName
          })
          if (foundPosition) {
            console.log("Found position:", foundPosition.name, "ID:", foundPosition.id, "for:", formData.lavozimi)
            return foundPosition.id
          }
          // If not found, log warning but don't fail - let backend handle it
          console.warn("Position not found in API positions:", formData.lavozimi)
          console.log("Available positions from API:", positions.map((p: any) => p.name))
          // Return null to let backend handle missing position
          return null
        })(),
        phone: formData.telefon_raqami || "",
        birth_date: formData.tugilgan_yili ? `${formData.tugilgan_yili}-01-01` : null,
        scopus: formData.scopus_link || "",
        scholar: formData.google_scholar_link || "",
        research_id: formData.research_id_link || "",
        user_id: formData.user_id || "",
      }

      if (formData.password) {
        userData.password = formData.password
      }

      if (editingUser) {
        await usersAPI.update(editingUser.id, userData)
        toast.success("User updated successfully")
      } else {
        await usersAPI.create(userData)
        toast.success("User created successfully")
        setCopiedCredentials(-1) // New user ID
      }
      
      // Refresh data
      const usersData = await usersAPI.list()
      const usersArray = Array.isArray(usersData) 
        ? usersData 
        : ((usersData as any)?.results || [])
      const usersList = usersArray.map((u: any) => {
        const backendUserData = {
          id: u.id,
          username: u.username || u.profile?.username || "",
          first_name: u.first_name || u.profile?.first_name || "",
          last_name: u.last_name || u.profile?.last_name || "",
          email: u.email || u.profile?.email || "",
          role: (u.profile?.role || "TEACHER") as "ADMIN" | "HOD" | "TEACHER",
          department: u.profile?.department || null,
          position: u.profile?.position || null,
          phone: u.profile?.phone || "",
          birth_date: u.profile?.birth_date || "",
          scopus: u.profile?.scopus || "",
          scholar: u.profile?.scholar || "",
          research_id: u.profile?.research_id || "",
          user_id: u.profile?.user_id || u.profile?.user_id_str || "",
        }
        return mapBackendUserToFrontend(backendUserData)
      })
      setUsers(usersList)
      
      setIsDialogOpen(false)
      setEditingUser(null)
      setFormData({})
    } catch (error: any) {
      toast.error("Xatolik: " + (error.message || "Noma'lum xatolik"))
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await usersAPI.delete(id)
      toast.success("Foydalanuvchi muvaffaqiyatli o'chirildi")
      
      setUserToDelete(null)
      
      // Refresh data
      const usersData = await usersAPI.list()
      const usersArray = Array.isArray(usersData) 
        ? usersData 
        : ((usersData as any)?.results || [])
      const usersList = usersArray.map((u: any) => {
        const backendUserData = {
          id: u.id,
          username: u.username || u.profile?.username || "",
          first_name: u.first_name || u.profile?.first_name || "",
          last_name: u.last_name || u.profile?.last_name || "",
          email: u.email || u.profile?.email || "",
          role: (u.profile?.role || "TEACHER") as "ADMIN" | "HOD" | "TEACHER",
          department: u.profile?.department || null,
          position: u.profile?.position || null,
          phone: u.profile?.phone || "",
          birth_date: u.profile?.birth_date || "",
          scopus: u.profile?.scopus || "",
          scholar: u.profile?.scholar || "",
          research_id: u.profile?.research_id || "",
          user_id: u.profile?.user_id || u.profile?.user_id_str || "",
        }
        return mapBackendUserToFrontend(backendUserData)
      })
      setUsers(usersList)
      
      // Refresh the page to ensure all data is updated
      router.refresh()
    } catch (error: any) {
      toast.error("Xatolik: " + (error.message || "Noma'lum xatolik"))
    }
  }

  const handleCopyCredentials = (user: User) => {
    const text = `${user.username} / ${user.password}`
    navigator.clipboard.writeText(text)
    setCopiedCredentials(user.id)
    toast.success("Credentials copied to clipboard!")
    setTimeout(() => setCopiedCredentials(null), 2000)
  }

  const getRoleDisplay = (role: Role) => {
    return role
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
          <BreadcrumbItem>Users</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage system users</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search (name, username, user ID)..."
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
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {filteredUsers.length} user(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell className="font-medium">
                      {user.ism} {user.familiya}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{user.username}</span>
                        <button
                          onClick={() => handleCopyCredentials(user)}
                          className="p-1 hover:bg-accent rounded"
                        >
                          {copiedCredentials === user.id ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </TableCell>
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
                        {getRoleDisplay(user.roli)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.lavozimi && (
                        <Badge variant="outline">{user.lavozimi}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.department || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {user.id !== currentUser?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUserToDelete(user)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Create New User"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update user information"
                : "Create a new user account"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ism">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ism"
                  value={formData.ism || ""}
                  onChange={(e) => {
                    // Remove digits and allow only letters, spaces, and common name characters
                    const value = e.target.value.replace(/[0-9]/g, "")
                    setFormData({ ...formData, ism: value })
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="familiya">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="familiya"
                  value={formData.familiya || ""}
                  onChange={(e) => {
                    // Remove digits and allow only letters, spaces, and common name characters
                    const value = e.target.value.replace(/[0-9]/g, "")
                    setFormData({ ...formData, familiya: value })
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otasining_ismi">Patronymic</Label>
                <Input
                  id="otasining_ismi"
                  value={formData.otasining_ismi || ""}
                  onChange={(e) => {
                    // Remove digits and allow only letters, spaces, and common name characters
                    const value = e.target.value.replace(/[0-9]/g, "")
                    setFormData({ ...formData, otasining_ismi: value })
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tugilgan_yili">Birth Year (YYYY)</Label>
                <Input
                  id="tugilgan_yili"
                  value={formData.tugilgan_yili || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, tugilgan_yili: e.target.value })
                  }
                  placeholder="2024"
                />
              </div>
              <div></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roli">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.roli}
                  onValueChange={(value) => {
                    const role = value as Role
                    const roleMap: Record<Role, "Admin" | "Kafedra mudiri" | "O'qituvchi"> = {
                      Admin: "Admin",
                      "Head of Department": "Kafedra mudiri",
                      Teacher: "O'qituvchi",
                    }
                    setFormData({
                      ...formData,
                      roli: role,
                      roli_internal: roleMap[role],
                      // If Admin or Head of Department, clear position
                      lavozimi: (role === "Admin" || role === "Head of Department") ? undefined : formData.lavozimi,
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
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
              {/* Position - only show for Teacher role */}
              {formData.roli === "Teacher" && (
                <div className="space-y-2">
                  <Label htmlFor="lavozimi">Position</Label>
                  <Select
                    value={formData.lavozimi}
                    onValueChange={(value) =>
                      setFormData({ ...formData, lavozimi: value as Position })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoading ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Loading positions...
                        </div>
                      ) : positions.length > 0 ? (
                        positions
                          .filter((pos) => pos.name && pos.name !== "Kafedra mudiri")
                          .map((pos) => (
                            <SelectItem key={pos.id || pos.name} value={pos.name}>
                              {pos.name}
                            </SelectItem>
                          ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Lavozimlar mavjud emas
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefon_raqami">Phone (+998xxxxxxxxx)</Label>
                <Input
                  id="telefon_raqami"
                  value={formData.telefon_raqami || ""}
                  onChange={(e) => {
                    let value = e.target.value
                    
                    // Remove all non-digit characters except +
                    const digits = value.replace(/[^\d]/g, "")
                    
                    // Always start with +998
                    if (digits.length === 0) {
                      value = "+998"
                    } else {
                      // Take only first 9 digits after +998
                      const phoneDigits = digits.slice(0, 9)
                      value = "+998" + phoneDigits
                    }
                    
                    // Limit to 13 characters (+998 + 9 digits)
                    if (value.length > 13) {
                      value = value.slice(0, 13)
                    }
                    
                    setFormData({ ...formData, telefon_raqami: value })
                  }}
                  placeholder="+998901234567"
                  maxLength={13}
                />
              </div>
              <div></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user_id">User ID</Label>
                <Input
                  id="user_id"
                  value={formData.user_id || ""}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  value={formData.username || ""}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {!editingUser && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password || ""}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? "Leave empty to keep current password" : "Enter password"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.kafedra_id ? String(formData.kafedra_id) : ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, kafedra_id: Number(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scopus_link">Scopus Link</Label>
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
                <Label htmlFor="google_scholar_link">Google Scholar Link</Label>
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
                <Label htmlFor="research_id_link">Research ID Link</Label>
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
            {!editingUser && formData.username && formData.password && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Share Credentials</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {formData.username} / {formData.password}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const text = `${formData.username} / ${formData.password}`
                      navigator.clipboard.writeText(text)
                      toast.success("Credentials copied!")
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={userToDelete !== null} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Foydalanuvchini o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu amalni bekor qilib bo'lmaydi. Foydalanuvchi butunlay o'chiriladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {userToDelete && (
            <div className="space-y-2 py-4">
              <p className="font-medium text-sm">
                Quyidagi foydalanuvchi o'chirilmoqda:
              </p>
              <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
                <p><span className="font-semibold">ID:</span> {userToDelete.id}</p>
                <p><span className="font-semibold">Ism:</span> {userToDelete.ism || "-"} {userToDelete.familiya || ""}</p>
                <p><span className="font-semibold">Username:</span> {userToDelete.username}</p>
                {userToDelete.roli && (
                  <p><span className="font-semibold">Roli:</span> {userToDelete.roli}</p>
                )}
                {userToDelete.lavozimi && (
                  <p><span className="font-semibold">Lavozimi:</span> {userToDelete.lavozimi}</p>
                )}
                {userToDelete.department && (
                  <p><span className="font-semibold">Kafedra:</span> {userToDelete.department}</p>
                )}
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => userToDelete && handleDelete(userToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

