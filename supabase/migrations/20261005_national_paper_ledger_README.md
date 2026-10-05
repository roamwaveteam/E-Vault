# National paper ledger import

This folder contains the paper-level ledger produced by the Cameroon examination source survey for 2010–2026.

- `20261005_national_paper_ledger.sql` is the complete compact import (266 paper records, 10 source-domain records, and 7 additional exam-family records).
- `20261005_national_paper_ledger_chunk_1.sql` through `_chunk_7.sql` are smaller replayable chunks for SQL clients with query-size limits.
- Records are source-index/provenance records. Availability values distinguish `verified_page`, `verified_pdf`, `indexed`, and `gated` items.
- Mock papers, schedules, and clearly non-administered “zero” papers were excluded from the paper catalog.
- The ledger is **not a claim that every administered paper is publicly available**. Official archives are incomplete, many years/subjects are not publicly exposed, and third-party reuse rights are unclear.

The application should link users to `file_url` rather than mirror copyrighted files without permission.
