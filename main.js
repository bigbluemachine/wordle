// imported stuff
// > dict.js: 5-letter words considered to be valid
// >> source: https://www.wordgamedictionary.com/sowpods/download/sowpods.txt
// > freq.js: 5-letter words ordered by frequency (may be invalid)
// >> source: https://en.lexipedia.org/

var _ALPHANUM = '0123456789abcdefghijklmnopqrstuvwxyz';
var _ATOZ = 'abcdefghijklmnopqrstuvwxyz';
var gState;

// ================================ //

function _(id) { return document.getElementById(id); }

function addChild(parent, tag) {
  var elem = document.createElement(tag);
  parent.appendChild(elem);
  return elem;
}

function initElements() {
  var table = addChild(_('board'), 'table');
  for (var r = 0; r < 6; r++) {
    var tr = addChild(table, 'tr');
    for (var c = 0; c < 5; c++) {
      var td = addChild(tr, 'td');
      var cell = addChild(td, 'div');
      cell.id = 5 * r + c;
    }
  }
  initKeyboard();
}

function initKeyboard() {
  function keyListener(c) {
    return () => inputLetter(c);
  }

  function addKey(parent, id, text, listener) {
    var key = addChild(parent, 'div');
    key.classList.add('key');
    key.id = 'key-' + id;
    key.textContent = text;
    key.onclick = listener;
  }

  function addRow(str) {
    var row = addChild(_('keyboard'), 'div');
    for (var i = 0; i < str.length; i++) {
      var lower = str[i];
      var upper = lower.toUpperCase();
      addKey(row, lower, upper, keyListener(upper));
    }
    return row;
  }

  addRow('qwertyuiop');
  addRow('asdfghjkl');
  var r3 = addRow('zxcvbnm');
  addKey(r3, 'back', '<', removeLetter);
  addKey(r3, 'enter', 'Enter', undefined);
}

function newGameRandom() {
  var seed = '';
  for (var i = 0; i < 12; i++) {
    var r = Math.floor(_ALPHANUM.length * Math.random());
    seed += _ALPHANUM[r];
  }
  _('seed').value = seed;
  newGame(seed);
}

function updateCursor(prev, next) {
  if (prev !== -1) {
    _(prev).classList.remove('selected');
  }
  if (next !== -1) {
    _(next).classList.add('selected');
  }
  gState.cursor = next;
}

function newGame(seed) {
  function getWord(seed) {
    initSeed(seed);
    var word;
    do {
    // favor words of a higher frequency, i.e. lower indices
    // partition into 4 sections [0.0-0.4, 0.4-0.7, 0.7-0.9, 0.9-1.0]
    var r = myRandom();
    var u;
    if (r < 0.4) {
      u = 0.25 * myRandom();
    } else if (r < 0.7) {
      u = 0.25 + 0.25 * myRandom();
    } else if (r < 0.9) {
      u = 0.50 + 0.25 * myRandom();
    } else {
      u = 0.75 + 0.25 * myRandom();
    }
    word = FREQ[Math.floor(u * FREQ.length)];
    } while (!DICT[word]);
    return word;
  }

  gState = {};
  gState.seed = seed;
  gState.gameOver = false;
  gState.invalid = false;
  gState.line = 0;
  gState.highlight = -1;
  for (var i = 0; i < 30; i++) {
    _(i).classList.value = 'cell';
    _(i).textContent = '';
    _(i).parentElement.onclick = undefined;
  }
  updateCursor(-1, 0);
  resetKeyboard();
  setStatus(`Game started with seed: "${seed}"`, 'status-blue');

  var word = getWord(seed);
  var fn = ((str) => {
    return function() {
      submitGuessHelper(str);
    };
  })(word);
  window.submitGuess = fn;
  _('key-enter').onclick = fn;
}

function resetKeyboard() {
  for (var i = 0; i < 26; i++) {
    _('key-' + _ATOZ[i]).classList.value = 'key';
  }
  _('key-back').classList.remove('key-disabled');
  _('key-enter').classList.remove('key-disabled');
}

function disableKeyboard() {
  for (var i = 0; i < 26; i++) {
    _('key-' + _ATOZ[i]).classList.add('key-disabled');
  }
  _('key-back').classList.add('key-disabled');
  _('key-enter').classList.add('key-disabled');
}

function clearHints() {
  for (var i = 0; i < 26; i++) {
    _('key-' + _ATOZ[i]).classList.remove('key-hint');
  }
}

