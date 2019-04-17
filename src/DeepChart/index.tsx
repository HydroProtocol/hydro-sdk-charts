import React, { PureComponent } from 'react';
import BigNumber from 'bignumber.js';
import { OrderbookDeepChart } from './deepChartCanvas';
import variables from '../variables/variables';

interface Props {
  priceDecimals?: any;
  amountDecimals?: any;
  baseToken: any;
  quoteToken: any;
  bids: any;
  asks: any;
  clickCallback?: any;
}

class DeepChart extends PureComponent<Props, any> {
  private chart: any;

  public getCommonOptions() {
    const { baseToken, quoteToken, bids, asks, clickCallback } = this.props;
    const priceDecimals = this.props.priceDecimals || 5;
    const amountDecimals = this.props.amountDecimals || 2;
    return {
      height: -1,
      showFPS: false,
      priceDecimals,
      amountDecimals,
      bids,
      asks,
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
