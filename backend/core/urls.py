from __future__ import annotations

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from core.views import health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    # DRF login/logout (SessionAuthentication uchun)
    path("api-auth/", include("rest_framework.urls")),
    path("api/health/", health_check, name="health-check"),
    path("api/auth/", include("accounts.urls.auth")),
    path("api/", include("accounts.urls.core")),
    path("api/", include("works.urls")),
    path("api/", include("files.urls")),
    path("api/", include("stats.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
