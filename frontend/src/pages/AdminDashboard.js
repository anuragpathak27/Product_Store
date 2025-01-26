import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
  });
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch admin's products
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/products", {
          withCredentials: true, // Important for session-based authentication
        });
        setProducts(response.data);
      } catch (err) {
        setError("Failed to fetch products. Please log in as admin.");
        navigate("/"); // Redirect to login if unauthorized
      }
    };

    fetchProducts();
  }, [navigate]);

  const handleAddProduct = async () => {
    if (!photo) {
      setError("Please upload a product photo");
      return;
    }

    const formData = new FormData();
    formData.append("name", newProduct.name);
    formData.append("price", newProduct.price);
    formData.append("photo", photo); // Add photo file to FormData

    try {
      const response = await axios.post(
        "http://localhost:5000/products/add",
        formData,
        {
          withCredentials: true, // Important for session-based authentication
          headers: {
            "Content-Type": "multipart/form-data", // Required for file uploads
          },
        }
      );
      setProducts([...products, response.data.product]);
      setNewProduct({ name: "", price: "" });
      setPhoto(null); // Reset photo input
    } catch (err) {
      setError("Failed to add product");
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/products/delete/${id}`,
        {
          method: "DELETE",
          credentials: "include", // Include cookies if authentication is required
        }
      );
      if (response.ok) {
        // Remove the deleted product from the state
        setProducts(products.filter((product) => product._id !== id));
      } else {
        const data = await response.json();
        setError(data.message || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      setError("Error deleting product. Please try again.");
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>Product Management</h2>
      {error && <div className="error">{error}</div>}
      <div>
        <input
          type="text"
          placeholder="Product Name"
          value={newProduct.name}
          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Price"
          value={newProduct.price}
          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files[0])} // Set selected file
        />
        <button onClick={handleAddProduct}>Add Product</button>
      </div>
      <div className="product-list">
        {products.map((product) => (
          <div className="product-card" key={product._id}>
            <img src={product.photo} alt={product.name} />
            <h3>{product.name}</h3>
            <p>${product.price}</p>
            <button onClick={() => handleDeleteProduct(product._id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
