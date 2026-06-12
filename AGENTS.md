# AGENTS.md — PhotoStamp

Guidance for AI agents and developers working in this repo. Read this first.

## What this app is

**PhotoStamp** is a very simple cross‑platform (iOS + Android) mobile app with two
core features:

1. **Take a stamp photo** — a camera screen where the captured photo is rendered in
   the shape of a **postage stamp** (a rounded rectangle with perforated / scalloped
   edges). A large circular shutter button triggers the capture.
2. **Gallery** — a grid view showing every stamp the user has taken so far.

Design reference (Figma):
<https://www.figma.com/design/3uhWO9FskiIDQ25jjcCG5l/photostamp?node-id=16-750>

The "stamp" is the defining visual: in the design the live photo is masked by a
rounded rectangle whose border is lined with small circles (the perforations),
producing the classic torn‑edge postage‑stamp silhouette.

## ⚠️ Expo changes fast — read the versioned docs

This project is on **Expo SDK 54** (`expo@~54.0.34`, React Native `0.81`, React `19`).
APIs (especially `expo-file-system`, `expo-camera`, and routing) differ between SDK
versions. **Before writing or changing any Expo/React Native code, read the exact
versioned docs:** <https://docs.expo.dev/versions/v54.0.0/>

> **Why SDK 54, not the latest (56)?** The app is tested on a physical iPhone via
> **Expo Go**, and iOS Expo Go only supports the single latest SDK Apple has
> approved on the App Store — currently **SDK 54**. SDK 56 and 55 both produced
> "Project is incompatible with this version of Expo Go". Do **not** bump the SDK
> past what the installed Expo Go supports unless we switch to a custom dev build
> (which requires Xcode — not installed on this machine — or an EAS cloud build).

Do not rely on memory or older tutorials for API shapes.

## Tech stack

- **Expo SDK 54** with **Expo Router** (file‑based routing, `app/`).
- **TypeScript** (strict mode).
- **bun** is the package manager. Use `bun` / `bunx`, never `npm` / `yarn`.
- Tab bar via Expo Router's `Tabs` + `@react-navigation/bottom-tabs` (`app/(tabs)/`).
- React Compiler + typed routes are enabled (see `app.json` → `experiments`).

### Key libraries (all are bundled in Expo Go — no dev build needed)

| Library | Purpose |
| --- | --- |
| `expo-camera` | Live camera preview + photo capture |
| `expo-media-library` | Save / read photos from the device library |
| `expo-file-system` | Persist stamp images in the app sandbox |
| `@react-native-async-storage/async-storage` | Persist stamp metadata (ids, timestamps) |
| `react-native-svg` | Draw the perforated stamp mask / border |
| `@react-native-masked-view/masked-view` | Clip the photo to the stamp silhouette |
| `expo-image` | Performant image rendering in the gallery |

## Commands

```bash
bun install              # install dependencies
bun start                # start the Metro dev server (then scan QR with Expo Go)
bun run ios              # open on an iOS simulator / device
bun run android          # open on an Android emulator / device
bun run lint             # run expo lint
bunx tsc --noEmit        # type-check
bunx expo install <pkg>  # add an SDK-compatible native dependency (do NOT use plain `bun add` for native modules)
```

Running on a physical iPhone is documented in `README.md`.

## Project structure

```
photostamp/
├── app.json                 # Expo config (name, plugins, permissions)
├── app/                     # Expo Router routes (file-based)
│   ├── _layout.tsx          # Root Stack + ThemeProvider
│   └── (tabs)/
│       ├── _layout.tsx      # Tab bar: Stamp + Gallery
│       ├── index.tsx        # Camera / "take a stamp" screen
│       └── gallery.tsx      # Gallery grid of saved stamps
├── components/              # Shared/presentational components (themed text/view, etc.)
├── constants/              # Theme tokens (colors)
├── hooks/                  # Reusable hooks (e.g. color scheme)
├── features/
│   ├── stamp/              # stamp-frame.tsx — the perforated stamp visual
│   └── gallery/            # (reserved for gallery sub-components)
├── lib/                    # stamps.ts — local storage of stamp images
├── types/                 # stamp.ts — shared types
└── assets/                 # Icons, splash, images
```

Routing is **file-based**: a file in `app/` is a screen; `app/(tabs)/` holds the
tabbed screens. Import with the `@/` alias (`@/* → ./*`).

## Conventions

- Filenames: kebab-case for components/modules (matches the template, e.g. `themed-text.tsx`).
- Keep screens thin: routes in `app/` should compose feature code from
  `features/*`; put real logic there, not in the route file.
- Use the theme tokens in `constants/theme.ts` rather than hardcoding colors.
- Add native deps with `bunx expo install` so versions stay SDK-compatible.

## Permissions

Declared via config plugins in `app.json`:

- `expo-camera` → camera usage description.
- `expo-media-library` → photo read + "save to library" descriptions.

When adding features that touch the camera or photo library, request runtime
permission via the library hooks (`useCameraPermissions`, media-library
`usePermissions`) before use.

## v1 implementation choices (defaults — easy to revisit)

The first version was built with these decisions:

1. **Storage:** local-only. Images live in `<documentDirectory>/stamps/`; the
   gallery is derived by listing that folder (no backend, no metadata DB).
2. **Stamp shape:** the perforation is a **display treatment** — the photo is
   captured normally and rendered inside the stamp silhouette (`StampFrame`) in
   both the capture preview and gallery. The saved file is the raw photo.
3. **Save target:** private to the app sandbox (not the system camera roll).
4. **Tabs:** two — **Stamp** (camera) and **Gallery**.

Possible follow-ups: physically composite the perforated shape into the saved
image; export to the camera roll (`expo-media-library` is already installed);
a stamp detail / full-screen view; a third (profile) tab. Note
`@react-native-masked-view/masked-view` and `@react-native-async-storage/async-storage`
are installed but not yet used — keep or prune as the app evolves.
