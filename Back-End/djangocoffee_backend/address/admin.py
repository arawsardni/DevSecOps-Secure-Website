from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Address

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('label', 'user_email', 'address_short', 'is_default_icon', 'created_at')
    list_filter = ('is_default', 'created_at', 'user')
    search_fields = ('label', 'user__email', 'user__username', 'address', 'note')
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 20
    
    fieldsets = (
        ('Informasi Pengguna', {
            'fields': ('user', 'label')
        }),
        ('Detail Alamat', {
            'fields': ('address', 'note')
        }),
        ('Pengaturan', {
            'fields': ('is_default', 'coordinates')
        }),
        ('Timestamp', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def user_email(self, obj):
        if obj.user:
            url = reverse('admin:useraccount_user_change', args=[obj.user.id])
            return format_html('<a href="{}">{}</a>', url, obj.user.email or obj.user.username)
        return "-"
    user_email.short_description = 'User'
    user_email.admin_order_field = 'user__email'
    
    def address_short(self, obj):
        if obj.address and len(obj.address) > 50:
            return obj.address[:50] + "..."
        return obj.address or "-"
    address_short.short_description = 'Alamat'
    
    def is_default_icon(self, obj):
        if obj.is_default:
            return format_html('<span style="color: green; font-weight: bold;">✓</span>')
        return format_html('<span style="color: #999;">✗</span>')
    is_default_icon.short_description = 'Default'
    is_default_icon.admin_order_field = 'is_default'
    
    def save_model(self, request, obj, form, change):
        """
        Override save_model untuk memastikan behavior save() model dijalankan
        """
        # Jika alamat ini default, pastikan alamat lain dari user yang sama tidak default
        if obj.is_default:
            Address.objects.filter(user=obj.user, is_default=True).exclude(pk=obj.pk).update(is_default=False)
        
        # Jika ini satu-satunya alamat untuk user, jadikan default
        if not change and not Address.objects.filter(user=obj.user).exists():
            obj.is_default = True
            
        super().save_model(request, obj, form, change)
