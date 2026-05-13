
"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import ProductViewSet, OrderViewSet
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from core.views import RegisterView
from core.views import CartViewSet
from django.http import HttpResponse
from core.views import CustomCakeViewSet
from core.views import chatbot_reply, get_profile, EmailTokenObtainPairView
from core.views import (
    AdminCustomCakeViewSet,
    AdminDashboardViewSet,
    AdminOrderViewSet,
    AdminUserViewSet,
    ContactMessageViewSet,
)


router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'custom-cakes', CustomCakeViewSet, basename='customcake')
router.register(r'contacts', ContactMessageViewSet, basename='contact')
router.register(r'admin/dashboard', AdminDashboardViewSet, basename='admin-dashboard')
router.register(r'admin/users', AdminUserViewSet, basename='admin-users')
router.register(r'admin/orders', AdminOrderViewSet, basename='admin-orders')
router.register(r'admin/custom-cakes', AdminCustomCakeViewSet, basename='admin-custom-cakes')

urlpatterns = [
    path('', lambda request: HttpResponse("Bakehouse API is running!")),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/profile/', get_profile),
    path('api/chatbot/', chatbot_reply),

    path('api/token/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('api/register/', RegisterView.as_view(), name='register'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

