# iOS Build Plan — FieldService Pro on iPhone

## Prerequisites
- iPhone connected via USB
- Free Apple ID (any Apple ID works)

## What's Already Done
- [x] `.env.production` created with production Supabase + Vercel URLs
- [x] `eas.json` `device` profile has no `developmentClient` — JS bundle is compiled into the binary (no Metro server needed at runtime)
- [x] `react-native-worklets` updated to compatible version
- [x] CocoaPods installed via Homebrew
- [x] `.env` swapped to production values
- [x] `~/Library/Developer/Xcode/DerivedData` symlinked to `/Volumes/Dev Storage/Xcode/DerivedData` (saves ~5-8GB on internal SSD)

## Storage Notes

- **`ios/` directory (~1GB):** Lives on local drive. Cannot be symlinked to external drive — CocoaPods and Node resolve symlinks to real paths, breaking module resolution.
- **Xcode DerivedData (~5-8GB):** Symlinked to `/Volumes/Dev Storage/Xcode/DerivedData`. This is where the bulk of build artifacts go.
- **Internal SSD has ~25GB free** — enough for `ios/` but not much headroom. If space is tight, clean DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData/*`

## Steps

### 1. Generate iOS native project
```bash
cd /Users/john/WEB/SERVICE/apps/mobile
npx expo prebuild --platform ios --clean
```

### 2. Open in Xcode
```bash
open ios/FieldServicePro.xcworkspace
```

### 3. Configure signing in Xcode (first time only)
1. Select **FieldServicePro** project in the left sidebar
2. Select the **FieldServicePro** target (not the project)
3. Go to **Signing & Capabilities** tab
4. Check **"Automatically manage signing"**
5. Under **Team**, select your Apple ID (add via Xcode > Settings > Accounts if needed)
6. Change **Bundle Identifier** to something unique, e.g. `com.johndev.fieldservicepro` (free accounts need a unique ID)

### 4. Prepare your iPhone (first time only)
1. Plug in via USB, unlock, tap **Trust** when prompted
2. Enable Developer Mode: **Settings > Privacy & Security > Developer Mode** → On (restart required)

### 5. Build and run
1. Select your iPhone from the device dropdown at top of Xcode (next to Run button)
2. Press **Cmd+R** to build and run
3. First build takes a few minutes

### 6. Trust the developer certificate on iPhone (first time only)
After install, the app won't open until you trust it:
**Settings > General > VPN & Device Management** → tap your Apple ID → **Trust**

### 7. Done!
App runs natively with production data. JS bundle is embedded — no Metro server needed. Expires in 7 days — re-run Step 5 to refresh.

## Restoring Dev Environment
When you want to go back to local development:
```bash
cp /Users/john/WEB/SERVICE/apps/mobile/.env.dev /Users/john/WEB/SERVICE/apps/mobile/.env
```

## Notes
- The `ios/` directory is gitignored by Expo — it's generated, not committed
- If you get signing errors, try changing the bundle ID to something more unique
- If pod install fails, try: `cd ios && pod install --repo-update`
- Do NOT symlink `ios/` to an external drive — CocoaPods and Node resolve symlinks, breaking module paths
