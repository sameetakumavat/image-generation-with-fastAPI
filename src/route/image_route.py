import os
from io import BytesIO
from datetime import datetime
from typing import Annotated
from sqlalchemy.orm import Session
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse

from src.schemas import ImageRequest, ImageResponse, ImageUpdateRequest
from src.services.ImageGenerationService import ImageGenerationService
from src.database import DataBaseConfig
from src.models import ImagesGenerated
from src.services.AuthService import AuthService

class ExceptionCustom(HTTPException):
    pass

image_router = APIRouter(prefix="/image", tags=["Image Generation"])

# Initialize services and create dependencies
image_gen = ImageGenerationService()
db_config = DataBaseConfig()
auth_service = AuthService()
image_gen.load_client()
db_dependency = Annotated[Session, Depends(db_config.get_db)]
user_dependency = Annotated[dict, Depends(auth_service.get_current_user)]


@image_router.get("/all_image_details")
async def get_all_image_details(user: user_dependency, db: db_dependency):
    try:
        if not user:
            raise ExceptionCustom(status_code=401, detail="Unauthorized access.")
        images = db.query(ImagesGenerated).all()
        image_files = [
            {
                "id": image.id,
                "user_id": image.user_id,
                "prompt": image.prompt,
                "image_path": image.image_path,
                "image_name": image.image_name,
                "created_by": image.created_by,
                "image_url": f"http://127.0.0.1:8000/image/get_image_by_id/{image.id}"  # Include image URL
            }
            for image in images]
        return image_files
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@image_router.get("/get_image_by_id/{image_id}")
async def get_image_by_id(user: user_dependency, db: db_dependency, image_id: int):
    try:
        if not user:
            raise ExceptionCustom(status_code=401, detail="Unauthorized access.")
        image = db.query(ImagesGenerated).filter(ImagesGenerated.id == image_id).first()
        if not image:
            raise ExceptionCustom(status_code=404, detail=f"Image not found for id: {image_id}")

        if not os.path.exists(image.image_path):
            raise ExceptionCustom(status_code=404, detail=f"Image path not found for path: {image.image_path}.")

        # Read the image file
        with open(image.image_path, "rb") as img_file:
            img_stream = BytesIO(img_file.read())
            img_stream.seek(0)

        return StreamingResponse(img_stream, media_type="image/png")
    except ExceptionCustom:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@image_router.get("/get_image_details_by_id/{image_id}")
def image_details_by_id(user: user_dependency, db: db_dependency, image_id: int):
    try:
        if not user:
            raise ExceptionCustom(status_code=401, detail="Unauthorized access.")
        image = db.query(ImagesGenerated).filter(ImagesGenerated.id == image_id).first()
        if not image:
            raise ExceptionCustom(status_code=404, detail=f"Image not found for id: {image_id}")
        return ImageResponse(**image.to_dict())
    except ExceptionCustom:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@image_router.post("/image_generator")
async def generate_image(user: user_dependency, db: db_dependency, request: ImageRequest):
    try:
        if not user:
            raise ExceptionCustom(status_code=401, detail="Unauthorized access.")
        image = image_gen.generate_image(request.prompt)

        # Define the output directory and file name and save the image
        output_dir = "generated_image"
        os.makedirs(output_dir, exist_ok=True)  # Ensure the directory exists
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_path = os.path.join(output_dir, f"generated_image_{timestamp}.png")
        image.save(file_path)
        print(f"Image saved at {file_path}")

        # Save image details in db
        image_model = ImagesGenerated(
            user_id=user.get("user_id"),
            prompt=request.prompt,
            image_path=file_path,
            image_name=file_path.split("\\")[-1],
            created_by=user.get("email"),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        db.add(image_model)
        db.commit()

        # Save the image to a BytesIO stream
        img_stream = BytesIO()
        image.save(img_stream, format="PNG")
        img_stream.seek(0)

        return StreamingResponse(img_stream, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@image_router.put("/update_prompt_and_regenerate/{prompt}")
def update_prompt_and_regenerate(user: user_dependency, db: db_dependency, request: ImageUpdateRequest):
    try:
        if not user:
            raise ExceptionCustom(status_code=401, detail="Unauthorized access.")
        image = db.query(ImagesGenerated).filter(ImagesGenerated.id == request.image_id).first()
        if not image:
            raise ExceptionCustom(status_code=404, detail=f"Image not found for id: {request.image_id}")

        # Regenerate the image
        new_image = image_gen.generate_image(request.prompt)

        # Save the new image and delete the old one
        os.remove(image.image_path)  # Remove the old image file
        output_dir = "generated_image"
        os.makedirs(output_dir, exist_ok=True)  # Ensure the directory exists
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_path = os.path.join(output_dir, f"generated_image_{timestamp}.png")
        new_image.save(file_path)
        print(f"Image saved at {file_path}")

        # Update the image record in the db
        image.user_id = user.get("user_id")
        image.prompt = request.prompt
        image.image_path = file_path
        image.image_name = file_path.split("\\")[-1]
        image.created_by = user.get("email")
        image.updated_at = datetime.now()
        db.commit()

        return {"message": f"Image with prompt '{request.prompt}' updated and regenerated successfully."}
    except ExceptionCustom:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@image_router.delete("/delete_image_by_id/{image_id}")
def delete_image(user: user_dependency, db:db_dependency, image_id: int):
    try:
        if not user:
            raise ExceptionCustom(status_code=401, detail="Unauthorized access.")
        image = db.query(ImagesGenerated).filter(ImagesGenerated.id == image_id).first()
        if not image:
            raise ExceptionCustom(status_code=404, detail=f"Image not found for id: {image_id}")

        # Delete the image file from the local dir and db
        if os.path.exists(image.image_path):
            os.remove(image.image_path)
        db.delete(image)
        db.commit()

        return {"message": f"Image with id {image_id} deleted successfully."}
    except ExceptionCustom:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
