var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var getRatio = function () {
    var ratio;
    ratio = (function () {
        var ctx = window.document.createElement('canvas').getContext('2d');
        var dpr = window.devicePixelRatio || 1;
        var bsr = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio ||
            1;
        return dpr / bsr;
    })();
    ratio = Math.max(ratio, 2);
    return ratio;
};
var BaseCanvas = /** @class */ (function () {
    function BaseCanvas(id, options) {
        var _this = this;
        this.ratio = 1;
        this.timer = 0;
        this.x = -1;
        this.y = -1;
        this.renderedTimer = {};
        this.limitMaxFPS = function (limit, fn) {
            var limitRenderGap = 1000 / limit;
            var lastRenderAt = _this.renderedTimer[fn];
            if (!lastRenderAt || _this.timer - lastRenderAt > limitRenderGap) {
                fn.call(_this);
                _this.renderedTimer[fn] = _this.timer;
            }
        };
        this.draw = function (timer) {
            _this.timer = timer;
            if (!_this.running) {
                return;
            }
            _this.adjustWidth();
            _this.adjustHeight();
            _this.drawFrame(timer);
            var showFPS = _this.options.showFPS;
            if (showFPS) {
                if (_this.timer) {
                    var fps = Math.floor(1000 / (timer - _this.timer));
                    _this.drawFPS(fps);
                }
            }
            _this.timer = timer;
            if (_this.options.afterDraw) {
                _this.options.afterDraw();
            }
            requestAnimationFrame(_this.draw);
        };
        this.ratio = getRatio();
        this.running = false;
        this.options = options;
        this.canvas = document.getElementById(id);
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.bindBaseMouseEvent();
    }
    BaseCanvas.prototype.adjustWidth = function () {
        var w = this.canvas.parentElement.clientWidth;
        this.setWidth(w * this.ratio);
    };
    BaseCanvas.prototype.adjustHeight = function () {
        if (this.options.height === -1) {
            this.setHeight(this.canvas.parentElement.clientHeight * this.ratio);
        }
        else {
            this.setHeight(this.options.height * this.ratio);
        }
    };
    BaseCanvas.prototype.onResizeWidth = function () { };
    BaseCanvas.prototype.setWidth = function (width) {
        if (this.canvas.width !== width) {
            this.canvas.width = width;
            if (this.onResizeWidth) {
                this.onResizeWidth();
            }
        }
    };
    BaseCanvas.prototype.setHeight = function (height) {
        if (this.canvas.height !== height) {
            this.canvas.height = height;
        }
    };
    BaseCanvas.prototype.updateOptions = function (options) {
        this.options = __assign({}, this.options, options);
        if (this.installOptions) {
            this.installOptions();
        }
    };
    BaseCanvas.prototype.setupCanvas = function () {
        this.canvas.style.width = '100%';
        if (this.options.height === -1) {
            this.canvas.style.height = '100%';
        }
        else {
            this.canvas.style.height = this.options.height + "px";
        }
        this.ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    };
    BaseCanvas.prototype.start = function () {
        this.running = true;
        requestAnimationFrame(this.draw);
    };
    BaseCanvas.prototype.stop = function () {
        this.running = false;
    };
    BaseCanvas.prototype.installOptions = function () { };
    BaseCanvas.prototype.drawFPS = function (fps) {
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText("FPS: " + fps, this.canvas.width / 2, this.canvas.height / 2);
    };
    BaseCanvas.prototype.drawFrame = function (timer) {
        throw new Error('draw frame not implement');
    };
    BaseCanvas.prototype.bindBaseMouseEvent = function () {
        var _this = this;
        this.canvas.onmouseleave = function (e) {
            _this.x = -1;
            _this.y = -1;
        };
        this.canvas.onmousemove = function (e) {
            _this.x = e.offsetX * _this.ratio;
            _this.y = e.offsetY * _this.ratio;
        };
    };
    return BaseCanvas;
}());
export { BaseCanvas };
//# sourceMappingURL=baseCanvas.js.map