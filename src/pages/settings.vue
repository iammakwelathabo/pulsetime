<template>
  <f7-page class="settings-page" name="settings">
    <f7-navbar class="nav">
      <f7-nav-left>
        <a href="/"> <f7-link back class="back-link">←</f7-link></a>
      </f7-nav-left>
      <f7-nav-title class="nav-title focus-title">Settings</f7-nav-title>
    </f7-navbar>

    <f7-block class="content-block">
      <!-- PRESETS -->
      <div class="section-title">PRESETS</div>

      <div class="settings-card">
        <div
            v-for="(p, idx) in presets"
            :key="p.id"
            :class="['preset-row', p.id === selectedPresetId ? 'selected' : '']"
        >
          <div class="preset-left">
            <div class="icon-square">⏱️</div>
            <div class="preset-info">
              <div class="preset-name">{{ p.name }}</div>
              <div class="preset-sub">{{ p.workInterval }} / {{ p.shortBreak }} / {{ p.longBreak }} min • {{ p.cycles }} cycles</div>
            </div>
          </div>

          <div class="preset-right">
            <button class="btn-select" @click="selectPreset(p.id)" :disabled="p.id === selectedPresetId">
              {{ p.id === selectedPresetId ? 'Selected' : 'Select' }}
            </button>

            <button class="btn-icon color-white" title="Edit" @click="openEditModal(p)">
              ✎
            </button>
            <button class="btn-icon danger" title="Delete" @click="openDeletePopup(p.id, p.name)">
              🗑️
            </button>
          </div>
        </div>

        <div class="card-footer">
          <button class="add-btn" @click="openAddModal" :disabled="presets.length >= MAX_PRESETS">
            + Add Preset
          </button>
          <div class="preset-count">{{ presets.length }} / {{ MAX_PRESETS }}</div>
        </div>
      </div>

      <!-- APPEARANCE
      <div class="section-title">APPEARANCE</div>
      <div class="settings-card appearance-card">
        <div class="appearance-segment">
          <button
              v-for="opt in appearanceOptions"
              :key="opt.value"
              :class="['seg-button', appearance === opt.value ? 'active' : '']"
              @click="setAppearance(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>-->

      <!-- GENERAL-->
      <div class="section-title">GENERAL</div>
      <div class="settings-card">
        <div class="nav-item" @click="openAbout">
          <div class="left">
            <div class="icon-square">ℹ️</div>
            <div class="label-wrap">
              <div class="label">About</div>
            </div>
          </div>
          <div class="chev">›</div>
        </div>


        <div class="divider"></div>

        <div class="nav-item" @click="openPrivacy">
          <div class="left">
            <div class="icon-square">🛡️</div>
            <div class="label-wrap">
              <div class="label">Privacy Policy</div>
            </div>
          </div>
          <div class="chev">›</div>
        </div>

        <div class="divider"></div>

        <div class="nav-item" @click="openRate">
          <div class="left">
            <div class="icon-square">⭐</div>
            <div class="label-wrap">
              <div class="label">Rate App</div>
            </div>
          </div>
          <div class="chev">›</div>
        </div>
      </div>

      <f7-block class="version-block">
        <div class="version-text">Version 1.0.0</div>
      </f7-block>
    </f7-block>

    <!-- Custom Delete Account / Preset Popup -->
    <div id="delete_popup" v-if="deletePopupOpen" class="delete-popup" role="dialog" aria-modal="true" :aria-labelledby="'delete_title'">
      <div class="login-container" ref="deletePopupRef" tabindex="-1">

        <h2 id="delete_title" class="delete-title">Delete Preset?</h2>
        <p class="delete-desc">Are you sure you want to delete "<strong>{{ deleteTargetName }}</strong>"? This action cannot be undone.</p>

        <div class="delete-actions">
          <button id="confirmDelete" class="btn-primary text-color-white remove-link-underline" :disabled="deleting" @click="confirmDeleteFromPopup()">
            {{ deleting ? 'Deleting…' : 'Delete' }}
          </button>
          <button id="cancelDelete" class="delete-account-btn btn-secondary" @click="closeDeletePopup()" :disabled="deleting">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div id="deleteBackdrop" v-if="deletePopupOpen" class="delete-backdrop" @click="closeDeletePopup()"></div>


    <!-- Add / Edit Preset Popup -->
    <f7-popup :opened="modalOpen" @popup:closed="closeModal">
      <f7-page>
        <f7-navbar>
          <f7-nav-left>
            <f7-link @click="closeModal" class="close-link">Close</f7-link>
          </f7-nav-left>
          <f7-nav-title class="color-white">
            {{ modalMode === 'edit' ? 'Edit Preset' : 'Add Preset' }}
          </f7-nav-title>
        </f7-navbar>

        <f7-block>
          <div class="modal-form">
            <label class="field">
              <div class="field-label">Name</div>
              <input type="text" v-model="form.name" maxlength="24" />
            </label>

            <label class="field">
              <div class="field-label">Work Interval (min)</div>
              <input type="number" v-model.number="form.workInterval" min="1" />
            </label>

            <label class="field">
              <div class="field-label">Short Break (min)</div>
              <input type="number" v-model.number="form.shortBreak" min="1" />
            </label>

            <label class="field">
              <div class="field-label">Long Break (min)</div>
              <input type="number" v-model.number="form.longBreak" min="1" />
            </label>

            <label class="field">
              <div class="field-label">Cycles</div>
              <input type="number" v-model.number="form.cycles" min="1" />
            </label>

            <label class="field toggle-row">
              <div class="field-label">Auto-start next timer</div>
              <input type="checkbox" v-model="form.autoStart" />
            </label>

            <div class="modal-actions">
              <button class="modal-btn cancel" @click="closeModal">Cancel</button>
              <button class="modal-btn save" @click="saveFromModal">{{ modalMode === 'edit' ? 'Save' : 'Create' }}</button>
            </div>
          </div>
        </f7-block>
      </f7-page>
    </f7-popup>
  </f7-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, getCurrentInstance,onBeforeUnmount, nextTick } from 'vue';

