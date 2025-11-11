"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUploadArea } from "@/components/teacher/file-upload-area"
import { FileList } from "@/components/teacher/file-list"
import { FileIcon, FolderIcon } from "lucide-react"

export default function TeacherDashboard() {
  const recentFiles = [
    {
      id: 1,
      name: "Lecture_Notes_Week1.pdf",
      size: "2.4 MB",
      uploadedAt: "2 hours ago",
      type: "pdf",
      title: "Lecture Notes - Week 1",
      subject: "Advanced Mathematics",
      academicYear: "2024",
    },
    {
      id: 2,
      name: "Assignment_Template.docx",
      size: "1.2 MB",
      uploadedAt: "1 day ago",
      type: "document",
      title: "Assignment Template",
      subject: "Physics",
      academicYear: "2024",
    },
    {
      id: 3,
      name: "Class_Recording.mp4",
      size: "512 MB",
      uploadedAt: "3 days ago",
      type: "video",
      title: "Class Recording",
      subject: "Computer Science",
      academicYear: "2024",
    },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Manage your academic files here.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="transition-smooth hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileIcon className="w-4 h-4" />
              Total Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">24</p>
            <p className="text-xs text-muted-foreground">+2 this week</p>
          </CardContent>
        </Card>
        <Card className="transition-smooth hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FolderIcon className="w-4 h-4" />
              Storage Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">12.5 GB</p>
            <p className="text-xs text-muted-foreground">of 50 GB available</p>
          </CardContent>
        </Card>
      </div>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>Add title, subject, and academic year information</CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploadArea />
        </CardContent>
      </Card>

      {/* Recent Files */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Files</CardTitle>
          <CardDescription>Your recently uploaded academic materials</CardDescription>
        </CardHeader>
        <CardContent>
          <FileList files={recentFiles} />
        </CardContent>
      </Card>
    </div>
  )
}
