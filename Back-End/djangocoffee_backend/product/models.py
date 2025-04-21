import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
import logging
from django.db.models import Avg

# Set up logger
logger = logging.getLogger(__name__)

class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Categories"

class Product(models.Model):
    SIZE_CHOICES = [
        ('S', 'Small'),
        ('M', 'Medium'),
        ('L', 'Large'),
        ('XL', 'Extra Large'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    size = models.CharField(max_length=2, choices=SIZE_CHOICES, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="products")
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    is_available = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_bestseller = models.BooleanField(default=False)
    stock = models.IntegerField(default=0)
    calories = models.IntegerField(null=True, blank=True)
    preparation_time = models.IntegerField(help_text="Preparation time in minutes", null=True, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    total_sold = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def image_url(self):
        if self.image and hasattr(self.image, 'url'):
            url = f'{settings.WEBSITE_URL}{self.image.url}'
            logger.debug(f"Using actual image URL for {self.name}: {url}")
            return url
        
        # Fallback untuk gambar
        if self.category:
            # Format nama kategori sesuai dengan folder di frontend
            category_folder = self.category.name.replace(" ", "")
            # Format nama produk untuk URL
            product_name = self.name.replace(" ", "").replace("/", "-")
            fallback_url = f'/Menu/{category_folder}/{product_name}.jpg'
            logger.debug(f"Category: {self.category.name}, Category Folder: {category_folder}, Product Name: {product_name}")
        else:
            product_name = self.name.replace(" ", "").replace("/", "-")
            fallback_url = f'/Menu/default/{product_name}.jpg'
            logger.debug(f"No category, Product Name: {product_name}")
        
        logger.debug(f"Final fallback URL for {self.name}: {fallback_url}")
        return fallback_url
    
    def __str__(self):
        return self.name

    def update_stock(self, quantity):
        self.stock -= quantity
        self.total_sold += quantity
        self.save()

    def update_rating(self, new_rating):
        # Import di dalam metode untuk menghindari circular import
        from review.models import Review
        import traceback
        
        print(f"===== START update_rating for product {self.name} =====")
        print(f"Product current rating: {self.rating}, total_sold: {self.total_sold}")
        print(f"New rating being applied: {new_rating}")
        
        # Cara 1: Gunakan nilai baru langsung jika ini review pertama
        if self.total_sold == 0:
            print(f"Using direct rating as this appears to be first review")
            self.rating = float(new_rating)
            self.save(update_fields=['rating'])
            print(f"Updated product rating to {self.rating}")
            return
            
        # Cara 2: Hitung ulang rata-rata dari semua review
        # Ini lebih akurat daripada perkiraan berdasarkan total_sold
        try:
            # Cek jumlah review untuk produk ini
            review_count = Review.objects.filter(product=self, is_approved=True).count()
            print(f"Found {review_count} approved reviews for this product")
            
            # Ambil semua rating untuk verifikasi
            all_reviews = Review.objects.filter(product=self, is_approved=True)
            ratings_list = [r.rating for r in all_reviews]
            print(f"All ratings: {ratings_list}")
            
            # Hitung rata-rata
            avg_rating = Review.objects.filter(
                product=self,
                is_approved=True
            ).aggregate(avg=Avg('rating'))['avg'] or 0.0
            
            print(f"Calculated average rating: {avg_rating}")
            
            # Update rating dengan nilai yang dihitung
            old_rating = self.rating
            self.rating = round(float(avg_rating), 1)
            self.save(update_fields=['rating'])
            
            # Log untuk debugging
            print(f"Updated product rating from {old_rating} to {self.rating} based on reviews")
        except Exception as e:
            # Cetak stack trace lengkap untuk debugging
            print(f"Error in update_rating: {str(e)}")
            traceback.print_exc()
            
            # Jika gagal, gunakan pendekatan fallback dengan perkiraan
            current_total = float(self.rating) * self.total_sold
            old_rating = self.rating
            self.rating = round((current_total + float(new_rating)) / (self.total_sold + 1), 1)
            self.save(update_fields=['rating'])
            print(f"Used fallback method to update rating from {old_rating} to {self.rating}")
        
        print(f"===== END update_rating for product {self.name} =====")