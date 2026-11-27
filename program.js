// GymLog Programme Data — Aesthetic, V-Taper, Anti-Slouch 6-Day PPL
window.GYMLOG_DATA = {
  DAY_ORDER: [1, 2, 3, 4, 5, 6, 0],
  DAY_SHORT: { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 0: 'Sun' },
  DAY_FULL:  { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 0: 'Sunday' },

  getPhaseConfig(week) {
    if (week <= 4) {
      return {
        phase: 1,
        label: 'Phase 1 · Foundation (2–3 RIR)',
        steps: 5000,
        treadmillMin: 20,
        treadmillSpec: '4.0–4.5 km/h · 3–5% incline · Zone 2 (115–136 bpm)',
        cycleMin: 20,
        cycleSpec: '65–75 RPM · Moderate resistance · Zone 2',
        wedFlushMin: 10,
        satCycleMin: 25,
        satSpec: '70–80 RPM · Moderate resistance · Zone 2'
      };
    }
    if (week <= 8) {
      return {
        phase: 2,
        label: (week === 7 || week === 8)
          ? 'Phase 2 · Build (Deload Option: -40% sets)'
          : 'Phase 2 · Build (1–2 RIR)',
        steps: 6500,
        treadmillMin: 25,
        treadmillSpec: '4.3–4.8 km/h · 5–7% incline · Zone 2 (115–136 bpm)',
        cycleMin: 25,
        cycleSpec: '70–80 RPM · +1–2 resistance · Zone 2',
        wedFlushMin: 12,
        satCycleMin: 30,
        satSpec: '70–80 RPM · Moderate-firm resistance · Zone 2'
      };
    }
    return {
      phase: 3,
      label: 'Phase 3 · Aesthetic & Strength Peak (1–2 RIR)',
      steps: 8000,
      treadmillMin: 25,
      treadmillSpec: '4.5–5.2 km/h · 6–8% incline · Zone 2 (115–136 bpm)',
      cycleMin: 25,
      cycleSpec: '70–80 RPM · Steady Zone 2',
      wedFlushMin: 12,
      satCycleMin: 30,
      satSpec: 'Zone 2 or optional 6 × (1m brisk RPE 7 / 2m easy)'
    };
  },

  PROGRAM: {
    1: {
      title: 'Push A',
      subtitle: 'Chest, Broad Shoulders, Triceps · Posture + Gym Core A',
      lifts: [
        { id: 'mon_bench', name: 'Barbell Bench Press', sets: 3, target: '8–10 reps', rest: 150, cue: 'Shoulder blades pinned down & back, elbows ~45°, 2–3s controlled lowering, zero bounce. Alt: Flat DB Press.' },
        { id: 'mon_inc_db', name: 'Incline DB Chest Press (30°)', sets: 3, target: '10–12 reps', rest: 120, cue: 'Upper-chest priority. Low 30° incline, elbows ~45°, comfortable stretch at outer upper chest. Alt: Incline Chest Machine.' },
        { id: 'mon_db_ohp', name: 'Seated DB Shoulder Press (75°)', sets: 3, target: '10–12 reps', rest: 120, cue: 'Bench 1 notch below vertical, ribs tucked down, elbows 30° forward. Alt: Neutral-Grip DB or Machine Press.' },
        { id: 'mon_lat_raise', name: 'Standing DB Lateral Raises', sets: 4, target: '12–15 reps', rest: 75, cue: 'Shoulder-width priority. Raise 30° forward leading with elbows to shoulder height; 1s pause, slow 2–3s lower.' },
        { id: 'mon_tri_push', name: 'Cable Triceps Pushdown', sets: 3, target: '10–12 reps', rest: 75, cue: 'Elbows pinned to ribs, full lockout squeeze, control return above 90°. Alt: Straight-Bar Pushdown.' }
      ],
      coreLabel: 'Posture & Gym Core A',
      core: [
        { id: 'mon_pullapart', name: 'Cable / Band Pull-Aparts', sets: 2, target: '15 reps (1s squeeze)', rest: 45, weighted: false, repLabel: 'Reps', posture: true, cue: 'Anti-slouch shoulder opener. Keep shoulders down away from ears, pull arms wide squeezing shoulder blades together.' },
        { id: 'mon_pallof', name: 'Cable Pallof Press', sets: 3, target: '10–12 / side (2s hold)', rest: 60, weighted: true, repLabel: 'Reps', cue: 'Stand sideways to cable, press straight forward and resist twisting for 2 seconds.' },
        { id: 'mon_suitcase', name: 'Single-Arm DB Suitcase Carry', sets: 3, target: '30 sec / side', rest: 60, weighted: true, repLabel: 'Sec', posture: true, cue: 'Stand tall and dead-straight against single-side load; trains obliques, grip/forearms, and upright spinal posture.' }
      ],
      cardioType: 'treadmill'
    },
    2: {
      title: 'Pull A',
      subtitle: 'V-Taper Width, Anti-Slouch Upper Back, Biceps · Posture + Home Core A',
      lifts: [
        { id: 'tue_lat_pd', name: 'Wide/Medium-Grip Lat Pulldown', sets: 3, target: '8–12 reps', rest: 120, cue: 'V-taper anchor. Pull shoulder blades down first, drive elbows toward hips, 1s pause at upper chest.' },
        { id: 'tue_cs_row', name: 'Chest-Supported DB Row', sets: 3, target: '10–12 reps', rest: 90, posture: true, cue: '30–45° bench, chest anchored to pad, pull toward lower ribs squeezing mid-back hard for 1s.' },
        { id: 'tue_cable_row', name: 'Seated Cable Row (Neutral V-Grip)', sets: 3, target: '10–12 reps', rest: 120, cue: 'Tall upright spine, pull handle to lower ribs without leaning far backward. Alt: Seated Row Machine.' },
        { id: 'tue_face_pull', name: 'High-Cable Face Pulls', sets: 3, target: '15–20 reps', rest: 60, posture: true, cue: 'Core anti-slouch exercise. Pull rope to forehead while pulling handles apart into double-biceps external rotation.' },
        { id: 'tue_db_curl', name: 'Alternating DB Biceps Curl', sets: 3, target: '10–12 / arm', rest: 75, cue: 'Elbows pinned to ribs, supinate palm upward cleanly, slow 2–3s lowering, zero torso swing.' }
      ],
      coreLabel: 'Posture & Home Core A',
      core: [
        { id: 'tue_wall_slide', name: 'Scapular Wall Slides', sets: 2, target: '10 slow reps', rest: 45, weighted: false, repLabel: 'Reps', posture: true, cue: 'Back & head against wall, ribs down. Slide forearms from W to Y keeping wrists/elbows close to wall.' },
        { id: 'tue_deadbug', name: 'Dead Bug', sets: 3, target: '8 slow / side', rest: 60, weighted: false, repLabel: 'Reps', cue: 'Press lower back flat into floor. Exhale slowly as opposite arm and leg extend without arching.' },
        { id: 'tue_birddog', name: 'Bird-Dog', sets: 3, target: '8 / side (2s hold)', rest: 45, weighted: false, repLabel: 'Reps', posture: true, cue: 'Flat neutral back, reach forward and push heel back without arching lumbar spine.' }
      ],
      cardioType: 'cycle'
    },
    3: {
      title: 'Legs A',
      subtitle: 'Athletic Proportionate Legs (Quads, Posterior Chain, Calves) + Flush Cycle',
      lifts: [
        { id: 'wed_leg_press', name: '45° Leg Press', sets: 3, target: '10–12 reps', rest: 150, cue: 'Tailbone glued to seat pad at all times, knees track over toes, 2–3s descent, no hard knee lockout.' },
        { id: 'wed_db_rdl', name: 'Dumbbell Romanian Deadlift', sets: 3, target: '10–12 reps', rest: 120, cue: 'Soft fixed knee bend, push hips straight back keeping DBs along thighs until hamstring stretch; flat back.' },
        { id: 'wed_goblet', name: 'Dumbbell Goblet Squat', sets: 2, target: '10–12 reps', rest: 120, cue: 'Hold DB at chest, tall upright torso. Elevate heels on 2.5 kg plates if ankles are tight.' },
        { id: 'wed_leg_curl', name: 'Seated / Lying Leg Curl', sets: 3, target: '12–15 reps', rest: 90, cue: 'Align knee with pivot, hips pinned down, 1s peak hamstring squeeze, slow 2–3s return.' },
        { id: 'wed_calves', name: 'Leg-Press Calf Raises', sets: 3, target: '12–15 reps', rest: 60, cue: 'Micro-bend in knees, full 2s bottom stretch, 1s squeeze at top. Zero bouncing.' }
      ],
      coreLabel: null,
      core: [],
      cardioType: 'flush'
    },
    4: {
      title: 'Push B',
      subtitle: 'Upper Chest Priority, 3D Side Delts, Triceps · Posture + Gym Core B',
      lifts: [
        { id: 'thu_inc_db_lead', name: 'Incline DB Chest Press (30°)', sets: 3, target: '8–12 reps', rest: 120, cue: 'Lead fresh for upper-chest fullness. Elbows ~45°, controlled 2–3s descent, smooth press. Alt: Incline Machine.' },
        { id: 'thu_mach_press', name: 'Seated Machine Chest Press', sets: 3, target: '10–12 reps', rest: 120, cue: 'Handles at mid/lower chest, shoulder blades pinned back, never let shoulders roll forward.' },
        { id: 'thu_pec_deck', name: 'Machine Pec Deck Fly', sets: 2, target: '12–15 reps', rest: 90, cue: 'Soft fixed elbow bend, 1s squeeze at center, stop arms aligned with torso (avoid shoulder overstretch).' },
        { id: 'thu_seat_lat', name: 'Seated DB Lateral Raises', sets: 4, target: '12–15 reps', rest: 75, cue: 'Zero body swing for broad delts. Raise 30° forward to shoulder height, 1s hold, slow lower.' },
        { id: 'thu_oh_tri', name: 'Seated Overhead DB Triceps Ext.', sets: 3, target: '10–12 reps', rest: 75, cue: 'Long-head triceps builder. Ribs tucked down, elbows pointed up/slightly forward. Alt: Cable Pushdown.' }
      ],
      coreLabel: 'Posture & Gym Core B',
      core: [
        { id: 'thu_pullapart', name: 'Cable / Band Pull-Aparts', sets: 2, target: '15 reps (1s squeeze)', rest: 45, weighted: false, repLabel: 'Reps', posture: true, cue: 'Counteracts chest pressing tightness; keeps shoulders back and chest open.' },
        { id: 'thu_cable_crunch', name: 'Kneeling Cable Crunch', sets: 3, target: '12–15 reps', rest: 60, weighted: true, repLabel: 'Reps', cue: 'Direct abdominal hypertrophy. Lock hips above knees, exhale and curl ribcage down toward pelvis.' },
        { id: 'thu_suitcase', name: 'Single-Arm DB Suitcase Carry', sets: 2, target: '30 sec / side', rest: 60, weighted: true, repLabel: 'Sec', posture: true, cue: 'Stay completely vertical against the load; steady breathing behind braced abs.' }
      ],
      cardioType: 'treadmill'
    },
    5: {
      title: 'Pull B',
      subtitle: 'Lat Sweep, Rear Delts, Anti-Slouch Mid-Back, Arms/Forearms · Posture + Home Core B',
      lifts: [
        { id: 'fri_vbar_pd', name: 'Close-Grip Neutral Lat Pulldown', sets: 3, target: '10–12 reps', rest: 120, cue: 'Lower-lat V-taper builder. Lean back ~15°, drive elbows straight down to sternum, full stretch at top.' },
        { id: 'fri_sa_row', name: 'Single-Arm Dumbbell Row', sets: 3, target: '10–12 / side', rest: 90, cue: 'Flat tabletop back, pull DB toward hip pocket without twisting torso. Alt: Hand supported on rack.' },
        { id: 'fri_wide_row', name: 'Wide-Grip Seated Row Machine', sets: 3, target: '12–15 reps', rest: 90, posture: true, cue: 'Elbows flared 45–60°, pull toward upper chest, squeeze rhomboids & mid-traps for 1s.' },
        { id: 'fri_rev_fly', name: 'Reverse Pec Deck (Rear Delt Fly)', sets: 3, target: '15–20 reps', rest: 60, posture: true, cue: 'Replaces shrugs for wider-looking 3D shoulders & anti-slouch posture. Sweep arms wide without shrugging traps.' },
        { id: 'fri_hammer', name: 'Standing DB Hammer Curls', sets: 3, target: '10–12 reps', rest: 75, cue: 'Builds biceps thickness & forearms. Neutral palms inward, elbows pinned, slow 2–3s lowering.' }
      ],
      coreLabel: 'Posture & Home Core B',
      core: [
        { id: 'fri_ytw', name: 'Prone Floor Y-T-W Raises', sets: 2, target: '8 reps / shape', rest: 45, weighted: false, repLabel: 'Reps', posture: true, cue: 'Lie face-down, forehead resting on towel. Lift straight thumbs-up arms gently into Y, T, then W squeezing mid-back.' },
        { id: 'fri_side_plank', name: 'Modified Side Plank', sets: 3, target: '20–30 sec / side', rest: 45, weighted: false, repLabel: 'Sec', cue: 'Knees bent 90°, elbow under shoulder, lift hips into a straight line from knees to head.' },
        { id: 'fri_ppt_bridge', name: 'Pelvic-Tilt Glute Bridge', sets: 3, target: '10–12 (3s hold)', rest: 45, weighted: false, repLabel: 'Reps', posture: true, cue: 'Fixes anterior pelvic tilt from sitting. Flatten lower back to floor before lifting; squeeze glutes 3s.' }
      ],
      cardioType: 'treadmill'
    },
    6: {
      title: 'Legs B',
      subtitle: 'Glutes, Hamstrings, Single-Leg Athleticism & Calves + Endurance Cycle',
      lifts: [
        { id: 'sat_glute_bridge', name: 'DB Glute Bridge / Hip Thrust', sets: 3, target: '10–12 reps', rest: 120, posture: true, cue: 'Builds glute power & pelvic alignment. Tuck pelvis slightly, drive through heels, 2s hard squeeze.' },
        { id: 'sat_hi_lp', name: 'High-Foot 45° Leg Press', sets: 3, target: '10–12 reps', rest: 120, cue: 'Feet high & slightly wider for glutes/hamstrings; tailbone pinned to seat, drive through heels.' },
        { id: 'sat_leg_ext', name: 'Seated Leg Extension', sets: 2, target: '12–15 reps', rest: 90, cue: 'Quad definition without excessive volume. Align knee with pivot, 1s top squeeze, slow 2–3s lower.' },
        { id: 'sat_leg_curl', name: 'Lying / Seated Leg Curl', sets: 3, target: '12–15 reps', rest: 90, cue: 'Use alternate machine from Wednesday if available; keep hips firmly anchored to pad.' },
        { id: 'sat_split_sq', name: 'Hand-Supported Split Squat', sets: 2, target: '8–10 / leg', rest: 90, cue: 'Light hand on rack for balance, hip-width stance, lower back knee straight down. Bodyweight Wks 1–4.' },
        { id: 'sat_calves', name: 'Standing / Machine Calf Raises', sets: 2, target: '12–15 reps', rest: 60, cue: 'Full bottom stretch + 1s top pause for balanced athletic lower legs.' }
      ],
      coreLabel: null,
      core: [],
      cardioType: 'sat_cycle'
    },
    0: {
      title: 'Rest & Weekly Weigh-In',
      subtitle: 'Full muscular recovery + Sunday morning body weight check',
      lifts: [],
      coreLabel: 'Optional 3-Min Posture Reset',
      core: [
        { id: 'sun_wall_slide', name: 'Scapular Wall Slides', sets: 2, target: '10 slow reps', rest: 30, weighted: false, repLabel: 'Reps', posture: true, cue: 'Light zero-fatigue posture check to keep shoulders open and upper back tall.' }
      ],
      cardioType: null
    }
  }
};
