(function () {
  'use strict';

  const views = {
    home: document.getElementById('view-home'),
    wheel: document.getElementById('view-wheel'),
    'truth-dare': document.getElementById('view-truth-dare'),
    undercover: document.getElementById('view-undercover'),
    cards: document.getElementById('view-cards'),
    rules: document.getElementById('view-rules'),
  };

  function showView(id) {
    Object.keys(views).forEach(function (key) {
      views[key].classList.toggle('active', key === id);
    });
  }

  document.querySelectorAll('.game-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var game = this.getAttribute('data-game');
      if (views[game]) showView(game);
      if (game === 'wheel') initWheel();
      if (game === 'undercover') resetUndercover();
      if (game === 'cards') resetCards();
    });
  });

  document.querySelectorAll('.back-btn, [data-back]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showView('home');
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
    var endIndex = Math.floor(((3 * Math.PI / 2 - targetAngle + Math.PI * 4) % (Math.PI * 2)) / segmentAngle) % WHEEL_SEGMENTS;
    var duration = 4000;
    var startTime = null;
    var startRot = wheelRotation;
    function tick(t) {
      if (!startTime) startTime = t;
      var elapsed = t - startTime;
      var progress = Math.min(elapsed / duration, 1);
      progress = 1 - Math.pow(1 - progress, 2.5);
      wheelRotation = startRot + targetAngle * progress;
      drawWheel(wheelRotation);
      if (progress < 1) {
        requestAnimationFrame(tick);
        return;
      }
      wheelSpinning = false;
      document.getElementById('wheel-start').disabled = false;
      var events = GAME_DATA.wheelEvents;
      var ev = events[Math.floor(Math.random() * events.length)];
      var resultEl = document.getElementById('wheel-result');
      document.getElementById('wheel-result-text').textContent = wheelSegments[endIndex].label + '：' + ev.text;
      resultEl.classList.remove('hidden');
    }
    requestAnimationFrame(tick);
  }

  document.getElementById('wheel-start').addEventListener('click', spinWheel);

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
  document.getElementById('btn-truth').addEventListener('click', pickTruth);
  document.getElementById('btn-dare').addEventListener('click', pickDare);

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

  document.getElementById('undercover-start').addEventListener('click', function () {
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
  });

  document.getElementById('uc-next').addEventListener('click', function () {
    undercoverRound++;
    if (undercoverRound > undercoverCount) {
      document.getElementById('uc-word').textContent = '所有人都已查看，开始描述与投票找出卧底！';
      this.textContent = '重新开始';
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

  document.getElementById('card-draw').addEventListener('click', function () {
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

  // 首屏若直接进转盘则初始化
  if (document.getElementById('view-wheel').classList.contains('active')) {
    initWheel();
  }
})();
