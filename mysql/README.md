# MySQL Database

This folder contains a MySQL 8.0 database model generated from the WMS React data model.

## Create the database

Run the schema first, then the seed data:

```bash
mysql -u root -p < mysql/schema.sql
mysql -u root -p gnosis_wms < mysql/seed.sql
```

The schema creates the `gnosis_wms` database, relational master and transaction tables, indexes, foreign keys, JSON columns for flexible workflow payloads, and the `get_fefo_picking_recommendation` stored procedure.

## Important

The current frontend is wired to Supabase through `src/services/dbService.js` and falls back to `localStorage` when Supabase is not configured. This MySQL database is a compatible target schema and seed set; the frontend does not connect to MySQL directly yet.

Passwords in the seed are demo plaintext values matching the current local demo authentication. Replace them with secure password hashes before production use.
