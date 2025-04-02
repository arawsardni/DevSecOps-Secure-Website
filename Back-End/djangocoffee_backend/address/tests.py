from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import Address, Province, City
from useraccount.models import User

class AddressModelTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            name="Test User",
            password="testpassword123"
        )
        
        # Buat alamat untuk testing
        self.address = Address.objects.create(
            user=self.user,
            address_type='home',
            recipient_name='John Doe',
            phone_number='081234567890',
            address_line1='Jl. Test No. 123',
            city='Jakarta',
            province='DKI Jakarta',
            postal_code='12345'
        )
    
    def test_address_creation(self):
        """Test pembuatan alamat baru"""
        self.assertEqual(self.address.address_type, 'home')
        self.assertEqual(self.address.recipient_name, 'John Doe')
        self.assertEqual(self.address.get_full_address(), 'Jl. Test No. 123, Jakarta, DKI Jakarta, 12345')
        self.assertTrue(self.address.is_default)  # Alamat pertama otomatis menjadi default
    
    def test_multiple_addresses_default(self):
        """Test pembuatan beberapa alamat dengan status default"""
        # Buat alamat kedua dengan is_default=True
        second_address = Address.objects.create(
            user=self.user,
            address_type='office',
            recipient_name='John Doe',
            phone_number='081234567890',
            address_line1='Jl. Office No. 456',
            city='Jakarta',
            province='DKI Jakarta',
            postal_code='54321',
            is_default=True
        )
        
        # Refresh alamat pertama dari database
        self.address.refresh_from_db()
        
        # Alamat pertama seharusnya tidak lagi default
        self.assertFalse(self.address.is_default)
        # Alamat kedua seharusnya menjadi default
        self.assertTrue(second_address.is_default)

class AddressAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Buat user untuk testing
        self.user = User.objects.create_user(
            email="testapi@example.com",
            name="Test API User",
            password="testpassword123"
        )
        
        # Buat alamat untuk testing
        self.address = Address.objects.create(
            user=self.user,
            address_type='home',
            recipient_name='John Doe',
            phone_number='081234567890',
            address_line1='Jl. Test No. 123',
            city='Jakarta',
            province='DKI Jakarta',
            postal_code='12345'
        )
        
        # Otentikasi user
        self.client.force_authenticate(user=self.user)
        
        # Buat province dan city untuk testing
        self.province = Province.objects.create(
            name='DKI Jakarta',
            code='JKT'
        )
        
        self.city = City.objects.create(
            province=self.province,
            name='Jakarta Selatan',
            code='JKTS',
            postal_code='12345'
        )
    
    def test_get_address_list(self):
        """Test mendapatkan daftar alamat"""
        url = reverse('address:address_list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_get_address_detail(self):
        """Test mendapatkan detail alamat"""
        url = reverse('address:address_detail', args=[self.address.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['recipient_name'], 'John Doe')
    
    def test_create_address(self):
        """Test membuat alamat baru"""
        url = reverse('address:create_address')
        data = {
            'address_type': 'office',
            'recipient_name': 'Jane Doe',
            'phone_number': '089876543210',
            'address_line1': 'Jl. Office No. 456',
            'city': 'Bandung',
            'province': 'Jawa Barat',
            'postal_code': '40123'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verifikasi alamat tersimpan di database
        self.assertEqual(Address.objects.count(), 2)
        self.assertEqual(Address.objects.get(recipient_name='Jane Doe').city, 'Bandung')
    
    def test_update_address(self):
        """Test memperbarui alamat"""
        url = reverse('address:update_address', args=[self.address.id])
        data = {
            'recipient_name': 'John Doe Updated',
            'phone_number': '081234567890',
            'address_line1': 'Jl. Updated No. 123',
            'city': 'Jakarta',
            'province': 'DKI Jakarta',
            'postal_code': '12345',
            'address_type': 'home'
        }
        
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh alamat dari database
        self.address.refresh_from_db()
        self.assertEqual(self.address.recipient_name, 'John Doe Updated')
        self.assertEqual(self.address.address_line1, 'Jl. Updated No. 123')
    
    def test_delete_address(self):
        """Test menghapus alamat"""
        # Buat alamat lain dulu agar bisa menghapus alamat default
        second_address = Address.objects.create(
            user=self.user,
            address_type='office',
            recipient_name='Jane Doe',
            phone_number='089876543210',
            address_line1='Jl. Office No. 456',
            city='Jakarta',
            province='DKI Jakarta',
            postal_code='54321',
            is_default=True
        )
        
        # Refresh alamat pertama
        self.address.refresh_from_db()
        
        # Delete non-default address
        url = reverse('address:delete_address', args=[self.address.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verifikasi alamat tidak ada di database
        self.assertEqual(Address.objects.filter(id=self.address.id).count(), 0)
    
    def test_cannot_delete_default_address(self):
        """Test tidak bisa menghapus alamat default (jika masih ada alamat lain)"""
        # Buat alamat kedua
        second_address = Address.objects.create(
            user=self.user,
            address_type='office',
            recipient_name='Jane Doe',
            phone_number='089876543210',
            address_line1='Jl. Office No. 456',
            city='Jakarta',
            province='DKI Jakarta',
            postal_code='54321'
        )
        
        # Coba hapus alamat default
        url = reverse('address:delete_address', args=[self.address.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Verifikasi alamat masih ada di database
        self.assertEqual(Address.objects.filter(id=self.address.id).count(), 1)
    
    def test_set_default_address(self):
        """Test menjadikan alamat sebagai default"""
        # Buat alamat kedua
        second_address = Address.objects.create(
            user=self.user,
            address_type='office',
            recipient_name='Jane Doe',
            phone_number='089876543210',
            address_line1='Jl. Office No. 456',
            city='Jakarta',
            province='DKI Jakarta',
            postal_code='54321'
        )
        
        # Set alamat kedua sebagai default
        url = reverse('address:set_default_address', args=[second_address.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh kedua alamat dari database
        self.address.refresh_from_db()
        second_address.refresh_from_db()
        
        # Alamat pertama seharusnya tidak lagi default
        self.assertFalse(self.address.is_default)
        # Alamat kedua seharusnya menjadi default
        self.assertTrue(second_address.is_default)
    
    def test_get_default_address(self):
        """Test mendapatkan alamat default"""
        url = reverse('address:get_default_address')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], str(self.address.id))
    
    def test_province_and_city_api(self):
        """Test API provinsi dan kota"""
        # Get daftar provinsi
        url = reverse('address:province_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        # Get detail provinsi
        url = reverse('address:province_detail', args=[self.province.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'DKI Jakarta')
        self.assertEqual(len(response.data['cities']), 1)
        
        # Get daftar kota
        url = reverse('address:city_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        # Get detail kota
        url = reverse('address:city_detail', args=[self.city.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Jakarta Selatan')
