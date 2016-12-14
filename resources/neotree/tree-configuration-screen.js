/**
 * Tree configuration tool. This shows different LED patterns on the tree,
 * attempting to figure out the display matrix.
 * @param <WebNeopixel> neopixel Initialized neopixel object.
 * @constructor
 */
neotree.TreeConfigurationScreen = function(neopixel) {
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
  this.outlineCanvasElem_ =
      document.getElementById('tree-configuration-canvas');

  /** @private */
  this.outlineCanvasCtx_ = this.outlineCanvasElem_.getContext('2d');

  // Initialize event listeners.
  this.startConfigurationButtonElem_.
      click(this.startConfiguration_.bind(this));

  jQuery('#tree-configuration-screen input').
      change(this.updateOutlineTracker_.bind(this));

  /**
   * Set of outlines calculated for each set of tracker rects.
   * @private
   */
  this.recentOutlines_ = [];

  /**
   * Current phase.
   * @private
   */
  this.detectionPhase = 'FIND_OUTLINE';

  /**
   * Timestamp of last track event.
   * @private
   */
  this.lastTrackRefreshTimestamp_ = 0;

  /**
   * When the current phase started
   */
  this.phaseStartTimestamp_ = 0;

  this.startConfiguration_();
}


/**
 * Show the screen.
 */
neotree.TreeConfigurationScreen.prototype.show = function() {
  this.screenElem_.show();
};


/**
 * Begin trying to configure the tree.
 */
neotree.TreeConfigurationScreen.prototype.startConfiguration_ = function() {
  this.neopixel_.fill(8198678);
  this.findTreeOutline_();
};


neotree.TreeConfigurationScreen.prototype.updateOutlineTracker_ =
    function() {
  this.lightThreshold_ = parseInt(this.lightThresholdElem_.val(), 10);
  this.outlineTracker_.setMinDimension(
      parseInt(this.minDimensionElem_.val(), 10));
  this.outlineTracker_.setMinGroupSize(
      parseInt(this.minGroupSizeElem_.val(), 10));
  this.outlineTracker_.setMaxDimension(
      parseInt(this.maxDimensionElem_.val(), 10));
  this.recentOutlines_ = [];
};


/**
 * Try to find the outline of the tree.
 */
neotree.TreeConfigurationScreen.prototype.findTreeOutline_ = function() {
  this.statusElem_.text('Finding tree outline.');
  tracking.ColorTracker.registerColor('light', (r, g, b) => {
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) > this.lightThreshold_;
  });
  this.outlineTracker_ = new tracking.ColorTracker(['light']);
  this.outlineTrackerTask_ = tracking.track(
      '#tree-configuration-video', this.outlineTracker_, {camera: true});
  this.outlineTrackerTask_.on('track', this.handleOutlineTrackerEvent_.bind(this));
  this.updateOutlineTracker_();
};


/**
 * Handle a track event.
 * @param {Event} evt The track event.
 */
neotree.TreeConfigurationScreen.prototype.handleOutlineTrackerEvent_ = function(evt) {
  var SECONDS_BETWEEN_OUTLINE_CHECKS = 1;
  var MS_BETWEEN_SAMPLES = 100;
  var now = Date.now();
  if (!this.phaseStartTimestamp_) {
    // First event of phase. Let's set these to future as a shitty hack to get
    // the camera levels adjusted before we start doing any heavy lifting.
    // Two seconds should do.
    this.phaseStartTimestamp_ = now + 2000;
    this.lastTrackRefreshTimestamp_ = now + 2000;
  }
  if (now - this.lastTrackRefreshTimestamp_ > MS_BETWEEN_SAMPLES) {
    this.lastTrackRefreshTimestamp_ = now;
    this.recentOutlines_.push(this.calculateOutline_(evt.data));
    evt.data.forEach((rect) => {
      neotree.utils.drawRect(
	  this.outlineCanvasCtx_,
	  rect.x, rect.y, rect.width, rect.height, '#0a0a0a', 1);
    });
  }
  if (now - this.phaseStartTimestamp_ > SECONDS_BETWEEN_OUTLINE_CHECKS * 1000) {
    var numStoredOutlines = this.recentOutlines_.length;
    var mostRecentOutline = this.recentOutlines_[numStoredOutlines - 1];
    if (numStoredOutlines >= 5 &&
	this.recentOutlines_.slice(-5).every(function(outlineRect) {
	  return neotree.utils.rectsAreSimilar(outlineRect, mostRecentOutline, 5);
	})) {
      this.outlineTrackerTask_.stop();
      // Give the tree a bit of room to breathe.
      this.treeOutlineRect_ = neotree.utils.expandRect(mostRecentOutline, 10);
      this.handleOutlineFound_();
    } else {
      this.statusElem_.text("Outline was not stable. Retrying...");
      this.clearTrackingCanvas_();
      this.recentOutlines_ = [];
      this.lastTrackRefreshTimestamp_ = null;
      this.phaseStartTimestamp_ = null;
    }
  }
};


/**
 * Handle outline found. Show outline on screen in highlight color, and kick
 * off individual led-finding game.
 * @private
 */
neotree.TreeConfigurationScreen.prototype.handleOutlineFound_ = function() {
  this.clearTrackingCanvas_();
  this.statusElem_.text("Outline found!");
  neotree.utils.drawRect(
      this.outlineCanvasCtx_,
      this.treeOutlineRect_.x, this.treeOutlineRect_.y,
      this.treeOutlineRect_.width, this.treeOutlineRect_.height,
      '#fa1956', 2);
  this.ledFinder_ = new neotree.TreeLedFinder(
      this.treeOutlineRect_, this.neopixel_, this.statusElem_, this.videoElem_);
  this.ledFinder_.start();
};


/**
 * Wipe the tracker canvas slate clean.
 * @private
 */
neotree.TreeConfigurationScreen.prototype.clearTrackingCanvas_ = function() {
  this.outlineCanvasCtx_.clearRect(
      0, 0, this.outlineCanvasElem_.width, this.outlineCanvasElem_.height);
};


/**
 * Calculate the outline.
 */
neotree.TreeConfigurationScreen.prototype.calculateOutline_ = function(rects) {
  var rect = neotree.utils.calculateBoundingRect(
      rects, this.outlineCanvasCtx_, 2.5);
  neotree.utils.drawRect(
      this.outlineCanvasCtx_, rect.x, rect.y, rect.width, rect.height);
  return rect;
};
