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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb"
import { Search, Loader2, Eye } from "lucide-react"
import { getCurrentUserSync, filterRecordsByRole } from "@/lib/auth"
import { usersAPI } from "@/lib/api"
import { mapBackendUserToFrontend } from "@/lib/api-mappers"
import { toast } from "sonner"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n"
import type { User, Employment, Role } from "@/lib/types"

export default function TeachersPage() {
  const { t, language } = useTranslation()
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUserSync())
  const [searchQuery, setSearchQuery] = useState("")
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>("")
  const [isActiveFilter, setIsActiveFilter] = useState<string>("")
  const [positionFilter, setPositionFilter] = useState<string>("")

  // Only HOD can access this page
  if (currentUser?.roli !== "Head of Department") {
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
                {t("errors.onlyHodTeachers")}
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
  const [teachers, setTeachers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [roleChanged, setRoleChanged] = useState(0)
  const hasFetchedRef = useRef(false)

  // Listen for role changes and update current user
  useEffect(() => {
    const handleRoleChange = () => {
      setCurrentUser(getCurrentUserSync())
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
        const usersData = await usersAPI.list().catch((err) => {
          console.warn("Users API error:", err)
          return []
        })

        // Map users data using mapBackendUserToFrontend to preserve all language variants
        // Filter out admin and djangoadmin users
        const rawUsers = (usersData as any)?.results || usersData || []
        const allUsers: User[] = Array.isArray(rawUsers) ? rawUsers
          .filter((u: any) => {
            const username = (u.username || u.profile?.username || "").toLowerCase()
            const role = (u.profile?.role || "TEACHER").toUpperCase()
            // Exclude admin users and djangoadmin
            return username !== "admin" && username !== "djangoadmin" && role !== "ADMIN"
          })
          .map((u: any) => {
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
              names: profile?.names || [],
              full_name: profile?.full_name,
              full_name_uzc: profile?.full_name_uzc,
              full_name_ru: profile?.full_name_ru,
              full_name_en: profile?.full_name_en,
              employments: profile?.employments || [],
            }
            return mapBackendUserToFrontend(backendUserData)
          }) : []

        // Filter: only teachers from the same department as HOD
        const departmentTeachers = allUsers.filter((user) => {
          // Only show teachers (not HOD or Admin)
          if (user.roli !== "Teacher") return false
          // Only show teachers from the same department
          if (user.kafedra_id !== currentUser.kafedra_id) return false
          return true
        })

        setTeachers(departmentTeachers)
      } catch (error: any) {
        console.error("Error loading data:", error)
        toast.error(t("errors.loadDataError") + ": " + (error.message || t("errors.unknownError")))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentUser, roleChanged, t])

  // Get author name in current language
  const getAuthorDisplayName = useMemo(() => {
    return (user: User): string => {
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
      
      if (displayName && displayName.trim()) {
        return displayName
      }
      
      if (user.full_name && user.full_name.trim()) {
        return user.full_name
      }
      
      if (user.full_name_uzc && user.full_name_uzc.trim()) {
        return user.full_name_uzc
      }
      if (user.full_name_ru && user.full_name_ru.trim()) {
        return user.full_name_ru
      }
      if (user.full_name_en && user.full_name_en.trim()) {
        return user.full_name_en
      }
      
      return `${user.ism} ${user.familiya}`.trim() || user.username
    }
  }, [language])

  // Get employment type display name
  const getEmploymentTypeDisplay = (type: string): string => {
    switch (type) {
      case "MAIN":
        return t("teachers.employmentTypes.main")
      case "INTERNAL":
        return t("teachers.employmentTypes.internal")
      case "EXTERNAL":
        return t("teachers.employmentTypes.external")
      default:
        return type
    }
  }

  // Get unique values for filters
  const uniquePositions = useMemo(() => {
    const positions = new Set<string>()
    teachers.forEach((teacher) => {
      teacher.employments?.forEach((emp) => {
        if (emp.position?.name) {
          positions.add(emp.position.name)
        }
      })
    })
    return Array.from(positions).sort()
  }, [teachers])

  // Filter teachers
  const filteredTeachers = useMemo(() => {
    let filtered = teachers

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((teacher) => {
        const displayName = getAuthorDisplayName(teacher).toLowerCase()
        return displayName.includes(query) || 
               teacher.username.toLowerCase().includes(query) ||
               teacher.user_id.toLowerCase().includes(query)
      })
    }

    // Employment type filter
    if (employmentTypeFilter) {
      filtered = filtered.filter((teacher) => {
        return teacher.employments?.some((emp) => emp.employment_type === employmentTypeFilter)
      })
    }

    // Is active filter
    if (isActiveFilter) {
      const isActive = isActiveFilter === "true"
      filtered = filtered.filter((teacher) => {
        return teacher.employments?.some((emp) => emp.is_active === isActive)
      })
    }

    // Position filter
    if (positionFilter) {
      filtered = filtered.filter((teacher) => {
        return teacher.employments?.some((emp) => emp.position?.name === positionFilter)
      })
    }

    return filtered
  }, [teachers, searchQuery, employmentTypeFilter, isActiveFilter, positionFilter, getAuthorDisplayName])

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">{t("dashboard.title")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>{t("menu.teachers")}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("menu.teachers")}</h1>
          <p className="text-muted-foreground">{t("teachers.subtitle")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("teachers.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{t("teachers.search")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("teachers.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("teachers.employmentType")}</Label>
              <Select value={employmentTypeFilter || "all"} onValueChange={(value) => setEmploymentTypeFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.allTypes")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
                  <SelectItem value="MAIN">{t("teachers.employmentTypes.main")}</SelectItem>
                  <SelectItem value="INTERNAL">{t("teachers.employmentTypes.internal")}</SelectItem>
                  <SelectItem value="EXTERNAL">{t("teachers.employmentTypes.external")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("teachers.isActive")}</Label>
              <Select value={isActiveFilter || "all"} onValueChange={(value) => setIsActiveFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.all")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.all")}</SelectItem>
                  <SelectItem value="true">{t("teachers.active")}</SelectItem>
                  <SelectItem value="false">{t("teachers.inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("teachers.position")}</Label>
              <Select value={positionFilter || "all"} onValueChange={(value) => setPositionFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.all")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.all")}</SelectItem>
                  {uniquePositions.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("teachers.list")}</CardTitle>
          <CardDescription>
            {filteredTeachers.length} {t("teachers.found")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("teachers.noRecords")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("teachers.tableHeaders.name")}</TableHead>
                    <TableHead>{t("teachers.tableHeaders.userId")}</TableHead>
                    <TableHead>{t("teachers.tableHeaders.employments")}</TableHead>
                    <TableHead>{t("teachers.tableHeaders.position")}</TableHead>
                    <TableHead>{t("teachers.tableHeaders.rate")}</TableHead>
                    <TableHead>{t("teachers.tableHeaders.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher) => (
                    <TableRow 
                      key={teacher.id}
                      className="hover:bg-blue-600 hover:text-white cursor-pointer transition-colors [&_*]:hover:text-white [&_*]:hover:border-white/20"
                    >
                      <TableCell className="font-medium hover:text-white">
                        {getAuthorDisplayName(teacher)}
                      </TableCell>
                      <TableCell className="hover:text-white">{teacher.user_id || "-"}</TableCell>
                      <TableCell className="hover:text-white">
                        {teacher.employments && teacher.employments.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {teacher.employments.map((emp) => (
                              <Badge 
                                key={emp.id} 
                                variant="outline" 
                                className="hover:border-white/20 hover:text-white w-fit"
                              >
                                {getEmploymentTypeDisplay(emp.employment_type)}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hover:text-white">
                        {teacher.employments && teacher.employments.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {teacher.employments.map((emp) => (
                              <span key={emp.id} className="text-sm">
                                {emp.position?.name || "-"}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hover:text-white">
                        {teacher.employments && teacher.employments.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {teacher.employments.map((emp) => (
                              <span key={emp.id} className="text-sm">
                                {emp.rate}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hover:text-white">
                        {teacher.employments && teacher.employments.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {teacher.employments.map((emp) => (
                              <Badge 
                                key={emp.id} 
                                variant={emp.is_active ? "default" : "secondary"}
                                className="hover:bg-white/20 hover:text-white w-fit"
                              >
                                {emp.is_active ? t("teachers.active") : t("teachers.inactive")}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

