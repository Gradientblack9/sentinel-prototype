# SENTINEL prototype

Interactive prototype based on the supplied SIH26165 PRD. Open `http://127.0.0.1:4173` after running `node server.mjs` (Node.js 18+). No package installation or API key is required.

## Included

- Command center, date and site filters, priority queue, activity chart, rule heatmap.
- Manual report analysis and CSV import with validation and duplicate detection.
- Exact source highlights, advisory consequences and controls, five-factor risk score.
- Lexical related-report retrieval, activity-based recurrence radar and interactive graph.
- HSE confirmation, correction and escalation queue, with local audit history.
- CSV export and resettable synthetic dataset (36 reports, four illustrative sites).
- Mobile layouts, keyboard navigation, dialog focus management, optional browser WebMCP tools.

## Demo limits

The engine is a deterministic English-language heuristic. Scores are not calibrated probabilities. This is not a trained NLP classifier or LLM verifier and it must not be used for operational safety decisions. Rule tags denote matching activity context, not validated violations. The graph groups shared tags rather than proving causation; similar reports use lexical overlap rather than embeddings. The seven categories do not constitute complete IOGP rule coverage.

All application records are stored in the browser's local storage; they are not shared between devices or origins. No production database, API server, user authentication, external alerts, active learning, multilingual model, or live HSSE integration is connected. Original analysis is retained when a reviewer changes a label. The dashboard uses the last 7 or 14 days; older imported reports are retained but may fall outside the visible period. Synthetic sample dates span September 1–12, 2026.

## Verification

Run `node --test tests/*.test.mjs`. Tests cover source evidence, uncertainty, negation, recurrence windows, CSV structure and formula escaping.

## 90-second demo

1. Select **New report**, then **Hot work + isolation** and **Analyze report**.
2. Inspect the score, highlighted narrative, unverified isolation, and related reports.
3. Confirm the assessment or correct the SIF label with a reviewer note.
4. Open **Recurrence radar**, select a pattern, and inspect its connected sites.
5. Open **Review & feedback** to see the saved decision.

The source is modular: `dist/engine.js` contains analysis, `dist/csv.js` CSV parsing/export, and `dist/app.js` interface state and browser persistence. A future backend can replace these analysis and persistence boundaries with the PRD's API contract.
