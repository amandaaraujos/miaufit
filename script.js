const screens = {
  login: document.getElementById("loginScreen"),
  register: document.getElementById("registerScreen"),
  home: document.getElementById("homeScreen"),
  workout: document.getElementById("workoutScreen"),
  history: document.getElementById("historyScreen"),
  settings: document.getElementById("settingsScreen"),
  rest: document.getElementById("restScreen"),
  exercisesSettings: document.getElementById("exercisesSettingsScreen")
};

const modal = document.getElementById("welcomeModal");

let currentUser = null;

let selectedDays = [];

let currentWorkoutExercises = [];
let currentWorkoutName = "";

let currentExerciseIndex = 0;
let currentSet = 1;

let restInterval = null;

function hideAllScreens() {
  Object.values(screens).forEach(screen => {
    screen.classList.add("hidden");
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

  loadWorkoutExercisesByFilter();
}

document.querySelectorAll("#trainingDays button").forEach(button => {
  button.addEventListener("click", () => {
    const day = Number(button.dataset.day);

    if (selectedDays.includes(day)) {
      selectedDays = selectedDays.filter(d => d !== day);

      button.classList.remove("active");
    } else {
      selectedDays.push(day);

      button.classList.add("active");
    }
  });
});

document
  .getElementById("trainingType")
  .addEventListener("change", e => {
    const muscleBox =
      document.getElementById("muscleGroupBox");

    if (e.target.value === "Musculação") {
      muscleBox.classList.remove("hidden");
    } else {
      muscleBox.classList.add("hidden");
    }
  });

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getWorkoutKey() {
  const trainingType =
    document.getElementById("trainingType").value;

  const muscleGroup =
    document.getElementById("muscleGroup").value;

  if (
    trainingType === "Musculação" &&
    muscleGroup
  ) {
    return muscleGroup;
  }

  return trainingType;
}

function addExercise() {
  const container =
    document.getElementById("exerciseList");

  const div = document.createElement("div");

  div.className = "exercise-item";

  div.innerHTML = `
    <h4>Novo exercício</h4>

    <input class="exercise-name" placeholder="Nome do exercício" />

    <input class="exercise-weight" type="number" placeholder="Peso utilizado em kg" />

    <input class="exercise-sets" type="number" placeholder="Quantidade de séries" />

    <input class="exercise-reps" type="number" placeholder="Quantidade de repetições" />

    <input class="exercise-rest" type="number" placeholder="Descanso em segundos" />
  `;

  container.appendChild(div);
}

function createAccount() {
  const name =
    document.getElementById("registerName").value.trim();

  const email =
    document.getElementById("registerEmail").value.trim();

  const password =
    document.getElementById("registerPassword").value;

  const confirmPassword =
    document.getElementById(
      "registerConfirmPassword"
    ).value;

  const trainingType =
    document.getElementById("trainingType").value;

  const knowledgeLevel =
    document.getElementById("knowledgeLevel").value;

  const reminderTime =
    document.getElementById("reminderTime").value;

  const waterGoal =
    document.getElementById("waterGoal").value;

  const initialWeight =
    document.getElementById("initialWeight").value;

  const goalWeight =
    document.getElementById("goalWeight").value;

  const muscleGroup =
    document.getElementById("muscleGroup").value;

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

  const workoutKey = getWorkoutKey();

  const exercises = [];

  document.querySelectorAll(".exercise-item").forEach(item => {
    exercises.push({
      name:
        item.querySelector(".exercise-name").value,

      weight:
        item.querySelector(".exercise-weight").value,

      sets: Number(
        item.querySelector(".exercise-sets").value
      ),

      reps: Number(
        item.querySelector(".exercise-reps").value
      ),

      rest: Number(
        item.querySelector(".exercise-rest").value
      )
    });
  });

  const user = {
    name,
    email,
    password,
    trainingDays: selectedDays,
    trainingType,
    knowledgeLevel,
    reminderTime,
    waterGoal,
    initialWeight,
    goalWeight,
    muscleGroup,

    workouts: {
      [workoutKey]: exercises
    },

    history: []
  };

  localStorage.setItem(
    "miaufitUser",
    JSON.stringify(user)
  );

  alert("Conta criada com sucesso 💪");

  showLogin();
}

function login() {
  const email =
    document.getElementById("loginEmail").value;

  const password =
    document.getElementById("loginPassword").value;

  const user =
    JSON.parse(localStorage.getItem("miaufitUser"));

  if (!user) {
    alert("Nenhuma conta encontrada.");

    return;
  }

  if (
    user.email !== email ||
    user.password !== password
  ) {
    alert("E-mail ou senha incorretos.");

    return;
  }

  currentUser = user;

  saveSession();

  scheduleReminder();

  showHome();
}

function saveSession() {
  localStorage.setItem(
    "miaufitSession",
    JSON.stringify({
      email: currentUser.email,
      logged: true
    })
  );
}

function loadSession() {
  const session =
    JSON.parse(localStorage.getItem("miaufitSession"));

  const user =
    JSON.parse(localStorage.getItem("miaufitUser"));

  if (
    session &&
    session.logged &&
    user &&
    session.email === user.email
  ) {
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
  const greeting =
    document.getElementById("homeGreeting");

  const todayWorkoutName =
    document.getElementById("todayWorkoutName");

  const restActions =
    document.getElementById("restDayActions");

  const startButton =
    document.getElementById("startWorkoutButton");

  const homeGoalsInfo =
    document.getElementById("homeGoalsInfo");

  greeting.innerText =
    `Oi, ${currentUser.name} 🐾`;

  const today = new Date().getDay();

  const isTrainingDay =
    currentUser.trainingDays.includes(today);

  let workoutName = currentUser.trainingType;

  if (
    currentUser.trainingType === "Musculação" &&
    currentUser.muscleGroup
  ) {
    workoutName =
      `Treino de ${currentUser.muscleGroup}`;
  }

  if (isTrainingDay) {
    todayWorkoutName.innerText = workoutName;

    startButton.disabled = false;

    startButton.innerText =
      "Iniciar treino do dia";

    restActions.classList.add("hidden");
  } else {
    todayWorkoutName.innerText =
      "Hoje é dia de descanso 🧘";

    startButton.disabled = true;

    startButton.innerText =
      "Sem treino programado hoje";

    restActions.classList.remove("hidden");
  }

  homeGoalsInfo.innerHTML = `
    💧 Meta de água: ${currentUser.waterGoal || 0}ml <br>
    ⚖️ Peso inicial: ${currentUser.initialWeight || 0}kg <br>
    🎯 Peso objetivo: ${currentUser.goalWeight || 0}kg
  `;

  loadLastWorkout();
}

function loadLastWorkout() {
  const lastWorkoutInfo =
    document.getElementById("lastWorkoutInfo");

  if (!currentUser.history.length) {
    lastWorkoutInfo.innerText =
      "Você ainda não registrou treinos.";

    return;
  }

  const last =
    currentUser.history[
      currentUser.history.length - 1
    ];

  lastWorkoutInfo.innerHTML = `
    <strong>${last.type}</strong><br>
    ${last.date}
  `;
}

function getTodayWorkoutName() {
  if (
    currentUser.trainingType === "Musculação" &&
    currentUser.muscleGroup
  ) {
    return currentUser.muscleGroup;
  }

  return currentUser.trainingType;
}

function startWorkout() {
  currentWorkoutName = getTodayWorkoutName();

  currentWorkoutExercises =
    currentUser.workouts[currentWorkoutName] || [];

  if (!currentWorkoutExercises.length) {
    alert("Nenhum exercício encontrado nesse treino.");

    return;
  }

  currentExerciseIndex = 0;

  currentSet = 1;

  openExercise();
}

function openExercise() {
  hideAllScreens();

  screens.workout.classList.remove("hidden");

  const exercise =
    currentWorkoutExercises[currentExerciseIndex];

  document.getElementById(
    "currentWorkoutName"
  ).innerText = currentWorkoutName;

  document.getElementById(
    "currentExerciseName"
  ).innerText = exercise.name;

  document.getElementById(
    "currentSet"
  ).innerText =
    `${currentSet}/${exercise.sets}`;

  document.getElementById(
    "currentReps"
  ).innerText = exercise.reps;

  document.getElementById(
    "currentWeight"
  ).innerText =
    `${exercise.weight}kg`;

  document.getElementById(
    "exerciseVideo"
  ).href = "https://youtube.com";
}

function pauseSet() {
  const reps = prompt(
    "Quantas repetições você fez até agora?"
  );

  if (reps) {
    alert(
      `Série pausada com ${reps} repetições registradas.`
    );
  }
}

function finishSet() {
  const exercise =
    currentWorkoutExercises[currentExerciseIndex];

  startRest(exercise.rest);
}

function startRest(seconds) {
  hideAllScreens();

  screens.rest.classList.remove("hidden");

  const timer =
    document.getElementById("restTimer");

  let remaining = seconds;

  timer.innerText = remaining;

  clearInterval(restInterval);

  restInterval = setInterval(() => {
    remaining--;

    timer.innerText = remaining;

    if (remaining <= 0) {
      clearInterval(restInterval);

      document
        .getElementById("restScreen")
        .classList.add("finished");

      timer.innerText = "Fim do descanso!";

      setTimeout(() => {
        document
          .getElementById("restScreen")
          .classList.remove("finished");

        goNext();
      }, 2000);
    }
  }, 1000);
}

function goNext() {
  const exercise =
    currentWorkoutExercises[currentExerciseIndex];

  if (currentSet < exercise.sets) {
    currentSet++;

    openExercise();

    return;
  }

  const confirmChange = confirm(
    "Deseja ir para o próximo exercício?"
  );

  if (!confirmChange) {
    return;
  }

  currentExerciseIndex++;

  currentSet = 1;

  if (
    currentExerciseIndex >=
    currentWorkoutExercises.length
  ) {
    finishWorkout();

    return;
  }

  openExercise();
}

function finishWorkout() {
  const workout = {
    type: currentWorkoutName,

    date:
      new Date().toLocaleDateString("pt-BR")
  };

  currentUser.history.push(workout);

  localStorage.setItem(
    "miaufitUser",
    JSON.stringify(currentUser)
  );

  alert("Treino concluído 💪");

  showHome();
}

function registerExtraWorkout(type) {
  const workout = {
    type,

    date:
      new Date().toLocaleDateString("pt-BR")
  };

  currentUser.history.push(workout);

  localStorage.setItem(
    "miaufitUser",
    JSON.stringify(currentUser)
  );

  alert(`${type} registrado com sucesso.`);

  loadHome();
}

function loadHistory() {
  const container =
    document.getElementById("historyList");

  container.innerHTML = "";

  if (!currentUser.history.length) {
    container.innerHTML =
      "<p>Nenhum treino registrado ainda.</p>";

    return;
  }

  currentUser.history
    .slice()
    .reverse()
    .forEach(item => {
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
  document.getElementById(
    "settingsName"
  ).value = currentUser.name;

  document.getElementById(
    "settingsEmail"
  ).value = currentUser.email;

  document.getElementById(
    "settingsWaterGoal"
  ).value = currentUser.waterGoal;

  document.getElementById(
    "settingsInitialWeight"
  ).value = currentUser.initialWeight;

  document.getElementById(
    "settingsGoalWeight"
  ).value = currentUser.goalWeight;

  document.getElementById(
    "settingsTrainingType"
  ).value = currentUser.trainingType;

  document.getElementById(
    "settingsMuscleGroup"
  ).value = currentUser.muscleGroup || "";

  document.getElementById(
    "settingsReminderTime"
  ).value = currentUser.reminderTime;

  document
    .querySelectorAll(
      "#settingsTrainingDays button"
    )
    .forEach(button => {
      const day = Number(button.dataset.day);

      if (
        currentUser.trainingDays.includes(day)
      ) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }

      button.onclick = () => {
        if (
          currentUser.trainingDays.includes(day)
        ) {
          currentUser.trainingDays =
            currentUser.trainingDays.filter(
              d => d !== day
            );

          button.classList.remove("active");
        } else {
          currentUser.trainingDays.push(day);

          button.classList.add("active");
        }
      };
    });
}

function saveSettings() {
  currentUser.name =
    document.getElementById(
      "settingsName"
    ).value;

  currentUser.email =
    document.getElementById(
      "settingsEmail"
    ).value;

  currentUser.waterGoal =
    document.getElementById(
      "settingsWaterGoal"
    ).value;

  currentUser.initialWeight =
    document.getElementById(
      "settingsInitialWeight"
    ).value;

  currentUser.goalWeight =
    document.getElementById(
      "settingsGoalWeight"
    ).value;

  currentUser.trainingType =
    document.getElementById(
      "settingsTrainingType"
    ).value;

  currentUser.muscleGroup =
    document.getElementById(
      "settingsMuscleGroup"
    ).value;

  currentUser.reminderTime =
    document.getElementById(
      "settingsReminderTime"
    ).value;

  const password =
    document.getElementById(
      "settingsPassword"
    ).value;

  if (password) {
    currentUser.password = password;
  }

  localStorage.setItem(
    "miaufitUser",
    JSON.stringify(currentUser)
  );

  alert("Configurações atualizadas.");

  showHome();
}

function loadWorkoutExercisesByFilter() {
  const filter =
    document.getElementById("workoutFilter")
      .value;

  const container =
    document.getElementById(
      "settingsExerciseList"
    );

  const title =
    document.getElementById(
      "selectedWorkoutTitle"
    );

  title.innerText =
    `Treino: ${filter}`;

  container.innerHTML = "";

  if (!currentUser.workouts) {
    currentUser.workouts = {};
  }

  if (!currentUser.workouts[filter]) {
    currentUser.workouts[filter] = [];
  }

  currentUser.workouts[filter].forEach(
    (exercise, index) => {
      const div =
        document.createElement("div");

      div.className = "exercise-item";

      div.innerHTML = `
        <h4>${exercise.name || "Exercício"}</h4>

        <input class="settings-exercise-name" value="${exercise.name}" placeholder="Nome do exercício" />

        <input class="settings-exercise-weight" type="number" value="${exercise.weight}" placeholder="Peso utilizado" />

        <input class="settings-exercise-sets" type="number" value="${exercise.sets}" placeholder="Quantidade de séries" />

        <input class="settings-exercise-reps" type="number" value="${exercise.reps}" placeholder="Quantidade de repetições" />

        <input class="settings-exercise-rest" type="number" value="${exercise.rest}" placeholder="Descanso em segundos" />

        <button class="secondary" onclick="removeExercise('${filter}', ${index})">
          Excluir exercício
        </button>
      `;

      container.appendChild(div);
    });
}

function addExerciseToSelectedWorkout() {
  const filter =
    document.getElementById("workoutFilter")
      .value;

  if (!currentUser.workouts[filter]) {
    currentUser.workouts[filter] = [];
  }

  currentUser.workouts[filter].push({
    name: "",
    weight: "",
    sets: 3,
    reps: 12,
    rest: 60
  });

  loadWorkoutExercisesByFilter();
}

function removeExercise(filter, index) {
  const confirmDelete = confirm(
    "Deseja excluir este exercício?"
  );

  if (!confirmDelete) {
    return;
  }

  currentUser.workouts[filter].splice(
    index,
    1
  );

  loadWorkoutExercisesByFilter();
}

function saveSelectedWorkoutExercises() {
  const filter =
    document.getElementById("workoutFilter")
      .value;

  const exercises = [];

  document
    .querySelectorAll(
      "#settingsExerciseList .exercise-item"
    )
    .forEach(item => {
      exercises.push({
        name:
          item.querySelector(
            ".settings-exercise-name"
          ).value,

        weight:
          item.querySelector(
            ".settings-exercise-weight"
          ).value,

        sets: Number(
          item.querySelector(
            ".settings-exercise-sets"
          ).value
        ),

        reps: Number(
          item.querySelector(
            ".settings-exercise-reps"
          ).value
        ),

        rest: Number(
          item.querySelector(
            ".settings-exercise-rest"
          ).value
        )
      });
    });

  currentUser.workouts[filter] = exercises;

  localStorage.setItem(
    "miaufitUser",
    JSON.stringify(currentUser)
  );

  alert(
    "Treino atualizado com sucesso 💪"
  );

  loadWorkoutExercisesByFilter();
}

function scheduleReminder() {
  if (!("Notification" in window)) {
    return;
  }

  Notification.requestPermission().then(
    permission => {
      if (permission !== "granted") {
        return;
      }

      if (!currentUser.reminderTime) {
        return;
      }

      const now = new Date();

      const [
        hours,
        minutes
      ] = currentUser.reminderTime.split(":");

      const reminder = new Date();

      reminder.setHours(hours);
      reminder.setMinutes(minutes - 60);

      const timeout =
        reminder.getTime() - now.getTime();

      if (timeout > 0) {
        setTimeout(() => {
          new Notification("🐾 MiauFit", {
            body:
              "Seu treino começa em 1 hora 💪"
          });
        }, timeout);
      }
    }
  );
}

window.addEventListener(
  "DOMContentLoaded",
  () => {
    loadSession();

    if (!localStorage.getItem("miaufitSession")) {
      modal.classList.add("active");
    }
  }
);
