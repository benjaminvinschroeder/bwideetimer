// Pitch timer: per startup a PITCH phase followed by a Q&A phase.
// Time is always derived from performance.now() timestamps (never by counting
// interval ticks), so it cannot drift and is unaffected by system clock changes.

const CONFIG = Object.assign({
    pitchSeconds: 90,
    qaSeconds: 120,
    warningSeconds: 10,
    soundOnEnd: true,
    showOvertime: true,
    startups: [],
}, window.TIMER_CONFIG || {});

const PHASES = {
    pitch: { label: 'PITCH', seconds: CONFIG.pitchSeconds },
    qa:    { label: 'Q&A',   seconds: CONFIG.qaSeconds },
};
const STORAGE_KEY = 'bwidee-timer-position';

const els = {
    body: document.body,
    timer: document.getElementById('timer-display'),
    elapsed: document.getElementById('elapsed-display'),
    phase: document.getElementById('phase-label'),
    counter: document.getElementById('startup-counter'),
    name: document.getElementById('startup-name'),
    uni: document.getElementById('startup-uni'),
    nextUp: document.getElementById('next-up'),
    progress: document.getElementById('progress-fill'),
    startBtn: document.getElementById('btn-start'),
    list: document.getElementById('list-overlay'),
    listItems: document.getElementById('list-items'),
    help: document.getElementById('help-overlay'),
    soundState: document.getElementById('sound-state'),
};

const state = {
    index: 0,          // current startup
    phase: 'pitch',    // 'pitch' | 'qa'
    running: false,
    finished: false,   // countdown reached 0 (gong played)
    accumulatedMs: 0,  // elapsed time from previous run segments
    startedAt: 0,      // performance.now() of the current run segment
    soundOn: CONFIG.soundOnEnd,
};

// --- Time ---------------------------------------------------------------

function elapsedMs() {
    return state.accumulatedMs + (state.running ? performance.now() - state.startedAt : 0);
}

function durationMs() {
    return PHASES[state.phase].seconds * 1000;
}

// --- Controls -------------------------------------------------------------

function startTimer() {
    if (state.running || state.finished) return;
    state.startedAt = performance.now();
    state.running = true;
    render();
}

function pauseTimer() {
    if (!state.running) return;
    state.accumulatedMs = elapsedMs();
    state.running = false;
    render();
}

function resetTimer() {
    state.running = false;
    state.finished = false;
    state.accumulatedMs = 0;
    render();
}

function setPosition(index, phase) {
    const count = Math.max(CONFIG.startups.length, 1);
    state.index = Math.min(Math.max(index, 0), count - 1);
    state.phase = phase;
    resetTimer();
    renderStartup();
    savePosition();
}

function nextPhase() {
    if (state.phase === 'pitch') setPosition(state.index, 'qa');
    else if (state.index < CONFIG.startups.length - 1) setPosition(state.index + 1, 'pitch');
    else resetTimer(); // last startup's Q&A: nowhere to go
}

function previousPhase() {
    if (state.phase === 'qa') setPosition(state.index, 'pitch');
    else if (state.index > 0) setPosition(state.index - 1, 'qa');
}

// Main clicker button: start -> pause -> resume ... once finished: next phase.
function primaryAction() {
    if (state.finished) nextPhase();
    else if (state.running) pauseTimer();
    else startTimer();
}

// Clicker back button: reset; if already reset, step back one phase.
function backAction() {
    if (elapsedMs() > 0 || state.finished) resetTimer();
    else previousPhase();
}

// --- Rendering ------------------------------------------------------------

function formatElapsed(ms) {
    return (ms / 1000).toFixed(3);
}

function render() {
    const elapsed = elapsedMs();
    const total = durationMs();
    const remaining = total - elapsed;

    if (remaining <= 0 && !state.finished && (state.running || elapsed > 0)) {
        state.finished = true;
        if (!CONFIG.showOvertime) {
            state.accumulatedMs = total;
            state.running = false;
        }
        playGong();
    }

    const seconds = Math.max(0, Math.ceil(remaining / 1000));
    els.timer.textContent = seconds;

    if (state.finished) {
        const over = Math.max(0, elapsed - total);
        els.elapsed.textContent = CONFIG.showOvertime ? '+' + (over / 1000).toFixed(1) : formatElapsed(total);
    } else {
        els.elapsed.textContent = formatElapsed(elapsed);
    }

    els.progress.style.transform = `scaleX(${Math.max(0, remaining) / total})`;

    els.body.classList.toggle('phase-qa', state.phase === 'qa');
    els.body.classList.toggle('is-running', state.running);
    els.body.classList.toggle('is-warning', !state.finished && seconds <= CONFIG.warningSeconds && elapsed > 0);
    els.body.classList.toggle('is-finished', state.finished);

    els.startBtn.textContent = state.finished ? 'Nächste Phase'
        : state.running ? 'Pause'
        : elapsed > 0 ? 'Weiter' : 'Start';
}

function renderStartup() {
    const list = CONFIG.startups;
    const current = list[state.index];
    els.phase.textContent = PHASES[state.phase].label;

    if (!current) {
        els.counter.textContent = '';
        els.name.textContent = '';
        els.uni.textContent = '';
        els.nextUp.textContent = '';
        return;
    }
    els.counter.textContent = `${state.index + 1} / ${list.length}`;
    els.name.textContent = current[0];
    els.uni.textContent = current[1] || '';

    const next = list[state.index + 1];
    els.nextUp.textContent = next ? `Als Nächstes: ${next[0]}${next[1] ? ' (' + next[1] + ')' : ''}` : 'Letzter Pitch';

    els.listItems.querySelectorAll('li').forEach((li, i) => li.classList.toggle('current', i === state.index));
}

