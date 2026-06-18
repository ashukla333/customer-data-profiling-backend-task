"use strict";

const express = require("express");
const leadController = require("./controllers/lead.controller");

const app = express();
app.use(express.json({ limit: "5mb" }));

app.post("/analyze", leadController.analyze);
app.get("/lead/:leadPhoneNumber", leadController.getLead);
app.get("/leadSummary", leadController.getSummary);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Lead profiling server started on port ${PORT}`));

module.exports = app;
