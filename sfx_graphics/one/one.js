/**
 * A creator, tessellator, and display for simple shapes.
 *
 * @author Jon Bringhurst <jon@bringhurst.org>
 * @date 2011-03-23
 */

window.onload = (function() {
  this.drawCanvas = document.getElementById('drawCanvas');
  this.displayCanvas = document.getElementById('displayCanvas');

  /** Namespace for the draw. */
  draw = {

    /** The draw canvas context. */
    context : this.drawCanvas.getContext('2d'),

    /** Current mouse coords. */
    mX : null,
    mY : null,

    /** Current shape in canvas space. */
    cV : [],

    /** Determine if we have a complete shape. */
    finished : false,

    /** Click pixel tolerance. */
    tolerance : 20,

    /** Attach event handlers to the draw canvas. */
    attachHandlers : function () {

      /** Track the mouse when it's over the canvas. */
      drawCanvas.onmousemove = function (e) {
        if(e.offsetX) {
          draw.mX = e.offsetX;
          draw.mY = e.offsetY;
        } else if(e.layerX) {
          draw.mX = e.layerX;
          draw.mY = e.layerY;
        }

        draw.context.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        draw.context.beginPath();

        if(draw.cV[0] && draw.cV[1]) {
          draw.context.moveTo(draw.cV[0], draw.cV[1]);

          for(var i = 2; i < draw.cV.length; i = i + 2) {
            draw.context.lineTo(draw.cV[i], draw.cV[i + 1]);
          }

          if(!draw.finished) {
            draw.context.lineTo(draw.mX, draw.mY);
          }

          draw.context.fill();
        }
      };

      /** Build the shape as each edge is placed. */
      drawCanvas.onclick = function (e) {
        draw.finished = false;

        if (e.pageX || e.pageY) {
          draw.cV.push(e.pageX);
          draw.cV.push(e.pageY);
        } else {
          draw.cV.push(e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft);
          draw.cV.push(e.clientY + document.body.scrollTop + document.documentElement.scrollTop);
        }

        draw.cV[draw.cV.length - 2] -= drawCanvas.offsetLeft;
        draw.cV[draw.cV.length - 1] -= drawCanvas.offsetTop;

        if(Math.abs(draw.cV[draw.cV.length - 2] - draw.cV[0]) < draw.tolerance &&
           Math.abs(draw.cV[draw.cV.length - 1] - draw.cV[1]) < draw.tolerance) {

           draw.finished = true;
           draw.cV[draw.cV.length - 2] = draw.cV[0];
           draw.cV[draw.cV.length - 1] = draw.cV[1];
        }
      };
    },

    /** Translate canvas space vertices to GL space. */
    vertices : function () {
      var glV = [];

      for(var i = 0; i < draw.cV.length; i = i + 1) {
        var d = i % 2 === 0 ? drawCanvas.width : drawCanvas.height;
        glV[i] = (draw.cV[i] * 1.0) / d;
      }

      return new Float32Array(glV);
    }
  };

  /** Namespace for the display. */
  display = {

    /** The context for the render. */
    context : this.displayCanvas.getContext('experiemental-webgl'),

    /** Check the vertex cache. */
    updated : false,

    /** Update the vertices from the 2d canvas. */
    update : function () {
      // assume the shape is drawn slower than the refresh.
      if(!draw.finished) {
        display.updated = false;
        return;
      }

      if(!updated && draw.finished) {
        // TODO: grab the vertices and cache to the namespace.
        display.updated = true;
      }
    },

    /** Spin up the render. */
    loop : function () {
      window.setTimeout(function() {
        display.update()
        display.render();
        display.loop();
      }, 10);
    },

    /** Render to the display canvas. */
    render : function () {
        display.context.viewport(0, 0, display.context.viewportWidth,
          display.context.viewportHeight);
        display.context.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

        mat4.identity(mvMatrix);

        mat4.translate(mvMatrix, [-1.5, 0.0, -7.0]);

        display.context.bindBuffer(gl.ARRAY_BUFFER, display.vertexPositionBuffer);
        display.context.vertexAttribPointer(display.shaderProgram.vertexPositionAttribute, display.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        display.setUniforms();

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
    }
  };

  draw.attachHandlers();
  display.loop();
});

/* EOF */
