from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from django.db import transaction

from order.models import Order, OrderPayment
from useraccount.models import User
from .models import NotificationSettings

@receiver(post_save, sender=User)
def create_notification_settings(sender, instance, created, **kwargs):
    """
    Buat pengaturan notifikasi default ketika user baru dibuat.
    """
    if created:
        NotificationSettings.objects.create(user=instance)

@receiver(post_save, sender=Order)
def create_order_notification(sender, instance, created, **kwargs):
    """
    Buat notifikasi ketika status order berubah.
    """
    from .models import Notification  # Import di sini untuk menghindari circular import
    
    # Hanya buat notifikasi jika ini bukan order baru
    if not created and hasattr(instance, '_original_status') and instance._original_status != instance.status:
        # Status berubah, buat notifikasi
        if instance.status == 'processing':
            title = "Pesanan Anda sedang diproses"
            message = f"Pesanan #{instance.order_number} sedang disiapkan oleh barista kami."
        elif instance.status == 'ready':
            title = "Pesanan Anda siap"
            if instance.delivery_method == 'pickup':
                message = f"Pesanan #{instance.order_number} siap untuk diambil di lokasi pickup."
            else:
                message = f"Pesanan #{instance.order_number} sedang dalam perjalanan pengiriman."
        elif instance.status == 'completed':
            title = "Pesanan Anda telah selesai"
            message = f"Terima kasih telah berbelanja! Pesanan #{instance.order_number} telah selesai."
        elif instance.status == 'cancelled':
            title = "Pesanan Anda dibatalkan"
            message = f"Pesanan #{instance.order_number} telah dibatalkan."
        else:
            return  # Tidak perlu notifikasi untuk status lain
        
        with transaction.atomic():
            # Periksa preferensi notifikasi pengguna
            try:
                settings = NotificationSettings.objects.get(user=instance.user)
                if not settings.order_notifications:
                    return  # User menonaktifkan notifikasi pesanan
            except NotificationSettings.DoesNotExist:
                pass  # Lanjutkan dengan pengaturan default
            
            # Buat notifikasi
            Notification.create_order_notification(
                user=instance.user,
                title=title,
                message=message,
                order_id=str(instance.id)
            )

@receiver(post_save, sender=OrderPayment)
def create_payment_notification(sender, instance, created, **kwargs):
    """
    Buat notifikasi ketika status pembayaran berubah.
    """
    from .models import Notification  # Import di sini untuk menghindari circular import
    
    # Hanya buat notifikasi untuk perubahan status pembayaran
    if not created and hasattr(instance, '_original_is_paid') and instance._original_is_paid != instance.is_paid:
        with transaction.atomic():
            # Periksa preferensi notifikasi pengguna
            try:
                settings = NotificationSettings.objects.get(user=instance.order.user)
                if not settings.payment_notifications:
                    return  # User menonaktifkan notifikasi pembayaran
            except NotificationSettings.DoesNotExist:
                pass  # Lanjutkan dengan pengaturan default
            
            # Buat notifikasi untuk pembayaran berhasil
            if instance.is_paid:
                Notification.create_payment_notification(
                    user=instance.order.user,
                    title="Pembayaran Anda berhasil",
                    message=f"Pembayaran untuk pesanan #{instance.order.order_number} telah berhasil diproses. Terima kasih!",
                    payment_id=str(instance.id)
                )
                
# Simpan status original untuk digunakan di signal handler
@receiver(post_save, sender=Order)
def store_original_order_status(sender, instance, **kwargs):
    """
    Menyimpan status order original untuk perbandingan di signal handlers.
    """
    try:
        instance._original_status = Order.objects.get(pk=instance.pk).status
    except Order.DoesNotExist:
        instance._original_status = None

@receiver(post_save, sender=OrderPayment)
def store_original_payment_status(sender, instance, **kwargs):
    """
    Menyimpan status pembayaran original untuk perbandingan di signal handlers.
    """
    try:
        instance._original_is_paid = OrderPayment.objects.get(pk=instance.pk).is_paid
    except OrderPayment.DoesNotExist:
        instance._original_is_paid = None 