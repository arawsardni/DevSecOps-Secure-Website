from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from useraccount.models import User
from product.models import Product, Category
from .models import Cart, CartItem

class CartTestCase(TestCase):
    def setUp(self):
        # Buat user untuk testing
        self.user = User.objects.create_user(
            email="test@example.com", 
            name="Test User", 
            password="testpassword"
        )
        
        # Buat kategori dan produk untuk testing
        self.category = Category.objects.create(name="Coffee")
        self.product = Product.objects.create(
            name="Cappuccino",
            description="Delicious cappuccino",
            price=25000,
            category=self.category,
            stock=100
        )
        
        # Setup API client
        self.client = APIClient()
    
    def test_add_to_cart_guest(self):
        """Test menambahkan item ke keranjang sebagai guest"""
        url = reverse('cart:add_to_cart')
        data = {
            'product_id': str(self.product.id),
            'quantity': 2,
            'size': 'M'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['items_count'], 1)
        self.assertEqual(response.data['items'][0]['quantity'], 2)
    
    def test_add_to_cart_authenticated(self):
        """Test menambahkan item ke keranjang sebagai user terotentikasi"""
        self.client.force_authenticate(user=self.user)
        url = reverse('cart:add_to_cart')
        data = {
            'product_id': str(self.product.id),
            'quantity': 3,
            'size': 'L'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['items_count'], 1)
        self.assertEqual(response.data['items'][0]['quantity'], 3)
        
        # Verifikasi bahwa keranjang telah dibuat untuk user
        cart = Cart.objects.get(user=self.user)
        self.assertEqual(cart.items.count(), 1)
    
    def test_update_cart_item(self):
        """Test update kuantitas item di keranjang"""
        # Buat keranjang dan tambahkan item
        cart = Cart.objects.create(user=self.user)
        cart_item = CartItem.objects.create(
            cart=cart,
            product=self.product,
            quantity=1,
            size='M'
        )
        
        self.client.force_authenticate(user=self.user)
        url = reverse('cart:update_cart_item', args=[cart_item.id])
        data = {
            'quantity': 5
        }
        
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['items'][0]['quantity'], 5)
        
        # Verifikasi update di database
        cart_item.refresh_from_db()
        self.assertEqual(cart_item.quantity, 5)
    
    def test_remove_cart_item(self):
        """Test menghapus item dari keranjang"""
        # Buat keranjang dan tambahkan item
        cart = Cart.objects.create(user=self.user)
        cart_item = CartItem.objects.create(
            cart=cart,
            product=self.product,
            quantity=2
        )
        
        self.client.force_authenticate(user=self.user)
        url = reverse('cart:remove_cart_item', args=[cart_item.id])
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['items_count'], 0)
        
        # Verifikasi item telah dihapus
        self.assertEqual(CartItem.objects.filter(id=cart_item.id).count(), 0)
    
    def test_clear_cart(self):
        """Test menghapus semua item dari keranjang"""
        # Buat keranjang dan tambahkan beberapa item
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=2)
        
        # Buat produk kedua dan tambahkan ke keranjang
        product2 = Product.objects.create(
            name="Latte",
            description="Creamy latte",
            price=28000,
            category=self.category,
            stock=50
        )
        CartItem.objects.create(cart=cart, product=product2, quantity=1)
        
        self.client.force_authenticate(user=self.user)
        url = reverse('cart:clear_cart')
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['items_count'], 0)
        
        # Verifikasi semua item telah dihapus
        self.assertEqual(CartItem.objects.filter(cart=cart).count(), 0)
