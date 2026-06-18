# Real Estate Lead Profiling & Management — Backend

A simple **Node.js + Express** backend that imports raw real-estate lead data,
validates and cleans it, removes duplicates (by phone number), calculates
profiling metrics, and serves the results through a small REST API.

Plain JavaScript — no TypeScript, no extra frameworks. Just Express.

---

## How to run

```bash
npm install
npm start            # runs node src/app.js on http://localhost:8000
# or: npm run start:dev   (auto-restart with nodemon)
```

Then test it:

```bash
# 1. Import + analyze the sample data (saves analyzed JSON to disk)
curl -X POST http://localhost:8000/analyze

# 2. Get one lead's full profile by phone number
curl http://localhost:8000/lead/+12345670001

# 3. Get the summary metrics
curl http://localhost:8000/leadSummary
```

> Run `POST /analyze` first — the two `GET` routes read the file that
> `/analyze` creates.

---

## Project structure

The code is split into small layers, each with one job — easy to follow:

```
src/
├── app.js                          # Express server + routes
├── controllers/lead.controller.js  # reads the request, sends the response
├── services/lead.service.js        # the actual logic (import, dedup, metrics)
├── repositories/lead.repository.js # reads/writes the JSON files
├── utils/validators.js             # cleaning + validation helpers
└── data/
    ├── sample_lead_data.json       # the provided input data
    └── analyzed_lead_data.json     # output created by POST /analyze
```

**Flow:** request → controller → service → repository (file) → back as JSON.

---

## The 3 API endpoints

### `POST /analyze`
Imports the lead data, cleans it, removes duplicates, computes the metrics,
**saves the result to `src/data/analyzed_lead_data.json`**, and returns it.

- No body → analyzes the bundled `sample_lead_data.json`.
- Body = array of records → analyzes that data instead.

### `GET /lead/:leadPhoneNumber`
Returns one lead's full profile — **all of their sale and rental inquiries**
grouped together. Example for a number that has two inquiries:

```json
{
  "phone": "+12345670001",
  "name": "John Doe",
  "email": "johndoe1@example.com",
  "locations": ["Los Angeles"],
  "totalInquiries": 2,
  "inquiries": [
    { "lead_id": 1, "property_type": "sale",   "budget": 300000, "...": "..." },
    { "lead_id": 3, "property_type": "rental", "budget": 1200,   "...": "..." }
  ]
}
```

### `GET /leadSummary`
Returns the profiling metrics:

```json
{
  "totalRecords": 48,
  "totalValidRecords": 48,
  "totalUniqueLeads": 45,
  "uniqueLocationCount": 27,
  "locations": ["Atlanta", "Austin", "..."],
  "averageBudgetByType": { "rental": 1794, "sale": 442292 },
  "inquiryRate": { "byMonth": { "2024-01": 24, "2024-02": 24 }, "averagePerMonth": 24 },
  "invalidRecordCount": 0
}
```

---

## How it works (the important parts)

### 1. Cleaning & validation (`utils/validators.js`)
Each record is checked and standardized before being accepted:

- **Email** — checked with a regex; lower-cased.
- **Phone** — stripped to digits and standardized to `+<digits>`; rejected if
  not 7–15 digits.
- **property_type** — forced to lowercase, must be `rental` or `sale`.
- **preferred_property_type** — lower-cased/trimmed (apartment, house, etc.).
- **Budget** — accepts numbers or messy strings like `"$250,000"` → `250000`.
- **contact_date** — must be a real `YYYY-MM-DD` date.

Bad records aren't thrown away silently — they go into an `invalid` list with
the reason, so nothing is hidden.

### 2. Removing duplicates (phone = unique key)
Records are grouped by their **digits-only phone number**. If the same phone
appears twice, it's the same person, so both inquiries are added to one profile.
That's why `GET /lead/:phone` can return a sale **and** a rental for one person
(in the sample data: **48 records → 45 unique leads**, 3 duplicates merged).

### 3. The metrics
- **Total leads, unique leads, unique locations** — simple counts.
- **Average budget per type** — average budget for rentals vs sales separately
  (🌟 bonus).
- **Average inquiry rate** — inquiries grouped by month + average per month
  (🌟 bonus).

### A note on `age`
The task mentions validating `age`, but the sample data has no `age` field, so
I validated the fields that actually exist (phone, email, budget, type, date).
Adding an `age` check later would be a one-line addition in `validators.js`.

---

## Original task brief

> Design a lead profiling application for real estate rental and sale
> management. Import, clean, and analyze lead data; remove duplicates by phone;
> standardize budget and property type; and expose `POST /analyze`,
> `GET /lead/:leadPhoneNumber`, and `GET /leadSummary`.
