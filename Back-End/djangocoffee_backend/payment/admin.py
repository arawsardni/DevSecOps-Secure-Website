from django.contrib import admin
from django.utils.html import format_html
from .models import PaymentMethod, BankAccount, Payment, PaymentHistory

class BankAccountInline(admin.TabularInline):
    model = BankAccount
    extra = 0
    fields = ('bank_name', 'account_name', 'account_number', 'branch', 'is_active')

@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('name', 'method_type_display', 'status', 'admin_fee', 'is_featured')
    list_filter = ('method_type', 'status', 'is_featured')
    search_fields = ('name', 'description')
    inlines = [BankAccountInline]
    
    def method_type_display(self, obj):
        method_types = {
            'bank_transfer': '🏦 Transfer Bank',
            'qris': '📱 QRIS',
            'cash': '💵 Tunai',
        }
        return method_types.get(obj.method_type, obj.method_type)
    
    method_type_display.short_description = 'Tipe Metode'

class PaymentHistoryInline(admin.TabularInline):
    model = PaymentHistory
    extra = 0
    readonly_fields = ('status', 'timestamp', 'notes', 'updated_by')
    fields = ('status', 'timestamp', 'notes', 'updated_by')
    ordering = ('-timestamp',)
    can_delete = False

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('reference_id', 'order_number', 'user_name', 'payment_method_name', 
                    'total_amount', 'colored_status', 'created_at')
    list_filter = ('status', 'payment_method__method_type', 'created_at')
    search_fields = ('reference_id', 'order__order_number', 'user__name', 'user__email')
    inlines = [PaymentHistoryInline]
    readonly_fields = ('reference_id', 'created_at', 'updated_at', 'paid_at', 'expired_at')
    
    fieldsets = (
        ('Informasi Utama', {
            'fields': ('reference_id', 'user', 'order', 'payment_method')
        }),
        ('Detail Pembayaran', {
            'fields': ('amount', 'admin_fee', 'total_amount', 'status', 'payment_proof')
        }),
        ('Informasi Transfer Bank', {
            'fields': ('bank_account', 'bank_sender_name', 'bank_sender_number'),
            'classes': ('collapse',)
        }),
        ('Informasi QRIS', {
            'fields': ('qris_code', 'qris_id'),
            'classes': ('collapse',)
        }),
        ('Informasi Tunai', {
            'fields': ('cash_received', 'cash_change'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'paid_at', 'expired_at'),
            'classes': ('collapse',)
        }),
    )
    
    def order_number(self, obj):
        if obj.order:
            return obj.order.order_number
        return '-'
    
    def user_name(self, obj):
        return obj.user.name
    
    def payment_method_name(self, obj):
        if obj.payment_method:
            return obj.payment_method.name
        return '-'
    
    def colored_status(self, obj):
        status_colors = {
            'pending': '#1976D2',  # Biru
            'verifying': '#FB8C00',  # Oranye
            'paid': '#43A047',  # Hijau
            'failed': '#E53935',  # Merah
            'expired': '#757575',  # Abu-abu
            'refunded': '#8E24AA',  # Ungu
        }
        
        status_text = obj.get_status_display()
        status_color = status_colors.get(obj.status, '#000000')
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            status_color, status_text
        )
    
    order_number.short_description = 'Nomor Order'
    user_name.short_description = 'Pelanggan'
    payment_method_name.short_description = 'Metode Pembayaran'
    colored_status.short_description = 'Status'

@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ('bank_name', 'account_name', 'account_number', 'payment_method_name', 'is_active')
    list_filter = ('is_active', 'payment_method')
    search_fields = ('bank_name', 'account_name', 'account_number')
    
    def payment_method_name(self, obj):
        return obj.payment_method.name
    
    payment_method_name.short_description = 'Metode Pembayaran'

@admin.register(PaymentHistory)
class PaymentHistoryAdmin(admin.ModelAdmin):
    list_display = ('payment_reference', 'status', 'timestamp', 'notes_excerpt', 'updated_by_name')
    list_filter = ('status', 'timestamp')
    search_fields = ('payment__reference_id', 'notes')
    readonly_fields = ('payment', 'status', 'timestamp', 'notes', 'updated_by')
    
    def payment_reference(self, obj):
        return obj.payment.reference_id
    
    def notes_excerpt(self, obj):
        if obj.notes:
            return obj.notes[:50] + ('...' if len(obj.notes) > 50 else '')
        return '-'
    
    def updated_by_name(self, obj):
        if obj.updated_by:
            return obj.updated_by.name
        return '-'
    
    payment_reference.short_description = 'ID Pembayaran'
    notes_excerpt.short_description = 'Catatan'
    updated_by_name.short_description = 'Diupdate Oleh'
