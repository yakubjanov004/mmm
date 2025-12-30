"use client"

import type React from "react"
import { useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function FileUploadArea() {
  const [isDragging, setIsDragging] = useState(false)
  const [metadata, setMetadata] = useState({
    title: "",
    description: "",
    subject: "",
    academicYear: new Date().getFullYear().toString(),
    discipline: "",
  })

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Title *</label>
          <Input
            placeholder="e.g., Lecture 1 - Introduction"
            value={metadata.title}
            onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Subject *</label>
          <Input
            placeholder="e.g., Mathematics"
            value={metadata.subject}
            onChange={(e) => setMetadata({ ...metadata, subject: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Academic Year *</label>
          <Input
            placeholder="e.g., 2024"
            value={metadata.academicYear}
            onChange={(e) => setMetadata({ ...metadata, academicYear: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Discipline</label>
          <Input
            placeholder="e.g., Applied Mathematics"
            value={metadata.discipline}
            onChange={(e) => setMetadata({ ...metadata, discipline: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          placeholder="Describe the content of your file..."
          value={metadata.description}
          onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          rows={3}
        />
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <h3 className="font-semibold">Drag files here or click to browse</h3>
          <p className="text-sm text-muted-foreground">Supports PDF, DOC, DOCX, PPT, MP4, and more</p>
          <Button className="mt-4">Select Files</Button>
        </div>
      </div>
    </div>
  )
}
