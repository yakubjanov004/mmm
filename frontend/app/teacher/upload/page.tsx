"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, AlertCircle } from "lucide-react"

export default function UploadPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [files, setFiles] = useState<File[]>([])

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles([...files, ...droppedFiles])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)])
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Files</h1>
        <p className="text-muted-foreground mt-1">Add new academic files to your collection</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>File Information</CardTitle>
            <CardDescription>Provide details about your files</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter file title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description or abstract"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select a category</option>
                <option value="Science">Science</option>
                <option value="IT">IT</option>
                <option value="Engineering">Engineering</option>
                <option value="Pedagogy">Pedagogy</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Upload Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Supported formats</p>
                <p className="text-muted-foreground">PDF, DOCX, PPTX, ZIP</p>
              </div>
            </div>
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Max file size</p>
                <p className="text-muted-foreground">50 MB per file</p>
              </div>
            </div>
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Daily limit</p>
                <p className="text-muted-foreground">500 MB per day</p>
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
              <p className="font-semibold text-lg">Drag and drop files here</p>
              <p className="text-muted-foreground">or click to browse</p>
            </div>
            <input
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              id="file-input"
              accept=".pdf,.docx,.pptx,.zip"
            />
            <Button asChild className="bg-primary hover:bg-primary/90">
              <label htmlFor="file-input" className="cursor-pointer">
                Select Files
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected Files */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Files ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-3">
        <Button variant="outline">Cancel</Button>
        <Button disabled={!title || !category || files.length === 0} className="bg-primary hover:bg-primary/90">
          Upload Files
        </Button>
      </div>
    </div>
  )
}
