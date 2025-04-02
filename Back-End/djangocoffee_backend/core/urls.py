from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SiteConfigurationViewSet, 
    BannerImageViewSet,
    ContentBlockViewSet,
    ContactMessageViewSet,
    FAQViewSet,
    TestimonialViewSet
)

router = DefaultRouter()
router.register(r'config', SiteConfigurationViewSet, basename='site-config')
router.register(r'banners', BannerImageViewSet, basename='banners')
router.register(r'content', ContentBlockViewSet, basename='content')
router.register(r'contact', ContactMessageViewSet, basename='contact')
router.register(r'faq', FAQViewSet, basename='faq')
router.register(r'testimonials', TestimonialViewSet, basename='testimonials')

urlpatterns = [
    path('', include(router.urls)),
] 