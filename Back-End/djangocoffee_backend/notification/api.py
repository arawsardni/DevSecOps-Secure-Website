from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone

from .models import Notification, NotificationSettings
from .serializers import (
    NotificationSerializer, 
    NotificationListSerializer,
    NotificationCountSerializer,
    NotificationSettingsSerializer,
    UpdateNotificationSettingsSerializer
)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    """
    Mendapatkan daftar notifikasi pengguna.
    Bisa difilter dengan query parameter:
    - type: Tipe notifikasi (order, promo, info, payment, system)
    - is_read: Status dibaca (true, false)
    - limit: Jumlah maksimal notifikasi yang dikembalikan
    """
    # Filter berdasarkan tipe
    notification_type = request.query_params.get('type')
    is_read = request.query_params.get('is_read')
    limit = request.query_params.get('limit')
    
    notifications = Notification.objects.filter(user=request.user)
    
    # Filter berdasarkan tipe
    if notification_type:
        notifications = notifications.filter(notification_type=notification_type)
    
    # Filter berdasarkan status dibaca
    if is_read is not None:
        is_read_bool = is_read.lower() == 'true'
        notifications = notifications.filter(is_read=is_read_bool)
    
    # Urutkan
    notifications = notifications.order_by('-created_at')
    
    # Batasi jumlah
    if limit:
        try:
            limit_int = int(limit)
            notifications = notifications[:limit_int]
        except ValueError:
            pass
    
    serializer = NotificationListSerializer(notifications, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_detail(request, notification_id):
    """
    Mendapatkan detail notifikasi.
    """
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
    except Notification.DoesNotExist:
        return Response(
            {'error': 'Notifikasi tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = NotificationSerializer(notification)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """
    Menandai notifikasi sebagai telah dibaca.
    """
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
    except Notification.DoesNotExist:
        return Response(
            {'error': 'Notifikasi tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    notification.mark_as_read()
    serializer = NotificationSerializer(notification)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_unread(request, notification_id):
    """
    Menandai notifikasi sebagai belum dibaca.
    """
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
    except Notification.DoesNotExist:
        return Response(
            {'error': 'Notifikasi tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    notification.is_read = False
    notification.read_at = None
    notification.save()
    
    serializer = NotificationSerializer(notification)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    """
    Menandai semua notifikasi pengguna sebagai telah dibaca.
    """
    notification_type = request.query_params.get('type')
    
    notifications = Notification.objects.filter(
        user=request.user,
        is_read=False
    )
    
    if notification_type:
        notifications = notifications.filter(notification_type=notification_type)
    
    count = notifications.count()
    notifications.update(is_read=True, read_at=timezone.now())
    
    return Response({
        'success': True,
        'message': f'{count} notifikasi telah ditandai sebagai dibaca',
        'count': count
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_count(request):
    """
    Mendapatkan jumlah notifikasi yang belum dibaca.
    """
    counts = Notification.objects.filter(
        user=request.user,
        is_read=False
    ).aggregate(
        total_unread=Count('id'),
        order_unread=Count('id', filter=Q(notification_type='order')),
        promo_unread=Count('id', filter=Q(notification_type='promo')),
        payment_unread=Count('id', filter=Q(notification_type='payment')),
        system_unread=Count('id', filter=Q(notification_type='system')),
        info_unread=Count('id', filter=Q(notification_type='info'))
    )
    
    serializer = NotificationCountSerializer(counts)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, notification_id):
    """
    Menghapus notifikasi.
    """
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
    except Notification.DoesNotExist:
        return Response(
            {'error': 'Notifikasi tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    notification.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_all_notifications(request):
    """
    Menghapus semua notifikasi pengguna.
    """
    is_read = request.query_params.get('is_read')
    notification_type = request.query_params.get('type')
    
    notifications = Notification.objects.filter(user=request.user)
    
    if is_read is not None:
        is_read_bool = is_read.lower() == 'true'
        notifications = notifications.filter(is_read=is_read_bool)
    
    if notification_type:
        notifications = notifications.filter(notification_type=notification_type)
    
    count = notifications.count()
    notifications.delete()
    
    return Response({
        'success': True,
        'message': f'{count} notifikasi telah dihapus',
        'count': count
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notification_settings(request):
    """
    Mendapatkan pengaturan notifikasi pengguna.
    """
    try:
        settings = NotificationSettings.objects.get(user=request.user)
    except NotificationSettings.DoesNotExist:
        # Buat pengaturan default jika belum ada
        settings = NotificationSettings.objects.create(user=request.user)
    
    serializer = NotificationSettingsSerializer(settings)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_notification_settings(request):
    """
    Memperbarui pengaturan notifikasi pengguna.
    """
    try:
        settings = NotificationSettings.objects.get(user=request.user)
    except NotificationSettings.DoesNotExist:
        settings = NotificationSettings.objects.create(user=request.user)
    
    serializer = UpdateNotificationSettingsSerializer(settings, data=request.data)
    
    if serializer.is_valid():
        serializer.save()
        return Response(NotificationSettingsSerializer(settings).data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Endpoint untuk mengirim notifikasi (untuk penggunaan internal)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_test_notification(request):
    """
    Mengirim notifikasi test untuk pengguna saat ini.
    """
    notification = Notification.create_notification(
        user=request.user,
        title="Notifikasi Test",
        message="Ini adalah notifikasi test.",
        notification_type=request.data.get('type', 'info'),
        priority=request.data.get('priority', 'medium')
    )
    
    serializer = NotificationSerializer(notification)
    return Response(serializer.data, status=status.HTTP_201_CREATED) 