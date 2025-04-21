from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    UserUpdateSerializer
)
import json

User = get_user_model()

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    refresh = RefreshToken.for_user(user)
    return Response({
        'user': UserSerializer(user).data,
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login(request):
    print("Login request data:", request.data)
    serializer = LoginSerializer(data=request.data)
    
    # Check serializer validation
    if not serializer.is_valid():
        print("Login serializer errors:", serializer.errors)
        return Response(
            {'detail': serializer.errors}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=serializer.validated_data['email'])
        if user.check_password(serializer.validated_data['password']):
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        print("Invalid password for user:", serializer.validated_data['email'])
        return Response(
            {'detail': 'Invalid credentials'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    except ObjectDoesNotExist:
        print("User not found:", serializer.validated_data['email'])
        return Response(
            {'detail': 'User not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print("Unexpected error in login:", str(e))
        return Response(
            {'detail': 'An unexpected error occurred'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data["refresh_token"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response(status=status.HTTP_205_RESET_CONTENT)
    except Exception:
        return Response(status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_profile(request):
    serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(UserSerializer(request.user).data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_addresses(request):
    """
    Update addresses list. Expected format:
    {
        "addresses": [
            {"label": "Home", "address": "123 Main St", "note": "Near park", "coordinates": {"lat": 123, "lng": 456}},
            {"label": "Work", "address": "456 Office Rd", "note": "", "coordinates": {"lat": 789, "lng": 012}}
        ],
        "mainAddress": 0
    }
    """
    addresses = request.data.get('addresses', [])
    main_address = request.data.get('mainAddress')
    
    # Simpan addresses
    request.user.user_addresses = json.dumps(addresses)
    
    # Update main address jika tersedia
    if main_address is not None:
        request.user.mainAddress = main_address
    
    request.user.save()
    
    return Response({
        'success': True,
        'addresses': request.user.get_addresses(),
        'mainAddress': request.user.mainAddress
    })