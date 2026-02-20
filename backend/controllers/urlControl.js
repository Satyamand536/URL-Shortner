const { nanoid } = require("nanoid");
const ShortURL = require("../models/url");  // renamed: avoids shadowing global URL constructor
const QRCode = require("qrcode");

// ──────────────────────────────────────────────
// POST /api/url  — Create short URL + custom alias
// ──────────────────────────────────────────────
async function generateshortUrl(req, res) {
  const { url, customAlias } = req.body;

  if (!url) return res.status(400).json({ error: "URL is required" });

  // ── Validate destination URL (using global URL, NOT the model) ──
  try {
    const parsed = new globalThis.URL(url);
    if (parsed.protocol !== "https:")
      return res.status(400).json({ error: "Only HTTPS URLs are allowed" });
  } catch {
    return res.status(400).json({ error: "Invalid URL format. Make sure it starts with https://" });
  }

  // ── Validate custom alias (no slashes or special chars) ──
  if (customAlias) {
    const alias = customAlias.trim();
    if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
      return res.status(400).json({
        error: "Alias can only contain letters, numbers, hyphens (-) and underscores (_). No slashes allowed.",
      });
    }
    const exists = await ShortURL.findOne({ shortId: alias });
    if (exists)
      return res.status(409).json({ error: "Custom alias already taken. Try another." });
  }

  const shortId = customAlias ? customAlias.trim() : nanoid(8);

  const entry = await ShortURL.create({
    shortId,
    redirectURL: url,
    visitHistory: [],
    createdBy: req.user._id,
    auditLog: [
      {
        action: "CREATED",
        by: req.user._id,
        timestamp: Date.now(),
      },
    ],
  });

  return res.status(201).json({
    shortId: entry.shortId,
    shortUrl: `${process.env.BACKEND_URL || "http://localhost:8001"}/s/${entry.shortId}`,
    redirectURL: entry.redirectURL,
  });
}

// ──────────────────────────────────────────────
// GET /api/url/analytics/:shortId
// ──────────────────────────────────────────────
async function getAnalytics(req, res) {
  const result = await ShortURL.findOne({ shortId: req.params.shortId });
  if (!result) return res.status(404).json({ error: "URL not found" });

  // Timeline & Stats
  const timeline = {};
  const browsers = { Chrome: 0, Safari: 0, Firefox: 0, Other: 0 };
  const devices = { Mobile: 0, Desktop: 0, Tablet: 0 };

  result.visitHistory.forEach(({ timestamp, userAgent }) => {
    const date = new Date(timestamp).toISOString().split("T")[0];
    timeline[date] = (timeline[date] || 0) + 1;

    // Simulated parsing of user agent for "Pro" feel
    if (userAgent) {
        if (userAgent.includes("Chrome")) browsers.Chrome++;
        else if (userAgent.includes("Safari")) browsers.Safari++;
        else if (userAgent.includes("Firefox")) browsers.Firefox++;
        else browsers.Other++;

        if (userAgent.includes("Mobi")) devices.Mobile++;
        else if (userAgent.includes("Tablet")) devices.Tablet++;
        else devices.Desktop++;
    }
  });

  return res.json({
    shortId: result.shortId,
    redirectURL: result.redirectURL,
    totalClicks: result.visitHistory.length,
    timeline: Object.entries(timeline).map(([date, clicks]) => ({ date, clicks })),
    stats: {
        browsers: Object.entries(browsers).map(([name, value]) => ({ name, value })),
        devices: Object.entries(devices).map(([name, value]) => ({ name, value }))
    },
    createdAt: result.createdAt,
  });
}

