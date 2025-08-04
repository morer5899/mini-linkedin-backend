import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // Authentication fields
  username: {
    type: String,
    required: true,
    trim: true,
    index: true  // Index for username queries
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true  
  },
  password: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    default: "",
    maxlength: 500
  },
  profilePicture: {
    type: String,
    default: ""
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    index: true  
  }],
  otp: {
    type: String,
    default: null,
    index: true, 
    sparse: true  
  },
  otpExpiryTime: {
    type: Number,
    default: null,
    index: true,
    sparse: true
  },
  resetPasswordExpiry: {
    type: Number,
    default: null,
    index: true,
    sparse: true
  }
}, { timestamps: true });


userSchema.index({ username: 'text', bio: 'text' }); 
userSchema.index({ createdAt: -1 }); 
userSchema.index({ updatedAt: -1 }); 

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;