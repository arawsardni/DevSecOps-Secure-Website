import uuid
from django.db import models
from django.utils import timezone
from django.conf import settings

class PaymentMethod(models.Model):
    METHOD_TYPES = [
        ('bank_transfer', 'Transfer Bank'),
        ('qris', 'QRIS'),
        ('cash', 'Tunai'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Aktif'),
        ('inactive', 'Tidak Aktif'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    method_type = models.CharField(max_length=20, choices=METHOD_TYPES)
    description = models.TextField(blank=True, null=True)
    icon = models.ImageField(upload_to='payment_icons/', blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    admin_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['-is_featured', 'name']

class BankAccount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.CASCADE, related_name='bank_accounts')
    bank_name = models.CharField(max_length=100)
    account_name = models.CharField(max_length=150)
    account_number = models.CharField(max_length=50)
    branch = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.bank_name} - {self.account_number}"

class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Menunggu Pembayaran'),
        ('verifying', 'Verifikasi Pembayaran'),
        ('paid', 'Pembayaran Berhasil'),
        ('failed', 'Pembayaran Gagal'),
        ('expired', 'Kedaluwarsa'),
        ('refunded', 'Dikembalikan'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    order = models.OneToOneField('order.Order', on_delete=models.CASCADE, related_name='detailed_payment')
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    admin_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    reference_id = models.CharField(max_length=100, unique=True)
    payment_proof = models.ImageField(upload_to='payment_proofs/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Fields untuk pembayaran transfer bank
    bank_account = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True)
    bank_sender_name = models.CharField(max_length=150, blank=True, null=True)
    bank_sender_number = models.CharField(max_length=50, blank=True, null=True)
    
    # Fields untuk QRIS
    qris_code = models.ImageField(upload_to='qris_codes/', blank=True, null=True)
    qris_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Fields untuk pembayaran tunai
    cash_received = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cash_change = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    expired_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Payment {self.reference_id} - {self.get_status_display()}"
    
    def save(self, *args, **kwargs):
        # Generate reference ID jika belum ada
        if not self.reference_id:
            timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
            random_suffix = uuid.uuid4().hex[:4].upper()
            self.reference_id = f"PAY-{timestamp}-{random_suffix}"
            
        # Set expired_at jika belum ada (24 jam dari created_at)
        if not self.expired_at and self.status == 'pending':
            self.expired_at = self.created_at + timezone.timedelta(hours=24)
            
        # Hitung total amount
        self.total_amount = self.amount + self.admin_fee
            
        # Update paid_at jika status berubah menjadi paid
        if self.status == 'paid' and not self.paid_at:
            self.paid_at = timezone.now()
            
        super().save(*args, **kwargs)
        
        # Update order payment status jika pembayaran berhasil
        if self.status == 'paid' and self.order.payment_status != 'paid':
            self.order.payment_status = 'paid'
            self.order.status = 'processing'  # Otomatis update order ke processing
            self.order.save()
    
    def is_expired(self):
        """Cek apakah pembayaran sudah kedaluwarsa"""
        return self.expired_at and timezone.now() > self.expired_at
    
    def verify_payment(self):
        """Verifikasi pembayaran (hanya simulasi)"""
        self.status = 'verifying'
        self.save()
    
    def confirm_payment(self):
        """Konfirmasi pembayaran berhasil"""
        self.status = 'paid'
        self.save()
    
    def reject_payment(self, reason=None):
        """Tolak pembayaran"""
        self.status = 'failed'
        self.save()
        
        # Tambahkan catatan penolakan
        if reason:
            PaymentHistory.objects.create(
                payment=self,
                status=self.status,
                notes=f"Pembayaran ditolak: {reason}"
            )
    
    def refund_payment(self):
        """Pengembalian dana"""
        self.status = 'refunded'
        self.save()

class PaymentHistory(models.Model):
    """Model untuk menyimpan riwayat perubahan status pembayaran"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='history')
    status = models.CharField(max_length=20, choices=Payment.STATUS_CHOICES)
    timestamp = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True, null=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return f"Payment {self.payment.reference_id} - {self.get_status_display()}"
    
    class Meta:
        ordering = ['-timestamp']
