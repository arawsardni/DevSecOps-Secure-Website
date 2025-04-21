import uuid
from django.db import models
from django.utils import timezone
from django.conf import settings

class Address(models.Model):
    """
    Model untuk menyimpan alamat pengiriman pengguna.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='addresses')
    
    # Field untuk kompatibilitas dengan table lama
    address_type = models.CharField(max_length=20, default="shipping", help_text="Tipe alamat")
    recipient_name = models.CharField(max_length=100, default="", help_text="Nama penerima")
    phone_number = models.CharField(max_length=20, default="", help_text="Nomor telepon penerima")
    address_line1 = models.CharField(max_length=255, default="", help_text="Alamat baris 1")
    address_line2 = models.CharField(max_length=255, default="", help_text="Alamat baris 2")
    city = models.CharField(max_length=100, default="", help_text="Kota")
    province = models.CharField(max_length=100, default="", help_text="Provinsi")
    postal_code = models.CharField(max_length=20, default="", help_text="Kode pos")
    
    # Field baru sesuai dengan frontend localStorage
    label = models.CharField(max_length=100, blank=True, help_text="Label/judul alamat")
    address = models.TextField(help_text="Alamat lengkap dalam text")
    note = models.TextField(blank=True, null=True, help_text="Catatan tambahan untuk alamat")
    coordinates = models.CharField(max_length=255, blank=True, null=True, help_text="Koordinat lokasi dalam format lat,lng")
    
    # Field yang dipertahankan
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_default', '-created_at']
        verbose_name = "Alamat"
        verbose_name_plural = "Alamat"
        db_table = 'user_shipping_address'  # Completely new table name
    
    def __str__(self):
        return f"{self.label or 'Alamat'} ({self.address[:30]}...)"
    
    def save(self, *args, **kwargs):
        # Jika alamat ini diatur sebagai default, hapus status default dari alamat lain
        if self.is_default:
            Address.objects.filter(user=self.user, is_default=True).update(is_default=False)
        
        # Jika tidak ada alamat lain, jadikan ini sebagai default
        if self.pk is None and not Address.objects.filter(user=self.user).exists():
            self.is_default = True
            
        super().save(*args, **kwargs)
