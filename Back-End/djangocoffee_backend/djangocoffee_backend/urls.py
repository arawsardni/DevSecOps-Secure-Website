"""
URL configuration for djangocoffee_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
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
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/products/', include('product.urls')),
    path('api/auth/', include('useraccount.urls')),
    path('api/cart/', include('cart.urls')),
    path('api/orders/', include('order.urls')),
    path('api/reviews/', include('review.urls')),
    path('api/addresses/', include('address.urls')),
    path('api/notifications/', include('notification.urls')),
    path('api/payments/', include('payment.urls')),
    path('api/shipping/', include('shipping.urls')),
    path('api/core/', include('core.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)