const personList = document.getElementById("personList");
const personNameInput = document.getElementById("personName");
const addPersonBtn = document.getElementById("addPersonBtn");

const totalCount = document.getElementById("totalCount");
const presentCount = document.getElementById("presentCount");
const missingCount = document.getElementById("missingCount");

const drillStatus = document.getElementById("drillStatus");
const timerDisplay = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");
const muteBtn = document.getElementById("muteBtn");

const volumeSlider = document.getElementById("volumeSlider");
const volumeValue = document.getElementById("volumeValue");
const alertBanner = document.getElementById("alertBanner");

const sirenSound = document.getElementById("sirenSound");

const STORAGE_KEY = "musterDrillProData";

let people = [
  { id: 1, name: "John", status: "Missing" },
  { id: 2, name: "Sarah", status: "Missing" },
  { id: 3, name: "Michael", status: "Missing" }
];

let timer = 0;
let drillInterval = null;
let reminderInterval = null;
let isMuted = false;
let volume = 0.7;
let audioContext = null;
let nextId = 4;

// General Emergency Alarm state
let hornTimeouts = [];
let hornPatternPlaying = false;

function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function saveData() {
  const data = {
    people,
    timer,
    isMuted,
    volume,
    nextId
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const data = JSON.parse(saved);
    people = data.people || people;
    timer = data.timer || 0;
    isMuted = data.isMuted || false;
    volume = typeof data.volume === "number" ? data.volume : 0.7;
    nextId = data.nextId || nextId;

    timerDisplay.textContent = formatTime(timer);
    volumeSlider.value = volume;
    volumeValue.textContent = `${Math.round(volume * 100)}%`;
    muteBtn.textContent = isMuted ? "Unmute" : "Mute";
    sirenSound.volume = volume;
  } catch (error) {
    console.error("Failed to load saved data:", error);
  }
}

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function updateSummary() {
  const present = people.filter(person => person.status === "Present").length;
  const missing = people.filter(person => person.status === "Missing").length;

  totalCount.textContent = people.length;
  presentCount.textContent = present;
  missingCount.textContent = missing;
}

function renderPeople() {
  personList.innerHTML = "";

  people.forEach(person => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = person.name;

    const statusCell = document.createElement("td");
    statusCell.textContent = person.status;
    statusCell.className = person.status === "Present" ? "present" : "missing";

    const actionCell = document.createElement("td");
    const actionGroup = document.createElement("div");
    actionGroup.className = "action-group";

    const presentBtn = document.createElement("button");
    presentBtn.textContent = "Present";
    presentBtn.className = "action-btn present-btn";
    presentBtn.addEventListener("click", () => markPresent(person.id));

    const missingBtn = document.createElement("button");
    missingBtn.textContent = "Missing";
    missingBtn.className = "action-btn missing-btn";
    missingBtn.addEventListener("click", () => markMissing(person.id));

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.className = "action-btn remove-btn";
    removeBtn.addEventListener("click", () => removePerson(person.id));

    actionGroup.appendChild(presentBtn);
    actionGroup.appendChild(missingBtn);
    actionGroup.appendChild(removeBtn);
    actionCell.appendChild(actionGroup);

    row.appendChild(nameCell);
    row.appendChild(statusCell);
    row.appendChild(actionCell);

    personList.appendChild(row);
  });

  updateSummary();
  checkAllPresent();
  saveData();
}

function playBeep(duration = 300, frequency = 880, beepVolume = 0.2) {
  if (isMuted) return;

  initAudioContext();

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gainNode.gain.value = beepVolume * volume;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();

  setTimeout(() => {
    oscillator.stop();
  }, duration);
}

function playHornBlast(duration = 600, frequency = 520, hornVolume = 0.45) {
  if (isMuted) return;

  initAudioContext();

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, now);

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(hornVolume * volume, now + 0.03);
  gainNode.gain.setValueAtTime(hornVolume * volume, now + Math.max(0.05, duration / 1000 - 0.08));
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + duration / 1000 + 0.02);
}

function stopHornPattern() {
  hornTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
  hornTimeouts = [];
  hornPatternPlaying = false;
}

function playGeneralEmergencyAlarm(onComplete) {
  if (isMuted) {
    if (typeof onComplete === "function") onComplete();
    return;
  }

  stopHornPattern();
  hornPatternPlaying = true;

  // Pattern:
  // 7 short horns: 500ms each with 300ms gap
  // 1 long horn: 2500ms
  const shortHornDuration = 500;
  const gapDuration = 300;
  const longHornDuration = 2500;

  let currentTime = 0;

  for (let i = 0; i < 7; i++) {
    const timeoutId = setTimeout(() => {
      if (!hornPatternPlaying || isMuted || !drillInterval) return;
      playHornBlast(shortHornDuration, 520, 0.45);
    }, currentTime);

    hornTimeouts.push(timeoutId);
    currentTime += shortHornDuration + gapDuration;
  }

  const longHornTimeout = setTimeout(() => {
    if (!hornPatternPlaying || isMuted || !drillInterval) return;
    playHornBlast(longHornDuration, 520, 0.5);
  }, currentTime);

  hornTimeouts.push(longHornTimeout);
  currentTime += longHornDuration;

  const finishTimeout = setTimeout(() => {
    hornPatternPlaying = false;
    hornTimeouts = [];

    if (typeof onComplete === "function" && drillInterval && !isMuted) {
      onComplete();
    }
  }, currentTime + 100);

  hornTimeouts.push(finishTimeout);
}

