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

const sirenSound = document.getElementById("sirenSound");

let people = [
  { name: "John", status: "Missing" },
  { name: "Sarah", status: "Missing" },
  { name: "Michael", status: "Missing" }
];

let timer = 0;
let interval = null;
let beepInterval = null;
let isMuted = false;

let audioContext = null;

function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playBeep(duration = 300, frequency = 880, volume = 0.2) {
  if (isMuted) return;

  initAudioContext();

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gainNode.gain.value = volume;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();

  setTimeout(() => {
    oscillator.stop();
  }, duration);
}

function speakMessage(message) {
  if (isMuted || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}

function playSiren() {
  if (isMuted) return;

  sirenSound.currentTime = 0;
  sirenSound.play().catch(error => {
    console.log("Siren play blocked:", error);
  });
}

function stopSiren() {
  sirenSound.pause();
  sirenSound.currentTime = 0;
}

function renderPeople() {
  personList.innerHTML = "";

  people.forEach((person, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${person.name}</td>
      <td class="${person.status === "Present" ? "present" : "missing"}">${person.status}</td>
      <td>
        <button class="action-btn present-btn" onclick="markPresent(${index})">Present</button>
        <button class="action-btn missing-btn" onclick="markMissing(${index})">Missing</button>
      </td>
    `;

    personList.appendChild(row);
  });

  updateSummary();
  checkAllPresent();
}

function updateSummary() {
  const present = people.filter(p => p.status === "Present").length;
  const missing = people.filter(p => p.status === "Missing").length;

  totalCount.textContent = people.length;
  presentCount.textContent = present;
  missingCount.textContent = missing;
}

function markPresent(index) {
  people[index].status = "Present";
  playBeep(200, 1000, 0.15);
  renderPeople();
}

function markMissing(index) {
  people[index].status = "Missing";
  playBeep(200, 400, 0.15);
  renderPeople();
}

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function startReminderBeep() {
  stopReminderBeep();

  beepInterval = setInterval(() => {
    const missing = people.filter(person => person.status === "Missing").length;

    if (missing > 0 && interval) {
      playBeep(500, 750, 0.25);
      speakMessage(`${missing} personnel still missing.`);
    }
  }, 10000);
}

function stopReminderBeep() {
  if (beepInterval) {
    clearInterval(beepInterval);
    beepInterval = null;
  }
}

function checkAllPresent() {
  const total = people.length;
  const present = people.filter(p => p.status === "Present").length;

  if (total > 0 && present === total && interval) {
    stopReminderBeep();
    speakMessage("All personnel are present.");
    playBeep(700, 1200, 0.25);
  }
}

function startDrill() {
  if (interval) return;

  initAudioContext();

  drillStatus.textContent = "Drill Active";
  drillStatus.classList.remove("inactive");
  drillStatus.classList.add("active");

  startBtn.disabled = true;
  stopBtn.disabled = false;

  playSiren();
  speakMessage("Muster drill started. Please report to the assembly point.");
  startReminderBeep();

  interval = setInterval(() => {
    timer++;
    timerDisplay.textContent = formatTime(timer);
  }, 1000);
}

function stopDrill() {
  clearInterval(interval);
  interval = null;

  stopReminderBeep();
  stopSiren();

  drillStatus.textContent = "Drill Stopped";
  drillStatus.classList.remove("active");
  drillStatus.classList.add("inactive");

  startBtn.disabled = false;
  stopBtn.disabled = true;

  speakMessage("Muster drill stopped.");
}

function resetDrill() {
  clearInterval(interval);
  interval = null;

  stopReminderBeep();
  stopSiren();

  timer = 0;
  timerDisplay.textContent = "00:00";

  drillStatus.textContent = "Not Started";
  drillStatus.classList.remove("active");
  drillStatus.classList.add("inactive");

  startBtn.disabled = false;
  stopBtn.disabled = true;

  people = people.map(person => ({
    ...person,
    status: "Missing"
  }));

  window.speechSynthesis.cancel();
  renderPeople();
}

function toggleMute() {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "Unmute" : "Mute";

  if (isMuted) {
    sirenSound.pause();
    window.speechSynthesis.cancel();
  } else {
    if (interval) {
      playSiren();
    }
  }
}

addPersonBtn.addEventListener("click", () => {
  const name = personNameInput.value.trim();

  if (name === "") {
    alert("Please enter a name.");
    return;
  }

  people.push({ name, status: "Missing" });
  personNameInput.value = "";
  renderPeople();
});

startBtn.addEventListener("click", startDrill);
stopBtn.addEventListener("click", stopDrill);
resetBtn.addEventListener("click", resetDrill);
muteBtn.addEventListener("click", toggleMute);

renderPeople();

// Make functions available to inline buttons
window.markPresent = markPresent;
window.markMissing = markMissing;
