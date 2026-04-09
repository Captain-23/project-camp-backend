import { Router } from "express";
import { forgotPasswordRequest, login, logoutUser, refreshAccessToken, registerUser, verifyEmail } from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import { userLoginValidator, userRegisterValidator } from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"


const router = Router();

// Unsecured routes
router.route("/register").post(userRegisterValidator(), validate, registerUser);

router.route("/login").post(userLoginValidator(), validate, login);

router.route("/verify-email/:verificationToken").get(verifyEmail);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/forgot-password").post( userForgotPasswordValidator(), validate, forgotPasswordRequest);


router.route("/")
// secure routes
router.route("/logout").post(verifyJWT, logoutUser);

export default router;
