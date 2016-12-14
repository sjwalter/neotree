/**
 * App manager for neotree.
 */
neotree.NeotreeApp = function() {
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
   * @private <neotree.TreeConfigurationScreen>
   */
  this.treeConfigurationScreen_;
}


/**
 * Initialize the app and dependencies.
 * @param <Function> cb Callback.
 */
neotree.NeotreeApp.prototype.initialize = function(cb) {
  this.neopixels_.initialize(() => {
    this.allAppScreensElem_ = jQuery('.app-screen');
    this.treeColorElem_ = document.getElementById('tree-color');
    this.treeColorElem_.addEventListener('change', () => {
      this.neopixels_.fill(this.treeColorElem_.color.toString());
    });
    this.treeConfigurationScreen_ =
	new neotree.TreeConfigurationScreen(this.neopixels_);
    this.updateAppState_();
    cb && cb();
  });
};


/**
 * Static method that kicks things off.
 */
neotree.NeotreeApp.getThisPartyStarted = function() {
  window.neotreeApp = new neotree.NeotreeApp();
  window.neotreeApp.initialize();
};


/**
 * Show the set screen.
 * @private
 */
neotree.NeotreeApp.prototype.updateAppState_ = function() {
  this.allAppScreensElem_.hide();
  if (this.currentScreen_ == 'tree-configuration') {
    this.treeConfigurationScreen_.show();
  }
};
