from typing import Dict, List, Optional

from fastapi import Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import IndustryProfile, Tenant, User


class ProfileService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    def create_profile(self, profile_data: Dict) -> IndustryProfile:
        """Create a new industry profile with validation"""
        if not profile_data.get("id") or not profile_data.get("name"):
            raise ValueError("Profile must have id and name")

        profile = IndustryProfile(**profile_data)
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def get_profile(self, profile_id: str) -> Optional[IndustryProfile]:
        """Retrieve a profile by ID"""
        return (
            self.db.query(IndustryProfile)
            .filter(IndustryProfile.id == profile_id)
            .first()
        )

    def update_profile(
        self, profile_id: str, updates: Dict
    ) -> Optional[IndustryProfile]:
        """Update an existing profile with compatibility checks"""
        profile = self.get_profile(profile_id)
        if not profile:
            return None

        for key, value in updates.items():
            if hasattr(profile, key):
                setattr(profile, key, value)
            else:
                raise ValueError(f"Invalid profile field: {key}")

        self.db.commit()
        self.db.refresh(profile)
        return profile

    def delete_profile(self, profile_id: str) -> bool:
        """Delete a profile and clean up dependencies"""
        profile = self.get_profile(profile_id)
        if not profile:
            return False

        # Find dependent tenants/users
        dependent_tenants = (
            self.db.query(Tenant).filter(Tenant.industry_profile == profile_id).all()
        )

        dependent_users = (
            self.db.query(User).filter(User.preferred_profile == profile_id).all()
        )

        if dependent_tenants or dependent_users:
            raise ValueError("Profile has active dependencies")

        self.db.delete(profile)
        self.db.commit()
        return True

    def get_tenant_profile(self, tenant_id: str) -> Optional[IndustryProfile]:
        """Get active profile for a tenant"""
        tenant = self.db.query(Tenant).get(tenant_id)
        return tenant.industry_profile

    def set_tenant_profile(self, tenant_id: str, profile_id: str) -> Optional[Tenant]:
        """Assign a profile to a tenant with validation"""
        tenant = self.db.query(Tenant).get(tenant_id)
        profile = self.get_profile(profile_id)

        if not profile:
            return None

        tenant.industry_profile = profile_id
        tenant.profile_settings = profile.default_settings or {}
        self.db.commit()
        self.db.refresh(tenant)
        return tenant

    def get_user_profile(self, user_id: str) -> Optional[IndustryProfile]:
        """Get user's preferred profile"""
        user = self.db.query(User).get(user_id)
        return user.preferred_profile

    def set_user_profile(self, user_id: str, profile_id: str) -> Optional[User]:
        """Set user's preferred profile"""
        user = self.db.query(User).get(user_id)
        profile = self.get_profile(profile_id)

        if not profile:
            return None

        user.preferred_profile = profile_id
        user.profile_customizations = profile.default_customizations or {}
        self.db.commit()
        self.db.refresh(user)
        return user

    def validate_profile_compatibility(
        self, profile_id: str, workflow_type: str
    ) -> bool:
        """Check if profile supports specific workflow patterns"""
        profile = self.get_profile(profile_id)
        if not profile:
            return False

        return workflow_type in profile.workflow_patterns

    def get_compatible_profiles(self, workflow_type: str) -> List[IndustryProfile]:
        """Find all profiles compatible with a workflow type"""
        return (
            self.db.query(IndustryProfile)
            .filter(IndustryProfile.workflow_patterns.contains([workflow_type]))
            .all()
        )
