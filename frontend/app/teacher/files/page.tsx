"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileIcon, Search, MoreVertical, Download, Trash2, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { filesAPI } from "@/lib/api"

interface StoredFile {
  id: number
  file: string
  url: string
  size: number
  owner: { id: number; user: { username: string; first_name: string; last_name: string }; department: string }
  created_at: string
}

export default function TeacherFiles() {
  const router = useRouter()
  const [files, setFiles] = useState<StoredFile[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const response = (await filesAPI.list()) as any
      setFiles(Array.isArray(response) ? response : (response?.results || []))
    } catch (error) {
      console.error("Fayllarni yuklashda xatolik:", error)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Bu faylni o'chirishni xohlaysizmi?")) return

    try {
      setDeleting(id)
      await filesAPI.delete(id)
      setFiles(files.filter((f) => f.id !== id))
    } catch (error) {
      console.error("Faylni o'chirishda xatolik:", error)
      alert("Faylni o'chirishda xatolik")
    } finally {
      setDeleting(null)
    }
  }

  const filteredFiles = files.filter((file) => {
    const searchMatch = file.file.toLowerCase().includes(searchQuery.toLowerCase())
    return searchMatch
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mening Fayllarim</h1>
          <p className="text-muted-foreground">Yuklangan akademik materiallarni boshqaring</p>
        </div>
        <Link href="/teacher/upload">
          <Button>Yangi Fayl Yuklash</Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Fayllarni qidirish..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files Grid or Loading */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>Hech fayl topilmadi</p>
              <Link href="/teacher/upload">
                <Button className="mt-4">Fayl Yuklash</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          filteredFiles.map((file) => {
            const fileName = file.file.split("/").pop() || file.file
            const fileExt = fileName.split(".").pop()?.toLowerCase()
            const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
            const createdDate = new Date(file.created_at).toLocaleDateString("uz-UZ")

            return (
              <Card key={file.id} className="hover:shadow-lg transition-shadow flex flex-col">
                <CardContent className="pt-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <FileIcon className="w-8 h-8 text-primary" />
                    <Button variant="ghost" size="icon" disabled={deleting === file.id} onClick={() => handleDelete(file.id)}>
                      {deleting === file.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <h3 className="font-semibold mb-1 truncate">{fileName}</h3>
                  <p className="text-sm text-muted-foreground mb-1 truncate">
                    {file.owner.user.first_name} {file.owner.user.last_name}
                  </p>

                  <div className="text-xs text-muted-foreground space-y-1 mb-4">
                    <p>
                      <strong>Hajmi:</strong> {fileSizeMB} MB
                    </p>
                    <p>
                      <strong>Turri:</strong> {fileExt?.toUpperCase()}
                    </p>
                    <p>Saqlandi: {createdDate}</p>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const link = document.createElement("a")
                        link.href = file.url
                        link.download = fileName
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      }}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Yuklash
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}