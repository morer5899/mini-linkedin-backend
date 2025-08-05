import sendEmail from "../config/sendEmail.js";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Post from "../models/postModel.js";
export const signup = async (req, res) => {
  try {
    const { username, email, password, bio = "" } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "All required fields are missing" });
    }

    // Validate bio length
    if (bio && bio.length > 500) {
      return res.status(400).json({ success: false, message: "Bio must be 500 characters or less" });
    }

    // Use indexed email field for faster lookup
    const [existingUser, hashedPassword] = await Promise.all([
      User.findOne({ $or: [{ email }, { username }] }).select('_id').lean(),
      bcrypt.hash(password, 10),
    ]);

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "Email or username already in use" 
      });
    }

    const newUser = await User.create({ 
      username, 
      email, 
      password: hashedPassword,
      bio 
    });

    return res.status(201).json({ 
      success: true, 
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        bio: newUser.bio
      }
    });

  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const user = await User.findOne({ email }).select("password").lean();

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const [isMatch, token] = await Promise.all([
      bcrypt.compare(password, user.password),
      jwt.sign(
        { id: user._id, email: user.email }, 
        process.env.JWT_SECRET, 
        { expiresIn: "7d" } // Changed from 1h to 7d to match cookie
      ),
    ]);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({ 
      success: true, 
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

  
    const user = await User.findOne({ email })
      .select('_id email')
      .lean();

    if (!user) {
      return res.status(400).json({ success: false, message: "User does not exist" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiryTime = Date.now() + 1000 * 60 * 4; 

    await User.updateOne(
      { _id: user._id },
      { otp, otpExpiryTime }
    );

    
    sendEmail(email, "Password Reset OTP", `Your OTP is: ${otp}`)
      .catch(err => console.error("Email send error:", err));

    return res.status(200).json({ 
      success: true, 
      message: "OTP sent successfully",
      otpExpiryTime 
    });

  } catch (error) {
    console.error("Forget Password Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { otp, email } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    // Query indexed fields (email, otp, otpExpiryTime)
    const user = await User.findOne({ email })
      .select('otp otpExpiryTime')
      .lean();

    if (!user) {
      return res.status(400).json({ success: false, message: "User does not exist" });
    }

    if (!user.otp || !user.otpExpiryTime || Date.now() > user.otpExpiryTime) {
      return res.status(400).json({ success: false, message: "OTP has expired" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const resetPasswordToken = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1h" }
    );

    res.cookie("resetPasswordToken", resetPasswordToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 3600000,
    });

    // Update indexed resetPasswordExpiry field
    await User.updateOne(
      { _id: user._id },
      { 
        otp: null, 
        otpExpiryTime: null, 
        resetPasswordExpiry: Date.now() + 1000 * 60 * 60 
      }
    );

    return res.status(200).json({ success: true, message: "OTP verified successfully" });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getOtpExpiry = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

   
    const user = await User.findOne({ email })
      .select('otpExpiryTime')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.otpExpiryTime) {
      return res.status(400).json({ success: false, message: "OTP is expired" });
    }

    return res.status(200).json({ 
      success: true, 
      otpExpiryTime: user.otpExpiryTime 
    });

  } catch (error) {
    console.error("Get OTP Expiry Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const resetPasswordToken = req.cookies.resetPasswordToken;

    if (!resetPasswordToken) {
      return res.status(401).json({ success: false, message: "Access Denied" });
    }

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "Both password fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const decoded = jwt.verify(resetPasswordToken, process.env.JWT_SECRET);

    // Query indexed resetPasswordExpiry field
    const user = await User.findById(decoded.id)
      .select('resetPasswordExpiry')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.resetPasswordExpiry || Date.now() > user.resetPasswordExpiry) {
      return res.status(400).json({ success: false, message: "Reset session expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update indexed password field
    await User.updateOne(
      { _id: decoded.id },
      { 
        password: hashedPassword, 
        resetPasswordExpiry: null 
      }
    );

    res.clearCookie("resetPasswordToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    return res.status(200).json({ success: true, message: "Password reset successful" });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const user = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const user = await User.findById(userId)
      .select('-password -otp -otpExpiryTime -resetPasswordExpiry')
      .populate({
        path: 'posts',
        select: 'content createdAt',
        options: { sort: { createdAt: -1 } } // Sort posts by newest first
      })
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });

  } catch (error) {
    console.error("User Fetch Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    return res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
