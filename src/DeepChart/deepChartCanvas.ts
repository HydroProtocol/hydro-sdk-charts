import { BaseCanvas, BaseCanvasOptions } from '../lib/baseCanvas';
import { roundRect } from '../lib/canvasUtils';
import { asks, bids } from './memoryOrderbook';
import { capitalizeFirstLetter } from '../lib/utils';
import BigNumber from 'bignumber.js';

const sortData = (unsortedData, dataOrder = 'asc') => {
  unsortedData.sort((a, b) => {
    if (a[0].eq(b[0])) {
      return 0;
    } else {
      if (dataOrder === 'asc') {
        return a[0].lt(b[0]) ? -1 : 1;
      } else {
        return a[0].lt(b[0]) ? 1 : -1;
      }
    }
  });
};

interface OrderbookDeepChartOptions extends BaseCanvasOptions {
  height: number;
  baseTokenSymbol: string;
  quoteTokenSymbol: string;
  afterDraw?: any;
  rowBackgroundColor?: any;
  showFPS?: boolean;
  borderColor?: string;
  axisColor?: string;
  axisLabelColor?: string;
  formatXAxisLabel?: any;
  priceDecimals?: number;
  amountDecimals?: number;
  paddingTop?: number;
  xAxisHeight?: number;
  formatYAxisLabel?: any;
  onClick?: any;
  green?: any;
  greenArea?: any;
  red?: any;
  redArea?: any;
  titleColor?: any;
  containerBackgroundColor?: any;
  fontFamily?: string;

  midMarketPriceTranslation: string;
  priceTranslation: string;
  costTranslation: string;
  sellTranslation: string;
  buyTranslation: string;
}

export class OrderbookDeepChart extends BaseCanvas {
  public static defaultOptions: OrderbookDeepChartOptions = {
    baseTokenSymbol: '',
    quoteTokenSymbol: '',
    height: 200,
    showFPS: false,
    borderColor: '#363b41',
    axisColor: 'red',
    axisLabelColor: 'white',
    priceDecimals: 5,
    amountDecimals: 2,
    rowBackgroundColor: 'black',
    green: '#00b488',
    greenArea: 'rgba(0, 180, 136, 0.3)',
    red: '#e35e41',
    redArea: 'rgba(227, 94, 65, 0.3)',
    titleColor: '#fff',
    containerBackgroundColor: '#0a0909',
    paddingTop: 20,
    xAxisHeight: 24,
    fontFamily: 'sans-serif',
    bids: [],
    asks: [],

    midMarketPriceTranslation: 'Mid Market Price',
    priceTranslation: 'Price',
    costTranslation: 'Cost',
    sellTranslation: 'Sell',
    buyTranslation: 'Buy'
  };

  protected options: OrderbookDeepChartOptions;

  private zoom: BigNumber = new BigNumber(0.7);
  private price: BigNumber = new BigNumber('0');
  private maxAmount: BigNumber = new BigNumber('0');
  private bids: BigNumber[][] = [];
  private asks: BigNumber[][] = [];

  constructor(id, options: OrderbookDeepChartOptions) {
    super(id, options);
    this.options = { ...OrderbookDeepChart.defaultOptions, ...options };
    this.bindEvents();
  }

