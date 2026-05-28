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
let restTimeout = null;
let openedExerciseKey = null;
let workoutCountedToday = false;

function hideAllScreens() {
  Object.values(screens).forEach(screen => {
    if (screen) {
      screen.classList.add("hidden");
    }
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
  stopRestTimer();
  hideAllScreens();
  screens.home.classList.remove("hidden");
  loadHome();
}

function showHistory() {
  stopRestTimer();
  hideAllScreens();
  screens.history.classList.remove("hidden");
  loadHistory();
}

function showSettings() {
  stopRestTimer();
  hideAllScreens();
  screens.settings.classList.remove("hidden");
  loadSettings();
}

function showExercisesSettings() {
  stopRestTimer();
  hideAllScreens();
  screens.exercisesSettings.classList.remove("hidden");
  loadWorkoutsList();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateKeyFromInput(dateValue) {
  return dateValue || getTodayKey();
}

function formatDateFromKey(dateKey) {
  if (!dateKey) return getTodayDisplayDate();

  const [year, month, day] = dateKey.split("-");

  if (!year || !month || !day) {
    return dateKey;
  }

  return `${day}/${month}/${year}`;
}

function getTodayDisplayDate() {
  return new Date().toLocaleDateString("pt-BR");
}

function normalizeUserData(user) {
  if (!user) return null;

  if (!user.history) {
    user.history = [];
  }

  if (!user.loadProgress) {
    user.loadProgress = [];
  }

  if (!user.workouts) {
    user.workouts = [];
  }

  if (!user.trainingDaysGoal) {
    user.trainingDaysGoal = "";
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

  user.history = user.history.map(item => {
    const fallbackDateKey = item.dateKey || item.date || getTodayKey();

    return {
      id: item.id || Date.now() + Math.floor(Math.random() * 1000),
      type: item.type || "Treino",
      date: item.date || getTodayDisplayDate(),
      dateKey: item.dateKey || fallbackDateKey,
      status: item.status || "Treino registrado",
      note: item.note || "",
      countsForGoal: item.countsForGoal !== false,
      completed: Boolean(item.completed),
      seriesCompleted: item.seriesCompleted || 0
    };
  });

  user.loadProgress = user.loadProgress.map(item => ({
    id: item.id || Date.now() + Math.floor(Math.random() * 1000),
    date: item.date || getTodayDisplayDate(),
    dateKey: item.dateKey || getTodayKey(),
    workoutName: item.workoutName || "Treino",
    exerciseName: item.exerciseName || "Exercício",
    previousWeight: Number(item.previousWeight) || 0,
    newWeight: Number(item.newWeight) || 0
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
    modal.classList.remove("active");
    showHome();
    return;
  }

  modal.classList.add("active");
}

function logout() {
  currentUser = null;
  localStorage.removeItem("miaufitSession");
  stopRestTimer();
  hideAllScreens();
  modal.classList.add("active");
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
  const trainingDaysGoal = document.getElementById("trainingDaysGoal")?.value || "";

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
    trainingDaysGoal,
    workouts: [],
    history: [],
    loadProgress: []
  };

  saveUser();
  saveSession();

  alert("Conta criada com sucesso 💪");
  showHome();
}

function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

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

function getCountedWorkoutDates() {
  if (!currentUser || !Array.isArray(currentUser.history)) {
    return [];
  }

  const uniqueDates = new Set();

  currentUser.history.forEach(item => {
    if (item.countsForGoal !== false && item.dateKey) {
      uniqueDates.add(item.dateKey);
    }
  });

  return Array.from(uniqueDates);
}

function hasWorkoutRegisteredOnDate(dateKey) {
  return currentUser.history.some(item =>
    item.dateKey === dateKey && item.countsForGoal !== false
  );
}

function hasWorkoutRegisteredToday() {
  return hasWorkoutRegisteredOnDate(getTodayKey());
}

function findHistoryItemByDate(dateKey) {
  return currentUser.history.find(item =>
    item.dateKey === dateKey && item.countsForGoal !== false
  );
}

function findTodayHistoryItem() {
  return findHistoryItemByDate(getTodayKey());
}

function registerWorkoutDayOnce(type, status = "Treino contabilizado", completed = false, dateKey = getTodayKey(), note = "") {
  if (!currentUser) return false;

  const existingItem = findHistoryItemByDate(dateKey);

  if (existingItem) {
    existingItem.type = existingItem.type || type;
    existingItem.status = completed ? "Treino concluído" : existingItem.status;
    existingItem.completed = existingItem.completed || completed;
    existingItem.seriesCompleted = Math.max(existingItem.seriesCompleted || 0, 1);

    if (note && !existingItem.note) {
      existingItem.note = note;
    }

    saveUser();
    return false;
  }

  currentUser.history.push({
    id: Date.now(),
    type,
    date: formatDateFromKey(dateKey),
    dateKey,
    status,
    note,
    countsForGoal: true,
    completed,
    seriesCompleted: 1
  });

  saveUser();
  return true;
}

function loadHome() {
  if (!currentUser) return;

  const greeting = document.getElementById("homeGreeting");
  const todayWorkoutName = document.getElementById("todayWorkoutName");
  const todayWorkoutSchedule = document.getElementById("todayWorkoutSchedule");
  const startButton = document.getElementById("startWorkoutButton");
  const restActions = document.getElementById("restDayActions");
  const homeGoalsInfo = document.getElementById("homeGoalsInfo");

  greeting.innerText = `Oi, ${currentUser.name || "miau"} 🐾`;

  const todayWorkout = getTodayWorkout();

  if (todayWorkout) {
    todayWorkoutName.innerText = todayWorkout.name || "Treino";
    todayWorkoutSchedule.innerText = `Horário: ${todayWorkout.time || "Não definido"}`;

    startButton.disabled = false;
    startButton.innerText = "Iniciar treino do dia";

    restActions.classList.add("hidden");
  } else {
    todayWorkoutName.innerText = "Hoje é dia de descanso 🧘";
    todayWorkoutSchedule.innerText = "Nenhum treino cadastrado para hoje.";

    startButton.disabled = true;
    startButton.innerText = "Sem treino programado hoje";

    restActions.classList.remove("hidden");
  }

  homeGoalsInfo.innerHTML = `
    💧 Meta de água: ${currentUser.waterGoal || 0}ml<br><br>
    ⚖️ Peso inicial: ${currentUser.initialWeight || 0}kg<br><br>
    🎯 Peso objetivo: ${currentUser.goalWeight || 0}kg
  `;

  loadTrainingGoalInfo();
  loadLastWorkout();
}

function loadTrainingGoalInfo() {
  const goalInfo = document.getElementById("trainingGoalInfo");
  const progressBar = document.getElementById("trainingGoalProgressBar");

  if (!goalInfo || !progressBar) return;

  const goal = Number(currentUser.trainingDaysGoal) || 0;
  const done = getCountedWorkoutDates().length;
  const percentage = goal > 0 ? Math.min((done / goal) * 100, 100) : 0;

  if (!goal) {
    goalInfo.innerHTML = `
      Você ainda não definiu uma meta de dias de treino.
      <br>
      Vá em <strong>Conta</strong> para configurar.
    `;

    progressBar.style.width = "0%";
    return;
  }

  const remaining = Math.max(goal - done, 0);

  goalInfo.innerHTML = `
    Você fez <strong>${done}</strong> de <strong>${goal}</strong> treinos.
    <br>
    ${
      remaining > 0
        ? `Faltam <strong>${remaining}</strong> para bater sua meta.`
        : "Meta batida. Miau, que orgulho! 🐾"
    }
  `;

  progressBar.style.width = `${percentage}%`;
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
    ${last.date || ""}<br>
    <span>${last.status || "Treino registrado"}</span>
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
        oninput="updateWorkoutName(${workout.id}, this.value)" 
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
        oninput="updateWorkoutTime(${workout.id}, this.value)" 
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
        ${workout.exercises.map((exercise, index) => {
          const exerciseKey = `${workout.id}-${index}`;
          const isOpen = openedExerciseKey === exerciseKey;

          return `
            <div
              class="exercise-item"
              data-exercise-box="${exerciseKey}"
            >
              <div
                class="exercise-summary"
                onclick="openExerciseForm(event, '${exerciseKey}')"
              >
                <strong>${exercise.name || "Exercício sem nome"}</strong>
                <span>
                  ${exercise.sets || 0} séries ·
                  ${exercise.reps || 0} repetições ·
                  ${exercise.weight || 0}kg ·
                  descanso de ${exercise.rest || 0}s
                </span>
              </div>

              <div
                class="exercise-form ${isOpen ? "" : "collapsed"}"
                id="exerciseForm-${exerciseKey}"
                onclick="event.stopPropagation()"
              >
                <label>Nome do exercício</label>
                <input
                  value="${exercise.name || ""}"
                  oninput="updateExercise(${workout.id}, ${index}, 'name', this.value)"
                />

                <label>Peso usado</label>
                <div class="weight-field">
                  <input
                    type="number"
                    value="${exercise.weight || 0}"
                    oninput="updateExerciseWeight(${workout.id}, ${index}, this.value)"
                  />
                  <span class="weight-suffix">kg</span>
                </div>

                <p
                  class="weight-preview"
                  id="weightPreview-${exerciseKey}"
                >
                  Peso atual:
                  <strong>${exercise.weight || 0}kg</strong>
                </p>

                <label>Séries</label>
                <input
                  type="number"
                  value="${exercise.sets || 0}"
                  oninput="updateExercise(${workout.id}, ${index}, 'sets', this.value)"
                />

                <label>Repetições</label>
                <input
                  type="number"
                  value="${exercise.reps || 0}"
                  oninput="updateExercise(${workout.id}, ${index}, 'reps', this.value)"
                />

                <label>Descanso em segundos</label>
                <input
                  type="number"
                  value="${exercise.rest || 0}"
                  oninput="updateExercise(${workout.id}, ${index}, 'rest', this.value)"
                />

                <button
                  class="secondary"
                  onclick="removeExercise(${workout.id}, ${index})"
                >
                  Excluir exercício
                </button>
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <button
        class="secondary"
        onclick="addExerciseToWorkout(${workout.id})"
      >
        Adicionar outro exercício
      </button>

      <button onclick="saveUserAndReloadWorkouts(true)">
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
  if (!currentUser || !Array.isArray(currentUser.workouts)) return null;

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

function openExerciseForm(event, exerciseKey) {
  if (event) {
    event.stopPropagation();
  }

  openedExerciseKey =
    openedExerciseKey === exerciseKey
      ? null
      : exerciseKey;

  loadWorkoutsList();
}

document.addEventListener("click", event => {
  if (
    !screens.exercisesSettings ||
    screens.exercisesSettings.classList.contains("hidden")
  ) {
    return;
  }

  if (!openedExerciseKey) {
    return;
  }

  const openedBox = document.querySelector(
    `[data-exercise-box="${openedExerciseKey}"]`
  );

  if (!openedBox) {
    openedExerciseKey = null;
    return;
  }

  const clickedInsideOpenedBox = openedBox.contains(event.target);

  if (!clickedInsideOpenedBox) {
    openedExerciseKey = null;
    loadWorkoutsList();
  }
});

function addExerciseToWorkout(workoutId) {
  const workout = findWorkout(workoutId);

  if (!workout) return;

  saveUser();

  workout.exercises.push({
    name: "",
    weight: 0,
    sets: 3,
    reps: 12,
    rest: 60
  });

  const lastIndex = workout.exercises.length - 1;
  openedExerciseKey = `${workoutId}-${lastIndex}`;

  saveUser();
  loadWorkoutsList();

  setTimeout(() => {
    const form = document.getElementById(`exerciseForm-${openedExerciseKey}`);

    if (form) {
      form.classList.remove("collapsed");
      form.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }, 100);
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

function updateExerciseWeight(workoutId, exerciseIndex, value) {
  const workout = findWorkout(workoutId);

  if (!workout || !workout.exercises[exerciseIndex]) return;

  const exercise = workout.exercises[exerciseIndex];
  const previousWeight = Number(exercise.weight) || 0;
  const numericValue = Number(value) || 0;

  exercise.weight = numericValue;

  if (numericValue > previousWeight) {
    registerLoadProgress(
      workout.name || "Treino",
      exercise.name || "Exercício sem nome",
      previousWeight,
      numericValue
    );
  }

  const exerciseKey = `${workoutId}-${exerciseIndex}`;
  const preview = document.getElementById(`weightPreview-${exerciseKey}`);

  if (preview) {
    preview.innerHTML = `
      Peso atual:
      <strong>${numericValue}kg</strong>
    `;
  }

  saveUser();
}

function registerLoadProgress(workoutName, exerciseName, previousWeight, newWeight) {
  if (!currentUser.loadProgress) {
    currentUser.loadProgress = [];
  }

  currentUser.loadProgress.push({
    id: Date.now() + Math.floor(Math.random() * 1000),
    date: getTodayDisplayDate(),
    dateKey: getTodayKey(),
    workoutName,
    exerciseName,
    previousWeight,
    newWeight
  });
}

function removeExercise(workoutId, exerciseIndex) {
  const workout = findWorkout(workoutId);

  if (!workout) return;

  if (!confirm("Deseja excluir este exercício?")) return;

  workout.exercises.splice(exerciseIndex, 1);

  openedExerciseKey = null;

  saveUser();
  loadWorkoutsList();
}

function removeWorkout(workoutId) {
  if (!confirm("Deseja excluir este treino?")) return;

  currentUser.workouts = currentUser.workouts.filter(
    workout => Number(workout.id) !== Number(workoutId)
  );

  openedExerciseKey = null;

  saveUser();
  loadWorkoutsList();
}

function saveUserAndReloadWorkouts(showAlert = true) {
  saveUser();

  if (showAlert) {
    alert("Treino salvo com sucesso 💪");
  }

  openedExerciseKey = null;

  loadWorkoutsList();
}

function startWorkout() {
  const todayWorkout = getTodayWorkout();

  if (!todayWorkout) return;

  currentWorkout = todayWorkout;
  currentExerciseIndex = 0;
  currentSet = 1;
  workoutCountedToday = hasWorkoutRegisteredToday();

  if (!currentWorkout.exercises.length) {
    alert("Esse treino ainda não tem exercícios cadastrados.");
    return;
  }

  openExercise();
}

function openExercise() {
  stopRestTimer();
  hideAllScreens();

  if (screens.workout) {
    screens.workout.classList.remove("hidden");
  }

  const exercise = currentWorkout.exercises[currentExerciseIndex];

  document.getElementById("currentWorkoutName").innerText =
    currentWorkout.name || "Treino";

  document.getElementById("currentExerciseName").innerText =
    exercise.name || "Exercício";

  document.getElementById("currentSet").innerText =
    `${currentSet}/${exercise.sets || 0}`;

  document.getElementById("currentReps").innerText =
    exercise.reps || 0;

  document.getElementById("currentWeight").innerText =
    `${exercise.weight || 0}kg`;

  document.getElementById("exerciseVideo").href =
    "https://youtube.com";
}

function pauseSet() {
  const reps = prompt("Quantas repetições você fez até agora?");

  if (reps) {
    alert(`Série pausada com ${reps} repetições registradas.`);
  }
}

function finishSet() {
  if (!currentWorkout) return;

  registerFirstSeriesIfNeeded();

  const exercise = currentWorkout.exercises[currentExerciseIndex];

  startRest(exercise.rest || 0);
}

function registerFirstSeriesIfNeeded() {
  if (workoutCountedToday) return;

  registerWorkoutDayOnce(
    currentWorkout.name || "Treino",
    "Treino contabilizado a partir da primeira série",
    false
  );

  workoutCountedToday = true;
}

function startRest(seconds) {
  stopRestTimer();
  hideAllScreens();

  if (screens.rest) {
    screens.rest.classList.remove("hidden");
  }

  const timer = document.getElementById("restTimer");
  const restScreen = document.getElementById("restScreen");

  if (restScreen) {
    restScreen.classList.remove("finished");
  }

  let remaining = Number(seconds) || 0;

  timer.innerText = remaining;

  if (remaining <= 0) {
    timer.innerText = "Fim do descanso!";

    restTimeout = setTimeout(() => {
      goNext();
    }, 800);

    return;
  }

  restInterval = setInterval(() => {
    remaining--;

    timer.innerText = remaining;

    if (remaining <= 0) {
      stopRestTimer(false);

      if (restScreen) {
        restScreen.classList.add("finished");
      }

      timer.innerText = "Fim do descanso!";

      restTimeout = setTimeout(() => {
        if (restScreen) {
          restScreen.classList.remove("finished");
        }

        goNext();
      }, 1200);
    }
  }, 1000);
}

function stopRestTimer(removeFinishedClass = true) {
  if (restInterval) {
    clearInterval(restInterval);
    restInterval = null;
  }

  if (restTimeout) {
    clearTimeout(restTimeout);
    restTimeout = null;
  }

  if (removeFinishedClass) {
    const restScreen = document.getElementById("restScreen");

    if (restScreen) {
      restScreen.classList.remove("finished");
    }
  }
}

function goNext() {
  stopRestTimer();

  if (!currentWorkout) {
    showHome();
    return;
  }

  const exercise = currentWorkout.exercises[currentExerciseIndex];

  if (!exercise) {
    finishWorkout();
    return;
  }

  const totalSets = Number(exercise.sets) || 1;

  if (currentSet < totalSets) {
    currentSet++;
    openExercise();
    return;
  }

  currentExerciseIndex++;
  currentSet = 1;

  if (currentExerciseIndex >= currentWorkout.exercises.length) {
    finishWorkout();
    return;
  }

  const confirmChange = confirm("Deseja ir para o próximo exercício?");

  if (!confirmChange) {
    openExercise();
    return;
  }

  openExercise();
}

function finishWorkout() {
  stopRestTimer();

  if (!currentWorkout) {
    showHome();
    return;
  }

  registerWorkoutDayOnce(
    currentWorkout.name || "Treino",
    "Treino concluído",
    true
  );

  const todayItem = findTodayHistoryItem();

  if (todayItem) {
    todayItem.completed = true;
    todayItem.status = "Treino concluído";
    todayItem.type = currentWorkout.name || todayItem.type;
  }

  saveUser();

  currentWorkout = null;
  currentExerciseIndex = 0;
  currentSet = 1;
  workoutCountedToday = false;

  alert("Treino concluído 💪");
  showHome();
}

function finishWorkoutEarly() {
  stopRestTimer();

  if (currentWorkout) {
    registerWorkoutDayOnce(
      currentWorkout.name || "Treino",
      "Treino registrado parcialmente",
      false
    );
  }

  currentWorkout = null;
  currentExerciseIndex = 0;
  currentSet = 1;
  workoutCountedToday = false;

  alert("Treino registrado. Você já fez o mais importante: começou 💪");
  showHome();
}

function registerExtraWorkout(type) {
  if (hasWorkoutRegisteredToday()) {
    alert("Hoje já existe um treino registrado. Para manter a meta justa, só contabilizamos um treino por dia.");
    return;
  }

  currentUser.history.push({
    id: Date.now(),
    type,
    date: getTodayDisplayDate(),
    dateKey: getTodayKey(),
    status: "Treino registrado manualmente",
    countsForGoal: true,
    completed: true,
    seriesCompleted: 1,
    note: ""
  });

  saveUser();

  alert(`${type} registrado com sucesso.`);
  loadHome();
}

function registerPastWorkout() {
  const dateInput = document.getElementById("pastWorkoutDate");
  const typeInput = document.getElementById("pastWorkoutType");
  const noteInput = document.getElementById("pastWorkoutNote");

  const dateKey = getDateKeyFromInput(dateInput.value);
  const type = typeInput.value.trim() || "Treino anterior";
  const note = noteInput.value.trim();

  if (!dateKey) {
    alert("Informe a data do treino.");
    return;
  }

  if (hasWorkoutRegisteredOnDate(dateKey)) {
    alert("Já existe um treino registrado nessa data. Para manter a meta justa, só contabilizamos um treino por dia.");
    return;
  }

  currentUser.history.push({
    id: Date.now(),
    type,
    date: formatDateFromKey(dateKey),
    dateKey,
    status: "Treino anterior registrado manualmente",
    countsForGoal: true,
    completed: true,
    seriesCompleted: 1,
    note
  });

  saveUser();

  dateInput.value = "";
  typeInput.value = "";
  noteInput.value = "";

  alert("Treino anterior registrado com sucesso 💪");
  loadHistory();
}

function loadHistory() {
  const container = document.getElementById("historyList");

  if (!container || !currentUser) return;

  container.innerHTML = "";

  loadLoadProgressList();

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
      <br>
      <span>${item.status || "Treino registrado"}</span>
      ${
        item.note
          ? `<br><span>📝 ${item.note}</span>`
          : ""
      }
    `;

    container.appendChild(div);
  });
}

function loadLoadProgressList() {
  const container = document.getElementById("loadProgressList");

  if (!container || !currentUser) return;

  container.innerHTML = "";

  if (!currentUser.loadProgress || !currentUser.loadProgress.length) {
    return;
  }

  currentUser.loadProgress
    .slice()
    .reverse()
    .forEach(item => {
      const div = document.createElement("div");
      div.className = "load-progress-item";

      div.innerHTML = `
        <strong>${item.exerciseName || "Exercício"}</strong>
        <span>
          ${item.previousWeight || 0}kg → ${item.newWeight || 0}kg
        </span>
        <small>
          ${item.workoutName || "Treino"} · ${item.date || ""}
        </small>
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

  const goalInput = document.getElementById("settingsTrainingDaysGoal");

  if (goalInput) {
    goalInput.value = currentUser.trainingDaysGoal || "";
  }
}

function saveSettings() {
  currentUser.name = document.getElementById("settingsName").value;
  currentUser.email = document.getElementById("settingsEmail").value;
  currentUser.waterGoal = document.getElementById("settingsWaterGoal").value;
  currentUser.initialWeight = document.getElementById("settingsInitialWeight").value;
  currentUser.goalWeight = document.getElementById("settingsGoalWeight").value;

  const goalInput = document.getElementById("settingsTrainingDaysGoal");

  if (goalInput) {
    currentUser.trainingDaysGoal = goalInput.value;
  }

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
