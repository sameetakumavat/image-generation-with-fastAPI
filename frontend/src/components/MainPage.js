import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import ImagePopup from "./ImagePopup";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const MainPage = () => {
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]); // For filtered images
  const [filter, setFilter] = useState(""); // Selected filter value
  const [filterOptions, setFilterOptions] = useState([]); // Unique "Created By" values
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
      setFilteredImages(imagesWithUrls); // Initialize filtered images

      // Extract unique "Created By" values for the dropdown
      const uniqueCreators = [...new Set(imagesWithUrls.map((img) => img.created_by))];
      setFilterOptions(uniqueCreators);
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

  // Download an image
  const handleDownload = useCallback(async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://127.0.0.1:8000/image/get_image_by_id/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      // Create a URL for the blob and trigger the download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `image_${id}.png`; // Set the filename
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url); // Clean up the URL object
    } catch (error) {
      toast.error("Error downloading the image. Please try again.");
    }
  }, []);

  // Logout and navigate to login page
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/");
    toast.info("Logged out successfully");
  }, [navigate]);

  // Filter images by "Created By"
  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilter(value);
    if (value === "") {
      setFilteredImages(images); // Show all images if no filter
    } else {
      setFilteredImages(images.filter((img) => img.created_by === value));
    }
  };

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

      <div className="d-flex align-items-center mb-3">
        <button className="btn btn-primary me-3" onClick={handleAdd}>
          Generate New Image
        </button>

        {/* Filter Dropdown */}
        <div className="filter-container">
          <label htmlFor="filter" className="form-label">
            Filter by Created By:
          </label>
          <select
            id="filter"
            className="form-select"
            value={filter}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            {filterOptions.map((creator) => (
              <option key={creator} value={creator}>
                {creator}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Image Grid */}
      <div className="image-grid">
        {filteredImages.map((img) => (
          <div key={img.id} className="image-box">
            {/* Prompt */}
            <div className="image-prompt">
              <strong>Prompt:</strong> {img.prompt}
            </div>

            {/* Image */}
            <img
              alt="Generated"
              className="image-preview"
              src={img.imageUrl || ""}
              onError={(e) => {
                e.target.style.display = "none"; // Hide if the image fails to load
              }}
            />

            {/* Actions */}
            <div className="image-actions">
              <div className="actions-label">Actions:</div>
              <button onClick={() => handleEdit(img)}>Edit</button>
              <button onClick={() => handleDelete(img.id)}>Delete</button>
              <button onClick={() => handleDownload(img.id)}>Download</button>
            </div>

            {/* Created By */}
            <div className="image-created-by">
              <strong>Created By:</strong> {img.created_by}
            </div>
          </div>
        ))}
      </div>

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
