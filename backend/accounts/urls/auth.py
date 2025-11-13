from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import ChangePasswordView, CustomTokenObtainPairView, CurrentUserView

app_name = "accounts-auth"

urlpatterns = [
    path("login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("me/", CurrentUserView.as_view(), name="me"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
]

