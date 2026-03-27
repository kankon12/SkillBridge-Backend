import { Router } from "express";
import { getMe, updateProfile } from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";


const router = Router();

router.get("/me", authenticate, getMe);
router.patch("/profile", authenticate, updateProfile);

export default router;
