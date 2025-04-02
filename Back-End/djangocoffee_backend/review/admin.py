from django.contrib import admin
from django.utils.html import format_html
from .models import Review, ReviewLike, ReviewImage

class ReviewImageInline(admin.TabularInline):
    model = ReviewImage
    extra = 1
    readonly_fields = ('image_preview',)
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="150" height="150" />', obj.image.url)
        return "Tidak ada gambar"
    image_preview.short_description = 'Preview'

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user_email', 'product_name', 'rating_stars', 'is_approved', 'is_featured', 'likes_count', 'created_at')
    list_filter = ('rating', 'is_approved', 'is_featured', 'created_at')
    search_fields = ('user__email', 'product__name', 'comment')
    readonly_fields = ('created_at', 'updated_at', 'likes_count')
    inlines = [ReviewImageInline]
    actions = ['approve_reviews', 'unapprove_reviews', 'feature_reviews', 'unfeature_reviews']
    
    fieldsets = (
        ('Informasi Dasar', {
            'fields': ('user', 'product', 'rating')
        }),
        ('Konten Review', {
            'fields': ('comment',)
        }),
        ('Status', {
            'fields': ('is_approved', 'is_featured', 'likes_count')
        }),
        ('Timestamp', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'
    
    def product_name(self, obj):
        return obj.product.name
    product_name.short_description = 'Product'
    
    def rating_stars(self, obj):
        stars = '★' * obj.rating + '☆' * (5 - obj.rating)
        return format_html('<span style="color: gold;">{}</span>', stars)
    rating_stars.short_description = 'Rating'
    
    def approve_reviews(self, request, queryset):
        updated = queryset.update(is_approved=True)
        self.message_user(request, f'{updated} review berhasil disetujui.')
    approve_reviews.short_description = 'Setujui review yang dipilih'
    
    def unapprove_reviews(self, request, queryset):
        updated = queryset.update(is_approved=False)
        self.message_user(request, f'{updated} review berhasil ditolak.')
    unapprove_reviews.short_description = 'Tolak review yang dipilih'
    
    def feature_reviews(self, request, queryset):
        updated = queryset.update(is_featured=True)
        self.message_user(request, f'{updated} review berhasil dijadikan unggulan.')
    feature_reviews.short_description = 'Jadikan review unggulan'
    
    def unfeature_reviews(self, request, queryset):
        updated = queryset.update(is_featured=False)
        self.message_user(request, f'{updated} review berhasil dihapus dari unggulan.')
    unfeature_reviews.short_description = 'Hapus dari review unggulan'

@admin.register(ReviewLike)
class ReviewLikeAdmin(admin.ModelAdmin):
    list_display = ('review_id', 'user_email', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('review__id', 'user__email')
    readonly_fields = ('created_at',)
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'
    
    def review_id(self, obj):
        return obj.review.id
    review_id.short_description = 'Review ID'

@admin.register(ReviewImage)
class ReviewImageAdmin(admin.ModelAdmin):
    list_display = ('review_id', 'image_preview', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('review__id',)
    readonly_fields = ('image_preview', 'created_at')
    
    def review_id(self, obj):
        return obj.review.id
    review_id.short_description = 'Review ID'
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="100" height="100" />', obj.image.url)
        return "Tidak ada gambar"
    image_preview.short_description = 'Preview'
