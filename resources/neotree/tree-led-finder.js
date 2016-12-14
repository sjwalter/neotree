/**
 * Loops through pixels finding them on the camera, adding to layout.
 */
neotree.TreeLedFinder = function(outlineRect, neopixel, statusElem, videoElem) {
  this.outlineRect_ = outlineRect;
  this.neopixel_ = neopixel;
  this.statusElem_ = statusElem;
  this.videoElem_ = videoElem;
  this.canvasElem_ = jQuery('#led-finder-canvas');
  this.canvasCtx_ = this.canvasElem_.get(0).getContext('2d');
  this.currentLed_ = 0;
  this.ledLocations_ = {};

  this.ledColor_ = '#ff0000';
  this.lightThreshold_ = 253;
  this.minDimension_ = 1;
  this.minGroupSize_ = 1;
  this.maxDimension_ = 20;
  this.maxTimePerLedMs_ = 200;
};


neotree.TreeLedFinder.prototype.start = function() {
  this.neopixel_.clear();
  this.setupTracker_();
  this.turnOnCurrentLed_();
  this.currentLedTimestamp_ = Date.now();
};


neotree.TreeLedFinder.prototype.turnOnCurrentLed_ = function() {
  this.neopixel_.setLedsIndexed(
      [this.currentLed_, WebNeopixel.normalizeColor(this.ledColor_)], 0);
};


neotree.TreeLedFinder.prototype.setupTracker_ = function() {
  tracking.ColorTracker.registerColor('light', (r, g, b) => {
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) > this.lightThreshold_;
  });
  this.tracker_ = new tracking.ColorTracker(['light']);
  this.tracker_.setMinDimension(this.minDimension_);
  this.tracker_.setMinGroupSize(this.minGroupSize_);
  this.tracker_.setMaxDimension(this.maxDimension_);
  this.trackerTask_ = tracking.track(
      '#tree-configuration-video', this.tracker_, {camera: true});
  this.trackerTask_.on('track', this.handleFindLedTrackEvent_.bind(this));
};


neotree.TreeLedFinder.prototype.handleFindLedTrackEvent_ = function(evt) {
  var now = Date.now();
  if (evt.data) {
    this.ledLocations_[this.currentLed_] = evt.data[0];
  }
  if (now - this.currentLedTimestamp_ > this.maxTimePerLedMs_) {
    this.currentLed_ += 1;
    if (this.currentLed_ > this.neopixel_.getNumLeds()) {
      this.trackerTask_.stop();
    }
    this.turnOnCurrentLed_();
    this.currentLedTimestamp_ = Date.now();
  }
};
