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
import React, { PureComponent } from 'react';
import { OrderbookDeepChart } from './deepChartCanvas';
import { themeDark, themeLight } from '../variables/variables';
import { setBids, setAsks } from './memoryOrderbook';
var DeepChart = /** @class */ (function (_super) {
    __extends(DeepChart, _super);
    function DeepChart() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DeepChart.prototype.getVariables = function () {
        var theme = this.props.theme;
        return theme === 'light' ? themeLight : themeDark;
    };
    DeepChart.prototype.getCommonOptions = function () {
        var _this = this;
        var _a = this.props, baseToken = _a.baseToken, quoteToken = _a.quoteToken, priceDecimals = _a.priceDecimals, amountDecimals = _a.amountDecimals, clickCallback = _a.clickCallback, styles = _a.styles;
        var variables = this.getVariables();
        return {
            height: -1,
            showFPS: false,
            priceDecimals: priceDecimals,
            amountDecimals: amountDecimals,
            baseTokenSymbol: baseToken,
            quoteTokenSymbol: quoteToken,
            titleColor: (styles && styles.titleColor) || variables.mainColor,
            axisLabelColor: (styles && styles.axisLabelColor) || variables.secondColor,
            axisColor: (styles && styles.axisColor) || variables.borderGray,
            rowBackgroundColor: (styles && styles.rowBackgroundColor) || variables.backgroundContainer,
            containerBackgroundColor: (styles && styles.containerBackgroundColor) || variables.background,
            red: (styles && styles.askColor) || variables.red,
            redArea: (styles && styles.askColorArea) || variables.redArea,
            green: (styles && styles.bidColor) || variables.green,
            greenArea: (styles && styles.bidColorArea) || variables.greenArea,
            onClick: function (result) {
                // console.log(result);
                if (clickCallback) {
                    clickCallback(result);
                }
            },
            formatXAxisLabel: function (price) {
                return price.toString() + " " + _this.props.quoteToken;
            },
            formatYAxisLabel: function (amount) {
                if (amount.gt(1000)) {
                    return amount.div(1000).toFixed(2) + "k";
                }
                else if (amount.gt(1000000)) {
                    return amount.div(1000000).toFixed(2) + "m";
                }
                else {
                    return amount.round(0).toString();
                }
            }
        };
    };
    DeepChart.prototype.componentWillReceiveProps = function (nextProps) {
        setBids(nextProps.bids);
        setAsks(nextProps.asks);
    };
    DeepChart.prototype.componentDidMount = function () {
        var _a = this.props, bids = _a.bids, asks = _a.asks;
        setBids(bids);
        setAsks(asks);
        var commonOptions = this.getCommonOptions();
        this.chart = new OrderbookDeepChart('deep-chart', commonOptions);
        this.chart.start();
    };
    DeepChart.prototype.componentDidUpdate = function () {
        var commonOptions = this.getCommonOptions();
        if (this.chart) {
            this.chart.updateOptions(commonOptions);
        }
    };
    DeepChart.prototype.componentWillUnmount = function () {
        if (this.chart) {
            this.chart.stop();
        }
    };
    DeepChart.prototype.render = function () {
        return React.createElement("canvas", { id: "deep-chart", style: { width: '100%', height: '100%' } });
    };
    return DeepChart;
}(PureComponent));
export default DeepChart;
//# sourceMappingURL=index.js.map