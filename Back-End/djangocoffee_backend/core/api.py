from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response

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

# ==========================
# Site Configuration API
# ==========================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def site_configuration(request):
    """
    Mendapatkan konfigurasi situs lengkap (admin only)
    """
    config = SiteConfiguration.get_instance()
    serializer = SiteConfigurationSerializer(config)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def public_site_configuration(request):
    """
    Mendapatkan konfigurasi situs untuk pengunjung (hanya informasi publik)
    """
    config = SiteConfiguration.get_instance()
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

@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def update_site_configuration(request):
    """
    Update konfigurasi situs (admin only)
    """
    config = SiteConfiguration.get_instance()
    serializer = SiteConfigurationSerializer(config, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ==========================
# Banner API
# ==========================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_banners_list(request):
    """
    Mendapatkan daftar semua banner (admin only)
    """
    banners = BannerImage.objects.all().order_by('order_sequence')
    serializer = BannerImageListSerializer(banners, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_banner_detail(request, banner_id):
    """
    Mendapatkan detail banner (admin only)
    """
    banner = get_object_or_404(BannerImage, id=banner_id)
    serializer = BannerImageDetailSerializer(banner)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def active_banners(request):
    """
    Mendapatkan daftar banner yang aktif untuk ditampilkan di website
    """
    now = timezone.now()
    banners = BannerImage.objects.filter(
        is_active=True,
        start_date__lte=now,
        end_date__gte=now
    ).order_by('order_sequence')
    serializer = BannerImageListSerializer(banners, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_banner(request):
    """
    Membuat banner baru (admin only)
    """
    serializer = BannerImageDetailSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_banner(request, banner_id):
    """
    Mengupdate banner (admin only)
    """
    banner = get_object_or_404(BannerImage, id=banner_id)
    serializer = BannerImageDetailSerializer(banner, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_banner(request, banner_id):
    """
    Menghapus banner (admin only)
    """
    banner = get_object_or_404(BannerImage, id=banner_id)
    banner.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# ==========================
# Content Block API
# ==========================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_content_blocks_list(request):
    """
    Mendapatkan daftar semua content block (admin only)
    """
    content_blocks = ContentBlock.objects.all().order_by('location', 'title')
    serializer = ContentBlockListSerializer(content_blocks, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_content_block_detail(request, block_id):
    """
    Mendapatkan detail content block (admin only)
    """
    content_block = get_object_or_404(ContentBlock, id=block_id)
    serializer = ContentBlockDetailSerializer(content_block)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def content_block_by_slug(request, slug):
    """
    Mendapatkan content block berdasarkan slug
    """
    content_block = get_object_or_404(ContentBlock, slug=slug, is_active=True)
    serializer = ContentBlockDetailSerializer(content_block)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def content_blocks_by_location(request, location):
    """
    Mendapatkan content blocks berdasarkan lokasi
    """
    content_blocks = ContentBlock.objects.filter(location=location, is_active=True).order_by('title')
    serializer = ContentBlockListSerializer(content_blocks, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_content_block(request):
    """
    Membuat content block baru (admin only)
    """
    serializer = ContentBlockDetailSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_content_block(request, block_id):
    """
    Mengupdate content block (admin only)
    """
    content_block = get_object_or_404(ContentBlock, id=block_id)
    serializer = ContentBlockDetailSerializer(content_block, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_content_block(request, block_id):
    """
    Menghapus content block (admin only)
    """
    content_block = get_object_or_404(ContentBlock, id=block_id)
    content_block.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# ==========================
# Contact Message API
# ==========================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_contact_messages_list(request):
    """
    Mendapatkan daftar semua pesan kontak (admin only)
    """
    status_filter = request.query_params.get('status')
    
    if status_filter:
        messages = ContactMessage.objects.filter(status=status_filter).order_by('-created_at')
    else:
        messages = ContactMessage.objects.all().order_by('-created_at')
    
    serializer = ContactMessageListSerializer(messages, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_contact_message_detail(request, message_id):
    """
    Mendapatkan detail pesan kontak (admin only)
    """
    message = get_object_or_404(ContactMessage, id=message_id)
    serializer = ContactMessageDetailSerializer(message)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_contact_message(request):
    """
    Membuat pesan kontak baru dari pengunjung
    """
    serializer = ContactMessageCreateSerializer(data=request.data)
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

@api_view(['POST'])
@permission_classes([IsAdminUser])
def reply_contact_message(request, message_id):
    """
    Membalas pesan kontak (admin only)
    """
    message = get_object_or_404(ContactMessage, id=message_id)
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

@api_view(['POST'])
@permission_classes([IsAdminUser])
def mark_as_read(request, message_id):
    """
    Menandai pesan sebagai dibaca (admin only)
    """
    message = get_object_or_404(ContactMessage, id=message_id)
    message.mark_as_read()
    return Response({'status': 'pesan ditandai sebagai dibaca'})

# ==========================
# FAQ API
# ==========================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_faqs_list(request):
    """
    Mendapatkan daftar semua FAQ (admin only)
    """
    category = request.query_params.get('category')
    is_active = request.query_params.get('is_active')
    
    query = {}
    if category:
        query['category'] = category
    if is_active is not None:
        query['is_active'] = is_active.lower() == 'true'
    
    faqs = FAQ.objects.filter(**query).order_by('category', 'order_sequence')
    serializer = FAQListSerializer(faqs, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_faq_detail(request, faq_id):
    """
    Mendapatkan detail FAQ (admin only)
    """
    faq = get_object_or_404(FAQ, id=faq_id)
    serializer = FAQDetailSerializer(faq)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def public_faqs(request):
    """
    Mendapatkan semua FAQ aktif untuk publik
    """
    faqs = FAQ.objects.filter(is_active=True).order_by('category', 'order_sequence')
    serializer = FAQDetailSerializer(faqs, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def faqs_by_category(request, category):
    """
    Mendapatkan FAQ berdasarkan kategori
    """
    faqs = FAQ.objects.filter(category=category, is_active=True).order_by('order_sequence')
    serializer = FAQDetailSerializer(faqs, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_faq(request):
    """
    Membuat FAQ baru (admin only)
    """
    serializer = FAQDetailSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_faq(request, faq_id):
    """
    Mengupdate FAQ (admin only)
    """
    faq = get_object_or_404(FAQ, id=faq_id)
    serializer = FAQDetailSerializer(faq, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_faq(request, faq_id):
    """
    Menghapus FAQ (admin only)
    """
    faq = get_object_or_404(FAQ, id=faq_id)
    faq.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# ==========================
# Testimonial API
# ==========================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_testimonials_list(request):
    """
    Mendapatkan daftar semua testimonial (admin only)
    """
    is_active = request.query_params.get('is_active')
    
    if is_active is not None:
        testimonials = Testimonial.objects.filter(is_active=is_active.lower() == 'true').order_by('-order_sequence')
    else:
        testimonials = Testimonial.objects.all().order_by('-order_sequence')
    
    serializer = TestimonialListSerializer(testimonials, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_testimonial_detail(request, testimonial_id):
    """
    Mendapatkan detail testimonial (admin only)
    """
    testimonial = get_object_or_404(Testimonial, id=testimonial_id)
    serializer = TestimonialDetailSerializer(testimonial)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def active_testimonials(request):
    """
    Mendapatkan testimonial aktif untuk publik
    """
    testimonials = Testimonial.objects.filter(is_active=True).order_by('-order_sequence')
    serializer = TestimonialListSerializer(testimonials, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_testimonial(request):
    """
    Membuat testimonial baru (admin only)
    """
    serializer = TestimonialDetailSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_testimonial(request, testimonial_id):
    """
    Mengupdate testimonial (admin only)
    """
    testimonial = get_object_or_404(Testimonial, id=testimonial_id)
    serializer = TestimonialDetailSerializer(testimonial, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_testimonial(request, testimonial_id):
    """
    Menghapus testimonial (admin only)
    """
    testimonial = get_object_or_404(Testimonial, id=testimonial_id)
    testimonial.delete()
    return Response(status=status.HTTP_204_NO_CONTENT) 