/**
 * A very simple object to download an SVG as PNG.
 */
var dl = {
	// We collect all the junk elements we create with dl.
	_junk: {},

	/**
	* Generates a 32-character identifier to access the canvas
	* and not to mess up existing elements.
	*
	* @return {number} The generated identifier.
	*/
	_tmpId: function() {
		var id = "";
		var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for (var i=0; i<32; i++)
			id += chars.charAt(Math.floor(Math.random() * chars.length));
		return id;
	},

	/**
	* Reads metric options and creates a metrics object used for
	* setting up the canvas.
	*
	* @param {object} svgElem SVG element to convert.
	* @param {object} options Options including canvas settings.
	* @return {object} The metrics describing the canvas.
	*/
	_getMetrics: function(svgElem, options) {
		// Read SVG dimensions
		var svgW = svgElem.attr("width");
		var svgH = svgElem.attr("height");

		// Update metrics
		var m = {
			canvas: {w: svgW, h: svgH},
			scale: {w: 1.0, h: 1.0}
		};
		if (options) {
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
		}

	return m;
	},

	/**
	* Cleans up DOM by removing all the elements we
	* created.
	*/
	_clean: function() {
		if (this._junk) {
			for (var elem in this._junk) {
				this._junk[elem].remove();
			}
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
		// Get SVG element and get options
		var svgElem = d3.select(selector);
		var metrics = this._getMetrics(svgElem, options);

		// Copy SVG content to a temporary div to make sure we only have the graphics
		dl._junk.div = d3.select("body").append("div");
		dl._junk.svg = dl._junk.div.append("svg")
						.attr("version", 1.1)
						.attr("xmlns", "http://www.w3.org/2000/svg")
						.attr("width", svgElem.attr("width"))
						.attr("height", svgElem.attr("height"))
						.html(svgElem.html());

		// Create rescaled canvas
		var id = "dl-png-" + this._tmpId();
		d3.select("canvas").remove();
		dl._junk.canvas = d3.select("body").append("canvas")
							.attr("id", id)
							.attr("width", metrics.canvas.w)
							.attr("height", metrics.canvas.h)
							.style("display", "none").node(0);
		var context = dl._junk.canvas.getContext("2d");
		context.scale(metrics.scale.w, metrics.scale.h);

		// Create image source from clean SVG
		var html = this._junk.svg.node().parentNode.innerHTML;
		var imgsrc = "data:image/svg+xml;base64," + btoa(html);

		// Put image in canvas
		var image = new Image;
		image.onload = function() {
			// Draw image in canvas
			context.drawImage(image, 0, 0);
			var canvasData = dl._junk.canvas.toDataURL("image/png");

			// Create blob from canvas and fill with data
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

			// Create link with the image and trigger the click right away
			var a = document.createElement("a");
			a.download = filename;
			a.href = canvasData;
			a.click();

			// Clean up DOM
			dl._clean();
		};
		image.src = imgsrc;
	}
};
