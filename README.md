# Image Generation Project

This project is a web-based application that allows users to generate images based on prompts using a Hugging Face model. It includes user authentication, image generation, and management features.

---

## **Features**
- User authentication (Login/Register).
- Generate images based on user-defined prompts.
- Edit and delete generated images.
- Responsive UI with toast notifications for feedback.

---

## **Technologies Used**
- **Frontend**: React, Bootstrap, React Router, React Toastify
- **Backend**: FastAPI, SQLAlchemy, Hugging Face API
- **Database**: SQLite (or your configured database)
- **Environment**: Python 3.9+, Node.js 16+

---

## **Setup Instructions**

### **Backend Setup**
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/image-generation-project.git
   cd image-generation-project

# Local requirements
1. Setup Environment Variables:
- Copy `sample.env` to `.env` in the root directory.
- Fill in the required values (e.g., database URL, API keys, JWT secret).
2. Install requirements.txt for BE and npm install for FE node modules
3. In main dir run cmd "uvicorn main:app --reload" to get BE fastapi swagger url "http://127.0.0.1:8000/docs"
4. In frontend dir run cmd "npm start" to get FE UI url "http://localhost:3000"


### Necessary Changes for Deployment
1. Set up a production database (e.g., PostgreSQL) and update the `DATABASE_URL` in `.env`.
2. Configure environment variables on the deployment platform (e.g., Render, AWS).
3. Use cloud storage (e.g., AWS S3) for generated images and update the code to store image URLs in the database.
4. Run database migrations:
   ```bash
   alembic upgrade head

### Running Tests
- Run the following command to execute tests:
  ```bash
  pytest

### Frontend Build for Deployment
- Run the following command in the [frontend](http://_vscodecontentref_/3) directory:
  ```bash
  npm run build