  private drawBackground() {
    this.ctx.fillStyle = this.options.rowBackgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private getXAxisLabelsCount = () => {
    // 2 for int part
    // 4 for unit
    const testText = '0'.repeat(this.options.priceDecimals! + 2 + 4);
    const width = this.ctx.measureText(testText).width;
    return Math.min(Math.round(this.canvas.width / width / 2), 15);
  };

  private getRange = () => {
    const bidCount = this.bids.length;
    const askCount = this.asks.length;
    const data = bidCount > askCount ? this.bids : this.asks;

    const index =
      Math.ceil(
        this.zoom
          .mul(bidCount > askCount ? bidCount : askCount)
          .round(0, BigNumber.ROUND_UP)
          .toNumber()
      ) - 1;

    if (!data[index]) {
      return { left: new BigNumber(0), right: new BigNumber(0) };
    }

    const diff = BigNumber.min(data[index][0].minus(this.price).abs(), this.price);
    return {
      left: this.price.minus(diff),
      right: this.price.add(diff)
    };
  };

  private getXAxisY() {
    return this.canvas.height - this.options.xAxisHeight! * this.ratio;
  }

  private drawXAxis() {
    const color = this.options.axisColor!;
    const lineY = this.getXAxisY();

    this.ctx.lineWidth = 1 * this.ratio;
    this.ctx.font = `${11 * this.ratio}px ${this.options.fontFamily}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = this.options.rowBackgroundColor;
    this.ctx.fillRect(0, lineY, this.canvas.width, this.options.xAxisHeight! * this.ratio);

    // draw line
    this.ctx.beginPath();
    this.ctx.moveTo(0, lineY);
    this.ctx.strokeStyle = color;
    this.ctx.lineTo(this.canvas.width, lineY);
    this.ctx.stroke();

    // draw labels
    this.ctx.fillStyle = this.options.axisLabelColor!;
    const labelHeight = 4 * this.ratio;
    const range = this.getRange();
    const labelCount = this.getXAxisLabelsCount();

    for (let i = 0; i <= labelCount; i++) {
      if (i === 0 || i === labelCount) {
        continue;
      }

      const labelX = (this.canvas.width / labelCount) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(labelX, lineY);
      this.ctx.strokeStyle = color;
      this.ctx.lineTo(labelX, lineY + labelHeight);
      this.ctx.stroke();

      const labelPrice = range.right
        .minus(range.left)
        .div(labelCount)
        .times(i)
        .add(range.left)
        .round(this.options.priceDecimals!, BigNumber.ROUND_HALF_EVEN)
        .toFixed(this.options.priceDecimals!);

      const labelText = this.options.formatXAxisLabel
        ? this.options.formatXAxisLabel(labelPrice)
        : labelPrice.toString();

      this.ctx.fillText(labelText, labelX, lineY + labelHeight + 1 * this.ratio);
    }
  }

  private drawData(data, side) {
    const range = this.getRange();
    this.ctx.lineWidth = 1 * this.ratio;
    this.ctx.strokeStyle = 'red';

    let totalAmount = new BigNumber(0);

    this.ctx.beginPath();

    let _x, _y;

    for (let i = 0; i < data.length; i++) {
      const price = new BigNumber(data[i][0]);
      const amount = new BigNumber(data[i][1]);
      totalAmount = totalAmount.add(amount);
      _x = this.getXByPrice(price, range.left, range.right);

      if (i === 0) {
        this.ctx.moveTo(_x.toNumber(), this.canvas.height + 20);
      } else {
        this.ctx.lineTo(_x.toNumber(), _y.toNumber());
      }

      _y = this.getYByAmount(totalAmount);

      if (_x.lt(0) || _x.gt(this.canvas.width)) {
        break;
      }

      this.ctx.lineTo(_x.toNumber(), _y.toNumber());
    }

    let outX, strokeStyle, fillStyle;
    if (side === 'buy') {
      strokeStyle = this.options.green;
      outX = -10;
      fillStyle = this.options.greenArea;
    } else {
      outX = this.canvas.width + 20;
      strokeStyle = this.options.red;
      fillStyle = this.options.redArea;
    }

    this.ctx.lineTo(outX, _y.toNumber());
    this.ctx.lineTo(outX, this.canvas.height + 20);
    this.ctx.closePath();
    this.ctx.strokeStyle = strokeStyle;
    this.ctx.stroke();
    this.ctx.fillStyle = fillStyle;
    this.ctx.fill();
  }

  private drawDeep() {
    if (this.bids.length > 0) {
      this.drawData(this.bids, 'buy');
    }
    if (this.asks.length > 0) {
      this.drawData(this.asks, 'sell');
    }
  }

  private getZoomMetrics() {
    const zoomBorderLength = 21 * this.ratio;
    const padding = 12 * this.ratio;
    const inAndOutGap = 10 * this.ratio;

    const zoomOut = {
      x: this.canvas.width - padding - zoomBorderLength,
      y: padding,
      width: zoomBorderLength,
      height: zoomBorderLength,
      mouseIn: false
    };

    zoomOut.mouseIn =
      this.x !== -1 &&
      this.y !== -1 &&
      this.x > zoomOut.x &&
      this.x < zoomOut.x + zoomOut.width &&
      this.y > zoomOut.y &&
      this.y < zoomOut.y + zoomOut.height;

    const zoomIn = {
      x: this.canvas.width - padding - zoomBorderLength * 2 - inAndOutGap,
      y: padding,
      width: zoomBorderLength,
      height: zoomBorderLength,
      mouseIn: false
    };

    zoomIn.mouseIn =
      this.x !== -1 &&
      this.y !== -1 &&
      this.x > zoomIn.x &&
      this.x < zoomIn.x + zoomIn.width &&
      this.y > zoomIn.y &&
      this.y < zoomIn.y + zoomIn.height;

    return {
      zoomOut,
      zoomIn
    };
  }

  private drawZoom() {
    const zoomMetrics = this.getZoomMetrics();

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = `${18 * this.ratio}px ${this.options.fontFamily}`;
    this.ctx.strokeStyle = this.options.axisColor!;
    this.ctx.fillStyle = this.options.containerBackgroundColor;
    roundRect(
      this.ctx,
      zoomMetrics.zoomOut.x,
      zoomMetrics.zoomOut.y,
      zoomMetrics.zoomOut.width,
      zoomMetrics.zoomOut.height,
      2 * this.ratio,
      true,
      true
    );

    roundRect(
      this.ctx,
      zoomMetrics.zoomIn.x,
      zoomMetrics.zoomIn.y,
      zoomMetrics.zoomIn.width,
      zoomMetrics.zoomIn.height,
      2 * this.ratio,
      true,
      true
    );

    this.ctx.fillStyle = zoomMetrics.zoomOut.mouseIn ? this.options.titleColor : this.options.axisLabelColor;
    this.ctx.fillText(
      '-',
      zoomMetrics.zoomOut.x + zoomMetrics.zoomOut.width / 2,
      zoomMetrics.zoomOut.y + zoomMetrics.zoomOut.height / 2 + 1 * this.ratio
    );

    if (zoomMetrics.zoomIn.mouseIn || zoomMetrics.zoomOut.mouseIn) {
      this.canvas.style.cursor = 'pointer';
    } else {
      this.canvas.style.cursor = 'default';
    }
    this.ctx.fillStyle = zoomMetrics.zoomIn.mouseIn ? this.options.titleColor : this.options.axisLabelColor;
    this.ctx.fillText(
      '+',
      zoomMetrics.zoomIn.x + zoomMetrics.zoomIn.width / 2,
      zoomMetrics.zoomIn.y + zoomMetrics.zoomIn.height / 2 + 1 * this.ratio
    );
  }

  private drawCurrentPrice() {
    const range = this.getRange();
    const lineY = this.getXAxisY();
    const _x = this.getXByPrice(this.price, range.left, range.right).toNumber();

    // draw Current Price

    // sizes in ratio(1)
    const priceTextSize = 12;
    const textGapSize = 6;
    const fromTop = 12;
    const padding = 12;
    const helperTextSize = 12;

    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textBaseline = 'hanging';
    this.ctx.font = `${priceTextSize * this.ratio}px ${this.options.fontFamily}`;
    const currentPriceText = this.price.toFixed(this.options.priceDecimals!);
    const currentPriceTextMetrics = this.ctx.measureText(currentPriceText);

    this.ctx.fillStyle = this.options.axisColor!;
    this.ctx.font = `${helperTextSize * this.ratio}px ${this.options.fontFamily}`;
    const helperText = this.options.midMarketPriceTranslation;
    const helperTextMetrics = this.ctx.measureText(helperText);

    // draw rect
    const maxTextWidth = Math.max(currentPriceTextMetrics.width, helperTextMetrics.width);
    const x = _x - maxTextWidth / 2 - padding * this.ratio;
    const y = fromTop * this.ratio;
    const width = maxTextWidth + padding * this.ratio * 2;
    const height = padding * this.ratio * 2 + (priceTextSize + helperTextSize + textGapSize) * this.ratio;
    this.ctx.fillStyle = this.options.containerBackgroundColor;
    this.ctx.strokeStyle = this.options.axisColor!;
    roundRect(this.ctx, x, y, width, height, 2 * this.ratio, true, true);

    // draw price
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = this.options.titleColor;
    this.ctx.font = `${priceTextSize * this.ratio}px ${this.options.fontFamily}`;
    this.ctx.fillText(currentPriceText, _x, y + padding * this.ratio);

    // draw helper text
    this.ctx.fillStyle = '#949697';
    this.ctx.font = `${helperTextSize * this.ratio}px ${this.options.fontFamily}`;
    this.ctx.fillText(helperText, _x, y + padding * this.ratio + priceTextSize * this.ratio + textGapSize * this.ratio);

    // draw separator
    this.ctx.beginPath();
    this.ctx.moveTo(_x, lineY);
    this.ctx.strokeStyle = this.options.axisColor!;
    this.ctx.lineTo(_x, y + height);
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  private getDeepAreaHeight() {
    return new BigNumber((this.canvas.height - this.options.xAxisHeight! * this.ratio).toString());
  }

  private getYByAmount(amount: BigNumber): BigNumber {
    const deepAreaHeight = this.getDeepAreaHeight().minus((this.options.paddingTop! * this.ratio).toString());
    return deepAreaHeight
      .minus(amount.div(this.maxAmount).mul(deepAreaHeight))
      .add((this.options.paddingTop! * this.ratio).toString());
  }

  private drawHover() {
    if (this.x === -1 || this.y === -1) {
      return;
    }

    const price = this.getPriceByX(this.x);

    const { isValid, y, side, totalAmount, totalCost } = this.getYByPrice(price);

    if (!isValid) {
      return;
    }

    let strokeStyle, fillStyle;
    if (side === 'buy') {
      strokeStyle = this.options.green;
      fillStyle = this.options.greenArea;
    } else {
      strokeStyle = this.options.red;
      fillStyle = this.options.redArea;
    }

    // draw circle at current price
    this.ctx.beginPath();
    this.ctx.arc(this.x, y, 3 * this.ratio, 0, 2 * Math.PI * this.ratio, false);
    this.ctx.fillStyle = strokeStyle;
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(this.x, y, 5 * this.ratio, 0, 2 * Math.PI * this.ratio, false);
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = strokeStyle;
    this.ctx.stroke();

    const lineY = this.getXAxisY();
    this.ctx.beginPath();
    this.ctx.setLineDash([4 * this.ratio, 4 * this.ratio]);
    this.ctx.moveTo(this.x, y);
    this.ctx.strokeStyle = strokeStyle;
    // this.ctx.fillStyle = "transparent"

    this.ctx.lineTo(this.x, lineY);
    this.ctx.lineWidth = 1 * this.ratio;
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // draw tooltip
    let tooltipXDirection, tooltipYDirection;
    const tooltipPadding = 10;
    const fontSize = 12;
    const lineGap = 6;
    const labelsWidth = 60;

    const priceDecimals = this.options.priceDecimals!;
    const amountDecimals = this.options.amountDecimals!;

    const priceText = `${price.toFixed(priceDecimals)} ${this.options.quoteTokenSymbol}`;
    this.ctx.font = `${fontSize * this.ratio}px ${this.options.fontFamily}`;
    const priceTextMetric = this.ctx.measureText(priceText);

    const totalAmountText = `${totalAmount.toFixed(amountDecimals)} ${this.options.baseTokenSymbol}`;
    this.ctx.font = `${fontSize * this.ratio}px ${this.options.fontFamily}`;
    const totalAmountTextMetric = this.ctx.measureText(totalAmountText);

    const totalCostText = `${totalCost.toFixed(priceDecimals)} ${this.options.quoteTokenSymbol}`;
    this.ctx.font = `${fontSize * this.ratio}px ${this.options.fontFamily}`;
    const totalCostTextMetric = this.ctx.measureText(totalCostText);

    let tooltipWidth =
      labelsWidth * this.ratio +
      Math.max(priceTextMetric.width, totalAmountTextMetric.width, totalCostTextMetric.width) +
      tooltipPadding * 2 * this.ratio;
    let tooltipHeight = (fontSize * 3 + lineGap * 2 + tooltipPadding * 2) * this.ratio;

    const range = this.getRange();
    const _x = this.getXByPrice(this.price, range.left, range.right).toNumber();
    if (side === 'buy') {
      tooltipXDirection = this.x / _x > 0.5 ? 'left' : 'right';
    } else {
      tooltipXDirection = (this.x - _x) / (this.canvas.width - _x) > 0.5 ? 'left' : 'right';
    }

    const deepAreaHeight = this.getDeepAreaHeight().toNumber();
    tooltipYDirection = y > deepAreaHeight / 2 ? 'up' : 'down';

    let tooltipX, tooltipY;

    if (tooltipXDirection === 'left') {
      tooltipX = this.x - tooltipWidth - 1;
    } else {
      tooltipX = this.x + 1;
    }

    if (tooltipYDirection === 'up') {
      tooltipY = y - tooltipHeight - 10 * this.ratio;
    } else {
      tooltipY = y + 10 * this.ratio;
    }

    this.ctx.beginPath();
    this.ctx.lineWidth = 0;
    this.ctx.rect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
    this.ctx.fillStyle = this.options.containerBackgroundColor;
    this.ctx.fill();
    this.ctx.lineWidth = 1;
    if (this.options.borderColor) {
      this.ctx.strokeStyle = this.options.borderColor;
    }
    this.ctx.stroke();

    this.ctx.font = `${fontSize * this.ratio}px ${this.options.fontFamily}`;
    this.ctx.textBaseline = 'hanging';

    this.ctx.fillStyle = this.options.axisLabelColor!;
    this.ctx.textAlign = 'left';
    this.ctx.fillText(
      this.options.priceTranslation,
      tooltipX + tooltipPadding * this.ratio,
      tooltipY + tooltipPadding * this.ratio
    );
    this.ctx.fillStyle = side === 'buy' ? this.options.red : this.options.green;
    this.ctx.fillText(
      side === 'buy' ? this.options.buyTranslation : this.options.sellTranslation,
      tooltipX + tooltipPadding * this.ratio,
      tooltipY + (fontSize + tooltipPadding + lineGap) * this.ratio
    );
    this.ctx.fillText(
      this.options.costTranslation,
      tooltipX + tooltipPadding * this.ratio,
      tooltipY + (tooltipPadding + (lineGap + fontSize) * 2) * this.ratio
    );

    this.ctx.fillStyle = this.options.titleColor;
    this.ctx.textAlign = 'right';
    this.ctx.fillText(
      priceText,
      tooltipX + tooltipWidth - tooltipPadding * this.ratio,
      tooltipY + tooltipPadding * this.ratio
    );
    this.ctx.fillText(
      totalAmountText,
      tooltipX + tooltipWidth - tooltipPadding * this.ratio,
      tooltipY + (fontSize + tooltipPadding + lineGap) * this.ratio
    );
    this.ctx.fillText(
      totalCostText,
      tooltipX + tooltipWidth - tooltipPadding * this.ratio,
      tooltipY + (tooltipPadding + (lineGap + fontSize) * 2) * this.ratio
    );
  }

  private getPriceByX = (x: number): BigNumber => {
    const range = this.getRange();
    return range.right
      .minus(range.left)
      .times((x / this.canvas.width).toString())
      .add(range.left);
  };

  private getXByPrice = (price: BigNumber, min: BigNumber, max: BigNumber) => {
    return price
      .minus(min)
      .div(max.minus(min))
      .mul(this.canvas.width);
  };

  private getYByPrice = (
    price: BigNumber
  ): {
    side: string;
    y: number;
    isValid: boolean;
    totalAmount: BigNumber;
    totalCost: BigNumber;
  } => {
    const res = {
      isValid: false,
      side: '',
      y: 0,
      totalAmount: new BigNumber(0),
      totalCost: new BigNumber(0)
    };
    let totalAmount = new BigNumber(0);
    let totalCost = new BigNumber(0);
    if (this.bids[0] && price.lte(this.bids[0][0])) {
      res.isValid = true;
      res.side = 'buy';
      for (let i = 0; i < this.bids.length; i++) {
        if (this.bids[i][0].gte(price)) {
          totalAmount = totalAmount.add(this.bids[i][1]);
          totalCost = totalCost.add(this.bids[i][1].mul(this.bids[i][0]));
        } else {
          break;
        }
      }
    } else if (this.asks[0] && price.gte(this.asks[0][0])) {
      res.isValid = true;
      res.side = 'sell';
      for (let i = 0; i < this.asks.length; i++) {
        if (this.asks[i][0].lte(price)) {
          totalAmount = totalAmount.add(this.asks[i][1]);
          totalCost = totalCost.add(this.asks[i][1].mul(this.asks[i][0]));
        } else {
          break;
        }
      }
    } else {
      return res;
    }

    res.totalAmount = totalAmount;
    res.totalCost = totalCost;

    res.y = this.getYByAmount(totalAmount).toNumber();
    return res;
  };

  private drawYAxis() {
    const lineY = this.getXAxisY();
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = this.options.axisLabelColor!;
    let x;
    for (let i = 1; i < 5; i++) {
      x = 0;
      const y =
        ((lineY - this.options.paddingTop! * this.ratio) / 100) * (i * 25) + this.options.paddingTop! * this.ratio;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.strokeStyle = this.options.axisColor!;
      this.ctx.lineTo(4, y);
      this.ctx.stroke();

      // const amount = this.maxAmount.sub(this.maxAmount.div(100).mul(i * 25)).toFixed(this.options.amountDecimals!);
      const amount = this.maxAmount.sub(this.maxAmount.div(100).mul(i * 25));
      const amountText = this.options.formatYAxisLabel ? this.options.formatYAxisLabel(amount) : amount.toFixed(0);
      this.ctx.textAlign = 'left';
      this.ctx.fillText(amountText, 6, y);

      x = this.canvas.width;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.strokeStyle = this.options.axisColor!;
      this.ctx.lineTo(x - 4, y);
      this.ctx.stroke();

      this.ctx.textAlign = 'right';
      this.ctx.fillText(amountText, x - 6, y);
    }
  }

  public getMiddlePrice() {
    if (!this.bids[0] && !this.asks[0]) {
      return new BigNumber(0);
    }

    if (!this.asks[0]) {
      return this.bids[0][0];
    }

    if (!this.bids[0]) {
      return this.asks[0][0];
    }

    return this.bids[0][0].add(this.asks[0][0]).div(2);
  }

  private prepareData() {
    this.bids = bids.map(bid => {
      // @ts-ignore
      return [new BigNumber(bid.price), new BigNumber(bid.amount)];
    });
    this.asks = asks.map(ask => {
      // @ts-ignore
      return [new BigNumber(ask.price), new BigNumber(ask.amount)];
    });

    sortData(this.bids, 'desc');
    sortData(this.asks, 'asc');

    this.price = this.getMiddlePrice();

    const range = this.getRange();

    let bidAmount = new BigNumber(0);
    for (let i = 0; i < this.bids.length; i++) {
      if (this.bids[i][0].lt(range.left)) {
        break;
      }
      bidAmount = bidAmount.add(this.bids[i][1]);
    }

    let askAmount = new BigNumber(0);
    for (let i = 0; i < this.asks.length; i++) {
      if (this.asks[i][0].gt(range.right)) {
        break;
      }
      askAmount = askAmount.add(this.asks[i][1]);
    }
    this.maxAmount = BigNumber.max(askAmount, bidAmount).mul(1.5);
  }

  protected drawFrame = timer => {
    this.prepareData();

    if (!this.price) {
      return;
    }

    this.drawBackground();
    this.drawDeep();
    this.drawCurrentPrice();
    this.drawXAxis();
    this.drawYAxis();
    this.drawZoom();
    this.drawHover();
  };

  private bindEvents = () => {
    this.canvas.onmousedown = e => {
      e.preventDefault();
      e.stopPropagation();
      const zoomMetrics = this.getZoomMetrics();
      if (zoomMetrics.zoomOut.mouseIn) {
        return this.zoomOut();
      } else if (zoomMetrics.zoomIn.mouseIn) {
        return this.zoomIn();
      }

      e.cancelBubble = true;

      const price = this.getPriceByX(this.x);
      const { isValid, y, side, totalAmount, totalCost } = this.getYByPrice(price);

      if (!isValid) {
        return;
      }

      if (this.options.onClick) {
        this.options.onClick({
          side,
          totalAmount,
          totalCost,
          price
        });
      }
    };
  };

  // TODO
  // the zoom logic has bug, need to refactor
  private zoomOut = () => {
    if (this.zoom.plus(0.1).lte(1)) {
      this.zoom = this.zoom.plus(0.1);
    }
  };

  private zoomIn = () => {
    if (this.zoom.minus(0.1).gte(0.1)) {
      this.zoom = this.zoom.minus(0.1);
    }
  };
}
