from django.contrib import admin
from django.utils.html import format_html
from .models import Order, OrderItem, OrderPayment, OrderTracking

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('get_total_price',)
    
class OrderTrackingInline(admin.TabularInline):
    model = OrderTracking
    extra = 1
    readonly_fields = ('timestamp',)
    
class OrderPaymentInline(admin.StackedInline):
    model = OrderPayment
    extra = 0
    
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'user_email', 'status_colored', 'payment_status_colored', 
                    'delivery_method', 'total_amount', 'created_at')
    list_filter = ('status', 'payment_status', 'delivery_method', 'created_at')
    search_fields = ('order_number', 'user__email', 'delivery_address')
    inlines = [OrderItemInline, OrderPaymentInline, OrderTrackingInline]
    readonly_fields = ('order_number', 'created_at', 'updated_at', 'completed_at')
    fieldsets = (
        ('Informasi Pesanan', {
            'fields': ('order_number', 'user', 'total_amount', 'status', 'payment_status')
        }),
        ('Metode Pengiriman', {
            'fields': ('delivery_method', 'delivery_address', 'delivery_fee', 'delivery_notes',
                      'pickup_location', 'pickup_time', 'estimated_delivery_time')
        }),
        ('Informasi Diskon & Poin', {
            'fields': ('points_earned', 'points_used', 'discount_amount')
        }),
        ('Instruksi Tambahan', {
            'fields': ('special_instructions',)
        }),
        ('Timestamp', {
            'fields': ('created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'
    
    def status_colored(self, obj):
        colors = {
            'new': 'blue',
            'processing': 'orange',
            'ready': 'purple',
            'completed': 'green',
            'cancelled': 'red',
        }
        return format_html(
            '<span style="color: {};">{}</span>',
            colors.get(obj.status, 'black'),
            obj.get_status_display()
        )
    status_colored.short_description = 'Status'
    
    def payment_status_colored(self, obj):
        colors = {
            'pending': 'orange',
            'paid': 'green',
            'failed': 'red',
            'refunded': 'purple',
        }
        return format_html(
            '<span style="color: {};">{}</span>',
            colors.get(obj.payment_status, 'black'),
            obj.get_payment_status_display()
        )
    payment_status_colored.short_description = 'Status Pembayaran'
    
    actions = ['mark_as_processing', 'mark_as_ready', 'mark_as_completed', 'mark_as_cancelled']
    
    def mark_as_processing(self, request, queryset):
        for order in queryset:
            order.status = 'processing'
            order.save()
            OrderTracking.objects.create(
                order=order,
                status='processing',
                updated_by=request.user if request.user.is_authenticated else None,
                note='Status diubah melalui admin panel'
            )
        self.message_user(request, f"{queryset.count()} pesanan telah diubah statusnya menjadi 'Sedang Diproses'.")
    mark_as_processing.short_description = 'Ubah status menjadi Sedang Diproses'
    
    def mark_as_ready(self, request, queryset):
        for order in queryset:
            order.status = 'ready'
            order.save()
            OrderTracking.objects.create(
                order=order,
                status='ready',
                updated_by=request.user if request.user.is_authenticated else None,
                note='Status diubah melalui admin panel'
            )
        self.message_user(request, f"{queryset.count()} pesanan telah diubah statusnya menjadi 'Siap Diambil/Diantar'.")
    mark_as_ready.short_description = 'Ubah status menjadi Siap Diambil/Diantar'
    
    def mark_as_completed(self, request, queryset):
        for order in queryset:
            order.mark_as_completed()
            OrderTracking.objects.create(
                order=order,
                status='completed',
                updated_by=request.user if request.user.is_authenticated else None,
                note='Pesanan diselesaikan melalui admin panel'
            )
        self.message_user(request, f"{queryset.count()} pesanan telah diselesaikan.")
    mark_as_completed.short_description = 'Selesaikan pesanan'
    
    def mark_as_cancelled(self, request, queryset):
        for order in queryset:
            order.cancel_order()
            OrderTracking.objects.create(
                order=order,
                status='cancelled',
                updated_by=request.user if request.user.is_authenticated else None,
                note='Pesanan dibatalkan melalui admin panel'
            )
        self.message_user(request, f"{queryset.count()} pesanan telah dibatalkan.")
    mark_as_cancelled.short_description = 'Batalkan pesanan'

@admin.register(OrderPayment)
class OrderPaymentAdmin(admin.ModelAdmin):
    list_display = ('order_link', 'payment_method', 'amount', 'is_paid', 'payment_date')
    list_filter = ('payment_method', 'is_paid', 'payment_date')
    search_fields = ('order__order_number', 'transaction_id')
    
    def order_link(self, obj):
        return format_html(
            '<a href="{}">{}</a>',
            f'/admin/order/order/{obj.order.id}/change/',
            obj.order.order_number
        )
    order_link.short_description = 'Order'

@admin.register(OrderTracking)
class OrderTrackingAdmin(admin.ModelAdmin):
    list_display = ('order_link', 'status', 'timestamp', 'updated_by')
    list_filter = ('status', 'timestamp')
    search_fields = ('order__order_number', 'note')
    
    def order_link(self, obj):
        return format_html(
            '<a href="{}">{}</a>',
            f'/admin/order/order/{obj.order.id}/change/',
            obj.order.order_number
        )
    order_link.short_description = 'Order'
