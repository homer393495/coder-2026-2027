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
const shortHornSound = document.getElementById("shortHornSound");
const longHornSound = document.getElementById("longHornSound");

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
let nextId = 4;

let hornSequenceToken = 0;
let hornSequencePlaying = false;

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
    applyVolume();
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

function applyVolume() {
  sirenSound.volume = volume;
  shortHornSound.volume = volume;
  longHornSound.volume = volume;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function stopAudio(audio) {
  audio.pause();
  audio.currentTime = 0;
}

function playSiren() {
  if (isMuted) return;
  applyVolume();
  sirenSound.currentTime = 0;
  sirenSound.play().catch(error => {
    console.log("Siren blocked:", error);
  });
}

function stopSiren() {
  stopAudio(sirenSound);
}

function stopHornSounds() {
  stopAudio(shortHornSound);
  stopAudio(longHornSound);
}

function stopHornSequence() {
  hornSequenceToken++;
  hornSequencePlaying = false;
  stopHornSounds();
}

async function playShortHorn(token) {
  if (token !== hornSequenceToken || isMuted || !drillInterval) return;

  stopHornSounds();
  applyVolume();

  shortHornSound.currentTime = 0;

  try {
    await shortHornSound.play();
  } catch (error) {
    console.log("Short horn blocked:", error);
  }
}

async function playLongHorn(token) {
  if (token !== hornSequenceToken || isMuted || !drillInterval) return;

  stopHornSounds();
  applyVolume();

  longHornSound.currentTime = 0;

  try {
    await longHornSound.play();
  } catch (error) {
    console.log("Long horn blocked:", error);
  }
}

async function playGeneralEmergencyAlarm() {
  if (isMuted || !drillInterval) return;

  stopSiren();
  stopHornSequence();

  hornSequencePlaying = true;
  const token = hornSequenceToken;

  // 7 short horns
  for (let i = 0; i < 7; i++) {
    if (token !== hornSequenceToken || isMuted || !drillInterval) return;

    await playShortHorn(token);

    // Adjust these times to match your actual short horn audio length
    await sleep(900);
  }

  // 1 long horn
  if (token !== hornSequenceToken || isMuted || !drillInterval) return;
  await playLongHorn(token);

  // Adjust this time to match your actual long horn audio length
  await sleep(3500);

  if (token !== hornSequenceToken || isMuted || !drillInterval) return;

  hornSequencePlaying = false;
  stopHornSounds();

  if (getMissingCount() > 0) {
    playSiren();
  }
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
  renderPeople();
}

function markMissing(id) {
  const person = people.find(p => p.id === id);
  if (!person) return;

  person.status = "Missing";
  renderPeople();

  if (drillInterval && !isMuted && sirenSound.paused && !hornSequencePlaying) {
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
    if (!drillInterval || hornSequencePlaying) return;

    const missing = getMissingCount();

    if (missing > 0) {
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

  if (!drillInterval || total === 0) return;

  if (present === total) {
    stopReminder();
    stopHornSequence();
    stopSiren();
    speakMessage("All personnel are present.");
  }
}

async function startDrill() {
  if (drillInterval) return;

  showActiveDrillUI();
  speakMessage("General emergency alarm. Muster drill started. Please report to the assembly point.");

  drillInterval = setInterval(() => {
    timer++;
    timerDisplay.textContent = formatTime(timer);
    saveData();
  }, 1000);

  startReminder();
  saveData();

  await playGeneralEmergencyAlarm();
  checkAllPresent();
}

function stopDrill() {
  clearInterval(drillInterval);
  drillInterval = null;

  stopReminder();
  stopHornSequence();
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
  stopHornSequence();
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

async function toggleMute() {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "Unmute" : "Mute";

  if (isMuted) {
    stopHornSequence();
    stopSiren();
    window.speechSynthesis.cancel();
  } else if (drillInterval) {
    await playGeneralEmergencyAlarm();
  }

  saveData();
}

function updateVolume() {
  volume = parseFloat(volumeSlider.value);
  volumeValue.textContent = `${Math.round(volume * 100)}%`;
  applyVolume();
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
applyVolume();
