import uuid
from django.db import models
from django.utils import timezone
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from product.models import Product

class Review(models.Model):
    """
    Model untuk menyimpan ulasan dan rating untuk produk.
    """
    RATING_CHOICES = [
        (1, '1 - Sangat Buruk'),
        (2, '2 - Buruk'),
        (3, '3 - Biasa'),
        (4, '4 - Baik'),
        (5, '5 - Sangat Baik'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(choices=RATING_CHOICES, validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Fields untuk moderasi review
    is_approved = models.BooleanField(default=True)  # Default disetujui, dapat diubah jika moderasi diperlukan
    is_featured = models.BooleanField(default=False)  # Untuk menampilkan review unggulan
    
    # Utilitas untuk mencatat interaksi dengan review
    likes_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-created_at']
        # Memastikan satu user hanya dapat memberikan satu review per produk
        unique_together = ('user', 'product')
    
    def __str__(self):
        return f"Review by {self.user.email} for {self.product.name} - {self.get_rating_display()}"
    
    def save(self, *args, **kwargs):
        # Periksa apakah ini adalah review baru (belum ada di database)
        is_new = self.pk is None
        
        super().save(*args, **kwargs)
        
        # Update rating produk jika review baru atau rating berubah
        if is_new:
            self.product.update_rating(self.rating)

class ReviewLike(models.Model):
    """
    Model untuk menyimpan likes pada review.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('review', 'user')
    
    def __str__(self):
        return f"Like by {self.user.email} on review {self.review.id}"
    
    def save(self, *args, **kwargs):
        # Periksa apakah ini adalah like baru (belum ada di database)
        is_new = self.pk is None
        
        super().save(*args, **kwargs)
        
        # Update like count pada review
        if is_new:
            self.review.likes_count += 1
            self.review.save(update_fields=['likes_count'])
    
    def delete(self, *args, **kwargs):
        # Update like count pada review
        self.review.likes_count = max(0, self.review.likes_count - 1)
        self.review.save(update_fields=['likes_count'])
        
        super().delete(*args, **kwargs)

class ReviewImage(models.Model):
    """
    Model untuk menyimpan gambar pada review.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='reviews/')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Image for review {self.review.id}"
