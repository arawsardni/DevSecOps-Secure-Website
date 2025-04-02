from django.apps import AppConfig


class PaymentConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'payment'
    verbose_name = 'Pembayaran'

    def ready(self):
        """
        Import signal handlers ketika aplikasi siap.
        """
        import payment.signals
