from django.contrib import admin
from .models import Cart, CartItem

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ('get_total_price',)

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_display', 'is_active', 'get_cart_total', 'get_cart_items_count', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('user__email', 'session_id')
    inlines = [CartItemInline]
    readonly_fields = ('get_cart_total',)
    
    def user_display(self, obj):
        return obj.user.email if obj.user else f"Guest ({obj.session_id})"
    user_display.short_description = 'User'

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'cart', 'product', 'quantity', 'size', 'get_total_price', 'created_at')
    list_filter = ('created_at', 'size')
    search_fields = ('product__name', 'cart__user__email')
    readonly_fields = ('get_total_price',)
