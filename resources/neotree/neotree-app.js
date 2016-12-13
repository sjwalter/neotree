/**
 * App manager for neotree.
 */
function NeotreeApp() {
  /**
   * Neopixel object used to control the pixels.
   * @private <WebNeopixel>
   */
  this.neopixels_ = new WebNeopixel();

  /**
   * Which screen we're on right now.
   */
  this.currentScreen_ = 'tree-configuration';

  /**
   * @private <TreeConfigurationScreen>
   */
  this.treeConfigurationScreen_;
}


/**
 * Initialize the app and dependencies.
 * @param <Function> cb Callback.
 */
NeotreeApp.prototype.initialize = function(cb) {
  this.neopixels_.initialize(() => {
    this.allAppScreens_ = jQuery('.app-screen');
    this.treeColorElem_ = document.getElementById('tree-color');
    this.treeColorElem_.addEventListener('change', () => {
      this.neopixels_.fill(this.treeColorElem_.jscolor.toString());
    });
    this.effectManager_ = new EffectManager(this.neopixels_);
    this.treeConfigurationScreen_ =
	new TreeConfigurationScreen(this.neopixels_);
    this.twinklingEffect_ = new TwinklingEffect(this.neopixels_);
    this.updateAppState_();
    cb && cb();
  });
};


/**
 * Static method that kicks things off.
 */
NeotreeApp.getThisPartyStarted = function() {
  window.neotreeApp = new NeotreeApp();
  window.neotreeApp.initialize();
};


/**
 * Show the set screen.
 * @private
 */
NeotreeApp.prototype.updateAppState_ = function() {
  //this.allAppScreens_.hide();
  if (this.currentScreen_ == 'tree-configuration') {
    this.treeConfigurationScreen_.show();
  }
};


/**
 * Tree configuration tool. This shows different LED patterns on the tree,
 * attempting to figure out the display matrix.
 * @param <WebNeopixel> neopixel Initialized neopixel object.
 */
function TreeConfigurationScreen(neopixel) {
  /** @private */
  this.neopixel_ = neopixel;

  /** @private */
  this.screenElem_ = jQuery('#tree-configuration-screen');

  /** @private */
  this.startConfigurationButtonElem_ = jQuery('#tree-configuration-start-button');

  /** @private */
  this.statusElem_ = jQuery('#tree-configuration-status');

  /** @private */
  this.minDimensionElem_ = jQuery('#tree-configuration-min-dimension');

  /** @private */
  this.minGroupSizeElem_ = jQuery('#tree-configuration-min-group-size');

  /** @private */
  this.maxDimensionElem_ = jQuery('#tree-configuration-max-dimension');

  /** @private */
  this.lightThresholdElem_ = jQuery('#tree-configuration-light-threshold');

  /** @private */
  this.videoElem_ = document.getElementById('tree-configuration-video');

  /** @private */
  this.canvasElem_ = document.getElementById('tree-configuration-canvas');

  /** @private */
  this.canvasContext_ = this.canvasElem_.getContext('2d');

  // Initialize event listeners.
  this.startConfigurationButtonElem_.click(() => {
    this.startConfiguration_();
  });

  jQuery('#tree-configuration-screen input').change(() => {
    this.updateTrackerParameters_();
  });

  // Register custom tracking colors.
  this.registerTrackingColors_();
  this.startConfiguration_();
}


/**
 * Show the screen.
 */
TreeConfigurationScreen.prototype.show = function() {
  this.screenElem_.show();
};


/**
 * Begin trying to configure the tree.
 */
TreeConfigurationScreen.prototype.startConfiguration_ = function() {
  this.findTreeOutline_();
};


/**
 * Register colors with tracking.
 * @private
 */
TreeConfigurationScreen.prototype.registerTrackingColors_ = function() {
  tracking.ColorTracker.registerColor('red', function(r, g, b) {
    return r > 200 && b < 50 && g < 50;
  });
  tracking.ColorTracker.registerColor('green', function(r, g, b) {
    return g > 200 && r < 50 && b < 50;
  });
  tracking.ColorTracker.registerColor('blue', function(r, g, b) {
    return b > 200 && r < 50 && g < 50;
  });
  tracking.ColorTracker.registerColor('white', function(r, g, b) {
    return r >= g >= b >= 215;
  });
  var lightThreshold = parseInt(this.lightThresholdElem_.val(), 10);
  tracking.ColorTracker.registerColor('light', (r, g, b) => {
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) > lightThreshold;
  });
};
  
  
TreeConfigurationScreen.prototype.updateTrackerParameters_ = function() {
  this.outlineTracker_.setMinDimension(
      parseInt(this.minDimensionElem_.val(), 10));
  this.outlineTracker_.setMinGroupSize(
      parseInt(this.minGroupSizeElem_.val(), 10));
  this.outlineTracker_.setMaxDimension(
      parseInt(this.maxDimensionElem_.val(), 10));
  var lightThreshold = parseInt(this.lightThresholdElem_.val(), 10);
  tracking.ColorTracker.registerColor('light', (r, g, b) => {
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) > lightThreshold;
  });
  tracking.track(
      '#tree-configuration-video', this.outlineTracker_, {camera: false});
};


/**
 * Divide the tree into thirds.
 */
TreeConfigurationScreen.prototype.setThirdsPattern_ = function() {
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
 * Try to find the outline of the tree.
 */
TreeConfigurationScreen.prototype.findTreeOutline_ = function() {
  this.statusElem_.text('Finding tree outline.');
  this.outlineTracker_ = new tracking.ColorTracker(['light']);
  this.updateTrackerParameters_();
  tracking.track(
      '#tree-configuration-video', this.outlineTracker_, {camera: true});
  this.setThirdsPattern_();
  this.outlineTracker_.on('track', (event) => {
    this.canvasContext_.clearRect(
    	0, 0, this.canvasElem_.width, this.canvasElem_.height);
    event.data.forEach((rect) => {
      this.canvasContext_.strokeStyle = '#ff0000';
      this.canvasContext_.strokeRect(rect.x, rect.y, rect.width, rect.height);
    });
  });
};


function EffectManager(neopixels) {
  this.effects_ = {
    'twinkle': new TwinklingEffect(neopixels)
  };
  jQuery('.effect-button').click((evt) => {
    var effectName = jQuery(evt.target).attr('data-effect-name');
    for(var key in this.effects_) {
      if (key != effectName) {
	this.effects_[key].stop();
      }
    }
    this.effects_[effectName].start();
  });

};


/**
 * Simple twinkling.
 */
function TwinklingEffect(neopixels) {
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
