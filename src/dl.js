/**
 * A very simple object to download an SVG as PNG.
 */
var dl = {
  // We collect all the junk elements we create with dl.
  junk: [],

  /**
   * Generates a 32-character identifier to access the canvas
   * and not to mess up existing elements.
   *
   * @return {number} The generated identifier.
   */
  tmpId: function() {
    var id = "";
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i=0; i<32; i++)
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    return id;
  },

  /**
   * Reads options and creates a metrics object used for
   * setting up the canvas.
   *
   * @param {object} svgElem SVG element to convert.
   * @param {object} options Options including canvas settings.
   * @return {object} The metrics describing the canvas.
   */
  getOptions: function(svgElem, options) {
    // Read SVG dimensions
    var svgW = svgElem.attr("width");
    var svgH = svgElem.attr("height");

    // Update metrics
    var m = {
      canvas: {w: svgW, h: svgH},
      scale: {w: 1.0, h: 1.0}
    };
    if (options.width && options.height) {
      m.canvas.w = options.width;
      m.scale.w = m.canvas.w / svgW;
      m.canvas.h = options.height;
      m.scale.h = m.canvas.h / svgH;
    } else if (options.width) {
      m.canvas.w = options.width;
      m.scale.w = m.canvas.w / svgW;
      m.canvas.h = m.scale.w * svgH;
      m.scale.h = m.scale.w;
    } else if (options.height) {
      m.canvas.h = options.height;
      m.scale.h = m.canvas.h / svgH;
      m.canvas.w = scaleH * svgW;
      m.scale.w = m.scale.h;
    }

    return m;
  },

  /**
   * Adds an element to the body, and also appends it to
   * the junk.
   *
   * @param {string} elemType DOM element type to add.
   * @return {object} The newly added element.
   */
  add: function(elemType) {
    var j = d3.select("body").append(elemType);
    this.junk.push(j);
    return j;
  },

  /**
   * Cleans up DOM by removing all the elements we
   * created.
   */
  clean: function() {
    if (this.junk) {
      this.junk.forEach(function(j) {
        j.remove();
      });
    }
  },

  /**
   * Converts a given SVG to PNG and triggers the download
   * right away.
   *
   * @param {string} selector Selector for the SVG element to convert.
   * @param {string} filename Name of the file to download.
   * @param {object} options Optional settings for the converted image.
   */
  png: function(selector, filename, options) {
    var pdl = this;

    // get SVG element and get options
    var svgElem = d3.select(selector);
    var metrics = this.getOptions(svgElem, options);

    // create rescaled canvas
    var id = "dl-png-" + this.tmpId();
    var canvas = this.add("canvas")
      .attr("id", id)
      .attr("width", metrics.canvas.w)
      .attr("height", metrics.canvas.h)
      .style("display", "none").node(0);
    var context = canvas.getContext("2d");
    context.scale(metrics.scale.w, metrics.scale.h);

    // create image source from SVG
    var html = d3.select("svg")
      .attr("version", 1.1)
      .attr("xmlns", "http://www.w3.org/2000/svg")
      .node().parentNode.innerHTML;
    var imgsrc = "data:image/svg+xml;base64," + btoa(html);

    // put image in canvas
    var image = new Image;
    image.src = imgsrc;
    image.onload = function() {
      // draw image in canvas
      context.drawImage(image, 0, 0);
      var canvasData = canvas.toDataURL("image/png");

      // create blob from canvas and fill with data
      var byteString = atob(document.querySelector("#" + id)
        .toDataURL()
        .replace(/^data:image\/(png|jpg);base64,/, ""));
      var ab = new ArrayBuffer(byteString.length);
      var ia = new Uint8Array(ab);
      for (var i=0; i<byteString.length; i++)
        ia[i] = byteString.charCodeAt(i);
      var dataView = new DataView(ab);
      var blob = new Blob([dataView], {type: "image/png"});
      var DOMURL = self.URL || self.webkitURL || self;
      var newurl = DOMURL.createObjectURL(blob);

      // create link with the image and trigger the click right away
      var a = document.createElement("a");
      a.download = filename;
      a.href = canvasData;
      a.click();

      // clean up DOM
      pdl.clean();
    };
  }
};
