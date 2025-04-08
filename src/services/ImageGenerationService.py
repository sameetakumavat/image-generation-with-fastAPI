import os
from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from PIL import Image

load_dotenv()

class ImageGenerationService:
    def __init__(self):
        self.api_key = os.getenv("HUGGINGFACEHUB_API_TOKEN")
        self.model_name = os.getenv("MODEL_NAME")
        self.client = None

    def load_client(self):
        self.client = InferenceClient(api_key=self.api_key)

    def generate_image(self, prompt):
        if self.client is None:
            raise ValueError("Client not initialized. Please call load_client() first.")

        # Generate image using the Hugging Face Inference API
        image = self.client.text_to_image(prompt, model=self.model_name)

        if isinstance(image, Image.Image):
            return image
        else:
            raise ValueError("Failed to generate image.")