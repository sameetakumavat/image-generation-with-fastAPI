from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated
from sqlalchemy.orm import Session

from src.database import DataBaseConfig
from src.models import Users
from src.services.AuthService import AuthService
from src.schemas import UserRequest, UserUpdateRequest, UserResponse

class ExceptionCustom(HTTPException):
    pass

auth_router = APIRouter(prefix="/auth", tags=["auth"])

# Initialize AuthService and DataBaseConfig and create dependencies
auth_service = AuthService()
db_config = DataBaseConfig()
db_dependency = Annotated[Session, Depends(db_config.get_db)]


@auth_router.post("/token")
def login_user_for_access_token(db: db_dependency, user: Annotated[OAuth2PasswordRequestForm, Depends()]):
    try:
        user_authenticated = auth_service.authenticate_user(db, user.username, user.password)
        if not user_authenticated:
            raise ExceptionCustom(status_code=401, detail="Invalid username or password")
        token = auth_service.generate_token(user_authenticated.id, user.username, user_authenticated.email, timedelta(minutes=30))
        return {"access_token": token, "token_type": "bearer"}
    except ExceptionCustom:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@auth_router.post("/create_user")
async def create_user(db: db_dependency, user: UserRequest):
    try:
        user = Users(
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            hashed_password=auth_service.bcrypt_context.hash(user.password),
            is_active=user.is_active,
            role=user.role
        )
        db.add(user)
        db.commit()
        return {"message": "User created successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@auth_router.get("/get_all_users")
async def get_all_users(db: db_dependency):
    try:
        users = db.query(Users).all()
        return [UserResponse(**user.to_dict()) for user in users]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@auth_router.get("/get_user/{user_id}")
async def get_user_by_id(db: db_dependency, user_id: int):
    try:
        user = db.query(Users).filter(Users.id == user_id).first()
        if not user:
            raise ExceptionCustom(status_code=404, detail="User not found")
        return UserResponse(**user.to_dict())
    except ExceptionCustom:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@auth_router.put("/update_user_info/{user_id}")  
def update_user_info(db: db_dependency, user_id: int, user: UserUpdateRequest):
    try:
        db_user = db.query(Users).filter(Users.id == user_id).first()
        if not db_user:
            raise ExceptionCustom(status_code=404, detail="User not found")
        
        update_fields = {
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "is_active": user.is_active,
            "role": user.role,
        }
        for field, value in update_fields.items():
            if value is not None:
                setattr(db_user, field, value)

        if user.password:
            db_user.hashed_password = auth_service.bcrypt_context.hash(user.password)
        
        db.add(db_user)
        db.commit()
        return {"message": "User updated successfully."}
    except ExceptionCustom:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@auth_router.delete("/delete_user/{user_id}")
async def delete_user(db: db_dependency, user_id: int):
    try:
        user = db.query(Users).filter(Users.id == user_id).first()
        if not user:
            raise ExceptionCustom(status_code=404, detail="User not found")
        db.delete(user)
        db.commit()
        return {"message": "User deleted successfully."}
    except ExceptionCustom:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
