from django.contrib import admin
from django.utils.html import format_html
from .models import Notification, NotificationSettings
from django.utils import timezone

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title_with_icon', 'user_email', 'notification_type_display', 
                   'priority_display', 'is_read_icon', 'created_at')
    list_filter = ('notification_type', 'priority', 'is_read', 'created_at')
    search_fields = ('title', 'message', 'user__email')
    readonly_fields = ('created_at', 'updated_at', 'read_at')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Informasi Dasar', {
            'fields': ('user', 'title', 'message', 'notification_type', 'priority')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'expires_at')
        }),
        ('Tautan Terkait', {
            'fields': ('related_url', 'related_object_id', 'related_object_type'),
            'classes': ('collapse',)
        }),
        ('Tampilan', {
            'fields': ('icon', 'image_url'),
            'classes': ('collapse',)
        }),
    )
    
    def notification_type_display(self, obj):
        """Tampilan yang lebih baik untuk tipe notifikasi"""
        type_colors = {
            'order': '#2E8BC0',     # Biru
            'promo': '#8A2BE2',     # Ungu
            'info': '#3CB371',      # Hijau
            'payment': '#FFD700',   # Kuning
            'system': '#FF6B6B',    # Merah
        }
        color = type_colors.get(obj.notification_type, '#808080')
        return format_html(
            '<span style="color:white; background-color:{}; padding:3px 7px; border-radius:3px;">{}</span>',
            color, obj.get_notification_type_display()
        )
    notification_type_display.short_description = 'Tipe'
    
    def priority_display(self, obj):
        """Tampilan yang lebih baik untuk prioritas notifikasi"""
        priority_colors = {
            'high': '#FF0000',    # Merah
            'medium': '#FFA500',  # Oranye
            'low': '#008000',     # Hijau
        }
        color = priority_colors.get(obj.priority, '#808080')
        return format_html(
            '<span style="color:white; background-color:{}; padding:3px 7px; border-radius:3px;">{}</span>',
            color, obj.get_priority_display()
        )
    priority_display.short_description = 'Prioritas'
    
    def is_read_icon(self, obj):
        """Tampilkan ikon untuk status dibaca/belum"""
        if obj.is_read:
            return format_html('<span style="color:green;">✓</span>')
        return format_html('<span style="color:red;">✗</span>')
    is_read_icon.short_description = 'Dibaca'
    
    def user_email(self, obj):
        """Tampilkan email pengguna"""
        return obj.user.email
    user_email.short_description = 'Pengguna'
    
    def title_with_icon(self, obj):
        """Tampilkan judul dengan ikon jika ada"""
        if obj.icon:
            return format_html('<i class="{}"></i> {}', obj.icon, obj.title)
        return obj.title
    title_with_icon.short_description = 'Judul'
    
    actions = ['mark_as_read', 'mark_as_unread']
    
    def mark_as_read(self, request, queryset):
        """Aksi untuk menandai beberapa notifikasi sebagai telah dibaca"""
        updated = queryset.update(is_read=True, read_at=timezone.now())
        self.message_user(request, f'{updated} notifikasi berhasil ditandai sebagai telah dibaca.')
    mark_as_read.short_description = "Tandai sebagai telah dibaca"
    
    def mark_as_unread(self, request, queryset):
        """Aksi untuk menandai beberapa notifikasi sebagai belum dibaca"""
        updated = queryset.update(is_read=False, read_at=None)
        self.message_user(request, f'{updated} notifikasi berhasil ditandai sebagai belum dibaca.')
    mark_as_unread.short_description = "Tandai sebagai belum dibaca"

@admin.register(NotificationSettings)
class NotificationSettingsAdmin(admin.ModelAdmin):
    list_display = ('user_email', 'email_notifications', 'push_notifications', 
                  'order_notifications', 'promo_notifications', 'payment_notifications', 
                  'system_notifications')
    list_filter = ('email_notifications', 'push_notifications', 'digest_notifications',
                  'order_notifications', 'promo_notifications', 
                  'payment_notifications', 'system_notifications')
    search_fields = ('user__email',)
    
    fieldsets = (
        ('Pengguna', {
            'fields': ('user',)
        }),
        ('Jenis Notifikasi', {
            'fields': ('order_notifications', 'promo_notifications', 
                      'payment_notifications', 'system_notifications')
        }),
        ('Metode Pengiriman', {
            'fields': ('email_notifications', 'push_notifications')
        }),
        ('Pengaturan Ringkasan', {
            'fields': ('digest_notifications', 'digest_frequency'),
            'classes': ('collapse',)
        }),
        ('Jam Tenang', {
            'fields': ('quiet_hours_start', 'quiet_hours_end'),
            'classes': ('collapse',)
        }),
        ('Timestamp', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    def user_email(self, obj):
        """Tampilkan email pengguna"""
        return obj.user.email
    user_email.short_description = 'Pengguna'