// One loop drives everything while running; setInterval is a backup in case
// requestAnimationFrame is throttled (e.g. window briefly hidden).
function tick() {
    if (state.running) render();
    requestAnimationFrame(tick);
}
setInterval(() => { if (state.running) render(); }, 250);

// --- Persistence (survives an accidental reload / browser crash) ------------

function savePosition() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ index: state.index, phase: state.phase }));
    } catch (e) { /* storage unavailable: ignore */ }
}

function loadPosition() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && Number.isInteger(saved.index) && PHASES[saved.phase]) {
            state.index = Math.min(Math.max(saved.index, 0), Math.max(CONFIG.startups.length - 1, 0));
            state.phase = saved.phase;
        }
    } catch (e) { /* ignore */ }
}

// --- Sound -----------------------------------------------------------------

let audioCtx = null;

function unlockAudio() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { /* no audio */ }
}

function playGong() {
    if (!state.soundOn) return;
    unlockAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    [[440, 0.5], [880, 0.25], [1320, 0.12]].forEach(([freq, gain]) => {
        const osc = audioCtx.createOscillator();
        const amp = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        amp.gain.setValueAtTime(gain, now);
        amp.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
        osc.connect(amp).connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 2.5);
    });
}

function toggleSound() {
    state.soundOn = !state.soundOn;
    flashSoundState();
}

function flashSoundState() {
    els.soundState.textContent = state.soundOn ? 'Ton an' : 'Ton aus';
    els.soundState.classList.add('visible');
    clearTimeout(flashSoundState.t);
    flashSoundState.t = setTimeout(() => els.soundState.classList.remove('visible'), 1500);
}

// --- Fullscreen, wake lock, cursor -------------------------------------------

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
}

let wakeLock = null;
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible') {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (e) { /* not supported: the launcher's caffeinate covers this */ }
}
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        requestWakeLock();
        render();
    }
});

let idleTimer = null;
function markActive() {
    els.body.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => els.body.classList.add('idle'), 2500);
}
document.addEventListener('mousemove', markActive);

// --- Overlays ----------------------------------------------------------------

function buildList() {
    els.listItems.innerHTML = '';
    CONFIG.startups.forEach(([name, uni], i) => {
        const li = document.createElement('li');
        li.textContent = uni ? `${name} (${uni})` : name;
        li.addEventListener('click', () => {
            setPosition(i, 'pitch');
            toggleOverlay(els.list, false);
        });
        els.listItems.appendChild(li);
    });
}

function toggleOverlay(el, force) {
    const show = force !== undefined ? force : !el.classList.contains('visible');
    [els.list, els.help].forEach(o => o.classList.remove('visible'));
    if (show) el.classList.add('visible');
}

function overlayOpen() {
    return els.list.classList.contains('visible') || els.help.classList.contains('visible');
}

// --- Keyboard / presentation clicker -------------------------------------------

const PRIMARY_KEYS = ['PageDown', 'ArrowRight', ' ', 'Enter'];
const BACK_KEYS = ['PageUp', 'ArrowLeft', 'Backspace'];
let lastPress = 0;

document.addEventListener('keydown', (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return; // keep Cmd+R, Cmd+Q etc.
    unlockAudio();

    const key = event.key;

    if (key === 'Escape' && overlayOpen()) {
        toggleOverlay(els.list, false);
        return;
    }

    // Ignore auto-repeat and clicker double-sends (< 250 ms apart).
    if (PRIMARY_KEYS.includes(key) || BACK_KEYS.includes(key)) {
        event.preventDefault();
        if (event.repeat || overlayOpen()) return;
        const now = performance.now();
        if (now - lastPress < 250) return;
        lastPress = now;
        if (PRIMARY_KEYS.includes(key)) primaryAction();
        else backAction();
        return;
    }

    switch (key.toLowerCase()) {
        case 'r': resetTimer(); break;
        case 'p': setPosition(state.index, 'pitch'); break;
        case 'q': setPosition(state.index, 'qa'); break;
        case 'n': nextPhase(); break;
        case 'arrowdown': event.preventDefault(); setPosition(state.index + 1, 'pitch'); break;
        case 'arrowup': event.preventDefault(); setPosition(state.index - 1, 'pitch'); break;
        case 'f': toggleFullscreen(); break;
        case 'm': toggleSound(); break;
        case 'l': toggleOverlay(els.list); break;
        case 'h': case '?': toggleOverlay(els.help); break;
    }
});

// --- On-screen buttons -----------------------------------------------------------

document.getElementById('btn-start').addEventListener('click', () => { unlockAudio(); primaryAction(); });
document.getElementById('btn-reset').addEventListener('click', resetTimer);
document.getElementById('btn-prev').addEventListener('click', previousPhase);
document.getElementById('btn-next').addEventListener('click', nextPhase);
document.getElementById('btn-list').addEventListener('click', () => toggleOverlay(els.list));
document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);
[els.list, els.help].forEach(o => o.addEventListener('click', (e) => {
    if (e.target === o) toggleOverlay(o, false);
}));
// Buttons must not keep keyboard focus, otherwise Space/Enter would "click" them too.
document.querySelectorAll('button').forEach(b => b.addEventListener('mouseup', () => b.blur()));

// --- Init --------------------------------------------------------------------------

loadPosition();
buildList();
renderStartup();
render();
requestWakeLock();
markActive();
requestAnimationFrame(tick);
