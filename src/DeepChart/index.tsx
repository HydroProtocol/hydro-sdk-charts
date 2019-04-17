import React, { PureComponent } from 'react';
import BigNumber from 'bignumber.js';
import { OrderbookDeepChart } from './deepChartCanvas';
import { themeDark, themeLight } from '../variables/variables';

interface Styles {
  titleColor?: string;
  axisLabelColor?: string;
  axisColor?: string;
  rowBackgroundColor?: string;
  containerBackgroundColor?: string;
  askColor?: string;
  askColorArea?: string;
  bidColor?: string;
  bidColorArea?: string;
}

interface Props {
  theme?: any;
  priceDecimals?: any;
  amountDecimals?: any;
  baseToken: any;
  quoteToken: any;
  bids: any;
  asks: any;
  clickCallback?: any;
  styles?: Styles;
}

class DeepChart extends PureComponent<Props, any> {
  private chart: any;

  public getVariables() {
    const { theme } = this.props;
    return theme === 'light' ? themeLight : themeDark;
  }

  public getCommonOptions() {
    const { baseToken, quoteToken, priceDecimals, amountDecimals, bids, asks, clickCallback, styles } = this.props;
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
      formatXAxisLabel: (price: string): string => {
        return `${price.toString()} ${this.props.quoteToken}`;
      },
      formatYAxisLabel: (amount: BigNumber): string => {
        if (amount.gt(1000)) {
          return `${amount.div(1000).toFixed(2)}k`;
        } else if (amount.gt(1000000)) {
          return `${amount.div(1000000).toFixed(2)}m`;
        } else {
          return amount.round(0).toString();
        }
      }
    };
  }

  public componentDidMount() {
    const commonOptions = this.getCommonOptions();
    this.chart = new OrderbookDeepChart('deep-chart', commonOptions);
    this.chart.start();
  }

  public componentDidUpdate() {
    const commonOptions = this.getCommonOptions();
    if (this.chart) {
      this.chart.updateOptions(commonOptions);
    }
  }

  public componentWillUnmount() {
    if (this.chart) {
      this.chart.stop();
    }
  }

  public render() {
    return <canvas id="deep-chart" style={{ width: '100%', height: '100%' }} />;
  }
}

export default DeepChart;
