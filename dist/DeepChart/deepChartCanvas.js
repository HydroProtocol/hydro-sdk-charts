var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import { BaseCanvas } from '../lib/baseCanvas';
import { roundRect } from '../lib/canvasUtils';
import { asks, bids } from './memoryOrderbook';
import { capitalizeFirstLetter } from '../lib/utils';
import BigNumber from 'bignumber.js';
var sortData = function (unsortedData, dataOrder) {
    if (dataOrder === void 0) { dataOrder = 'asc'; }
    unsortedData.sort(function (a, b) {
        if (a[0].eq(b[0])) {
            return 0;
        }
        else {
            if (dataOrder === 'asc') {
                return a[0].lt(b[0]) ? -1 : 1;
            }
            else {
                return a[0].lt(b[0]) ? 1 : -1;
            }
        }
    });
};
var OrderbookDeepChart = /** @class */ (function (_super) {
    __extends(OrderbookDeepChart, _super);
    function OrderbookDeepChart(id, options) {
        var _this = _super.call(this, id, options) || this;
        _this.zoom = new BigNumber(0.7);
        _this.price = new BigNumber('0');
        _this.maxAmount = new BigNumber('0');
        _this.bids = [];
        _this.asks = [];
        _this.getXAxisLabelsCount = function () {
            // 2 for int part
            // 4 for unit
            var testText = '0'.repeat(_this.options.priceDecimals + 2 + 4);
            var width = _this.ctx.measureText(testText).width;
            return Math.min(Math.round(_this.canvas.width / width / 2), 15);
        };
        _this.getRange = function () {
            var bidCount = _this.bids.length;
            var askCount = _this.asks.length;
            var data = bidCount > askCount ? _this.bids : _this.asks;
            var index = Math.ceil(_this.zoom
                .mul(bidCount > askCount ? bidCount : askCount)
                .round(0, BigNumber.ROUND_UP)
                .toNumber()) - 1;
            if (!data[index]) {
                return { left: new BigNumber(0), right: new BigNumber(0) };
            }
            var diff = BigNumber.min(data[index][0].minus(_this.price).abs(), _this.price);
            return {
                left: _this.price.minus(diff),
                right: _this.price.add(diff)
            };
        };
        _this.getPriceByX = function (x) {
            var range = _this.getRange();
            return range.right
                .minus(range.left)
                .times((x / _this.canvas.width).toString())
                .add(range.left);
        };
        _this.getXByPrice = function (price, min, max) {
            return price
                .minus(min)
                .div(max.minus(min))
                .mul(_this.canvas.width);
        };
        _this.getYByPrice = function (price) {
            var res = {
                isValid: false,
                side: '',
                y: 0,
                totalAmount: new BigNumber(0),
                totalCost: new BigNumber(0)
            };
            var totalAmount = new BigNumber(0);
            var totalCost = new BigNumber(0);
            if (_this.bids[0] && price.lte(_this.bids[0][0])) {
                res.isValid = true;
                res.side = 'buy';
                for (var i = 0; i < _this.bids.length; i++) {
                    if (_this.bids[i][0].gte(price)) {
                        totalAmount = totalAmount.add(_this.bids[i][1]);
                        totalCost = totalCost.add(_this.bids[i][1].mul(_this.bids[i][0]));
                    }
                    else {
                        break;
                    }
                }
            }
            else if (_this.asks[0] && price.gte(_this.asks[0][0])) {
                res.isValid = true;
                res.side = 'sell';
                for (var i = 0; i < _this.asks.length; i++) {
                    if (_this.asks[i][0].lte(price)) {
                        totalAmount = totalAmount.add(_this.asks[i][1]);
                        totalCost = totalCost.add(_this.asks[i][1].mul(_this.asks[i][0]));
                    }
                    else {
                        break;
                    }
                }
            }
            else {
                return res;
            }
            res.totalAmount = totalAmount;
            res.totalCost = totalCost;
            res.y = _this.getYByAmount(totalAmount).toNumber();
            return res;
        };
        _this.drawFrame = function (timer) {
            _this.prepareData();
            if (!_this.price) {
                return;
            }
            _this.drawBackground();
            _this.drawDeep();
            _this.drawCurrentPrice();
            _this.drawXAxis();
            _this.drawYAxis();
            _this.drawZoom();
            _this.drawHover();
        };
        _this.bindEvents = function () {
            _this.canvas.onmousedown = function (e) {
                e.preventDefault();
                e.stopPropagation();
                var zoomMetrics = _this.getZoomMetrics();
                if (zoomMetrics.zoomOut.mouseIn) {
                    return _this.zoomOut();
                }
                else if (zoomMetrics.zoomIn.mouseIn) {
                    return _this.zoomIn();
                }
                e.cancelBubble = true;
                var price = _this.getPriceByX(_this.x);
                var _a = _this.getYByPrice(price), isValid = _a.isValid, y = _a.y, side = _a.side, totalAmount = _a.totalAmount, totalCost = _a.totalCost;
                if (!isValid) {
                    return;
                }
                if (_this.options.onClick) {
                    _this.options.onClick({
                        side: side,
                        totalAmount: totalAmount,
                        totalCost: totalCost,
                        price: price
                    });
                }
            };
        };
        // TODO
        // the zoom logic has bug, need to refactor
        _this.zoomOut = function () {
            if (_this.zoom.plus(0.1).lte(1)) {
                _this.zoom = _this.zoom.plus(0.1);
            }
        };
        _this.zoomIn = function () {
            if (_this.zoom.minus(0.1).gte(0.1)) {
                _this.zoom = _this.zoom.minus(0.1);
            }
        };
        _this.options = __assign({}, OrderbookDeepChart.defaultOptions, options);
        _this.bindEvents();
        return _this;
    }
    OrderbookDeepChart.prototype.drawBackground = function () {
        this.ctx.fillStyle = this.options.rowBackgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    };
    OrderbookDeepChart.prototype.getXAxisY = function () {
        return this.canvas.height - this.options.xAxisHeight * this.ratio;
    };
    OrderbookDeepChart.prototype.drawXAxis = function () {
        var color = this.options.axisColor;
        var lineY = this.getXAxisY();
        this.ctx.lineWidth = 1 * this.ratio;
        this.ctx.font = 11 * this.ratio + "px Roboto";
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = this.options.rowBackgroundColor;
        this.ctx.fillRect(0, lineY, this.canvas.width, this.options.xAxisHeight * this.ratio);
        // draw line
        this.ctx.beginPath();
        this.ctx.moveTo(0, lineY);
        this.ctx.strokeStyle = color;
        this.ctx.lineTo(this.canvas.width, lineY);
        this.ctx.stroke();
        // draw labels
        this.ctx.fillStyle = this.options.axisLabelColor;
        var labelHeight = 4 * this.ratio;
        var range = this.getRange();
        var labelCount = this.getXAxisLabelsCount();
        for (var i = 0; i <= labelCount; i++) {
            if (i === 0 || i === labelCount) {
                continue;
            }
            var labelX = (this.canvas.width / labelCount) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(labelX, lineY);
            this.ctx.strokeStyle = color;
            this.ctx.lineTo(labelX, lineY + labelHeight);
            this.ctx.stroke();
            var labelPrice = range.right
                .minus(range.left)
                .div(labelCount)
                .times(i)
                .add(range.left)
                .round(this.options.priceDecimals, BigNumber.ROUND_HALF_EVEN)
                .toFixed(this.options.priceDecimals);
            var labelText = this.options.formatXAxisLabel
                ? this.options.formatXAxisLabel(labelPrice)
                : labelPrice.toString();
            this.ctx.fillText(labelText, labelX, lineY + labelHeight + 1 * this.ratio);
        }
    };
    OrderbookDeepChart.prototype.drawData = function (data, side) {
        var range = this.getRange();
        this.ctx.lineWidth = 1 * this.ratio;
        this.ctx.strokeStyle = 'red';
        var totalAmount = new BigNumber(0);
        this.ctx.beginPath();
        var _x, _y;
        for (var i = 0; i < data.length; i++) {
            var price = new BigNumber(data[i][0]);
            var amount = new BigNumber(data[i][1]);
            totalAmount = totalAmount.add(amount);
            _x = this.getXByPrice(price, range.left, range.right);
            if (i === 0) {
                this.ctx.moveTo(_x.toNumber(), this.canvas.height + 20);
            }
            else {
                this.ctx.lineTo(_x.toNumber(), _y.toNumber());
            }
            _y = this.getYByAmount(totalAmount);
            if (_x.lt(0) || _x.gt(this.canvas.width)) {
                break;
            }
            this.ctx.lineTo(_x.toNumber(), _y.toNumber());
        }
        var outX, strokeStyle, fillStyle;
        if (side === 'buy') {
            strokeStyle = this.options.green;
            outX = -10;
            fillStyle = this.options.greenArea;
        }
        else {
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
    };
    OrderbookDeepChart.prototype.drawDeep = function () {
        if (this.bids.length > 0) {
            this.drawData(this.bids, 'buy');
        }
        if (this.asks.length > 0) {
            this.drawData(this.asks, 'sell');
        }
    };
    OrderbookDeepChart.prototype.getZoomMetrics = function () {
        var zoomBorderLength = 21 * this.ratio;
        var padding = 12 * this.ratio;
        var inAndOutGap = 10 * this.ratio;
        var zoomOut = {
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
        var zoomIn = {
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
            zoomOut: zoomOut,
            zoomIn: zoomIn
        };
    };
    OrderbookDeepChart.prototype.drawZoom = function () {
        var zoomMetrics = this.getZoomMetrics();
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = 18 * this.ratio + "px Roboto";
        this.ctx.strokeStyle = this.options.axisColor;
        this.ctx.fillStyle = this.options.containerBackgroundColor;
        roundRect(this.ctx, zoomMetrics.zoomOut.x, zoomMetrics.zoomOut.y, zoomMetrics.zoomOut.width, zoomMetrics.zoomOut.height, 2 * this.ratio, true, true);
        roundRect(this.ctx, zoomMetrics.zoomIn.x, zoomMetrics.zoomIn.y, zoomMetrics.zoomIn.width, zoomMetrics.zoomIn.height, 2 * this.ratio, true, true);
        this.ctx.fillStyle = zoomMetrics.zoomOut.mouseIn ? this.options.titleColor : this.options.axisLabelColor;
        this.ctx.fillText('-', zoomMetrics.zoomOut.x + zoomMetrics.zoomOut.width / 2, zoomMetrics.zoomOut.y + zoomMetrics.zoomOut.height / 2 + 1 * this.ratio);
        if (zoomMetrics.zoomIn.mouseIn || zoomMetrics.zoomOut.mouseIn) {
            this.canvas.style.cursor = 'pointer';
        }
        else {
            this.canvas.style.cursor = 'default';
        }
        this.ctx.fillStyle = zoomMetrics.zoomIn.mouseIn ? this.options.titleColor : this.options.axisLabelColor;
        this.ctx.fillText('+', zoomMetrics.zoomIn.x + zoomMetrics.zoomIn.width / 2, zoomMetrics.zoomIn.y + zoomMetrics.zoomIn.height / 2 + 1 * this.ratio);
    };
    OrderbookDeepChart.prototype.drawCurrentPrice = function () {
        var range = this.getRange();
        var lineY = this.getXAxisY();
        var _x = this.getXByPrice(this.price, range.left, range.right).toNumber();
        // draw Current Price
        // sizes in ratio(1)
        var priceTextSize = 12;
        var textGapSize = 6;
        var fromTop = 12;
        var padding = 12;
        var helperTextSize = 12;
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textBaseline = 'hanging';
        this.ctx.font = priceTextSize * this.ratio + "px Roboto";
        var currentPriceText = this.price.toFixed(this.options.priceDecimals);
        var currentPriceTextMetrics = this.ctx.measureText(currentPriceText);
        this.ctx.fillStyle = this.options.axisColor;
        this.ctx.font = helperTextSize * this.ratio + "px Roboto";
        var helperText = 'Mid Market Price';
        var helperTextMetrics = this.ctx.measureText(helperText);
        // draw rect
        var maxTextWidth = Math.max(currentPriceTextMetrics.width, helperTextMetrics.width);
        var x = _x - maxTextWidth / 2 - padding * this.ratio;
        var y = fromTop * this.ratio;
        var width = maxTextWidth + padding * this.ratio * 2;
        var height = padding * this.ratio * 2 + (priceTextSize + helperTextSize + textGapSize) * this.ratio;
        this.ctx.fillStyle = this.options.containerBackgroundColor;
        this.ctx.strokeStyle = this.options.axisColor;
        roundRect(this.ctx, x, y, width, height, 2 * this.ratio, true, true);
        // draw price
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = this.options.titleColor;
        this.ctx.font = priceTextSize * this.ratio + "px Roboto";
        this.ctx.fillText(currentPriceText, _x, y + padding * this.ratio);
        // draw helper text
        this.ctx.fillStyle = '#949697';
        this.ctx.font = helperTextSize * this.ratio + "px Roboto";
        this.ctx.fillText(helperText, _x, y + padding * this.ratio + priceTextSize * this.ratio + textGapSize * this.ratio);
        // draw separator
        this.ctx.beginPath();
        this.ctx.moveTo(_x, lineY);
        this.ctx.strokeStyle = this.options.axisColor;
        this.ctx.lineTo(_x, y + height);
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    };
    OrderbookDeepChart.prototype.getDeepAreaHeight = function () {
        return new BigNumber((this.canvas.height - this.options.xAxisHeight * this.ratio).toString());
    };
    OrderbookDeepChart.prototype.getYByAmount = function (amount) {
        var deepAreaHeight = this.getDeepAreaHeight().minus((this.options.paddingTop * this.ratio).toString());
        return deepAreaHeight
            .minus(amount.div(this.maxAmount).mul(deepAreaHeight))
            .add((this.options.paddingTop * this.ratio).toString());
    };
    OrderbookDeepChart.prototype.drawHover = function () {
        if (this.x === -1 || this.y === -1) {
            return;
        }
        var price = this.getPriceByX(this.x);
        var _a = this.getYByPrice(price), isValid = _a.isValid, y = _a.y, side = _a.side, totalAmount = _a.totalAmount, totalCost = _a.totalCost;
        if (!isValid) {
            return;
        }
        var strokeStyle, fillStyle;
        if (side === 'buy') {
            strokeStyle = this.options.green;
            fillStyle = this.options.greenArea;
        }
        else {
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
        var lineY = this.getXAxisY();
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
        var tooltipXDirection, tooltipYDirection;
        var tooltipPadding = 10;
        var fontSize = 12;
        var lineGap = 6;
        var labelsWidth = 60;
        var priceDecimals = this.options.priceDecimals;
        var amountDecimals = this.options.amountDecimals;
        var priceText = price.toFixed(priceDecimals) + " " + this.options.quoteTokenSymbol;
        this.ctx.font = fontSize * this.ratio + "px Roboto";
        var priceTextMetric = this.ctx.measureText(priceText);
        var totalAmountText = totalAmount.toFixed(amountDecimals) + " " + this.options.baseTokenSymbol;
        this.ctx.font = fontSize * this.ratio + "px Roboto";
        var totalAmountTextMetric = this.ctx.measureText(totalAmountText);
        var totalCostText = totalCost.toFixed(priceDecimals) + " " + this.options.quoteTokenSymbol;
        this.ctx.font = fontSize * this.ratio + "px Roboto";
        var totalCostTextMetric = this.ctx.measureText(totalCostText);
        var tooltipWidth = labelsWidth * this.ratio +
            Math.max(priceTextMetric.width, totalAmountTextMetric.width, totalCostTextMetric.width) +
            tooltipPadding * 2 * this.ratio;
        var tooltipHeight = (fontSize * 3 + lineGap * 2 + tooltipPadding * 2) * this.ratio;
        var range = this.getRange();
        var _x = this.getXByPrice(this.price, range.left, range.right).toNumber();
        if (side === 'buy') {
            tooltipXDirection = this.x / _x > 0.5 ? 'left' : 'right';
        }
        else {
            tooltipXDirection = (this.x - _x) / (this.canvas.width - _x) > 0.5 ? 'left' : 'right';
        }
        var deepAreaHeight = this.getDeepAreaHeight().toNumber();
        tooltipYDirection = y > deepAreaHeight / 2 ? 'up' : 'down';
        var tooltipX, tooltipY;
        if (tooltipXDirection === 'left') {
            tooltipX = this.x - tooltipWidth - 1;
        }
        else {
            tooltipX = this.x + 1;
        }
        if (tooltipYDirection === 'up') {
            tooltipY = y - tooltipHeight - 10 * this.ratio;
        }
        else {
            tooltipY = y + 10 * this.ratio;
        }
        this.ctx.beginPath();
        this.ctx.lineWidth = 0;
        this.ctx.rect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
        this.ctx.fillStyle = this.options.containerBackgroundColor;
        this.ctx.fill();
        // this.ctx.stroke();
        this.ctx.font = fontSize * this.ratio + "px Roboto";
        this.ctx.textBaseline = 'hanging';
        this.ctx.fillStyle = this.options.axisLabelColor;
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Price', tooltipX + tooltipPadding * this.ratio, tooltipY + tooltipPadding * this.ratio);
        this.ctx.fillStyle = side === 'buy' ? this.options.red : this.options.green;
        this.ctx.fillText(capitalizeFirstLetter(side), tooltipX + tooltipPadding * this.ratio, tooltipY + (fontSize + tooltipPadding + lineGap) * this.ratio);
        this.ctx.fillText('Cost', tooltipX + tooltipPadding * this.ratio, tooltipY + (tooltipPadding + (lineGap + fontSize) * 2) * this.ratio);
        this.ctx.fillStyle = this.options.titleColor;
        this.ctx.textAlign = 'right';
        this.ctx.fillText(priceText, tooltipX + tooltipWidth - tooltipPadding * this.ratio, tooltipY + tooltipPadding * this.ratio);
        this.ctx.fillText(totalAmountText, tooltipX + tooltipWidth - tooltipPadding * this.ratio, tooltipY + (fontSize + tooltipPadding + lineGap) * this.ratio);
        this.ctx.fillText(totalCostText, tooltipX + tooltipWidth - tooltipPadding * this.ratio, tooltipY + (tooltipPadding + (lineGap + fontSize) * 2) * this.ratio);
    };
    OrderbookDeepChart.prototype.drawYAxis = function () {
        var lineY = this.getXAxisY();
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = this.options.axisLabelColor;
        var x;
        for (var i = 1; i < 5; i++) {
            x = 0;
            var y = ((lineY - this.options.paddingTop * this.ratio) / 100) * (i * 25) + this.options.paddingTop * this.ratio;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.strokeStyle = this.options.axisColor;
            this.ctx.lineTo(4, y);
            this.ctx.stroke();
            // const amount = this.maxAmount.sub(this.maxAmount.div(100).mul(i * 25)).toFixed(this.options.amountDecimals!);
            var amount = this.maxAmount.sub(this.maxAmount.div(100).mul(i * 25));
            var amountText = this.options.formatYAxisLabel ? this.options.formatYAxisLabel(amount) : amount.toFixed(0);
            this.ctx.textAlign = 'left';
            this.ctx.fillText(amountText, 6, y);
            x = this.canvas.width;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.strokeStyle = this.options.axisColor;
            this.ctx.lineTo(x - 4, y);
            this.ctx.stroke();
            this.ctx.textAlign = 'right';
            this.ctx.fillText(amountText, x - 6, y);
        }
    };
    OrderbookDeepChart.prototype.getMiddlePrice = function () {
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
    };
    OrderbookDeepChart.prototype.prepareData = function () {
        this.bids = bids.map(function (bid) {
            // @ts-ignore
            return [new BigNumber(bid.price), new BigNumber(bid.amount)];
        });
        this.asks = asks.map(function (ask) {
            // @ts-ignore
            return [new BigNumber(ask.price), new BigNumber(ask.amount)];
        });
        sortData(this.bids, 'desc');
        sortData(this.asks, 'asc');
        this.price = this.getMiddlePrice();
        var range = this.getRange();
        var bidAmount = new BigNumber(0);
        for (var i = 0; i < this.bids.length; i++) {
            if (this.bids[i][0].lt(range.left)) {
                break;
            }
            bidAmount = bidAmount.add(this.bids[i][1]);
        }
        var askAmount = new BigNumber(0);
        for (var i = 0; i < this.asks.length; i++) {
            if (this.asks[i][0].gt(range.right)) {
                break;
            }
            askAmount = askAmount.add(this.asks[i][1]);
        }
        this.maxAmount = BigNumber.max(askAmount, bidAmount).mul(1.5);
    };
    OrderbookDeepChart.defaultOptions = {
        baseTokenSymbol: '',
        quoteTokenSymbol: '',
        height: 200,
        showFPS: false,
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
        bids: [],
        asks: []
    };
    return OrderbookDeepChart;
}(BaseCanvas));
export { OrderbookDeepChart };
//# sourceMappingURL=deepChartCanvas.js.map