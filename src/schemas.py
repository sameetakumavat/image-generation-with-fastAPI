from typing import Optional
from pydantic import BaseModel, Field


class UserRequest(BaseModel):
    username: str = Field(min_length=3, max_length=20)
    first_name: str = Field(min_length=3, max_length=20)
    last_name: str = Field(min_length=3, max_length=20)
    email: str = Field(min_length=3, max_length=50)
    password: str
    is_active: bool = Field(default=True)
    role: str

class UserUpdateRequest(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[str] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str
    email: str
    hashed_password: str
    is_active: bool
    role: str

class ImageRequest(BaseModel):
    prompt: str = Field(min_length=5, max_length=100)

class ImageUpdateRequest(BaseModel):
    image_id: int
    prompt: str = Field(min_length=5, max_length=100)

class ImageResponse(BaseModel):
    id: int
    user_id: int
    prompt: str
    image_path: str
    image_name: str
    created_by: str
