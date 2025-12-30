import os
from datetime import timedelta
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Core settings
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
DEBUG = os.getenv("DJANGO_DEBUG", "False").lower() == "true"
ALLOWED_HOSTS = [h.strip() for h in os.getenv("DJANGO_ALLOWED_HOSTS", "").split(",") if h.strip()]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "accounts",
    "works.apps.WorksConfig",
    "files.apps.FilesConfig",
    "stats",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"


# Database
def get_database_config():
    db_url = os.getenv("DATABASE_URL", "sqlite:///db.sqlite3")
    if db_url.startswith("postgres"):
        parsed = urlparse(db_url)
        return {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": parsed.path[1:],
            "USER": parsed.username or "",
            "PASSWORD": parsed.password or "",
            "HOST": parsed.hostname or "",
            "PORT": parsed.port or "5432",
        }
    return {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}

DATABASES = {"default": get_database_config()}



AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]



# Internationalization
LANGUAGE_CODE = "uz"
TIME_ZONE = "Asia/Tashkent"
USE_I18N = True
USE_TZ = True

# Static & Media
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"



DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}


SIMPLE_JWT = {
    "AUTH_HEADER_TYPES": ("Bearer",),
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("JWT_ACCESS_LIFETIME_MINUTES", "15"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("JWT_REFRESH_LIFETIME_DAYS", "1"))),
}


SPECTACULAR_SETTINGS = {
    "TITLE": "Department Works API",
    "DESCRIPTION": """
    API for managing academic works, files, and statistics.
    
    ## Authentication
    This API supports two authentication methods:
    
    ### 1. Session Authentication (Cookie)
    - Login to Django admin at `/admin/`
    - Your session cookie will automatically authenticate you in Swagger
    
    ### 2. JWT (Bearer Token)
    - Use the `/api/auth/login/` endpoint with username and password
    - Receive access and refresh tokens
    - Include the access token in the Authorization header: `Bearer <token>`
    - Use `/api/auth/refresh/` to refresh your access token when it expires
    
    ## Roles
    - **ADMIN**: Full access to all resources
    - **HOD** (Head of Department): Access to department resources
    - **TEACHER**: Access to own resources and department-visible resources
    
    ## Endpoints
    - `/api/auth/` - Authentication endpoints
    - `/api/users/` - User management (Admin only)
    - `/api/methodical/` - Methodical works
    - `/api/research/` - Research works
    - `/api/certificates/` - Certificates
    - `/api/software-certificates/` - Software certificates
    - `/api/files/` - File storage
    - `/api/stats/` - Statistics
    """,
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SERVE_PERMISSIONS": ["rest_framework.permissions.IsAdminUser"],
    "SERVE_AUTHENTICATION": None,
    "COMPONENT_SPLIT_REQUEST": True,
    "COMPONENT_NO_READ_ONLY_REQUIRED": True,
    "SCHEMA_PATH_PREFIX": "/api/",
    "SECURITY": [
        {"cookieAuth": []},  
        {"BearerAuth": []},  
    ],
    "SECURITY_SCHEMES": {
        "cookieAuth": {
            "type": "apiKey",
            "in": "cookie",
            "name": "sessionid",  
        },
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        },
    },
    "SWAGGER_UI_SETTINGS": {
        "deepLinking": True,
        "displayOperationId": True,
        "defaultModelsExpandDepth": 2,
        "defaultModelExpandDepth": 2,
        "displayRequestDuration": True,
        "docExpansion": "list",
        "filter": True,
        "showExtensions": True,
        "showCommonExtensions": True,
        "persistAuthorization": True,  
    },
    "TAGS": [
        {"name": "Authentication", "description": "User authentication endpoints"},
        {"name": "Users", "description": "User management endpoints"},
        {"name": "Methodical Works", "description": "Methodical works management"},
        {"name": "Research Works", "description": "Research works management"},
        {"name": "Certificates", "description": "Certificate management"},
        {"name": "Software Certificates", "description": "Software certificate management"},
        {"name": "Files", "description": "File storage and management"},
        {"name": "Statistics", "description": "Statistics and analytics"},
        {"name": "Departments", "description": "Department information"},
        {"name": "Positions", "description": "Position information"},
    ],
    "REDOC_UI_SETTINGS": {
        "hideDownloadButton": False,
        "hideHostname": False,
        "hideSingleRequestTime": False,
        "expandResponses": "200,201",
        "pathInMiddlePanel": True,
        "requiredPropsFirst": True,
        "sortPropsAlphabetically": False,
    },
    "ENUM_NAME_OVERRIDES": {
        "MethodicalWorkTypesEnum": "works.models.MethodicalWork.Types",
        "ResearchWorkTypesEnum": "works.models.ResearchWork.Types",
        "CertificateTypesEnum": "works.models.Certificate.Types",
        "SoftwareCertificateTypesEnum": "works.models.SoftwareCertificate.Types",
        "WorkLanguageEnum": "works.models.WorkLanguage",
        "ProfileRolesEnum": "accounts.models.Profile.Roles",
    },
}


# CORS
CORS_ALLOWED_ORIGINS = [o.strip() for o in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()]
CORS_ALLOW_CREDENTIALS = True

# CSRF
CSRF_TRUSTED_ORIGINS = [o.strip() for o in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",") if o.strip()]


# Auth
AUTH_USER_MODEL = "accounts.User"
