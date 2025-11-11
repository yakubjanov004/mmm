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
import { getCurrentUserSync } from "@/lib/auth"
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

export default function DashboardPage() {
  const currentUser = getCurrentUserSync()
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
  const hasFetchedRef = useRef(false)

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
          currentUser.roli === "Admin" ? usersAPI.list().catch(() => []) : Promise.resolve([]),
        ])

        // Map backend data to frontend format
        setMethodicalWorks(
          ((methodicalData as any).results || methodicalData || []).map(mapBackendMethodicalWorkToFrontend)
        )
        setResearchWorks(
          ((researchData as any).results || researchData || []).map(mapBackendResearchWorkToFrontend)
        )
        setCertificates(
          ((certificatesData as any).results || certificatesData || []).map(mapBackendCertificateToFrontend)
        )
        setSoftwareCertificates(
          ((softwareData as any).results || softwareData || []).map(mapBackendSoftwareCertificateToFrontend)
        )
        
        // Map users data properly
        const usersArray = Array.isArray(usersData) 
          ? usersData 
          : ((usersData as any)?.results || [])
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

  // Get all recent items
  const recentItems = useMemo(() => {
    const allItems = [
      ...methodicalWorks.map((item) => ({
        id: item.id,
        type: "Uslubiy ish",
        title: item.nomi,
        year: item.yili,
        createdAt: item.created_at,
        link: "/methodical-works",
      })),
      ...researchWorks.map((item) => ({
        id: item.id,
        type: "Ilmiy ish",
        title: item.ilmiy_ish_nomi,
        year: item.yili,
        createdAt: item.created_at,
        link: "/research-works",
      })),
      ...certificates.map((item) => ({
        id: item.id,
        type: "Sertifikat",
        title: item.nomi,
        year: item.yili,
        createdAt: item.created_at,
        link: "/certificates",
      })),
      ...softwareCertificates.map((item) => ({
        id: item.id,
        type: "Dasturiy guvohnoma",
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
    switch (type) {
      case "Uslubiy ish":
        return "default"
      case "Ilmiy ish":
        return "secondary"
      case "Sertifikat":
        return "outline"
      case "Dasturiy guvohnoma":
        return "destructive"
      default:
        return "default"
    }
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
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Tizim umumiy holati va nazorat</p>
        </div>

        {/* Admin Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Jami foydalanuvchilar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalUsersCount}</p>
              <p className="text-xs text-muted-foreground">Barcha ro'yxatdan o'tganlar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Faol foydalanuvchilar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{activeUsers >= 0 ? activeUsers : 0}</p>
              <p className="text-xs text-muted-foreground">O'qituvchilar va mudirlar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Tizim holati
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">Faol</p>
              <p className="text-xs text-muted-foreground">Barcha tizimlar ishlamoqda</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Tezkor amallar</CardTitle>
            <CardDescription>Tizim boshqaruvi uchun tezkor kirishlar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild className="w-full">
                <Link href="/users">
                  <Users className="w-4 h-4 mr-2" />
                  Foydalanuvchilarni boshqarish
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/statistics">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Statistika
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Sozlamalar
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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {currentUser?.roli === "Head of Department"
            ? "Kafedra statistikasi va faoliyat"
            : "Sizning ishlaringizning umumiy holati"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Uslubiy ishlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{methodicalWorks.length}</p>
            <p className="text-xs text-muted-foreground">Jami yozuvlar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Ilmiy ishlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{researchWorks.length}</p>
            <p className="text-xs text-muted-foreground">Jami yozuvlar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="w-4 h-4" />
              Sertifikatlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{certificates.length}</p>
            <p className="text-xs text-muted-foreground">Jami yozuvlar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              Dasturiy guvohnomalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{softwareCertificates.length}</p>
            <p className="text-xs text-muted-foreground">Jami yozuvlar</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>So'ngi qo'shilganlar</CardTitle>
              <CardDescription>Oxirgi 5 ta yozuv</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={yearFilter || "all"} onValueChange={(value) => setYearFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Yil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha yillar</SelectItem>
                  {Array.from(new Set(recentItems.map((item) => item.year))).map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter || "all"} onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha turlar</SelectItem>
                  <SelectItem value="Uslubiy ish">Uslubiy ish</SelectItem>
                  <SelectItem value="Ilmiy ish">Ilmiy ish</SelectItem>
                  <SelectItem value="Sertifikat">Sertifikat</SelectItem>
                  <SelectItem value="Dasturiy guvohnoma">Dasturiy guvohnoma</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecentItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Hali yozuv yo'q
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
                      <p className="text-sm text-muted-foreground">{item.year} yil</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={item.link}>Ko'rish</Link>
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

