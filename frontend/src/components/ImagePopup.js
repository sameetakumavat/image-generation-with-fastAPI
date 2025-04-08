import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const ImagePopup = ({ onClose, onRefresh, editImage }) => {
  const [prompt, setPrompt] = useState(editImage ? editImage.prompt : "");
  const [loading, setLoading] = useState(false); // Loading state

  const handleSubmit = async () => {
    setLoading(true); // Show loading spinner
    try {
      const token = localStorage.getItem("token");
      if (editImage) {
        // Edit existing image
        await axios.put(
          `http://127.0.0.1:8000/image/update_prompt_and_regenerate/${editImage.id}`,
          { image_id: editImage.id, prompt }, // Include image_id in the request body
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Image updated successfully!");
      } else {
        // Add/Create new image
        await axios.post(
          "http://127.0.0.1:8000/image/image_generator",
          { prompt },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Image generated successfully!");
      }
      onRefresh(); // Refresh the list
      onClose(); // Close the popup
    } catch (error) {
      toast.error("Error processing request. Please try again.");
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

  return (
    <div className="popup-backdrop">
      <div className="popup-card">
        <h3>{editImage ? "Edit Image" : "Generate Image"}</h3>
        <div className="form-group">
          <label>Prompt</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        <div className="popup-actions">
          <button className="btn btn-primary mt-3" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              "Submit"
            )}
          </button>
          <button className="btn btn-secondary mt-3" onClick={onClose} disabled={loading}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImagePopup;
