let timeLeft = 90; // 90 seconds
let timerInterval = null;
const display = document.getElementById('timer-display');

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

function startTimer() {
    if (timerInterval) return; // Prevent multiple clicks

    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
            // Optional: Play a sound here
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function resetTimer() {
    pauseTimer();
    timeLeft = 90;
    updateDisplay();
    // Reset color to brand bright green
    display.style.color = "#A0C75E";
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