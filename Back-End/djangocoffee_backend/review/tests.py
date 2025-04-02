from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from .models import Review, ReviewLike, ReviewImage
from useraccount.models import User
from product.models import Product, Category

class ReviewAPITestCase(TestCase):
    def setUp(self):
        # Buat user untuk testing
        self.user = User.objects.create_user(
            email="test@example.com", 
            name="Test User", 
            password="testpassword"
        )
        
        self.admin_user = User.objects.create_user(
            email="admin@example.com",
            name="Admin User",
            password="adminpassword",
            is_staff=True,
            is_superuser=True
        )
        
        # Buat kategori dan produk untuk testing
        self.category = Category.objects.create(name="Coffee")
        self.product = Product.objects.create(
            name="Cappuccino",
            description="Delicious cappuccino",
            price=25000,
            category=self.category
        )
        
        # Buat review untuk testing
        self.review = Review.objects.create(
            user=self.user,
            product=self.product,
            rating=4,
            comment="Great coffee!",
            is_approved=True
        )
        
        # Setup API client
        self.client = APIClient()
    
    def test_get_product_reviews_anonymous(self):
        """Test mendapatkan review produk sebagai anonymous user"""
        url = reverse('review:product_reviews', args=[self.product.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['reviews']), 1)
        self.assertEqual(response.data['reviews'][0]['rating'], 4)
        self.assertEqual(response.data['stats']['avg_rating'], 4.0)
    
    def test_create_review_authenticated(self):
        """Test membuat review sebagai authenticated user"""
        self.client.force_authenticate(user=self.user)
        
        # Buat produk baru karena user sudah review produk sebelumnya
        new_product = Product.objects.create(
            name="Latte",
            description="Creamy latte",
            price=28000,
            category=self.category
        )
        
        url = reverse('review:create_review')
        data = {
            'product': str(new_product.id),
            'rating': 5,
            'comment': 'Excellent coffee!'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['rating'], 5)
        self.assertEqual(response.data['comment'], 'Excellent coffee!')
        
        # Verifikasi bahwa review telah dibuat di database
        self.assertEqual(Review.objects.filter(product=new_product).count(), 1)
    
    def test_create_review_duplicate_product(self):
        """Test membuat review untuk produk yang sudah di-review"""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('review:create_review')
        data = {
            'product': str(self.product.id),
            'rating': 3,
            'comment': 'Changed my mind, it was just okay.'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_update_own_review(self):
        """Test mengupdate review milik sendiri"""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('review:review_detail', args=[self.review.id])
        data = {
            'rating': 5,
            'comment': 'Updated: This is actually amazing!'
        }
        
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['rating'], 5)
        self.assertEqual(response.data['comment'], 'Updated: This is actually amazing!')
        
        # Verifikasi bahwa review telah diupdate di database
        updated_review = Review.objects.get(id=self.review.id)
        self.assertEqual(updated_review.rating, 5)
    
    def test_delete_own_review(self):
        """Test menghapus review milik sendiri"""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('review:review_detail', args=[self.review.id])
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verifikasi bahwa review telah dihapus dari database
        self.assertEqual(Review.objects.filter(id=self.review.id).count(), 0)
    
    def test_like_review(self):
        """Test menyukai review"""
        self.client.force_authenticate(user=self.admin_user)  # User lain
        
        url = reverse('review:like_review', args=[self.review.id])
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verifikasi bahwa like telah dibuat di database
        self.assertEqual(ReviewLike.objects.filter(review=self.review, user=self.admin_user).count(), 1)
        
        # Verifikasi bahwa likes_count telah diupdate
        updated_review = Review.objects.get(id=self.review.id)
        self.assertEqual(updated_review.likes_count, 1)
    
    def test_unlike_review(self):
        """Test menghapus like dari review"""
        # Buat like terlebih dahulu
        like = ReviewLike.objects.create(review=self.review, user=self.admin_user)
        
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('review:unlike_review', args=[self.review.id])
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verifikasi bahwa like telah dihapus dari database
        self.assertEqual(ReviewLike.objects.filter(review=self.review, user=self.admin_user).count(), 0)
    
    def test_admin_approve_review(self):
        """Test menyetujui review sebagai admin"""
        # Buat review yang belum disetujui
        unapproved_review = Review.objects.create(
            user=self.admin_user,
            product=self.product,
            rating=2,
            comment="Not good enough",
            is_approved=False
        )
        
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('review:approve_review', args=[unapproved_review.id])
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_approved'])
        
        # Verifikasi bahwa review telah disetujui di database
        updated_review = Review.objects.get(id=unapproved_review.id)
        self.assertTrue(updated_review.is_approved)
    
    def test_admin_feature_review(self):
        """Test menjadikan review sebagai unggulan sebagai admin"""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('review:feature_review', args=[self.review.id])
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_featured'])
        
        # Verifikasi bahwa review telah dijadikan unggulan di database
        updated_review = Review.objects.get(id=self.review.id)
        self.assertTrue(updated_review.is_featured)
