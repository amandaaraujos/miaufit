const screens = {
  login: document.getElementById("loginScreen"),
  register: document.getElementById("registerScreen"),
  home: document.getElementById("homeScreen"),
  history: document.getElementById("historyScreen"),
  settings: document.getElementById("settingsScreen"),
  exercisesSettings: document.getElementById("exercisesSettingsScreen"),
  workout: document.getElementById("workoutScreen"),
  rest: document.getElementById("restScreen")
};

const modal = document.getElementById("welcomeModal");

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

let currentUser = null;
let currentWorkout = null;
let currentExerciseIndex = 0;
let currentSet = 1;
let restInterval = null;

function hideAllScreens() {
  Object.values(screens).forEach(screen => {
    if (screen) screen.classList.add("hidden");
  });
}

function showLogin() {
  modal.classList.remove("active");
  hideAllScreens();
  screens.login.classList.remove("hidden");
}

function showRegister() {
  modal.classList.remove("active");
  hideAllScreens();
  screens.register.classList.remove("hidden");
}

function showHome() {
  hideAllScreens();
  screens.home.classList.remove("hidden");
  loadHome();
}

function showHistory() {
  hideAllScreens();
  screens.history.classList.remove("hidden");
  loadHistory();
}

function showSettings() {
  hideAllScreens();
  screens.settings.classList.remove("hidden");
  loadSettings();
}

function showExercisesSettings() {
  hideAllScreens();
  screens.exercisesSettings.classList.remove("hidden");
  loadWorkoutsList();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getTodayWorkout() {
  if (!currentUser?.workouts) return null;

  const today = new Date().getDay();

  return currentUser.workouts.find(workout =>
    workout.days.includes(today)
  ) || null;
}

function createAccount() {
  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("registerConfirmPassword").value;
  const knowledgeLevel = document.getElementById("knowledgeLevel").value;
  const waterGoal = document.getElementById("waterGoal").value;
  const initialWeight = document.getElementById("initialWeight").value;
  const goalWeight = document.getElementById("goalWeight").value;

  if (!name || !email || !password) {
    alert("Preencha os dados principais.");
    return;
  }

  if (!validateEmail(email)) {
    alert("Digite um e-mail válido.");
    return;
  }

  if (password !== confirmPassword) {
    alert("As senhas não coincidem.");
    return;
  }

  currentUser = {
    name,
    email,
    password,
    knowledgeLevel,
    waterGoal,
    initialWeight,
    goalWeight,
    workouts: [],
    history: []
  };

  localStorage.setItem("miaufitUser", JSON.stringify(currentUser));
  saveSession();

  alert("Conta criada com sucesso 💪");
  showHome();
}

function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const user = JSON.parse(localStorage.getItem("miaufitUser"));

  if (!user) {
    alert("Nenhuma conta encontrada.");
    return;
  }

  if (user.email !== email || user.password !== password) {
    alert("E-mail ou senha incorretos.");
    return;
  }

  currentUser = user;
  saveSession();
  showHome();
}

function saveSession() {
  localStorage.setItem("miaufitSession", JSON.stringify({
    email: currentUser.email,
    logged: true
  }));
}

