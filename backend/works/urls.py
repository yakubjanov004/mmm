from django.urls import include, path
from rest_framework.routers import DefaultRouter

from works.views import (
    CertificateViewSet,
    MethodicalWorkViewSet,
    ResearchWorkViewSet,
    SoftwareCertificateViewSet,
)

router = DefaultRouter()
router.register("methodical", MethodicalWorkViewSet, basename="methodicalwork")
router.register("research", ResearchWorkViewSet, basename="researchwork")
router.register("certificates", CertificateViewSet, basename="certificate")
router.register("software-certificates", SoftwareCertificateViewSet, basename="softwarecertificate")

urlpatterns = [
    path("", include(router.urls)),
]

