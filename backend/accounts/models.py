from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Department(models.Model):
    DEFAULT_NAME = "Robototexnika va intellektual tizimlar"

    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Position(models.Model):
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Profile(models.Model):
    class Roles(models.TextChoices):
        ADMIN = "ADMIN", _("Admin")
        HOD = "HOD", _("Kafedra mudiri")
        TEACHER = "TEACHER", _("O'qituvchi")

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.TEACHER,
    )
    position = models.ForeignKey(
        Position,
        on_delete=models.SET_NULL,
        related_name="profiles",
        null=True,
        blank=True,
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        related_name="profiles",
        null=True,
        blank=True,
    )
    phone = models.CharField(max_length=32, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    avatar = models.ImageField(
        _("Avatar"),
        upload_to="avatars/",
        null=True,
        blank=True,
        help_text=_("Foydalanuvchi profil rasmi"),
    )
    scopus = models.URLField(max_length=255, blank=True)
    scholar = models.URLField(max_length=255, blank=True)
    research_id = models.CharField(max_length=128, blank=True)
    user_id_str = models.CharField(_("User id"), max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["user__username"]

    @property
    def available_roles(self) -> list[str]:
        """Return list of available roles for this profile."""
        if self.role == self.Roles.HOD:
            return [self.Roles.HOD, self.Roles.TEACHER]
        return [self.role]

    def get_full_name_by_lang(self, lang: str) -> str:
        """Get full name in specified language, fallback to User model if not found."""
        try:
            profile_name = self.names.get(language=lang)
            parts = [profile_name.first_name, profile_name.last_name]
            if profile_name.father_name:
                parts.append(profile_name.father_name)
            return " ".join(parts).strip()
        except self.names.model.DoesNotExist:
            # Fallback to User model's name
            full_name = self.user.get_full_name().strip()
            return full_name or self.user.username

    def __str__(self) -> str:
        return f"{self.user.get_full_name() or self.user.username} ({self.role})"


class Employment(models.Model):
    class EmploymentType(models.TextChoices):
        MAIN = "MAIN", _("Asosiy")
        INTERNAL = "INTERNAL", _("Ichki o'rindosh")
        EXTERNAL = "EXTERNAL", _("Tashqi o'rindosh")

    profile = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name="employments",
    )
    employment_type = models.CharField(
        max_length=20,
        choices=EmploymentType.choices,
    )
    rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text=_("Ish stavkasi (masalan: 1.00, 0.75, 1.5)"),
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        related_name="employments",
        null=True,
        blank=True,
    )
    position = models.ForeignKey(
        Position,
        on_delete=models.SET_NULL,
        related_name="employments",
        null=True,
        blank=True,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_active", "employment_type"]

    def __str__(self) -> str:
        return f"{self.profile.user.username} - {self.get_employment_type_display()} ({self.rate})"


class ProfileName(models.Model):
    class Language(models.TextChoices):
        UZ = "uz", _("O'zbek")
        UZC = "uzc", _("O'zbek (Kirill)")
        RU = "ru", _("Rus")
        EN = "en", _("Ingliz")

    profile = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name="names",
    )
    language = models.CharField(
        max_length=3,
        choices=Language.choices,
    )
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    father_name = models.CharField(max_length=150, blank=True)

    class Meta:
        unique_together = [("profile", "language")]
        ordering = ["language"]

    def __str__(self) -> str:
        return f"{self.profile.user.username} - {self.get_language_display()}"
