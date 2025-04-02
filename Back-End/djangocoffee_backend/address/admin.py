from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Address, Province, City

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('recipient_name', 'user_email', 'address_type_display', 'city', 'province', 
                    'is_default_icon', 'created_at')
    list_filter = ('address_type', 'is_default', 'city', 'province', 'created_at')
    search_fields = ('recipient_name', 'user__email', 'address_line1', 'city', 'province', 'postal_code')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Informasi Pengguna', {
            'fields': ('user', 'recipient_name', 'phone_number', 'address_type')
        }),
        ('Detail Alamat', {
            'fields': ('address_line1', 'address_line2', 'city', 'province', 'postal_code')
        }),
        ('Pengaturan', {
            'fields': ('is_default', 'label', 'notes')
        }),
        ('Geolokasi', {
            'fields': ('latitude', 'longitude'),
            'classes': ('collapse',)
        }),
        ('Timestamp', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def user_email(self, obj):
        if obj.user:
            url = reverse('admin:useraccount_user_change', args=[obj.user.id])
            return format_html('<a href="{}">{}</a>', url, obj.user.email)
        return "-"
    user_email.short_description = 'User'
    
    def address_type_display(self, obj):
        return obj.get_address_type_display()
    address_type_display.short_description = 'Tipe Alamat'
    
    def is_default_icon(self, obj):
        if obj.is_default:
            return format_html('<span style="color: green;">✓</span>')
        return format_html('<span style="color: red;">✗</span>')
    is_default_icon.short_description = 'Default'

class CityInline(admin.TabularInline):
    model = City
    extra = 1
    fields = ('name', 'code', 'postal_code')

@admin.register(Province)
class ProvinceAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'cities_count')
    search_fields = ('name', 'code')
    inlines = [CityInline]
    
    def cities_count(self, obj):
        return obj.cities.count()
    cities_count.short_description = 'Jumlah Kota'

@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ('name', 'province_name', 'code', 'postal_code')
    list_filter = ('province',)
    search_fields = ('name', 'code', 'postal_code', 'province__name')
    
    def province_name(self, obj):
        return obj.province.name
    province_name.short_description = 'Provinsi'
