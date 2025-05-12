from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from django.shortcuts import get_object_or_404

from .models import Review, ReviewLike, ReviewImage
from .serializers import (
    ReviewSerializer, 
    CreateReviewSerializer, 
    ReviewLikeSerializer, 
    ReviewImageSerializer
)
from product.models import Product

@api_view(['GET'])
@permission_classes([AllowAny])
def product_reviews(request, product_id):
    """
    Mendapatkan semua review untuk produk tertentu
    """
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response(
            {'error': 'Produk tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Filter hanya review yang disetujui untuk publik
    reviews = Review.objects.filter(
        product=product, 
        is_approved=True
    ).order_by('-is_featured', '-created_at')
    
    # Filter dan pagination
    rating = request.query_params.get('rating')
    if rating:
        try:
            rating = int(rating)
            if 1 <= rating <= 5:
                reviews = reviews.filter(rating=rating)
        except ValueError:
            pass
    
    serializer = ReviewSerializer(
        reviews, 
        many=True,
        context={'request': request}
    )
    
    # Hitung statistik review
    stats = Review.objects.filter(product=product, is_approved=True).aggregate(
        avg_rating=Avg('rating'),
        total_reviews=Count('id'),
        five_star=Count('id', filter=Q(rating=5)),
        four_star=Count('id', filter=Q(rating=4)),
        three_star=Count('id', filter=Q(rating=3)),
        two_star=Count('id', filter=Q(rating=2)),
        one_star=Count('id', filter=Q(rating=1))
    )
    
    return Response({
        'reviews': serializer.data,
        'stats': stats
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_review(request):
    """
    Membuat review baru untuk produk
    """
    serializer = CreateReviewSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if serializer.is_valid():
        review = serializer.save()
        review_serializer = ReviewSerializer(
            review,
            context={'request': request}
        )
        return Response(review_serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def review_detail(request, review_id):
    """
    Mendapatkan, mengupdate, atau menghapus review
    """
    try:
        # User hanya bisa melihat, mengedit, atau menghapus review miliknya sendiri
        review = Review.objects.get(id=review_id, user=request.user)
    except Review.DoesNotExist:
        return Response(
            {'error': 'Review tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = ReviewSerializer(
            review,
            context={'request': request}
        )
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        # User hanya boleh mengubah rating dan comment
        data = {
            'rating': request.data.get('rating', review.rating),
            'comment': request.data.get('comment', review.comment),
            'product': review.product.id  # Produk tidak boleh diubah
        }
        
        serializer = CreateReviewSerializer(
            review,
            data=data,
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            updated_review = serializer.save()
            
            # Tambahkan gambar baru jika ada
            if 'images' in request.data and request.data['images']:
                for image_data in request.data['images']:
                    ReviewImage.objects.create(review=updated_review, image=image_data)
            
            review_serializer = ReviewSerializer(
                updated_review,
                context={'request': request}
            )
            return Response(review_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        review.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_review_image(request, image_id):
    """
    Menghapus gambar dari review
    """
    try:
        # User hanya bisa menghapus gambar dari review miliknya sendiri
        image = ReviewImage.objects.get(id=image_id, review__user=request.user)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except ReviewImage.DoesNotExist:
        return Response(
            {'error': 'Gambar tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_review(request, review_id):
    """
    Menyukai review
    """
    try:
        review = Review.objects.get(id=review_id, is_approved=True)
    except Review.DoesNotExist:
        return Response(
            {'error': 'Review tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Cek apakah user sudah menyukai review ini
    if ReviewLike.objects.filter(review=review, user=request.user).exists():
        return Response(
            {'error': 'Anda sudah menyukai review ini'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Buat like baru
    like = ReviewLike.objects.create(review=review, user=request.user)
    serializer = ReviewLikeSerializer(like)
    
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unlike_review(request, review_id):
    """
    Menghapus like dari review
    """
    try:
        review = Review.objects.get(id=review_id)
        like = ReviewLike.objects.get(review=review, user=request.user)
        like.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except (Review.DoesNotExist, ReviewLike.DoesNotExist):
        return Response(
            {'error': 'Review atau like tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_reviews(request):
    """
    Mendapatkan semua review yang ditulis oleh user
    """
    reviews = Review.objects.filter(user=request.user).order_by('-created_at')
    serializer = ReviewSerializer(
        reviews, 
        many=True,
        context={'request': request}
    )
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def all_reviews(request):
    """
    Mendapatkan semua review (untuk admin)
    """
    reviews = Review.objects.all().order_by('-created_at')
    
    # Filter
    is_approved = request.query_params.get('is_approved')
    is_featured = request.query_params.get('is_featured')
    rating = request.query_params.get('rating')
    
    if is_approved is not None:
        reviews = reviews.filter(is_approved=is_approved.lower() == 'true')
    
    if is_featured is not None:
        reviews = reviews.filter(is_featured=is_featured.lower() == 'true')
    
    if rating:
        try:
            rating = int(rating)
            if 1 <= rating <= 5:
                reviews = reviews.filter(rating=rating)
        except ValueError:
            pass
    
    serializer = ReviewSerializer(
        reviews, 
        many=True,
        context={'request': request}
    )
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def approve_review(request, review_id):
    """
    Menyetujui review (untuk admin)
    """
    review = get_object_or_404(Review, id=review_id)
    review.is_approved = True
    review.save()
    
    serializer = ReviewSerializer(
        review,
        context={'request': request}
    )
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def feature_review(request, review_id):
    """
    Menjadikan review sebagai unggulan (untuk admin)
    """
    review = get_object_or_404(Review, id=review_id)
    review.is_featured = True
    review.save()
    
    serializer = ReviewSerializer(
        review,
        context={'request': request}
    )
    return Response(serializer.data) 