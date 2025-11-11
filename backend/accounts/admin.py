from django.contrib import admin

from accounts.models import Department, Position, Profile


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    search_fields = ("name",)


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    search_fields = ("name",)


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
