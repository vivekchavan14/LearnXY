import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendEmail } from "../utils/sendEmail.js";

// CONTACT
export const contact = catchAsyncError(async (req, res, next) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message)
    return next(new ErrorHandler("Please enter all fields...", 400));

  const to = process.env.MY_MAIL;
  const subject = "Contact From CourseBundler";
  const text = `Hey, I am ${name} and my Email is ${email}. \n ${message}`;

  await sendEmail(to, subject, text);

  res.status(200).json({
    success: true,
    message: "Your message has been sent",
  });
});

// COURSE REQUEST
export const courseRequest = catchAsyncError(async (req, res, next) => {
  const { name, email, course } = req.body;

  if (!name || !email || !course)
    return next(new ErrorHandler("Please enter all fields...", 400));

  const to = process.env.MY_MAIL;
  const subject = "Request for a course on CourseBundler";
  const text = `Hey, I am ${name} and my Email is ${email}. \n ${course}`;

  await sendEmail(to, subject, text);

  res.status(200).json({
    success: true,
    message: "Your request has been sent",
  });
});