function handleKeyDown(event) {
  if (event.ctrlKey || event.altKey || event.shiftKey) {
    return;
  }
  if (document.activeElement.tagName.toLowerCase() !== 'body') {
    return;
  }
  var k = event.keyCode;
  if (65 <= k && k <= 90) { // letters
    inputLetter(String.fromCharCode(k));
  } else if (k === 13) { // enter
    submitGuess();
  } else if (k === 8) { // backspace
    removeLetter();
  }
  return false;
}

function inputLetter(c) {
  if (gState.gameOver) {
    return;
  }
  if (gState.cursor === -1) {
    // at end
    return;
  }
  _(gState.cursor).textContent = c;
  if ((gState.cursor + 1) % 5 === 0) {
    // last letter
    updateCursor(-1, -1);
    _(5 * gState.line + 4).classList.add('selected');
  } else {
    updateCursor(gState.cursor, gState.cursor + 1);
  }
}

function removeLetter() {
  if (gState.gameOver) {
    return;
  }
  if (gState.cursor === -1) {
    // at end
    updateCursor(gState.cursor, 5 * gState.line + 4);
    _(gState.cursor).textContent = '';
    markInvalid(false);
  } else if (gState.cursor === 5 * gState.line) {
    // at start
  } else {
    _(gState.cursor - 1).textContent = '';
    updateCursor(gState.cursor, gState.cursor - 1);
    markInvalid(false);
  }
}

function submitGuess() {} // see newGame
function submitGuessHelper(answer) {
  if (gState.gameOver) {
    return;
  }
  if (gState.cursor !== -1) {
    // not at end
    return;
  }
  var guess = '';
  for (var i = 0; i < 5; i++) {
    guess += _(5 * gState.line + i).textContent.toLowerCase();
  }
  if (guess === answer) {
    gState.gameOver = true;
    disableKeyboard();
    congrats(answer, gState.line, gState.seed);
    return;
  }
  if (!DICT[guess]) {
    markInvalid(true);
    return;
  }
  clearHints();
  highlight(-1);
  for (var i = 0; i < 5; i++) {
    _(5 * gState.line + i).classList.remove('selected');
  }
  var result = evaluate(answer, guess, gState.line);
  if (gState.line === 5) {
    // all guesses exhausted
    gState.gameOver = true;
    disableKeyboard();
    oops(answer, gState.line, gState.seed);
    return;
  }
  gState.line++;
  lastLetterHint(result, guess);
  updateCursor(-1, 5 * gState.line);
}

function lastLetterHint(result, guess) {
  var greens = 0;
  var index;
  for (var i = 0; i < 5; i++) {
    if (result[i] === 1) {
      greens++;
    } else {
      index = i;
    }
  }
  if (greens !== 4) {
    return;
  }
  var id = 5 * (gState.line - 1) + index;
  _(id).parentElement.onclick = () => {
    if (gState.gameOver) {
      return;
    }
    clearHints();
    if (id === gState.highlight) {
      highlight(-1);
    } else {
      showHint(guess, index);
      highlight(id);
    }
  };
  showHint(guess, index);
  highlight(id);
}

function showHint(guess, index) {
  for (var i = 0; i < 26; i++) {
    var v = guess.split('');
    v[index] = _ATOZ[i];
    var w = v.join('');
    if (DICT[w]) {
      _('key-' + _ATOZ[i]).classList.add('key-hint');
    }
  }
}

function highlight(i) {
  if (gState.highlight !== -1) {
    _(gState.highlight).classList.add('grey');
    _(gState.highlight).classList.remove('highlight');
  }
  if (i !== -1) {
    _(i).classList.add('highlight');
    _(i).classList.remove('grey');
  }
  gState.highlight = i;
}

function markInvalid(yes) {
  if (gState.invalid === yes) {
    return;
  }
  gState.invalid = yes;
  for (var i = 0; i < 5; i++) {
    var elem = _(5 * gState.line + i);
    if (yes) {
      elem.classList.add('invalid');
    } else {
      elem.classList.remove('invalid');
    }
  }
}

