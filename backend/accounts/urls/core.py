from django.urls import include, path
from rest_framework.routers import DefaultRouter

from accounts.views import DepartmentListView, PositionListView, UserViewSet

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")

urlpatterns = [
    path("departments/", DepartmentListView.as_view(), name="departments-list"),
    path("positions/", PositionListView.as_view(), name="positions-list"),
    path("", include(router.urls)),
]

