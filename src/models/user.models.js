import mongoose from "mongoose";
import { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();
import ms from "ms";
// Define the User schema
const userSchema = new Schema(
  {
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
    userName: {
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
      lowercase: true,
      trim: true,
    },

    // Optional for people who only sign in with Google or GitHub; they can
    // add one later through "Forgot password"
    password: {
      type: String,
      required: [
        function () {
          return !this.oauth?.length;
        },
        "Password is required",
      ],
      trim: true,
    },

    // Google or GitHub accounts linked to this user, by the provider's own id
    oauth: {
      type: [
        {
          _id: false,
          provider: { type: String, enum: ["google", "github"], required: true },
          providerId: { type: String, required: true },
        },
      ],
      default: undefined,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    refreshToken: {
      type: String,
    },

    tokenVersion: {
      type: Number,
      default: 0,
    },

    forgotPasswordToken: {
      type: String,
    },

    forgotPasswordtokenExpiry  : {
      type: Date,
    },

    emailVerificationToken: {
      type: String,
    },
    emailVerificationtokenExpiry : {
      type: Date,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  },
);

//pre hook to hash password before saving

userSchema.pre("save", async function () {
  // Hash the password only when it is new or changed, and not when it was
  // removed (an account that only signs in with Google or GitHub)
  if (!this.isModified("password") || !this.password) return;

  // Hash the password with a salt round of 10

  this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare password for login

userSchema.methods.comparePassword = async function (candidatePassword) {
  // accounts created with Google or GitHub may have no password at all
  if (!this.password || typeof candidatePassword !== "string") return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT access token

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userName: this.userName,
      tokenVersion: this.tokenVersion ?? 0,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: ms(process.env.ACCESS_TOKEN_EXPIRATION) / 1000 },
  );
};

// Method to generate JWT refresh token

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: ms(process.env.REFRESH_TOKEN_EXPIRATION) / 1000,
  });
};

// Method to generate forgot password token

userSchema.methods.generateForgotPasswordToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  // Hash the token before saving it to the database
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const tokenExpiry  = Date.now() + ms("1h"); // 1 hour
  return { token, hashedToken, tokenExpiry  };
};

// Method to generate email verification token

userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");

  // Hash the token before saving it to the database
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const tokenExpiry  = new Date(Date.now() + ms("1h")); // 1 hour

  return { token, hashedToken, tokenExpiry  };
};

userSchema.index({ "oauth.provider": 1, "oauth.providerId": 1 }, { sparse: true });

const User = mongoose.model("User", userSchema);
export default User;
