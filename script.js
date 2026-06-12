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

let people = [
  { name: "John", status: "Missing" },
  { name: "Sarah", status: "Missing" },
  { name: "Michael", status: "Missing" }
];

let timer = 0;
let interval = null;

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
}

function updateSummary() {
  totalCount.textContent = people.length;
  presentCount.textContent = people.filter(p => p.status === "Present").length;
  missingCount.textContent = people.filter(p => p.status === "Missing").length;
}

function markPresent(index) {
  people[index].status = "Present";
  renderPeople();
}

function markMissing(index) {
  people[index].status = "Missing";
  renderPeople();
}

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function startDrill() {
  if (interval) return;

  drillStatus.textContent = "Drill Active";
  drillStatus.classList.remove("inactive");
  drillStatus.classList.add("active");

  startBtn.disabled = true;
  stopBtn.disabled = false;

  interval = setInterval(() => {
    timer++;
    timerDisplay.textContent = formatTime(timer);
  }, 1000);
}

function stopDrill() {
  clearInterval(interval);
  interval = null;

  drillStatus.textContent = "Drill Stopped";
  drillStatus.classList.remove("active");
  drillStatus.classList.add("inactive");

  startBtn.disabled = false;
  stopBtn.disabled = true;
}

function resetDrill() {
  clearInterval(interval);
  interval = null;
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

  renderPeople();
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

renderPeople();
