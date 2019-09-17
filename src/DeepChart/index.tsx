import React, { PureComponent } from 'react';
import BigNumber from 'bignumber.js';
import { OrderbookDeepChart } from './deepChartCanvas';
import { themeDark, themeLight } from '../variables/variables';
import { setBids, setAsks } from './memoryOrderbook';

interface I18nItems {
  midMarketPrice?: string;
  price?: string;
  cost?: string;
  sell?: string;
  buy?: string;
}

interface Styles {
  titleColor?: string;
  axisLabelColor?: string;
  borderColor?: string;
  axisColor?: string;
  rowBackgroundColor?: string;
  containerBackgroundColor?: string;
  askColor?: string;
  askColorArea?: string;
  bidColor?: string;
  bidColorArea?: string;
  fontFamily?: string;
}

interface Props {
  bids: any;
  asks: any;
  baseToken: any;
  quoteToken: any;
  theme?: any;
  styles?: Styles;
  i18n?: I18nItems;
  priceDecimals?: any;
  amountDecimals?: any;
  clickCallback?: any;
}

class DeepChart extends PureComponent<Props, any> {
  private chart: any;

  public getVariables() {
    const { theme } = this.props;
    return theme === 'light' ? themeLight : themeDark;
  }

  public getCommonOptions() {
    const { baseToken, quoteToken, priceDecimals, amountDecimals, clickCallback, styles, i18n } = this.props;
    const variables = this.getVariables();
    return {
      height: -1,
      showFPS: false,
      priceDecimals,
      amountDecimals,
      baseTokenSymbol: baseToken,
      quoteTokenSymbol: quoteToken,

      fontFamily: styles && styles.fontFamily,
      titleColor: (styles && styles.titleColor) || variables.mainColor,
      borderColor: (styles && styles.borderColor) || variables.borderGray,
      axisLabelColor: (styles && styles.axisLabelColor) || variables.secondColor,
      axisColor: (styles && styles.axisColor) || variables.borderGray,
      rowBackgroundColor: (styles && styles.rowBackgroundColor) || variables.backgroundContainer,
      containerBackgroundColor: (styles && styles.containerBackgroundColor) || variables.background,
      red: (styles && styles.askColor) || variables.red,
      redArea: (styles && styles.askColorArea) || variables.redArea,
      green: (styles && styles.bidColor) || variables.green,
      greenArea: (styles && styles.bidColorArea) || variables.greenArea,

      midMarketPriceTranslation: (i18n && i18n.midMarketPrice) || 'Mid Market Price',
      priceTranslation: (i18n && i18n.price) || 'Price',
      costTranslation: (i18n && i18n.cost) || 'Cost',
      sellTranslation: (i18n && i18n.sell) || 'Sell',
      buyTranslation: (i18n && i18n.buy) || 'Buy',

      onClick: result => {
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

  public componentWillReceiveProps(nextProps) {
    setBids(nextProps.bids);
    setAsks(nextProps.asks);
  }

  public componentDidMount() {
    const { bids, asks } = this.props;
    setBids(bids);
    setAsks(asks);

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
