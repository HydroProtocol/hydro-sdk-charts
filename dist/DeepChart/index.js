import React, { PureComponent } from 'react';
import { OrderbookDeepChart } from './deepChartCanvas';
import variables from '../variables/variables';
class DeepChart extends PureComponent {
    getCommonOptions() {
        const { baseToken, quoteToken } = this.props;
        const priceDecimals = this.props.priceDecimals || 5;
        const amountDecimals = this.props.amountDecimals || 2;
        return {
            height: -1,
            showFPS: false,
            priceDecimals,
            amountDecimals,
            titleColor: variables.fontColor1,
            axisLabelColor: variables.fontColor2,
            axisColor: variables.borderGray,
            rowBackgroundColor: variables.backgroundContainer,
            containerBackgroundColor: variables.background,
            baseTokenSymbol: baseToken,
            quoteTokenSymbol: quoteToken,
            red: variables.red,
            redArea: variables.redArea,
            green: variables.green,
            greenArea: variables.greenArea,
            onClick: result => {
                console.log(result);
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