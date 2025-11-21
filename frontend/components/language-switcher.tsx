"use client"

import { useTranslation, type Language } from "@/lib/i18n"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function LanguageSwitcher() {
  const { language, changeLanguage, t } = useTranslation()

  const languages: { value: Language; labelKey: string }[] = [
    { value: "uz", labelKey: "languages.uzbek" },
    { value: "uzc", labelKey: "languages.uzbekCyrillic" },
    { value: "ru", labelKey: "languages.russian" },
    { value: "en", labelKey: "languages.english" },
  ]

  return (
    <Select value={language} onValueChange={(value) => changeLanguage(value as Language)}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder={t("languages.uzbek")} />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.value} value={lang.value}>
            {t(lang.labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

