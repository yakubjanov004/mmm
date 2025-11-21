"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
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
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb"
import { Search, Plus, Trash2, Download, Upload, FileIcon, FolderOpen, Loader2 } from "lucide-react"
import { getCurrentUserSync } from "@/lib/auth"
import { filesAPI, usersAPI } from "@/lib/api"
import { toast } from "sonner"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n"
import type { File, User } from "@/lib/types"

export default function FilesPage() {
  const { t } = useTranslation()
  const currentUser = getCurrentUserSync()
  const [searchQuery, setSearchQuery] = useState("")
  const [userFilter, setUserFilter] = useState<string>("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Admin cannot access files page
  if (currentUser?.roli === "Admin") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-destructive/10 p-4 rounded-full">
                  <FolderOpen className="w-12 h-12 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl">{t("errors.accessDenied")}</CardTitle>
              <CardDescription className="text-base mt-2">
                {t("errors.onlyTeacherAndHodFiles")}
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
  const [files, setFiles] = useState<File[]>([])
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
        const [filesData, usersData] = await Promise.all([
          filesAPI.list().catch(() => ({ results: [] })),
          currentUser?.roli === "Admin" ? usersAPI.list().catch(() => []) : Promise.resolve([]),
        ])

        // Map backend files to frontend format
        const filesList = ((filesData as any).results || filesData || []).map((f: any) => ({
          id: f.id,
          fayl_url: f.url || f.file || "",
          foydalanuvchi_id: f.owner?.id || f.owner?.user?.id || 0,
          fayl_nomi: f.file?.split("/").pop() || "",
          fayl_hajmi: f.size ? `${(f.size / (1024 * 1024)).toFixed(2)} MB` : "",
          created_at: f.created_at || "",
        }))

        // Filter by role
        let visibleFilesList = filesList
        if (currentUser.roli === "Head of Department") {
          const deptUserIds = (Array.isArray(usersData) ? usersData : [])
            .filter((u: any) => u.profile?.department?.id === currentUser.kafedra_id)
            .map((u: any) => u.id)
          visibleFilesList = filesList.filter((f: File) => deptUserIds.includes(f.foydalanuvchi_id))
        } else {
          // Teacher sees only own files
          visibleFilesList = filesList.filter((f: File) => f.foydalanuvchi_id === currentUser.id)
        }

        setFiles(visibleFilesList)
        // Filter out admin and djangoadmin users
        const rawUsers = (usersData as any)?.results || usersData || []
        setUsers(Array.isArray(rawUsers) ? rawUsers
          .filter((u: any) => {
            const username = (u.username || u.profile?.username || "").toLowerCase()
            const role = (u.profile?.role || "TEACHER").toUpperCase()
            // Exclude admin users and djangoadmin
            return username !== "admin" && username !== "djangoadmin" && role !== "ADMIN"
          })
          .map((u: any) => ({
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
        toast.error(t("errors.loadDataError") + ": " + (error.message || t("errors.unknownError")))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentUser])

  // Filter files by role
  const visibleFiles = useMemo(() => files, [files])

  const filteredFiles = useMemo(() => {
    let filtered = visibleFiles

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (file) =>
          file.fayl_nomi?.toLowerCase().includes(query) ||
          file.fayl_url.toLowerCase().includes(query),
      )
    }

    if (userFilter) {
      filtered = filtered.filter(
        (file) => file.foydalanuvchi_id === Number(userFilter),
      )
    }

    return filtered
  }, [visibleFiles, searchQuery, userFilter])

  const handleDelete = async (id: number) => {
    try {
      await filesAPI.delete(id)
      toast.success(t("files.deleted"))

      // Refresh data
      const filesData = await filesAPI.list()
      const filesList = ((filesData as any).results || filesData || []).map((f: any) => ({
        id: f.id,
        fayl_url: f.url || f.file || "",
        foydalanuvchi_id: f.owner?.id || f.owner?.user?.id || 0,
        fayl_nomi: f.file?.split("/").pop() || "",
        fayl_hajmi: f.size ? `${(f.size / (1024 * 1024)).toFixed(2)} MB` : "",
        created_at: f.created_at || "",
      }))

      // Filter by role
      let visibleFilesList = filesList
      if (currentUser?.roli === "Head of Department") {
        const deptUserIds = users
          .filter((u) => u.kafedra_id === currentUser.kafedra_id)
          .map((u) => u.id)
        visibleFilesList = filesList.filter((f: File) => deptUserIds.includes(f.foydalanuvchi_id))
      } else if (currentUser) {
        visibleFilesList = filesList.filter((f: File) => f.foydalanuvchi_id === currentUser.id)
      }

      setFiles(visibleFilesList)
      setDeleteId(null)
    } catch (error: any) {
      toast.error(t("errors.error") + ": " + (error.message || t("errors.unknownError")))
    }
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData()
        formData.append("file", file)

        await filesAPI.create(formData)
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2)
        toast.success(`${t("files.uploaded")}: ${file.name} (${sizeInMB} MB)`)
      } catch (error: any) {
        toast.error(`${t("files.uploadError")}: ${file.name} - ${error.message || t("errors.unknownError")}`)
      }
    }

    // Refresh data
    const filesData = await filesAPI.list()
    const filesList = ((filesData as any).results || filesData || []).map((f: any) => ({
      id: f.id,
      fayl_url: f.url || f.file || "",
      foydalanuvchi_id: f.owner?.id || f.owner?.user?.id || 0,
      fayl_nomi: f.file?.split("/").pop() || "",
      fayl_hajmi: f.size ? `${(f.size / (1024 * 1024)).toFixed(2)} MB` : "",
      created_at: f.created_at || "",
    }))

    // Filter by role
    let visibleFilesList = filesList
    if (currentUser?.roli === "Head of Department") {
      const deptUserIds = users
        .filter((u) => u.kafedra_id === currentUser.kafedra_id)
        .map((u) => u.id)
      visibleFilesList = filesList.filter((f: File) => deptUserIds.includes(f.foydalanuvchi_id))
    } else if (currentUser) {
      visibleFilesList = filesList.filter((f: File) => f.foydalanuvchi_id === currentUser.id)
    }

    setFiles(visibleFilesList)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFileUpload(e.dataTransfer.files)
    },
    [],
  )

  const getUserName = (userId: number) => {
    const user = users.find((u) => u.id === userId)
    return user ? `${user.ism} ${user.familiya}` : `${t("files.user")} ${userId}`
  }

  const availableUsers = useMemo(() => {
    if (currentUser?.roli === "Head of Department") {
      return users.filter((u) => u.kafedra_id === currentUser.kafedra_id)
    } else {
      return [currentUser].filter(Boolean) as User[]
    }
  }, [currentUser, users])

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">{t("dashboard.title")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>{t("menu.files")}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold">{t("files.title")}</h1>
        <p className="text-muted-foreground">{t("files.subtitle")}</p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>{t("files.upload")}</CardTitle>
          <CardDescription>{t("files.uploadDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              {t("files.dragAndDrop")}
            </p>
            <Input
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="max-w-xs mx-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t("files.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("files.search")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("files.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {currentUser?.roli === "Head of Department" && (
              <div className="space-y-2">
                <Label>{t("files.user")}</Label>
                <Select value={userFilter || "all"} onValueChange={(value) => setUserFilter(value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("files.allUsers")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("files.allUsers")}</SelectItem>
                    {availableUsers.map((user) => {
                      if (!user) return null
                      return (
                        <SelectItem key={user.id} value={String(user.id)}>
                          {user.ism} {user.familiya}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("files.list")}</CardTitle>
          <CardDescription>{filteredFiles.length} {t("files.found")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("files.noFiles")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("files.tableHeaders.id")}</TableHead>
                  <TableHead>{t("files.tableHeaders.fileName")}</TableHead>
                  <TableHead>{t("files.tableHeaders.fileUrl")}</TableHead>
                  <TableHead>{t("files.tableHeaders.user")}</TableHead>
                  <TableHead>{t("files.tableHeaders.size")}</TableHead>
                  <TableHead>{t("files.tableHeaders.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => {
                  const canDelete = file.foydalanuvchi_id === currentUser?.id
                  return (
                    <TableRow key={file.id}>
                      <TableCell>{file.id}</TableCell>
                      <TableCell className="font-medium flex items-center gap-2">
                        <FileIcon className="w-4 h-4 text-muted-foreground" />
                        {file.fayl_nomi || file.fayl_url.split("/").pop()}
                      </TableCell>
                      <TableCell>
                        <a
                          href={file.fayl_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {file.fayl_url}
                        </a>
                      </TableCell>
                      <TableCell>{getUserName(file.foydalanuvchi_id)}</TableCell>
                      <TableCell>{file.fayl_hajmi || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={file.fayl_url} download>
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(file.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
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

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("files.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("files.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

