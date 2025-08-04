import express from "express";
import { login, signup,forgetPassword, user, verifyOtp, resetPassword, getOtpExpiry, logout } from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router=express.Router();

router.post("/signup",signup);
router.post("/login",login);
router.post("/forgetpassword",forgetPassword);
router.post("/verifyotp",verifyOtp,getOtpExpiry);
router.get("/user",authMiddleware,user);
router.post("/resetpassword",resetPassword);
router.get("/getotpexpiry",getOtpExpiry);
router.post("/logout", authMiddleware, logout);
export default router;
