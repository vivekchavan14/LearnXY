import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { User } from "../models/User.js";
import { sendToken } from "../utils/sendToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import { Course } from "../models/Course.js";
import cloudinary from "cloudinary";
import getDataUri from "../utils/dataUri.js";
import { Stats } from "../models/Stats.js";

// REGISTER
export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;
  const file = req.file;

  if (!name || !email || !password || !file)
    return next(new ErrorHandler("Please enter all fields", 400));

  let user = await User.findOne({ email });
  if (user) return next(new ErrorHandler("User Already Exist", 409));

  const fileUri = getDataUri(file);
  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

  user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });

  sendToken(res, user, "Registered Successfully", 201);
});

// LOGIN
export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new ErrorHandler("Please enter all fields", 400));

  const user = await User.findOne({ email }).select("+password");

  if (!user) return next(new ErrorHandler("Incorrect Email or Password", 401));

  const isMatch = await user.comparePassword(password);
  if (!isMatch)
    return next(new ErrorHandler("Incorrect Email or Password", 401));

  sendToken(res, user, `Welcome back, ${user.name}`, 200);
});

// LOGOUT
export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Logged Out Successfully.",
    });
});

// GET MY PROFILE
export const getMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user,
  });
});

// CHANGE PASSWORD
export const changePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword)
    return next(new ErrorHandler("Please enter all fields", 400));

  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) return next(new ErrorHandler("Incorrect Old Password", 400));

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password Change Successfully...",
  });
});

// UPDATE PROFILE
export const updateProfile = catchAsyncError(async (req, res, next) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  if (email) user.email = email;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile Updated Successfully...",
  });
});

// UPDATE PROFILE PICTURE
export const updateProfilePicture = catchAsyncError(async (req, res, next) => {
  const file = req.file;
  const user = await User.findById(req.user._id);
  const fileUri = getDataUri(file);
  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  user.avatar = {
    public_id: myCloud.public_id,
    url: myCloud.secure_url,
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile Pic Updated Successfully...",
  });
});

// FORGET PASSWORD---> Not working in postman
export const forgetPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return next(new ErrorHandler("User Not Found...", 400));

  const resetToken = await user.getResetToken();

  await user.save();

  const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
  const message = `Click on the link to reset the password. ${url}. If you have not requested then please ignore.`;
  // send token via email
  await sendEmail(user.email, "CourseBundler Reset Password", message);

  res.status(200).json({
    success: true,
    message: `Reset token has been send to ${user.email}`,
  });
});

// RESET PASSWORD
export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: {
      $gt: Date.now(),
    },
  });

  if (!user)
    return next(new ErrorHandler("Token is Invalid or has been expired", 401));

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password Changed Successfully...",
  });
});

// ADMIN CONTROLLERS-->
// GET ALL USERS
export const getAllUsers = catchAsyncError(async (req, res, next) => {
    const users = await User.find({});
  
    res.status(200).json({
      success: true,
      users,
    });
  });
  
  // UPDATE USER ROLE
  export const updateUserRole = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
  
    if (!user) return next(new ErrorHandler("User Not Found", 404));
    if (user.role === "user") user.role = "admin";
    else user.role = "user";
  
    await user.save();
    res.status(200).json({
      success: true,
      message: "User Role Updated Successfully...",
    });
  });
  
  // DELETE USER
  export const deleteUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
  
    if (!user) return next(new ErrorHandler("User Not Found", 404));
  
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
});

  
