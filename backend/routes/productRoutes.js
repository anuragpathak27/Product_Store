import express from "express";
import Product from "../models/Product.js";
import { ensureAuthenticated, ensureAdmin } from "../middlewares/auth.js"; // Middleware for auth
import multer from "multer";
import path from "path";
import fs from "fs"; // For file deletion (optional)

const router = express.Router();

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Make sure 'uploads' folder exists, if not, create it
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir); // Directory to store uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  },
});

const upload = multer({ storage });

// Add a new product with photo upload
router.post(
  "/add",
  ensureAuthenticated,
  ensureAdmin,
  upload.single("photo"), // Middleware for handling file upload
  async (req, res) => {
    const { name, price } = req.body;
    const userId = req.user.id; // Admin's ID from Passport
    const photo = req.file ? `/uploads/${req.file.filename}` : null; // File path

    if (!name || !price || !photo) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const newProduct = new Product({ name, price, photo, userId });
      await newProduct.save();
      res.status(201).json({ message: "Product added successfully", product: newProduct });
    } catch (error) {
      res.status(500).json({ message: "Failed to add product", error: error.message });
    }
  }
);

// Get all products created by the logged-in admin
router.get("/", ensureAuthenticated, ensureAdmin, async (req, res) => {
  const userId = req.user.id; // Admin's ID

  try {
    const products = await Product.find({ userId });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
});

// Update a product
router.put(
  "/update/:id",
  ensureAuthenticated,
  ensureAdmin,
  upload.single("photo"), // Middleware for handling file upload
  async (req, res) => {
    const { id } = req.params;
    const { name, price } = req.body;
    const userId = req.user.id; // Admin's ID
    const photo = req.file ? `/uploads/${req.file.filename}` : null; // File path

    try {
      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.userId.toString() !== userId.toString()) {
        return res.status(403).json({ message: "You can only update your own products" });
      }

      // Optionally delete the old photo file before updating
      if (photo && product.photo) {
        const oldPhotoPath = path.join(path.resolve(), product.photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath); // Delete old photo
        }
      }

      product.name = name || product.name;
      product.price = price || product.price;
      product.photo = photo || product.photo;

      const updatedProduct = await product.save();
      res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
    } catch (error) {
      res.status(500).json({ message: "Failed to update product", error: error.message });
    }
  }
);

// Delete a product
router.delete("/delete/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // Admin's ID

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only delete your own products" });
    }

    // Optionally delete the photo file before removing the product
    if (product.photo) {
      const photoPath = path.join(path.resolve(), product.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath); // Delete product's photo
      }
    }

    await product.deleteOne();
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
});


// Serve static files for uploaded photos
router.use("/uploads", express.static(path.join(path.resolve(), "uploads")));


// Export the router
export default router;