function speakMessage(message) {
  if (isMuted || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = volume;

  window.speechSynthesis.speak(utterance);
}

function playSiren() {
  if (isMuted) return;

  sirenSound.volume = volume;
  sirenSound.currentTime = 0;
  sirenSound.play().catch(error => {
    console.log("Siren blocked:", error);
  });
}

function stopSiren() {
  sirenSound.pause();
  sirenSound.currentTime = 0;
}

function getPresentCount() {
  return people.filter(person => person.status === "Present").length;
}

function getMissingCount() {
  return people.filter(person => person.status === "Missing").length;
}

function markPresent(id) {
  const person = people.find(p => p.id === id);
  if (!person) return;

  person.status = "Present";
  playBeep(200, 1000, 0.18);
  renderPeople();
}

function markMissing(id) {
  const person = people.find(p => p.id === id);
  if (!person) return;

  person.status = "Missing";
  playBeep(200, 450, 0.18);
  renderPeople();

  if (drillInterval && !isMuted && sirenSound.paused && !hornPatternPlaying) {
    playSiren();
  }
}

function removePerson(id) {
  people = people.filter(person => person.id !== id);
  renderPeople();
}

function addPerson() {
  const name = personNameInput.value.trim();

  if (!name) {
    alert("Please enter a name.");
    return;
  }

  people.push({
    id: nextId++,
    name,
    status: "Missing"
  });

  personNameInput.value = "";
  renderPeople();
}

function startReminder() {
  stopReminder();

  reminderInterval = setInterval(() => {
    if (!drillInterval) return;

    const missing = getMissingCount();

    if (missing > 0) {
      playBeep(500, 750, 0.25);
      speakMessage(`${missing} personnel still missing.`);
    }
  }, 10000);
}

function stopReminder() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
}

function showActiveDrillUI() {
  drillStatus.textContent = "Drill Active";
  drillStatus.classList.remove("inactive");
  drillStatus.classList.add("active");
  startBtn.disabled = true;
  stopBtn.disabled = false;
  alertBanner.classList.remove("hidden");
}

function showInactiveDrillUI(label = "Drill Stopped") {
  drillStatus.textContent = label;
  drillStatus.classList.remove("active");
  drillStatus.classList.add("inactive");
  startBtn.disabled = false;
  stopBtn.disabled = true;
  alertBanner.classList.add("hidden");
}

function checkAllPresent() {
  const total = people.length;
  const present = getPresentCount();

  if (!drillInterval) return;
  if (total === 0) return;

  if (present === total) {
    stopReminder();
    stopHornPattern();
    stopSiren();
    speakMessage("All personnel are present.");
    playBeep(700, 1200, 0.25);
  }
}

function startDrill() {
  if (drillInterval) return;

  initAudioContext();

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  showActiveDrillUI();
  speakMessage("General emergency alarm. Muster drill started. Please report to the assembly point.");
  startReminder();

  drillInterval = setInterval(() => {
    timer++;
    timerDisplay.textContent = formatTime(timer);
    saveData();
  }, 1000);

  // First play 7 short horns + 1 long horn
  // Then start looping siren if drill is still active and people are still missing
  playGeneralEmergencyAlarm(() => {
    if (drillInterval && getMissingCount() > 0) {
      playSiren();
    }
  });

  checkAllPresent();
  saveData();
}

function stopDrill() {
  clearInterval(drillInterval);
  drillInterval = null;

  stopReminder();
  stopHornPattern();
  stopSiren();
  window.speechSynthesis.cancel();

  showInactiveDrillUI("Drill Stopped");
  speakMessage("Muster drill stopped.");
  saveData();
}

function resetDrill() {
  clearInterval(drillInterval);
  drillInterval = null;

  stopReminder();
  stopHornPattern();
  stopSiren();
  window.speechSynthesis.cancel();

  timer = 0;
  timerDisplay.textContent = "00:00";

  people = people.map(person => ({
    ...person,
    status: "Missing"
  }));

  showInactiveDrillUI("Not Started");
  renderPeople();
  saveData();
}

function toggleMute() {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "Unmute" : "Mute";

  if (isMuted) {
    stopHornPattern();
    stopSiren();
    window.speechSynthesis.cancel();
  } else if (drillInterval) {
    // When unmuted during active drill:
    // replay general emergency alarm, then siren
    playGeneralEmergencyAlarm(() => {
      if (drillInterval && getMissingCount() > 0) {
        playSiren();
      }
    });
  }

  saveData();
}

function updateVolume() {
  volume = parseFloat(volumeSlider.value);
  volumeValue.textContent = `${Math.round(volume * 100)}%`;
  sirenSound.volume = volume;
  saveData();
}

addPersonBtn.addEventListener("click", addPerson);

personNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addPerson();
  }
});

startBtn.addEventListener("click", startDrill);
stopBtn.addEventListener("click", stopDrill);
resetBtn.addEventListener("click", resetDrill);
muteBtn.addEventListener("click", toggleMute);
volumeSlider.addEventListener("input", updateVolume);

loadData();
renderPeople();
showInactiveDrillUI("Not Started");
timerDisplay.textContent = formatTime(timer);
sirenSound.volume = volume;
