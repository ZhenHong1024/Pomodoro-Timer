# Pomodoro Web App Plan

## Approach

Create a small, dependency-free single-page Pomodoro timer using `index.html` for structure, `style.css` for the circular timer and responsive layout, and `app.js` for timing, controls, persistence, and sound. The app will alternate 25-minute work and 5-minute break periods, preserve the completed-work-session count in `localStorage`, and keep all UI behavior synchronized through render functions.

## File Responsibilities

### `index.html`

- Load `style.css` and `app.js`.
- Provide the timer mode label, remaining-time display, circular progress element, session counter, and Pause/Resume/Reset controls.
- Give controls and dynamic output accessible names and stable element IDs for JavaScript.
- Use semantic structure and button elements.

### `style.css`

- Style the page, timer card, mode label, countdown, session counter, and control buttons.
- Render the circular progress indicator with an SVG `<circle>` pair or a CSS conic-gradient; use a normalized stroke/gradient value updated by JavaScript.
- Provide a clear running, paused, work, and break visual state.
- Keep the layout responsive and usable on small screens.
- Respect `prefers-reduced-motion` for transitions.

### `app.js`

- Maintain mode, duration, remaining seconds, running state, interval, and persisted session count.
- Use wall-clock deadlines where practical so timer accuracy survives delayed browser callbacks.
- Alternate from work to break and break to work after a completed countdown.
- Increment the persisted session count only when a work period completes.
- Pause and resume without accumulating extra elapsed time.
- Reset the current mode to its full duration and stop it.
- Update the circular progress, text, mode label, and control state.
- Play a short transition sound using the Web Audio API after a user has interacted with the page.
- Request browser notification permission when the user enables notifications.
- Display a browser notification when a work or break session ends.
- Show the next session mode in the notification (e.g. "Work session completed. Time for a break!").
- Handle notification permission being denied without affecting the timer.
- Only send notifications when browser notifications are supported and permission is granted.

**Key function signatures**

- `function loadSessionCount()`: reads and validates the completed-session count from `localStorage`.
- `function saveSessionCount(count)`: persists the completed-session count.
- `function formatTime(totalSeconds)`: returns `MM:SS` text.
- `function getModeDuration(mode)`: returns the work or break duration in seconds.
- `function startTimer()`: starts or resumes the countdown.
- `function pauseTimer()`: pauses and preserves the remaining time.
- `function resetTimer()`: returns to the start of the current mode and stops it.
- `function tick()`: reconciles elapsed time, handles expiration, and performs transitions.
- `function switchMode()`: alternates work/break mode and initializes the next full duration.
- `function updateProgress()`: updates the circular progress, countdown text, mode label, and session count.
- `function playTransitionSound()`: produces the transition audio cue.
- `function bindControls()`: attaches click handlers to the timer controls.
- `function initializeApp()`: loads state, binds controls, and performs the initial render.
- function requestNotificationPermission(): Requests permission to display browser notifications.
- function showNotification(message): Displays a browser notification when a session ends.

## Build Order

1. Build the semantic HTML structure and add element IDs/hooks.
2. Create the CSS layout and circular progress styling.
3. Implement timer state and pure helpers in `app.js`.
4. Add start, pause, resume, reset, and wall-clock tick behavior.
5. Add work/break mode transitions, sound, and session-count persistence.
6. Verify keyboard controls, mobile layout, countdown accuracy, persistence across reloads, and each transition.
7. Implement browser notifications and test notification permissions, session-end alerts, and denied-permission handling.
