import { Router } from "express";
import authController from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", authController.register);
router.post("/proctor-register", authController.proctorRegister);
router.post("/login", authController.login);
router.post("/proctor-login", authController.proctorLogin);
router.post("/logout", authController.logout);

export default router;