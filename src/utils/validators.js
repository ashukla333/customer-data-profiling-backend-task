"use strict";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const KNOWN_PROPERTY_TYPES = ["rental", "sale"];

const KNOWN_PREFERRED_TYPES = new Set(["apartment", "house", "condo", "townhouse"]);

function isValidEmail(email) {
    return typeof email === "string" && EMAIL_REGEX.test(email.trim());
}

function standardizePhone(phone) {
    if (typeof phone !== "string" && typeof phone !== "number") return null;

    const digits = String(phone).trim().replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) return null;

    return `+${digits}`;
}

function phoneKey(phone) {
    return String(phone).replace(/\D/g, "");
}

function normalizePropertyType(value) {
    if (typeof value !== "string") return null;
    const v = value.trim().toLowerCase();
    return KNOWN_PROPERTY_TYPES.includes(v) ? v : null;
}

function normalizePreferredType(value) {
    const v = typeof value === "string" ? value.trim().toLowerCase() : "";
    return { value: v, known: KNOWN_PREFERRED_TYPES.has(v) };
}

function parseBudget(value) {
    if (typeof value === "number") {
        return Number.isFinite(value) && value > 0 ? value : null;
    }
    if (typeof value === "string") {
        const cleaned = value.replace(/[^0-9.]/g, "");
        if (cleaned === "") return null;
        const n = Number(cleaned);
        return Number.isFinite(n) && n > 0 ? n : null;
    }
    return null;
}

function normalizeDate(value) {
    if (typeof value !== "string") return null;
    const v = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    const parsed = new Date(v);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString().slice(0, 10) === v ? v : null;
}

function validateAndClean(record) {
    const errors = [];

    const phone = standardizePhone(record.phone);
    if (!phone) errors.push("invalid or missing phone number");

    const email = isValidEmail(record.email)
        ? String(record.email).trim().toLowerCase()
        : null;
    if (!email) errors.push("invalid or missing email");

    const property_type = normalizePropertyType(record.property_type);
    if (!property_type) errors.push("property_type must be 'rental' or 'sale'");

    const budget = parseBudget(record.budget);
    if (budget === null) errors.push("invalid or missing budget");

    const contact_date = normalizeDate(record.contact_date);
    if (!contact_date) errors.push("invalid or missing contact_date (YYYY-MM-DD)");

    const preferred = normalizePreferredType(record.preferred_property_type);

    if (!phone || !email || !property_type || budget === null || !contact_date) {
        return { ok: false, invalid: { record, errors } };
    }

    const inquiry = {
        lead_id: record.lead_id != null ? record.lead_id : null,
        property_type,
        budget,
        location: typeof record.location === "string" ? record.location.trim() : "",
        preferred_property_type: preferred.value,
        contact_date,
        inquiry_notes:
            typeof record.inquiry_notes === "string" ? record.inquiry_notes.trim() : "",
    };

    return {
        ok: true,
        phone,
        name: typeof record.name === "string" ? record.name.trim() : "",
        email,
        inquiry,
    };
}

module.exports = {
    isValidEmail,
    standardizePhone,
    phoneKey,
    normalizePropertyType,
    normalizePreferredType,
    parseBudget,
    normalizeDate,
    validateAndClean,
};
