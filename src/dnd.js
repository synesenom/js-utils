/**
 * Class managing drag-and-drop operations.
 */
var dnd = {
  css: {
    overlay: {
      display: "none",
      position: "fixed",
      width: "100%",
      height: "100%",
      "background-color": "rgba(255, 255, 255, 0.9)",
      "font-family": "inherit",
      "font-size": "20pt",
      "font-weight": "200",
      "color": "#3399ff"
    },
    message: {
      position: "absolute",
      top: "50%",
      left: "50%",
      width: "300px",
      height: "80px",
      "margin-left": "-150px",
      "margin-top": "-40px",
      "text-align": "center"
    },
    progressBar: {
      position: "absolute",
      top: "50%",
      left: "50%",
      width: "0px",
      height: "1px",
      "background-color": "#3399ff",
      "margin-left": "-125px"
    }
  },

  // Div
  overlay: null,
  message: null,
  progressBar: null,
  lastTarget: null,

  /**
   * Initializes the class:
   * - Sets style.
   * - Binds events.
   *
   * @param {function} callback Function called when file is loaded.
   * @param {object} style Object for additional style. Possible keys are: overlay.
   */
  init: function(callback, style) {
    var dnd = this;
    dnd.overlay = d3.select("body")
      .append("div")
      .attr("class", "dnd")
      .style(dnd.css.overlay);
    if (style && style.overlay)
      dnd.overlay.style(style.overlay);
    dnd.message = dnd.overlay.append("div")
      .attr("class", "message")
      .style(dnd.css.message);
    dnd.progressBar = dnd.overlay.append("div")
      .attr("class", "progress-bar")
      .style(dnd.css.progressBar);

    // Drag enter
    d3.select(window).on("dragenter", function(){
      var e = d3.event;
      e.preventDefault();
      e.stopPropagation();
      dnd.lastTarget = e.target;
      dnd.overlay.style({"display": "block", "opacity": 1});
      dnd.message.text("Drop file to upload");
      dnd.progressBar.style("width", "0px");
    });

    // Drag over
    d3.select(window).on("dragover", function(){
      var e = d3.event;
      e.preventDefault();
      e.stopPropagation();
      dnd.lastTarget = e.target;
    });

    // Drag leave
    d3.select(window).on("dragleave", function(){
      var e = d3.event;
      e.preventDefault();
      e.stopPropagation();
      if(e.target === dnd.lastTarget) {
        dnd.overlay.style("display", "none");
        dnd.message.text("");
      }
    });

    // Drop
    d3.select(window).on("drop", function(){
      var e = d3.event;
      e.preventDefault();
      e.stopPropagation();

      // Read file
      if(e.target === dnd.lastTarget) {
        var filename = e.dataTransfer.files[0].name;
        reader = new FileReader();
        reader.readAsText(e.dataTransfer.files[0]);

        reader.onprogress = function(e) {
          if (e.lengthComputable) {
            var percentLoaded = Math.round((e.loaded / e.total) * 100);
            if (percentLoaded < 100)
              dnd.progressBar.style("width", percentLoaded*2.5 + "px");
          }
        };

        reader.onloadstart = function(e) {
          dnd.message.text("Reading file");
        };
        reader.onload = function(e) {
          dnd.progressBar.style("width", "0px");
          dnd.message.text("Done!");
          dnd.overlay
            .transition().duration(1000)
            .style("opacity", 0)
            .each("end", function() {
              d3.select(this).style("display", "none");
            });
          callback(reader.result, filename);
        };
      }
    });
  }
};