function loadSession() {
  const session = JSON.parse(localStorage.getItem("miaufitSession"));
  const user = JSON.parse(localStorage.getItem("miaufitUser"));

  if (session?.logged && user && session.email === user.email) {
    currentUser = user;
    modal.classList.remove("active");
    showHome();
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("miaufitSession");
  hideAllScreens();
  modal.classList.add("active");
}

function loadHome() {
  document.getElementById("homeGreeting").innerText = `Oi, ${currentUser.name} 🐾`;

  const todayWorkout = getTodayWorkout();
  const startButton = document.getElementById("startWorkoutButton");
  const restActions = document.getElementById("restDayActions");

  if (todayWorkout) {
    document.getElementById("todayWorkoutName").innerText = todayWorkout.name;
    document.getElementById("todayWorkoutSchedule").innerText =
      `Horário: ${todayWorkout.time || "Não definido"}`;

    startButton.disabled = false;
    startButton.innerText = "Iniciar treino do dia";
    restActions.classList.add("hidden");
  } else {
    document.getElementById("todayWorkoutName").innerText = "Hoje é dia de descanso 🧘";
    document.getElementById("todayWorkoutSchedule").innerText =
      "Nenhum treino cadastrado para hoje.";

    startButton.disabled = true;
    startButton.innerText = "Sem treino programado hoje";
    restActions.classList.remove("hidden");
  }

  document.getElementById("homeGoalsInfo").innerHTML = `
    💧 Meta de água: ${currentUser.waterGoal || 0}ml<br><br>
    ⚖️ Peso inicial: ${currentUser.initialWeight || 0}kg<br><br>
    🎯 Peso objetivo: ${currentUser.goalWeight || 0}kg
  `;

  loadLastWorkout();
}

function loadLastWorkout() {
  const box = document.getElementById("lastWorkoutInfo");

  if (!currentUser.history.length) {
    box.innerText = "Nenhum treino registrado ainda.";
    return;
  }

  const last = currentUser.history[currentUser.history.length - 1];

  box.innerHTML = `
    <strong>${last.type}</strong><br>
    ${last.date}
  `;
}

function createNewWorkout() {
  const name = prompt("Qual será o nome desse treino? Exemplo: Superiores, Yoga, Funcional");

  if (!name) return;

  currentUser.workouts.push({
    id: Date.now(),
    name,
    days: [],
    time: "",
    exercises: []
  });

  saveUser();
  loadWorkoutsList();
}

function loadWorkoutsList() {
  const container = document.getElementById("workoutsList");
  container.innerHTML = "";

  if (!currentUser.workouts.length) {
    container.innerHTML = `
      <div class="card empty-state">
        Nenhum treino cadastrado ainda. Toque em “Adicionar novo treino” para começar.
      </div>
    `;
    return;
  }

  currentUser.workouts.forEach(workout => {
    const card = document.createElement("div");
    card.className = "workout-config-card";

    card.innerHTML = `
      <h3>${workout.name}</h3>

      <label>Nome do treino</label>
      <input 
        value="${workout.name || ""}" 
        onchange="updateWorkoutName(${workout.id}, this.value)" 
      />

      <label>Dias desse treino</label>
      <div class="chips workout-days">
        ${weekDays.map((day, index) => `
          <button
            type="button"
            class="${workout.days.includes(index) ? "active" : ""}"
            onclick="toggleWorkoutDay(${workout.id}, ${index})"
          >
            ${day}
          </button>
        `).join("")}
      </div>

      <label>Horário desse treino</label>
      <input 
        type="time" 
        value="${workout.time || ""}" 
        onchange="updateWorkoutTime(${workout.id}, this.value)" 
      />

      <div class="workout-details">
        <strong>Dias:</strong> ${
          workout.days.length
            ? workout.days.map(day => weekDays[day]).join(", ")
            : "Nenhum dia selecionado"
        }<br>

        <strong>Horário:</strong> ${workout.time || "Não definido"}<br>

        <strong>Exercícios:</strong> ${workout.exercises.length}
      </div>

      <h4>Exercícios</h4>

      <div>
        ${workout.exercises.map((exercise, index) => `
          <div class="exercise-item">
            <label>Nome do exercício</label>
            <input 
              value="${exercise.name || ""}" 
              onchange="updateExercise(${workout.id}, ${index}, 'name', this.value)" 
            />

            <label>Peso</label>
            <input 
              type="number" 
              value="${exercise.weight || 0}" 
              onchange="updateExercise(${workout.id}, ${index}, 'weight', this.value)" 
            />

            <label>Séries</label>
            <input 
              type="number" 
              value="${exercise.sets || 0}" 
              onchange="updateExercise(${workout.id}, ${index}, 'sets', this.value)" 
            />

            <label>Repetições</label>
            <input 
              type="number" 
              value="${exercise.reps || 0}" 
              onchange="updateExercise(${workout.id}, ${index}, 'reps', this.value)" 
            />

            <label>Descanso em segundos</label>
            <input 
              type="number" 
              value="${exercise.rest || 0}" 
              onchange="updateExercise(${workout.id}, ${index}, 'rest', this.value)" 
            />

            <button class="secondary" onclick="removeExercise(${workout.id}, ${index})">
              Excluir exercício
            </button>
          </div>
        `).join("")}
      </div>

      <button class="secondary" onclick="addExerciseToWorkout(${workout.id})">
        Adicionar exercício
      </button>

      <button onclick="saveUserAndReloadWorkouts()">
        Salvar treino
      </button>

      <button class="secondary" onclick="removeWorkout(${workout.id})">
        Excluir treino
      </button>
    `;

    container.appendChild(card);
  });
}

function updateWorkoutName(workoutId, value) {
  const workout = findWorkout(workoutId);
  workout.name = value || "Treino";
  saveUser();
}

function updateWorkoutTime(workoutId, value) {
  const workout = findWorkout(workoutId);
  workout.time = value;
  saveUser();
}

function toggleWorkoutDay(workoutId, day) {
  const workout = findWorkout(workoutId);

  if (workout.days.includes(day)) {
    workout.days = workout.days.filter(item => item !== day);
  } else {
    workout.days.push(day);
  }

  saveUser();
  loadWorkoutsList();
}

function addExerciseToWorkout(workoutId) {
  const workout = findWorkout(workoutId);

  workout.exercises.push({
    name: "",
    weight: 0,
    sets: 3,
    reps: 12,
    rest: 60
  });

  saveUser();
  loadWorkoutsList();
}

function updateExercise(workoutId, exerciseIndex, field, value) {
  const workout = findWorkout(workoutId);

  workout.exercises[exerciseIndex][field] =
    ["weight", "sets", "reps", "rest"].includes(field)
      ? Number(value)
      : value;

  saveUser();
}

function removeExercise(workoutId, exerciseIndex) {
  const workout = findWorkout(workoutId);

  if (!confirm("Deseja excluir este exercício?")) return;

  workout.exercises.splice(exerciseIndex, 1);
  saveUser();
  loadWorkoutsList();
}

function removeWorkout(workoutId) {
  if (!confirm("Deseja excluir este treino?")) return;

  currentUser.workouts = currentUser.workouts.filter(workout => workout.id !== workoutId);

  saveUser();
  loadWorkoutsList();
}

function saveUserAndReloadWorkouts() {
  saveUser();
  alert("Treino salvo com sucesso 💪");
  loadWorkoutsList();
}

function findWorkout(workoutId) {
  return currentUser.workouts.find(workout => workout.id === workoutId);
}

function startWorkout() {
  const todayWorkout = getTodayWorkout();

  if (!todayWorkout) return;

  currentWorkout = todayWorkout;
  currentExerciseIndex = 0;
  currentSet = 1;

  if (!currentWorkout.exercises.length) {
    alert("Esse treino ainda não tem exercícios cadastrados.");
    return;
  }

  alert(`Treino iniciado: ${currentWorkout.name}`);
}

function registerExtraWorkout(type) {
  currentUser.history.push({
    type,
    date: new Date().toLocaleDateString("pt-BR")
  });

  saveUser();

  alert(`${type} registrado com sucesso.`);
  loadHome();
}

function loadHistory() {
  const container = document.getElementById("historyList");
  container.innerHTML = "";

  if (!currentUser.history.length) {
    container.innerHTML = "<p>Nenhum treino registrado ainda.</p>";
    return;
  }

  currentUser.history.slice().reverse().forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";

    div.innerHTML = `
      <strong>${item.type}</strong>
      <span>${item.date}</span>
    `;

    container.appendChild(div);
  });
}

function loadSettings() {
  document.getElementById("settingsName").value = currentUser.name || "";
  document.getElementById("settingsEmail").value = currentUser.email || "";
  document.getElementById("settingsWaterGoal").value = currentUser.waterGoal || "";
  document.getElementById("settingsInitialWeight").value = currentUser.initialWeight || "";
  document.getElementById("settingsGoalWeight").value = currentUser.goalWeight || "";
}

function saveSettings() {
  currentUser.name = document.getElementById("settingsName").value;
  currentUser.email = document.getElementById("settingsEmail").value;
  currentUser.waterGoal = document.getElementById("settingsWaterGoal").value;
  currentUser.initialWeight = document.getElementById("settingsInitialWeight").value;
  currentUser.goalWeight = document.getElementById("settingsGoalWeight").value;

  const password = document.getElementById("settingsPassword").value;

  if (password) {
    currentUser.password = password;
  }

  saveUser();
  saveSession();

  alert("Configurações atualizadas.");
  showHome();
}

function saveUser() {
  localStorage.setItem("miaufitUser", JSON.stringify(currentUser));
}

window.addEventListener("DOMContentLoaded", () => {
  loadSession();

  if (!localStorage.getItem("miaufitSession")) {
    modal.classList.add("active");
  }
});
