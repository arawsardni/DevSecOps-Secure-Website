from django.apps import AppConfig


class NotificationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notification'
    verbose_name = 'Sistem Notifikasi'

    def ready(self):
        """
        Import signal handlers ketika aplikasi siap.
        """
        import notification.signals
