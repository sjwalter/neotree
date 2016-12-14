/**
 * Collection of little utility things.
 */
neotree.utils = {};


/**
 * Given a set of rects, return a rect that contains all of them, less outliers.
 * @param {Array.<Object>} rects Rects!
 * @param {CanvasContext} opt_canvasCtx Canvas context to debug stuff on.
 */
neotree.utils.calculateBoundingRect =
    function (rects, opt_canvasCtx, opt_outlierStdDevThreshold) {
  var smallestX = Infinity;
  var smallestY = Infinity;
  var largestX = 0;
  var largestY = 0;

  var validRectangles = neotree.utils.removeOutliers(
      rects, opt_canvasCtx, opt_outlierStdDevThreshold);
  validRectangles.forEach(function(rect) {
    if (rect.x < smallestX) {
      smallestX = rect.x;
    }
    if (rect.y < smallestY) {
      smallestY = rect.y;
    }
    if (rect.x + rect.width > largestX) {
      largestX = rect.x + rect.width;
    }
    if (rect.y + rect.height > largestY) {
      largestY = rect.y + rect.height;
    }
  });
  return {
    x: smallestX,
    y: smallestY,
    width: largestX - smallestX,
    height: largestY - smallestY
  };
}


/**
 * Given a set of rectangles, remove outliers.
 * @param{Object} rects Rects!
 * @param{CanvasContext} opt_canvasCtx If provided, draw some debug stuff here.
 * @param{opt_outlierStdDevThreshold} opt_outlierStdDevThreshold The threshold,
 *    in standard deviations, at which rects are considered outliers. Default 2.
 */
neotree.utils.removeOutliers =
    function(rects, opt_canvasCtx, opt_outlierStdDevThreshold) {
  var totalX = 0;
  var totalY = 0;
  var weightsX = 0;
  var weightsY = 0;
  rects.forEach(function(rect) {
    totalX += Math.round(rect.x + (rect.width / 2)) * rect.width;
    weightsX += rect.width;
    totalY += Math.round(rect.y + (rect.height / 2)) * rect.height;
    weightsY += rect.height;
  });
  var averageX = Math.round(totalX / (weightsX));
  var averageY = Math.round(totalY / (weightsY));
  var averagePt = {
    x: averageX,
    y: averageY
  };
  var squaredDiffX = 0;
  var squaredDiffY = 0;
  rects.forEach(function(rect) {
    squaredDiffX += Math.pow(rect.x + rect.width / 2 - averageX, 2);
    squaredDiffY += Math.pow(rect.y + rect.height / 2 - averageY, 2);
  });
  var stdDevX = Math.sqrt(squaredDiffX / rects.length);
  var stdDevY = Math.sqrt(squaredDiffY / rects.length);
  if (opt_canvasCtx) {
    neotree.utils.drawRect(
	opt_canvasCtx, averageX - 5, averageY - 5, 10, 10, '#00FF00');
  }
  var maxStdDev = opt_outlierStdDevThreshold || 2;
  return rects.filter(function(rect) {
    return (rect.x + rect.width / 2 < averageX + maxStdDev * stdDevX &&
	rect.x + rect.width / 2 > averageX - maxStdDev * stdDevX) &&
	(rect.y + rect.height / 2 < averageY + maxStdDev * stdDevY &&
	rect.y + rect.height / 2 > averageY - maxStdDev * stdDevY);
    });
};


/**
 * Return a rect bigger by the specified size.
 * @param {object} rect Rect!
 * @param {number} marginIncrease Size to increase in px.
 * @return {object} The new rect!
 */
neotree.utils.expandRect = function(rect, marginIncrease) {
  return {
    x: rect.x <= marginIncrease ? 0 : rect.x - marginIncrease,
    y: rect.y <= marginIncrease ? 0 : rect.y - marginIncrease,
    width: rect.width + marginIncrease,
    height: rect.height + marginIncrease
  };
};


/**
 * Draw a rect on a canvas.
 * @param {CanvasContext} canvasCtx The canvas context.
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} opt_color Color, default 'green'.
 * @param {number} opt_strokeWidth Stroke width, default 2.
 */
neotree.utils.drawRect =
    function(canvas, x, y, width, height, opt_color, opt_strokeWidth) {
  canvas.beginPath();
  canvas.lineWidth = opt_strokeWidth || 2;
  canvas.strokeStyle = opt_color || 'green';
  canvas.rect(x, y, width, height);
  canvas.stroke();
  canvas.closePath();
};


/**
 * Return the distance between two points.
 * @param {Object} a A!
 * @param {Object} b B!
 */
neotree.utils.distance = function(a, b) {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}


/**
 * Returns whether two rects are similar, as in no point further than
 * threshold distance (default is 5px).
 * @param {object} rectA RectA!
 * @param {object} rectB RectB!
 * @param {number} opt_distanceThreshold Distance threshold in px.
 * @return {boolean} Whether they're similar.
 */
neotree.utils.rectsAreSimilar = function (rectA, rectB, opt_distanceThreshold) {
  return neotree.utils.distance(rectA, rectB) <= opt_distanceThreshold && 
      neotree.utils.distance(
	  {x: rectA.x + rectA.width, y: rectA.y + rectA.height},
	  {x: rectB.x + rectB.width, y: rectB.y + rectB.height}
	) <= opt_distanceThreshold;
};
