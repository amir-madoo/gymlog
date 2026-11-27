(() => {
  const { DAY_ORDER, DAY_SHORT, DAY_FULL, getPhaseConfig, PROGRAM } = window.GYMLOG_DATA;
  const STORAGE_KEY = 'gymlog_dark_v2';

  // Local YYYY-MM-DD key (avoids UTC drift before 5:30 AM IST)
  function getLocalDateKey(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatShortDate(dateKey) {
    if (!dateKey) return '';
    const [y, m, d] = dateKey.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function formatRest(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return s === 0 ? `${m}m` : `${m}m ${s}s`;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('gymlog_v1_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          activeWeek: parsed.activeWeek || 1,
          logs: parsed.logs || {},
          weights: parsed.weights || []
        };
      }
    } catch (e) {}
    return { activeWeek: 1, logs: {}, weights: [] };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      showToast('Storage full — export backup');
    }
  }

  const now = new Date();
  const todayDow = now.getDay();
  const todayKey = getLocalDateKey(now);

  let state = loadState();
  let selectedDow = todayDow;

  function getDayLog(dateKey) {
    if (!state.logs[dateKey]) {
      state.logs[dateKey] = {
        exercises: {},
        cardio: { done: false, minutes: '' },
        steps: ''
      };
    }
    return state.logs[dateKey];
  }

  function getLastExerciseRecord(exId, isViewingToday) {
    const dates = Object.keys(state.logs).sort().reverse();
    for (const d of dates) {
      if (isViewingToday && d >= todayKey) continue;
      const rec = state.logs[d]?.exercises?.[exId];
      if (!rec || !Array.isArray(rec)) continue;
      if (rec.some(s => s && (s.w !== '' || s.r !== '' || s.done))) {
        return { date: d, sets: rec };
      }
    }
    return null;
  }

  function getLastCardioRecord(dow, isViewingToday) {
    const dates = Object.keys(state.logs).sort().reverse();
    for (const d of dates) {
      if (isViewingToday && d >= todayKey) continue;
      const [y, m, day] = d.split('-').map(Number);
      if (new Date(y, m - 1, day).getDay() !== dow) continue;
      const c = state.logs[d]?.cardio;
      if (c && (c.done || c.minutes)) return { date: d, ...c };
    }
    return null;
  }

  function getCardioSpec(type, phaseCfg) {
    if (type === 'treadmill') {
      return {
        title: `Incline Treadmill Walk · ${phaseCfg.treadmillMin} min`,
        detail: phaseCfg.treadmillSpec,
        targetMin: phaseCfg.treadmillMin
      };
    }
    if (type === 'cycle') {
      return {
        title: `Stationary Cycle · ${phaseCfg.cycleMin} min`,
        detail: phaseCfg.cycleSpec,
        targetMin: phaseCfg.cycleMin
      };
    }
    if (type === 'flush') {
      return {
        title: `Stationary Cycle (Active Flush) · ${phaseCfg.wedFlushMin} min`,
        detail: 'Very light resistance · 65–75 RPM · Zone 1 (<115 bpm)',
        targetMin: phaseCfg.wedFlushMin
      };
    }
    if (type === 'sat_cycle') {
      return {
        title: `Stationary Cycle Endurance · ${phaseCfg.satCycleMin} min`,
        detail: phaseCfg.satSpec,
        targetMin: phaseCfg.satCycleMin
      };
    }
    return null;
  }

  // Toast
  let toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  // --- Rest Timer (Timestamp-based so screen lock stays accurate) ---
  let timerState = {
    active: false,
    paused: false,
    endAt: 0,
    remainingMs: 0,
    label: '',
    intervalId: null
  };

  function beepDone() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const tone = (freq, start, dur) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.14, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      };
      const t = ctx.currentTime;
      tone(880, t, 0.16);
      tone(1174, t + 0.18, 0.24);
    } catch (e) {}
    if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
  }

  function formatMMSS(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function updateTimerUI() {
    const bar = document.getElementById('timerBar');
    const clock = document.getElementById('timerClock');
    const label = document.getElementById('timerLabel');
    const toggle = document.getElementById('timerToggle');

    if (!timerState.active) {
      bar.classList.remove('visible', 'finished');
      return;
    }

    bar.classList.add('visible');
    const rem = timerState.paused ? timerState.remainingMs : Math.max(0, timerState.endAt - Date.now());
    clock.textContent = formatMMSS(rem);
    label.textContent = rem <= 0 ? 'Rest complete — next set' : timerState.label;
    toggle.textContent = timerState.paused ? 'Resume' : 'Pause';

    if (rem <= 0 && !bar.classList.contains('finished')) {
      bar.classList.add('finished');
      clearInterval(timerState.intervalId);
      timerState.intervalId = null;
      beepDone();
    } else if (rem > 0) {
      bar.classList.remove('finished');
    }
  }

  function startRestTimer(seconds, exName) {
    clearInterval(timerState.intervalId);
    timerState = {
      active: true,
      paused: false,
      endAt: Date.now() + seconds * 1000,
      remainingMs: seconds * 1000,
      label: exName || 'Rest',
      intervalId: setInterval(updateTimerUI, 250)
    };
    updateTimerUI();
  }

  function adjustTimer(deltaSec) {
    if (!timerState.active) return;
    if (timerState.paused) {
      timerState.remainingMs = Math.max(0, timerState.remainingMs + deltaSec * 1000);
    } else {
      const rem = Math.max(0, timerState.endAt - Date.now()) + deltaSec * 1000;
      timerState.endAt = Date.now() + Math.max(0, rem);
      if (rem > 0 && !timerState.intervalId) {
        timerState.intervalId = setInterval(updateTimerUI, 250);
      }
    }
    updateTimerUI();
  }

  function toggleTimerPause() {
    if (!timerState.active) return;
    if (timerState.paused) {
      timerState.paused = false;
      timerState.endAt = Date.now() + timerState.remainingMs;
      timerState.intervalId = setInterval(updateTimerUI, 250);
    } else {
      timerState.remainingMs = Math.max(0, timerState.endAt - Date.now());
      timerState.paused = true;
      clearInterval(timerState.intervalId);
      timerState.intervalId = null;
    }
    updateTimerUI();
  }

  function stopTimer() {
    clearInterval(timerState.intervalId);
    timerState.active = false;
    timerState.intervalId = null;
    updateTimerUI();
  }

  document.getElementById('timerMinus').addEventListener('click', () => adjustTimer(-15));
  document.getElementById('timerPlus').addEventListener('click', () => adjustTimer(15));
  document.getElementById('timerToggle').addEventListener('click', toggleTimerPause);
  document.getElementById('timerClose').addEventListener('click', stopTimer);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && timerState.active) updateTimerUI();
  });

  // --- Render Header ---
  function renderHeader() {
    document.getElementById('todayDateLabel').textContent = now.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });
    document.getElementById('weekPillBtn').textContent = `Wk ${state.activeWeek} / 12`;

    const strip = document.getElementById('dayStrip');
    strip.innerHTML = '';
    DAY_ORDER.forEach(dow => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'day-btn'
        + (dow === selectedDow ? ' active' : '')
        + (dow === todayDow ? ' is-today' : '');
      btn.innerHTML = `<span>${DAY_SHORT[dow]}</span>${dow === todayDow ? '<span class="today-dot"></span>' : ''}`;
      btn.addEventListener('click', () => {
        selectedDow = dow;
        renderAll();
      });
      strip.appendChild(btn);
    });
  }

  // --- Render Main ---
  function renderMain() {
    const main = document.getElementById('appMain');
    const plan = PROGRAM[selectedDow];
    const phaseCfg = getPhaseConfig(state.activeWeek);
    const isEditable = selectedDow === todayDow;
    const todayLog = isEditable ? getDayLog(todayKey) : null;

    let html = '';

    if (!isEditable) {
      html += `
        <div class="lock-banner">
          <span>Viewing <strong>${DAY_FULL[selectedDow]}</strong> (Read-only — unlocks on ${DAY_FULL[selectedDow]})</span>
          <button type="button" id="jumpTodayBtn">Today</button>
        </div>
      `;
    }

    let totalChecks = 0;
    let doneChecks = 0;
    const allEx = [...plan.lifts, ...plan.core];
    allEx.forEach(ex => {
      totalChecks += ex.sets;
      if (isEditable) {
        const rec = todayLog.exercises[ex.id] || [];
        for (let i = 0; i < ex.sets; i++) {
          if (rec[i]?.done) doneChecks++;
        }
      }
    });
    if (plan.cardioType) {
      totalChecks += 1;
      if (isEditable && todayLog.cardio?.done) doneChecks++;
    }
    const pct = totalChecks > 0 ? Math.round((doneChecks / totalChecks) * 100) : 0;

    html += `
      <section class="day-header">
        <div class="day-title-row">
          <h2 class="day-title">${DAY_FULL[selectedDow]} — ${plan.title}</h2>
          <span class="phase-tag">Week ${state.activeWeek}</span>
        </div>
        <p class="day-meta">${plan.subtitle} · ${phaseCfg.label}</p>
        ${isEditable && totalChecks > 0 ? `
          <div class="progress-wrap">
            <div class="progress-track"><div class="progress-fill" id="dayProgressFill" style="width:${pct}%"></div></div>
            <div class="progress-label" id="dayProgressLabel">${doneChecks} / ${totalChecks} done</div>
          </div>
        ` : ''}
      </section>
    `;

    const buildExerciseCard = (ex, isWeightedDefault = true) => {
      const weighted = ex.weighted !== undefined ? ex.weighted : isWeightedDefault;
      const repColLabel = ex.repLabel || 'Reps';
      const lastRec = getLastExerciseRecord(ex.id, isEditable);
      const curSets = isEditable ? (todayLog.exercises[ex.id] || []) : [];

      let allDone = isEditable && ex.sets > 0;
      for (let i = 0; i < ex.sets; i++) {
        if (!curSets[i]?.done) allDone = false;
      }

      let lastBanner = '';
      if (lastRec) {
        const weights = lastRec.sets.map(s => Number(s?.w)).filter(n => !isNaN(n) && n > 0);
        const topW = weights.length ? `${Math.max(...weights)} kg` : '';
        const repsList = lastRec.sets.map(s => s?.r || '–').join(', ');
        lastBanner = `
          <div class="last-summary">
            Last (${formatShortDate(lastRec.date)}): ${weighted && topW ? `<strong>${topW}</strong> · ` : ''}${repsList} ${repColLabel.toLowerCase()}
          </div>
        `;
      }

      let rowsHtml = '';
      for (let i = 0; i < ex.sets; i++) {
        const cur = curSets[i] || { w: '', r: '', done: false };
        const prev = lastRec?.sets?.[i];
        let lastText = '—';
        if (prev && (prev.w !== '' || prev.r !== '')) {
          lastText = weighted
            ? `${prev.w || '0'} kg × ${prev.r || '0'}`
            : `${prev.r || '0'} ${repColLabel.toLowerCase()}`;
        }

        rowsHtml += `
          <div class="set-row ${weighted ? '' : 'no-weight'} ${cur.done ? 'done-row' : ''}" data-ex="${ex.id}" data-set="${i}">
            <div class="set-num">${i + 1}</div>
            <div class="last-cell ${lastText === '—' ? 'empty' : ''}">${lastText}</div>
            ${weighted ? `<input class="num-input weight-inp" type="text" inputmode="decimal" placeholder="kg" value="${escapeHtml(cur.w)}" data-ex="${ex.id}" data-set="${i}" ${isEditable ? '' : 'disabled'} />` : ''}
            <input class="num-input rep-inp" type="text" inputmode="numeric" placeholder="${repColLabel}" value="${escapeHtml(cur.r)}" data-ex="${ex.id}" data-set="${i}" ${isEditable ? '' : 'disabled'} />
            <button type="button" class="check-btn ${cur.done ? 'checked' : ''}" data-ex="${ex.id}" data-set="${i}" data-rest="${ex.rest}" data-name="${escapeHtml(ex.name)}" ${isEditable ? '' : 'disabled'} aria-label="Complete set ${i + 1}">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
          </div>
        `;
      }

      return `
        <article class="card ${allDone ? 'completed-card' : ''}" data-card="${ex.id}">
          <div class="ex-top">
            <div>
              <div class="ex-title-line">
                <h3 class="ex-name">${ex.name}</h3>
                ${ex.posture ? '<span class="badge badge-posture">Posture</span>' : ''}
              </div>
              <div class="ex-target">${ex.sets} sets × ${ex.target} · Rest ${formatRest(ex.rest)}</div>
            </div>
            <div class="ex-tools">
              <button type="button" class="mini-btn cue-toggle-btn" data-cue="cue_${ex.id}">Cue</button>
              <button type="button" class="mini-btn manual-timer-btn" data-rest="${ex.rest}" data-name="${escapeHtml(ex.name)}">⏱ ${formatRest(ex.rest)}</button>
            </div>
          </div>
          <div class="cue-box" id="cue_${ex.id}"><strong>Form:</strong> ${ex.cue}</div>
          ${lastBanner}
          <div class="set-header ${weighted ? '' : 'no-weight'}">
            <div style="text-align:center">Set</div>
            <div>Last Time</div>
            ${weighted ? '<div style="text-align:center">kg</div>' : ''}
            <div style="text-align:center">${repColLabel}</div>
            <div style="text-align:center">✓</div>
          </div>
          ${rowsHtml}
        </article>
      `;
    };

    // 1. Resistance Workout
    if (plan.lifts.length > 0) {
      html += `<div class="section-label"><span>Workout (${plan.lifts.length} Exercises)</span><span>Double Progression</span></div>`;
      plan.lifts.forEach(ex => { html += buildExerciseCard(ex, true); });
    }

    // 2. Posture & Core
    if (plan.core.length > 0) {
      html += `<div class="section-label"><span>${plan.coreLabel}</span><span>Control &amp; Alignment</span></div>`;
      plan.core.forEach(ex => { html += buildExerciseCard(ex); });
    }

    // 3. Cardio
    if (plan.cardioType) {
      const cSpec = getCardioSpec(plan.cardioType, phaseCfg);
      const curCardio = isEditable ? (todayLog.cardio || { done: false, minutes: '' }) : { done: false, minutes: '' };
      const lastCardio = getLastCardioRecord(selectedDow, isEditable);

      html += `
        <div class="section-label"><span>Post-Workout Cardio</span><span>Low Impact</span></div>
        <article class="card ${curCardio.done ? 'completed-card' : ''}" id="cardioCard">
          <div class="simple-row">
            <div>
              <h3 class="ex-name">${cSpec.title}</h3>
              <div class="ex-target">${cSpec.detail}</div>
            </div>
            <button type="button" class="check-btn ${curCardio.done ? 'checked' : ''}" id="cardioCheckBtn" ${isEditable ? '' : 'disabled'} aria-label="Complete cardio">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
          </div>
          ${lastCardio ? `<div class="last-summary" style="margin-top:9px;margin-bottom:0">Last (${formatShortDate(lastCardio.date)}): ${lastCardio.minutes ? lastCardio.minutes + ' min' : 'Completed'}</div>` : ''}
          <div class="simple-controls">
            <input class="num-input" id="cardioMinInput" style="width:92px" type="text" inputmode="numeric" placeholder="${cSpec.targetMin}" value="${escapeHtml(curCardio.minutes || '')}" ${isEditable ? '' : 'disabled'} />
            <span class="unit-label">minutes completed</span>
          </div>
        </article>
      `;
    }

    // 4. Daily Steps
    const curSteps = isEditable ? (todayLog.steps || '') : '';
    const stepsNum = parseInt(curSteps, 10) || 0;
    const stepTarget = selectedDow === 0 ? Math.max(4000, phaseCfg.steps - 1000) : phaseCfg.steps;
    const stepPct = Math.min(100, Math.round((stepsNum / stepTarget) * 100));
    const stepMet = isEditable && stepsNum >= stepTarget;

    html += `
      <div class="section-label"><span>Daily Movement</span><span>Goal: ${stepTarget.toLocaleString()} steps</span></div>
      <article class="card ${stepMet ? 'completed-card' : ''}" id="stepsCard">
        <div class="simple-row">
          <div>
            <h3 class="ex-name">Daily Steps</h3>
            <div class="ex-target">${selectedDow === 0 ? 'Optional casual walk · ' : ''}Week ${state.activeWeek} target: ${stepTarget.toLocaleString()} steps</div>
          </div>
          <div class="progress-label" id="stepsPctLabel" style="min-width:auto">${isEditable ? stepPct + '%' : '—'}</div>
        </div>
        <div class="simple-controls">
          <input class="num-input" id="stepsInput" style="width:120px" type="text" inputmode="numeric" placeholder="${stepTarget}" value="${escapeHtml(curSteps)}" ${isEditable ? '' : 'disabled'} />
          <span class="unit-label">steps today</span>
        </div>
        <div class="progress-track" style="margin-top:10px">
          <div class="progress-fill" id="stepsProgressFill" style="width:${isEditable ? stepPct : 0}%"></div>
        </div>
      </article>
    `;

    // 5. Sunday Body Weight Tracker
    if (selectedDow === 0) {
      const sortedWeights = [...state.weights].sort((a, b) => b.date.localeCompare(a.date));
      const todayEntry = sortedWeights.find(w => w.date === todayKey);

      let historyHtml = '';
      if (sortedWeights.length === 0) {
        historyHtml = `<div class="ex-target" style="margin-top:8px">No weigh-ins logged yet. Record every Sunday morning before breakfast.</div>`;
      } else {
        historyHtml = sortedWeights.map((entry, idx) => {
          const prev = sortedWeights[idx + 1];
          let deltaHtml = '<span class="delta-up">Baseline</span>';
          if (prev) {
            const diff = +(entry.kg - prev.kg).toFixed(1);
            if (diff < 0) deltaHtml = `<span class="delta-down">${diff.toFixed(1)} kg</span>`;
            else if (diff > 0) deltaHtml = `<span class="delta-up">+${diff.toFixed(1)} kg</span>`;
            else deltaHtml = `<span class="delta-up">0.0 kg</span>`;
          }
          return `
            <div class="weight-item">
              <span><strong>${entry.kg.toFixed(1)} kg</strong> · <span style="color:var(--text-secondary)">${formatShortDate(entry.date)}</span></span>
              ${deltaHtml}
            </div>
          `;
        }).join('');
      }

      html += `
        <div class="section-label"><span>Weekly Weigh-In</span><span>Sunday Morning</span></div>
        <article class="card">
          <h3 class="ex-name">Body Weight (kg)</h3>
          <div class="ex-target">Log once a week on Sunday morning after waking up.</div>
          <div class="weight-entry-row">
            <input class="num-input" id="sundayWeightInput" style="width:120px" type="text" inputmode="decimal" placeholder="127.0" value="${todayEntry ? todayEntry.kg : ''}" ${isEditable ? '' : 'disabled'} />
            <span class="unit-label">kg</span>
            <button type="button" class="primary-btn" id="saveWeightBtn" ${isEditable ? '' : 'disabled'}>Save Weight</button>
          </div>
          <div class="weight-history">${historyHtml}</div>
        </article>
      `;
    }

    main.innerHTML = html;
    bindMainEvents(isEditable, stepTarget);
  }

  function updateDayProgressBar() {
    const plan = PROGRAM[todayDow];
    const todayLog = getDayLog(todayKey);
    let total = 0, done = 0;
    [...plan.lifts, ...plan.core].forEach(ex => {
      total += ex.sets;
      const rec = todayLog.exercises[ex.id] || [];
      for (let i = 0; i < ex.sets; i++) {
        if (rec[i]?.done) done++;
      }
    });
    if (plan.cardioType) {
      total += 1;
      if (todayLog.cardio?.done) done++;
    }
    const fill = document.getElementById('dayProgressFill');
    const lbl = document.getElementById('dayProgressLabel');
    if (fill && lbl && total > 0) {
      fill.style.width = `${Math.round((done / total) * 100)}%`;
      lbl.textContent = `${done} / ${total} done`;
    }
  }

  function bindMainEvents(isEditable, stepTarget) {
    const jumpBtn = document.getElementById('jumpTodayBtn');
    if (jumpBtn) {
      jumpBtn.addEventListener('click', () => {
        selectedDow = todayDow;
        renderAll();
      });
    }

    document.querySelectorAll('.cue-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById(btn.dataset.cue)?.classList.toggle('open');
      });
    });

    document.querySelectorAll('.manual-timer-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        startRestTimer(parseInt(btn.dataset.rest, 10), btn.dataset.name);
      });
    });

    if (!isEditable) return;

    const todayLog = getDayLog(todayKey);

    const ensureSetObj = (exId, idx) => {
      if (!todayLog.exercises[exId]) todayLog.exercises[exId] = [];
      if (!todayLog.exercises[exId][idx]) todayLog.exercises[exId][idx] = { w: '', r: '', done: false };
      return todayLog.exercises[exId][idx];
    };

    document.querySelectorAll('.weight-inp').forEach(inp => {
      inp.addEventListener('input', () => {
        const clean = inp.value.replace(/[^0-9.]/g, '');
        if (clean !== inp.value) inp.value = clean;
        ensureSetObj(inp.dataset.ex, Number(inp.dataset.set)).w = clean;
        saveState();
      });
    });

    document.querySelectorAll('.rep-inp').forEach(inp => {
      inp.addEventListener('input', () => {
        const clean = inp.value.replace(/[^0-9]/g, '');
        if (clean !== inp.value) inp.value = clean;
        ensureSetObj(inp.dataset.ex, Number(inp.dataset.set)).r = clean;
        saveState();
      });
    });

    document.querySelectorAll('.check-btn[data-ex]').forEach(btn => {
      btn.addEventListener('click', () => {
        const exId = btn.dataset.ex;
        const idx = Number(btn.dataset.set);
        const setObj = ensureSetObj(exId, idx);
        setObj.done = !setObj.done;
        saveState();

        btn.classList.toggle('checked', setObj.done);
        btn.closest('.set-row')?.classList.toggle('done-row', setObj.done);

        const card = document.querySelector(`[data-card="${exId}"]`);
        if (card) {
          const allDone = Array.from(card.querySelectorAll('.check-btn[data-ex]'))
            .every(c => c.classList.contains('checked'));
          card.classList.toggle('completed-card', allDone);
        }

        updateDayProgressBar();
        if (setObj.done) {
          startRestTimer(parseInt(btn.dataset.rest, 10), btn.dataset.name);
        }
      });
    });

    const cardioCheck = document.getElementById('cardioCheckBtn');
    const cardioMin = document.getElementById('cardioMinInput');
    if (cardioCheck) {
      cardioCheck.addEventListener('click', () => {
        todayLog.cardio.done = !todayLog.cardio.done;
        if (todayLog.cardio.done && !todayLog.cardio.minutes && cardioMin) {
          todayLog.cardio.minutes = cardioMin.placeholder;
          cardioMin.value = cardioMin.placeholder;
        }
        saveState();
        cardioCheck.classList.toggle('checked', todayLog.cardio.done);
        document.getElementById('cardioCard')?.classList.toggle('completed-card', todayLog.cardio.done);
        updateDayProgressBar();
      });
    }
    if (cardioMin) {
      cardioMin.addEventListener('input', () => {
        const clean = cardioMin.value.replace(/[^0-9]/g, '');
        if (clean !== cardioMin.value) cardioMin.value = clean;
        todayLog.cardio.minutes = clean;
        saveState();
      });
    }

    const stepsInput = document.getElementById('stepsInput');
    if (stepsInput) {
      stepsInput.addEventListener('input', () => {
        const clean = stepsInput.value.replace(/[^0-9]/g, '');
        if (clean !== stepsInput.value) stepsInput.value = clean;
        todayLog.steps = clean;
        saveState();

        const val = parseInt(clean, 10) || 0;
        const pct = Math.min(100, Math.round((val / stepTarget) * 100));
        document.getElementById('stepsProgressFill').style.width = pct + '%';
        document.getElementById('stepsPctLabel').textContent = pct + '%';
        document.getElementById('stepsCard').classList.toggle('completed-card', val >= stepTarget);
      });
    }

    const saveWeightBtn = document.getElementById('saveWeightBtn');
    const weightInp = document.getElementById('sundayWeightInput');
    if (saveWeightBtn && weightInp) {
      saveWeightBtn.addEventListener('click', () => {
        const kg = parseFloat(weightInp.value);
        if (isNaN(kg) || kg < 30 || kg > 300) {
          showToast('Enter a valid weight in kg');
          return;
        }
        const rounded = Math.round(kg * 10) / 10;
        const existingIdx = state.weights.findIndex(w => w.date === todayKey);
        if (existingIdx >= 0) {
          state.weights[existingIdx].kg = rounded;
        } else {
          state.weights.push({ date: todayKey, kg: rounded });
        }
        saveState();
        showToast(`Saved ${rounded.toFixed(1)} kg`);
        renderMain();
      });
    }
  }

  // --- Settings Modal ---
  const modal = document.getElementById('settingsModal');

  function renderSettingsModal() {
    const cfg = getPhaseConfig(state.activeWeek);
    document.getElementById('phaseSummaryText').textContent =
      `Week ${state.activeWeek}: ${cfg.label} · ${cfg.steps.toLocaleString()} steps/day · ${cfg.treadmillMin} min cardio`;

    const grid = document.getElementById('weekGrid');
    grid.innerHTML = '';
    for (let w = 1; w <= 12; w++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'wk-choice' + (w === state.activeWeek ? ' selected' : '');
      b.textContent = `Wk ${w}`;
      b.addEventListener('click', () => {
        state.activeWeek = w;
        saveState();
        renderSettingsModal();
        renderAll();
        showToast(`Switched to Week ${w}`);
      });
      grid.appendChild(b);
    }
  }

  function openSettings() {
    renderSettingsModal();
    modal.classList.add('open');
  }

  function closeSettings() {
    modal.classList.remove('open');
  }

  document.getElementById('weekPillBtn').addEventListener('click', openSettings);
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('closeSettingsBtn').addEventListener('click', closeSettings);
  modal.addEventListener('click', e => { if (e.target === modal) closeSettings(); });

  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymlog-backup-${todayKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded');
  });

  document.getElementById('copyBackupBtn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(state));
      showToast('Backup JSON copied');
    } catch (e) {
      showToast('Use Download Backup instead');
    }
  });

  const fileInp = document.getElementById('importFileInput');
  document.getElementById('importTriggerBtn').addEventListener('click', () => fileInp.click());
  fileInp.addEventListener('change', () => {
    const file = fileInp.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== 'object' || !parsed.logs) throw new Error('Invalid');
        state = {
          activeWeek: parsed.activeWeek || 1,
          logs: parsed.logs || {},
          weights: parsed.weights || []
        };
        saveState();
        renderSettingsModal();
        renderAll();
        showToast('Backup restored');
      } catch (err) {
        showToast('Invalid backup file');
      }
      fileInp.value = '';
    };
    reader.readAsText(file);
  });

  document.getElementById('resetDataBtn').addEventListener('click', () => {
    if (confirm('Erase all saved workout logs and body weights? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY);
      state = { activeWeek: 1, logs: {}, weights: [] };
      renderSettingsModal();
      renderAll();
      showToast('All data cleared');
    }
  });

  function renderAll() {
    renderHeader();
    renderMain();
  }

  renderAll();
})();
