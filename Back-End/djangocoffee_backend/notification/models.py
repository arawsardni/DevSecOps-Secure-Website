import uuid
from django.db import models
from django.utils import timezone
from django.conf import settings

class Notification(models.Model):
    """
    Model untuk menyimpan notifikasi kepada pengguna.
    """
    TYPE_CHOICES = [
        ('order', 'Pesanan'),
        ('promo', 'Promosi'),
        ('info', 'Informasi'),
        ('payment', 'Pembayaran'),
        ('system', 'Sistem'),
    ]
    
    PRIORITY_CHOICES = [
        ('high', 'Tinggi'),
        ('medium', 'Sedang'),
        ('low', 'Rendah'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=100)
    message = models.TextField()
    notification_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='info')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    # Link terkait (jika ada)
    related_url = models.CharField(max_length=255, blank=True, null=True)
    related_object_id = models.CharField(max_length=36, blank=True, null=True)
    related_object_type = models.CharField(max_length=50, blank=True, null=True)
    
    # Status notifikasi
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    
    # Pengaturan tampilan
    icon = models.CharField(max_length=50, blank=True, null=True)
    image_url = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Notifikasi"
        verbose_name_plural = "Notifikasi"
    
    def __str__(self):
        return f"{self.get_notification_type_display()}: {self.title}"
    
    def mark_as_read(self):
        """Menandai notifikasi sebagai telah dibaca."""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
    
    def is_expired(self):
        """Cek apakah notifikasi sudah kadaluarsa."""
        if self.expires_at and timezone.now() > self.expires_at:
            return True
        return False
    
    @classmethod
    def create_notification(cls, user, title, message, notification_type='info', priority='medium', **kwargs):
        """
        Metode bantuan untuk membuat notifikasi baru.
        """
        notification = cls(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority,
            **kwargs
        )
        notification.save()
        return notification
    
    @classmethod
    def create_system_notification(cls, user, title, message, **kwargs):
        """
        Membuat notifikasi sistem.
        """
        return cls.create_notification(
            user=user,
            title=title,
            message=message,
            notification_type='system',
            priority='medium',
            **kwargs
        )
    
    @classmethod
    def create_order_notification(cls, user, title, message, order_id, **kwargs):
        """
        Membuat notifikasi terkait pesanan.
        """
        return cls.create_notification(
            user=user,
            title=title,
            message=message,
            notification_type='order',
            priority='high',
            related_object_id=order_id,
            related_object_type='order',
            **kwargs
        )
    
    @classmethod
    def create_payment_notification(cls, user, title, message, payment_id, **kwargs):
        """
        Membuat notifikasi terkait pembayaran.
        """
        return cls.create_notification(
            user=user,
            title=title,
            message=message,
            notification_type='payment',
            priority='high',
            related_object_id=payment_id,
            related_object_type='payment',
            **kwargs
        )
    
    @classmethod
    def create_promo_notification(cls, user, title, message, promo_id=None, **kwargs):
        """
        Membuat notifikasi promosi.
        """
        return cls.create_notification(
            user=user,
            title=title,
            message=message,
            notification_type='promo',
            priority='medium',
            related_object_id=promo_id,
            related_object_type='promo' if promo_id else None,
            **kwargs
        )

class NotificationSettings(models.Model):
    """
    Model untuk menyimpan preferensi notifikasi pengguna.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_settings')
    
    # Pengaturan untuk jenis notifikasi
    order_notifications = models.BooleanField(default=True, help_text="Notifikasi terkait pesanan")
    promo_notifications = models.BooleanField(default=True, help_text="Notifikasi promosi dan diskon")
    payment_notifications = models.BooleanField(default=True, help_text="Notifikasi pembayaran")
    system_notifications = models.BooleanField(default=True, help_text="Notifikasi sistem")
    
    # Metode pengiriman
    email_notifications = models.BooleanField(default=True, help_text="Kirim notifikasi melalui email")
    push_notifications = models.BooleanField(default=True, help_text="Kirim notifikasi push")
    
    # Pengaturan frekuensi
    digest_notifications = models.BooleanField(default=False, help_text="Kirim notifikasi dalam bentuk ringkasan")
    digest_frequency = models.CharField(
        max_length=10, 
        choices=[('daily', 'Harian'), ('weekly', 'Mingguan')],
        default='daily',
        blank=True,
        null=True
    )
    
    # Pengaturan waktu tertentu
    quiet_hours_start = models.TimeField(blank=True, null=True, help_text="Waktu mulai jam tenang")
    quiet_hours_end = models.TimeField(blank=True, null=True, help_text="Waktu selesai jam tenang")
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Pengaturan Notifikasi"
        verbose_name_plural = "Pengaturan Notifikasi"
    
    def __str__(self):
        return f"Pengaturan Notifikasi untuk {self.user.email}"
    
    def should_send_notification(self, notification_type):
        """
        Cek apakah notifikasi dengan tipe tertentu harus dikirim atau tidak.
        """
        if notification_type == 'order':
            return self.order_notifications
        elif notification_type == 'promo':
            return self.promo_notifications
        elif notification_type == 'payment':
            return self.payment_notifications
        elif notification_type == 'system':
            return self.system_notifications
        else:
            return True  # Default jika tipe tidak dikenal
    
    def is_quiet_hours(self):
        """
        Cek apakah saat ini adalah jam tenang.
        """
        if not self.quiet_hours_start or not self.quiet_hours_end:
            return False
            
        now = timezone.localtime().time()
        if self.quiet_hours_start <= self.quiet_hours_end:
            # Periode jam tenang normal (misal: 22:00 - 06:00)
            return self.quiet_hours_start <= now <= self.quiet_hours_end
        else:
            # Periode jam tenang melewati tengah malam (misal: 22:00 - 06:00)
            return self.quiet_hours_start <= now or now <= self.quiet_hours_end
