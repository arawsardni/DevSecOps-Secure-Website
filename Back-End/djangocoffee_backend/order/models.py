import uuid
from django.db import models
from django.utils import timezone
from django.conf import settings
from product.models import Product
from address.models import Address

class Order(models.Model):
    STATUS_CHOICES = [
        ('new', 'Pesanan Baru'),
        ('processing', 'Sedang Diproses'),
        ('ready', 'Siap Diambil/Diantar'),
        ('completed', 'Selesai'),
        ('cancelled', 'Dibatalkan'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Menunggu Pembayaran'),
        ('paid', 'Sudah Dibayar'),
        ('failed', 'Gagal'),
        ('refunded', 'Dikembalikan'),
    ]
    
    DELIVERY_CHOICES = [
        ('pickup', 'Ambil Sendiri'),
        ('delivery', 'Antar ke Alamat'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=20, unique=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    delivery_method = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default='pickup')
    
    # Informasi pengiriman (jika delivery)
    delivery_address = models.ForeignKey(Address, on_delete=models.SET_NULL, related_name='orders', null=True, blank=True)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_notes = models.TextField(blank=True, null=True)
    
    # Informasi pickup (jika pickup)
    pickup_location = models.CharField(max_length=255, blank=True, null=True)
    pickup_time = models.DateTimeField(blank=True, null=True)
    
    # Informasi tambahan
    special_instructions = models.TextField(blank=True, null=True)
    estimated_delivery_time = models.DateTimeField(blank=True, null=True)
    points_earned = models.IntegerField(default=0)
    points_used = models.IntegerField(default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Timestamp
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Order #{self.order_number} - {self.get_status_display()}"
    
    def save(self, *args, **kwargs):
        # Generate order number jika belum ada
        if not self.order_number:
            last_order = Order.objects.order_by('-created_at').first()
            
            if last_order:
                # Jika ada order sebelumnya, tambahkan 1 ke nomor order terakhir
                last_number = int(last_order.order_number[3:])
                self.order_number = f"ORD{last_number + 1:07d}"
            else:
                # Jika tidak ada order sebelumnya, mulai dari 0000001
                self.order_number = "ORD0000001"
                
        super().save(*args, **kwargs)
    
    def get_total_items_count(self):
        return sum(item.quantity for item in self.items.all())
    
    def get_subtotal(self):
        return sum(item.get_total_price() for item in self.items.all())
    
    def get_total_with_delivery(self):
        return self.get_subtotal() + self.delivery_fee
    
    def get_final_total(self):
        total = self.get_total_with_delivery() - self.discount_amount
        return max(total, 0)  # Pastikan total tidak negatif
    
    def mark_as_paid(self):
        self.payment_status = 'paid'
        self.save()
    
    def mark_as_completed(self):
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()
        
        # Update poin user
        if self.points_earned > 0:
            self.user.points += self.points_earned
            self.user.total_spent += self.total_amount
            self.user.save()
    
    def cancel_order(self):
        self.status = 'cancelled'
        self.save()
        
        # Kembalikan stok produk
        for item in self.items.all():
            product = item.product
            product.stock += item.quantity
            product.save()
        
        # Kembalikan poin jika digunakan
        if self.points_used > 0:
            self.user.points += self.points_used
            self.user.save()

class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Harga saat pembelian
    size = models.CharField(max_length=2, choices=Product.SIZE_CHOICES, null=True, blank=True)
    special_instructions = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.quantity} x {self.product.name} - {self.get_size_display() or 'Default Size'}"
    
    def get_total_price(self):
        return self.price * self.quantity

class OrderPayment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Tunai'),
        ('credit_card', 'Kartu Kredit'),
        ('debit_card', 'Kartu Debit'),
        ('transfer', 'Transfer Bank'),
        ('e_wallet', 'E-Wallet'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    payment_date = models.DateTimeField(default=timezone.now)
    is_paid = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Payment for Order #{self.order.order_number} - {self.get_payment_method_display()}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        # Update status pembayaran di order
        if self.is_paid and self.order.payment_status != 'paid':
            self.order.mark_as_paid()

class OrderTracking(models.Model):
    STATUS_CHOICES = Order.STATUS_CHOICES
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='tracking')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    timestamp = models.DateTimeField(default=timezone.now)
    note = models.TextField(blank=True, null=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.order.order_number} - {self.get_status_display()} at {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
