"use strict";

const leadService = require("../services/lead.service");

function analyze(req, res) {
    try {
        const body = req.body;
        let records;
        if (Array.isArray(body)) records = body;
        else if (body && Array.isArray(body.leads)) records = body.leads;

        const result = leadService.analyze(records);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: "Failed to analyze lead data", detail: err.message });
    }
}

function getLead(req, res) {
    try {
        const phone = req.params.leadPhoneNumber;
        const lead = leadService.getLeadByPhone(phone);
        if (!lead) {
            return res.status(404).json({
                error: `No analyzed lead found for phone number '${phone}'. Has /analyze been run?`,
            });
        }
        res.status(200).json(lead);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch lead", detail: err.message });
    }
}

function getSummary(req, res) {
    try {
        const summary = leadService.getSummary();
        if (!summary) {
            return res.status(404).json({ error: "No analysis found. Run POST /analyze first." });
        }
        res.status(200).json(summary);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch summary", detail: err.message });
    }
}

module.exports = { analyze, getLead, getSummary };
