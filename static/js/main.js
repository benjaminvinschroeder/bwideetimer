let timeLeft = 90; // 90 seconds
let timerInterval = null;
const display = document.getElementById('timer-display');

// Elapsed Timer Variables
const elapsedDisplay = document.getElementById('elapsed-display');
let elapsedInterval = null;
let elapsedStartTime = 0;
let elapsedAccumulated = 0;

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    // Formats numbers to always have two digits (e.g., 01:09 instead of 1:9)
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    display.innerText = formattedTime;

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
    
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    const ms = diff % 1000;

    elapsedDisplay.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(3, '0')}`;
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
    elapsedDisplay.innerText = "00:00:000";
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
});

// Initialize
updateDisplay();