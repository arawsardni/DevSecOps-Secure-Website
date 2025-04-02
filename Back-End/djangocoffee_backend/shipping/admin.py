from django.contrib import admin
from django.utils.html import format_html
from .models import (
    ShippingProvider, ShippingMethod, ShippingRate, 
    Shipment, ShipmentTracking, ShippingConfiguration
)

class ShippingMethodInline(admin.TabularInline):
    model = ShippingMethod
    extra = 0
    fields = ('name', 'code', 'method_type', 'estimated_delivery_time', 'status', 'is_featured')

@admin.register(ShippingProvider)
class ShippingProviderAdmin(admin.ModelAdmin):
    list_display = ('logo_preview', 'name', 'code', 'status', 'order_sequence', 'method_count')
    list_filter = ('status',)
    search_fields = ('name', 'code', 'description')
    inlines = [ShippingMethodInline]
    readonly_fields = ('created_at', 'updated_at', 'logo_preview')
    
    fieldsets = (
        ('Informasi Utama', {
            'fields': ('name', 'code', 'logo', 'logo_preview', 'description', 'status')
        }),
        ('Pengaturan', {
            'fields': ('order_sequence', 'website', 'tracking_url_format')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def logo_preview(self, obj):
        if obj.logo:
            return format_html('<img src="{}" width="50" height="50" />', obj.logo.url)
        return "-"
    
    def method_count(self, obj):
        return obj.methods.count()
    
    logo_preview.short_description = 'Logo'
    method_count.short_description = 'Jumlah Metode'

@admin.register(ShippingMethod)
class ShippingMethodAdmin(admin.ModelAdmin):
    list_display = ('name', 'provider_name', 'code', 'method_type_display', 'status', 'is_featured')
    list_filter = ('status', 'provider', 'method_type', 'is_featured')
    search_fields = ('name', 'code', 'provider__name')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Informasi Utama', {
            'fields': ('provider', 'name', 'code', 'description')
        }),
        ('Pengaturan', {
            'fields': ('method_type', 'estimated_delivery_time', 'status', 'is_featured')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def provider_name(self, obj):
        return obj.provider.name
    
    def method_type_display(self, obj):
        return obj.get_method_type_display()
    
    provider_name.short_description = 'Provider'
    method_type_display.short_description = 'Tipe'

@admin.register(ShippingRate)
class ShippingRateAdmin(admin.ModelAdmin):
    list_display = ('shipping_method_name', 'route_display', 'price_display', 'weight_range', 'estimated_delivery', 'is_active')
    list_filter = ('shipping_method__provider', 'shipping_method', 'is_active', 'origin_province', 'destination_province')
    search_fields = ('shipping_method__name', 'origin_city__name', 'destination_city__name')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Informasi Metode', {
            'fields': ('shipping_method',)
        }),
        ('Rute', {
            'fields': ('origin_province', 'origin_city', 'destination_province', 'destination_city')
        }),
        ('Harga & Berat', {
            'fields': ('price', 'min_weight', 'max_weight', 'price_per_kg')
        }),
        ('Estimasi & Status', {
            'fields': ('estimated_days_min', 'estimated_days_max', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def shipping_method_name(self, obj):
        return str(obj.shipping_method)
    
    def route_display(self, obj):
        return f"{obj.origin_city.name} → {obj.destination_city.name}"
    
    def price_display(self, obj):
        base_price = f"Rp {obj.price:,.0f}"
        if obj.price_per_kg > 0:
            return f"{base_price} + Rp {obj.price_per_kg:,.0f}/kg"
        return base_price
    
    def weight_range(self, obj):
        if obj.max_weight:
            return f"{obj.min_weight} - {obj.max_weight} kg"
        return f"> {obj.min_weight} kg"
    
    def estimated_delivery(self, obj):
        if obj.estimated_days_min == obj.estimated_days_max:
            return f"{obj.estimated_days_min} hari"
        return f"{obj.estimated_days_min}-{obj.estimated_days_max} hari"
    
    shipping_method_name.short_description = 'Metode Pengiriman'
    route_display.short_description = 'Rute'
    price_display.short_description = 'Harga'
    weight_range.short_description = 'Berat'
    estimated_delivery.short_description = 'Estimasi'

class ShipmentTrackingInline(admin.TabularInline):
    model = ShipmentTracking
    extra = 0
    fields = ('status', 'location', 'description', 'timestamp')
    readonly_fields = ('timestamp',)
    ordering = ('-timestamp',)

@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'shipping_method_display', 'tracking_number', 'status_colored', 'created_at', 'shipped_at', 'delivery_status')
    list_filter = ('status', 'shipping_method__provider', 'created_at')
    search_fields = ('order__order_number', 'tracking_number')
    readonly_fields = ('total_cost', 'created_at', 'updated_at')
    inlines = [ShipmentTrackingInline]
    
    fieldsets = (
        ('Informasi Pengiriman', {
            'fields': ('order', 'shipping_method', 'tracking_number', 'status', 'notes')
        }),
        ('Waktu', {
            'fields': ('shipped_at', 'estimated_delivery', 'actual_delivery')
        }),
        ('Biaya', {
            'fields': ('shipping_cost', 'insurance_cost', 'total_cost')
        }),
        ('Detail', {
            'fields': ('weight',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def order_number(self, obj):
        return obj.order.order_number if obj.order else "-"
    
    def shipping_method_display(self, obj):
        return str(obj.shipping_method) if obj.shipping_method else "-"
    
    def status_colored(self, obj):
        colors = {
            'pending': '#1976D2',       # Biru
            'processing': '#FB8C00',    # Oranye
            'in_transit': '#FF9800',    # Kuning
            'delivered': '#43A047',     # Hijau
            'returned': '#E53935',      # Merah
            'failed': '#D32F2F',        # Merah tua
        }
        
        status_text = obj.get_status_display()
        status_color = colors.get(obj.status, '#000000')
        
        return format_html('<span style="color: {}; font-weight: bold;">{}</span>', status_color, status_text)
    
    def delivery_status(self, obj):
        if obj.actual_delivery:
            return format_html('<span style="color: #43A047; font-weight: bold;">Terkirim</span>')
        if obj.shipped_at:
            return format_html('<span style="color: #FF9800; font-weight: bold;">Dalam Perjalanan</span>')
        return format_html('<span style="color: #1976D2; font-weight: bold;">Menunggu</span>')
    
    order_number.short_description = 'Nomor Order'
    shipping_method_display.short_description = 'Metode Pengiriman'
    status_colored.short_description = 'Status'
    delivery_status.short_description = 'Status Pengiriman'

@admin.register(ShipmentTracking)
class ShipmentTrackingAdmin(admin.ModelAdmin):
    list_display = ('shipment_display', 'status_colored', 'location', 'description_short', 'timestamp')
    list_filter = ('status', 'timestamp')
    search_fields = ('shipment__order__order_number', 'shipment__tracking_number', 'location', 'description')
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Informasi Tracking', {
            'fields': ('shipment', 'status', 'location', 'description')
        }),
        ('Timestamps', {
            'fields': ('timestamp', 'created_at'),
        }),
    )
    
    def shipment_display(self, obj):
        if obj.shipment and obj.shipment.order:
            return f"Order #{obj.shipment.order.order_number}"
        return str(obj.shipment)
    
    def status_colored(self, obj):
        colors = {
            'pending': '#1976D2',       # Biru
            'processing': '#FB8C00',    # Oranye
            'in_transit': '#FF9800',    # Kuning
            'delivered': '#43A047',     # Hijau
            'returned': '#E53935',      # Merah
            'failed': '#D32F2F',        # Merah tua
        }
        
        status_text = obj.get_status_display()
        status_color = colors.get(obj.status, '#000000')
        
        return format_html('<span style="color: {}; font-weight: bold;">{}</span>', status_color, status_text)
    
    def description_short(self, obj):
        if obj.description:
            if len(obj.description) > 50:
                return obj.description[:50] + "..."
            return obj.description
        return "-"
    
    shipment_display.short_description = 'Pengiriman'
    status_colored.short_description = 'Status'
    description_short.short_description = 'Deskripsi'

@admin.register(ShippingConfiguration)
class ShippingConfigurationAdmin(admin.ModelAdmin):
    list_display = ('id', 'default_origin_city_display', 'min_order_free_shipping', 'flat_shipping_cost', 'use_flat_shipping')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Default Origin', {
            'fields': ('default_origin_province', 'default_origin_city')
        }),
        ('Pengaturan Biaya', {
            'fields': ('min_order_free_shipping', 'flat_shipping_cost', 'use_flat_shipping')
        }),
        ('Pengaturan Lainnya', {
            'fields': ('default_weight_per_item',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def default_origin_city_display(self, obj):
        if obj.default_origin_city:
            return f"{obj.default_origin_city.name}, {obj.default_origin_province.name}"
        return "-"
    
    default_origin_city_display.short_description = 'Default Origin'
    
    def has_add_permission(self, request):
        # Hanya boleh ada 1 instance
        return not ShippingConfiguration.objects.exists()
