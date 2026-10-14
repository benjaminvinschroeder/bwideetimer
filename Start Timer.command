#!/bin/bash
# Double-click in Finder to launch the pitch timer as a locked-down fullscreen kiosk.
# Quit with Cmd+Q.

# Optional: top-left pixel of the screen to open on (e.g. "1728,0" for a projector
# placed right of the laptop screen in an extended-display setup). Empty = main screen.
WINDOW_POSITION=""

DIR="$(cd "$(dirname "$0")" && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PROFILE="$HOME/Library/Application Support/bwidee-timer-chrome"

# The project lives in iCloud Drive: read every file once so none is "evicted" (cloud-only).
find "$DIR/index.html" "$DIR/static" -type f -exec cat {} + > /dev/null

URL="file://$(printf '%s' "$DIR/index.html" | sed -e 's/%/%25/g' -e 's/ /%20/g' -e 's/#/%23/g' -e 's/?/%3F/g')"

if [ ! -x "$CHROME" ]; then
    echo "Google Chrome not found, opening default browser instead (press F for fullscreen)."
    open "$DIR/index.html"
    caffeinate -dims -t 43200 &
    exit 0
fi

ARGS=(
    --user-data-dir="$PROFILE"         # separate clean profile: no extensions, no synced popups
    --kiosk                            # fullscreen, no address bar, no tabs, Esc can't exit
    --no-first-run
    --no-default-browser-check
    --disable-notifications
    --disable-infobars
    --noerrdialogs
    --disable-session-crashed-bubble
    --disable-translate
    --disable-features=Translate,TranslateUI,MediaRouter
    --disable-pinch
    --overscroll-history-navigation=0
    --disable-background-timer-throttling
    --disable-renderer-backgrounding
    --autoplay-policy=no-user-gesture-required
    --check-for-update-interval=31536000
)
[ -n "$WINDOW_POSITION" ] && ARGS+=(--window-position="$WINDOW_POSITION")

echo "Starting pitch timer… (quit the timer with Cmd+Q)"
"$CHROME" "${ARGS[@]}" "$URL" > /dev/null 2>&1 &
CHROME_PID=$!

# Keep display and system awake for as long as the timer runs.
caffeinate -dims -w "$CHROME_PID"
