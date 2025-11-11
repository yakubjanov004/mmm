"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb"
import { Moon, Sun, Globe, Lock } from "lucide-react"
import { useTheme } from "next-themes"
import { getCurrentUserSync } from "@/lib/auth"
import { toast } from "sonner"
import Link from "next/link"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const currentUser = getCurrentUserSync()
  const [language, setLanguage] = useState("uz")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Barcha maydonlar to'ldirilishi kerak")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Yangi parol va tasdiqlash paroli mos kelmaydi")
      return
    }
    if (newPassword.length < 6) {
      toast.error("Parol kamida 6 belgidan iborat bo'lishi kerak")
      return
    }
    toast.success("Parol muvaffaqiyatli o'zgartirildi")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
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
          <BreadcrumbItem>Settings</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Tizim sozlamalari</p>
      </div>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === "dark" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
            Tema
          </CardTitle>
          <CardDescription>Ilova mavzusini o'zgartiring</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Qora tema</Label>
              <p className="text-sm text-muted-foreground">
                Qora mavzuni yoqish yoki o'chirish
              </p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Til
          </CardTitle>
          <CardDescription>Ilova tilini tanlang</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="language">Til</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uz">O'zbek</SelectItem>
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Demo rejim: Til tanlash faqat ko'rsatkich uchun
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Parolni almashtirish
          </CardTitle>
          <CardDescription>Hisobingiz parolini yangilang</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Joriy parol</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Joriy parolni kiriting"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Yangi parol</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Yangi parolni kiriting"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Parolni tasdiqlash</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Yangi parolni qayta kiriting"
            />
          </div>
          <Button onClick={handlePasswordChange}>Parolni o'zgartirish</Button>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Hisob ma'lumotlari</CardTitle>
          <CardDescription>Hisobingizning asosiy ma'lumotlari</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={currentUser ? `${currentUser.user_id}@university.edu` : ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Roli</Label>
              <Input value={currentUser?.roli || ""} disabled className="bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

