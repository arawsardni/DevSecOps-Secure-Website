import uuid
from django.db import models
from django.utils import timezone
from django.conf import settings

class Address(models.Model):
    """
    Model untuk menyimpan alamat pengiriman pengguna.
    """
    ADDRESS_TYPE_CHOICES = [
        ('home', 'Rumah'),
        ('office', 'Kantor'),
        ('other', 'Lainnya'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='addresses')
    address_type = models.CharField(max_length=10, choices=ADDRESS_TYPE_CHOICES, default='home')
    
    # Detail alamat
    recipient_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    province = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    
    # Detail tambahan
    label = models.CharField(max_length=100, blank=True, help_text="Label khusus untuk alamat (opsional)")
    is_default = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True, help_text="Catatan tambahan untuk pengiriman")
    
    # Informasi geolokasi
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Timestamp
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_default', '-created_at']
        verbose_name = "Alamat"
        verbose_name_plural = "Alamat"
    
    def __str__(self):
        return f"{self.recipient_name} - {self.get_address_type_display()} ({self.city})"
    
    def save(self, *args, **kwargs):
        # Jika alamat ini diatur sebagai default, hapus status default dari alamat lain
        if self.is_default:
            Address.objects.filter(user=self.user, is_default=True).update(is_default=False)
        
        # Jika tidak ada alamat lain, jadikan ini sebagai default
        if self.pk is None and not Address.objects.filter(user=self.user).exists():
            self.is_default = True
            
        super().save(*args, **kwargs)
    
    def get_full_address(self):
        """
        Mengembalikan alamat lengkap dalam satu string.
        """
        address = f"{self.address_line1}"
        if self.address_line2:
            address += f", {self.address_line2}"
        address += f", {self.city}, {self.province}, {self.postal_code}"
        return address

class Province(models.Model):
    """
    Model untuk menyimpan daftar provinsi di Indonesia.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = "Provinsi"
        verbose_name_plural = "Provinsi"
    
    def __str__(self):
        return self.name

class City(models.Model):
    """
    Model untuk menyimpan daftar kota/kabupaten di Indonesia.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    province = models.ForeignKey(Province, on_delete=models.CASCADE, related_name='cities')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10)
    postal_code = models.CharField(max_length=10, blank=True, null=True)
    
    class Meta:
        ordering = ['province__name', 'name']
        verbose_name = "Kota/Kabupaten"
        verbose_name_plural = "Kota/Kabupaten"
        unique_together = ('province', 'name')
    
    def __str__(self):
        return f"{self.name}, {self.province.name}"
