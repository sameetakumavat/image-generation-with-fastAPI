from fastapi import FastAPI
from src.route import image_route, auth_route
from src.models import Base
from src.database import DataBaseConfig
from fastapi.middleware.cors import CORSMiddleware

db_config = DataBaseConfig()
Base.metadata.create_all(bind=db_config.engine)

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health_check")
def health_check():
    """
    Health check endpoint to verify if the server is running.
    """
    return {"status": "ok"}

app.include_router(auth_route.auth_router)
app.include_router(image_route.image_router)
