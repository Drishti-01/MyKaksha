import { createHttpError } from "../utils/httpError.js";
import { normalizeStudyData } from "../services/studyDataStore.js";

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function sanitizeText(text) {
  if (typeof text !== "string") return "";
  return text
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}

function normalizeProjectPayload(payload = {}) {
  const technologies = Array.isArray(payload.technologies)
    ? payload.technologies
    : String(payload.technologies || "").split(",");

  return {
    title: String(payload.title || "").trim(),
    description: String(payload.description || "").trim(),
    startDate: String(payload.startDate || "").trim(),
    endDate: String(payload.endDate || "").trim(),
    technologies: technologies.map((item) => String(item || "").trim()).filter(Boolean),
    status: payload.status === "Completed" ? "Completed" : "In Progress",
    link: String(payload.link || "").trim(),
  };
}

export function validateSignup(req, _res, next) {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!name || !email || !password) {
    next(createHttpError(400, "Name, email, and password are required"));
    return;
  }

  if (password.length < 4) {
    next(createHttpError(400, "Password must be at least 4 characters"));
    return;
  }

  req.validatedAuth = { name, email, password };
  next();
}

export function validateLogin(req, _res, next) {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password) {
    next(createHttpError(400, "Email and password are required"));
    return;
  }

  req.validatedAuth = { email, password };
  next();
}

export function validateStudyDataPayload(req, _res, next) {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    next(createHttpError(400, "Study data must be a JSON object"));
    return;
  }

  req.validatedStudyData = normalizeStudyData(req.body);
  next();
}

export function validateProjectPayload(req, _res, next) {
  const project = normalizeProjectPayload(req.body ?? {});

  if (!isNonEmptyString(project.title)) {
    next(createHttpError(400, "Project title is required"));
    return;
  }

  if (!isNonEmptyString(project.description)) {
    next(createHttpError(400, "Project description is required"));
    return;
  }

  if (!isNonEmptyString(project.startDate)) {
    next(createHttpError(400, "Project start date is required"));
    return;
  }

  if (project.technologies.length === 0) {
    next(createHttpError(400, "At least one technology is required"));
    return;
  }

  req.validatedProject = project;
  next();
}

export function validateProjectStatusPatch(req, _res, next) {
  const status = req.body?.status === "Completed" ? "Completed" : req.body?.status === "In Progress" ? "In Progress" : "";

  if (!status) {
    next(createHttpError(400, "Status must be either 'In Progress' or 'Completed'"));
    return;
  }

  req.validatedProjectStatus = status;
  next();
}

export function validateChatMessage(req, _res, next) {
  const content = sanitizeText(req.body?.content || req.body?.text || "");
  
  if (!content || content.length === 0) {
    next(createHttpError(400, "Message content is required"));
    return;
  }

  if (content.length > 500) {
    next(createHttpError(400, "Message too long (max 500 characters)"));
    return;
  }

  req.validatedMessage = { content };
  next();
}

export function validateRoomCreation(req, _res, next) {
  const name = sanitizeText(req.body?.name || "");
  const type = req.body?.type === "private" ? "private" : "public";
  const focusStyle = req.body?.focusStyle === "silent" ? "silent" : "discussion";
  const weeklyGoalHours = Math.max(0, Math.min(168, Number(req.body?.weeklyGoalHours) || 0));

  if (!name || name.length < 3) {
    next(createHttpError(400, "Room name must be at least 3 characters"));
    return;
  }

  if (name.length > 50) {
    next(createHttpError(400, "Room name too long (max 50 characters)"));
    return;
  }

  req.validatedRoom = { name, type, focusStyle, weeklyGoalHours };
  next();
}

function normalizeStudyResourcePayload(payload = {}) {
  return {
    title: String(payload.title || "").trim(),
    url: String(payload.url || "").trim(),
    notes: String(payload.notes || "").trim(),
    categoryId: String(payload.categoryId || "").trim(),
  };
}

export function validateStudyResourcePayload(req, _res, next) {
  const resource = normalizeStudyResourcePayload(req.body ?? {});

  if (!isNonEmptyString(resource.title)) {
    next(createHttpError(400, "Resource title is required"));
    return;
  }

  if (!isNonEmptyString(resource.url)) {
    next(createHttpError(400, "Resource URL is required"));
    return;
  }

  if (!resource.url.startsWith("http://") && !resource.url.startsWith("https://")) {
    next(createHttpError(400, "Resource URL must start with http:// or https://"));
    return;
  }

  if (!isNonEmptyString(resource.categoryId)) {
    next(createHttpError(400, "Category is required"));
    return;
  }

  req.validatedStudyResource = {
    title: resource.title.slice(0, 200),
    url: resource.url.slice(0, 500),
    notes: resource.notes ? resource.notes.slice(0, 1000) : "",
    categoryId: resource.categoryId,
  };
  next();
}
