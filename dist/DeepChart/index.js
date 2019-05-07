"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const deepChartCanvas_1 = require("./deepChartCanvas");
const variables_1 = require("../variables/variables");
const memoryOrderbook_1 = require("./memoryOrderbook");
class DeepChart extends react_1.PureComponent {
    getVariables() {
        const { theme } = this.props;
        return theme === 'light' ? variables_1.themeLight : variables_1.themeDark;
    }
    getCommonOptions() {
        const { baseToken, quoteToken, priceDecimals, amountDecimals, clickCallback, styles } = this.props;
        const variables = this.getVariables();
        return {
            height: -1,
            showFPS: false,
            priceDecimals,
            amountDecimals,
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
            onClick: result => {
                // console.log(result);
                if (clickCallback) {
                    clickCallback(result);
                }
            },
            formatXAxisLabel: (price) => {
                return `${price.toString()} ${this.props.quoteToken}`;
            },
            formatYAxisLabel: (amount) => {
                if (amount.gt(1000)) {
                    return `${amount.div(1000).toFixed(2)}k`;
                }
                else if (amount.gt(1000000)) {
                    return `${amount.div(1000000).toFixed(2)}m`;
                }
                else {
                    return amount.round(0).toString();
                }
            }
        };
    }
    componentWillReceiveProps(nextProps) {
        memoryOrderbook_1.setBids(nextProps.bids);
        memoryOrderbook_1.setAsks(nextProps.asks);
    }
    componentDidMount() {
        const { bids, asks } = this.props;
        memoryOrderbook_1.setBids(bids);
        memoryOrderbook_1.setAsks(asks);
        const commonOptions = this.getCommonOptions();
        this.chart = new deepChartCanvas_1.OrderbookDeepChart('deep-chart', commonOptions);
        this.chart.start();
    }
    componentDidUpdate() {
        const commonOptions = this.getCommonOptions();
        if (this.chart) {
            this.chart.updateOptions(commonOptions);
        }
    }
    componentWillUnmount() {
        if (this.chart) {
            this.chart.stop();
        }
    }
    render() {
        return react_1.default.createElement("canvas", { id: "deep-chart", style: { width: '100%', height: '100%' } });
    }
}
exports.default = DeepChart;
//# sourceMappingURL=index.js.map