const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");
const {
  listAuditLogs,
  getAuditLog,
  importAuditLogs,
  exportAuditLogs,
} = require("../controllers/auditcontroller");
const { PERMISSIONS } = require("../utils/constants");
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype === "text/csv" ||
    file.originalname.toLowerCase().endsWith(".csv")
      ? cb(null, true)
      : cb(new Error("Only CSV files are allowed")),
});
router.use(protect);
router.get("/", requirePermission(PERMISSIONS.VIEW_AUDIT), listAuditLogs);
router.get(
  "/export/csv",
  requirePermission(PERMISSIONS.EXPORT_AUDIT),
  exportAuditLogs,
);
router.get("/:id", requirePermission(PERMISSIONS.VIEW_AUDIT), getAuditLog);
router.post(
  "/import",
  requirePermission(PERMISSIONS.IMPORT_AUDIT),
  upload.single("file"),
  importAuditLogs,
);

module.exports = router;
