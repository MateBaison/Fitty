# @fitty/core

Platform-independent Fitty logic shared by the web (`apps/web`) and mobile (`apps/mobile`) apps: exercise catalog and translations, Zod schemas for persisted snapshots, workout/routine/progress calculations, local cache keys and the snapshot `SyncController`.

No React, Next.js, Expo or browser APIs belong here. Storage and network access are injected (`StoragePort`, `StateRepository`). Import modules by path, for example `@fitty/core/domain/workouts`.
