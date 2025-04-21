from django.contrib import admin

from .models import Product, Category

# Register your models here.
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'is_active', 'created_at')
    search_fields = ('name',)
    list_filter = ('is_active',)

class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'category', 'is_available', 'is_bestseller', 'is_featured', 'stock', 'total_sold')
    search_fields = ('name', 'description')
    list_filter = ('category', 'is_available', 'is_bestseller', 'is_featured')
        
admin.site.register(Category, CategoryAdmin)
admin.site.register(Product, ProductAdmin)