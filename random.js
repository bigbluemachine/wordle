// NOTE: avoid bitwise because JS does not have unsigned ints.
var gRandom;
var gRandomIdx;

// ================================ //

function quot(n, d) { return (n - (n % d)) / d; }

// Initializes a randomizer with a given seed.
function MWC1616(seed) {
  this.x = seed | 1;
  this.y = seed | 2;
}

// Runs an iteration and returns a random number.
MWC1616.prototype.next = function () {
  this.x = 18030 * (this.x % 65536) + quot(this.x, 65536);
  this.y = 30903 * (this.y % 65536) + quot(this.y, 65536);
  return ((65536 * this.x + (this.y % 65536)) % 4294967296) / 4294967296;
};

// ================================ //

function initSeed(seed) {
  gRandomIdx = 0;
  if (seed.length == 0) {
    gRandom = [new MWC1616(0)];
    return;
  }

  // Complicated (yet deterministic) magic
  gRandom = [];
  var x = hash(seed);
  for (var i = 0; i < seed.length; i++) {
    x = (33 * x + seed.charCodeAt(i)) % 65536;
    gRandom.push(new MWC1616(x));
  }
}

function hash(seed) {
  var x = 5381;
  for (var i = 0; i < seed.length; i++) {
    x = (33 * x + seed.charCodeAt(i)) % 65536;
  }
  return x;
}

function myRandom() {
  var ans = gRandom[gRandomIdx].next();
  gRandomIdx = (gRandomIdx + 1) % gRandom.length;
  return ans;
}

function shuffle(arr) {
  for (var i = 1; i < arr.length; i++) {
    var j = Math.floor(myRandom() * (i + 1));
    if (i != j) {
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
  }
}