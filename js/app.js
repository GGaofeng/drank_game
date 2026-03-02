(function () {
  'use strict';

  const views = {
    home: document.getElementById('view-home'),
    wheel: document.getElementById('view-wheel'),
    'truth-dare': document.getElementById('view-truth-dare'),
    undercover: document.getElementById('view-undercover'),
    cards: document.getElementById('view-cards'),
    'number-bomb': document.getElementById('view-number-bomb'),
    crocodile: document.getElementById('view-crocodile'),
    'time-bomb': document.getElementById('view-time-bomb'),
    rules: document.getElementById('view-rules'),
  };

  function showView(id) {
    Object.keys(views).forEach(function (key) {
      if (views[key]) views[key].classList.toggle('active', key === id);
    });
  }

  document.querySelectorAll('.game-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var game = this.getAttribute('data-game');
      if (views[game]) showView(game);
      if (game === 'wheel') initWheel();
      if (game === 'undercover') resetUndercover();
      if (game === 'cards') resetCards();
      if (game === 'number-bomb') initNumberBomb();
      if (game === 'crocodile') initCrocodile();
      if (game === 'time-bomb') initTimeBomb();
    });
  });

  document.querySelectorAll('.back-btn, [data-back]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showView('home');
      stopTimeBomb(); // Stop timer if exiting
    });
  });

  document.getElementById('btn-rules').addEventListener('click', function () {
    showView('rules');
  });

  // 夜间模式
  var nightBtn = document.getElementById('btn-night');
  if (localStorage.getItem('nightMode') === '1') {
    document.body.classList.add('night-mode');
    nightBtn.setAttribute('aria-pressed', 'true');
  }
  nightBtn.addEventListener('click', function () {
    document.body.classList.toggle('night-mode');
    var on = document.body.classList.contains('night-mode');
    nightBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    localStorage.setItem('nightMode', on ? '1' : '0');
  });

  // ---------- 转盘喝酒 ----------
  var wheelCanvas, wheelCtx, wheelSegments = [], wheelRotation = 0, wheelSpinning = false;
  var WHEEL_SEGMENTS = 8;
  var WHEEL_COLORS = ['#e94560', '#0f3460', '#533483', '#16213e', '#1a1a2e', '#2d4059', '#ea5455', '#2ec4b6'];

  function initWheel() {
    wheelCanvas = document.getElementById('wheel-canvas');
    if (!wheelCanvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var size = 280;
    wheelCanvas.width = size * dpr;
    wheelCanvas.height = size * dpr;
    wheelCanvas.style.width = size + 'px';
    wheelCanvas.style.height = size + 'px';
    wheelCtx = wheelCanvas.getContext('2d');
    wheelCtx.scale(dpr, dpr);
    wheelSegments = [];
    for (var i = 0; i < WHEEL_SEGMENTS; i++) {
      wheelSegments.push({
        label: '玩家 ' + (i + 1),
        color: WHEEL_COLORS[i % WHEEL_COLORS.length],
      });
    }
    drawWheel(0);
    document.getElementById('wheel-result').classList.add('hidden');
  }

  function drawWheel(rotation) {
    var ctx = wheelCtx;
    var r = 140;
    var cx = 140;
    var cy = 140;
    var step = (2 * Math.PI) / WHEEL_SEGMENTS;
    ctx.clearRect(0, 0, 280, 280);
    for (var i = 0; i < WHEEL_SEGMENTS; i++) {
      var start = rotation + i * step;
      var end = start + step;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = wheelSegments[i].color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + step / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = '14px sans-serif';
      ctx.fillText(wheelSegments[i].label, r - 12, 5);
      ctx.restore();
    }
    // Pointer center
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function spinWheel() {
    if (wheelSpinning) return;
    wheelSpinning = true;
    document.getElementById('wheel-start').disabled = true;
    document.getElementById('wheel-result').classList.add('hidden');
    var extra = 4 + Math.random() * 4;
    var targetAngle = Math.PI * 2 * extra + Math.random() * Math.PI * 2;
    var segmentAngle = (2 * Math.PI) / WHEEL_SEGMENTS;
    // Calculate end index based on rotation
    // Pointer is at top (270 deg or 3PI/2).
    // The wheel rotates clockwise.
    var duration = 4000;
    var startTime = null;
    var startRot = wheelRotation;
    
    function tick(t) {
      if (!startTime) startTime = t;
      var elapsed = t - startTime;
      var progress = Math.min(elapsed / duration, 1);
      // Ease out
      progress = 1 - Math.pow(1 - progress, 2.5);
      wheelRotation = startRot + targetAngle * progress;
      drawWheel(wheelRotation);
      
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        wheelSpinning = false;
        document.getElementById('wheel-start').disabled = false;
        
        // Calculate result
        var normalizedRot = wheelRotation % (Math.PI * 2);
        // Pointer is at -PI/2 (top). 
        // Segment index i is at [rot + i*step, rot + (i+1)*step]
        // We want to find i such that pointer angle is within.
        // Easier: 
        var pointerAngle = (3 * Math.PI / 2); 
        // Effective angle of 0-th segment start: normalizedRot
        var relativeAngle = (pointerAngle - normalizedRot + Math.PI * 4) % (Math.PI * 2);
        var index = Math.floor(relativeAngle / segmentAngle) % WHEEL_SEGMENTS;
        
        var events = GAME_DATA.wheelEvents;
        var ev = events[Math.floor(Math.random() * events.length)];
        var resultEl = document.getElementById('wheel-result');
        document.getElementById('wheel-result-text').textContent = wheelSegments[index].label + '：' + ev.text;
        resultEl.classList.remove('hidden');
      }
    }
    requestAnimationFrame(tick);
  }

  var wheelStartBtn = document.getElementById('wheel-start');
  if (wheelStartBtn) wheelStartBtn.addEventListener('click', spinWheel);

  // ---------- 真心话大冒险 ----------
  var currentMode = 'normal';
  document.querySelectorAll('.mode-tabs .tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.mode-tabs .tab-btn').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      currentMode = this.getAttribute('data-tab');
    });
  });

  function pickTruth() {
    var arr = currentMode === 'spicy' ? GAME_DATA.truthSpicy : GAME_DATA.truthNormal;
    var text = arr[Math.floor(Math.random() * arr.length)];
    document.getElementById('truth-dare-text').textContent = text;
    document.getElementById('truth-dare-result').classList.remove('hidden');
  }
  function pickDare() {
    var arr = currentMode === 'spicy' ? GAME_DATA.dareSpicy : GAME_DATA.dareNormal;
    var text = arr[Math.floor(Math.random() * arr.length)];
    document.getElementById('truth-dare-text').textContent = text;
    document.getElementById('truth-dare-result').classList.remove('hidden');
  }
  var btnTruth = document.getElementById('btn-truth');
  if (btnTruth) btnTruth.addEventListener('click', pickTruth);
  
  var btnDare = document.getElementById('btn-dare');
  if (btnDare) btnDare.addEventListener('click', pickDare);

  // ---------- 谁是卧底 ----------
  var undercoverCount = 6;
  var undercoverAssignment = [];
  var undercoverRound = 1;

  function resetUndercover() {
    document.getElementById('undercover-setup').classList.remove('hidden');
    document.getElementById('undercover-play').classList.add('hidden');
    document.getElementById('undercover-count').textContent = '6';
    undercoverCount = 6;
  }

  document.querySelectorAll('.num-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var dir = parseInt(this.getAttribute('data-dir'), 10);
      undercoverCount = Math.max(5, Math.min(12, undercoverCount + dir));
      document.getElementById('undercover-count').textContent = undercoverCount;
    });
  });

  var ucStart = document.getElementById('undercover-start');
  if (ucStart) {
    ucStart.addEventListener('click', function () {
      var pairs = GAME_DATA.undercoverWords;
      var pair = pairs[Math.floor(Math.random() * pairs.length)];
      var civilian = pair[0];
      var undercover = pair[1];
      undercoverAssignment = [];
      var undercoverIndex = Math.floor(Math.random() * undercoverCount);
      for (var i = 0; i < undercoverCount; i++) {
        undercoverAssignment.push(i === undercoverIndex ? undercover : civilian);
      }
      undercoverRound = 1;
      document.getElementById('undercover-setup').classList.add('hidden');
      document.getElementById('undercover-play').classList.remove('hidden');
      document.getElementById('uc-round').textContent = '1';
      document.getElementById('uc-word').textContent = undercoverAssignment[0];
      document.getElementById('uc-next').textContent = '下一位查看';
    });
  }

  var ucNext = document.getElementById('uc-next');
  if (ucNext) {
    ucNext.addEventListener('click', function () {
      undercoverRound++;
      if (undercoverRound > undercoverCount) {
        document.getElementById('uc-word').textContent = '所有人都已查看，开始描述与投票找出卧底！';
        this.textContent = '重新开始';
        var self = this;
        // Simple toggle back to setup after delay or click? 
        // Logic in original code was: click "Restart" -> wait 3s -> go to setup.
        // Let's keep it simple: Click "Restart" -> go to setup immediately.
        if (this.textContent === '重新开始') {
             // Re-bind click to reset? Or just check text.
             // Actually the original code logic was a bit weird with setTimeout.
             // Let's just reset.
        }
        setTimeout(function () {
          document.getElementById('undercover-play').classList.add('hidden');
          document.getElementById('undercover-setup').classList.remove('hidden');
          document.getElementById('uc-next').textContent = '下一位查看';
        }, 3000);
        return;
      }
      document.getElementById('uc-round').textContent = undercoverRound;
      document.getElementById('uc-word').textContent = undercoverAssignment[undercoverRound - 1];
      if (undercoverRound === undercoverCount) {
        this.textContent = '最后一位查看';
      }
    });
  }

  // ---------- 抽卡惩罚 ----------
  function resetCards() {
    var front = document.getElementById('card-front');
    var back = document.getElementById('card-back');
    front.classList.remove('flipped');
    back.classList.remove('flipped', 'hidden');
    back.classList.add('hidden');
    front.classList.remove('hidden');
    document.getElementById('card-draw').textContent = '抽一张';
  }

  var cardDraw = document.getElementById('card-draw');
  if (cardDraw) {
    cardDraw.addEventListener('click', function () {
      var front = document.getElementById('card-front');
      var back = document.getElementById('card-back');
      var btn = this;
      if (back.classList.contains('hidden')) {
        var cards = GAME_DATA.cards;
        var card = cards[Math.floor(Math.random() * cards.length)];
        document.getElementById('card-type-icon').textContent = card.icon;
        document.getElementById('card-content').textContent = card.text;
        front.classList.add('flipped');
        back.classList.remove('hidden');
        setTimeout(function () {
          back.classList.add('flipped');
        }, 50);
        btn.textContent = '再抽一张';
      } else {
        front.classList.remove('flipped');
        back.classList.remove('flipped');
        setTimeout(function () {
          back.classList.add('hidden');
          var card = GAME_DATA.cards[Math.floor(Math.random() * GAME_DATA.cards.length)];
          document.getElementById('card-type-icon').textContent = card.icon;
          document.getElementById('card-content').textContent = card.text;
          back.classList.remove('hidden');
          front.classList.add('flipped');
          setTimeout(function () {
            back.classList.add('flipped');
          }, 50);
          btn.textContent = '再抽一张';
        }, 600);
      }
    });
  }

  // ---------- 数字炸弹 ----------
  var bombMin = 1, bombMax = 100, bombTarget = 0;
  
  function initNumberBomb() {
    bombMin = 1;
    bombMax = 100;
    bombTarget = Math.floor(Math.random() * 100) + 1;
    document.getElementById('bomb-min').textContent = bombMin;
    document.getElementById('bomb-max').textContent = bombMax;
    document.getElementById('bomb-input').value = '';
    document.getElementById('bomb-msg').textContent = '猜一个数字，别踩雷！';
    document.getElementById('bomb-boom').classList.add('hidden');
  }

  document.getElementById('bomb-submit').addEventListener('click', function() {
    var inputEl = document.getElementById('bomb-input');
    var val = parseInt(inputEl.value, 10);
    if (isNaN(val) || val < bombMin || val > bombMax) {
      alert('请输入 ' + bombMin + ' 到 ' + bombMax + ' 之间的数字');
      return;
    }
    
    if (val === bombTarget) {
      // BOOM
      document.getElementById('bomb-boom').classList.remove('hidden');
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
    } else {
      if (val < bombTarget) bombMin = val + 1;
      if (val > bombTarget) bombMax = val - 1;
      // Edge case: if range is invalid (e.g. min > max), it means only one number left was target? 
      // Actually with the logic above: 
      // Target 50. Range 1-100. Guess 49. New min = 50. Range 50-100.
      // Target 50. Range 50-100. Guess 51. New max = 50. Range 50-50.
      // Next guess must be 50.
      
      document.getElementById('bomb-min').textContent = bombMin;
      document.getElementById('bomb-max').textContent = bombMax;
      document.getElementById('bomb-msg').textContent = '安全！下一位继续';
      inputEl.value = '';
    }
  });

  document.getElementById('bomb-restart').addEventListener('click', initNumberBomb);


  // ---------- 鳄鱼拔牙 ----------
  var crocBadTooth = -1;
  var crocTeethCount = 13; // Upper + Lower
  
  function initCrocodile() {
    var upperContainer = document.getElementById('croc-teeth-upper');
    var lowerContainer = document.getElementById('croc-teeth-lower');
    upperContainer.innerHTML = '';
    lowerContainer.innerHTML = '';
    
    // Reset state
    document.querySelector('.croc-head').classList.remove('biting');
    document.getElementById('croc-msg').textContent = '轮流拔牙，小心被咬！';
    document.getElementById('croc-restart').classList.add('hidden');
    
    // Random bad tooth (0 to 12)
    crocBadTooth = Math.floor(Math.random() * crocTeethCount);
    
    // Create teeth
    // 6 upper, 7 lower
    for (var i = 0; i < 6; i++) {
      createTooth(i, upperContainer);
    }
    for (var i = 6; i < 13; i++) {
      createTooth(i, lowerContainer);
    }
  }
  
  function createTooth(index, container) {
    var btn = document.createElement('button');
    btn.className = 'tooth';
    btn.type = 'button';
    btn.onclick = function() {
      if (this.classList.contains('pressed')) return;
      
      if (index === crocBadTooth) {
        // BITE!
        document.querySelector('.croc-head').classList.add('biting');
        document.getElementById('croc-msg').textContent = '啊呜！咬到了！🍺';
        document.getElementById('croc-restart').classList.remove('hidden');
        if (navigator.vibrate) navigator.vibrate(500);
      } else {
        // Safe
        this.classList.add('pressed');
        if (navigator.vibrate) navigator.vibrate(50);
      }
    };
    container.appendChild(btn);
  }
  
  document.getElementById('croc-restart').addEventListener('click', initCrocodile);

  // ---------- 定时炸弹 ----------
  var tbTimer = null;
  var tbTimeLeft = 0;
  
  function initTimeBomb() {
    stopTimeBomb();
    document.getElementById('tb-explode').classList.add('hidden');
    document.getElementById('tb-start').classList.remove('hidden');
    document.getElementById('tb-pass').classList.add('hidden');
    document.getElementById('tb-timer').textContent = '00';
    document.getElementById('tb-timer').classList.remove('urgent');
    document.getElementById('tb-question').textContent = '准备好了吗？';
  }
  
  function stopTimeBomb() {
    if (tbTimer) {
      clearInterval(tbTimer);
      tbTimer = null;
    }
  }
  
  document.getElementById('tb-start').addEventListener('click', function() {
    // Random time 15-45s
    tbTimeLeft = Math.floor(Math.random() * 30) + 15;
    
    document.getElementById('tb-start').classList.add('hidden');
    document.getElementById('tb-pass').classList.remove('hidden');
    
    nextBombQuestion();
    
    if (navigator.vibrate) navigator.vibrate(200);
    
    tbTimer = setInterval(function() {
      tbTimeLeft--;
      // Format time
      var display = tbTimeLeft < 10 ? '0' + tbTimeLeft : tbTimeLeft;
      var timerEl = document.getElementById('tb-timer');
      timerEl.textContent = display;
      
      // Urgent effect
      if (tbTimeLeft <= 10) {
        timerEl.classList.add('urgent');
        if (navigator.vibrate) navigator.vibrate(100);
      } else {
        timerEl.classList.remove('urgent');
        if (navigator.vibrate && tbTimeLeft % 2 === 0) navigator.vibrate(50);
      }
      
      if (tbTimeLeft <= 0) {
        // BOOM
        stopTimeBomb();
        document.getElementById('tb-explode').classList.remove('hidden');
        if (navigator.vibrate) navigator.vibrate([1000, 200, 1000]);
      }
    }, 1000);
  });
  
  function nextBombQuestion() {
    var qs = GAME_DATA.bombQuestions || ['请说出...'];
    var q = qs[Math.floor(Math.random() * qs.length)];
    document.getElementById('tb-question').textContent = q;
  }
  
  document.getElementById('tb-pass').addEventListener('click', function() {
    nextBombQuestion();
  });
  
  document.getElementById('tb-restart').addEventListener('click', initTimeBomb);


  // 首屏若直接进转盘则初始化
  if (document.getElementById('view-wheel').classList.contains('active')) {
    initWheel();
  }
})();
