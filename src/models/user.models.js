import mongoose from "mongoose";
import { Schema } from "mongoose";

// Define the User schema
const userSchema = new Schema({
  avatar: {
    type: {
      url: String,
      localPath: String,
    },
    default: {
      url: "https://placehold.co/200x200",
      localPath: "",
    },
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  fullName: {
    type: String,
    required: true,
    trim: true,
  },

  password: {
    type: String,
    required: [true, "Password is required"],
    trim: true,
  },

  isemailVerified: {
    type: Boolean,
    default: false,
  },

  refreshToken: {
    type: String,
  },

  forgotPasswordToken: {
    type: String,
  },

  forgotPasswordTokenExpiry: {
    type: Date,
  },

  emailVerificationToken: {
    type: String,
  },
  emailVerificationTokenExpiry: {
    type: Date,
  },

},
{
    timestamps: true,  // Automatically adds createdAt and updatedAt fields
});

//methods 

const User = mongoose.model("User", userSchema);
export default User;
