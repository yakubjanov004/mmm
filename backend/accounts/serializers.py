from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from accounts.models import Department, Position, Profile

User = get_user_model()


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ("id", "name")


class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = ("id", "name")


class ProfileShortSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    id = serializers.IntegerField(source="user.id")  # Return User ID instead of Profile ID

    class Meta:
        model = Profile
        fields = (
            "id",
            "full_name",
            "role",
            "user_id_str",
        )

    def get_full_name(self, obj: Profile) -> str:
        full_name = obj.user.get_full_name().strip()
        return full_name or obj.user.username


class ProfileSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="user.id")
    username = serializers.CharField(source="user.username")
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    email = serializers.EmailField(source="user.email", allow_blank=True)
    department = serializers.SerializerMethodField()
    position = serializers.SerializerMethodField()
    user_id = serializers.CharField(source="user_id_str", allow_blank=True)

    class Meta:
        model = Profile
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "role",
            "department",
            "position",
            "phone",
            "birth_date",
            "scopus",
            "scholar",
            "research_id",
            "user_id",
        )

    def get_department(self, obj: Profile) -> dict | None:
        if not obj.department:
            return None
        return DepartmentSerializer(obj.department).data

    def get_position(self, obj: Profile) -> str | None:
        if not obj.position:
            return None
        return obj.position.name


class UserAdminWriteSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(
        choices=Profile.Roles.choices,
        default=Profile.Roles.TEACHER,
    )
    position = serializers.PrimaryKeyRelatedField(
        queryset=Position.objects.all(),
        allow_null=True,
        required=False,
    )
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        allow_null=True,
        required=False,
    )
    phone = serializers.CharField(required=False, allow_blank=True)
    birth_date = serializers.DateField(required=False, allow_null=True)
    scopus = serializers.URLField(required=False, allow_blank=True)
    scholar = serializers.URLField(required=False, allow_blank=True)
    research_id = serializers.CharField(required=False, allow_blank=True)
    user_id = serializers.CharField(required=False, allow_blank=True, source="user_id_str")

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "password",
            "first_name",
            "last_name",
            "email",
            "role",
            "position",
            "department",
            "phone",
            "birth_date",
            "scopus",
            "scholar",
            "research_id",
            "user_id",
        )
        extra_kwargs = {
            "password": {"write_only": True, "required": False},
            "email": {"required": False, "allow_blank": True},
            "first_name": {"required": False, "allow_blank": True},
            "last_name": {"required": False, "allow_blank": True},
        }

    def create(self, validated_data):
        profile_data = self._pop_profile_fields(validated_data)
        password = validated_data.pop("password", None)
        if not password:
            raise serializers.ValidationError({"password": "Parol majburiy."})
        user = User.objects.create_user(password=password, **validated_data)
        self._update_profile(user.profile, profile_data)
        return user

    def update(self, instance, validated_data):
        profile_data = self._pop_profile_fields(validated_data)
        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if password:
            instance.set_password(password)
            instance.save(update_fields=["password"])

        self._update_profile(instance.profile, profile_data)
        return instance

    def _pop_profile_fields(self, data: dict) -> dict:
        profile_fields = {}
        for field in [
            "role",
            "position",
            "department",
            "phone",
            "birth_date",
            "scopus",
            "scholar",
            "research_id",
            "user_id_str",
        ]:
            if field in data:
                profile_fields[field] = data.pop(field)

        user_id = profile_fields.pop("user_id_str", None)
        if user_id is not None:
            profile_fields["user_id_str"] = user_id
        return profile_fields

    def _update_profile(self, profile: Profile, data: dict) -> None:
        for attr, value in data.items():
            setattr(profile, attr, value)
        if not profile.department:
            profile.department = Department.objects.filter(
                name=Department.DEFAULT_NAME
            ).first()
        profile.save()


class UserAdminReadSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "profile",
        )


class UpdateProfileSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    birth_date = serializers.DateField(required=False, allow_null=True)
    scopus = serializers.URLField(required=False, allow_blank=True)
    scholar = serializers.URLField(required=False, allow_blank=True)
    research_id = serializers.CharField(required=False, allow_blank=True)
    user_id = serializers.CharField(required=False, allow_blank=True, source="user_id_str")

    def save(self):
        user = self.context["request"].user
        profile = user.profile
        
        # Update user fields
        if "first_name" in self.validated_data:
            user.first_name = self.validated_data["first_name"]
        if "last_name" in self.validated_data:
            user.last_name = self.validated_data["last_name"]
        user.save()
        
        # Update profile fields
        profile_fields = ["phone", "birth_date", "scopus", "scholar", "research_id", "user_id_str"]
        for field in profile_fields:
            if field in self.validated_data:
                setattr(profile, field, self.validated_data[field])
        profile.save()
        
        return profile


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=6)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Joriy parol noto'g'ri.")
        return value

    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        profile = getattr(user, "profile", None)
        if profile:
            token["role"] = profile.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        profile = self.user.profile
        data["user"] = ProfileSerializer(profile).data
        return data

