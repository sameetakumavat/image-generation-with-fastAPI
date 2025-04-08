import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  const fetchImages = useCallback(async () => {
    setLoading(true); // Start loading
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://127.0.0.1:8000/image/all_image_details", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch image blobs and generate URLs
      const imagesWithUrls = await Promise.all(
        response.data.map(async (img) => {
          try {
            const imageResponse = await axios.get(img.image_url, {
              headers: { Authorization: `Bearer ${token}` },
              responseType: "blob",
            });
            const imageUrl = URL.createObjectURL(imageResponse.data);
            return { ...img, imageUrl, loading: false }; // Add the image URL to the state
          } catch {
            return { ...img, imageUrl: null, loading: false }; // Handle errors gracefully
          }
        })
      );

      setImages(imagesWithUrls); // Update state with images and their URLs
    } catch (error) {
      toast.error("Error fetching images");
    } finally {
      setLoading(false); // Stop global loading
    }
  }, []);

  // Delete an image
  const handleDelete = useCallback(
    async (id) => {
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
    },
    [fetchImages]
  );

  // Open Add/Create popup
  const handleAdd = useCallback(() => {
    setShowPopup(true);
    setEditImage(null); // Ensure it's not in edit mode
  }, []);

  // Open Edit popup
  const handleEdit = useCallback((image) => {
    setEditImage(image);
    setShowPopup(true);
  }, []);

  // Logout and navigate to login page
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/");
    toast.info("Logged out successfully");
  }, [navigate]);

  // Memoize sorted images to avoid recalculating on every render
  const sortedImages = useMemo(() => {
    return [...images].sort((a, b) => a.id - b.id);
  }, [images]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

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
          {sortedImages.map((img) => (
            <tr key={img.id}>
              <td>{img.id}</td>
              <td>{img.prompt}</td>
              <td>{img.created_by}</td>
              <td>
                <div style={{ position: "relative", width: "100px", height: "100px" }}>
                  {/* Image */}
                  <img
                    alt="Generated"
                    width="100"
                    style={{ display: img.imageUrl ? "block" : "none" }}
                    src={img.imageUrl || ""}
                    onError={(e) => {
                      e.target.style.display = "none"; // Hide if the image fails to load
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
