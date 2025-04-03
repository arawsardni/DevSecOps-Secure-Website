from rest_framework import serializers
from .models import Notification, NotificationSettings
from useraccount.serializers import UserSerializer

class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer untuk menampilkan detail notifikasi.
    """
    user_detail = UserSerializer(source='user', read_only=True)
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = (
            'id', 'user', 'user_detail', 'title', 'message', 
            'notification_type', 'notification_type_display',
            'priority', 'priority_display', 'related_url', 
            'related_object_id', 'related_object_type',
            'is_read', 'read_at', 'created_at', 'updated_at', 
            'expires_at', 'icon', 'image_url'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

class NotificationListSerializer(serializers.ModelSerializer):
    """
    Serializer untuk menampilkan daftar notifikasi (versi singkat).
    """
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = (
            'id', 'title', 'notification_type', 'notification_type_display',
            'priority', 'is_read', 'created_at', 'expires_at', 'icon'
        )

class NotificationCountSerializer(serializers.Serializer):
    """
    Serializer untuk menampilkan jumlah notifikasi yang belum dibaca.
    """
    total_unread = serializers.IntegerField()
    order_unread = serializers.IntegerField()
    promo_unread = serializers.IntegerField()
    payment_unread = serializers.IntegerField()
    system_unread = serializers.IntegerField()
    info_unread = serializers.IntegerField()

class NotificationSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer untuk pengaturan notifikasi pengguna.
    """
    class Meta:
        model = NotificationSettings
        fields = (
            'id', 'user', 'order_notifications', 'promo_notifications', 
            'payment_notifications', 'system_notifications',
            'email_notifications', 'push_notifications',
            'digest_notifications', 'digest_frequency',
            'quiet_hours_start', 'quiet_hours_end',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

class UpdateNotificationSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer untuk memperbarui pengaturan notifikasi.
    """
    class Meta:
        model = NotificationSettings
        fields = (
            'order_notifications', 'promo_notifications', 
            'payment_notifications', 'system_notifications',
            'email_notifications', 'push_notifications',
            'digest_notifications', 'digest_frequency',
            'quiet_hours_start', 'quiet_hours_end'
        )
    
    def validate(self, data):
        """
        Validasi pengaturan jam tenang.
        """
        quiet_hours_start = data.get('quiet_hours_start')
        quiet_hours_end = data.get('quiet_hours_end')
        
        # Jika salah satu diisi, pastikan keduanya diisi
        if (quiet_hours_start is not None and quiet_hours_end is None) or \
           (quiet_hours_start is None and quiet_hours_end is not None):
            raise serializers.ValidationError({
                "quiet_hours": "Waktu mulai dan selesai jam tenang harus diisi keduanya."
            })
        
        return data 