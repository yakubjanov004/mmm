"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BookOpen, GraduationCap, Award, FileCode, Search, Filter, Users, BarChart3, Settings, Loader2 } from "lucide-react"
import { getCurrentUserSync, filterRecordsByRole } from "@/lib/auth"
import { worksAPI, usersAPI } from "@/lib/api"
import {
  mapBackendMethodicalWorkToFrontend,
  mapBackendResearchWorkToFrontend,
  mapBackendCertificateToFrontend,
  mapBackendSoftwareCertificateToFrontend,
  mapBackendUserToFrontend,
} from "@/lib/api-mappers"
import type { MethodicalWork, ResearchWork, Certificate, SoftwareCertificate } from "@/lib/types"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import Link from "next/link"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"

export default function DashboardPage() {
  const { t } = useTranslation()
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUserSync())
  const [yearFilter, setYearFilter] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [languageFilter, setLanguageFilter] = useState<string>("")

  // Data states
  const [methodicalWorks, setMethodicalWorks] = useState<MethodicalWork[]>([])
  const [researchWorks, setResearchWorks] = useState<ResearchWork[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [softwareCertificates, setSoftwareCertificates] = useState<SoftwareCertificate[]>([])
  const [users, setUsers] = useState<any[]>([])
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
        // Fetch all data in parallel
        const [methodicalData, researchData, certificatesData, softwareData, usersData] = await Promise.all([
          worksAPI.methodical.list().catch(() => ({ results: [] })),
          worksAPI.research.list().catch(() => ({ results: [] })),
          worksAPI.certificates.list().catch(() => ({ results: [] })),
          worksAPI.softwareCertificates.list().catch(() => ({ results: [] })),
          // Load users for all roles to display author names
          usersAPI.list().catch(() => []),
        ])

        // Map backend data to frontend format
        const methodicalList = ((methodicalData as any).results || methodicalData || []).map(mapBackendMethodicalWorkToFrontend)
        const researchList = ((researchData as any).results || researchData || []).map(mapBackendResearchWorkToFrontend)
        const certificatesList = ((certificatesData as any).results || certificatesData || []).map(mapBackendCertificateToFrontend)
        const softwareList = ((softwareData as any).results || softwareData || []).map(mapBackendSoftwareCertificateToFrontend)

        // Filter by role
        setMethodicalWorks(filterRecordsByRole(methodicalList, currentUser))
        setResearchWorks(filterRecordsByRole(researchList, currentUser))
        setCertificates(filterRecordsByRole(certificatesList, currentUser))
        setSoftwareCertificates(filterRecordsByRole(softwareList, currentUser))

        // Map users data properly - filter out admin and djangoadmin users
        const usersArray = Array.isArray(usersData)
          ? usersData
          : ((usersData as any)?.results || usersData || [])
        const mappedUsers = usersArray
          .filter((u: any) => {
            const username = (u.username || u.profile?.username || "").toLowerCase()
            const role = (u.profile?.role || "TEACHER").toUpperCase()
            // Exclude admin users and djangoadmin
            return username !== "admin" && username !== "djangoadmin" && role !== "ADMIN"
          })
          .map((u: any) => {
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
        setUsers(mappedUsers)
      } catch (error: any) {
        toast.error(t("dashboard.loadError") + ": " + (error.message || t("common.error")))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentUser, roleChanged, t])

  // Get all recent items
  const recentItems = useMemo(() => {
    const allItems = [
      ...methodicalWorks.map((item) => ({
        id: item.id,
        type: t("dashboard.methodicalWork"),
        title: item.nomi,
        year: item.yili,
        createdAt: item.created_at,
        link: "/methodical-works",
      })),
      ...researchWorks.map((item) => ({
        id: item.id,
        type: t("dashboard.researchWork"),
        title: item.ilmiy_ish_nomi,
        year: item.yili,
        createdAt: item.created_at,
        link: "/research-works",
      })),
      ...certificates.map((item) => ({
        id: item.id,
        type: t("dashboard.certificate"),
        title: item.nomi,
        year: item.yili,
        createdAt: item.created_at,
        link: "/certificates",
      })),
      ...softwareCertificates.map((item) => ({
        id: item.id,
        type: t("dashboard.softwareCertificate"),
        title: item.nomi,
        year: item.tasdiqlangan_sana.split("-")[0],
        createdAt: item.created_at,
        link: "/software-certificates",
      })),
    ]

    return allItems
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [methodicalWorks, researchWorks, certificates, softwareCertificates])

  const filteredRecentItems = useMemo(() => {
    let filtered = recentItems

    if (yearFilter) {
      filtered = filtered.filter((item) => item.year === yearFilter)
    }
    if (typeFilter) {
      filtered = filtered.filter((item) => item.type === typeFilter)
    }

    return filtered
  }, [recentItems, yearFilter, typeFilter])

  const getTypeBadgeVariant = (type: string) => {
    if (type === t("dashboard.methodicalWork")) return "default"
    if (type === t("dashboard.researchWork")) return "secondary"
    if (type === t("dashboard.certificate")) return "outline"
    if (type === t("dashboard.softwareCertificate")) return "destructive"
    return "default"
  }

  // Admin dashboard shows system stats, not work-related stats
  if (currentUser?.roli === "Admin") {
    const totalUsersCount = users.length
    const activeUsers = users.filter((u: any) => u.roli !== "Admin").length

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )
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
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>

        {/* Admin Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t("dashboard.totalUsers")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalUsersCount}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.allRegistered")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t("dashboard.activeUsers")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{activeUsers >= 0 ? activeUsers : 0}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.teachersAndHeads")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                {t("dashboard.systemStatus")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{t("dashboard.statusActive")}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.allSystemsRunning")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.quickActions")}</CardTitle>
            <CardDescription>{t("dashboard.quickActionsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild className="w-full">
                <Link href="/users">
                  <Users className="w-4 h-4 mr-2" />
                  {t("dashboard.manageUsers")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/statistics">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {t("dashboard.statistics")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  {t("dashboard.settings")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
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
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">
          {currentUser?.roli === "Head of Department"
            ? t("dashboard.departmentStats")
            : t("dashboard.yourWorksOverview")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {t("dashboard.methodicalWorks")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{methodicalWorks.length}</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.totalRecords")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              {t("dashboard.researchWorks")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{researchWorks.length}</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.totalRecords")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="w-4 h-4" />
              {t("dashboard.certificates")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{certificates.length}</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.totalRecords")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              {t("dashboard.softwareCertificates")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{softwareCertificates.length}</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.totalRecords")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("dashboard.recentItems")}</CardTitle>
              <CardDescription>{t("dashboard.last5Records")}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={yearFilter || "all"} onValueChange={(value) => setYearFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder={t("dashboard.year")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("dashboard.allYears")}</SelectItem>
                  {Array.from(new Set(recentItems.map((item) => item.year))).map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter || "all"} onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t("dashboard.type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("dashboard.allTypes")}</SelectItem>
                  <SelectItem value={t("dashboard.methodicalWork")}>{t("dashboard.methodicalWork")}</SelectItem>
                  <SelectItem value={t("dashboard.researchWork")}>{t("dashboard.researchWork")}</SelectItem>
                  <SelectItem value={t("dashboard.certificate")}>{t("dashboard.certificate")}</SelectItem>
                  <SelectItem value={t("dashboard.softwareCertificate")}>{t("dashboard.softwareCertificate")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecentItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("dashboard.noRecordsYet")}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRecentItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={getTypeBadgeVariant(item.type)}>{item.type}</Badge>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.year} {t("dashboard.yearLabel")}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={item.link}>{t("dashboard.view")}</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

