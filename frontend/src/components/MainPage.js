import React, { useState, useEffect } from "react";
import axios from "axios";
import ImagePopup from "./ImagePopup";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const MainPage = () => {
  const [images, setImages] = useState([]);
  const [showPopup, setShowPopup] = useState(false); // For Add/Create popup
  const [editImage, setEditImage] = useState(null); // For Edit popup
  const [loading, setLoading] = useState(true); // Global loading state
  const navigate = useNavigate();

  // Fetch all images
  const fetchImages = async () => {
    setLoading(true); // Start loading
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://127.0.0.1:8000/image/all_image_details", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const imagesWithLoadingState = response.data.map((img) => ({
        ...img,
        loading: true, // Add a loading state for each image
      }));
      setImages(imagesWithLoadingState);
    } catch (error) {
      toast.error("Error fetching images");
    } finally {
      setLoading(false); // Stop global loading
    }
  };

  // Update loading state for a specific image
  const updateImageLoadingState = (id, isLoading) => {
    setImages((prevImages) =>
      prevImages.map((img) =>
        img.id === id ? { ...img, loading: isLoading } : img
      )
    );
  };

  // Delete an image
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://127.0.0.1:8000/image/delete_image_by_id/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Image deleted successfully");
      fetchImages(); // Refresh the list
    } catch (error) {
      toast.error("Error deleting image");
    }
  };

  // Open Add/Create popup
  const handleAdd = () => {
    setShowPopup(true);
    setEditImage(null); // Ensure it's not in edit mode
  };

  // Open Edit popup
  const handleEdit = (image) => {
    setEditImage(image);
    setShowPopup(true);
  };

  // Logout and navigate to login page
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
    toast.info("Logged out successfully");
  };

  useEffect(() => {
    fetchImages();
  }, []);

  return (
    <div>
      {/* Global Dots Loader */}
      {loading && (
        <div className="global-spinner-backdrop">
          <div className="dots-loader">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="text-center">Dashboard</h2>
        <button className="btn btn-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <button className="btn btn-primary mb-3" onClick={handleAdd}>
        Generate New Image
      </button>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Prompt</th>
            <th>Created By</th>
            <th>Generated Image</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {images.map((img) => (
            <tr key={img.id}>
              <td>{img.id}</td>
              <td>{img.prompt}</td>
              <td>{img.created_by}</td>
              <td>
                <div style={{ position: "relative", width: "100px", height: "100px" }}>
                  {/* Dots loader while the image is loading */}
                  {img.loading && (
                    <div
                      className="dots-loader"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                  )}

                  {/* Image */}
                  <img
                    alt="Generated"
                    width="100"
                    style={{ display: img.loading ? "none" : "block" }}
                    onLoad={() => updateImageLoadingState(img.id, false)} // Hide dots when image loads
                    onError={(e) => {
                      e.target.style.display = "none"; // Hide if image fails to load
                      updateImageLoadingState(img.id, false); // Hide dots
                    }}
                    ref={(imgElement) => {
                      if (imgElement && img.loading) {
                        const token = localStorage.getItem("token");
                        axios
                          .get(img.image_url, {
                            headers: { Authorization: `Bearer ${token}` },
                            responseType: "blob",
                          })
                          .then((response) => {
                            const url = URL.createObjectURL(response.data);
                            imgElement.src = url; // Set the image source
                            updateImageLoadingState(img.id, false); // Hide dots
                          })
                          .catch(() => {
                            imgElement.style.display = "none"; // Hide if request fails
                            updateImageLoadingState(img.id, false); // Hide dots
                          });
                      }
                    }}
                  />
                </div>
              </td>
              <td>
                <button className="btn btn-info btn-sm me-2" onClick={() => handleEdit(img)}>
                  Edit
                </button>
                <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(img.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showPopup && (
        <ImagePopup
          onClose={() => setShowPopup(false)}
          onRefresh={fetchImages}
          editImage={editImage}
        />
      )}
    </div>
  );
};

export default MainPage;
