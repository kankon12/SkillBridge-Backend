import { Router } from "express";
import { getMe, updateProfile } from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";


const router = Router();

router.get("/me", authenticate, getMe);
router.patch("/profile", authenticate, updateProfile);

export default router;


