"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileIcon, Search, Download, Trash2, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { filesAPI } from "@/lib/api"

interface StoredFile {
  id: number
  file: string
  url: string
  size: number
  owner: { id: number; user: { username: string; first_name: string; last_name: string }; department: string }
  created_at: string
}

export default function ProrectorFiles() {
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
    const fileNameMatch = file.file.toLowerCase().includes(searchQuery.toLowerCase())
    const ownerMatch = `${file.owner.user.first_name} ${file.owner.user.last_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    return fileNameMatch || ownerMatch
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kafedra Faylları</h1>
          <p className="text-muted-foreground">
            Kafedra o'qituvchilarining yuklagan barcha akademik materialları
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Fayl yoki o'qituvchi bo'yicha qidirish..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{files.length}</p>
              <p className="text-sm text-muted-foreground">Jami Fayllar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024 / 1024).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">Jami Hajmi (GB)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {new Set(files.map((f) => f.owner.id)).size}
              </p>
              <p className="text-sm text-muted-foreground">O'qituvchilar</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Files Grid or Loading */}
      <div className="space-y-3">
        {loading ? (
          <Card className="col-span-full">
            <CardContent className="pt-6 flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>
                {searchQuery
                  ? "Qidiruvga mos fayllar topilmadi"
                  : "Kafedrada hech fayl yo'q"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredFiles.map((file) => {
            const fileName = file.file.split("/").pop() || file.file
            const fileExt = fileName.split(".").pop()?.toLowerCase()
            const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
            const createdDate = new Date(file.created_at).toLocaleDateString("uz-UZ")
            const ownerName = `${file.owner.user.first_name} ${file.owner.user.last_name}`

            return (
              <Card key={file.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <FileIcon className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{fileName}</h3>
                        <p className="text-sm text-muted-foreground truncate">{ownerName}</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-xs text-muted-foreground">
                          <div>
                            <strong>Hajmi:</strong> {fileSizeMB} MB
                          </div>
                          <div>
                            <strong>Turli:</strong> {fileExt?.toUpperCase()}
                          </div>
                          <div>
                            <strong>Saqlandi:</strong> {createdDate}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          <strong>Bo'lim:</strong> {file.owner.department}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          const link = document.createElement("a")
                          link.href = file.url
                          link.download = fileName
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        disabled={deleting === file.id}
                        onClick={() => handleDelete(file.id)}
                      >
                        {deleting === file.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
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
