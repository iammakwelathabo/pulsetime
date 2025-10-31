<template>
  <f7-page name="home" class="page">
    <!-- Top Bar -->
    <div class="top-bar">
      <f7-icon f7="timer" class="icon"></f7-icon>
      <div class="title-wrap">
        <span class="title">PulseTime</span>
        <div class="active-preset" v-if="selectedPreset">
          <span class="preset-name">{{ selectedPreset.name }}</span>
          <span class="preset-sub">{{ selectedPreset.workInterval }} / {{ selectedPreset.shortBreak }} / {{ selectedPreset.longBreak }} min</span>
        </div>
      </div>
      <a href="/settings/"><f7-icon f7="gear_alt_fill" class="icon"></f7-icon></a>
    </div>

    <!-- Focus Section -->
    <div class="focus-section">
      <h4 class="focus-title">Focus</h4>

      <!-- Circular Progress -->
      <div class="progress-wrapper">
        <svg class="progress-circle" viewBox="0 0 224 224">
          <circle class="circle-bg" stroke-width="10" fill="transparent" r="100" cx="112" cy="112"/>
          <circle
              class="circle-progress"
              stroke-width="10"
              stroke-linecap="round"
              fill="transparent"
              r="100"
              cx="112"
              cy="112"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="dashOffset"
          />
        </svg>
        <div class="time-display">
          {{ formattedTime }}
        </div>
      </div>

      <!--<p class="session-info">{{ currentCycle }} of {{ selectedPreset?.cycles ?? 4 }} Sessions</p>
      <div class="session-dots">
        <div
            v-for="i in totalCycles"
            :key="i"
            :class="['dot', i <= completedCycles ? 'active' : 'inactive']"
        ></div>
      </div>-->

      <!-- Presets scrollable row -->
      <div class="presets-section">
        <div class="presets-list" ref="presetsListRef">
          <div
              v-for="p in presets"
              :key="p.id"
              :class="['preset-card', p.id === selectedPresetId ? 'preset-selected' : '']"
              @click="choosePreset(p.id)"
          >
            <div class="pc-name">{{ p.name }}</div>
            <div class="pc-sub">{{ p.workInterval }} / {{ p.shortBreak }} / {{ p.longBreak }} min</div>
            <div class="pc-actions">
              <button class="tiny" @click.stop="choosePreset(p.id)">{{ p.id === selectedPresetId ? 'Active' : 'Use' }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Buttons -->
    <div class="bottom-buttons">
      <button class="icon-btn" @click="resetTimer" title="Reset">
        Reset
      </button>

      <button class="start-btn" @click="toggleTimer">
        <f7-icon :f7="isRunning ? 'pause' : 'play_fill'" class="icon"></f7-icon>
        <span>{{ isRunning ? 'Pause' : 'Start' }}</span>
      </button>

      <button class="icon-btn" @click="stopTimer" title="Stop">
        Stop
      </button>
    </div>
  </f7-page>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';

/* ---------- Storage key (must match Settings.vue) ---------- */
const STORAGE_KEY = 'pomodoro_presets_v1';

/* ---------- Reactive timer state ---------- */
const presets = ref([]);
const selectedPresetId = ref(null);
const selectedPreset = computed(() => presets.value.find(p => p.id === selectedPresetId.value) || (presets.value[0] ?? null));

const currentTotalTime = ref(25 * 60); // seconds for current preset (work interval)
const timeLeft = ref(currentTotalTime.value);
const isRunning = ref(false);
const intervalRef = ref(null);

/* cycles / session tracking (simple) */
const currentCycle = ref(1);

/* svg circle math */
const circumference = 2 * Math.PI * 100;
const dashOffset = computed(() => {
  // avoid division by zero
  const total = currentTotalTime.value > 0 ? currentTotalTime.value : 1;
  return circumference - (timeLeft.value / total) * circumference;
});

/* format mm:ss */
const formattedTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60).toString().padStart(2, '0');
  const s = (timeLeft.value % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
});

/* ---------- Storage helpers (NativeStorage + localStorage fallback) ---------- */
function hasNativeStorage() {
  return typeof window !== 'undefined' && !!window.NativeStorage;
}
function nativeGetItem(key) {
  return new Promise((resolve) => {
    if (!hasNativeStorage()) return resolve(null);
    window.NativeStorage.getItem(key, result => resolve(result), () => resolve(null));
  });
}
function nativeSetItem(key, value) {
  return new Promise((resolve, reject) => {
    if (!hasNativeStorage()) return resolve();
    window.NativeStorage.setItem(key, value, () => resolve(), err => reject(err));
  });
}
function localGetItem(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}
function localSetItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) { /* ignore */ }
}

