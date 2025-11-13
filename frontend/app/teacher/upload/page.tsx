"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, AlertCircle, Loader2, CheckCircle, XCircle } from "lucide-react"
import { filesAPI } from "@/lib/api"

export default function UploadPage() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{ [key: number]: "pending" | "loading" | "success" | "error" }>({})
  const [uploadErrors, setUploadErrors] = useState<{ [key: number]: string }>({})
  const [successCount, setSuccessCount] = useState(0)

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    const newFiles = droppedFiles.filter((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase()
      return ["pdf", "docx", "pptx", "png", "jpg", "jpeg"].includes(ext || "")
    })
    
    if (newFiles.length === 0 && droppedFiles.length > 0) {
      alert("Faqat PDF, DOCX, PPTX, PNG, JPG formatlar qabul qilinadi")
      return
    }
    
    setFiles([...files, ...newFiles])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles([...files, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Hech fayl tanlanmagan")
      return
    }

    setUploading(true)
    setSuccessCount(0)

    for (let i = 0; i < files.length; i++) {
      setUploadStatus((prev) => ({ ...prev, [i]: "loading" }))

      try {
        const formData = new FormData()
        formData.append("file", files[i])

        const response = await filesAPI.create(formData)

        setUploadStatus((prev) => ({ ...prev, [i]: "success" }))
        setSuccessCount((prev) => prev + 1)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Fayl yuklashda xatolik"
        setUploadStatus((prev) => ({ ...prev, [i]: "error" }))
        setUploadErrors((prev) => ({ ...prev, [i]: errorMsg }))
      }
    }

    setUploading(false)

    // Redirect to files page after successful upload
    if (successCount === files.length) {
      setTimeout(() => {
        router.push("/teacher/files")
      }, 1500)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Fayllarni Yuklash</h1>
        <p className="text-muted-foreground mt-1">Akademik materiallarni to'plamingizga qo'shing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Yuklash Qoidalari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Qo'llab-quvvatlanuvchi formatlar</p>
                <p className="text-muted-foreground">PDF, DOCX, PPTX, PNG, JPG</p>
              </div>
            </div>
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Maksimal fayl hajmi</p>
                <p className="text-muted-foreground">50 MB</p>
              </div>
            </div>
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Bir vaqtada</p>
                <p className="text-muted-foreground">Shu ko'p faylni yuklash mumkin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File Drop Zone */}
      <Card
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        className="border-2 border-dashed border-primary/50 hover:border-primary transition"
      >
        <CardContent className="pt-12 pb-12">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-primary/10 p-6 rounded-full">
                <Upload className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-lg">Fayllarni bu yerga torting</p>
              <p className="text-muted-foreground">yoki bosib tanlang</p>
            </div>
            <input
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              id="file-input"
              accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg"
            />
            <Button asChild className="bg-primary hover:bg-primary/90">
              <label htmlFor="file-input" className="cursor-pointer">
                Fayllarni Tanlash
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected Files */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tanlangan Fayllar ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadStatus[i] === "loading" && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                    {uploadStatus[i] === "success" && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {uploadStatus[i] === "error" && <XCircle className="w-4 h-4 text-red-500" />}
                    {!uploading && uploadStatus[i] !== "success" && uploadStatus[i] !== "error" && (
                      <Button variant="ghost" size="sm" onClick={() => removeFile(i)}>
                        O'chirish
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {uploadErrors && Object.keys(uploadErrors).length > 0 && (
              <div className="mt-4 space-y-2">
                {Object.entries(uploadErrors).map(([key, error]) => (
                  <div key={key} className="p-2 bg-red-50 text-red-700 text-sm rounded">
                    {error}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" disabled={uploading}>
          Bekor Qilish
        </Button>
        <Button
          disabled={files.length === 0 || uploading}
          className="bg-primary hover:bg-primary/90"
          onClick={handleUpload}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Yuklanyotir...
            </>
          ) : (
            "Fayllarni Yuklash"
          )}
        </Button>
      </div>
    </div>
  )
}