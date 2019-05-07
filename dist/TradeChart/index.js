"use strict";
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importStar(require("react"));
var d3_format_1 = require("d3-format");
var d3_time_format_1 = require("d3-time-format");
var d3_shape_1 = require("d3-shape");
var react_stockcharts_1 = require("react-stockcharts");
var series_1 = require("react-stockcharts/lib/series");
var axes_1 = require("react-stockcharts/lib/axes");
var coordinates_1 = require("react-stockcharts/lib/coordinates");
var scale_1 = require("react-stockcharts/lib/scale");
var helper_1 = require("react-stockcharts/lib/helper");
var utils_1 = require("react-stockcharts/lib/utils");
var indicator_1 = require("react-stockcharts/lib/indicator");
var tooltip_1 = require("react-stockcharts/lib/tooltip");
var interactive_1 = require("react-stockcharts/lib/interactive");
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var Select_1 = __importDefault(require("../Select"));
var constants_1 = require("./constants");
var variables_1 = require("../variables/variables");
// one candle width is 18px * 0.5
var CANDLE_WIDTH_AND_GAP = 18;
var TradeChart = /** @class */ (function (_super) {
    __extends(TradeChart, _super);
    function TradeChart(props) {
        var _this = _super.call(this, props) || this;
        var isShowEMA12LocalStorage = window.localStorage.getItem('isShowEMA12');
        var isShowEMA26LocalStorage = window.localStorage.getItem('isShowEMA26');
        var isShowEMA12 = isShowEMA12LocalStorage === null ? false : isShowEMA12LocalStorage === 'true';
        var isShowEMA26 = isShowEMA26LocalStorage === null ? false : isShowEMA26LocalStorage === 'true';
        var granularityStr = window.localStorage.getItem('granularityStr') || '1d';
        var chart = window.localStorage.getItem('chart') || 'candle';
        _this.state = {
            chart: chart,
            granularityStr: granularityStr,
            isShowEMA12: isShowEMA12,
            isShowEMA26: isShowEMA26
        };
        return _this;
    }
    TradeChart.prototype.getVariables = function () {
        var theme = this.props.theme;
        return theme === 'light' ? variables_1.themeLight : variables_1.themeDark;
    };
    TradeChart.prototype.componentWillUnmount = function () {
        if (this.interval) {
            window.clearInterval(this.interval);
        }
    };
    TradeChart.prototype.handleLoadMore = function (start, end) {
        var handleLoadMore = this.props.handleLoadMore;
        if (!handleLoadMore) {
            return;
        }
        start = Math.ceil(start);
        if (start === end) {
            return;
        }
        // this.loadLeft(start, end);
        handleLoadMore({ start: start, end: end });
    };
    TradeChart.prototype.fixData = function (data) {
        var fd = []; // fixedData
        var granularityNum = this.generateParams(this.state.granularityStr).granularityNum;
        for (var i = 0; i < data.length; i++) {
            data[i].open = parseFloat(data[i].open);
            data[i].high = parseFloat(data[i].high);
            data[i].low = parseFloat(data[i].low);
            data[i].close = parseFloat(data[i].close);
            data[i].volume = parseFloat(data[i].volume);
            var scale = Math.ceil((data[i].time || data[i].date) / 1000 / granularityNum);
            var gap = i === 0 ? -1 : scale - fd[fd.length - 1].date;
            if (i === 0 || gap === 1) {
                fd.push({
                    date: scale,
                    open: data[i].open,
                    high: data[i].high,
                    low: data[i].low,
                    close: data[i].close,
                    volume: data[i].volume
                });
                continue;
            }
            var lastFd = fd[fd.length - 1];
            if (gap === 0) {
                var volume = lastFd.volume + data[i].volume;
                if (lastFd.open === data[i].open &&
                    lastFd.high === data[i].high &&
                    lastFd.low === data[i].low &&
                    lastFd.close === data[i].close &&
                    lastFd.volume === data[i].volume) {
                    volume = lastFd.volume;
                }
                fd[fd.length - 1] = {
                    date: scale,
                    open: lastFd.open,
                    high: Math.max(lastFd.high, data[i].high),
                    low: Math.min(lastFd.low, data[i].low),
                    close: data[i].close,
                    volume: volume
                };
            }
            else if (gap > 1) {
                for (var j = 1; j < gap; j++) {
                    fd.push({
                        date: lastFd.date + j,
                        open: lastFd.close,
                        high: lastFd.close,
                        low: lastFd.close,
                        close: lastFd.close,
                        volume: 0
                    });
                }
                fd.push({
                    date: scale,
                    open: data[i].open,
                    high: data[i].high,
                    low: data[i].low,
                    close: data[i].close,
                    volume: data[i].volume
                });
            }
        }
        for (var i = 0; i < fd.length; i++) {
            fd[i].date = new Date(fd[i].date * 1000 * granularityNum);
        }
        return fd;
    };
    TradeChart.prototype.generateParams = function (granularityStr, from, to) {
        if (from === void 0) { from = null; }
        if (to === void 0) { to = null; }
        var granularityNum;
        to = to || Math.floor(new Date().getTime() / 1000);
        switch (granularityStr) {
            // case "1m":
            //   granularityNum = 60;
            //   from = from || to - 60 * 60 * 24 * 365 / 60; // 356 * 24 points, from 6 days ago;
            //   break;
            case '5m':
                granularityNum = 60 * 5;
                from = from || to - (60 * 60 * 24 * 365) / 12; // 356 * 24 points, from 1 month ago
                break;
            // case "15m":
            //   granularityNum = 60 * 15;
            //   from = from || to - 60 * 60 * 24 * 365 / 4; // 356 * 24 points, from 3 month ago
            //   break;
            case '1h':
                granularityNum = 60 * 60;
                from = from || to - 60 * 60 * 24 * 365; // 356 * 24 points, from 1 year ago
                break;
            // case "6h":
            //   granularityNum = 60 * 60 * 6;
            //   from = from || to - 60 * 60 * 24 * 365; // 356 * 4 points, from 1 year ago
            //   break;
            case '1d':
                granularityNum = 60 * 60 * 24;
                from = from || to - 60 * 60 * 24 * 365; // 356 points, from 1 year ago
                break;
            // case "1w":
            //   granularityNum = 60 * 60 * 24 * 7;
            //   from = from || to - 60 * 60 * 24 * 365; // 52 points, from 1 year ago
            //   break;
            // case "1mon":
            //   granularityNum = 60 * 60 * 24 * 30;
            //   from = from || to - 60 * 60 * 24 * 365; // 12 points, from 1 year ago
            //   break;
            default:
                // same as 1h
                granularityNum = 60 * 60;
                from = from || to - 60 * 60 * 24 * 365;
                break;
        }
        return {
            from: from,
            to: to,
            granularityNum: granularityNum
        };
    };
    TradeChart.prototype.fitLengthToShow = function () {
        var width = this.props.width;
        // ChartCanvas margin right 50;
        return Math.ceil((width - 50) / CANDLE_WIDTH_AND_GAP);
    };
    TradeChart.prototype.selectEMA = function (value) {
        if (value === 'ema12') {
            this.setState({ isShowEMA12: !this.state.isShowEMA12 });
            window.localStorage.setItem('isShowEMA12', "" + !this.state.isShowEMA12);
        }
        else if (value === 'ema26') {
            this.setState({ isShowEMA26: !this.state.isShowEMA26 });
            window.localStorage.setItem('isShowEMA26', "" + !this.state.isShowEMA26);
        }
    };
    TradeChart.prototype.changeScroll = function () {
        var style = document.body.style.overflow;
        document.body.style.overflow = style === 'hidden' ? 'auto' : 'hidden';
    };
    TradeChart.prototype.render = function () {
        var _this = this;
        var _a = this.props, width = _a.width, ratio = _a.ratio, height = _a.height, currentMarket = _a.currentMarket, clickCallback = _a.clickCallback;
        var ema26 = indicator_1.ema()
            .id(0)
            .options({ windowSize: 26 })
            .merge(function (d, c) {
            d.ema26 = c;
        })
            .accessor(function (d) { return d.ema26; });
        var ema12 = indicator_1.ema()
            .id(1)
            .options({ windowSize: 12 })
            .merge(function (d, c) {
            d.ema12 = c;
        })
            .accessor(function (d) { return d.ema12; });
        var xScaleProvider = scale_1.discontinuousTimeScaleProvider.inputDateAccessor(function (d) { return d.date; });
        var fixedData = this.fixData(this.props.data);
        if (fixedData.length === 0) {
            var elem = {
                date: new Date(),
                open: 0,
                high: 0,
                low: 0,
                close: 0,
                volume: 0
            };
            fixedData = [elem, elem];
        }
        else if (fixedData.length === 1) {
            fixedData = [
                fixedData[0],
                {
                    date: fixedData[0].date,
                    open: fixedData[0].close,
                    high: fixedData[0].close,
                    low: fixedData[0].close,
                    close: fixedData[0].close,
                    volume: 0
                }
            ];
        }
        var calculatedData = ema12(ema26(fixedData));
        var _b = xScaleProvider(calculatedData), data = _b.data, xScale = _b.xScale, xAccessor = _b.xAccessor, displayXAccessor = _b.displayXAccessor;
        var dataLen = data.length;
        var fitLen = this.fitLengthToShow();
        var xExtents = [dataLen - 1, dataLen - 1 - fitLen + 1];
        if (fitLen < dataLen) {
            var start = this.props.start || xAccessor(utils_1.last(data));
            var end = this.props.end || xAccessor(data[Math.max(0, dataLen - fitLen)]);
            xExtents = [start, end];
        }
        // selection height is 48
        var chartHeight = height - 48;
        var MovingAverageTooltipOptions = [];
        if (this.state.isShowEMA26) {
            MovingAverageTooltipOptions.push({
                yAccessor: ema26.accessor(),
                type: ema26.type(),
                stroke: ema26.stroke(),
                windowSize: ema26.options().windowSize
            });
        }
        if (this.state.isShowEMA12) {
            MovingAverageTooltipOptions.push({
                yAccessor: ema12.accessor(),
                type: ema12.type(),
                stroke: ema12.stroke(),
                windowSize: ema12.options().windowSize
            });
        }
        // const priceDecimals = currentMarket.priceDecimals;
        var priceDecimals = 5;
        var maxHigh = 0;
        for (var i = 0; i < fixedData.length; i++) {
            if (fixedData[i].high > maxHigh) {
                maxHigh = fixedData[i].high;
            }
        }
        var priceLen = Math.floor(maxHigh).toString().length + priceDecimals;
        var marginRight = priceLen > 5 ? priceLen * 9 : 50;
        var variables = this.getVariables();
        var styles = this.props.styles;
        var background = (styles && styles.background) || variables.backgroundContainer;
        var upColor = (styles && styles.upColor) || variables.green;
        var downColor = (styles && styles.downColor) || variables.red;
        var axisColor = (styles && styles.axisColor) || variables.secondColor;
        var barColor = (styles && styles.barColor) || variables.chartBarColor;
        return (react_1.default.createElement("div", { onMouseEnter: function () { return _this.changeScroll(); }, onMouseLeave: function () { return _this.changeScroll(); }, style: { height: '100%', position: 'relative', background: background }, className: "hydro-sdk-TradeChart flex-column" },
            this.renderSelections(),
            !(this.state.loading && this.state.data.length === 0) && (react_1.default.createElement(react_stockcharts_1.ChartCanvas, { height: chartHeight, ratio: ratio, width: width, margin: { left: 0, right: marginRight, top: 10, bottom: 30 }, type: 'svg', seriesName: "MSFT", data: data, xScale: this.state.xScale || xScale, xAccessor: this.state.xAccessor || xAccessor, displayXAccessor: this.state.displayXAccessor || displayXAccessor, onLoadMore: function (start, end) { return _this.handleLoadMore(start, end); }, pointsPerPxThreshold: 2, minPointsPerPxThreshold: 1 / 50, xExtents: xExtents },
                react_1.default.createElement(react_stockcharts_1.Chart, { id: 2, height: chartHeight * 0.3, width: width, yExtents: function (d) { return d.volume; }, origin: function (w, h) { return [0, h - chartHeight * 0.3]; } },
                    react_1.default.createElement(axes_1.XAxis, { axisAt: "bottom", orient: "bottom", tickStroke: axisColor, stroke: "none", ticks: Math.ceil((width - marginRight) / 160) }),
                    react_1.default.createElement(coordinates_1.MouseCoordinateX, { at: "bottom", orient: "bottom", displayFormat: d3_time_format_1.timeFormat('%Y-%m-%d') }),
                    react_1.default.createElement(series_1.BarSeries, { yAccessor: function (d) { return d.volume; }, fill: barColor, widthRatio: 0.4, opacity: 1 })),
                react_1.default.createElement(react_stockcharts_1.Chart, { id: 1, yExtents: [function (d) { return [d.high, d.low]; }, ema26.accessor(), ema12.accessor()], height: chartHeight * 0.8, width: width, padding: { left: 0, right: 0, top: 1, bottom: 1 } },
                    react_1.default.createElement(interactive_1.ClickCallback, { onClick: function (moreProps, e) {
                            var mouseXY = moreProps.mouseXY, chartConfig = moreProps.chartConfig, currentItem = moreProps.currentItem;
                            var result = {
                                candleData: currentItem,
                                clickedPrice: new bignumber_js_1.default(chartConfig.yScale.invert(mouseXY[1]).toString())
                            };
                            // console.log(result);
                            if (clickCallback) {
                                clickCallback(result);
                            }
                        } }),
                    react_1.default.createElement(axes_1.YAxis, { axisAt: "right", orient: "right", ticks: 5, tickStroke: axisColor, stroke: "none", tickFormat: d3_format_1.format("." + priceDecimals + "f") }),
                    this.state.chart === 'candle' ? (react_1.default.createElement(series_1.CandlestickSeries, { widthRatio: 0.5, opacity: 1, candleStrokeWidth: "1", stroke: function (d) { return (d.close > d.open ? upColor : downColor); }, wickStroke: function (d) { return (d.close > d.open ? upColor : downColor); }, fill: function (d) { return (d.close > d.open ? 'none' : downColor); } })) : (react_1.default.createElement(series_1.AreaSeries, { yAccessor: function (d) { return d.close; }, strokeWidth: 2, stroke: upColor, fill: "url(#LineGradient)", interpolation: d3_shape_1.curveMonotoneX })),
                    this.state.isShowEMA26 && react_1.default.createElement(series_1.LineSeries, { yAccessor: ema26.accessor(), stroke: ema26.stroke() }),
                    this.state.isShowEMA12 && react_1.default.createElement(series_1.LineSeries, { yAccessor: ema12.accessor(), stroke: ema12.stroke() }),
                    this.state.isShowEMA26 && react_1.default.createElement(coordinates_1.CurrentCoordinate, { yAccessor: ema26.accessor(), fill: ema26.stroke() }),
                    this.state.isShowEMA12 && react_1.default.createElement(coordinates_1.CurrentCoordinate, { yAccessor: ema12.accessor(), fill: ema12.stroke() }),
                    react_1.default.createElement(tooltip_1.MovingAverageTooltip, { origin: [15, 8], textFill: axisColor, options: MovingAverageTooltipOptions, displayFormat: d3_format_1.format("." + priceDecimals + "f"), width: priceDecimals > 5 ? 65 + 6 * (priceDecimals - 5) : 65 }),
                    react_1.default.createElement("defs", null,
                        react_1.default.createElement("linearGradient", { id: "LineGradient", x1: "0", y1: "100%", x2: "0", y2: "0%" },
                            react_1.default.createElement("stop", { offset: "0%", stopColor: upColor, stopOpacity: 0 }),
                            react_1.default.createElement("stop", { offset: "50%", stopColor: upColor, stopOpacity: 0.1 }),
                            react_1.default.createElement("stop", { offset: "100%", stopColor: upColor, stopOpacity: 0.2 }))),
                    react_1.default.createElement(coordinates_1.EdgeIndicator, { itemType: "last", orient: "right", edgeAt: "right", yAccessor: function (d) { return d.close; }, fill: function (d) { return (d.close > d.open ? upColor : downColor); }, lineStroke: function (d) { return (d.close > d.open ? upColor : downColor); }, strokeWidth: 0, displayFormat: d3_format_1.format("." + priceDecimals + "f"), rectWidth: priceLen > 5 ? priceLen * 9 : 50 }),
                    react_1.default.createElement(coordinates_1.MouseCoordinateY, { at: "right", orient: "right", displayFormat: d3_format_1.format("." + priceDecimals + "f"), rectWidth: priceLen > 5 ? priceLen * 9 : 50 }),
                    react_1.default.createElement(tooltip_1.OHLCTooltip, { origin: [12, -2], textFill: axisColor, labelFill: axisColor, ohlcFormat: function (v) { return d3_format_1.format("." + priceDecimals + "f")(v) + '  '; } })),
                react_1.default.createElement(coordinates_1.CrossHairCursor, { stroke: axisColor })))));
    };
    TradeChart.prototype.renderSelections = function () {
        var _this = this;
        return (react_1.default.createElement("div", { className: "chartSelection" },
            react_1.default.createElement("div", { className: "selection1" },
                react_1.default.createElement(Select_1.default, { size: 'small', theme: this.props.theme, options: constants_1.granularityOptions, selected: this.state.granularityStr, onSelect: function (option) {
                        // this.loadData(option.value);
                        var clickGranularity = _this.props.clickGranularity;
                        _this.setState({ granularityStr: option.value });
                        if (clickGranularity) {
                            clickGranularity({ value: option.value });
                        }
                        window.localStorage.setItem('granularityStr', option.value);
                    } })),
            react_1.default.createElement("div", { className: "selection2" },
                react_1.default.createElement(Select_1.default, { size: 'small', theme: this.props.theme, options: constants_1.chartOptions, selected: this.state.chart, onSelect: function (option) {
                        _this.setState({ chart: option.value });
                        window.localStorage.setItem('chart', option.value);
                    } })),
            react_1.default.createElement("div", { className: "selection3" },
                react_1.default.createElement(Select_1.default, { size: 'small', theme: this.props.theme, options: constants_1.overlayOptions, selected: 'overlay', onSelect: function (option) { return _this.selectEMA(option.value); } }))));
    };
    return TradeChart;
}(react_1.Component));
exports.default = helper_1.fitWidth(helper_1.fitDimensions(TradeChart));
