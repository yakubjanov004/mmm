from django.urls import include, path
from rest_framework.routers import DefaultRouter

from files.views import StoredFileViewSet

router = DefaultRouter()
router.register("files", StoredFileViewSet, basename="storedfile")

urlpatterns = [
    path("", include(router.urls)),
]

