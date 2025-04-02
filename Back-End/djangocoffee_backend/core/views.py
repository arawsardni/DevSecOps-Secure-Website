from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import (
    SiteConfiguration, BannerImage, ContentBlock, 
    ContactMessage, FAQ, Testimonial
)
from .serializers import (
    SiteConfigurationSerializer, 
    BannerImageListSerializer, BannerImageDetailSerializer,
    ContentBlockListSerializer, ContentBlockDetailSerializer,
    ContactMessageListSerializer, ContactMessageDetailSerializer, 
    ContactMessageCreateSerializer, ContactMessageReplySerializer,
    FAQListSerializer, FAQDetailSerializer,
    TestimonialListSerializer, TestimonialDetailSerializer
)

class SiteConfigurationViewSet(viewsets.ViewSet):
    """ViewSet untuk mengakses konfigurasi situs"""
    
    def list(self, request):
        """Mengambil konfigurasi situs aktif"""
        config = SiteConfiguration.get_solo()
        serializer = SiteConfigurationSerializer(config)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='public')
    def public_config(self, request):
        """Mengambil konfigurasi situs untuk pengunjung (hanya informasi publik)"""
        config = SiteConfiguration.get_solo()
        data = {
            'site_name': config.site_name,
            'site_logo': request.build_absolute_uri(config.site_logo.url) if config.site_logo else None,
            'site_favicon': request.build_absolute_uri(config.site_favicon.url) if config.site_favicon else None,
            'tagline': config.tagline,
            'meta_description': config.meta_description,
            'meta_keywords': config.meta_keywords,
            'email': config.email,
            'phone_number': config.phone_number,
            'address': config.address,
            'facebook_url': config.facebook_url,
            'instagram_url': config.instagram_url,
            'twitter_url': config.twitter_url,
            'whatsapp_number': config.whatsapp_number,
            'google_maps_link': config.google_maps_link,
            'google_maps_embed': config.google_maps_embed,
            'opening_hours': config.opening_hours,
            'primary_color': config.primary_color,
            'secondary_color': config.secondary_color,
            'accent_color': config.accent_color,
            'footer_text': config.footer_text,
            'copyright_text': config.copyright_text
        }
        return Response(data)
    
    @action(detail=False, methods=['patch'], permission_classes=[permissions.IsAdminUser])
    def update_config(self, request):
        """Update konfigurasi situs (admin only)"""
        config = SiteConfiguration.get_solo()
        serializer = SiteConfigurationSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BannerImageViewSet(viewsets.ModelViewSet):
    """ViewSet untuk manajemen banner images"""
    queryset = BannerImage.objects.all().order_by('order_sequence')
    permission_classes = [permissions.IsAdminUser]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return BannerImageListSerializer
        return BannerImageDetailSerializer
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny], url_path='active')
    def active_banners(self, request):
        """Mengambil daftar banner yang aktif untuk ditampilkan di website"""
        now = timezone.now()
        banners = BannerImage.objects.filter(
            is_active=True,
            start_date__lte=now,
            end_date__gte=now
        ).order_by('order_sequence')
        serializer = BannerImageListSerializer(banners, many=True)
        return Response(serializer.data)

class ContentBlockViewSet(viewsets.ModelViewSet):
    """ViewSet untuk manajemen content blocks"""
    queryset = ContentBlock.objects.all()
    permission_classes = [permissions.IsAdminUser]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ContentBlockListSerializer
        return ContentBlockDetailSerializer
    
    def get_permissions(self):
        if self.action in ['retrieve_by_slug', 'list_by_location']:
            return [permissions.AllowAny()]
        return super().get_permissions()
    
    @action(detail=False, methods=['get'], url_path='slug/(?P<slug>[-\w]+)')
    def retrieve_by_slug(self, request, slug=None):
        """Mengambil content block berdasarkan slug"""
        content_block = get_object_or_404(ContentBlock, slug=slug, is_active=True)
        serializer = ContentBlockDetailSerializer(content_block)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='location/(?P<location>[-\w]+)')
    def list_by_location(self, request, location=None):
        """Mengambil content blocks berdasarkan lokasi"""
        content_blocks = ContentBlock.objects.filter(location=location, is_active=True).order_by('title')
        serializer = ContentBlockListSerializer(content_blocks, many=True)
        return Response(serializer.data)

class ContactMessageViewSet(viewsets.ModelViewSet):
    """ViewSet untuk manajemen pesan kontak"""
    queryset = ContactMessage.objects.all().order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ContactMessageCreateSerializer
        elif self.action == 'list':
            return ContactMessageListSerializer
        elif self.action == 'reply':
            return ContactMessageReplySerializer
        return ContactMessageDetailSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
    
    def create(self, request, *args, **kwargs):
        """Membuat pesan kontak baru dari pengunjung"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Tambahkan informasi IP dan user agent
            message = serializer.save(
                ip_address=request.META.get('REMOTE_ADDR', ''),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            return Response(
                {'message': 'Pesan berhasil dikirim! Kami akan segera menghubungi Anda.'},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='reply')
    def reply(self, request, pk=None):
        """Reply to a contact message (admin only)"""
        message = self.get_object()
        serializer = ContactMessageReplySerializer(data=request.data)
        
        if serializer.is_valid():
            message.reply_message = serializer.validated_data['reply_message']
            message.replied_by = request.user
            message.replied_at = timezone.now()
            message.status = 'replied'
            message.save()
            
            return Response({
                'message': 'Balasan berhasil dikirim',
                'detail': ContactMessageDetailSerializer(message).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='mark-as-read')
    def mark_as_read(self, request, pk=None):
        """Mark message as read (admin only)"""
        message = self.get_object()
        message.mark_as_read()
        return Response({'status': 'pesan ditandai sebagai dibaca'})

class FAQViewSet(viewsets.ModelViewSet):
    """ViewSet untuk manajemen FAQ"""
    queryset = FAQ.objects.all().order_by('category', 'order_sequence')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FAQListSerializer
        return FAQDetailSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'list_by_category']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
    
    @action(detail=False, methods=['get'], url_path='public')
    def public_faqs(self, request):
        """Get all active FAQs for public view"""
        faqs = FAQ.objects.filter(is_active=True).order_by('category', 'order_sequence')
        serializer = FAQDetailSerializer(faqs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='category/(?P<category>[-\w]+)')
    def list_by_category(self, request, category=None):
        """Get FAQs by category"""
        faqs = FAQ.objects.filter(category=category, is_active=True).order_by('order_sequence')
        serializer = FAQDetailSerializer(faqs, many=True)
        return Response(serializer.data)

class TestimonialViewSet(viewsets.ModelViewSet):
    """ViewSet untuk manajemen testimonial"""
    queryset = Testimonial.objects.all().order_by('-order_sequence')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TestimonialListSerializer
        return TestimonialDetailSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'active_testimonials']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
    
    @action(detail=False, methods=['get'], url_path='active')
    def active_testimonials(self, request):
        """Get all active testimonials for public view"""
        testimonials = Testimonial.objects.filter(is_active=True).order_by('-order_sequence')
        serializer = TestimonialListSerializer(testimonials, many=True)
        return Response(serializer.data)
