from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.utils import timezone
from datetime import timedelta

from useraccount.models import User
from .models import Notification, NotificationSettings

class NotificationModelTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            name="Test User",
            password="testpassword123"
        )
        
        # Buat notifikasi untuk testing
        self.notification = Notification.create_notification(
            user=self.user,
            title="Test Notification",
            message="This is a test notification",
            notification_type='info',
            priority='medium'
        )
    
    def test_notification_creation(self):
        """Test pembuatan notifikasi"""
        self.assertEqual(self.notification.title, "Test Notification")
        self.assertEqual(self.notification.message, "This is a test notification")
        self.assertEqual(self.notification.notification_type, "info")
        self.assertEqual(self.notification.priority, "medium")
        self.assertFalse(self.notification.is_read)
        self.assertIsNone(self.notification.read_at)
    
    def test_mark_as_read(self):
        """Test menandai notifikasi sebagai telah dibaca"""
        self.notification.mark_as_read()
        self.assertTrue(self.notification.is_read)
        self.assertIsNotNone(self.notification.read_at)
    
    def test_is_expired(self):
        """Test cek kadaluarsa notifikasi"""
        # Notifikasi tanpa tanggal kadaluarsa
        self.assertFalse(self.notification.is_expired())
        
        # Notifikasi dengan tanggal kadaluarsa di masa depan
        self.notification.expires_at = timezone.now() + timedelta(days=1)
        self.notification.save()
        self.assertFalse(self.notification.is_expired())
        
        # Notifikasi dengan tanggal kadaluarsa di masa lalu
        self.notification.expires_at = timezone.now() - timedelta(days=1)
        self.notification.save()
        self.assertTrue(self.notification.is_expired())
    
    def test_create_helpers(self):
        """Test helper methods untuk membuat notifikasi"""
        # Test create_system_notification
        system_notification = Notification.create_system_notification(
            user=self.user,
            title="System Notification",
            message="System is under maintenance"
        )
        self.assertEqual(system_notification.notification_type, "system")
        self.assertEqual(system_notification.priority, "medium")
        
        # Test create_order_notification
        order_notification = Notification.create_order_notification(
            user=self.user,
            title="Order Notification",
            message="Your order has been processed",
            order_id="order123"
        )
        self.assertEqual(order_notification.notification_type, "order")
        self.assertEqual(order_notification.priority, "high")
        self.assertEqual(order_notification.related_object_id, "order123")
        self.assertEqual(order_notification.related_object_type, "order")
        
        # Test create_payment_notification
        payment_notification = Notification.create_payment_notification(
            user=self.user,
            title="Payment Notification",
            message="Your payment has been received",
            payment_id="payment123"
        )
        self.assertEqual(payment_notification.notification_type, "payment")
        self.assertEqual(payment_notification.priority, "high")
        self.assertEqual(payment_notification.related_object_id, "payment123")
        self.assertEqual(payment_notification.related_object_type, "payment")
        
        # Test create_promo_notification
        promo_notification = Notification.create_promo_notification(
            user=self.user,
            title="Promo Notification",
            message="New discount available",
            promo_id="promo123"
        )
        self.assertEqual(promo_notification.notification_type, "promo")
        self.assertEqual(promo_notification.priority, "medium")
        self.assertEqual(promo_notification.related_object_id, "promo123")
        self.assertEqual(promo_notification.related_object_type, "promo")

class NotificationSettingsModelTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            name="Test User",
            password="testpassword123"
        )
        
        # NotificationSettings should be auto-created via signal
        self.settings = NotificationSettings.objects.get(user=self.user)
    
    def test_settings_creation(self):
        """Test pembuatan pengaturan notifikasi"""
        self.assertEqual(self.settings.user, self.user)
        self.assertTrue(self.settings.order_notifications)
        self.assertTrue(self.settings.promo_notifications)
        self.assertTrue(self.settings.payment_notifications)
        self.assertTrue(self.settings.system_notifications)
        self.assertTrue(self.settings.email_notifications)
        self.assertTrue(self.settings.push_notifications)
        self.assertFalse(self.settings.digest_notifications)
    
    def test_should_send_notification(self):
        """Test cek apakah notifikasi harus dikirim"""
        # Default semua jenis notifikasi aktif
        self.assertTrue(self.settings.should_send_notification('order'))
        self.assertTrue(self.settings.should_send_notification('promo'))
        self.assertTrue(self.settings.should_send_notification('payment'))
        self.assertTrue(self.settings.should_send_notification('system'))
        
        # Menonaktifkan notifikasi pesanan
        self.settings.order_notifications = False
        self.settings.save()
        self.assertFalse(self.settings.should_send_notification('order'))
        self.assertTrue(self.settings.should_send_notification('promo'))
        
        # Tipe notifikasi yang tidak dikenal
        self.assertTrue(self.settings.should_send_notification('unknown_type'))
    
    def test_is_quiet_hours(self):
        """Test cek jam tenang"""
        # Default tidak ada jam tenang
        self.assertFalse(self.settings.is_quiet_hours())
        
        # Jam tenang normal (misal: 22:00 - 06:00)
        now = timezone.localtime().time()
        self.settings.quiet_hours_start = (timezone.localtime() - timedelta(hours=1)).time()
        self.settings.quiet_hours_end = (timezone.localtime() + timedelta(hours=1)).time()
        self.settings.save()
        
        # Seharusnya dalam jam tenang
        self.assertTrue(self.settings.is_quiet_hours())
        
        # Jam tenang di luar waktu saat ini
        self.settings.quiet_hours_start = (timezone.localtime() + timedelta(hours=1)).time()
        self.settings.quiet_hours_end = (timezone.localtime() + timedelta(hours=2)).time()
        self.settings.save()
        
        # Seharusnya tidak dalam jam tenang
        self.assertFalse(self.settings.is_quiet_hours())

class NotificationAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Buat user untuk testing
        self.user = User.objects.create_user(
            email="testapi@example.com",
            name="Test API User",
            password="testpassword123"
        )
        
        # Buat beberapa notifikasi
        self.notification1 = Notification.create_notification(
            user=self.user,
            title="Test Notification 1",
            message="This is test notification 1",
            notification_type='info'
        )
        
        self.notification2 = Notification.create_notification(
            user=self.user,
            title="Test Notification 2",
            message="This is test notification 2",
            notification_type='order',
            related_object_id='order123',
            related_object_type='order'
        )
        
        # Otentikasi user
        self.client.force_authenticate(user=self.user)
    
    def test_notification_list(self):
        """Test mendapatkan daftar notifikasi"""
        url = reverse('notification:notification_list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_notification_detail(self):
        """Test mendapatkan detail notifikasi"""
        url = reverse('notification:notification_detail', args=[self.notification1.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Notification 1')
    
    def test_mark_notification_read(self):
        """Test menandai notifikasi sebagai telah dibaca"""
        url = reverse('notification:mark_notification_read', args=[self.notification1.id])
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Cek apakah notifikasi ditandai sebagai telah dibaca
        self.notification1.refresh_from_db()
        self.assertTrue(self.notification1.is_read)
        self.assertIsNotNone(self.notification1.read_at)
    
    def test_mark_all_read(self):
        """Test menandai semua notifikasi sebagai telah dibaca"""
        url = reverse('notification:mark_all_read')
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        
        # Cek apakah semua notifikasi ditandai sebagai telah dibaca
        self.notification1.refresh_from_db()
        self.notification2.refresh_from_db()
        self.assertTrue(self.notification1.is_read)
        self.assertTrue(self.notification2.is_read)
    
    def test_notification_count(self):
        """Test mendapatkan jumlah notifikasi yang belum dibaca"""
        url = reverse('notification:notification_count')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_unread'], 2)
        self.assertEqual(response.data['info_unread'], 1)
        self.assertEqual(response.data['order_unread'], 1)
    
    def test_delete_notification(self):
        """Test menghapus notifikasi"""
        url = reverse('notification:delete_notification', args=[self.notification1.id])
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Cek apakah notifikasi dihapus
        with self.assertRaises(Notification.DoesNotExist):
            self.notification1.refresh_from_db()
    
    def test_notification_settings(self):
        """Test mendapatkan dan memperbarui pengaturan notifikasi"""
        # Mendapatkan pengaturan
        url = reverse('notification:get_notification_settings')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['order_notifications'])
        
        # Memperbarui pengaturan
        url = reverse('notification:update_notification_settings')
        data = {
            'order_notifications': False,
            'promo_notifications': False
        }
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['order_notifications'])
        self.assertFalse(response.data['promo_notifications'])
        self.assertTrue(response.data['payment_notifications'])  # Tidak diubah
    
    def test_filter_notifications(self):
        """Test filter notifikasi berdasarkan tipe dan status dibaca"""
        # Filter berdasarkan tipe
        url = reverse('notification:notification_list') + '?type=info'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Test Notification 1')
        
        # Tandai salah satu notifikasi sebagai telah dibaca
        self.notification1.mark_as_read()
        
        # Filter berdasarkan status dibaca
        url = reverse('notification:notification_list') + '?is_read=true'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Test Notification 1')
        
        # Filter berdasarkan status belum dibaca
        url = reverse('notification:notification_list') + '?is_read=false'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Test Notification 2')