// get a reference to Framework7 if it's available
const vm = getCurrentInstance();
function getF7() {
  return vm && vm.proxy && vm.proxy.$f7 ? vm.proxy.$f7 : null;
}


/* delete popup state */
const deletePopupOpen = ref(false);
const deleteTargetId = ref(null);
const deleteTargetName = ref('');
const deletePopupRef = ref(null);
const deleting = ref(false);

/* open popup with id + name */
function openDeletePopup(id, name = '') {
  deleteTargetId.value = id;
  deleteTargetName.value = name || '';
  deletePopupOpen.value = true;

  // focus the popup container after it renders
  nextTick(() => {
    try {
      if (deletePopupRef.value && deletePopupRef.value.focus) deletePopupRef.value.focus();
    } catch (e) { /* ignore */ }
  });

  // attach escape listener
  document.addEventListener('keydown', escHandler);
}

/* close popup and cleanup */
function closeDeletePopup() {
  deletePopupOpen.value = false;
  deleteTargetId.value = null;
  deleteTargetName.value = '';
  deleting.value = false;
  document.removeEventListener('keydown', escHandler);
}

/* Esc key closes popup */
function escHandler(e) {
  if (e.key === 'Escape' || e.key === 'Esc') {
    closeDeletePopup();
  }
}

/* confirm deletion from popup — calls your existing deletePreset */
async function confirmDeleteFromPopup() {
  if (!deleteTargetId.value) return closeDeletePopup();

  try {
    deleting.value = true;
    // if deletePreset is synchronous, this still works — otherwise await if it returns a Promise
    const result = deletePreset(deleteTargetId.value);
    // if deletePreset returns a Promise, wait for it:
    if (result && typeof result.then === 'function') {
      await result;
    }
    // short success delay for UX
    setTimeout(() => closeDeletePopup(), 150);
  } catch (err) {
    console.error('Delete failed', err);
    // optionally show an alert
    window.alert('Failed to delete preset.');
    deleting.value = false;
  }
}

/* cleanup on component unmount */
onBeforeUnmount(() => {
  document.removeEventListener('keydown', escHandler);
});