/* load the saved payload (presets + selectedPresetId + appearance) */
async function loadPayload() {
  try {
    const native = await nativeGetItem(STORAGE_KEY);
    const payload = native ?? localGetItem(STORAGE_KEY) ?? null;
    if (payload && Array.isArray(payload.presets) && payload.presets.length) {
      presets.value = payload.presets;
      selectedPresetId.value = payload.selectedPresetId ?? payload.presets[0].id;
    } else {
      // fallback single default preset
      const defaultPreset = {
        id: `preset_${Date.now()}`,
        name: 'Default',
        workInterval: 25,
        shortBreak: 5,
        longBreak: 15,
        cycles: 4,
        autoStart: true,
      };
      presets.value = [defaultPreset];
      selectedPresetId.value = defaultPreset.id;
    }
  } catch (e) {
    console.warn('Failed loading presets payload', e);
    // fallback single default preset
    const defaultPreset = {
      id: `preset_${Date.now()}`,
      name: 'Default',
      workInterval: 25,
      shortBreak: 5,
      longBreak: 15,
      cycles: 4,
      autoStart: true,
    };
    presets.value = [defaultPreset];
    selectedPresetId.value = defaultPreset.id;
  } finally {
    // after loading, apply preset durations
    applySelectedPreset(false);
  }
}

/* save just selectedPresetId back into payload (preserve presets array) */
async function saveSelected() {
  const payload = {
    version: 1,
    presets: presets.value,
    selectedPresetId: selectedPresetId.value,
    appearance: null,
  };
  try {
    if (hasNativeStorage()) await nativeSetItem(STORAGE_KEY, payload);
    localSetItem(STORAGE_KEY, payload);
  } catch (e) {
    localSetItem(STORAGE_KEY, payload);
  }
}

/* ---------- Timer controls ---------- */
function startTimer() {
  if (intervalRef.value) clearInterval(intervalRef.value);
  isRunning.value = true;
  intervalRef.value = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
    } else {
      // timer reached zero - stop and increment cycle
      clearInterval(intervalRef.value);
      intervalRef.value = null;
      isRunning.value = false;
      currentCycle.value = Math.min((selectedPreset?.cycles ?? 4), currentCycle.value + 1);
      // if autoStart on preset, start next automatically (not implemented: break timers)
    }
  }, 1000);
}

function pauseTimer() {
  if (intervalRef.value) {
    clearInterval(intervalRef.value);
    intervalRef.value = null;
  }
  isRunning.value = false;
}

function toggleTimer() {
  if (isRunning.value) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function stopTimer() {
  pauseTimer();
  // reset cycle as user stopped
  currentCycle.value = 1;
  timeLeft.value = currentTotalTime.value;
}

function resetTimer() {
  pauseTimer();
  timeLeft.value = currentTotalTime.value;
}

/* choose preset from home - stop timer and set new duration */
function choosePreset(id) {
  const found = presets.value.find(p => p.id === id);
  if (!found) return;
  selectedPresetId.value = id;
  applySelectedPreset(true); // reset timer to new preset duration, stop timer
  saveSelected();
}

/* apply selected preset values to timer; if keepRunning false we pause timer */
function applySelectedPreset(pause = true) {
  const p = selectedPreset.value;
  if (!p) return;
  currentTotalTime.value = (p.workInterval ?? 25) * 60;
  // update timeLeft to full duration when switching
  timeLeft.value = currentTotalTime.value;
  if (pause) {
    pauseTimer();
  }
  currentCycle.value = 1;
}
let presetsChangedHandler = null;
/* ---------- lifecycle ---------- */
onMounted(async () => {
  await loadPayload();

  // listen for custom events from Settings.vue
  presetsChangedHandler = (e) => {
    // optional: inspect e.detail for action / payload
    console.log('presets changed event received', e?.detail);
    // reload presets (re-applies selected preset and timer)
    loadPayload();
  };
  window.addEventListener('pomodoro:presets-changed', presetsChangedHandler);

  // keep the storage event listener you already have (optional)
  window.addEventListener('storage', (ev) => {
    if (ev.key === STORAGE_KEY) loadPayload();
  });
});

onBeforeUnmount(() => {
  if (presetsChangedHandler) window.removeEventListener('pomodoro:presets-changed', presetsChangedHandler);
});

/* If presets change elsewhere (settings), reload payload so home stays in sync.
   This simple watcher polls localStorage change via 'storage' event in other tabs (optional).
*/
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) {
    // reload in next tick to avoid blocking UI
    nextTick().then(loadPayload);
  }
});
</script>

