/**
 * Random effects that I made while dinking around.
 */


/**
 * Divide the tree into thirds.
 */
neotree.ThirdsEffect = function(neopixels) {
  var pixelData = [];
  var numLeds = this.neopixel_.getNumLeds();
  for(var i = 0; i < numLeds; i++) {
    if (i % 2 == 0) {
      pixelData.push(0);
    } else if (i > 2 * numLeds / 3) {
      pixelData.push(9382148);
    } else if (i > numLeds / 3) {
      pixelData.push(255);
    } else {
      pixelData.push(4850699);
    }
  }
  this.neopixel_.setLeds(pixelData);
};


/**
 * Simple twinkling.
 */
neotree.TwinklingEffect = function(neopixels) {
  this.neopixels_ = neopixels;
  var WHITE_VALUES = [
    '040404',
    '121212',
    '202020',
    '292929',
    '323232',
    '525252',
    '747474',
    '828282',
    '969696',
    'a6a6a6',
    'b0b0b0',
    'c2c2c2',
    'd4d4d4',
    'e4e4e4',
    'f6f6f6',
    'f6f6f6',
    'f7f7f7',
    'f8f8f8',
    'f9f9f9',
    'f0f0f0',
    'f2f2f2',
    'fffff',
  ];

  var ANIMATION_DELAY = 75;
  var numLeds = this.neopixels_.getNumLeds();
  var pixels = [];
  function choosePixels() {
    pixels = [];
    for(var i = 0; i < numLeds; i++) {
      if (Math.random(100) > 0.96) {
	pixels.push(i);
      }
    }
  }
  choosePixels();
  function breathIn(whiteIndex, up) {
    var currentWhiteIndex = whiteIndex || 0;
    var whiteValue = parseInt(WHITE_VALUES[currentWhiteIndex], 16);
    var pixelData = [];
    pixels.forEach(function(index) {
      pixelData.push(index);
      pixelData.push(whiteValue);
    });
    neopixels.setLedsIndexed(pixelData, 1447446);
    var restart = false;
    if (up == true) {
      if (currentWhiteIndex == WHITE_VALUES.length - 1) {
	up = false;
	currentWhiteIndex = WHITE_VALUES.length - 1;
      } else {
	currentWhiteIndex = whiteIndex + 1;
      }
    } else {
      if (currentWhiteIndex == 0) {
	restart = true;
	up = true;
	currentWhiteIndex = 1;
      } else {
	currentWhiteIndex -= 1;
      }
    }
    setTimeout(function() {
      if (shouldStop) {
	return;
      }
      if (restart) {
	choosePixels();
      }
      breathIn(currentWhiteIndex, up);
    }, ANIMATION_DELAY);
  }

  var shouldStop = false;
  this.stop = function() {
    shouldStop = true;
  };
  this.start = function() {
    shouldStop = false;
    breathIn(0, true);
  };
};