function evaluate(answer, guess, line) {
  var w = answer.split('');
  var g = guess.split('');
  var q = [0, 0, 0, 0, 0]; // 1 = green, 2 = orange
  for (var i = 0; i < 5; i++) {
    if (w[i] === g[i]) {
      q[i] = 1;
      w[i] = '.';
      g[i] = '.';
    }
  }
  for (var i = 0; i < 5; i++) {
    if (q[i] === 0) {
      for (var j = 0; j < 5; j++) {
        if (w[j] === g[i]) {
          q[i] = 2;
          w[j] = '.';
          g[i] = '.';
          break;
        }
      }
    }
  }
  var updates = {};
  var greens = 0;
  for (var i = 0; i < 5; i++) {
    var elem = _(5 * line + i);
    if (q[i] === 1) {
      elem.classList.add('green');
      updates[guess[i]] = 'green';
      greens++;
    } else if (q[i] === 2) {
      elem.classList.add('orange');
      if (!(guess[i] in updates) || guess[i] === 'grey') {
        updates[guess[i]] = 'orange';
      }
    } else {
      elem.classList.add('grey');
      if (!(guess[i] in updates)) {
        updates[guess[i]] = 'grey';
      }
    }
  }
  for (var letter in updates) {
    if (updates[letter] !== 'orange') {
      _('key-' + letter).classList.add('key-' + updates[letter]);
    }
  }
  return q;
}

function oops(word, line, seed) {
  var dictLink = getLink(word, word.toUpperCase());
  var shareLink = `<a id="open-share" href="javascript:void(0)">[share]</a>`;
  setStatus(`So close! The word was ${dictLink}. ${shareLink}`, 'status-red');
  setupShareDialog(false, line, seed);
}

function congrats(word, line, seed) {
  clearHints();
  highlight(-1);
  for (var i = 0; i < 5; i++) {
    var elem = _(5 * line + i);
    elem.classList.remove('selected');
    elem.classList.add('congrats');
    _('key-' + word[i]).classList.add('key-green');
  }
  var dictLink = getLink(word, `[look up ${word.toUpperCase()}]`);
  var shareLink = `<a id="open-share" href="javascript:void(0)">[share]</a>`;
  setStatus(`Congratulations! ${dictLink} ${shareLink}`, 'status-green');
  setupShareDialog(true, line, seed);
}

function getLink(word, text) {
  var url = `https://en.wiktionary.org/wiki/${word}`;
  return `<a href="${url}" target="_blank">${text}</a>`;
}

function setStatus(str, cls) {
  _('status').innerHTML = str;
  _('status').classList.value = cls;
}

function setupShareDialog(win, line, seed) {
  _('open-share').onclick = () => { _('share').style.display = 'block'; };
  var str = '';
  for (var i = 0; i <= line; i++) {
    for (var j = 0; j < 5; j++) {
      var t = _(5 * i + j).classList;
      if (t.contains('green')) {
        str += '&#x1F7E9;';
      } else if (t.contains('orange')) {
        str += '&#x1F7E8;';
      } else if (t.contains('grey')) {
        str += '&#x2B1B;';
      } else {
        // congrats
        str += '&#x1F7E9;';
      }
    }
    str += '<br />';
  }
  str += '<br />';
  if (win) {
    var guesses = line === 0 ? '1 guess' : `${line + 1} guesses`;
    _('share-msg').textContent = `You got the word in ${guesses}!`;
  } else {
    _('share-msg').textContent = `You did not get the word...`;
  }
  _('share-result').innerHTML = str;
  _('share-link').innerHTML = getShareLink(seed);
}

function getShareLink(seed) {
  var link = `http://joak.io/webtoys/wordle/#${escape(seed)}`;
  return `<a href="${link}" target="_blank">[share]</a>`;
}

function getHash() {
  var hash = new URL(document.URL).hash;
  hash = hash.split('#')[1];
  if (hash && hash.trim()) {
    return hash.trim();
  }
  return false;
}

// ================================ //

window.onload = function() {
  // convert list to set
  DICT = ((arr) => {
    var ans = {};
    for (var i in arr) {
      ans[arr[i]] = true;
    }
    return ans;
  })(DICT);

  initElements();
  _('gen-seed').onclick = () => {
    var seed = _('seed').value;
    newGame(seed);
    _('gen-seed').blur();
  };
  _('gen-rand').onclick = () => {
    newGameRandom();
    _('gen-rand').blur();
  };
  window.onkeydown = handleKeyDown;

  _('open-help').onclick = () => { _('help').style.display = 'block'; };
  _('close-help').onclick = () => { _('help').style.display = 'none'; };
  window.onclick = function (event) {
    if (event.target === _('help')) {
      _('help').style.display = 'none';
    } else if (event.target === _('share')) {
      _('share').style.display = 'none';
    }
  };
  _('close-share').onclick = () => { _('share').style.display = 'none'; };

  var hash = getHash();
  if (hash) {
    hash = unescape(hash);
    _('seed').value = hash;
    newGame(hash);
    window.location.hash = '';
  } else {
    newGameRandom();
  }
};