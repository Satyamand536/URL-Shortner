const express = require("express");
const {
  generateshortUrl,
  getAnalytics,
  getMyUrls,
  editRedirectUrl,
  deleteUrl,
  getQRCode,
} = require("../controllers/urlControl");

const router = express.Router();

router.post("/", generateshortUrl);
router.get("/my", getMyUrls);
router.get("/analytics/:shortId", getAnalytics);
router.get("/qrcode/:shortId", getQRCode);
router.patch("/:shortId", editRedirectUrl);
router.delete("/:shortId", deleteUrl);

module.exports = router;
