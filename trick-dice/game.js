const CATEGORIES = [
  { id: 'two', name: 'デュース', hint: '2の合計', face: 2 },
  { id: 'three', name: 'トレイ', hint: '3の合計', face: 3 },
  { id: 'four', name: 'フォー', hint: '4の合計', face: 4 },
  { id: 'five', name: 'ファイブ', hint: '5の合計', face: 5 },
  { id: 'six', name: 'シックス', hint: '6の合計', face: 6 },
  { id: 'full', name: 'フルハウス', hint: '同じ数字3個＋2個の合計' },
  { id: 'straight', name: 'ラージストレート', hint: '連続する5つの数字 · 30点' },
  { id: 'yacht', name: 'ヨット', hint: '同じ数字5個 · 50点 / 特別70点' },
];
const DIE_FACE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const PIPS = {
  1: [[2, 2]],
  2: [[1, 1], [3, 3]],
  3: [[1, 1], [2, 2], [3, 3]],
  4: [[1, 1], [3, 1], [1, 3], [3, 3]],
  5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]],
  6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]],
};
const FACE_CLASSES = ['front', 'right', 'top', 'bottom', 'left', 'back'];
const ORIENTATIONS = [
  [-12, 14], [-12, -76], [-102, 14], [78, 14], [-12, 104], [-12, 194],
];

function cubeMarkup(die) {
  const face = die.value === null ? 1 : die.value || 1;
  const [rx, ry] = ORIENTATIONS[face - 1];
  const faces = FACE_CLASSES.map((name, index) => {
    const number = index + 1;
    const content = die.value === null
      ? number === 1 ? '<span class="wild-symbol">?</span>' : ''
      : number === 1 && die.green
      ? '<span class="wild-symbol">✦</span>'
      : PIPS[number].map(([column, row]) => `<i class="pip" style="grid-column:${column};grid-row:${row}"></i>`).join('');
    return `<span class="face ${name}">${content}</span>`;
  }).join('');
  return `<span class="cube" style="--rx:${rx}deg;--ry:${ry}deg">${faces}</span>`;
}

function scoreDice(dice) {
  const wilds = dice.filter(d => d.value === 0).length;
  const values = dice.filter(d => d.value !== 0).map(d => d.value);
  const best = Object.fromEntries(CATEGORIES.map(c => [c.id, 0]));
  const assigned = [...values];

  function evaluate(remaining) {
    if (remaining) {
      for (let face = 1; face <= 6; face++) {
        assigned.push(face);
        evaluate(remaining - 1);
        assigned.pop();
      }
      return;
    }
    const counts = Array(7).fill(0);
    assigned.forEach(value => counts[value]++);
    for (const category of CATEGORIES.slice(0, 5)) {
      best[category.id] = Math.max(best[category.id], counts[category.face] * category.face);
    }
    const triple = counts.findIndex((count, index) => index > 0 && count === 3);
    const pair = counts.findIndex((count, index) => index > 0 && count === 2);
    if (triple > 0 && pair > 0) best.full = Math.max(best.full, assigned.reduce((sum, value) => sum + value, 0));
    const sorted = [...new Set(assigned)].sort((a, b) => a - b);
    if (sorted.length === 5 && sorted[4] - sorted[0] === 4) best.straight = 30;
    if (counts.some(count => count === 5)) best.yacht = Math.max(best.yacht, counts[1] === 5 && wilds > 0 ? 70 : 50);
  }
  evaluate(wilds);
  return best;
}

function bonus(scores) {
  const subtotal = CATEGORIES.slice(0, 5).reduce((sum, c) => sum + (scores[c.id] || 0), 0);
  return subtotal >= 55 ? 40 : 0;
}
function total(scores) { return Object.values(scores).reduce((sum, value) => sum + value, 0) + bonus(scores); }

if (typeof module !== 'undefined') module.exports = { scoreDice, bonus, total };

