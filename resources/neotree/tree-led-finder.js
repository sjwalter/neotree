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
  this.currentLed_ = 20;
  this.ledLocations_ = {};

  this.ledColor_ = '#ff0000';
  this.iteration_ = 0;
  this.ledIteration_ = 0;
  this.foundLedsThisIteration_ = 0;
  this.done_ = false;
  this.lightThreshold_ = 253;
  this.minDimension_ = 1;
  this.minGroupSize_ = 1;
  this.maxDimension_ = 20;
  this.minTimePerLedMs_ = 100;
  this.maxTimePerLedMs_ = 250;
  this.minSamplesPerLed_ = 3;
};


neotree.TreeLedFinder.prototype.start = function() {
  this.neopixel_.clear();
  this.setupTracker_();
  this.turnOnCurrentLed_();
  this.currentLedTimestamp_ = Date.now() + 2000;
};


neotree.TreeLedFinder.prototype.turnOnCurrentLed_ = function() {
  console.log('Lighting up ' + this.currentLed_);
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
  var timeSinceLedOnMs = now - this.currentLedTimestamp_;
  if (timeSinceLedOnMs < this.minTimePerLedMs_) {
    return;
  }
  var foundRects = evt.data.filter((rect) => {
    return neotree.utils.rectContainsRect(this.outlineRect_, rect);
  });
  if (foundRects.length > 1) {
    // TODO(sjwalter): Must be noise. If this turns out to happen, fix it.
    console.log('Got too many rects for one LED.');
  }
  var foundRect = foundRects[0];
  if (foundRect) {
    neotree.utils.drawRect(
	this.canvasCtx_, foundRect.x, foundRect.y,
	foundRect.width, foundRect.height, '#fff', 1);
    this.ledLocations_[this.currentLed_] = foundRect;
    this.foundLedsThisIteration_ += 1;
  }
  if (timeSinceLedOnMs > this.maxTimePerLedMs_ &&
      this.minSamplesPerLed_ < this.ledIteration_) {
    this.updateCurrentLed_();
    if (this.done_) {
      this.trackerTask_.stop();
      window.leds = this.ledLocations_;
      this.neopixel_.saveLedLocations(this.ledLocations_);
    } else {
      this.turnOnCurrentLed_();
      this.ledIteration_ = 0;
      this.currentLedTimestamp_ = Date.now();
    }
  }
  this.ledIteration_ += 1;
};


neotree.TreeLedFinder.prototype.updateCurrentLed_ = function() {
  if (!this.ledLocations_[this.currentLed_] && this.iteration_ < 2) {
    this.currentLed_ = this.getNextNotFoundLed_(this.currentLed_ + 5);
  } else {
    this.currentLed_ = this.getNextNotFoundLed_(this.currentLed_ + 1);
  }
  if (this.currentLed_ === null) {
    if (this.iteration_ > 3 || this.foundLedsThisIteration_ == 0) {
      // Fuck it dude. Let's go bowling.
      this.done_ = true;
      return;
    }
    this.currentLed_ = this.getNextNotFoundLed_(0);
    this.iteration_ += 1;
  }
};


neotree.TreeLedFinder.prototype.getNextNotFoundLed_ = function(start) {
  for (var i = start; i < this.neopixel_.getNumLeds(); i++) {
    if (!this.ledLocations_[i]) {
      return i;
    }
  }
  return null;
};
