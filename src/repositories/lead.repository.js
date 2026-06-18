"use strict";

const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const sourceFile = path.join(dataDir, "sample_lead_data.json");
const analyzedFile = path.join(dataDir, "analyzed_lead_data.json");

function readSourceRecords() {
    const content = fs.readFileSync(sourceFile, "utf-8");
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
        throw new Error("Source lead data is not a JSON array");
    }
    return parsed;
}

function saveAnalysis(result) {
    fs.writeFileSync(analyzedFile, JSON.stringify(result, null, 2), "utf-8");
    return analyzedFile;
}

function readAnalysis() {
    if (!fs.existsSync(analyzedFile)) return null;
    const content = fs.readFileSync(analyzedFile, "utf-8");
    return JSON.parse(content);
}

module.exports = { readSourceRecords, saveAnalysis, readAnalysis };
