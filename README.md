# Landas — full-stack project

This folder now has three parts:

```
landas-app/
├── backend/    Express + PostgreSQL API — see backend/README.md
├── www/        Frontend (index.html) — calls the backend over HTTP
├── capacitor.config.json, package.json   Android wrapper (below)
```

**Start the backend first** (`cd backend`, follow `backend/README.md`) —
the frontend won't be able to log in, sign up, or save quiz results without
it running, since it no longer talks to Supabase directly.

## Android app build

This wraps `www/index.html` as a native Android app using Capacitor, so it
opens as its own app icon instead of a browser tab — same idea as
Bantay-Pulong, but the "app" is the web build inside a native shell instead
of a Kotlin UI.

## One-time setup (on your own machine, not here — this environment has no
internet access to install npm packages or Android Studio)

1. Install Node.js if you don't already have it.
2. Unzip this project folder somewhere, then in a terminal:
   ```
   cd landas-app
   npm install
   npx cap add android
   npx cap sync android
   npx cap open android
   ```
3. `npx cap open android` launches Android Studio with the project already
   set up. From there it's the exact workflow you already know from
   Bantay-Pulong:
   **Build > Build Bundle(s) / APK(s) > Build APK(s)** to produce an
   installable `app-debug.apk` in `android/app/build/outputs/apk/debug`.

## What's different from a plain website

- `www/index.html` has app-shell meta tags added: safe-area padding (so
  content doesn't sit under a phone's notch/status bar), a matching
  `theme-color`, and text-selection disabled everywhere except form inputs,
  so it behaves like an app rather than a scrollable web page.
- `capacitor.config.json` sets the app ID (`com.essu.landas`), name, and
  background color used while the app is loading.

## If you'd rather not wrap it at all

The same `www/index.html` file also works as a plain website — host it
anywhere, or open it directly in a phone browser and "Add to Home Screen"
for an app-like icon without any Android Studio step at all.

## Connecting the app to the backend

`www/index.html` calls the backend at the `API_BASE` URL near the top of its
`<script>` tag. For a phone testing against your laptop, `localhost` won't
resolve to your laptop — use your laptop's LAN IP instead (e.g.
`http://192.168.1.20:4000/api`), and make sure the phone is on the same
Wi-Fi network. For a real release, host the backend somewhere reachable
(Render, Railway, a VPS, etc.) and point `API_BASE` at that instead.
