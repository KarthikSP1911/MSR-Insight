import { Router } from "express";
import authController from "../controllers/auth.controller.js";
import validate from "../middlewares/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  proctorRegisterSchema,
  proctorLoginSchema,
} from "../schemas/auth.schema.js";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/proctor-register", validate(proctorRegisterSchema), authController.proctorRegister);
router.post("/login", validate(loginSchema), authController.login);
router.post("/proctor-login", validate(proctorLoginSchema), authController.proctorLogin);
router.post("/logout", authController.logout);
router.get("/profile", authController.profile);

export default router;