"use client"

import { useState, useEffect } from "react"
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
import { authAPI } from "@/lib/api"
import { toast } from "sonner"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { t, language, changeLanguage } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const currentUser = getCurrentUserSync()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle language change
  const handleLanguageChange = (newLang: string) => {
    const lang = newLang as "uz" | "uzc" | "ru" | "en"
    changeLanguage(lang)
    // Show success message - UI will update automatically with new language
    setTimeout(() => {
      toast.success(t("settings.languageChanged"))
    }, 150)
  }

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t("settings.allFieldsRequired"))
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("settings.passwordsDoNotMatch"))
      return
    }
    if (newPassword.length < 6) {
      toast.error(t("settings.passwordMinLength"))
      return
    }

    setIsChangingPassword(true)
    try {
      await authAPI.changePassword(currentPassword, newPassword)
      toast.success(t("settings.passwordChanged"))
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast.error(error.message || t("settings.passwordChangeError"))
    } finally {
      setIsChangingPassword(false)
    }
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
          <BreadcrumbItem>{t("settings.title")}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {mounted && theme === "dark" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
            {t("settings.theme")}
          </CardTitle>
          <CardDescription>{t("settings.themeDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("settings.darkTheme")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("settings.darkThemeDesc")}
              </p>
            </div>
            <Switch
              checked={mounted && theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              disabled={!mounted}
            />
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {t("settings.language")}
          </CardTitle>
          <CardDescription>{t("settings.languageDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="language">{t("settings.language")}</Label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger id="language">
                <SelectValue placeholder={t("settings.selectLanguage")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uz">{t("languages.uzbek")}</SelectItem>
                <SelectItem value="uzc">{t("languages.uzbekCyrillic")}</SelectItem>
                <SelectItem value="ru">{t("languages.russian")}</SelectItem>
                <SelectItem value="en">{t("languages.english")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            {t("settings.changePassword")}
          </CardTitle>
          <CardDescription>{t("settings.changePasswordDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">{t("settings.currentPassword")}</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t("settings.enterCurrentPassword")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">{t("settings.newPassword")}</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("settings.enterNewPassword")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t("settings.confirmPassword")}</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("settings.reEnterNewPassword")}
            />
          </div>
          <Button onClick={handlePasswordChange} disabled={isChangingPassword}>
            {isChangingPassword ? t("settings.changing") : t("settings.changePasswordButton")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

