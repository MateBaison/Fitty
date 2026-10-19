# Deployment storage cleanup — 2026-10-19

Vercel's project usage displayed 8.03 GB Deployment Storage and 1.04 GB Functions Storage before cleanup. These are dashboard usage figures, not a measurement of one deployment's output.

## Retention

The project retention policy was changed from 30 days to 1 week for canceled, errored, pre-production and production deployments. Vercel protects production aliases and, on Hobby, the latest three Ready production deployments. Expired deployments are processed asynchronously; usage does not necessarily fall immediately.

## Archived images

100 additional exercise JPEGs (12,433,567 bytes) had no filename references in source, tests, scripts or documentation. Their original paths are absent from the immutable migration baseline. They were moved from `public/assets/exercises/additions/` to `output/archived-exercise-images/2026-10-19/`, with byte sizes and SHA-256 hashes in `manifest.json`. All current catalog and gender-variant image paths were verified by the catalog tests. Original baseline assets and all exercise definitions remain intact.

`output/` is excluded through `.vercelignore`, including generation originals and archived images. Keep the archive outside `public/`; restore an individual asset by copying its archived path to its original path in the manifest and verifying its hash. Archive contents are retained in Git and locally, not intended as public application assets.

Verification: catalog/compatibility tests (20 passing); migration baseline (187 files verified).
