# Application Synchronization Recommendations

This document describes the recommended architecture and implementation steps for making the application synchronize across devices, share the same database, preserve data reliably, and complete the remaining work needed for a production-quality sync experience.

## Current Status

- The current application supports a multi-backend sync bridge inside `index.html`.
- It can use one of three backend storage providers:
  - Firestore (`firestore`)
  - Supabase (`supabase`)
  - AWS Amplify / AppSync (`amplify`)
- The repository currently contains a valid Firebase client configuration in `FIREBASE_CONFIG` and placeholder values for `SUPABASE_CONFIG` and `AMPLIFY_CONFIG`.
- The `STORAGE_BACKEND` mode is currently set to `auto`, which picks the first configured backend in the order Firestore → Supabase → Amplify.
- Firestore is the active backend right now because only Firebase is configured.

## Recommended Synchronization Architecture

1. Use a single shared database backend for all devices.
   - This ensures that every device reads and writes to the same source of truth.
   - Firestore or Supabase are the most practical choices for this repo.

2. Enable real-time synchronization.
   - Firestore: use `onSnapshot` for live updates.
   - Supabase: use `postgres_changes` or realtime channels.
   - AppSync: use GraphQL subscriptions.

3. Keep a local backup / offline cache on each device.
   - Store a local copy of data on the device so the app can continue working offline.
   - When network connectivity returns, merge local changes with the shared backend.

4. Preserve data with versioning, backups, and transactional writes.
   - Use backup storage for every synced record or periodically export snapshots.
   - Keep a write-ahead log or incremental version number for conflict handling.
   - Use chunking to safely store large values without exceeding backend limits.

5. Choose one canonical layer for sync state and stick to it.
   - If Firestore is chosen, make it the primary source of truth.
   - If migrating to Supabase, configure `STORAGE_BACKEND = "supabase"` explicitly and keep Firestore disabled to avoid backend splits.

## Recommended Backend Choices

### Firebase Firestore

- Best for: rapid setup, managed realtime, and strong offline-first support in web apps.
- Required work:
  - Confirm the Firebase project is active and Firestore is enabled.
  - Deploy `firestore.rules` to enforce security and access control.
  - Use the current `FIREBASE_CONFIG` values in `index.html`.
  - Add a GitHub Actions secret `FIREBASE_TOKEN` so the repo can deploy Firebase configuration automatically.

### Supabase

- Best for: SQL-based storage, Postgres compatibility, and powerful row-level security.
- Required work:
  - Create a Supabase project.
  - Run `sql/supabase_schema.sql` to create the `eduportal_kv` table.
  - Apply `sql/supabase_rls.sql` to enable row-level security if permission rules are needed.
  - Replace the placeholder `SUPABASE_CONFIG.url` and `SUPABASE_CONFIG.anonKey` values in `index.html`.

### AWS Amplify / AppSync

- Best for: API-driven GraphQL sync and advanced AWS integration.
- Required work:
  - Deploy an AppSync API with the schema expected by the app.
  - Fill `AMPLIFY_CONFIG.graphqlEndpoint`, `AMPLIFY_CONFIG.region`, and `AMPLIFY_CONFIG.apiKey` in `index.html`.
  - Optionally deploy a Lambda or Function URL for real auth token minting and fill `AMPLIFY_FUNCTIONS_BASE`.

## Recommended Data Model and Shared Database Strategy

- Keep the shared sync table simple and generic, such as `eduportal_kv` or `sync_records`.
- Store each synced record with:
  - `key`: unique identifier
  - `value`: JSON string or serialized payload
  - `chunked`: boolean indicating chunked content
  - `chunk_count`: number of chunks when used
  - `updated_at`: timestamp for last modification
- Use a consistent namespace for device-specific data and shared data.
- Support object-level metadata for conflict resolution and merge behavior.

## Recommended Data Preservation Practices

- Back up important records automatically.
- Keep history or version metadata to restore older values if needed.
- Provide the ability to export/import data to/from JSON or CSV.
- Keep the fallback local storage tier available if the cloud backend is unreachable.
- Avoid destructive delete operations until the user confirms or a recovery window has passed.

## Security and Access Control

- Do not leave open read/write access in production unless the app is intentionally public.
- Firestore:
  - Use Firestore security rules instead of `allow read, write: if true` for production.
  - Enforce authentication and ownership checks.
- Supabase:
  - Use RLS policies to restrict access by user, school, or role.
  - Only allow `anonKey` to perform permitted operations, or use a secure backend for auth token minting.
- Amplify:
  - Use AppSync authorization modes appropriately.
  - Avoid exposing an API key for unlimited access in a public client if you need real security.

## Deployment and Automation

- Use GitHub Actions to deploy changes automatically.
- For Firebase, add `FIREBASE_TOKEN` in GitHub repository secrets and use the provided workflow.
- For Supabase or Amplify, add a separate deployment workflow or manual deploy step.
- Keep configuration values out of source control when they are sensitive.

## Recommended Next Steps for This Project

1. Confirm which backend is chosen for sync: Firestore, Supabase, or Amplify.
2. Finish backend configuration in `index.html`:
   - Firestore: confirmed and deploy rules
   - Supabase: real URL and anon key
   - Amplify: real GraphQL endpoint, region, apiKey
3. Configure explicit backend selection if you plan to use only one backend:
   - `const STORAGE_BACKEND = "firestore";`
   - or `const STORAGE_BACKEND = "supabase";`
   - or `const STORAGE_BACKEND = "amplify";`
4. Deploy backend rules and security policies.
5. Verify the app can read/write and synchronize data across two or more devices.
6. Add persistence and recovery support:
   - regular backups
   - local cache fallback
   - conflict resolution UI or merge behavior
7. Remove or ignore workspace-specific local files such as `.vscode` from source control.

## Recommended Feature Enhancements

- Add a sync status indicator in the UI to show when data is synced, pending, or offline.
- Add user authentication so each device user has a secure identity.
- Add per-school or per-owner visibility scopes to share only the correct data across users.
- Add an audit log or history view to inspect recent sync events and recovered changes.
- Add unit/integration tests for the sync bridge and backend interactions.

## Summary

To make the application truly synchronized across devices, the key is:
- one shared database backend,
- real-time update propagation,
- strong backup and versioning,
- and secure access control.

This document is intended as a reference for the work remaining in the repo and the recommended approach for shared device sync.
