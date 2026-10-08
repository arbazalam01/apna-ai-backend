# Apna AI — Backend

Backend for **Apna AI**, an AI-powered marketing assistant for B2B companies.
You give it a company's website and its competitors; it scrapes them, builds a knowledge base, and uses OpenAI to generate marketing intelligence and content.

## What it does

- **Company & competitor research** — scrapes the company and competitor websites (Firecrawl / Cheerio), groups pages (about, products, services, blogs…), and stores the consolidated content in S3.
- **AI insights** — runs prompts through the OpenAI Assistants API to produce: company summary, products, services, industries, top clients, leadership, market positioning, SWOT analysis and user personas, side by side with competitors.
- **Personas & user segmentation** — generates buyer personas from designation, business size, location, etc., and builds user segments from the knowledge base.
- **Prospects & campaigns** — upload prospect lists (CSV / Excel), generate personalised cold emails per prospect, group them into campaigns and export them as CSV/JSON. HubSpot integration for contact lists.
- **Content calendar** — generates a social media / content calendar for goals like brand awareness, thought leadership and product engagement, with DALL·E 3 images.
- **Data insights & reports** — reads data from Google Sheets and generates themes, summaries and trend reports.
- **Auth** — signup/signin with JWT (cookie-based), roles, password reset via email.

## Tech stack

| Area | Technology |
|------|------------|
| Runtime / server | Node.js 24 LTS, Express 5 |
| Database | MongoDB with Mongoose 9 |
| AI | OpenAI API (GPT-4 Turbo, GPT-3.5 Turbo, Assistants API, DALL·E 3), `jsonrepair` |
| File storage | AWS S3 (AWS SDK v3 `@aws-sdk/client-s3`, `multer`, `multer-s3`) |
| Web scraping | Firecrawl SDK (`firecrawl`), Cheerio, Axios |
| Auth | JWT (`jsonwebtoken`, `express-jwt`) |
| Files | `csv-parser`, `csvtojson`, `csv-writer`, `xlsx` |
| Integrations | Google Sheets API (`googleapis`), HubSpot, Nodemailer (Gmail) |
| Jobs | `node-schedule`, `exponential-backoff` |
| Dev | `node --watch`, `node --env-file` (no extra tooling) |

## Project structure

```
index.js          # Express app, Mongo connection, route mounting
routes/           # Route definitions (/api, /app, /customer, /campaign, /prospects, /calendar, /usersegments)
controllers/      # Request handlers
models/           # Mongoose schemas (User, Company, Persona, Prospect, Campaign, Calendar, ...)
utils/            # OpenAI, S3, scraper, Google Sheets, prompt helpers
lib/              # OpenAI function-calling definitions
```

## Why it isn't deployed

This project is **not deployed publicly** because it depends on paid, private services:

- **OpenAI API key** — every AI feature (insights, personas, emails, calendar, images) calls OpenAI, which is billed per request. Hosting it publicly would mean anyone could run up charges on my key.
- **AWS S3 bucket** — scraped website data, consolidated knowledge base files and uploads are stored in S3, which needs AWS credentials and a bucket I'd have to keep paying for.

Without these, the server starts but the core features fail. It **runs fine locally** with your own keys — see below.

## Run locally

**Prerequisites:** Node.js 24 LTS (see `.nvmrc`), a MongoDB instance (local or Atlas), an OpenAI API key, and an AWS S3 bucket.

```bash
git clone https://github.com/arbazalam01/apna-ai-backend.git
cd apna-ai-backend
npm install
```

Create your `.env` from the example and fill in your keys (see comments in `.env.example`):

```bash
cp .env.example .env
```

Google Sheets features also need a service account `credentials.json` in the project root.

Start the server:

```bash
npm start
```

The API runs at `http://localhost:3000`.
