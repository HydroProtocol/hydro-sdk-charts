export interface BaseCanvasOptions {
  height: number;
  afterDraw?: any;
  showFPS?: boolean;
}

const getRatio = (): number => {
  let ratio;

  ratio = (function() {
    const ctx: any = window.document.createElement('canvas').getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;

    const bsr =
      ctx.webkitBackingStorePixelRatio ||
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

export class BaseCanvas {
  protected ratio: number = 1;
  protected options: BaseCanvasOptions;
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected running: boolean;
  protected timer: number = 0;
  protected x: number = -1;
  protected y: number = -1;

  protected renderedTimer = {};

  constructor(id, options) {
    this.ratio = getRatio();
    this.running = false;
    this.options = options;
    this.canvas = document.getElementById(id)! as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.setupCanvas();
    this.bindBaseMouseEvent();
  }

  public adjustWidth() {
    const w = this.canvas.parentElement!.clientWidth;
    this.setWidth(w * this.ratio);
  }

  public adjustHeight() {
    if (this.options.height === -1) {
      this.setHeight(this.canvas.parentElement!.clientHeight * this.ratio);
    } else {
      this.setHeight(this.options.height * this.ratio);
    }
  }

  protected onResizeWidth() {}

  private setWidth(width: number) {
    if (this.canvas.width !== width) {
      this.canvas.width = width;
      if (this.onResizeWidth) {
        this.onResizeWidth();
      }
    }
  }

  private setHeight(height: number) {
    if (this.canvas.height !== height) {
      this.canvas.height = height;
    }
  }

  public updateOptions(options) {
    this.options = { ...this.options, ...options };
    if (this.installOptions) {
      this.installOptions();
    }

    if (this.running) {
      this.drawCommonFPS(performance.now(), true);
    }
  }

  protected limitMaxFPS = (limit, fn) => {
    const limitRenderGap = 1000 / limit;
    const lastRenderAt = this.renderedTimer[fn];

    if (!lastRenderAt || this.timer - lastRenderAt > limitRenderGap) {
      fn.call(this);
      this.renderedTimer[fn] = this.timer;
    }
  };

  public setupCanvas() {
    this.canvas.style.width = '100%';
    if (this.options.height === -1) {
      this.canvas.style.height = '100%';
    } else {
      this.canvas.style.height = `${this.options.height}px`;
    }
    this.ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
  }

  public start() {
    this.running = true;
    this.drawCommonFPS(performance.now());
    requestAnimationFrame(this.drawHighFPS);
  }

  public stop() {
    this.running = false;
  }

  protected installOptions() {}

  public isOnHover(): boolean {
    if (this.x === -1 || this.y === -1) {
      return false;
    }
    return true;
  }

  // Now, method below is running smoothly!
  // Won't merge drawCommonFPS and drawHighFPS to one function and use if(isOnHover()) to decide to run common or high FPS.
  // I tried using one function and judge to draw, it's little slowly when mouse enter, since it need 200ms to draw when enter.
  protected drawCommonFPS = (timer: number, once: boolean = false) => {
    if (!this.running) {
      return;
    }

    if (!this.isOnHover()) {
      this.adjustWidth();
      this.adjustHeight();

      this.drawFrame(timer);

      const { showFPS } = this.options;

      if (showFPS) {
        if (this.timer) {
          const fps = Math.floor(1000 / (timer - this.timer));
          this.drawFPS(fps);
        }
      }

      this.timer = timer;

      if (this.options.afterDraw) {
        this.options.afterDraw();
      }
    }

    if (!once) {
      setTimeout(() => this.drawCommonFPS(performance.now()), 200);
    }
  };

  protected drawHighFPS = (timer: number) => {
    if (!this.running) {
      return;
    }

    if (this.isOnHover()) {
      this.drawFrame(timer);

      const { showFPS } = this.options;

      if (showFPS) {
        if (this.timer) {
          const fps = Math.floor(1000 / (timer - this.timer));
          this.drawFPS(fps);
        }
      }

      this.timer = timer;

      if (this.options.afterDraw) {
        this.options.afterDraw();
      }
    }

    requestAnimationFrame(this.drawHighFPS);
  };

  protected drawFPS(fps: number) {
    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillText(`FPS: ${fps}`, this.canvas.width / 2, this.canvas.height / 2);
  }

  protected drawFrame(timer: number) {
    throw new Error('draw frame not implement');
  }

  protected bindBaseMouseEvent() {
    this.canvas.onmouseleave = e => {
      this.x = -1;
      this.y = -1;

      this.drawCommonFPS(performance.now(), true);
    };

    this.canvas.onmousemove = e => {
      this.x = e.offsetX * this.ratio;
      this.y = e.offsetY * this.ratio;
    };
  }
}
