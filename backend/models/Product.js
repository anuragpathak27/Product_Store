import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
  },
  price: {
    type: Number,
    required: [true, "Product price is required"],
    min: [0, "Price must be a positive number"],
  },
  photo: {
    type: String, // Path to the uploaded product image
    required: [true, "Product photo is required"],
    validate: {
      validator: function (value) {
        // Ensure the value starts with '/uploads/' for uploaded files
        return /^\/uploads\//.test(value);
      },
      message: "Invalid photo path",
    },
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the admin user
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Product", productSchema);
