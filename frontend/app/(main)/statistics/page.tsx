"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, GraduationCap, Award, FileCode, FolderOpen, BarChart3, Users, Loader2 } from "lucide-react"
import { getCurrentUserSync } from "@/lib/auth"
import { worksAPI, usersAPI, filesAPI, statsAPI } from "@/lib/api"
import {
  mapBackendMethodicalWorkToFrontend,
  mapBackendResearchWorkToFrontend,
  mapBackendCertificateToFrontend,
  mapBackendSoftwareCertificateToFrontend,
  mapBackendUserToFrontend,
} from "@/lib/api-mappers"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export default function StatisticsPage() {
  const { t } = useTranslation()
  const currentUser = getCurrentUserSync()
  const [yearFilter, setYearFilter] = useState<string>("all")

  // Only Admin and Head of Department can access statistics
  if (!currentUser || (currentUser.roli !== "Admin" && currentUser.roli !== "Head of Department")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-destructive/10 p-4 rounded-full">
                  <BarChart3 className="w-12 h-12 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl">{t("errors.403")}</CardTitle>
              <CardDescription className="text-base mt-2">
                {t("errors.onlyAdminAndHodStatistics")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/dashboard">{t("errors.returnToDashboard")}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Data states
  const [methodicalWorks, setMethodicalWorks] = useState<any[]>([])
  const [researchWorks, setResearchWorks] = useState<any[]>([])
  const [certificates, setCertificates] = useState<any[]>([])
  const [softwareCertificates, setSoftwareCertificates] = useState<any[]>([])
  const [files, setFiles] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
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
        const [methodicalData, researchData, certsData, softData, filesData, usersData] = await Promise.all([
          worksAPI.methodical.list().catch(() => ({ results: [] })),
          worksAPI.research.list().catch(() => ({ results: [] })),
          worksAPI.certificates.list().catch(() => ({ results: [] })),
          worksAPI.softwareCertificates.list().catch(() => ({ results: [] })),
          filesAPI.list().catch(() => ({ results: [] })),
          currentUser.roli === "Admin" ? usersAPI.list().catch(() => []) : Promise.resolve([]),
        ])

        setMethodicalWorks(((methodicalData as any).results || methodicalData || []).map(mapBackendMethodicalWorkToFrontend))
        setResearchWorks(((researchData as any).results || researchData || []).map(mapBackendResearchWorkToFrontend))
        setCertificates(((certsData as any).results || certsData || []).map(mapBackendCertificateToFrontend))
        setSoftwareCertificates(((softData as any).results || softData || []).map(mapBackendSoftwareCertificateToFrontend))
        setFiles((filesData as any).results || filesData || [])

        // Map users data properly
        const usersArray = Array.isArray(usersData)
          ? usersData
          : ((usersData as any)?.results || usersData || [])
        const mappedUsers = usersArray.map((u: any) => {
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
        toast.error("Ma'lumotlarni yuklashda xatolik: " + (error.message || "Noma'lum xatolik"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentUser])

  // All hooks must be called before any conditional returns
  // Filter by year
  const filteredMethodical = useMemo(() => {
    if (yearFilter === "all") return methodicalWorks
    return methodicalWorks.filter((w) => w.yili === yearFilter)
  }, [methodicalWorks, yearFilter])

  const filteredResearch = useMemo(() => {
    if (yearFilter === "all") return researchWorks
    return researchWorks.filter((w) => w.yili === yearFilter)
  }, [researchWorks, yearFilter])

  // Year trend data
  const yearTrendData = useMemo(() => {
    const years = Array.from(
      new Set([
        ...methodicalWorks.map((w) => w.yili),
        ...researchWorks.map((w) => w.yili),
      ]),
    ).sort()

    return years.map((year) => ({
      year,
      Methodical: methodicalWorks.filter((w) => w.yili === year).length,
      Research: researchWorks.filter((w) => w.yili === year).length,
      Certificates: certificates.filter((c) => c.yili === year).length,
    }))
  }, [methodicalWorks, researchWorks, certificates])

  // Language distribution
  const languageData = useMemo(() => {
    const all = [
      ...methodicalWorks.map((w) => w.tili),
      ...researchWorks.map((w) => w.tili),
      ...certificates.map((c) => c.tili),
    ]
    const counts: Record<string, number> = {}
    all.forEach((lang) => {
      counts[lang] = (counts[lang] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [methodicalWorks, researchWorks, certificates])

  // Type distribution for methodical works
  const methodicalTypeData = useMemo(() => {
    const counts: Record<string, number> = {}
    methodicalWorks.forEach((w) => {
      counts[w.ish_turi] = (counts[w.ish_turi] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [methodicalWorks])

  // Admin sees system statistics, not work-related statistics
  if (currentUser?.roli === "Admin") {
    const totalUsers = users.length
    const activeUsers = users.filter((u: any) => u.roli !== "Admin").length
    const adminCount = users.filter((u: any) => u.roli === "Admin").length
    const hodCount = users.filter((u: any) => u.roli === "Head of Department").length
    const teacherCount = users.filter((u: any) => u.roli === "Teacher").length

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
            <BreadcrumbItem>{t("statistics.title")}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-3xl font-bold">{t("statistics.title")}</h1>
          <p className="text-muted-foreground">{t("statistics.subtitle")}</p>
        </div>

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t("statistics.totalUsers")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalUsers}</p>
              <p className="text-xs text-muted-foreground">{t("statistics.allRegistered")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t("statistics.activeUsers")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{activeUsers}</p>
              <p className="text-xs text-muted-foreground">{t("statistics.teachersAndHeads")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t("statistics.hod")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{hodCount}</p>
              <p className="text-xs text-muted-foreground">{t("statistics.totalHeads")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t("statistics.teachers")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{teacherCount}</p>
              <p className="text-xs text-muted-foreground">{t("statistics.totalTeachers")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Role Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t("statistics.usersByRole")}</CardTitle>
            <CardDescription>{t("statistics.roleDistribution")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: t("roles.admin"), value: adminCount },
                    { name: t("roles.hod"), value: hodCount },
                    { name: t("roles.teacher"), value: teacherCount },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: t("roles.admin"), value: adminCount },
                    { name: t("roles.hod"), value: hodCount },
                    { name: t("roles.teacher"), value: teacherCount },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Statistics data
  const totalStats = {
    methodical: methodicalWorks.length,
    research: researchWorks.length,
    certificates: certificates.length,
    software: softwareCertificates.length,
    files: files.length,
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
          <BreadcrumbItem>{t("statistics.title")}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("statistics.title")}</h1>
          <p className="text-muted-foreground">
            {(currentUser?.roli as string) === "Admin"
              ? t("statistics.subtitle")
              : t("statistics.departmentStats")}
          </p>
        </div>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t("filters.allYears")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allYears")}</SelectItem>
            {Array.from(
              new Set([
                ...methodicalWorks.map((w) => w.yili),
                ...researchWorks.map((w) => w.yili),
              ]),
            )
              .sort()
              .reverse()
              .map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Total Counts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {t("statistics.methodical")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalStats.methodical}</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.totalRecords")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              {t("statistics.research")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalStats.research}</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.totalRecords")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="w-4 h-4" />
              {t("statistics.certificates")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalStats.certificates}</p>
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
            <p className="text-2xl font-bold">{totalStats.software}</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.totalRecords")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              {t("menu.files")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalStats.files}</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.totalRecords")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Year Trend */}
        <Card>
          <CardHeader>
            <CardTitle>{t("statistics.yearTrend")}</CardTitle>
            <CardDescription>{t("statistics.yearTrendDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Methodical" fill="#0088FE" />
                <Bar dataKey="Research" fill="#00C49F" />
                <Bar dataKey="Certificates" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Language Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t("statistics.languageDistribution")}</CardTitle>
            <CardDescription>{t("statistics.languageDistributionDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={languageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {languageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Methodical Works by Type */}
      {methodicalTypeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("statistics.methodicalByType")}</CardTitle>
            <CardDescription>{t("statistics.methodicalByTypeDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {methodicalTypeData.map((item) => (
                <Badge key={item.name} variant="outline" className="text-sm py-1 px-3">
                  {item.name}: {item.value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

