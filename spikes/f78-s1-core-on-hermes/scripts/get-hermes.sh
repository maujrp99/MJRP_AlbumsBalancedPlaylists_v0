#!/bin/sh
# Gets the Hermes that React Native 0.88.1 ships and builds the one-file host that runs JS on it.
#
# - React Native 0.88.1 depends on hermes-compiler 260318099.0.5 (npm view react-native@0.88.1
#   dependencies). The same Hermes version is published for iOS on Maven Central as
#   com.facebook.hermes:hermes-ios:260318099.0.5 — the artifact the iOS build of React Native
#   downloads. Its tarball carries a macOS slice of the engine (hermesvm.framework) and the JSI
#   headers: enough to run JavaScript on this Mac with the Command Line Tools' clang only.
# - The sha256 is the one Maven Central publishes next to the file.
set -eu
HERE="$(cd "$(dirname "$0")/.." && pwd)"
V=260318099.0.5
DIR="$HERE/node_modules/.hermes-ios-$V"
SHA=4e137490ffdf5b145bd629c5cabdfe9aee54573308d7c357bc3300ac78d64507
URL="https://repo1.maven.org/maven2/com/facebook/hermes/hermes-ios/$V/hermes-ios-$V-hermes-ios-release.tar.gz"

mkdir -p "$DIR"
if [ ! -f "$DIR/hermes-ios-release.tar.gz" ]; then
  curl -sSL -o "$DIR/hermes-ios-release.tar.gz" "$URL"
fi
echo "$SHA  $DIR/hermes-ios-release.tar.gz" | shasum -a 256 -c -
if [ ! -d "$DIR/destroot" ]; then
  (cd "$DIR" && tar -xzf hermes-ios-release.tar.gz)
fi

FW="$DIR/destroot/Library/Frameworks/macosx"
mkdir -p "$HERE/node_modules/.s1-build"
clang++ -std=c++20 -O1 \
  -I "$DIR/destroot/include" \
  -F "$FW" -framework hermesvm \
  -Wl,-rpath,"$FW" \
  -o "$HERE/node_modules/.s1-build/hermes-run" "$HERE/host/hermes-run.cpp"
echo "built $HERE/node_modules/.s1-build/hermes-run against $FW/hermesvm.framework ($V)"
