from django.contrib import admin
from django.utils.html import format_html
from django import forms
from .models import (
    SiteConfiguration, BannerImage, ContentBlock, 
    ContactMessage, FAQ, Testimonial
)

@admin.register(SiteConfiguration)
class SiteConfigurationAdmin(admin.ModelAdmin):
    """Admin untuk Konfigurasi Situs"""
    fieldsets = (
        ('Informasi Dasar', {
            'fields': ('site_name', 'tagline', 'site_logo', 'site_favicon')
        }),
        ('Meta Informasi', {
            'fields': ('meta_description', 'meta_keywords')
        }),
        ('Kontak', {
            'fields': ('email', 'phone_number', 'address', 'whatsapp_number')
        }),
        ('Social Media', {
            'fields': ('facebook_url', 'instagram_url', 'twitter_url')
        }),
        ('Maps', {
            'fields': ('google_maps_link', 'google_maps_embed')
        }),
        ('Operasional', {
            'fields': ('opening_hours', 'minimum_order_value', 'delivery_range_km')
        }),
        ('Tampilan', {
            'fields': ('primary_color', 'secondary_color', 'accent_color')
        }),
        ('Footer', {
            'fields': ('footer_text', 'copyright_text')
        }),
    )
    
    def has_add_permission(self, request):
        # Mencegah pembuatan entri baru jika sudah ada
        return SiteConfiguration.objects.count() == 0

@admin.register(BannerImage)
class BannerImageAdmin(admin.ModelAdmin):
    """Admin untuk Banner Image"""
    list_display = ('title', 'position', 'is_active', 'date_range_display', 'order_sequence')
    list_filter = ('position', 'is_active')
    search_fields = ('title', 'subtitle')
    list_editable = ('is_active', 'order_sequence')
    
    def date_range_display(self, obj):
        if obj.start_date and obj.end_date:
            return f"{obj.start_date.strftime('%d/%m/%Y')} - {obj.end_date.strftime('%d/%m/%Y')}"
        return "Tidak ada batasan"
    date_range_display.short_description = "Tanggal Aktif"

# Komentar sementara class form dengan CKEditor
# class ContentBlockAdminForm(forms.ModelForm):
#     """Form untuk Content Block dengan editor WYSIWYG"""
#     class Meta:
#         model = ContentBlock
#         fields = '__all__'
#         widgets = {
#             'content': forms.Textarea(attrs={'class': 'ckeditor'}),
#         }

@admin.register(ContentBlock)
class ContentBlockAdmin(admin.ModelAdmin):
    """Admin untuk Content Block"""
    # form = ContentBlockAdminForm  # Komentar sementara
    list_display = ('title', 'location', 'slug', 'is_active', 'show_in_footer', 'show_in_header')
    list_filter = ('location', 'is_active', 'show_in_footer', 'show_in_header')
    search_fields = ('title', 'slug', 'content')
    list_editable = ('is_active', 'show_in_footer', 'show_in_header')
    prepopulated_fields = {'slug': ('title',)}

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    """Admin untuk Contact Message"""
    list_display = ('name', 'email', 'subject', 'status', 'created_at', 'replied_at', 'has_reply')
    list_filter = ('status', 'created_at', 'replied_at')
    search_fields = ('name', 'email', 'subject', 'message', 'reply_message')
    readonly_fields = ('name', 'email', 'subject', 'message', 'ip_address', 'user_agent', 'created_at')
    fieldsets = (
        ('Informasi Pengirim', {
            'fields': ('name', 'email', 'created_at', 'ip_address', 'user_agent')
        }),
        ('Isi Pesan', {
            'fields': ('subject', 'message')
        }),
        ('Balasan', {
            'fields': ('status', 'reply_message', 'replied_by', 'replied_at')
        }),
    )
    
    def has_reply(self, obj):
        return bool(obj.reply_message)
    has_reply.boolean = True
    has_reply.short_description = "Dibalas"
    
    def has_add_permission(self, request):
        # Admin tidak bisa menambahkan pesan kontak
        return False

@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    """Admin untuk FAQ"""
    list_display = ('question', 'category', 'is_active', 'order_sequence')
    list_filter = ('category', 'is_active')
    search_fields = ('question', 'answer')
    list_editable = ('is_active', 'order_sequence')

@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    """Admin untuk Testimonial"""
    list_display = ('name', 'position', 'display_rating', 'is_active', 'order_sequence')
    list_filter = ('is_active', 'rating')
    search_fields = ('name', 'position', 'content')
    list_editable = ('is_active', 'order_sequence')
    
    def display_rating(self, obj):
        stars = '★' * obj.rating + '☆' * (5 - obj.rating)
        return format_html('<span style="color: gold;">{}</span>', stars)
    display_rating.short_description = "Rating"