if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  let audioContext;
  let roleTimer;
  function tone(frequency, start, duration, shape = 'sine', volume = .06) {
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = shape;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + start);
      gain.gain.setValueAtTime(volume, audioContext.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + start + duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(audioContext.currentTime + start);
      oscillator.stop(audioContext.currentTime + start + duration);
    } catch (_) { /* 音が使えない環境でもゲームは続ける */ }
  }
  function sound(kind) {
    if (kind === 'roll') {
      [0, .13, .27, .42, .58, .73].forEach((offset, index) => tone(120 + index * 25, offset, .09, 'triangle', .075));
    } else if (kind === 'keep') tone(620, 0, .09, 'sine', .045);
    else if (kind === 'role') [392, 494, 587, 784].forEach((pitch, index) => tone(pitch, index * .11, .28, 'triangle', .075));
    else if (kind === 'register') [280, 420, 560].forEach((pitch, index) => tone(pitch, index * .1, .3, 'triangle', .07));
  }
  function particles(count) {
    const layer = $('particles');
    layer.innerHTML = Array.from({ length: count }, () => {
      const dx = Math.round((Math.random() - .5) * 700);
      const dy = Math.round((Math.random() - .5) * 520);
      const rot = Math.round((Math.random() - .5) * 720);
      const color = ['#ffdd79', '#ef8c43', '#a9d76a', '#fff4cd'][Math.floor(Math.random() * 4)];
      return `<i class="particle" style="--dx:${dx}px;--dy:${dy}px;--rot:${rot}deg;--color:${color}"></i>`;
    }).join('');
    setTimeout(() => { layer.innerHTML = ''; }, 1500);
  }
  function celebrate(kicker, title, score, big = true) {
    $('celebration-kicker').textContent = kicker;
    $('celebration-title').textContent = title;
    $('celebration-score').textContent = score;
    $('celebration').classList.remove('show');
    $('screen-flash').classList.remove('active');
    void $('celebration').offsetWidth;
    $('celebration').classList.add('show');
    $('screen-flash').classList.add('active');
    particles(big ? 34 : 16);
    sound(big ? 'role' : 'register');
  }
  function showRole(scores) {
    const special = scores.yacht > 0 ? ['ヨット！', scores.yacht] : scores.straight > 0 ? ['ラージストレート！', 30] : scores.full > 0 ? ['フルハウス！', scores.full] : null;
    const numeric = CATEGORIES.slice(0, 5).filter(c => scores[c.id] >= c.face * 3).sort((a, b) => scores[b.id] - scores[a.id])[0];
    const role = special || (numeric ? [`${numeric.name}！`, scores[numeric.id]] : null);
    if (!role) return;
    const burst = $('role-burst');
    burst.textContent = `${role[0]}  ${role[1]}点`;
    burst.classList.remove('show');
    void burst.offsetWidth;
    burst.classList.add('show');
    clearTimeout(roleTimer);
    roleTimer = setTimeout(() => burst.classList.remove('show'), 1750);
    if (special) { particles(22); sound('role'); }
    else sound('register');
  }
  const game = {
    round: 1, dice: [], rolls: 0, held: [false, false, false, false, false],
    chanceUsed: false, chanceActive: false, selected: null, player: {}, cpu: {},
    seconds: 35, timerId: null, misses: 0, cards: 0, finished: false, busy: false, rolling: false, cpuView: null,
  };

  function newRound() {
    game.dice = Array.from({ length: 5 }, (_, index) => ({ value: null, green: index === 0 }));
    game.held = [false, false, false, false, false];
    game.rolls = 0;
    game.selected = null;
    game.chanceActive = false;
    game.seconds = 35;
    game.busy = false;
    game.rolling = false;
    game.cpuView = null;
    stopTimer();
    $('role-burst').classList.remove('show');
    render();
  }
  function restart() {
    Object.assign(game, { round: 1, chanceUsed: false, player: {}, cpu: {}, misses: 0, cards: 0, finished: false });
    $('result-dialog').close();
    newRound();
  }
  function stopTimer() { if (game.timerId) clearInterval(game.timerId); game.timerId = null; }
  function startTimer() {
    stopTimer();
    game.seconds = 35;
    game.timerId = setInterval(() => {
      if (game.finished || game.busy) return;
      game.seconds--;
      if (game.seconds <= 0) {
        stopTimer();
        game.misses++;
        if (game.misses % 2 === 0) game.cards++;
        if (game.cards >= 3) { finish(true); return; }
        const scores = scoreDice(game.dice);
        const choices = CATEGORIES.filter(c => game.player[c.id] === undefined);
        game.selected = choices.sort((a, b) => scores[b.id] - scores[a.id])[0].id;
        register(true);
      } else renderTimer();
    }, 1000);
  }
  function rollValue(green) { const face = Math.floor(Math.random() * 6) + 1; return green && face === 1 ? 0 : face; }
  function roll() {
    if (game.finished || game.busy || game.rolls >= 3) return;
    stopTimer();
    game.busy = true;
    game.rolling = true;
    game.dice.forEach((die, index) => { if (!game.held[index]) die.value = rollValue(die.green); });
    game.rolls++;
    render(true);
    $('roll-button').classList.add('shaking');
    $('status').textContent = 'ころころ……';
    sound('roll');
    setTimeout(() => {
      $('roll-button').classList.remove('shaking');
      game.busy = false;
      game.rolling = false;
      startTimer();
      if (game.rolls === 3) moveToRack(game, game.held.map((held, index) => !held ? index : -1).filter(index => index >= 0));
      else render();
      showRole(scoreDice(game.dice));
    }, 1000);
  }
  function useChance() {
    if (game.rolls || game.chanceUsed || game.finished) return;
    game.chanceUsed = true;
    game.chanceActive = true;
    game.dice.forEach(die => { die.green = true; });
    sound('role');
    particles(20);
    render();
  }
  function flyDie(source, from, destination) {
    const to = destination.getBoundingClientRect();
    const clone = source.cloneNode(true);
    clone.classList.remove('rolling');
    clone.classList.add('die-in-flight');
    Object.assign(clone.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
    document.body.appendChild(clone);
    destination.style.visibility = 'hidden';
    const motion = clone.animate([
      { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`, transform: 'rotate(0deg)' },
      { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px`, transform: 'rotate(360deg)' },
    ], { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 440, easing: 'cubic-bezier(.2,.8,.2,1)' });
    motion.onfinish = () => { clone.remove(); destination.style.visibility = ''; };
  }
  function moveToRack(view, indices) {
    const moving = indices.map(index => {
      const source = $('dice').querySelector(`[data-index="${index}"]`);
      return { index, source: source.cloneNode(true), rect: source.getBoundingClientRect() };
    });
    indices.forEach(index => { view.held[index] = true; });
    render();
    moving.forEach(({ index, source, rect }) => flyDie(source, rect, $('kept-dice').querySelector(`[data-index="${index}"]`)));
  }
  function toggleHold(index) {
    if (!game.rolls || game.rolls >= 3 || game.busy) return;
    const source = (game.held[index] ? $('kept-dice') : $('dice')).querySelector(`[data-index="${index}"]`).cloneNode(true);
    const from = (game.held[index] ? $('kept-dice') : $('dice')).querySelector(`[data-index="${index}"]`).getBoundingClientRect();
    game.held[index] = !game.held[index];
    sound('keep');
    render();
    const destination = (game.held[index] ? $('kept-dice') : $('dice')).querySelector(`[data-index="${index}"]`);
    flyDie(source, from, destination);
  }
  function selectCategory(id) {
    if (!game.rolls || game.player[id] !== undefined || game.busy) return;
    game.selected = id;
    sound('keep');
    render();
  }
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function cpuTurn() {
    const view = {
      dice: Array.from({ length: 5 }, (_, index) => ({ green: index === 0, value: null })),
      held: [false, false, false, false, false], rolls: 0, rolling: false, selected: null,
    };
    game.cpuView = view;
    render();
    $('status').textContent = '相手がダイスを手に取りました';
    await delay(650);
    const open = CATEGORIES.filter(c => game.cpu[c.id] === undefined);
    for (let rollNumber = 0; rollNumber < 3; rollNumber++) {
      view.dice.forEach((die, index) => { if (!view.held[index]) die.value = rollValue(die.green); });
      view.rolls++;
      view.rolling = true;
      render(true);
      $('roll-button').classList.add('shaking');
      $('status').textContent = `相手が${view.rolls}回目のダイスを振っています`;
      sound('roll');
      await delay(1000);
      $('roll-button').classList.remove('shaking');
      view.rolling = false;
      render();
      $('status').textContent = `相手の${view.rolls}回目の出目が決まりました`;
      await delay(600);
      if (rollNumber === 2) {
        moveToRack(view, view.held.map((held, index) => !held ? index : -1).filter(index => index >= 0));
        $('status').textContent = '相手はすべてのダイスを上段へ移しました';
        await delay(500);
        break;
      }
      const counts = Array(7).fill(0);
      view.dice.forEach(die => { if (die.value > 0) counts[die.value]++; });
      const target = [2, 3, 4, 5, 6].filter(face => open.some(c => c.face === face))
        .sort((a, b) => (counts[b] * b) - (counts[a] * a))[0] || 6;
      const moving = view.dice.map((die, index) => !view.held[index] && (die.value === 0 || die.value === target) ? index : -1).filter(index => index >= 0);
      moveToRack(view, moving);
      sound('keep');
      const keptCount = view.dice.filter((die, index) => view.held[index] && die.value === target).length;
      const wildCount = view.dice.filter((die, index) => view.held[index] && die.value === 0).length;
      $('status').textContent = `相手は${target}の目を${keptCount}個${wildCount ? `、✦を${wildCount}個` : ''}キープしました`;
      await delay(750);
      if (view.held.every(Boolean)) break;
    }
    const scores = scoreDice(view.dice);
    const choice = open.sort((a, b) => {
      const value = c => scores[c.id] + (c.face ? Math.max(0, scores[c.id] - c.face * 2) * .25 : 0);
      return value(b) - value(a);
    })[0];
    view.selected = choice.id;
    render();
    $('status').textContent = `相手は${choice.name}を選びました`;
    await delay(850);
    celebrate('OPPONENT ROLE', choice.name, `+${scores[choice.id]} 点`, false);
    await delay(350);
    game.cpu[choice.id] = scores[choice.id];
    render();
    $('status').textContent = `相手は${choice.name}に${scores[choice.id]}点を登録しました`;
    await delay(1200);
    game.cpuView = null;
  }
  async function register(automatic = false) {
    if (!game.rolls || !game.selected || game.busy || game.finished) return;
    stopTimer();
    game.busy = true;
    game.rolling = false;
    const chosen = CATEGORIES.find(c => c.id === game.selected);
    game.player[chosen.id] = scoreDice(game.dice)[chosen.id];
    render();
    celebrate(automatic ? 'AUTO REGISTER' : 'ROLE COMPLETE', chosen.name, `+${game.player[chosen.id]} 点`, game.player[chosen.id] >= 25);
    $('status').textContent = `${chosen.name}に${game.player[chosen.id]}点を登録！`;
    await delay(1550);
    await cpuTurn();
    if (game.round === 8) finish(false);
    else { game.round++; newRound(); }
  }
  function finish(forfeit) {
    game.finished = true;
    game.busy = true;
    stopTimer();
    const yours = total(game.player), theirs = total(game.cpu);
    const won = !forfeit && yours > theirs;
    $('result-icon').textContent = forfeit ? '🟨' : won ? '✦' : yours === theirs ? '◇' : '◆';
    $('result-title').textContent = forfeit ? 'イエローカード3枚で敗北' : won ? 'あなたの勝ち！' : yours === theirs ? '引き分け！' : '相手の勝ち！';
    $('result-detail').textContent = `あなた ${yours}点  /  相手 ${theirs}点`;
    $('result-dialog').showModal();
    render();
  }
  function renderTimer() {
    $('timer').textContent = game.rolls && !game.busy && !game.cpuView ? game.seconds : '–';
    $('timer').classList.toggle('urgent', game.seconds <= 10 && game.rolls && !game.busy && !game.cpuView);
  }
  function render(animate = false) {
    const active = game.cpuView || game;
    const cpuPlaying = !!game.cpuView;
    document.querySelector('.arena').classList.toggle('cpu-turn', cpuPlaying);
    $('round-number').textContent = `${game.round} / 8`;
    $('player-total').textContent = total(game.player);
    $('cpu-total').textContent = total(game.cpu);
    document.querySelector('.turn-plaque small').textContent = cpuPlaying ? 'OPPONENT TURN' : 'YOUR TURN';
    $('turn-title').textContent = cpuPlaying
      ? active.rolling ? '相手が振っています' : active.selected ? '相手が役を登録' : '相手の手番'
      : game.rolling ? 'ダイスを振っています' : game.busy ? '結果を確認中' : game.rolls === 0 ? '最初のダイスを振ろう' : game.rolls === 3 ? '役を選んで登録しよう' : 'キープして振り直そう';
    if (!game.busy) $('status').textContent = game.rolls === 0 ? 'カップを押してダイスを振ろう' : game.rolls === 3 ? '3回振り終わりました。左の役を選んで登録しよう。' : 'ダイスをタップしてキープ。左の役を選んで登録できます。';
    $('roll-count').textContent = `残り ${3 - active.rolls} 回`;
    $('yellow-cards').textContent = `カード ${game.cards} / 3`;
    renderTimer();
    const interactive = !game.busy && active.rolls > 0 && active.rolls < 3;
    const dieButton = (die, index, rack) => `<button type="button" class="die ${rack ? 'rack-die' : ''} ${die.green ? 'green' : ''} ${animate && !rack ? 'rolling' : ''}" data-index="${index}" ${interactive ? '' : 'disabled'} aria-label="${index + 1}番目のダイス ${die.value === null ? '未投擲' : die.value === 0 ? '万能' : die.value} ${rack ? 'キープ中' : ''}">${cubeMarkup(die)}</button>`;
    $('kept-dice').innerHTML = active.held.map((held, index) => `<span class="keep-slot ${held ? 'occupied' : ''} ${held && active.dice[index].green ? 'green' : ''}">${held ? dieButton(active.dice[index], index, true) : ''}</span>`).join('');
    $('dice').innerHTML = active.dice.map((die, index) => `<span class="die-space ${active.held[index] ? 'vacant' : ''}">${active.held[index] ? '' : dieButton(die, index, false)}</span>`).join('');
    document.querySelectorAll('#dice .die, #kept-dice .die').forEach(button => button.addEventListener('click', () => toggleHold(Number(button.dataset.index))));
    $('roll-button').disabled = game.rolls >= 3 || game.busy || game.finished;
    $('roll-button').querySelector('.cup-label').textContent = cpuPlaying ? '相手が振る' : game.rolls ? '振り直す' : 'カップを振る';
    $('roll-button').setAttribute('aria-label', game.rolls ? 'ダイスを振り直す' : 'ダイスを振る');
    $('chance-button').disabled = game.chanceUsed || game.rolls > 0 || game.busy || game.finished;
    $('chance-button').querySelector('span:nth-child(2)').textContent = game.chanceActive ? '発動中' : game.chanceUsed ? '使用済み' : 'イカサマ';
    const previews = !cpuPlaying && active.rolls ? scoreDice(active.dice) : null;
    $('score-rows').innerHTML = CATEGORIES.map(category => {
      const filled = game.player[category.id] !== undefined;
      const selected = !cpuPlaying && game.selected === category.id;
      const cpuSelected = cpuPlaying && active.selected === category.id;
      const cpuValue = game.cpu[category.id] ?? (cpuSelected ? '？' : '—');
      return `<button type="button" class="score-row ${selected ? 'selected' : ''} ${cpuSelected ? 'cpu-selected' : ''} ${filled ? 'filled-row' : ''}" data-id="${category.id}" ${filled || !game.rolls || game.busy ? 'disabled' : ''}><span><span class="name">${category.name}</span><span class="hint">${category.hint}</span></span><span class="value ${filled ? 'filled' : 'preview'}">${filled ? game.player[category.id] : previews ? previews[category.id] : '—'}</span><span class="value cpu-value">${cpuValue}</span>${selected && game.busy ? '<span class="role-mark">★</span>' : ''}</button>`;
    }).join('');
    $('score-rows').querySelectorAll('button').forEach(button => button.addEventListener('click', () => selectCategory(button.dataset.id)));
    $('player-bonus').textContent = bonus(game.player) || '—';
    $('cpu-bonus').textContent = bonus(game.cpu) || '—';
    $('register-button').disabled = !game.selected || game.busy || game.finished;
  }

  $('roll-button').addEventListener('click', roll);
  $('chance-button').addEventListener('click', useChance);
  $('register-button').addEventListener('click', () => register(false));
  $('help-button').addEventListener('click', () => $('help-dialog').showModal());
  $('close-help').addEventListener('click', () => $('help-dialog').close());
  $('start-button').addEventListener('click', () => $('help-dialog').close());
  $('again-button').addEventListener('click', restart);
  newRound();
  $('help-dialog').showModal();
}
