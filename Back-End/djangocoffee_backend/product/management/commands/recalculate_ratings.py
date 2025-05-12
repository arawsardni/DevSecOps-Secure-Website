from django.core.management.base import BaseCommand
from django.db.models import Avg
from product.models import Product
from review.models import Review

class Command(BaseCommand):
    help = 'Recalculate all product ratings based on approved reviews'

    def handle(self, *args, **options):
        products = Product.objects.all()
        self.stdout.write(f"Found {products.count()} products to process")
        
        updated_count = 0
        zero_count = 0
        
        for product in products:
            # Cek apakah ada review untuk produk ini
            reviews = Review.objects.filter(product=product, is_approved=True)
            if reviews.exists():
                # Hitung rata-rata rating dari review yang disetujui
                avg_rating = reviews.aggregate(avg=Avg('rating'))['avg'] or 0.0
                old_rating = product.rating
                
                # Update rating produk
                product.rating = round(float(avg_rating), 1)
                product.save(update_fields=['rating'])
                
                # Catat hasil
                self.stdout.write(
                    f"Product '{product.name}' rating updated from {old_rating} to {product.rating} "
                    f"based on {reviews.count()} reviews"
                )
                updated_count += 1
            else:
                # Jika tidak ada review, atur rating ke 0
                if product.rating != 0:
                    product.rating = 0
                    product.save(update_fields=['rating'])
                    self.stdout.write(f"Product '{product.name}' has no reviews, rating reset to 0")
                    zero_count += 1
        
        self.stdout.write(self.style.SUCCESS(
            f"Successfully recalculated ratings for {updated_count} products. "
            f"Reset {zero_count} products to zero rating due to no reviews."
        )) 