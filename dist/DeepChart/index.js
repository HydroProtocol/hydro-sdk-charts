import React, { PureComponent } from 'react';
import { OrderbookDeepChart } from './deepChartCanvas';
import { themeDark, themeLight } from '../variables/variables';
import { setBids, setAsks } from './memoryOrderbook';
class DeepChart extends PureComponent {
    getVariables() {
        const { theme } = this.props;
        return theme === 'light' ? themeLight : themeDark;
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
        // console.log('componentWillReceiveProps');
        // console.log(nextProps);
        setBids(nextProps.bids);
        setAsks(nextProps.asks);
    }
    componentDidMount() {
        const { bids, asks } = this.props;
        setBids(bids);
        setAsks(asks);
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