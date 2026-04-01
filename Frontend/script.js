/* ── Stars ─────────────────────────────── */
  (function(){
    const c = document.getElementById('stars');
    if(!c) { console.warn('Stars container not found'); return; }
    for(let i=0;i<70;i++){
      const s=document.createElement('div');
      s.className='star';
      s.style.cssText=`
        left:${Math.random()*100}%;
        top:${Math.random()*100}%;
        animation-duration:${2+Math.random()*4}s;
        animation-delay:${Math.random()*5}s;
        width:${1+Math.random()*3}px;
        height:${1+Math.random()*3}px;
      `;
      c.appendChild(s);
    }
  })();

  /* ── Page Routing ───────────────────────── */
  function goTo(role){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    if(role==='home'){
      document.getElementById('page-home').classList.add('active');
    } else if(role==='patient'){
      document.getElementById('page-patient').classList.add('active');
      window.scrollTo({top:0,behavior:'smooth'});
    } else if(role==='patient-detail'){
      document.getElementById('page-patient-detail').classList.add('active');
      window.scrollTo({top:0,behavior:'smooth'});
    } else if(role==='doctor'){
      document.getElementById('page-doctor').classList.add('active');
      window.scrollTo({top:0,behavior:'smooth'});
    }
  }

  /* ── Mood Selector ──────────────────────── */
  function selectMood(el){
    el.closest('.mood-emojis').querySelectorAll('span').forEach(s=>s.classList.remove('active'));
    el.classList.add('active');
    const labels=['Rough','Okay','Good','Great','Amazing'];
    const idx=[...el.parentNode.children].indexOf(el);
    showToast('Mood logged: '+labels[idx]+' '+el.textContent);
  }

  /* ── Toast ──────────────────────────────── */
  let toastTimer;
  const affirmationLibrary = [
    'You are doing your best, and that is enough.',
    'I can move through today with softness instead of pressure.',
    'I am allowed to rest without earning it first.',
    'My feelings are valid, even when they are hard to explain.',
    'I can take this moment one breath at a time.',
    'Small progress still deserves to be celebrated.',
    'I do not need to carry everything all at once.'
  ];
  const meditationSteps = [
    {
      title: 'Close your eyes',
      text: 'Let your body settle. Unclench your jaw, soften your shoulders, and allow your breath to slow down naturally.'
    },
    {
      title: 'Relax your shoulders',
      text: 'Let your shoulders drop away from your ears and soften the muscles around your neck.'
    },
    {
      title: 'Focus on your breath',
      text: 'Notice the cool air in, warm air out. You do not need to change the breath. Just follow it.'
    },
    {
      title: 'Scan from head to toe',
      text: 'Notice your forehead, jaw, chest, belly, hips, and legs. Invite each area to soften.'
    },
    {
      title: 'Return gently',
      text: 'Choose one word for the rest of your day: calm, steady, gentle, or grounded.'
    }
  ];
  let meditationIndex = 0;
  let breathInterval;
  let breathTimerInterval;
  let breathPhase = 0;
  let breathElapsed = 0;
  let breathRunning = false;
  const phases=['Inhale','Hold','Exhale'];
  const durations=[4,7,8];
  const soundscapeState = {
    currentTrack: 'Ocean Waves',
    duration: 240,
    currentTime: 0,
    volume: 70,
    loop: false,
    isPlaying: false,
    timer: null
  };
  const meditationState = {
    duration: 300,
    currentTime: 0,
    isPlaying: false,
    timer: null,
    voiceOn: true
  };

  function showToast(msg){
    const t=document.getElementById('toast');
    t.textContent=msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>t.classList.remove('show'),3000);
  }

  function showOverlay(id){
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = 'flex';
    requestAnimationFrame(() => el.classList.add('open'));
    document.body.style.overflow = 'hidden';
  }

  function hideOverlay(id){
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('open');
    el.style.display = 'none';
    document.body.style.overflow = '';
  }

  /* ── Breathing ──────────────────────────── */
  function openBreath(){
    showOverlay('breathOverlay');
    resetBreathSession();
  }
  function runBreathPhase(){
    const c=document.getElementById('breathCircle');
    const t=document.getElementById('breathText');
    const phaseName = phases[breathPhase];
    c.textContent=phaseName;
    document.getElementById('breathPhaseLabel').textContent = phaseName;
    t.textContent=breathPhase===0?'Inhale for 4 seconds through your nose':
                  breathPhase===1?'Hold softly for 7 seconds':
                  'Exhale for 8 seconds and let your shoulders soften';
    c.style.animationDuration = `${durations[breathPhase]}s`;
    breathInterval=setTimeout(()=>{
      breathPhase=(breathPhase+1)%phases.length;
      if (breathRunning) runBreathPhase();
    },durations[breathPhase] * 1000);
  }
  function updateBreathTimer() {
    breathElapsed += 1;
    const mins = String(Math.floor(breathElapsed / 60)).padStart(2, '0');
    const secs = String(breathElapsed % 60).padStart(2, '0');
    document.getElementById('breathTimer').textContent = `${mins}:${secs}`;
  }
  function startBreathSession() {
    if (breathRunning) return;
    breathRunning = true;
    runBreathPhase();
    breathTimerInterval = setInterval(updateBreathTimer, 1000);
  }
  function pauseBreathSession() {
    breathRunning = false;
    clearTimeout(breathInterval);
    clearInterval(breathTimerInterval);
    document.getElementById('breathPhaseLabel').textContent = 'Paused';
    document.getElementById('breathText').textContent = 'Take a moment here. Press start when you are ready again.';
  }
  function resetBreathSession() {
    breathRunning = false;
    clearTimeout(breathInterval);
    clearInterval(breathTimerInterval);
    breathPhase = 0;
    breathElapsed = 0;
    document.getElementById('breathCircle').textContent = 'Inhale';
    document.getElementById('breathPhaseLabel').textContent = 'Ready';
    document.getElementById('breathText').textContent = 'Press start and breathe gently with the circle.';
    document.getElementById('breathTimer').textContent = '00:00';
  }
  function closeBreath(){
    resetBreathSession();
    hideOverlay('breathOverlay');
    showToast('Breathing session complete 🫁 Well done!');
  }

  /* ── Sound ──────────────────────────────── */
  function openSound(){
    showOverlay('soundOverlay');
    renderSoundPlayer();
  }
  function closeSound(){
    pauseSoundTimer();
    hideOverlay('soundOverlay');
  }
  function fetchSoundscapeTrack(name) {
    return { name, source: null };
  }
  function pauseSoundTimer() {
    if (soundscapeState.timer) clearInterval(soundscapeState.timer);
    soundscapeState.timer = null;
    soundscapeState.isPlaying = false;
  }
  function formatTime(value) {
    const mins = String(Math.floor(value / 60)).padStart(2, '0');
    const secs = String(Math.floor(value % 60)).padStart(2, '0');
    return `${mins}:${secs}`;
  }
  function renderSoundPlayer() {
    document.getElementById('soundTrackName').textContent = soundscapeState.currentTrack;
    document.getElementById('soundCurrentTime').textContent = formatTime(soundscapeState.currentTime);
    document.getElementById('soundDuration').textContent = formatTime(soundscapeState.duration);
    document.getElementById('soundProgress').max = soundscapeState.duration;
    document.getElementById('soundProgress').value = soundscapeState.currentTime;
    document.getElementById('soundPlayBtn').textContent = soundscapeState.isPlaying ? 'Pause' : 'Play';
    document.getElementById('soundLoopBtn').textContent = soundscapeState.loop ? 'Loop On' : 'Loop Off';
    document.getElementById('soundNowPlaying').textContent = 'Placeholder player ready. Replace `fetchSoundscapeTrack()` with real backend/audio integration later.';
  }
  function selectSoundscape(name, duration = 240, buttonEl){
    fetchSoundscapeTrack(name);
    soundscapeState.currentTrack = name;
    soundscapeState.duration = duration;
    soundscapeState.currentTime = 0;
    document.querySelectorAll('.sound-option').forEach(btn => btn.classList.remove('active'));
    if (buttonEl) buttonEl.classList.add('active');
    renderSoundPlayer();
  }
  function toggleSoundPlayback(){
    if (soundscapeState.isPlaying) {
      pauseSoundTimer();
    } else {
      soundscapeState.isPlaying = true;
      soundscapeState.timer = setInterval(() => {
        soundscapeState.currentTime += 1;
        if (soundscapeState.currentTime >= soundscapeState.duration) {
          if (soundscapeState.loop) {
            soundscapeState.currentTime = 0;
          } else {
            pauseSoundTimer();
          }
        }
        renderSoundPlayer();
      }, 1000);
    }
    renderSoundPlayer();
  }
  function seekSoundscape(value){
    soundscapeState.currentTime = Number(value);
    renderSoundPlayer();
  }
  function setSoundVolume(value){
    soundscapeState.volume = Number(value);
  }
  function toggleSoundLoop(){
    soundscapeState.loop = !soundscapeState.loop;
    renderSoundPlayer();
  }

  function openMeditation(){
    resetMeditationSession();
    seedMeditationParticles();
    showOverlay('meditationOverlay');
  }
  function closeMeditation(){
    pauseMeditationTimer();
    hideOverlay('meditationOverlay');
  }
  function updateMeditationStep(){
    const step = meditationSteps[meditationIndex];
    document.getElementById('meditationStepTitle').textContent = step.title;
    document.getElementById('meditationStepText').textContent = step.text;
  }
  function renderMeditationPlayer() {
    document.getElementById('meditationCurrentTime').textContent = formatTime(meditationState.currentTime);
    document.getElementById('meditationDuration').textContent = formatTime(meditationState.duration);
    document.getElementById('meditationProgressBar').style.width = `${(meditationState.currentTime / meditationState.duration) * 100}%`;
    document.getElementById('meditationPlayBtn').textContent = meditationState.isPlaying ? 'Pause' : 'Play';
    document.getElementById('meditationVoiceBtn').textContent = meditationState.voiceOn ? 'Voice On' : 'Voice Off';
  }
  function pauseMeditationTimer() {
    if (meditationState.timer) clearInterval(meditationState.timer);
    meditationState.timer = null;
    meditationState.isPlaying = false;
  }
  function toggleMeditationPlayback() {
    if (meditationState.isPlaying) {
      pauseMeditationTimer();
    } else {
      meditationState.isPlaying = true;
      meditationState.timer = setInterval(() => {
        meditationState.currentTime += 1;
        if (meditationState.currentTime % 60 === 0) {
          meditationIndex = (meditationIndex + 1) % meditationSteps.length;
          updateMeditationStep();
        }
        if (meditationState.currentTime >= meditationState.duration) {
          pauseMeditationTimer();
          meditationState.currentTime = meditationState.duration;
        }
        renderMeditationPlayer();
      }, 1000);
    }
    renderMeditationPlayer();
  }
  function toggleMeditationVoice() {
    meditationState.voiceOn = !meditationState.voiceOn;
    renderMeditationPlayer();
  }
  function resetMeditationSession() {
    pauseMeditationTimer();
    meditationState.currentTime = 0;
    meditationIndex = 0;
    updateMeditationStep();
    renderMeditationPlayer();
  }
  function seedMeditationParticles() {
    const field = document.getElementById('meditationParticles');
    if (!field || field.children.length) return;
    for (let i = 0; i < 18; i++) {
      const particle = document.createElement('span');
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.bottom = `${Math.random() * 20}%`;
      particle.style.animationDelay = `${Math.random() * 6}s`;
      particle.style.animationDuration = `${6 + Math.random() * 6}s`;
      field.appendChild(particle);
    }
  }
  function nextMeditationStep(){
    meditationIndex = (meditationIndex + 1) % meditationSteps.length;
    updateMeditationStep();
  }
  function previousMeditationStep(){
    meditationIndex = (meditationIndex - 1 + meditationSteps.length) % meditationSteps.length;
    updateMeditationStep();
  }

  /* ── Creative Canvas Logic ────────────────── */
  let drawing = false;
  let drawColor = '#ffffff';
  let brushSizeValue = 6;
  let isEraser = false;
  let creativeTool = 'pencil';
  let lastX = 0;
  let lastY = 0;
  let creativeCtx = null;
  let creativeCanvas = null;
  let canvasHistory = [];
  let canvasRedoStack = [];

  function initCreativeCanvas() {
    creativeCanvas = document.getElementById('creativeCanvas');
    if (!creativeCanvas) return;
    creativeCtx = creativeCanvas.getContext('2d');
    
    // Resize to container
    const parent = creativeCanvas.parentElement;
    creativeCanvas.width = parent.clientWidth;
    creativeCanvas.height = Math.min(window.innerHeight * 0.45, 400);

    creativeCtx.lineJoin = 'round';
    creativeCtx.lineCap = 'round';
    creativeCtx.strokeStyle = drawColor;
    creativeCtx.lineWidth = brushSizeValue;
    saveCanvasState();

    if (!creativeCanvas.dataset.bound) {
      creativeCanvas.addEventListener('mousedown', startDrawing);
      creativeCanvas.addEventListener('mousemove', draw);
      creativeCanvas.addEventListener('mouseup', stopDrawing);
      creativeCanvas.addEventListener('mouseout', stopDrawing);

      creativeCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        startDrawing({ clientX: touch.clientX, clientY: touch.clientY });
      });
      creativeCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        draw({ clientX: touch.clientX, clientY: touch.clientY });
      });
      creativeCanvas.addEventListener('touchend', stopDrawing);
      creativeCanvas.dataset.bound = 'true';
    }
  }

  function startDrawing(e) {
    drawing = true;
    const rect = creativeCanvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
    saveCanvasState();
  }

  function draw(e) {
    if (!drawing) return;
    const rect = creativeCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    creativeCtx.beginPath();
    creativeCtx.moveTo(lastX, lastY);
    creativeCtx.lineTo(x, y);
    creativeCtx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    creativeCtx.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : drawColor;
    creativeCtx.lineWidth = creativeTool === 'brush' ? brushSizeValue * 1.8 : brushSizeValue;
    creativeCtx.stroke();
    
    [lastX, lastY] = [x, y];
  }

  function stopDrawing() { drawing = false; }
  function saveCanvasState() {
    if (!creativeCanvas) return;
    canvasHistory.push(creativeCanvas.toDataURL());
    if (canvasHistory.length > 40) canvasHistory.shift();
    canvasRedoStack = [];
  }

  function setDrawColor(el) {
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    drawColor = el.dataset.color;
    isEraser = false;
    document.getElementById('eraserBtn').classList.remove('active');
    setCreativeTool('pencil');
  }
  function setCustomColor(value) {
    drawColor = value;
    isEraser = false;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    setCreativeTool('pencil');
  }
  function setCreativeTool(tool) {
    creativeTool = tool;
    isEraser = false;
    document.getElementById('pencilBtn').classList.toggle('active', tool === 'pencil');
    document.getElementById('brushBtn').classList.toggle('active', tool === 'brush');
    document.getElementById('eraserBtn').classList.remove('active');
  }

  function toggleEraser() {
    isEraser = !isEraser;
    creativeTool = 'pencil';
    document.getElementById('eraserBtn').classList.toggle('active', isEraser);
    document.getElementById('pencilBtn').classList.remove('active');
    document.getElementById('brushBtn').classList.remove('active');
  }

  function updateBrushSize(val) {
    brushSizeValue = parseInt(val);
  }

  function clearCanvas() {
    if (creativeCtx) {
      saveCanvasState();
      creativeCtx.clearRect(0, 0, creativeCanvas.width, creativeCanvas.height);
    }
  }
  function restoreCanvas(dataUrl) {
    if (!creativeCtx || !dataUrl) return;
    const image = new Image();
    image.onload = () => {
      creativeCtx.clearRect(0, 0, creativeCanvas.width, creativeCanvas.height);
      creativeCtx.drawImage(image, 0, 0);
    };
    image.src = dataUrl;
  }
  function undoCanvas() {
    if (canvasHistory.length < 2) return;
    const current = canvasHistory.pop();
    canvasRedoStack.push(current);
    restoreCanvas(canvasHistory[canvasHistory.length - 1]);
  }
  function redoCanvas() {
    if (!canvasRedoStack.length) return;
    const next = canvasRedoStack.pop();
    canvasHistory.push(next);
    restoreCanvas(next);
  }
  function saveCanvasDrawing() {
    if (!creativeCanvas) return;
    const link = document.createElement('a');
    link.href = creativeCanvas.toDataURL('image/png');
    link.download = 'innervoice-stress-buster-drawing.png';
    link.click();
    showToast('Drawing saved locally ✨');
  }

  function openCreative(){
    showOverlay('creativeOverlay');
    setTimeout(initCreativeCanvas, 100);
  }
  function closeCreative(){
    hideOverlay('creativeOverlay');
  }

  /* ── Grounding Steps Logic ────────────────── */
  let groundingStep = 0;
  const groundingSteps = [
    { title: 'Notice 5 things you can <strong style="color:var(--lavender)">see</strong>', icon: '👁️', desc: 'Look around slowly. Name 5 things you can see right now — a color, a shape, a texture. Say them quietly to yourself.', count: 5 },
    { title: 'Notice 4 things you can <strong style="color:var(--lavender)">feel</strong>', icon: '✋', desc: 'Acknowledge 4 things you can feel against your skin — your feet on the floor, the fabric of your clothes, or a cool breeze.', count: 4 },
    { title: 'Notice 3 things you can <strong style="color:var(--lavender)">hear</strong>', icon: '👂', desc: 'Listen attentively. Can you hear the hum of a fridge, distant traffic, or your own breath? Name 3 distinct sounds.', count: 3 },
    { title: 'Notice 2 things you can <strong style="color:var(--lavender)">smell</strong>', icon: '👃', desc: 'Take a deep breath. Can you smell coffee, rain, or even just the scent of the air around you? Identify 2 smells.', count: 2 },
    { title: 'Notice 1 thing you can <strong style="color:var(--lavender)">taste</strong>', icon: '👅', desc: 'Bring your focus to your mouth. What can you taste? Maybe the last thing you drank, or just the natural state of your mouth.', count: 1 }
  ];

  function openGrounding(){
    groundingStep = 0;
    updateGroundingUI();
    showOverlay('groundingOverlay');
  }
  function updateGroundingUI() {
    const step = groundingSteps[groundingStep];
    const badge = document.getElementById('groundingStepBadge');
    const icon = document.getElementById('groundingIcon');
    const title = document.getElementById('groundingTitle');
    const desc = document.getElementById('groundingDesc');
    const inputsWrap = document.getElementById('groundingInputs');
    const dots = document.querySelectorAll('.g-dot');
    const btn = document.getElementById('groundingNextBtn');
    const progress = document.getElementById('groundingProgressBar');

    badge.textContent = `Step ${groundingStep + 1} of 5`;
    icon.textContent = step.icon;
    title.innerHTML = step.title;
    desc.textContent = step.desc;
    
    // Generate input slots
    inputsWrap.innerHTML = '';
    for(let i=0; i < step.count; i++) {
        const inp = document.createElement('input');
        inp.className = 'grounding-input';
        inp.placeholder = `I ${step.icon === '👁️' ? 'see' : step.icon === '✋' ? 'feel' : step.icon === '👂' ? 'hear' : step.icon === '👃' ? 'smell' : 'taste'}...`;
        inputsWrap.appendChild(inp);
    }

    dots.forEach((d, idx) => {
        d.className = 'g-dot';
        if (idx === groundingStep) d.classList.add('active');
        if (idx < groundingStep) d.classList.add('complete');
    });
    progress.style.width = `${((groundingStep + 1) / groundingSteps.length) * 100}%`;

    btn.textContent = groundingStep === 4 ? 'Finish 🍃' : 'Next Step →';
  }

  function groundingNext() {
    if (groundingStep < 4) {
        groundingStep++;
        updateGroundingUI();
    } else {
        closeGrounding();
        showToast('You are grounded and present. 🌿');
    }
  }

  function groundingPrev() {
    if (groundingStep > 0) {
        groundingStep--;
        updateGroundingUI();
    }
  }

  function closeGrounding(){
    hideOverlay('groundingOverlay');
  }

  function refreshAffirmation(){
    const quote = affirmationLibrary[Math.floor(Math.random() * affirmationLibrary.length)];
    const quoteEl = document.getElementById('affirmationQuote');
    quoteEl.classList.remove('affirmation-fade');
    void quoteEl.offsetWidth;
    quoteEl.textContent = quote;
    quoteEl.classList.add('affirmation-fade');
    currentInsightQuote = quote;
  }
  let affirmationMusicOn = false;
  function openAffirmations(){
    refreshAffirmation();
    showOverlay('affirmationOverlay');
  }
  function closeAffirmations(){
    hideOverlay('affirmationOverlay');
  }
  function toggleAffirmationMusic() {
    affirmationMusicOn = !affirmationMusicOn;
    document.getElementById('affirmationMusicBtn').textContent = affirmationMusicOn ? 'Music On' : 'Music Off';
    showToast(affirmationMusicOn ? 'Background music placeholder enabled 🎵' : 'Background music off');
  }
  function shareAffirmation() {
    if (!currentInsightQuote) return;
    const shareText = currentInsightQuote;
    if (navigator.share) {
      navigator.share({ title: 'InnerVoiceAI Affirmation', text: shareText }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => showToast('Affirmation copied to clipboard 💌'));
    } else {
      showToast('Sharing is not supported in this browser');
    }
  }

  function bindStressBusterButtons() {
    const bindings = [
      ['breathingBtn', openBreath],
      ['soundBtn', openSound],
      ['meditationBtn', openMeditation],
      ['creativeBtn', openCreative],
      ['groundingBtn', openGrounding],
      ['affirmationsBtn', openAffirmations]
    ];

    bindings.forEach(([id, handler]) => {
      const button = document.getElementById(id);
      if (!button) return;
      button.addEventListener('click', (event) => {
        event.preventDefault();
        handler();
      });
    });
  }

  window.openBreath = openBreath;
  window.closeBreath = closeBreath;
  window.openSound = openSound;
  window.closeSound = closeSound;
  window.selectSoundscape = selectSoundscape;
  window.openMeditation = openMeditation;
  window.closeMeditation = closeMeditation;
  window.nextMeditationStep = nextMeditationStep;
  window.previousMeditationStep = previousMeditationStep;
  window.toggleMeditationPlayback = toggleMeditationPlayback;
  window.toggleMeditationVoice = toggleMeditationVoice;
  window.openCreative = openCreative;
  window.closeCreative = closeCreative;
  window.setDrawColor = setDrawColor;
  window.setCustomColor = setCustomColor;
  window.setCreativeTool = setCreativeTool;
  window.toggleEraser = toggleEraser;
  window.updateBrushSize = updateBrushSize;
  window.clearCanvas = clearCanvas;
  window.undoCanvas = undoCanvas;
  window.redoCanvas = redoCanvas;
  window.saveCanvasDrawing = saveCanvasDrawing;
  window.openGrounding = openGrounding;
  window.closeGrounding = closeGrounding;
  window.groundingNext = groundingNext;
  window.groundingPrev = groundingPrev;
  window.openAffirmations = openAffirmations;
  window.closeAffirmations = closeAffirmations;
  window.refreshAffirmation = refreshAffirmation;
  window.toggleSoundPlayback = toggleSoundPlayback;
  window.seekSoundscape = seekSoundscape;
  window.setSoundVolume = setSoundVolume;
  window.toggleSoundLoop = toggleSoundLoop;
  window.startBreathSession = startBreathSession;
  window.pauseBreathSession = pauseBreathSession;
  window.resetBreathSession = resetBreathSession;
  window.toggleAffirmationMusic = toggleAffirmationMusic;
  window.shareAffirmation = shareAffirmation;

  /* ── Keyboard accessibility ─────────────── */
  document.querySelectorAll('.role-card').forEach(card=>{
    card.addEventListener('keypress',e=>{
      if(e.key==='Enter'||e.key===' ') card.click();
    });
  });

  /* ════════════════════════════════════════
     BUBBLE GARDEN ENGINE
  ════════════════════════════════════════ */
  let bubbles = [];
  let gardenAnimId = null;
  let gardenCtx = null;
  let gardenCanvas = null;
  let gardenReleasedCount = 0;
  let selectedThought = null;
  let gardenOpen = false;
  const bubblePopSoundUrl = new URL('bubblesound.mp3', window.location.href).href;
  const bubblePopAudio = new Audio(bubblePopSoundUrl);
  bubblePopAudio.preload = 'auto';

  function playBubblePopSound() {
    try {
      const sound = new Audio(bubblePopSoundUrl);
      sound.preload = 'auto';
      sound.volume = 0.8;
      sound.play().catch(() => {});
    } catch (err) {
      console.error('Bubble sound failed:', err);
    }
  }

  /* Affirmations per thought label */
  const affirmations = {
    'Anxiety':      'Anxiety is just energy looking for somewhere to go. You are safe right now.',
    'Overthinking': 'Your mind is trying to protect you. You can rest it now — just for a moment.',
    'Doubt':        'Doubt is not failure. It is wisdom asking to be heard, gently.',
    'Worry':        'Worry is love with nowhere to land. You can set it down.',
    'Tension':      'Your body held that so you didn\'t have to. It is allowed to soften now.',
    'Fear':         'Fear lives in the future. You are here, in this breath, and that is enough.',
    'Sadness':      'Sadness is tenderness asking to be seen. It too shall pass like weather.',
    'Pressure':     'You do not have to carry it all. Piece by piece, it dissolves.',
    'Anger':        'Anger has a message. Once heard, it no longer needs to shout.',
    'Loneliness':   'Even in solitude, you are held by something larger than you can see.',
    'Shame':        'You are not your worst moment. You never were.',
    'Exhaustion':   'Rest is not laziness. Rest is the soil in which growth happens.',
    'default':      'Whatever you are releasing, you are allowed to let it go. Right now.'
  };

  /* Colour palettes for bubbles — purples, cloud blues, lavenders */
  const bubblePalettes = [
    { fill:'rgba(197,216,240,', stroke:'rgba(255,255,255,', shine:'rgba(255,255,255,' },
    { fill:'rgba(212,200,245,', stroke:'rgba(255,255,255,', shine:'rgba(255,255,255,' },
    { fill:'rgba(184,216,200,', stroke:'rgba(255,255,255,', shine:'rgba(255,255,255,' },
    { fill:'rgba(240,230,255,', stroke:'rgba(212,200,245,', shine:'rgba(255,255,255,' },
    { fill:'rgba(180,200,240,', stroke:'rgba(255,255,255,', shine:'rgba(255,255,255,' },
    { fill:'rgba(220,210,250,', stroke:'rgba(255,255,255,', shine:'rgba(255,255,255,' },
  ];

  class Bubble {
    constructor(x, y, radius, label) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.label = label || null;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = -(0.3 + Math.random() * 0.5); // float upward
      this.opacity = 0;
      this.targetOpacity = 0.82;
      this.popping = false;
      this.popProgress = 0;
      this.popParticles = [];
      this.born = Date.now();
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.015 + Math.random() * 0.01;
      this.palette = bubblePalettes[Math.floor(Math.random() * bubblePalettes.length)];
      this.scale = 0;          // for spawn scale-in
      this.targetScale = 1;
    }

    update() {
      if (this.popping) {
        this.popProgress += 0.045;
        this.opacity -= 0.06;
        this.scale += 0.06;
        this.popParticles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.04; // gravity
          p.life -= 0.035;
        });
        return;
      }
      // Scale in on spawn
      if (this.scale < this.targetScale) {
        this.scale = Math.min(this.targetScale, this.scale + 0.07);
      }
      // Fade in
      if (this.opacity < this.targetOpacity) {
        this.opacity = Math.min(this.targetOpacity, this.opacity + 0.04);
      }
      // Float
      this.wobble += this.wobbleSpeed;
      this.x += this.vx + Math.sin(this.wobble * 0.5) * 0.25;
      this.y += this.vy;
      // Gentle wall bounce (horizontal)
      if (this.x - this.radius < 0) { this.x = this.radius; this.vx = Math.abs(this.vx); }
      if (this.x + this.radius > gardenCanvas.width) { this.x = gardenCanvas.width - this.radius; this.vx = -Math.abs(this.vx); }
      // Slow drift — gradually reduce upward speed
      this.vy *= 0.998;
      if (this.vy > -0.1) this.vy = -0.1; // min upward drift
    }

    pop() {
      if (this.popping) return;
      this.popping = true;
      playBubblePopSound();
      // spawn sparkle particles
      const count = 10 + Math.floor(Math.random() * 8);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.4;
        const speed = 1.5 + Math.random() * 2.5;
        this.popParticles.push({
          x: this.x, y: this.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          life: 1,
          r: 2 + Math.random() * 3,
          color: this.palette.fill
        });
      }
      gardenReleasedCount++;
      document.getElementById('gardenCount').textContent = gardenReleasedCount;
      // Show affirmation
      const aff = this.label ? (affirmations[this.label] || affirmations.default) : affirmations.default;
      showGardenAffirmation(aff);
    }

    draw(ctx) {
      if (this.popping && this.opacity <= 0 && this.popProgress > 0.5) return;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(this.scale, this.scale);

      const r = this.radius;
      const alpha = Math.max(0, this.opacity);

      // Main bubble body
      const grad = ctx.createRadialGradient(-r*0.25, -r*0.3, r*0.05, 0, 0, r);
      grad.addColorStop(0,   this.palette.fill + '0.22)');
      grad.addColorStop(0.5, this.palette.fill + '0.12)');
      grad.addColorStop(1,   this.palette.fill + '0.32)');
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.globalAlpha = alpha;
      ctx.fill();

      // Outer border — iridescent ring
      const borderGrad = ctx.createLinearGradient(-r, -r, r, r);
      borderGrad.addColorStop(0,   this.palette.stroke + '0.9)');
      borderGrad.addColorStop(0.3, 'rgba(212,200,245,0.7)');
      borderGrad.addColorStop(0.6, this.palette.fill + '0.5)');
      borderGrad.addColorStop(1,   this.palette.stroke + '0.8)');
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = borderGrad;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Inner shimmer ring
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 0.6;
      ctx.stroke();

      // Main shine highlight (top-left crescent)
      const shineGrad = ctx.createRadialGradient(-r*0.3, -r*0.38, 0, -r*0.22, -r*0.28, r*0.5);
      shineGrad.addColorStop(0,   'rgba(255,255,255,0.72)');
      shineGrad.addColorStop(0.4, 'rgba(255,255,255,0.28)');
      shineGrad.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.ellipse(-r*0.22, -r*0.3, r*0.28, r*0.18, -Math.PI/4, 0, Math.PI*2);
      ctx.fillStyle = shineGrad;
      ctx.fill();

      // Small secondary specular dot
      ctx.beginPath();
      ctx.arc(-r*0.38, -r*0.38, r*0.07, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fill();

      // Bottom-right inner glow (gives depth)
      const bglow = ctx.createRadialGradient(r*0.3, r*0.3, 0, r*0.3, r*0.3, r*0.5);
      bglow.addColorStop(0, this.palette.fill + '0.25)');
      bglow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = bglow;
      ctx.fill();

      // Label text
      if (this.label && r > 22 && !this.popping) {
        ctx.fillStyle = 'rgba(30,19,64,0.72)';
        const fontSize = Math.max(9, Math.min(13, r * 0.28));
        ctx.font = `300 ${fontSize}px "DM Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, 0, 0);
      }

      ctx.restore();

      // Pop burst particles (drawn in world space)
      if (this.popping) {
        this.popParticles.forEach(p => {
          if (p.life <= 0) return;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.life) * alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color + '0.8)';
          ctx.fill();
          // tiny shine on particle
          ctx.beginPath();
          ctx.arc(p.x - p.r*0.2, p.y - p.r*0.2, p.r*0.35, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.fill();
          ctx.restore();
        });
      }
    }

    isDead() {
      if (this.popping) return this.opacity <= 0 && this.popParticles.every(p => p.life <= 0);
      // remove bubbles that float off the top
      return this.y + this.radius < -30;
    }

    contains(px, py) {
      const dx = px - this.x, dy = py - this.y;
      return Math.sqrt(dx*dx + dy*dy) <= this.radius;
    }
  }

  /* ── Garden Open / Close ─────────────────── */
  function openGarden() {
    document.getElementById('bubbleOverlay').classList.add('open');
    gardenOpen = true;
    document.body.style.overflow = 'hidden';
    initGardenCanvas();
    // spawn a few welcoming bubbles
    setTimeout(() => spawnBurst(6), 400);
  }

  function closeGarden() {
    document.getElementById('bubbleOverlay').classList.remove('open');
    gardenOpen = false;
    document.body.style.overflow = '';
    if (gardenAnimId) { cancelAnimationFrame(gardenAnimId); gardenAnimId = null; }
  }

  /* ── Canvas Init ─────────────────────────── */
  function initGardenCanvas() {
    gardenCanvas = document.getElementById('bubbleCanvas');
    gardenCtx = gardenCanvas.getContext('2d');
    resizeGardenCanvas();
    if (gardenAnimId) cancelAnimationFrame(gardenAnimId);
    gardenLoop();

    // Click to spawn / pop
    gardenCanvas.onclick = (e) => {
      const rect = gardenCanvas.getBoundingClientRect();
      const scaleX = gardenCanvas.width / rect.width;
      const scaleY = gardenCanvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      // Check if clicked a bubble (pop it)
      let popped = false;
      for (let i = bubbles.length - 1; i >= 0; i--) {
        if (!bubbles[i].popping && bubbles[i].contains(mx, my)) {
          bubbles[i].pop();
          popped = true;
          break;
        }
      }
      // Otherwise spawn a new bubble
      if (!popped) {
        const r = 28 + Math.random() * 32;
        const label = selectedThought;
        bubbles.push(new Bubble(mx, my, r, label));
        hideGardenHint();
      }
    };

    // Touch support
    gardenCanvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = gardenCanvas.getBoundingClientRect();
      const scaleX = gardenCanvas.width / rect.width;
      const scaleY = gardenCanvas.height / rect.height;
      const mx = (touch.clientX - rect.left) * scaleX;
      const my = (touch.clientY - rect.top) * scaleY;
      let popped = false;
      for (let i = bubbles.length - 1; i >= 0; i--) {
        if (!bubbles[i].popping && bubbles[i].contains(mx, my)) {
          bubbles[i].pop(); popped = true; break;
        }
      }
      if (!popped) {
        const r = 28 + Math.random() * 32;
        bubbles.push(new Bubble(mx, my, r, selectedThought));
        hideGardenHint();
      }
    }, { passive: false });
  }

  function resizeGardenCanvas() {
    if (!gardenCanvas) return;
    const wrap = document.getElementById('gardenWrap');
    gardenCanvas.width  = wrap.clientWidth;
    gardenCanvas.height = wrap.clientHeight;
  }
  window.addEventListener('resize', resizeGardenCanvas);

  /* ── Render Loop ─────────────────────────── */
  function gardenLoop() {
    if (!gardenOpen) return;
    gardenCtx.clearRect(0, 0, gardenCanvas.width, gardenCanvas.height);

    // Subtle starfield
    drawGardenStars();

    bubbles.forEach(b => { b.update(); b.draw(gardenCtx); });
    bubbles = bubbles.filter(b => !b.isDead());

    gardenAnimId = requestAnimationFrame(gardenLoop);
  }

  /* Very faint star layer on the canvas */
  let gardenStars = null;
  function drawGardenStars() {
    if (!gardenStars || gardenStars.w !== gardenCanvas.width) {
      gardenStars = { w: gardenCanvas.width, h: gardenCanvas.height, pts: [] };
      for (let i = 0; i < 55; i++) {
        gardenStars.pts.push({
          x: Math.random() * gardenCanvas.width,
          y: Math.random() * gardenCanvas.height,
          r: 0.5 + Math.random() * 1.2,
          a: 0.08 + Math.random() * 0.18,
          phase: Math.random() * Math.PI * 2,
          speed: 0.008 + Math.random() * 0.012
        });
      }
    }
    gardenStars.pts.forEach(s => {
      s.phase += s.speed;
      const alpha = s.a * (0.5 + 0.5 * Math.sin(s.phase));
      gardenCtx.beginPath();
      gardenCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      gardenCtx.fillStyle = `rgba(255,255,255,${alpha})`;
      gardenCtx.fill();
    });
  }

  /* ── Thought Chip Selection ─────────────── */
  function selectThought(el) {
    document.querySelectorAll('.thought-chip').forEach(c => c.classList.remove('selected'));
    if (selectedThought === el.dataset.thought) {
      // deselect on second click
      selectedThought = null;
    } else {
      el.classList.add('selected');
      selectedThought = el.dataset.thought;
      showToast('Tap anywhere to release a "' + selectedThought + '" bubble 🫧');
    }
  }

  function hideGardenHint() {
    const hint = document.getElementById('gardenHint');
    if (hint) {
      hint.style.opacity = '0';
      setTimeout(() => hint.style.display = 'none', 500);
    }
  }

  /* ── Spawn helpers ──────────────────────── */
  function spawnBurst(count) {
    const n = count || 12;
    const w = gardenCanvas ? gardenCanvas.width : 600;
    const h = gardenCanvas ? gardenCanvas.height : 400;
    const thoughts = ['Anxiety','Worry','Tension','Doubt','Fear','Pressure','Overthinking','Sadness','Anger','Loneliness','Shame','Exhaustion'];
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        const r = 24 + Math.random() * 36;
        const x = r + Math.random() * (w - r * 2);
        const y = h * 0.4 + Math.random() * (h * 0.5);
        const lbl = selectedThought || thoughts[Math.floor(Math.random() * thoughts.length)];
        bubbles.push(new Bubble(x, y, r, lbl));
        hideGardenHint();
      }, i * 90);
    }
  }

  function clearAllBubbles() {
    bubbles = [];
    showToast('Garden cleared 🌸');
  }

  function popAllBubbles() {
    bubbles.forEach(b => { if (!b.popping) b.pop(); });
    setTimeout(() => showGardenAffirmation('You released everything. Breathe. You are lighter now. 🌬️'), 200);
  }

  /* ── Affirmation display ─────────────────── */
  let affTimer;
  function showGardenAffirmation(text) {
    const el = document.getElementById('gardenAffText');
    const wrap = document.getElementById('gardenAff');
    el.textContent = text;
    wrap.style.opacity = '1';
    clearTimeout(affTimer);
    affTimer = setTimeout(() => { wrap.style.opacity = '0.3'; }, 5000);
  }

  /* ── Hint helpers ───────────────────────── */
  /* ════════════════════════════════════════
     AI & STATE MANAGEMENT (NEW)
  ════════════════════════════════════════ */
  
  // App State Memory
  const STORAGE_KEY = 'innervoice_patients_data';
  const SAVED_QUOTES_KEY = 'innervoice_saved_quotes';
  let currentInsightQuote = '';
  
  // Initialize mock patient data if empty
  function initStore() {
      let data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
          data = [
            { 
              id: 1, name: 'Priya M., 28', avatar: '🌸', meta: 'Stable · Daily journal',
              history: Array(7).fill(0).map((_,i) => ({ date: `Day ${i+1}`, text: "Feeling okay.", analysis: { phq9_score: 4 + (i%3), gad7_score: 5 - (i%2), risk: 'low', keywords: ['calm', 'rest'], summary: 'Stable mood indicators maintained.' } }))
            },
            { 
              id: 2, name: 'Rahul K., 34', avatar: '🌊', meta: 'High Watch · Low adherence',
              history: Array(7).fill(0).map((_,i) => ({ date: `Day ${i+1}`, text: "Overwhelmed. Have been overthinking a lot about isolation.", analysis: { phq9_score: 18 + i, gad7_score: 15 + i, risk: 'high', keywords: ['isolation', 'fatigue', 'hopeless'], summary: 'Increasing hopelessness over 5 days with sleep disturbance mentions.' } }))
            },
            { 
              id: 3, name: 'Meera S., 22', avatar: '🌿', meta: 'Moderate Monitoring',
              history: Array(7).fill(0).map((_,i) => ({ date: `Day ${i+1}`, text: "Stressful week at college.", analysis: { phq9_score: 10 + (i%4), gad7_score: 12 + (i%5), risk: 'medium', keywords: ['anxiety', 'overthinking'], summary: 'Elevated anxiety markers detected around work/study periods.' } }))
            },
            { 
              id: 4, name: 'Arjun T., 41', avatar: '🌙', meta: 'Stable · PTSD treatment',
              history: Array(7).fill(0).map((_,i) => ({ date: `Day ${i+1}`, text: "Managing triggers.", analysis: { phq9_score: 6 + (i%3), gad7_score: 8 - (i%2), risk: 'low', keywords: ['mindfulness', 'stable'], summary: 'Patient exhibiting adaptive coping strategies.' } }))
            },
            { 
              id: 5, name: 'Aarav (You)', avatar: '💜', meta: 'Active User', history: [], isCurrentUser: true 
            }
          ];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
  }
  
  let appState = initStore();
  
  function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
      renderDoctorDashboard();
  }

  function getCurrentUser() {
      return appState.find(p => p.isCurrentUser);
  }

  function getCurrentUserJournalDates() {
      const user = getCurrentUser();
      return user && user.history ? user.history.map(entry => entry.date) : [];
  }
  
  // Helper to update current user's history
  function addJournalToUser(analysisResult, originalText) {
      let user = getCurrentUser();
      if(!user) {
          appState.push({ id: 99, name: 'Aarav (You)', avatar: '💜', meta: 'Active User', history: [], isCurrentUser: true });
          user = appState[appState.length-1];
      }
      
      user.history.push({
          date: new Date().toISOString(),
          text: originalText,
          analysis: analysisResult
      });
      
      // Keep only last 7
      if(user.history.length > 7) {
          user.history.shift();
      }
      saveState();
  }

  function getEmotionMeta(emotion) {
      const map = {
          sad: {
              label: 'Sad',
              badgeBg: 'rgba(255,210,210,0.55)',
              badgeBorder: 'rgba(214,124,124,0.28)',
              badgeColor: '#8b3f57',
              bar: 'linear-gradient(90deg,#f7b6c2,#d9b8ff)'
          },
          anxious: {
              label: 'Anxious',
              badgeBg: 'rgba(255,234,196,0.6)',
              badgeBorder: 'rgba(232,173,90,0.26)',
              badgeColor: '#8a5a17',
              bar: 'linear-gradient(90deg,#ffd28f,#f4a8a8)'
          },
          happy: {
              label: 'Happy',
              badgeBg: 'rgba(206,241,213,0.72)',
              badgeBorder: 'rgba(92,155,111,0.22)',
              badgeColor: '#2d6a4f',
              bar: 'linear-gradient(90deg,#9ad7b0,#c9f2d6)'
          },
          neutral: {
              label: 'Neutral',
              badgeBg: 'rgba(197,216,240,0.5)',
              badgeBorder: 'rgba(143,168,216,0.22)',
              badgeColor: 'var(--sky-deep)',
              bar: 'linear-gradient(90deg,var(--cloud-blue),var(--lavender))'
          }
      };
      return map[emotion] || map.neutral;
  }

  function formatInsightDate(dateValue) {
      if (!dateValue) return 'Today';
      const parsed = new Date(dateValue);
      if (Number.isNaN(parsed.getTime())) return 'Today';
      return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function setInsightsVisible(isVisible) {
      const aiContainer = document.getElementById('aiResponseContainer');
      if (!aiContainer) return;
      if (!isVisible) {
          aiContainer.style.display = 'none';
          aiContainer.style.opacity = '0';
          aiContainer.style.transform = 'translateY(12px)';
          return;
      }
      aiContainer.style.display = 'block';
      requestAnimationFrame(() => {
          aiContainer.style.opacity = '1';
          aiContainer.style.transform = 'translateY(0)';
      });
  }

  function renderInsightTimeline() {
      const timeline = document.getElementById('insightTimeline');
      if (!timeline) return;
      const user = getCurrentUser();
      const history = user && user.history ? user.history.slice(-5).reverse() : [];

      if (history.length === 0) {
          timeline.innerHTML = `<div style="padding:12px 14px;border-radius:14px;background:rgba(255,255,255,0.54);border:1px solid rgba(139,127,212,0.12);color:var(--text-mid);">Your recent mood timeline will appear here after a few entries.</div>`;
          return;
      }

      timeline.innerHTML = history.map(entry => {
          const meta = getEmotionMeta(entry.analysis?.emotion || 'neutral');
          return `
              <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,0.56);border:1px solid rgba(139,127,212,0.12);">
                  <div style="display:flex;align-items:center;gap:10px;">
                      <span style="width:10px;height:10px;border-radius:50%;background:${meta.badgeColor};box-shadow:0 0 0 5px ${meta.badgeBg};"></span>
                      <div>
                          <div style="font-size:0.92rem;color:var(--text-dark);font-weight:600;">${meta.label}</div>
                          <div style="font-size:0.78rem;color:var(--text-light);">${formatInsightDate(entry.date)}</div>
                      </div>
                  </div>
                  <div style="font-size:0.82rem;color:var(--text-mid);font-weight:600;">Mood ${entry.analysis?.mood_score ?? '—'}/10</div>
              </div>
          `;
      }).join('');
  }

  function renderPatientInsights(result) {
      const meta = getEmotionMeta(result.emotion);
      const moodScore = Number(result.mood_score ?? 0);
      const normalizedMood = Math.max(0, Math.min(10, moodScore));
      currentInsightQuote = result.motivational_quote || '';

      document.getElementById('insightEmotionBadge').textContent = meta.label;
      document.getElementById('insightEmotionBadge').style.background = meta.badgeBg;
      document.getElementById('insightEmotionBadge').style.borderColor = meta.badgeBorder;
      document.getElementById('insightEmotionBadge').style.color = meta.badgeColor;

      document.getElementById('insightMoodScore').textContent = `${normalizedMood}/10`;
      document.getElementById('insightStressLevel').textContent = `${result.stress_level || 'medium'} stress`;
      document.getElementById('insightMoodBar').style.width = `${normalizedMood * 10}%`;
      document.getElementById('insightMoodBar').style.background = meta.bar;
      document.getElementById('insightStreak').textContent = `${result.streak || 1} day${Number(result.streak) === 1 ? '' : 's'}`;
      document.getElementById('insightSummary').textContent = result.summary || 'You took time to reflect today. That check-in matters.';

      const patterns = Array.isArray(result.key_patterns) && result.key_patterns.length ? result.key_patterns : ['No strong negative pattern was detected in this entry.'];
      document.getElementById('insightPatterns').innerHTML = patterns.map(item => `<li>${item}</li>`).join('');

      const triggers = Array.isArray(result.triggers) && result.triggers.length ? result.triggers : ['No clear trigger identified'];
      document.getElementById('insightTriggers').innerHTML = triggers.map(item => `
          <span style="padding:8px 12px;border-radius:999px;background:rgba(197,216,240,0.34);border:1px solid rgba(143,168,216,0.24);font-size:0.82rem;color:var(--sky-deep);">${item}</span>
      `).join('');

      document.getElementById('insightSuggestion').textContent = result.suggestion || 'Notice one unhelpful thought and rewrite it in a kinder, more balanced way.';
      document.getElementById('insightMicroAction').textContent = result.micro_action || 'Take one slow breath before moving to your next task.';
      document.getElementById('insightQuote').textContent = `"${currentInsightQuote}"`;
      renderInsightTimeline();
      setInsightsVisible(true);
  }

  function buildOfflineInsight(text) {
      const lower = text.toLowerCase();
      const emotion = /sad|down|cry|lonely|empty|hopeless/.test(lower)
          ? 'sad'
          : /anxious|stress|worry|panic|overthink|nervous/.test(lower)
          ? 'anxious'
          : /happy|grateful|relieved|good|calm|hopeful/.test(lower)
          ? 'happy'
          : 'neutral';

      const fallbackMap = {
          sad: {
              summary: 'Your words suggest emotional heaviness today. It may help to respond to yourself with extra softness.',
              mood_score: 3,
              stress_level: 'medium',
              key_patterns: ['Low mood language detected'],
              triggers: ['No clear trigger identified'],
              suggestion: 'Write down one painful thought and answer it with one compassionate, realistic response.',
              micro_action: 'Sit somewhere quiet and take 5 slow breaths.'
          },
          anxious: {
              summary: 'Your entry shows signs of mental overload and future-focused stress. Your nervous system may need a reset.',
              mood_score: 4,
              stress_level: 'high',
              key_patterns: ['Overthinking detected'],
              triggers: ['General stress load'],
              suggestion: 'Separate facts from fears by writing one thing that is true right now.',
              micro_action: 'Try one 60-second breathing round before returning to your tasks.'
          },
          happy: {
              summary: 'Your journal carries a lighter emotional tone today. There is something steady and encouraging in this reflection.',
              mood_score: 8,
              stress_level: 'low',
              key_patterns: ['Positive reflection present'],
              triggers: ['Supportive experience noticed'],
              suggestion: 'Name what helped today feel better so you can return to it intentionally.',
              micro_action: 'Write down one win from today.'
          },
          neutral: {
              summary: 'Your reflection feels fairly balanced today. This is a useful snapshot of where you are.',
              mood_score: 6,
              stress_level: 'low',
              key_patterns: ['Steady reflection present'],
              triggers: ['No clear trigger identified'],
              suggestion: 'Notice one thing that drained you and one thing that helped you today.',
              micro_action: 'Take a short stretch or water break.'
          }
      };

      const template = fallbackMap[emotion];
      const risk = template.stress_level === 'high' && template.mood_score <= 4
          ? 'high'
          : template.stress_level === 'medium' || template.stress_level === 'high'
          ? 'medium'
          : 'low';
      const phq9 = Math.max(0, Math.min(27, Math.round((10 - template.mood_score) * 2.2 + (emotion === 'sad' ? 3 : 0))));
      const gad7 = Math.max(0, Math.min(21, template.stress_level === 'high' ? 16 : template.stress_level === 'medium' ? 10 : 4));
      const keywords = [...template.key_patterns, ...template.triggers];
      return {
          emotion,
          summary: template.summary,
          mood_score: template.mood_score,
          stress_level: template.stress_level,
          key_patterns: template.key_patterns,
          triggers: template.triggers,
          suggestion: template.suggestion,
          micro_action: template.micro_action,
          motivational_quote: 'You showed up for yourself today, and that matters.',
          streak: getCurrentUserJournalDates().length + 1,
          risk,
          phq9_score: phq9,
          gad7_score: gad7,
          keywords,
          patient_message: template.summary,
          action_step: template.micro_action
      };
  }

  function saveCurrentQuote() {
      if (!currentInsightQuote) {
          showToast('No quote to save yet 💜');
          return;
      }
      const savedQuotes = JSON.parse(localStorage.getItem(SAVED_QUOTES_KEY) || '[]');
      if (!savedQuotes.includes(currentInsightQuote)) {
          savedQuotes.unshift(currentInsightQuote);
      }
      localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(savedQuotes.slice(0, 20)));
      showToast('Quote saved for later ✨');
  }

  /* ── Patient AI Functions ────────────────── */
  
  async function submitJournal() {
      const textarea = document.getElementById('patientJournalText');
      const text = textarea.value.trim();
      const btn = document.getElementById('submitJournalBtn');

      if (!text) {
          showToast('Please write something first 💜');
          return;
      }

      // UI Loading state
      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Analyzing your thoughts... <span style="display:inline-block;animation:breathe 1.5s infinite">✨</span>';
      setInsightsVisible(false);

      try {
          // Call FastAPI Backend
          const response = await fetch('http://127.0.0.1:8000/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: text, journal_dates: getCurrentUserJournalDates() })
          });
          
          if(!response.ok) throw new Error("Backend connection failed");
          
          const result = await response.json();
          
          // Save to state
          addJournalToUser(result, text);
          renderPatientInsights(result);
          textarea.value = ''; // clear input
          showToast('Journal analysis complete ✨');
          
      } catch (err) {
          console.error(err);
          // Fallback if backend is down
          const offlineResult = buildOfflineInsight(text);
          addJournalToUser(offlineResult, text);
          renderPatientInsights(offlineResult);
          showToast('AI offline: Saved locally 💜');
      } finally {
          btn.disabled = false;
          btn.innerHTML = originalText;
      }
  }

  /* ── Voice API ───────────────────────────── */
  function startVoiceInput() {
      const btn = document.getElementById('voiceBtn');
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          showToast('Voice input is not supported in this browser 😔');
          return;
      }
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = function() {
          btn.innerHTML = '🔴 Listening...';
          btn.style.background = 'rgba(255,180,180,.4)';
      };
      
      recognition.onresult = function(event) {
          const text = event.results[0][0].transcript;
          const textarea = document.getElementById('patientJournalText');
          textarea.value += (textarea.value ? ' ' : '') + text;
      };
      
      recognition.onerror = function(event) {
          showToast('Microphone error: ' + event.error);
      };
      
      recognition.onend = function() {
          btn.innerHTML = '🎙️ Voice';
          btn.style.background = 'rgba(212,200,245,.4)';
      };
      
      recognition.start();
  }

  /* ── Image/OCR ───────────────────────────── */
  function triggerJournalImageUpload() {
      const input = document.getElementById('journalImageInput');
      if (input) input.click();
  }

  async function scanJournalImage(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const btn = document.getElementById('scanBtn');
      const originalText = btn ? btn.innerHTML : '📸 Scan';
      if (btn) {
          btn.innerHTML = '⏳ Scanning...';
          btn.disabled = true;
      }

      try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('http://127.0.0.1:8000/scan-journal', {
              method: 'POST',
              body: formData
          });

          const result = await response.json();
          if (!response.ok) {
              throw new Error(result.detail || 'Scan failed');
          }

          const extractedText = (result.text || '').trim();
          if (!extractedText) {
              throw new Error('No readable text found in image');
          }

          const textarea = document.getElementById('patientJournalText');
          textarea.value = extractedText;
          showToast('Journal scanned successfully ✨');
      } catch (error) {
          console.error(error);
          showToast(error.message || 'Could not scan image');
      } finally {
          if (btn) {
              btn.innerHTML = originalText;
              btn.disabled = false;
          }
          event.target.value = '';
      }
  }

  /* ── Doctor Dashboard Rendering ──────────── */
  function getRiskStatus(risk) {
      if(risk === 'high') return '<span class="patient-status status-alert" style="animation: pulse 2s infinite;">HIGH RISK</span>';
      if(risk === 'medium') return '<span class="patient-status status-watch">MEDIUM RISK</span>';
      return '<span class="patient-status status-good">LOW RISK</span>';
  }

  function getMiniTrendHtml(history, risk) {
      if(!history || history.length === 0) {
          return `<div class="mood-line">
              <div class="mood-dot" style="height:10%;opacity:0.3"></div>
              <div class="mood-dot" style="height:10%;opacity:0.3"></div>
              <div class="mood-dot" style="height:10%;opacity:0.3"></div>
          </div>`;
      }
      let html = '<div class="mood-line">';
      const displayCount = Math.min(7, history.length);
      const recent = history.slice(-displayCount);
      
      // Determine dot color gradient based on risk
      let dotStyle = '';
      if (risk === 'high') dotStyle = 'background:linear-gradient(to top,#ff9a9e,#fecfef);';
      else if (risk === 'medium') dotStyle = 'background:linear-gradient(to top,var(--sky-soft),var(--lavender));';
      else dotStyle = 'background:linear-gradient(to top,var(--sky-mid),var(--cloud-blue));';

      recent.forEach((entry, i) => {
          // Map severity score to height (higher severity -> higher bar)
          let severity = (entry.analysis?.phq9_score || 0) + (entry.analysis?.gad7_score || 0);
          let height = Math.max(10, Math.min(100, (severity / 50) * 100)); 
          html += `<div class="mood-dot" style="height:${height}%;animation-delay:.${i * 5}s;${dotStyle}"></div>`;
      });
      html += '</div>';
      return html;
  }

  function openPatientModal(patientId) { // Renamed internally or kept same for compatibility
      const patient = appState.find(p => p.id === patientId);
      if (!patient) return;
      
      const lastEntry = patient.history && patient.history.length > 0 ? patient.history[patient.history.length - 1] : null;
      
      // 1. Populate Header
      document.getElementById('cpAvatar').innerText = patient.avatar;
      document.getElementById('cpName').innerText = patient.name;
      document.getElementById('cpId').innerText = "ID: #" + (1000 + patient.id);
      document.getElementById('cpDemographics').innerText = patient.name.includes(',') ? patient.name.split(',')[1].trim() + " Years • Undisclosed" : "Age N/A";
      document.getElementById('cpLastActive').innerText = lastEntry ? new Date().toLocaleDateString() : "No Activity";

      const riskBadge = document.getElementById('cpRiskBadge');
      if (lastEntry && lastEntry.analysis && lastEntry.analysis.risk) {
          const r = lastEntry.analysis.risk;
          riskBadge.innerText = r.toUpperCase() + " RISK";
          riskBadge.className = 'clinic-risk-badge ' + (r === 'high' ? 'clinic-risk-high' : r === 'medium' ? 'clinic-risk-medium' : 'clinic-risk-low');
          
          document.getElementById('clinicAlertBanner').style.display = (r === 'high' ? 'block' : 'none');
          document.getElementById('cpRiskCard').style.borderTopColor = (r === 'high' ? 'var(--clinic-alert)' : r === 'medium' ? 'var(--clinic-warning)' : 'var(--clinic-safe)');
          document.getElementById('cpRiskLevelText').innerHTML = `<strong>Severity:</strong> <span style="text-transform:uppercase;color:inherit">${r}</span>`;
          
          document.getElementById('cpRiskDetect').style.background = (r === 'high' ? 'var(--clinic-alert-bg)' : r === 'medium' ? '#fffbeb' : 'var(--clinic-safe-bg)');
          document.getElementById('cpRiskDetect').style.color = (r === 'high' ? 'var(--clinic-alert)' : r === 'medium' ? 'var(--clinic-warning)' : 'var(--clinic-safe)');
          document.getElementById('cpRiskDetect').innerText = r === 'high' ? 'Positive detection of acute distress markers.' : r === 'medium' ? 'Elevated stress markers detected. Monitor.' : 'No immediate clinical risk markers detected.';
          
          document.getElementById('cpRiskRec').innerText = r === 'high' ? 'Immediate Intervention / Escalation Required' : r === 'medium' ? 'Schedule Check-in / Discuss triggers' : 'Routine Monitoring';
          document.getElementById('cpRiskRec').parentNode.style.borderLeftColor = (r === 'high' ? 'var(--clinic-alert)' : r === 'medium' ? 'var(--clinic-warning)' : 'var(--clinic-safe)');
      } else {
          riskBadge.innerText = "UNKNOWN";
          riskBadge.className = 'clinic-risk-badge';
          document.getElementById('clinicAlertBanner').style.display = 'none';
      }

      // 2. Populate Clinical Summary
      if (lastEntry && lastEntry.analysis) {
          document.getElementById('cpOverview').innerText = lastEntry.analysis.summary || 'No summary available.';
          
          let phq = lastEntry.analysis.phq9_score || 0;
          let gad = lastEntry.analysis.gad7_score || 0;
          
          document.getElementById('cpStressLevel').innerText = (phq + gad > 25) ? 'High' : (phq + gad > 15) ? 'Moderate' : 'Low';
          document.getElementById('cpStressLevel').style.color = (phq + gad > 25) ? 'var(--clinic-alert)' : 'var(--clinic-primary)';
          
          document.getElementById('cpAnxietyMarkers').innerText = gad + '/21 (GAD-7)';
          document.getElementById('cpMoodStability').innerText = phq + '/27 (PHQ-9)';

          const obsList = document.getElementById('cpBehavioralList');
          obsList.innerHTML = '';
          const keywords = lastEntry.analysis.keywords || [];
          if (keywords.length === 0) obsList.innerHTML = '<li>No specific behavioral markers identified.</li>';
          keywords.forEach(k => {
              obsList.innerHTML += `<li>Patient exhibited language indicative of <strong>${k}</strong>.</li>`;
          });
          
          document.getElementById('cpTriggerReasons').innerHTML = obsList.innerHTML;
          
          // AI Recommendations mock based on risk
          document.getElementById('cpAiActions').innerHTML = (phq > 15) ? '<li>CBT for cognitive distortion</li><li>Evaluate for SSRI adjustment</li>' : '<li>Maintain current therapy protocol</li>';
          document.getElementById('cpAiQuestions').innerHTML = (gad > 10) ? '<li>Inquire about somatic symptoms of anxiety (e.g. sleep, heart rate).</li>' : '<li>Discuss recent positive coping moments.</li>';
          
          // Extract keywords
          const kwCloud = document.getElementById('cpKeywords');
          kwCloud.innerHTML = keywords.map(k => `<span class="clinic-keyword ${(k==='hopeless'||k==='isolation'||k==='anxiety')?'risk':''}">${k}</span>`).join('');
          
          document.getElementById('cpJournalExcerpt').innerText = '"' + (lastEntry.text.substring(0, 200)) + (lastEntry.text.length > 200 ? '...' : '') + '"';
          
          // Sentiment Mock (inverse of PHQ severity for display purposes)
          let sentiment = Math.max(10, 100 - (phq + gad)*2);
          document.getElementById('cpSentimentScore').innerText = sentiment + '/100';
          
      }

      // 3. Populate Emotion Timeline (Mock)
      const timeline = document.getElementById('cpEmotionTimeline');
      timeline.innerHTML = '';
      if (patient.history) {
          const recent = patient.history.slice(-7);
          recent.forEach((h, i) => {
              let sev = (h.analysis?.phq9_score||0) + (h.analysis?.gad7_score||0);
              let height = Math.min(100, Math.max(10, (sev / 40) * 100)); // normalized
              let color = sev > 30 ? 'var(--clinic-alert)' : sev > 15 ? 'var(--clinic-warning)' : 'var(--clinic-primary-light)';
              timeline.innerHTML += `<div class="clinic-bar" style="height:${height}%; background:${color};"></div>`;
          });
      }

      // 4. Progress Tracking
      if (patient.history && patient.history.length > 1) {
          const curr = (lastEntry.analysis?.phq9_score||0) + (lastEntry.analysis?.gad7_score||0);
          const prev = (patient.history[patient.history.length-2].analysis?.phq9_score||0) + (patient.history[patient.history.length-2].analysis?.gad7_score||0);
          const diff = prev - curr; // Positive diff means improvement
          const trendSpan = document.getElementById('cpTrendVal');
          if (diff > 0) { trendSpan.innerText = `+${diff} pts`; trendSpan.className = 'prog-val up'; }
          else if (diff < 0) { trendSpan.innerText = `${diff} pts`; trendSpan.className = 'prog-val down'; }
          else { trendSpan.innerText = `Stable`; trendSpan.className = 'prog-val'; }
      }
      
      const adhTracker = document.getElementById('cpAdherenceTracker');
      adhTracker.innerHTML = '';
      let daysPresent = 0;
      for(let i=0; i<7; i++) {
          let hasEntry = Math.random() > 0.3; // mock adherence
          if (hasEntry) daysPresent++;
          adhTracker.innerHTML += `<div class="adh-day ${hasEntry ? 'present' : 'missed'}"></div>`;
      }
      document.getElementById('cpAdherenceVal').innerText = Math.round((daysPresent/7)*100) + '%';
      
      // Load any saved doctor notes
      document.getElementById('cpDoctorNotes').value = patient.doctorNotes || '';
      document.getElementById('cpNoteSavedStatus').innerText = '';
      
      // Set current clinical patient ID globally for saving notes
      window.currentClinicalPatientId = patient.id;

      goTo('patient-detail');
  }

  function saveClinicNote() {
      if(!window.currentClinicalPatientId) return;
      const patient = appState.find(p => p.id === window.currentClinicalPatientId);
      if(patient) {
          patient.doctorNotes = document.getElementById('cpDoctorNotes').value;
          saveState(); // sync to localStorage
          document.getElementById('cpNoteSavedStatus').innerText = '✓ Note saved securely at ' + new Date().toLocaleTimeString();
          setTimeout(() => document.getElementById('cpNoteSavedStatus').innerText='', 3000);
      }
  }

  function renderDoctorDashboard() {
      const listContainer = document.getElementById('doctorPatientList');
      const alertsContainer = document.getElementById('doctorAlertsList');
      const insightsContainer = document.getElementById('doctorBehavioralInsights');
      
      if(!listContainer) return;
      
      listContainer.innerHTML = '';
      if(alertsContainer) alertsContainer.innerHTML = '';
      if(insightsContainer) insightsContainer.innerHTML = '';
      
      // Separate patients with history
      const activePatients = appState.filter(p => p.history && p.history.length > 0);
      
      // Sort: High risk first
      activePatients.sort((a, b) => {
          const rA = a.history[a.history.length-1].analysis.risk;
          const rB = b.history[b.history.length-1].analysis.risk;
          const map = { 'high':3, 'medium':2, 'low':1 };
          return (map[rB] || 0) - (map[rA] || 0);
      });
      
      // 1. Render Patient List & Alerts
      activePatients.forEach(patient => {
          const lastEntry = patient.history[patient.history.length - 1];
          const risk = lastEntry.analysis.risk;
          
          // Render Row
          const riskStatusHtml = getRiskStatus(risk);
          const keywordList = Array.isArray(lastEntry.analysis.keywords) ? lastEntry.analysis.keywords : [];
          let latestMetrics = `
            <div style="font-size:0.85rem;color:var(--text-dark);margin-top:6px;font-family:'DM Sans',sans-serif;">
               <strong>PHQ-9:</strong> ${lastEntry.analysis.phq9_score} | <strong>GAD-7:</strong> ${lastEntry.analysis.gad7_score}
            </div>
            <div style="font-size:0.8rem;color:var(--text-mid);margin-top:4px;font-style:italic;">
               "${lastEntry.analysis.summary}"
            </div>
            <div style="font-size:0.75rem;margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">
               ${keywordList.map(k => `<span style="background:rgba(212,200,245,0.4);border:1px solid rgba(139,127,212,0.3);padding:2px 8px;border-radius:12px;color:var(--sky-deep);">#${k}</span>`).join('')}
            </div>
          `;
          
          const rowHtml = `
          <div class="patient-row ${risk==='high' ? 'highlight-high-risk' : ''}" style="${risk==='high' ? 'border-color:rgba(255,180,180,0.8); background: linear-gradient(135deg,rgba(255,240,240,0.7),rgba(255,255,255,0.9));' : ''}" onclick="openPatientModal(${patient.id})">
            <div class="patient-avatar">${patient.avatar}</div>
            <div class="patient-info">
              <div class="patient-name">${patient.name}</div>
              ${latestMetrics}
              <div style="margin-top:10px; font-size:0.75rem; color:var(--text-light); text-transform:uppercase; letter-spacing:0.04em;">7-Day Trend (Severity)</div>
              ${getMiniTrendHtml(patient.history, risk)}
            </div>
            ${riskStatusHtml}
          </div>
          `;
          listContainer.innerHTML += rowHtml;
          
          // Render Alert if High Risk
          if(risk === 'high' && alertsContainer) {
              let reason = "Elevated risk markers detected. ";
              if (lastEntry.analysis.keywords && lastEntry.analysis.keywords.includes('hopeless')) reason += "Hopelessness indicated. ";
              if (lastEntry.analysis.gad7_score > 15) reason += "Severe anxiety spike.";
              
              const alertHtml = `
              <div class="patient-row" style="border-left: 4px solid #d9534f; cursor:pointer;" onclick="openPatientModal(${patient.id})">
                 <div>
                    <strong style="color:var(--text-dark);">${patient.name}</strong> <span style="font-size:0.8rem; color:#8a2020; font-weight:600;">→ High Risk</span>
                    <div style="font-size:0.8rem; color:var(--text-mid); margin-top:4px;">${reason}</div>
                 </div>
              </div>
              `;
              alertsContainer.innerHTML += alertHtml;
          }
      });
      
      if(alertsContainer && alertsContainer.innerHTML === '') {
          alertsContainer.innerHTML = '<div style="font-size:0.9rem; color:var(--text-light); font-style:italic; padding-left:10px;">No critical alerts at this time. Dashboard stable.</div>';
      }

      // 2. Render Behavioral Insights
      if(insightsContainer) {
          insightsContainer.innerHTML = `
            <div class="card card-accent-purple">
              <span class="card-icon">🧠</span>
              <div class="card-title">Cognitive Pattern Detection</div>
              <div class="card-sub">"Work stress" and "isolation" recurring across 30% of cohort before weekends.</div>
              <div class="stat-pill">System Insight</div>
            </div>
            
            <div class="card card-accent-blue">
              <span class="card-icon">📈</span>
              <div class="card-title">Cohort Trend Summary</div>
              <div class="card-sub">Patient cohort shows gradual emotional stabilization, but evening fatigue mentions have increased by 15%.</div>
              <div class="stat-pill">Trend Monitor</div>
            </div>
          `;
      }
  }

  // Initial render on load
  document.addEventListener('DOMContentLoaded', () => {
      console.log('DOM Ready: Running initializers');
      renderDoctorDashboard();
      setInsightsVisible(false);
      
      // Add Safety Disclaimer
      const footer = document.querySelector('.footer-note');
      if(footer) {
          footer.innerHTML = `Private · Compassionate · AI-Powered<br><span style="font-size:0.7rem;opacity:0.7;display:block;margin-top:8px;">*This tool supports mental wellbeing and is not a clinical diagnosis.</span>`;
      }
      console.log('Initialization complete ✅');
  });
