import uuid
from django.db import models
from django.utils import timezone
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class ShippingProvider(models.Model):
    """
    Model untuk menyimpan informasi penyedia jasa pengiriman (seperti JNE, SiCepat, dll.)
    """
    STATUS_CHOICES = [
        ('active', 'Aktif'),
        ('inactive', 'Tidak Aktif'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    logo = models.ImageField(upload_to='shipping_logos/', blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    tracking_url_format = models.CharField(
        max_length=255, 
        blank=True, 
        null=True, 
        help_text="Format URL untuk tracking (misal: https://cekresi.com/?noresi={tracking_number})"
    )
    order_sequence = models.PositiveSmallIntegerField(default=0, help_text="Urutan tampilan provider")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order_sequence', 'name']
        verbose_name = "Penyedia Pengiriman"
        verbose_name_plural = "Penyedia Pengiriman"
    
    def __str__(self):
        return self.name
    
    def get_tracking_url(self, tracking_number):
        """
        Membuat URL tracking untuk nomor resi tertentu
        """
        if not self.tracking_url_format or not tracking_number:
            return None
        return self.tracking_url_format.format(tracking_number=tracking_number)

class ShippingMethod(models.Model):
    """
    Model untuk menyimpan metode pengiriman dari penyedia (seperti JNE REG, SiCepat BEST, dll.)
    """
    TYPE_CHOICES = [
        ('standard', 'Standar'),
        ('express', 'Ekspres'),
        ('instant', 'Instan'),
        ('same_day', 'Same Day'),
        ('next_day', 'Next Day'),
        ('cargo', 'Cargo'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Aktif'),
        ('inactive', 'Tidak Aktif'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.ForeignKey(ShippingProvider, on_delete=models.CASCADE, related_name='methods')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    description = models.TextField(blank=True, null=True)
    estimated_delivery_time = models.CharField(max_length=100, blank=True, null=True, help_text="Contoh: 1-2 hari")
    method_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='standard')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['provider__order_sequence', 'provider__name', 'name']
        verbose_name = "Metode Pengiriman"
        verbose_name_plural = "Metode Pengiriman"
        unique_together = ('provider', 'code')
    
    def __str__(self):
        return f"{self.provider.name} - {self.name}"

class ShippingRate(models.Model):
    """
    Model untuk menyimpan tarif pengiriman berdasarkan asal dan tujuan
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shipping_method = models.ForeignKey(ShippingMethod, on_delete=models.CASCADE, related_name='rates')
    
    # Simpan informasi origin dan destination sebagai string
    origin_location = models.CharField(max_length=255, help_text="Lokasi asal pengiriman")
    destination_location = models.CharField(max_length=255, help_text="Lokasi tujuan pengiriman")
    
    price = models.DecimalField(max_digits=10, decimal_places=2)
    min_weight = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    max_weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    price_per_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, help_text="Harga tambahan per kg jika melebihi min_weight")
    estimated_days_min = models.PositiveSmallIntegerField(default=1)
    estimated_days_max = models.PositiveSmallIntegerField(default=3)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Tarif Pengiriman"
        verbose_name_plural = "Tarif Pengiriman"
        unique_together = ('shipping_method', 'origin_location', 'destination_location', 'min_weight')
    
    def __str__(self):
        return f"{self.shipping_method} ({self.origin_location} - {self.destination_location})"
    
    def calculate_price(self, weight_in_kg):
        """
        Menghitung tarif pengiriman berdasarkan berat
        """
        if weight_in_kg <= self.min_weight:
            return self.price
        
        if self.max_weight and weight_in_kg > self.max_weight:
            return None  # Melebihi batas maksimum
        
        extra_weight = weight_in_kg - self.min_weight
        extra_cost = extra_weight * self.price_per_kg
        return self.price + extra_cost

class Shipment(models.Model):
    """
    Model untuk menyimpan data pengiriman untuk order
    """
    STATUS_CHOICES = [
        ('pending', 'Menunggu Pengiriman'),
        ('processing', 'Sedang Diproses'),
        ('in_transit', 'Dalam Pengiriman'),
        ('delivered', 'Terkirim'),
        ('returned', 'Dikembalikan'),
        ('failed', 'Gagal'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField('order.Order', on_delete=models.CASCADE, related_name='shipment')
    shipping_method = models.ForeignKey(ShippingMethod, on_delete=models.SET_NULL, null=True, related_name='shipments')
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True)
    
    # Informasi waktu pengiriman
    shipped_at = models.DateTimeField(blank=True, null=True)
    estimated_delivery = models.DateTimeField(blank=True, null=True)
    actual_delivery = models.DateTimeField(blank=True, null=True)
    
    # Detail biaya
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2)
    insurance_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Detail berat
    weight = models.DecimalField(max_digits=6, decimal_places=2, help_text="Berat dalam kg")
    
    # Timestamp
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Pengiriman"
        verbose_name_plural = "Pengiriman"
    
    def __str__(self):
        return f"Pengiriman untuk Order #{self.order.order_number}"
    
    def save(self, *args, **kwargs):
        # Hitung total cost
        self.total_cost = self.shipping_cost + self.insurance_cost
        super().save(*args, **kwargs)
    
    def get_tracking_url(self):
        """
        Mendapatkan URL tracking berdasarkan provider
        """
        if not self.tracking_number or not self.shipping_method or not self.shipping_method.provider:
            return None
        return self.shipping_method.provider.get_tracking_url(self.tracking_number)
        
class ShipmentTracking(models.Model):
    """
    Model untuk menyimpan log/tracking pengiriman
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='tracking_logs')
    status = models.CharField(max_length=20, choices=Shipment.STATUS_CHOICES)
    location = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Tracking Pengiriman"
        verbose_name_plural = "Tracking Pengiriman"
    
    def __str__(self):
        return f"{self.shipment.tracking_number} - {self.get_status_display()}"

class ShippingConfiguration(models.Model):
    """
    Model untuk konfigurasi pengiriman global
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    default_origin_location = models.CharField(max_length=255, blank=True, null=True, help_text="Lokasi asal pengiriman default")
    min_order_free_shipping = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, help_text="Jumlah minimum order untuk mendapatkan pengiriman gratis (0 untuk menonaktifkan)")
    flat_shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, help_text="Biaya pengiriman flat jika tidak menggunakan perhitungan otomatis")
    use_flat_shipping = models.BooleanField(default=False, help_text="Gunakan biaya pengiriman flat alih-alih perhitungan otomatis")
    default_weight_per_item = models.DecimalField(max_digits=5, decimal_places=2, default=0.5, help_text="Berat default per item dalam kg")
    
    # Timestamp
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Konfigurasi Pengiriman"
        verbose_name_plural = "Konfigurasi Pengiriman"
    
    def __str__(self):
        return "Konfigurasi Pengiriman"
    
    def save(self, *args, **kwargs):
        # Pastikan hanya ada 1 instance
        if not self.pk and ShippingConfiguration.objects.exists():
            # Update instance yang sudah ada jika instance baru dibuat
            existing = ShippingConfiguration.objects.first()
            if 'default_origin_location' in kwargs:
                existing.default_origin_location = self.default_origin_location
            if 'min_order_free_shipping' in kwargs:
                existing.min_order_free_shipping = self.min_order_free_shipping
            if 'flat_shipping_cost' in kwargs:
                existing.flat_shipping_cost = self.flat_shipping_cost
            if 'use_flat_shipping' in kwargs:
                existing.use_flat_shipping = self.use_flat_shipping
            if 'default_weight_per_item' in kwargs:
                existing.default_weight_per_item = self.default_weight_per_item
            existing.save()
            return existing
        return super().save(*args, **kwargs)
    
    @classmethod
    def get_instance(cls):
        """
        Mendapatkan atau membuat instance konfigurasi
        """
        try:
            return cls.objects.first()
        except cls.DoesNotExist:
            return cls.objects.create()
