from django.contrib.auth import authenticate
from django.http import JsonResponse
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated  # Perbaiki di sini!
from rest_framework.authtoken.models import Token
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework import status
from .models import User
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
import logging

@api_view(['POST'])
@authentication_classes([])  # Tidak membutuhkan autentikasi
@permission_classes([])       # Tidak membutuhkan izin khusus
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)  # Buat refresh & access token
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh)  # Tambahkan refresh token
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@authentication_classes([])  
@permission_classes([])       
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        user = authenticate(email=email, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


logger = logging.getLogger(__name__)

@api_view(['GET'])
@authentication_classes([])  # Jika ingin bisa diakses tanpa login, kosongkan ini (untuk test api)
@permission_classes([IsAuthenticated])  # Harus login untuk melihat profile (untuk test api)
def user_profile(request):
    logger.info(f"User making request: {request.user} (Authenticated: {request.user.is_authenticated})")

    if not request.user.is_authenticated:
        return Response({'error': 'User not authenticated'}, status=401)

    return Response({'user': UserSerializer(request.user).data})