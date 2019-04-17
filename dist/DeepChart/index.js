import React, { PureComponent } from 'react';
import { OrderbookDeepChart } from './deepChartCanvas';
import { themeDark, themeLight } from '../variables/variables';
class DeepChart extends PureComponent {
    getVariables() {
        const { theme } = this.props;
        return theme === 'light' ? themeLight : themeDark;
    }
    getCommonOptions() {
        const { baseToken, quoteToken, bids, asks, clickCallback, styles } = this.props;
        const priceDecimals = this.props.priceDecimals || 5;
        const amountDecimals = this.props.amountDecimals || 2;
        const variables = this.getVariables();
        return {
            height: -1,
            showFPS: false,
            priceDecimals,
            amountDecimals,
            bids,
            asks,
            baseTokenSymbol: baseToken,
            quoteTokenSymbol: quoteToken,
            titleColor: (styles && styles.titleColor) || variables.mainColor,
            axisLabelColor: (styles && styles.axisLabelColor) || variables.secondColor,
            axisColor: (styles && styles.axisColor) || variables.borderGray,
            rowBackgroundColor: (styles && styles.rowBackgroundColor) || variables.backgroundContainer,
            containerBackgroundColor: (styles && styles.containerBackgroundColor) || variables.background,
            red: (styles && styles.red) || variables.red,
            redArea: (styles && styles.redArea) || variables.redArea,
            green: (styles && styles.green) || variables.green,
            greenArea: (styles && styles.greenArea) || variables.greenArea,
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
    componentDidMount() {
        const commonOptions = this.getCommonOptions();
        this.chart = new OrderbookDeepChart('deep-chart', commonOptions);
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
        return React.createElement("canvas", { id: "deep-chart", style: { width: '100%', height: '100%' } });
    }
}
export default DeepChart;
//# sourceMappingURL=index.js.map