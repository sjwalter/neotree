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
  this.videoElem_ = document.getElementById('tree-configuration-video');

  /** @private */
  this.canvasElem_ = document.getElementById('tree-configuration-canvas');

  /** @private */
  this.canvasContext_ = this.canvasElem_.getContext('2d');

  // Initialize event listeners.
  this.startConfigurationButtonElem_.click(() => {
    this.startConfiguration_();
  });

  // Register custom tracking colors.
  this.registerTrackingColors_();
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
  tracking.ColorTracker.registerColor('light', function(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 100;
  });
};

/**
 * Try to find the outline of the tree.
 */
TreeConfigurationScreen.prototype.findTreeOutline_ = function() {
  this.statusElem_.text('Finding tree outline.');
  this.outlineTracker_ = new tracking.ColorTracker(['light']);
  this.outlineTracker_.setMinDimension(5);
  this.outlineTracker_.setMinGroupSize(5);
  this.outlineTracker_.setMaxDimension(25);
  tracking.track(
      '#tree-configuration-video', this.outlineTracker_, {camera: true});
  this.neopixel_.fill(16711680);
  this.outlineTracker_.on('track', (event) => {
    this.canvasContext_.clearRect(
	0, 0, this.canvasElem_.width, this.canvasElem_.height);
    event.data.forEach((rect) => {
      if (rect.color == 'custom') {
	rect.color = 'red';
      }

      this.canvasContext_.strokeStyle = rect.color;
      this.canvasContext_.strokeRect(rect.x, rect.y, rect.width, rect.height);
      this.canvasContext_.font = '6px Helvetica';
      this.canvasContext_.fillStyle = '#fff';
      this.canvasContext_.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11);
      this.canvasContext_.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);

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
    '323232',
    '525252',
    '747474',
    '969696',
    'b0b0b0',
    'c2c2c2',
    'e4e4e4',
    'f6f6f6'
  ];

  var ANIMATION_DELAY = 100;
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
    neopixels.setLeds(pixelData, 1447446);
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
