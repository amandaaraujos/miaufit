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
  if (modal) modal.classList.remove("active");
  hideAllScreens();
  if (screens.login) screens.login.classList.remove("hidden");
}

function showRegister() {
  if (modal) modal.classList.remove("active");
  hideAllScreens();
  if (screens.register) screens.register.classList.remove("hidden");
}

function showHome() {
  hideAllScreens();
  if (screens.home) screens.home.classList.remove("hidden");
  loadHome();
}

function showHistory() {
  hideAllScreens();
  if (screens.history) screens.history.classList.remove("hidden");
  loadHistory();
}

function showSettings() {
  hideAllScreens();
  if (screens.settings) screens.settings.classList.remove("hidden");
  loadSettings();
}

function showExercisesSettings() {
  hideAllScreens();
  if (screens.exercisesSettings) screens.exercisesSettings.classList.remove("hidden");
  loadWorkoutsList();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeUserData(user) {
  if (!user) return null;

  if (!user.history) {
    user.history = [];
  }

  if (!user.workouts) {
    user.workouts = [];
  }

  if (!Array.isArray(user.workouts)) {
    user.workouts = Object.keys(user.workouts).map(key => {
      const oldWorkout = user.workouts[key];

      if (Array.isArray(oldWorkout)) {
        return {
          id: Date.now() + Math.floor(Math.random() * 1000),
          name: key,
          days: user.trainingDays || [],
          time: user.reminderTime || "",
          exercises: oldWorkout
        };
      }

      return {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: oldWorkout.name || key,
        days: oldWorkout.days || user.trainingDays || [],
        time: oldWorkout.time || user.reminderTime || "",
        exercises: oldWorkout.exercises || []
      };
    });
  }

  user.workouts = user.workouts.map(workout => ({
    id: workout.id || Date.now() + Math.floor(Math.random() * 1000),
    name: workout.name || "Treino",
    days: Array.isArray(workout.days) ? workout.days : [],
    time: workout.time || "",
    exercises: Array.isArray(workout.exercises) ? workout.exercises : []
  }));

  return user;
}

function saveUser() {
  currentUser = normalizeUserData(currentUser);
  localStorage.setItem("miaufitUser", JSON.stringify(currentUser));
}

function saveSession() {
  if (!currentUser) return;

  localStorage.setItem("miaufitSession", JSON.stringify({
    email: currentUser.email,
    logged: true
  }));
}

function loadSession() {
  const session = JSON.parse(localStorage.getItem("miaufitSession"));
  let user = JSON.parse(localStorage.getItem("miaufitUser"));

  user = normalizeUserData(user);

  if (user) {
    localStorage.setItem("miaufitUser", JSON.stringify(user));
  }

  if (session?.logged && user && session.email === user.email) {
    currentUser = user;

    if (modal) modal.classList.remove("active");

    showHome();
    return;
  }

  if (modal) modal.classList.add("active");
}

function logout() {
  currentUser = null;
  localStorage.removeItem("miaufitSession");

  hideAllScreens();

  if (modal) modal.classList.add("active");
}

function createAccount() {
  const name = document.getElementById("registerName")?.value.trim();
  const email = document.getElementById("registerEmail")?.value.trim();
  const password = document.getElementById("registerPassword")?.value;
  const confirmPassword = document.getElementById("registerConfirmPassword")?.value;
  const knowledgeLevel = document.getElementById("knowledgeLevel")?.value;
  const waterGoal = document.getElementById("waterGoal")?.value;
  const initialWeight = document.getElementById("initialWeight")?.value;
  const goalWeight = document.getElementById("goalWeight")?.value;

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

  saveUser();
  saveSession();

  alert("Conta criada com sucesso 💪");
  showHome();
}

function login() {
  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value;

  let user = JSON.parse(localStorage.getItem("miaufitUser"));
  user = normalizeUserData(user);

  if (!user) {
    alert("Nenhuma conta encontrada.");
    return;
  }

  if (user.email !== email || user.password !== password) {
    alert("E-mail ou senha incorretos.");
    return;
  }

  currentUser = user;

  saveUser();
  saveSession();

  showHome();
}

function getTodayWorkout() {
  if (!currentUser || !Array.isArray(currentUser.workouts)) {
    return null;
  }

  const today = new Date().getDay();

  return currentUser.workouts.find(workout =>
    Array.isArray(workout.days) && workout.days.includes(today)
  ) || null;
}

function loadHome() {
  if (!currentUser) return;

  const greeting = document.getElementById("homeGreeting");
  const todayWorkoutName = document.getElementById("todayWorkoutName");
  const todayWorkoutSchedule = document.getElementById("todayWorkoutSchedule");
  const startButton = document.getElementById("startWorkoutButton");
  const restActions = document.getElementById("restDayActions");
  const homeGoalsInfo = document.getElementById("homeGoalsInfo");

  if (greeting) {
    greeting.innerText = `Oi, ${currentUser.name || "miau"} 🐾`;
  }

  const todayWorkout = getTodayWorkout();

  if (todayWorkout) {
    if (todayWorkoutName) {
      todayWorkoutName.innerText = todayWorkout.name || "Treino";
    }

    if (todayWorkoutSchedule) {
      todayWorkoutSchedule.innerText = `Horário: ${todayWorkout.time || "Não definido"}`;
    }

    if (startButton) {
      startButton.disabled = false;
      startButton.innerText = "Iniciar treino do dia";
    }

    if (restActions) {
      restActions.classList.add("hidden");
    }
  } else {
    if (todayWorkoutName) {
      todayWorkoutName.innerText = "Hoje é dia de descanso 🧘";
    }

    if (todayWorkoutSchedule) {
      todayWorkoutSchedule.innerText = "Nenhum treino cadastrado para hoje.";
    }

    if (startButton) {
      startButton.disabled = true;
      startButton.innerText = "Sem treino programado hoje";
    }

    if (restActions) {
      restActions.classList.remove("hidden");
    }
  }

  if (homeGoalsInfo) {
    homeGoalsInfo.innerHTML = `
      💧 Meta de água: ${currentUser.waterGoal || 0}ml<br><br>
      ⚖️ Peso inicial: ${currentUser.initialWeight || 0}kg<br><br>
      🎯 Peso objetivo: ${currentUser.goalWeight || 0}kg
    `;
  }

  loadLastWorkout();
}

function loadLastWorkout() {
  const box = document.getElementById("lastWorkoutInfo");

  if (!box || !currentUser) return;

  if (!currentUser.history || !currentUser.history.length) {
    box.innerText = "Nenhum treino registrado ainda.";
    return;
  }

  const last = currentUser.history[currentUser.history.length - 1];

  box.innerHTML = `
    <strong>${last.type || "Treino"}</strong><br>
    ${last.date || ""}
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

  if (!container || !currentUser) return;

  currentUser = normalizeUserData(currentUser);

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
      <h3>${workout.name || "Treino"}</h3>

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

function findWorkout(workoutId) {
  return currentUser.workouts.find(workout => Number(workout.id) === Number(workoutId));
}

function updateWorkoutName(workoutId, value) {
  const workout = findWorkout(workoutId);
  if (!workout) return;

  workout.name = value || "Treino";

  saveUser();
}

function updateWorkoutTime(workoutId, value) {
  const workout = findWorkout(workoutId);
  if (!workout) return;

  workout.time = value;

  saveUser();
}

function toggleWorkoutDay(workoutId, day) {
  const workout = findWorkout(workoutId);

  if (!workout) return;

  if (!Array.isArray(workout.days)) {
    workout.days = [];
  }

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

  if (!workout) return;

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

  if (!workout || !workout.exercises[exerciseIndex]) return;

  workout.exercises[exerciseIndex][field] =
    ["weight", "sets", "reps", "rest"].includes(field)
      ? Number(value)
      : value;

  saveUser();
}

function removeExercise(workoutId, exerciseIndex) {
  const workout = findWorkout(workoutId);

  if (!workout) return;

  if (!confirm("Deseja excluir este exercício?")) return;

  workout.exercises.splice(exerciseIndex, 1);

  saveUser();
  loadWorkoutsList();
}

function removeWorkout(workoutId) {
  if (!confirm("Deseja excluir este treino?")) return;

  currentUser.workouts = currentUser.workouts.filter(workout => Number(workout.id) !== Number(workoutId));

  saveUser();
  loadWorkoutsList();
}

function saveUserAndReloadWorkouts() {
  saveUser();
  alert("Treino salvo com sucesso 💪");
  loadWorkoutsList();
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

  if (!container || !currentUser) return;

  container.innerHTML = "";

  if (!currentUser.history || !currentUser.history.length) {
    container.innerHTML = "<p>Nenhum treino registrado ainda.</p>";
    return;
  }

  currentUser.history.slice().reverse().forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";

    div.innerHTML = `
      <strong>${item.type || "Treino"}</strong>
      <span>${item.date || ""}</span>
    `;

    container.appendChild(div);
  });
}

function loadSettings() {
  if (!currentUser) return;

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

window.addEventListener("DOMContentLoaded", () => {
  try {
    loadSession();

    if (!localStorage.getItem("miaufitSession")) {
      modal.classList.add("active");
    }
  } catch (error) {
    console.error("Erro ao carregar o MiauFit:", error);

    localStorage.removeItem("miaufitSession");

    if (modal) {
      modal.classList.add("active");
    }
  }
});
