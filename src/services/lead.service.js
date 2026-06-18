"use strict";

const repo = require("../repositories/lead.repository");
const { validateAndClean, phoneKey } = require("../utils/validators");

function analyze(records) {
    const raw = records || repo.readSourceRecords();

    const invalid = [];
    const profilesByPhone = new Map();
    let validCount = 0;

    for (const record of raw) {
        const result = validateAndClean(record);

        if (!result.ok) {
            invalid.push(result.invalid);
            continue;
        }

        validCount++;
        const key = phoneKey(result.phone);
        const existing = profilesByPhone.get(key);

        if (existing) {
            existing.inquiries.push(result.inquiry);
            existing.totalInquiries = existing.inquiries.length;
            if (result.inquiry.location && !existing.locations.includes(result.inquiry.location)) {
                existing.locations.push(result.inquiry.location);
            }
            if (!existing.name && result.name) existing.name = result.name;
            if (!existing.email && result.email) existing.email = result.email;
        } else {
            profilesByPhone.set(key, {
                phone: result.phone,
                name: result.name,
                email: result.email,
                locations: result.inquiry.location ? [result.inquiry.location] : [],
                totalInquiries: 1,
                inquiries: [result.inquiry],
            });
        }
    }

    const leads = Array.from(profilesByPhone.values());

    const analysis = {
        generatedAt: new Date().toISOString(),
        summary: buildSummary(raw.length, validCount, leads, invalid),
        leads,
        invalid,
    };

    repo.saveAnalysis(analysis);
    return analysis;
}

function getLeadByPhone(phoneNumber) {
    const analysis = repo.readAnalysis();
    if (!analysis) return null;

    const key = phoneKey(phoneNumber);
    return analysis.leads.find((lead) => phoneKey(lead.phone) === key) || null;
}

function getSummary() {
    const analysis = repo.readAnalysis();
    return analysis ? analysis.summary : null;
}

function buildSummary(totalRecords, validCount, leads, invalid) {
    const inquiries = leads.flatMap((l) => l.inquiries);
    const locations = Array.from(
        new Set(inquiries.map((i) => i.location).filter(Boolean))
    ).sort();

    return {
        totalRecords,
        totalValidRecords: validCount,
        totalUniqueLeads: leads.length,
        uniqueLocationCount: locations.length,
        locations,
        averageBudgetByType: averageBudgetByType(inquiries),
        inquiryRate: inquiryRate(inquiries),
        invalidRecordCount: invalid.length,
    };
}

function averageBudgetByType(inquiries) {
    const acc = { rental: { sum: 0, count: 0 }, sale: { sum: 0, count: 0 } };

    for (const i of inquiries) {
        acc[i.property_type].sum += i.budget;
        acc[i.property_type].count += 1;
    }

    const avg = (t) =>
        acc[t].count === 0 ? null : Math.round(acc[t].sum / acc[t].count);

    return { rental: avg("rental"), sale: avg("sale") };
}

function inquiryRate(inquiries) {
    const byMonth = {};

    for (const i of inquiries) {
        const month = i.contact_date.slice(0, 7);
        byMonth[month] = (byMonth[month] || 0) + 1;
    }

    const months = Object.keys(byMonth).sort();
    const averagePerMonth =
        months.length === 0
            ? 0
            : Math.round((inquiries.length / months.length) * 100) / 100;

    const ordered = {};
    for (const m of months) ordered[m] = byMonth[m];

    return { byMonth: ordered, averagePerMonth };
}

module.exports = { analyze, getLeadByPhone, getSummary };
