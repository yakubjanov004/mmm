from django.contrib import admin

from accounts.models import Department, Employment, Position, Profile, ProfileName


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    search_fields = ("name",)


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    search_fields = ("name",)


class ProfileNameInline(admin.TabularInline):
    model = ProfileName
    extra = 0
    fields = ("language", "first_name", "last_name", "father_name")


class EmploymentInline(admin.TabularInline):
    model = Employment
    extra = 0
    fields = ("employment_type", "rate", "department", "position", "is_active")


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "department", "position")
    list_filter = ("role", "department", "position")
    search_fields = (
        "user__username",
        "user__first_name",
        "user__last_name",
        "user_id_str",
    )
    inlines = [ProfileNameInline, EmploymentInline]


@admin.register(Employment)
class EmploymentAdmin(admin.ModelAdmin):
    list_display = ("profile", "employment_type", "rate", "department", "position", "is_active")
    list_filter = ("employment_type", "is_active", "department", "position")
    search_fields = ("profile__user__username",)


@admin.register(ProfileName)
class ProfileNameAdmin(admin.ModelAdmin):
    list_display = ("profile", "language", "first_name", "last_name")
    list_filter = ("language",)
    search_fields = ("profile__user__username", "first_name", "last_name")
