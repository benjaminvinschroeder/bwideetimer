let timeLeft = 90; // 90 seconds
let timerInterval = null;
const display = document.getElementById('timer-display');

// Elapsed Timer Variables
const elapsedDisplay = document.getElementById('elapsed-display');
let elapsedInterval = null;
let elapsedStartTime = 0;
let elapsedAccumulated = 0;

function updateDisplay() {
    // Show only total seconds (e.g. "90")
    display.innerText = timeLeft;

    // Visual logic: Change color when time is running out (last 10 seconds)
    if (timeLeft <= 10 && timeLeft > 0) {
        display.style.color = "#FF6B6B"; // Warning Red (optional deviation for UX)
    } else if (timeLeft === 0) {
         display.style.color = "#E3E8EB"; // Reset to grey when done
    } else {
        display.style.color = "#A0C75E"; // Bright Green (Brand)
    }
}

function updateElapsedDisplay() {
    // Calculate total milliseconds passed
    const now = Date.now();
    const diff = elapsedAccumulated + (now - elapsedStartTime);

    const totalSeconds = Math.floor(diff / 1000);
    const ms = diff % 1000;

    // Show total seconds and milliseconds (e.g. "5.123")
    elapsedDisplay.innerText = `${totalSeconds}.${ms.toString().padStart(3, '0')}`;
}

function startTimer() {
    if (timerInterval) return; // Prevent multiple clicks

    // 1. Logic for Main Countdown
    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
            pauseTimer(); // Stop everything when done
            // Optional: Play a sound here
        }
    }, 1000);

    // 2. Logic for Elapsed Milliseconds Timer
    elapsedStartTime = Date.now();
    elapsedInterval = setInterval(updateElapsedDisplay, 10); // Update every 10ms

    // 3. Visual Animation
    display.classList.add('timer-running');
}

function pauseTimer() {
    // Stop Main Timer
    clearInterval(timerInterval);
    timerInterval = null;

    // Stop Elapsed Timer & Save state
    if (elapsedInterval) {
        clearInterval(elapsedInterval);
        elapsedAccumulated += Date.now() - elapsedStartTime;
        elapsedInterval = null;
    }

    // Stop Animation
    display.classList.remove('timer-running');
}

function resetTimer() {
    pauseTimer();
    
    // Reset Main Timer
    timeLeft = 90;
    updateDisplay();
    display.style.color = "#A0C75E"; // Reset color

    // Reset Elapsed Timer
    elapsedAccumulated = 0;
    elapsedDisplay.innerText = "0.000";
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// --- Presentation Clicker & Keyboard Support ---

function toggleTimer() {
    if (timerInterval) {
        pauseTimer();
    } else {
        startTimer();
    }
}

document.addEventListener('keydown', (event) => {
    // "Next" button on clickers usually maps to PageDown, Right Arrow, or Space
    if (['PageDown', 'ArrowRight', ' ', 'Enter', 'ArrowDown'].includes(event.key)) {
        event.preventDefault(); // Prevent page scrolling
        toggleTimer();
    }
    // "Back" button usually maps to PageUp or Left Arrow
    else if (['PageUp', 'ArrowLeft', 'ArrowUp', 'Backspace'].includes(event.key)) {
        event.preventDefault();
        resetTimer();
    }
    // Toggle Fullscreen with 'F'
    else if (event.key === 'f' || event.key === 'F') {
        toggleFullscreen();
    }
});

// Initialize
updateDisplay();