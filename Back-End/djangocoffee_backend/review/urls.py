from django.urls import path
from . import api

app_name = 'review'

urlpatterns = [
    # User endpoints
    path('products/<uuid:product_id>/', api.product_reviews, name='product_reviews'),
    path('create/', api.create_review, name='create_review'),
    path('<uuid:review_id>/', api.review_detail, name='review_detail'),
    path('images/<uuid:image_id>/delete/', api.delete_review_image, name='delete_review_image'),
    path('<uuid:review_id>/like/', api.like_review, name='like_review'),
    path('<uuid:review_id>/unlike/', api.unlike_review, name='unlike_review'),
    path('user/', api.user_reviews, name='user_reviews'),
    
    # Admin endpoints
    path('admin/all/', api.all_reviews, name='all_reviews'),
    path('admin/<uuid:review_id>/approve/', api.approve_review, name='approve_review'),
    path('admin/<uuid:review_id>/feature/', api.feature_review, name='feature_review'),
] 