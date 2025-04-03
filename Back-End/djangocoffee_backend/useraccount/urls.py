from django.urls import path
from . import api

urlpatterns = [
    path('register/', api.register, name='api_register'),
    path('login/', api.login, name='api_login'),
    path('logout/', api.logout, name='api_logout'),
    path('profile/', api.user_profile, name='api_user_profile'),
    path('profile/update/', api.update_profile, name='api_update_profile'),
]
