import express from "express";
import {
  getNotices,
  addNotice,
  deleteNotice,
} from "../controllers/noticeController.js";

const router = express.Router();

router.get("/", getNotices);
router.post("/", addNotice);
router.delete("/:notice_id", deleteNotice);
export default router;