// ──────────────────────────────────────────────
// GET /api/url/qrcode/:shortId
// ──────────────────────────────────────────────
async function getQRCode(req, res) {
    const { shortId } = req.params;

    // Find the entry to get the actual destination URL
    const entry = await ShortURL.findOne({ shortId });
    if (!entry) return res.status(404).json({ error: "URL not found" });

    // Encode the SHORT redirect URL (so click still gets tracked)
    // Use FRONTEND_URL (5173) if available so it goes through proxy
    // Use production host if available, otherwise fallback to request host
    const protocol = req.protocol;
    const host = req.get("host");
    const baseUrl = process.env.FRONTEND_URL || process.env.BACKEND_URL || `${protocol}://${host}`;
    const shortUrl = `${baseUrl}/s/${shortId}`;
    
    try {
        // Black dots on WHITE background — visible on screen AND downloadable
        const qrDataUrl = await QRCode.toDataURL(shortUrl, {
            color: {
                dark: "#000000",   // black dots — visible on white bg
                light: "#ffffff"   // white background — not transparent
            },
            width: 400,
            margin: 2
        });
        return res.json({ qrCode: qrDataUrl });
    } catch (err) {
        return res.status(500).json({ error: "Failed to generate QR code" });
    }
}

async function getMyUrls(req, res) {
  const urls = await ShortURL.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
  return res.json({ urls });
}

async function editRedirectUrl(req, res) {
  const { newUrl, newAlias } = req.body;
  console.log(`📝 EDIT REQ: shortId=${req.params.shortId}, newUrl=${newUrl}, newAlias=${newAlias}`);

  if (!newUrl && !newAlias) return res.status(400).json({ error: "New URL or Alias required" });

  // 1. Validate New URL (if provided)
  if (newUrl) {
    try {
        const parsed = new globalThis.URL(newUrl);
        if (parsed.protocol !== "https:")
        return res.status(400).json({ error: "Only HTTPS URLs are allowed" });
    } catch {
        return res.status(400).json({ error: "Invalid URL format" });
    }
  }

  // 2. Validate New Alias (if provided)
  let finalNewAlias = null;
  if (newAlias) {
    finalNewAlias = newAlias.trim();
    if (!/^[a-zA-Z0-9_-]+$/.test(finalNewAlias)) {
        return res.status(400).json({
            error: "Alias can only contain letters, numbers, hyphens (-) and underscores (_).",
        });
    }
    // Check availability (exclude current shortId)
    if (finalNewAlias !== req.params.shortId) {
        const exists = await ShortURL.findOne({ shortId: finalNewAlias });
        if (exists) {
            console.log(`❌ Alias taken: ${finalNewAlias}`);
            return res.status(409).json({ error: "Alias already taken" });
        }
    }
  }

  const entry = await ShortURL.findOne({ shortId: req.params.shortId });
  if (!entry) return res.status(404).json({ error: "URL not found" });

  if (entry.createdBy.toString() !== req.user._id.toString())
    return res.status(403).json({ error: "Not authorized to edit this URL" });

  // Apply Updates
  if (newUrl) entry.redirectURL = newUrl;
  if (finalNewAlias && finalNewAlias !== entry.shortId) {
      console.log(`🔄 Updating Alias: ${entry.shortId} -> ${finalNewAlias}`);
      entry.shortId = finalNewAlias;
  }

  entry.auditLog.push({ 
      action: "EDITED", 
      by: req.user._id, 
      timestamp: Date.now(),
      details: { newUrl: newUrl || "unchanged", newAlias: finalNewAlias || "unchanged" }
  });
  
  await entry.save();
  console.log(`✅ Update Saved! Current ShortID: ${entry.shortId}`);

  return res.json({ message: "URL updated successfully", shortId: entry.shortId });
}

async function deleteUrl(req, res) {
  const entry = await ShortURL.findOne({ shortId: req.params.shortId });
  if (!entry) return res.status(404).json({ error: "URL not found" });
  if (entry.createdBy.toString() !== req.user._id.toString())
    return res.status(403).json({ error: "Not authorized" });

  await entry.deleteOne();
  return res.json({ message: "URL deleted successfully" });
}

module.exports = { generateshortUrl, getAnalytics, getMyUrls, editRedirectUrl, deleteUrl, getQRCode };
