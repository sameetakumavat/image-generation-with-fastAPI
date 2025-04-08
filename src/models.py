from typing import Dict, Any
from src.database import Base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey


class Users(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(String, nullable=False)

    def to_dict(self) -> Dict[Any, Any]:
        return {
            "id": self.id,
            "username": self.username,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "hashed_password": self.hashed_password,
            "is_active": self.is_active,
            "role": self.role,
        }



class ImagesGenerated(Base):
    __tablename__ = "image_generated"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    prompt = Column(String, nullable=False)
    image_path = Column(String, nullable=False)
    image_name = Column(String, nullable=False)
    created_by = Column(String, nullable=False, default="system")
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    def to_dict(self) -> Dict[Any, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "prompt": self.prompt,
            "image_path": self.image_path,
            "image_name": self.image_name,
            "created_by": self.created_by,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
