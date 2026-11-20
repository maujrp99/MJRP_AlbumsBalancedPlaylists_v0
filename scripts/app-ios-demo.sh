#!/usr/bin/env bash
# The app's demo on the iOS Simulator (F78): generates app/ios (continuous native generation, not
# committed), installs the pods, builds Debug for the simulator, boots it, installs and opens the
# app, and leaves Metro running in this terminal (the Debug app takes its JavaScript from Metro;
# Ctrl+C stops it).
#
#   npm run app:ios:demo                                on «iPhone 17 Pro»
#   APP_IOS_DEVICE="iPhone 17" npm run app:ios:demo
#
# Demo mode: the fake account and the seeded in-memory series; the native Firebase, Google and
# Apple sign-in packages are left out of the build (app/nativeBuild.js). Nothing leaves the
# simulator. Prerequisites and the links that drive the app: docs/manual/00_Deployment_and_Setup.md § 2.6.
#
# Why xcodebuild and simctl and not `npx expo run:ios`: on this Mac (Xcode 27.2, 2026-11-20) the
# Expo CLI waits forever on `xcrun devicectl --version` (it looks for physical devices) before it
# builds anything. The steps below are the ones it would run, for the simulator only.
set -euo pipefail

DEVICE="${APP_IOS_DEVICE:-iPhone 17 Pro}"
BUNDLE_ID=com.mjrp.albumblender
APP_DIR="$(cd "$(dirname "$0")/../app" && pwd)"

# xcode-select may still point at the Command Line Tools: use Xcode for this process only,
# without changing the machine's setting (that needs sudo).
if ! xcodebuild -version >/dev/null 2>&1; then
    export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
fi
xcodebuild -version >/dev/null || { echo "Xcode not found: install it from the App Store and open it once." >&2; exit 1; }
command -v pod >/dev/null || { echo "CocoaPods not found: brew install cocoapods" >&2; exit 1; }

# CocoaPods refuses a terminal that is not UTF-8
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
# the demo build: never the Firebase one, whatever the shell has
unset EXPO_PUBLIC_DATA_MODE

cd "$APP_DIR"

# 1. the native project. Expo SDK 58's prebuild deletes ios/ by default (and with it the pods and
#    the build cache): kept with --no-clean while the project is a demo one; one generated for the
#    other build (Firebase), or none, is generated from scratch.
MARKER=ios/.album-blender-build
if [ -d ios ] && [ "$(cat "$MARKER" 2>/dev/null || true)" = "demo" ]; then
    CI=1 npx expo prebuild --platform ios --no-clean
else
    CI=1 npx expo prebuild --platform ios --clean
fi
echo demo > "$MARKER"

# 2. the simulator
UDID="$(xcrun simctl list devices available -j | node -e '
    const name = process.argv[1]; let s = ""
    process.stdin.on("data", d => s += d).on("end", () => {
        const all = Object.values(JSON.parse(s).devices).flat().filter(d => d.name === name)
        const pick = all.find(d => d.state === "Booted") ?? all[0]
        if (!pick) { console.error(`No simulator named «${name}»: xcrun simctl list devices available`); process.exit(1) }
        console.log(pick.udid)
    })' "$DEVICE")"
xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl bootstatus "$UDID" -b >/dev/null
open -a Simulator 2>/dev/null || true # the window; the build and the app do not need it

# 3. the Debug build for the simulator (no signing: the simulator does not need it). Low priority and
#    4 compile jobs by default (APP_IOS_BUILD_JOBS): a full build otherwise takes every core, and this
#    Mac is shared with other work (2026-11-20: load 190 on 15 cores during the first build).
nice -n 10 xcodebuild -jobs "${APP_IOS_BUILD_JOBS:-4}" -workspace ios/AlbumBlender.xcworkspace -scheme AlbumBlender -configuration Debug \
    -sdk iphonesimulator -destination "platform=iOS Simulator,id=$UDID" -derivedDataPath ios/build \
    CODE_SIGNING_ALLOWED=NO -quiet
APP_PATH=ios/build/Build/Products/Debug-iphonesimulator/AlbumBlender.app

# 4. Metro, then the app (a Debug app opened before Metro answers shows «No bundle URL»)
CI=1 npx expo start --port 8081 &
METRO=$!
trap 'kill $METRO 2>/dev/null || true' EXIT
until curl -s http://localhost:8081/status | grep -q packager-status:running; do sleep 1; done

xcrun simctl install "$UDID" "$APP_PATH"
xcrun simctl launch "$UDID" "$BUNDLE_ID"
echo "Album Blender (demo) is open on «${DEVICE}». The self-test, with no tap:"
echo "  xcrun simctl terminate booted $BUNDLE_ID; xcrun simctl launch booted $BUNDLE_ID -demoSignIn apple -demoRoute '/diagnostics?run=1'"
wait $METRO
