from rest_framework import serializers
from .models import (
    SiteConfiguration, BannerImage, ContentBlock, 
    ContactMessage, FAQ, Testimonial
)

class SiteConfigurationSerializer(serializers.ModelSerializer):
    """Serializer untuk konfigurasi situs"""
    class Meta:
        model = SiteConfiguration
        fields = [
            'id', 'site_name', 'site_logo', 'site_favicon', 'tagline',
            'meta_description', 'meta_keywords', 'email', 'phone_number',
            'address', 'facebook_url', 'instagram_url', 'twitter_url',
            'whatsapp_number', 'google_maps_link', 'google_maps_embed',
            'opening_hours', 'minimum_order_value', 'delivery_range_km',
            'primary_color', 'secondary_color', 'accent_color',
            'footer_text', 'copyright_text'
        ]

class BannerImageListSerializer(serializers.ModelSerializer):
    """Serializer untuk daftar banner images"""
    class Meta:
        model = BannerImage
        fields = [
            'id', 'title', 'subtitle', 'image', 'position',
            'link_url', 'button_text', 'is_active', 'order_sequence'
        ]

class BannerImageDetailSerializer(serializers.ModelSerializer):
    """Serializer untuk detail banner image"""
    class Meta:
        model = BannerImage
        fields = [
            'id', 'title', 'subtitle', 'image', 'position', 'link_url',
            'button_text', 'text_color', 'is_active', 'order_sequence',
            'start_date', 'end_date', 'created_at', 'updated_at'
        ]

class ContentBlockListSerializer(serializers.ModelSerializer):
    """Serializer untuk daftar content blocks"""
    class Meta:
        model = ContentBlock
        fields = [
            'id', 'title', 'slug', 'location', 'is_active',
            'show_in_footer', 'show_in_header'
        ]

class ContentBlockDetailSerializer(serializers.ModelSerializer):
    """Serializer untuk detail content block"""
    class Meta:
        model = ContentBlock
        fields = [
            'id', 'title', 'slug', 'location', 'content',
            'meta_title', 'meta_description', 'is_active',
            'show_in_footer', 'show_in_header', 'created_at', 'updated_at'
        ]

class ContactMessageListSerializer(serializers.ModelSerializer):
    """Serializer untuk daftar pesan kontak"""
    class Meta:
        model = ContactMessage
        fields = [
            'id', 'name', 'email', 'subject', 'status',
            'created_at', 'replied_at'
        ]

class ContactMessageDetailSerializer(serializers.ModelSerializer):
    """Serializer untuk detail pesan kontak"""
    replied_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ContactMessage
        fields = [
            'id', 'name', 'email', 'subject', 'message', 'status',
            'replied_by', 'replied_by_name', 'reply_message', 'replied_at',
            'ip_address', 'user_agent', 'created_at', 'updated_at'
        ]
    
    def get_replied_by_name(self, obj):
        if obj.replied_by:
            return obj.replied_by.name
        return None

class ContactMessageCreateSerializer(serializers.ModelSerializer):
    """Serializer untuk membuat pesan kontak"""
    class Meta:
        model = ContactMessage
        fields = ['name', 'email', 'subject', 'message']

class ContactMessageReplySerializer(serializers.Serializer):
    """Serializer untuk membalas pesan kontak"""
    reply_message = serializers.CharField(required=True)

class FAQListSerializer(serializers.ModelSerializer):
    """Serializer untuk daftar FAQs"""
    class Meta:
        model = FAQ
        fields = [
            'id', 'question', 'category', 'is_active', 'order_sequence'
        ]

class FAQDetailSerializer(serializers.ModelSerializer):
    """Serializer untuk detail FAQ"""
    category_display = serializers.SerializerMethodField()
    
    class Meta:
        model = FAQ
        fields = [
            'id', 'question', 'answer', 'category', 'category_display',
            'is_active', 'order_sequence', 'created_at', 'updated_at'
        ]
    
    def get_category_display(self, obj):
        return obj.get_category_display()

class TestimonialListSerializer(serializers.ModelSerializer):
    """Serializer untuk daftar testimonial"""
    class Meta:
        model = Testimonial
        fields = [
            'id', 'name', 'position', 'image',
            'rating', 'is_active', 'order_sequence'
        ]

class TestimonialDetailSerializer(serializers.ModelSerializer):
    """Serializer untuk detail testimonial"""
    class Meta:
        model = Testimonial
        fields = [
            'id', 'name', 'position', 'image', 'content',
            'rating', 'is_active', 'order_sequence',
            'created_at', 'updated_at'
        ] 