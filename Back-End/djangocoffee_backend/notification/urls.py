from django.urls import path
from . import api

app_name = 'notification'

urlpatterns = [
    # Notifikasi endpoints
    path('', api.notification_list, name='notification_list'),
    path('<uuid:notification_id>/', api.notification_detail, name='notification_detail'),
    path('<uuid:notification_id>/read/', api.mark_notification_read, name='mark_notification_read'),
    path('<uuid:notification_id>/unread/', api.mark_notification_unread, name='mark_notification_unread'),
    path('mark-all-read/', api.mark_all_read, name='mark_all_read'),
    path('count/', api.notification_count, name='notification_count'),
    path('<uuid:notification_id>/delete/', api.delete_notification, name='delete_notification'),
    path('delete-all/', api.delete_all_notifications, name='delete_all_notifications'),
    
    # Pengaturan notifikasi
    path('settings/', api.get_notification_settings, name='get_notification_settings'),
    path('settings/update/', api.update_notification_settings, name='update_notification_settings'),
    
    # Endpoint test
    path('test/', api.send_test_notification, name='send_test_notification'),
] 