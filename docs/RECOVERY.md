# Backup and recovery

Pre-update main: `2086b7381466f40d6ce6dc4f5728aa49cc699c83`.
Original ZIP baseline: `b636409067dcee9c8d07c4a0d62ef2d1fbd3e1a6` (`baseline-original`).
Timestamped annotated tag: `backup/pre-comprehensive-20261117T052834Z` (tag object `da597e7c213a092c1e6609c83355ab0db42e393d`). Never move/delete this reference. GitHub administrators can delete tags; this is a policy-preserved reference, not WORM storage.

A complete Git bundle was verified and restored in an independent checkout before source changes. Server-side bundle path: `/workspace/work/rahyar-20261117T052834Z.bundle`. Contains Git objects/source only, no environment files or cloud credentials.

To restore source without touching production or overwriting work:

```sh
git clone https://github.com/fardad34/rahyar.git Rahyar-recovery
cd Rahyar-recovery
git switch --detach backup/pre-comprehensive-20261117T052834Z
git fsck --full
node --test tests/*.test.cjs
```

Or `git clone /path/to/rahyar-20261117T052834Z.bundle Rahyar-recovery`. Compare `git rev-parse HEAD` with the recorded main SHA. Do not reset/force-push main. If update changes have later merged, prepare ordinary revert commits on a recovery branch and review them before merging.

Cloud preflight: Supabase project pdipokhucdzttziyzoiw had no public application tables, migrations or functions, zero auth users, zero buckets and zero stored objects. Therefore there was no application data/schema to export before the additive migration. Managed auth/storage schemas were inspected and are not modified by migrations. Existing Vercel project had no deployment; original chatgpt.site hosting remains untouched.

Database changes are additive. To roll back staging, disable its UI/deployment first; keep database records intact. Do not drop tables or delete users as a rollback shortcut. Before a future destructive change, export the application's schema and records to encrypted access-controlled backup storage, verify restore in an isolated database, then obtain approval for the actual destructive step. Never put personal records, password hashes, keys or database dumps in Git/downloadable archives.

Preview rollback: retain deployment ID and source SHA; redeploy a previously tested feature commit as a preview only. No production promotion or alias reassignment without explicit approval. Revoke preview environment credentials if there is a credential incident; publishable keys alone do not bypass RLS.
