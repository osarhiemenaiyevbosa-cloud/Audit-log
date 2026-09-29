const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const AuditLog = require("../models/AuditLog");
const { createAuditEvent } = require("../services/auditService");
function buildFilter(req) {
  const filter = {};
  if (req.user.role !== "SYSTEM_ADMIN") filter.companyId = req.user.companyId;
  if (req.query.companyId && req.user.role === "SYSTEM_ADMIN")
    filter.companyId = req.query.companyId;
  if (req.query.action) filter.action = req.query.action;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.userId) filter.actorId = req.query.userId;
  if (req.query.resourceType) filter.resourceType = req.query.resourceType;
  if (req.query.from || req.query.to) {
    filter.timestamp = {};
    if (req.query.from) filter.timestamp.$gte = new Date(req.query.from);
    if (req.query.to) filter.timestamp.$lte = new Date(req.query.to);
  }
  if (req.query.search) {
    const rx = new RegExp(
      req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    filter.$or = [
      { eventId: rx },
      { description: rx },
      { resourceType: rx },
      { action: rx },
      { resourceId: rx },
    ];
  }
  return filter;
}
async function listAuditLogs(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const filter = buildFilter(req);
    const [data, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("actorId", "name email role")
        .populate("companyId", "name")
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    next(e);
  }
}
async function getAuditLog(req, res, next) {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role !== "SYSTEM_ADMIN") filter.companyId = req.user.companyId;
    const log = await AuditLog.findOne(filter)
      .populate("actorId", "name email role")
      .populate("companyId", "name");
    if (!log)
      return res
        .status(404)
        .json({ success: false, message: "Audit event not found" });
    res.json({ success: true, data: log });
  } catch (e) {
    next(e);
  }
}
async function importAuditLogs(req, res, next) {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "CSV file is required" });
    const content = fs.readFileSync(req.file.path, "utf8");
    const rows = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    const errors = [];
    let successRows = 0;
    const documents = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.action || !row.resourceType) {
        errors.push({
          row: i + 2,
          error: "action and resourceType are required",
        });
        continue;
      }
      documents.push({
        eventId: row.eventId || `IMP-${Date.now()}-${i + 1}`,
        companyId: req.user.companyId,
        actorId: req.user._id,
        action: row.action,
        resourceType: row.resourceType,
        resourceId: row.resourceId || null,
        timestamp: row.timestamp ? new Date(row.timestamp) : new Date(),
        status: row.status === "FAILED" ? "FAILED" : "SUCCESS",
        metadata: row.metadata
          ? { imported: true, source: row.metadata }
          : { imported: true },
        description: row.description || "Imported audit record",
      });
    }
    if (documents.length) {
      try {
        const inserted = await AuditLog.insertMany(documents, {
          ordered: false,
        });
        successRows = inserted.length;
      } catch (err) {
        successRows = err.insertedDocs?.length || 0;
        if (err.writeErrors)
          err.writeErrors.forEach((w) => errors.push({ error: w.errmsg }));
      }
    }
    fs.unlinkSync(req.file.path);
    await createAuditEvent({
      req,
      action: "IMPORT_AUDIT",
      resourceType: "AuditLog",
      metadata: {
        totalRows: rows.length,
        successRows,
        failedRows: errors.length,
      },
      description: "Bulk audit log import completed",
    });
    res.json({
      success: true,
      summary: {
        totalRows: rows.length,
        successRows,
        failedRows: errors.length,
      },
      errors,
    });
  } catch (e) {
    if (req.file?.path && fs.existsSync(req.file.path))
      fs.unlinkSync(req.file.path);
    next(e);
  }
}

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}
async function exportAuditLogs(req, res, next) {
  try {
    const filter = buildFilter(req);
    const rows = await AuditLog.find(filter)
      .populate("actorId", "name email")
      .populate("companyId", "name")
      .sort({ timestamp: -1 })
      .lean();
    const header = [
      "eventId",
      "timestamp",
      "company",
      "actor",
      "action",
      "resourceType",
      "resourceId",
      "status",
      "ipAddress",
      "description",
    ];
    const lines = [header.join(",")];
    for (const row of rows)
      lines.push(
        [
          row.eventId,
          row.timestamp?.toISOString(),
          row.companyId?.name,
          row.actorId?.email || row.actorId?.name,
          row.action,
          row.resourceType,
          row.resourceId,
          row.status,
          row.ipAddress,
          row.description,
        ]
          .map(csvEscape)
          .join(","),
      );
    await createAuditEvent({
      req,
      action: "EXPORT_AUDIT",
      resourceType: "AuditLog",
      metadata: { exportedRows: rows.length },
      description: "Audit logs exported",
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="audit-logs.csv"',
    );
    res.send(lines.join("\n"));
  } catch (e) {
    next(e);
  }
}
module.exports = {
  listAuditLogs,
  getAuditLog,
  importAuditLogs,
  exportAuditLogs,
};
