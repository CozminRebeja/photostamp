# PhotoStamp 📮

Take photos in the shape of a **postage stamp** and browse them in a gallery.
Built with [Expo](https://expo.dev) (SDK 54) + React Native + TypeScript.

This guide walks you through running the app **on your own iPhone** using the
**Expo Go** app — no Xcode, no Apple Developer account, no cables required.

---

## What you'll need

On your **Mac** (this machine):

- [Node.js](https://nodejs.org) (already installed)
- [bun](https://bun.sh) (already installed) — the package manager
- This project, cloned to your machine

On your **iPhone**:

- The **Expo Go** app — free from the App Store:
  <https://apps.apple.com/app/expo-go/id982107779>
- A free **Expo account** (you'll sign in inside Expo Go). Create one at
  <https://expo.dev/signup> if you don't have it.

Both devices should be on the **same Wi‑Fi network**. (If your Wi‑Fi blocks
device‑to‑device connections, see *Tunnel mode* in Troubleshooting below.)

---

## Step 1 — Install dependencies

From the project folder on your Mac:

```bash
bun install
```

## Step 2 — Start the dev server

```bash
bun start
```

This launches the Metro bundler and prints a **QR code** in your terminal, plus a
URL like `exp://192.168.x.x:8081`.

Leave this running.

## Step 3 — Open the app on your iPhone

1. Open the **Camera** app on your iPhone and point it at the QR code in the
   terminal (or open **Expo Go** → it lists recent projects, or use *Scan QR code*).
2. Tap the notification / link — **Expo Go** opens and downloads the JavaScript
   bundle for PhotoStamp.
3. The first time you take a photo, iOS will ask for **camera** and **photo
   library** permission — tap **Allow**.

That's it — the app is now running live on your phone. Edits you make on the Mac
reload automatically (Fast Refresh).

> **Note:** The camera only works on a real device (simulators have no camera),
> so testing on your iPhone like this is exactly the right approach. ✅

---

## Everyday commands

```bash
bun start            # start the dev server (scan the QR with your iPhone)
bun start --tunnel   # start in tunnel mode (works across networks/firewalls)
bun run ios          # open on the iOS Simulator (Mac, no camera)
bun run android      # open on an Android emulator/device
bun run lint         # lint the code
```

In the terminal where `bun start` runs you can press:
`r` to reload · `m` to toggle the dev menu · `j` to open the debugger.

---

## Troubleshooting

**The QR code won't connect / app stuck on "Downloading".**
Make sure the Mac and iPhone are on the same Wi‑Fi. If that fails (common on
public, work, or guest networks that isolate devices), start in **tunnel mode**:

```bash
bun start --tunnel
```

Then scan the new QR code. Tunnel routes through Expo's servers, so it works even
on different networks (just a little slower).

**"Project is incompatible with this version of Expo Go."**
This means the app's Expo SDK is newer than your Expo Go supports. iOS Expo Go only
supports the single latest SDK Apple has approved on the App Store. This project is
pinned to **SDK 54** for exactly that reason. Make sure Expo Go is updated from the
App Store. Do not bump the Expo SDK past what your Expo Go supports unless you
switch to a custom development build (which requires Xcode or an EAS cloud build).

**Camera screen is black or permission was denied.**
Go to iOS **Settings → Expo Go → Camera / Photos** and enable access, then
reopen the project.

**Changes aren't showing up.**
Press `r` in the terminal to reload, or shake the phone and tap *Reload*.

---

## Project layout

See [`AGENTS.md`](./AGENTS.md) for the full project structure, tech stack, and
development conventions.