// safe wrappers to show dialogs (falls back to native alert/confirm)
function showAlert(message, title) {
  const $f7 = getF7();
  if ($f7 && $f7.dialog && typeof $f7.dialog.alert === 'function') {
    $f7.dialog.alert(message, title);
  } else {
    window.alert(message);
  }
}
function showConfirm(message, cb) {
  const $f7 = getF7();
  if ($f7 && $f7.dialog && typeof $f7.dialog.confirm === 'function') {
    $f7.dialog.confirm(message, cb);
  } else {
    if (window.confirm(message)) cb();
  }
}
function closePopupSafe() {
  const $f7 = getF7();
  if ($f7 && $f7.popup && typeof $f7.popup.close === 'function') {
    $f7.popup.close();
  } else {
    // fallback: toggle modalOpen reactive
    modalOpen.value = false;
  }
}

  /* ---------- Config ---------- */
  const STORAGE_KEY = 'pomodoro_presets_v1';
  const STORAGE_VERSION = 1;
  const MAX_PRESETS = 4;
  const SAVE_DEBOUNCE_MS = 250;

  /* ---------- defaults ---------- */
  const defaultPreset = (name = 'Preset') => ({
    id: `preset_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name,
    workInterval: 25,
    shortBreak: 5,
    longBreak: 15,
    cycles: 4,
    autoStart: true,
  });

  const defaultAppearance = 'dark';
  const appearanceOptions = [
    {label: 'Light', value: 'light'},
    {label: 'Dark', value: 'dark'},
    {label: 'System', value: 'system'},
  ];

  /* ---------- reactive state ---------- */
  const presets = ref([]);
  const selectedPresetId = ref(null);
  const isLoaded = ref(false);
  const saving = ref(false);

  /* appearance */
  const appearance = ref(defaultAppearance);

  /* modal state */
  const modalOpen = ref(false);
  const modalMode = ref('add'); // 'add' | 'edit'
  const editingId = ref(null);
  const form = ref({
    name: '',
    workInterval: 25,
    shortBreak: 5,
    longBreak: 15,
    cycles: 4,
    autoStart: true,
  });

  /* ---------- storage helpers ---------- */
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
    } catch (e) {
      /* ignore */
    }
  }

  /* ---------- load / save (includes appearance) ---------- */
  async function loadPresets() {
    try {
      const native = await nativeGetItem(STORAGE_KEY);
      const data = native ?? localGetItem(STORAGE_KEY) ?? {
        version: STORAGE_VERSION,
        presets: [defaultPreset('Default')],
        selectedPresetId: null,
        appearance: defaultAppearance,
      };

      // ensure valid structure
      data.presets = Array.isArray(data.presets) && data.presets.length ? data.presets : [defaultPreset('Default')];
      data.presets = data.presets.slice(0, MAX_PRESETS);
      presets.value = data.presets;
      selectedPresetId.value = data.selectedPresetId ?? (presets.value[0] && presets.value[0].id);
      appearance.value = data.appearance ?? defaultAppearance;
    } catch (e) {
      // fallback defaults
      presets.value = [defaultPreset('Default')];
      selectedPresetId.value = presets.value[0].id;
      appearance.value = defaultAppearance;
    } finally {
      isLoaded.value = true;
    }
  }

  let saveTimer = null;

  function savePresetsDebounced() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => savePresets(), SAVE_DEBOUNCE_MS);
  }

async function savePresets() {
  saving.value = true;
  const payload = {
    version: STORAGE_VERSION,
    presets: presets.value.slice(0, MAX_PRESETS),
    selectedPresetId: selectedPresetId.value,
    appearance: appearance.value,
  };
  try {
    if (hasNativeStorage()) {
      await nativeSetItem(STORAGE_KEY, payload);
    }
    localSetItem(STORAGE_KEY, payload);
    // <-- dispatch custom event so other parts of app (home) reload immediately
    try {
      window.dispatchEvent(new CustomEvent('pomodoro:presets-changed', { detail: { payload } }));
    } catch (e) { /* ignore */ }
  } catch (e) {
    localSetItem(STORAGE_KEY, payload);
    try {
      window.dispatchEvent(new CustomEvent('pomodoro:presets-changed', { detail: { payload } }));
    } catch (ee) { /* ignore */ }
  } finally {
    saving.value = false;
  }
}


/* ---------- preset operations ---------- */
  function findPresetIndexById(id) {
    return presets.value.findIndex(p => p.id === id);
  }

  function addPreset(preset = null) {
    if (presets.value.length >= MAX_PRESETS) return false;
    const p = preset ? {
      ...preset,
      id: preset.id ?? `preset_${Date.now()}`
    } : defaultPreset(`Preset ${presets.value.length + 1}`);
    presets.value.push(p);
    selectedPresetId.value = p.id;
    savePresetsDebounced();
    // immediate broadcast so home can reload right away
    try { window.dispatchEvent(new CustomEvent('pomodoro:presets-changed', { detail: { action: 'add', id: p.id } })); } catch (e) {}
    return true;
  }

  function updatePreset(id, patch) {
    const idx = findPresetIndexById(id);
    if (idx === -1) return false;
    presets.value[idx] = {...presets.value[idx], ...patch};
    savePresetsDebounced();
    return true;
  }

  function deletePreset(id) {
    const idx = findPresetIndexById(id);
    if (idx === -1) return false;
    // prevent deleting last preset
    if (presets.value.length === 1) {
      presets.value[0] = defaultPreset('Default');
      selectedPresetId.value = presets.value[0].id;
      savePresetsDebounced();
      try { window.dispatchEvent(new CustomEvent('pomodoro:presets-changed', { detail: { action: 'delete', id } })); } catch (e) {}
      return true;
    }
    presets.value.splice(idx, 1);
    if (selectedPresetId.value === id) {
      selectedPresetId.value = presets.value[0].id;
    }
    savePresetsDebounced();
    return true;
  }

  function selectPreset(id) {
    const idx = findPresetIndexById(id);
    if (idx === -1) return false;
    selectedPresetId.value = id;
    savePresetsDebounced();
    return true;
  }

  /* ---------- modal handlers ---------- */
  function openAddModal() {
    modalMode.value = 'add';
    editingId.value = null;
    form.value = {
      name: `Preset ${presets.value.length + 1}`,
      workInterval: 25,
      shortBreak: 5,
      longBreak: 15,
      cycles: 4,
      autoStart: true,
    };
    modalOpen.value = true;
  }

  function openEditModal(preset) {
    modalMode.value = 'edit';
    editingId.value = preset.id;
    form.value = {
      name: preset.name,
      workInterval: preset.workInterval,
      shortBreak: preset.shortBreak,
      longBreak: preset.longBreak,
      cycles: preset.cycles ?? 4,
      autoStart: preset.autoStart ?? true,
    };
    modalOpen.value = true;
  }

  function closeModal() {
    modalOpen.value = false;
    editingId.value = null;
  }

  /* save from modal with validation */
  function saveFromModal() {
    const f = form.value;
    if (!f.name || f.name.trim().length === 0) {
      showAlert('Please provide a name for the preset.');
      return;
    }
    if (f.workInterval < 1 || f.shortBreak < 1 || f.longBreak < 1 || f.cycles < 1) {
      showAlert('Intervals and cycles must be at least 1.');
      return;
    }

    const payload = {
      name: f.name.trim(),
      workInterval: Math.max(1, Math.floor(f.workInterval)),
      shortBreak: Math.max(1, Math.floor(f.shortBreak)),
      longBreak: Math.max(1, Math.floor(f.longBreak)),
      cycles: Math.max(1, Math.floor(f.cycles)),
      autoStart: !!f.autoStart,
    };

    if (modalMode.value === 'edit' && editingId.value) {
      updatePreset(editingId.value, payload);
    } else {
      const created = addPreset({...payload, id: `preset_${Date.now()}`});
      if (!created) {
        showAlert(`Cannot add more than ${MAX_PRESETS} presets.`);
        return;
      }
    }
    closeModal();
  }

  /* confirm delete */
  function confirmDelete(id) {
    const idx = findPresetIndexById(id);
    if (idx === -1) return;
    const name = presets.value[idx].name;
    showConfirm(`Delete preset "${name}"? This cannot be undone.`, () => {
      deletePreset(id);
    });
  }

  /* ---------- appearance handlers ---------- */
  function setAppearance(value) {
    appearance.value = value;
    // you can apply theme changes here; for now we only persist
    savePresetsDebounced();
  }

  /* ---------- general nav stubs ---------- */
  function openAbout() {
    // replace with router or modal
    console.log('open about');
    // example: $f7router.navigate('/about/');
  }

  function openPrivacy() {
    console.log('open privacy');
  }

  function openRate() {
    console.log('open rate');
  }



  /* ---------- computed / watchers ---------- */
  const selectedPreset = computed(() => presets.value.find(p => p.id === selectedPresetId.value) || presets.value[0] || null);

  onMounted(async () => {
    await loadPresets();
  });

  watch([presets, selectedPresetId, appearance], () => {
    savePresetsDebounced();
  }, {deep: true});

</script>

