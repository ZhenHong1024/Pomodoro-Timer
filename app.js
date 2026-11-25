const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;
const SESSION_COUNT_KEY = "pomodoroCompletedSessions";
const RING_RADIUS = 108;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

let mode = "work";
let duration = WORK_DURATION;
let remainingSeconds = WORK_DURATION;
let isRunning = false;
let intervalId = null;
let deadline = null;
let completedSessionCount = 0;
let audioContext = null;
let notificationsEnabled = false;

function loadSessionCount() {
  const storedCount = localStorage.getItem(SESSION_COUNT_KEY);
  const parsedCount = Number.parseInt(storedCount, 10);
  return Number.isInteger(parsedCount) && parsedCount >= 0 ? parsedCount : 0;
}

function saveSessionCount(count) {
  localStorage.setItem(SESSION_COUNT_KEY, String(count));
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getModeDuration(selectedMode) {
  return selectedMode === "break" ? BREAK_DURATION : WORK_DURATION;
}

function startTimer() {
  if (isRunning) {
    return;
  }

  if (remainingSeconds <= 0) {
    remainingSeconds = duration;
  }

  isRunning = true;
  intervalId = setInterval(tick, 1000);
  updateProgress();
}

function pauseTimer() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }

  isRunning = false;
  updateProgress();
}

function resetTimer() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }

  mode = "work";
  duration = WORK_DURATION;
  remainingSeconds = duration;
  isRunning = false;
  completedSessionCount = 0;
  saveSessionCount(completedSessionCount);
  updateProgress();
}

function tick() {
  if (remainingSeconds > 0) {
    remainingSeconds -= 1;
  }

  updateProgress();

  if (remainingSeconds === 0) {
    switchMode();
  }
}

function switchMode() {
  const previousMode = mode;
  if (previousMode === "work") {
    completedSessionCount += 1;
    saveSessionCount(completedSessionCount);
  }

  mode = mode === "work" ? "break" : "work";
  duration = getModeDuration(mode);
  remainingSeconds = duration;
  playTransitionSound(previousMode, mode);
  showNotification(
    mode === "break"
      ? "Work session completed. Time for a break!"
      : "Break completed. Time for work!"
  );
  updateProgress();
}

function updateProgress() {
  const timerDisplay = document.getElementById("timerDisplay");
  const modeLabel = document.getElementById("modeLabel");
  const sessionCount = document.getElementById("sessionCount");
  const progressCircle = document.getElementById("progressCircle");
  const timerCard = document.querySelector(".timer-card");
  const startPauseButton = document.getElementById("startPauseButton");

  if (timerDisplay) {
    timerDisplay.textContent = formatTime(remainingSeconds);
  }

  if (modeLabel) {
    modeLabel.textContent = mode === "work" ? "Work" : "Break";
  }

  if (sessionCount) {
    sessionCount.textContent = String(completedSessionCount);
  }

  if (progressCircle) {
    const remainingRatio = duration > 0 ? remainingSeconds / duration : 0;
    progressCircle.style.strokeDasharray = String(RING_CIRCUMFERENCE);
    progressCircle.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - remainingRatio));
  }

  if (timerCard) {
    timerCard.classList.toggle("is-running", isRunning);
    timerCard.classList.toggle("is-paused", !isRunning);
    timerCard.classList.toggle("is-break", mode === "break");
  }

  if (startPauseButton) {
    startPauseButton.textContent = isRunning ? "Pause" : "Start";
    startPauseButton.setAttribute("aria-label", isRunning ? "Pause timer" : "Start timer");
  }
}

function getAudioContext() {
  if (!window.AudioContext && !window.webkitAudioContext) {
    return null;
  }

  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function playTone(frequency, durationSeconds = 0.08, volume = 0.12) {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  try {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startTime = context.currentTime;
    const stopTime = startTime + durationSeconds;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, stopTime);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(stopTime);
  } catch (error) {
    console.warn("Unable to play timer audio.", error);
  }
}

function playTransitionSound(previousMode, nextMode) {
  if (previousMode === "work" && nextMode === "break") {
    playTone(660, 0.18, 0.16);
  } else if (previousMode === "break" && nextMode === "work") {
    playTone(880, 0.18, 0.16);
  }
}

function playClickBeep() {
  playTone(440, 0.05, 0.08);
}

function bindControls() {
  const startPauseButton = document.getElementById("startPauseButton");
  const resetButton = document.getElementById("resetButton");
  const notificationButton = document.getElementById("notificationButton");

  if (startPauseButton) {
    startPauseButton.addEventListener("click", () => {
      playClickBeep();
      if (isRunning) {
        pauseTimer();
      } else {
        startTimer();
      }
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      playClickBeep();
      resetTimer();
    });
  }

  if (notificationButton) {
    notificationButton.addEventListener("click", () => {
      if (notificationsEnabled) {
        disableNotifications();
      } else {
        requestNotificationPermission();
      }
    });
  }
}

function requestNotificationPermission() {
  if (!("Notification" in window)) {
    updateNotificationButton("Notifications Unsupported");
    return;
  }

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const isSecureContext =
    window.isSecureContext ||
    (window.location.protocol === "http:" && isLocalhost);

  if (!isSecureContext) {
    updateNotificationButton("Use HTTPS / Localhost");
    return;
  }

  if (Notification.permission === "granted") {
    notificationsEnabled = true;
    updateNotificationButton("Disable Notifications");
    return;
  }

  if (Notification.permission === "denied") {
    updateNotificationButton("Notifications Blocked");
    return;
  }

  const updatePermission = (permission) => {
    if (permission === "granted") {
      notificationsEnabled = true;
      updateNotificationButton("Disable Notifications");
    } else {
      updateNotificationButton("Notifications Blocked");
    }
  };

  if (typeof Notification.requestPermission === "function") {
    const permissionResult = Notification.requestPermission(updatePermission);

    if (permissionResult && typeof permissionResult.then === "function") {
      permissionResult.then(updatePermission).catch(() => {
        updateNotificationButton("Notifications Blocked");
      });
    }
  } else {
    updateNotificationButton("Notifications Unsupported");
  }
}

function showNotification(message) {
  if (!notificationsEnabled ||
    !("Notification" in window) ||
    Notification.permission !== "granted") {
    return;
  }

  try {
    new Notification("Pomodoro Timer", { body: message });
  } catch (error) {
    console.warn("Unable to display browser notification.", error);
  }
}

function updateNotificationButton(text) {
  const notificationButton = document.getElementById("notificationButton");
  if (notificationButton) {
    notificationButton.textContent = text;
  }
}

function disableNotifications() {
  notificationsEnabled = false;
  updateNotificationButton("Enable Notifications");
}

function initializeApp() {
  mode = "work";
  duration = getModeDuration(mode);
  remainingSeconds = duration;
  completedSessionCount = loadSessionCount();
  bindControls();

  if ("Notification" in window) {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const isSecureContext =
      window.isSecureContext ||
      (window.location.protocol === "http:" && isLocalhost);

    if (!isSecureContext) {
      updateNotificationButton("Use HTTPS / Localhost");
    } else if (Notification.permission === "granted") {
      notificationsEnabled = true;
      updateNotificationButton("Disable Notifications");
    } else if (Notification.permission === "denied") {
      updateNotificationButton("Notifications Blocked");
    }
  } else {
    updateNotificationButton("Notifications Unsupported");
  }

  updateProgress();
}

initializeApp();
