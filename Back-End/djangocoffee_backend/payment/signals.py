from django.db import models
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.db import transaction
from .models import Payment, PaymentHistory

@receiver(pre_save, sender=Payment)
def store_original_payment_status(sender, instance, **kwargs):
    """
    Menyimpan status pembayaran original untuk perbandingan di signal handlers.
    """
    try:
        instance._original_status = Payment.objects.get(pk=instance.pk).status
    except Payment.DoesNotExist:
        instance._original_status = None

@receiver(post_save, sender=Payment)
def create_payment_history(sender, instance, created, **kwargs):
    """
    Buat entri history ketika pembayaran disimpan.
    """
    # Jika pembayaran baru dibuat, history sudah dibuat di serializer
    if created:
        return
    
    # Jika status tidak berubah, tidak perlu buat history baru
    if hasattr(instance, '_original_status') and instance._original_status == instance.status:
        return
    
    # Buat catatan berdasarkan perubahan status
    notes = None
    
    if instance.status == 'paid' and instance._original_status != 'paid':
        notes = "Pembayaran berhasil dilakukan"
    elif instance.status == 'verifying' and instance._original_status != 'verifying':
        notes = "Pembayaran sedang diverifikasi"
    elif instance.status == 'failed' and instance._original_status != 'failed':
        notes = "Pembayaran gagal"
    elif instance.status == 'expired' and instance._original_status != 'expired':
        notes = "Pembayaran kedaluwarsa"
    elif instance.status == 'refunded' and instance._original_status != 'refunded':
        notes = "Pembayaran dikembalikan"
    
    # Jika ada perubahan status, buat entry history baru
    if notes:
        PaymentHistory.objects.create(
            payment=instance,
            status=instance.status,
            notes=notes
        )

@receiver(post_save, sender=Payment)
def create_payment_notification(sender, instance, created, **kwargs):
    """
    Buat notifikasi ketika status pembayaran berubah.
    """
    # Jika tidak ada perubahan status, tidak perlu buat notifikasi
    if not hasattr(instance, '_original_status') or instance._original_status == instance.status:
        return
    
    try:
        # Import di sini untuk menghindari circular import
        from notification.models import Notification, NotificationSettings
        
        # Periksa preferensi notifikasi pengguna
        try:
            settings = NotificationSettings.objects.get(user=instance.user)
            if not settings.payment_notifications:
                return  # User menonaktifkan notifikasi pembayaran
        except NotificationSettings.DoesNotExist:
            pass  # Lanjutkan dengan pengaturan default
        
        # Buat notifikasi berdasarkan perubahan status
        if instance.status == 'paid' and instance._original_status != 'paid':
            Notification.create_payment_notification(
                user=instance.user,
                title="Pembayaran Berhasil",
                message=f"Pembayaran Anda untuk pesanan #{instance.order.order_number} telah berhasil. Pesanan Anda sedang diproses.",
                payment_id=str(instance.id)
            )
        elif instance.status == 'verifying' and instance._original_status != 'verifying':
            Notification.create_payment_notification(
                user=instance.user,
                title="Pembayaran Sedang Diverifikasi",
                message=f"Kami sedang memverifikasi pembayaran Anda untuk pesanan #{instance.order.order_number}. Kami akan segera memberitahu Anda hasilnya.",
                payment_id=str(instance.id)
            )
        elif instance.status == 'failed' and instance._original_status != 'failed':
            Notification.create_payment_notification(
                user=instance.user,
                title="Pembayaran Gagal",
                message=f"Maaf, pembayaran Anda untuk pesanan #{instance.order.order_number} gagal. Silakan coba metode pembayaran lain.",
                payment_id=str(instance.id)
            )
        elif instance.status == 'expired' and instance._original_status != 'expired':
            Notification.create_payment_notification(
                user=instance.user,
                title="Pembayaran Kedaluwarsa",
                message=f"Pembayaran Anda untuk pesanan #{instance.order.order_number} telah kedaluwarsa. Silakan lakukan pembayaran ulang.",
                payment_id=str(instance.id)
            )
        elif instance.status == 'refunded' and instance._original_status != 'refunded':
            Notification.create_payment_notification(
                user=instance.user,
                title="Pembayaran Dikembalikan",
                message=f"Pembayaran Anda untuk pesanan #{instance.order.order_number} telah dikembalikan.",
                payment_id=str(instance.id)
            )
    except ImportError:
        pass  # Lewati jika modul notification tidak tersedia
