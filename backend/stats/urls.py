from django.urls import path

from stats.views import AdminStatsView, DepartmentStatsView, PersonalStatsView

urlpatterns = [
    path("stats/admin/", AdminStatsView.as_view(), name="stats-admin"),
    path("stats/department/", DepartmentStatsView.as_view(), name="stats-department"),
    path("stats/me/", PersonalStatsView.as_view(), name="stats-me"),
]

