import uuid
from django.db import models
from django.utils import timezone
from django.conf import settings
from product.models import Product

class Cart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="carts", null=True, blank=True)
    session_id = models.CharField(max_length=255, null=True, blank=True)  # Untuk guest users
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Cart {self.id} - {'Guest' if self.user is None else self.user.email}"
    
    def get_cart_total(self):
        """Menghitung total harga semua item di keranjang"""
        return sum(item.get_total_price() for item in self.items.all())
    
    def get_cart_items_count(self):
        """Menghitung jumlah item di keranjang"""
        return self.items.count()
    
    def clear(self):
        """Menghapus semua item dari keranjang"""
        self.items.all().delete()
    
    def transfer_cart_items(self, user):
        """Memindahkan item dari cart guest ke cart user ketika login"""
        self.user = user
        self.save()

class CartItem(models.Model):
    SUGAR_CHOICES = [
        ('normal', 'Normal'),
        ('less', 'Less Sugar'),
        ('no', 'No Sugar'),
    ]
    
    ICE_CHOICES = [
        ('normal', 'Normal'),
        ('less', 'Less Ice'),
        ('no', 'No Ice'),
        ('hot', 'Hot'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    size = models.CharField(max_length=2, choices=Product.SIZE_CHOICES, null=True, blank=True)
    
    # Field tambahan untuk menyimpan data dari localStorage
    sugar = models.CharField(max_length=20, choices=SUGAR_CHOICES, default='normal', null=True, blank=True)
    ice = models.CharField(max_length=20, choices=ICE_CHOICES, default='normal', null=True, blank=True)
    shots = models.PositiveIntegerField(default=0, null=True, blank=True)
    
    special_instructions = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('cart', 'product', 'size')  # Mencegah duplikasi item dengan ukuran yang sama
    
    def __str__(self):
        return f"{self.quantity} x {self.product.name} - {self.get_size_display() or 'Default Size'}"
    
    def get_total_price(self):
        """Menghitung total harga untuk item ini (harga × kuantitas)"""
        if self.product is None or self.product.price is None or self.quantity is None:
            return 0
        return self.product.price * self.quantity
    
    def update_quantity(self, quantity):
        """Update kuantitas item"""
        if quantity > 0:
            self.quantity = quantity
            self.save()
        else:
            self.delete()
