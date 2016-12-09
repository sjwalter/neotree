/**
 * Tree configurator thing.
 */
function TreeConfigurator(width, height) {
  this.scene_ = new THREE.Scene();
  this.camera_ = new THREE.PerspectiveCamera(
      70,
      width / height,
      0.1,
      1000);
  this.renderer_ = new THREE.WebGLRenderer();
  this.renderer_.setSize(width, height);

  this.treeGeometry_ = new THREE.ConeGeometry(2, 4, 8);
  this.treeMaterial_ = new THREE.MeshBasicMaterial(
      {color: 0x1aff1a, wireframe: true});
  this.tree_ = new THREE.Mesh(this.treeGeometry_, this.treeMaterial_);
  this.scene_.add(this.tree_);
  this.camera_.position.z = 15;
}

TreeConfigurator.prototype.startRenderLoop = function() {
  this.renderLoop_();
};


TreeConfigurator.prototype.renderLoop_ = function() {
  requestAnimationFrame(this.renderLoop_.bind(this));
//  this.tree_.rotation.x += 0.01;
//  this.tree_.rotation.x += 0.01;
  this.renderer_.render(this.scene_, this.camera_);
};

TreeConfigurator.prototype.initialize = function() {
  document.body.appendChild(this.renderer_.domElement);
};


TreeConfigurator.start = function() {
  document.addEventListener('DOMContentLoaded', function() {
    var tc = new TreeConfigurator(window.innerWidth, window.innerHeight);
    tc.initialize();
    tc.startRenderLoop();
  });
};

TreeConfigurator.start();
