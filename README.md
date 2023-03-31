# hydro-sdk-charts

The hydro-sdk-charts including trade chart and deep chart.

## Installation

The package can be installed via NPM:

```
npm install @wangleiddex/hydro-sdk-charts --save
```

## Usage

### TradeChart Example

![TradeChart-dark](./assets/images/TradeChart-dark.png)

Data format example [TradeChart test data](https://github.com/HydroProtocol/hydro-sdk-charts/blob/master/assets/js/TradeChartTestData.js)

The example below also shows how to include the css from this package if your build system supports requiring css files (webpack is one that does). 
```
import { TradeChart } from '@wangleiddex/hydro-sdk-charts';
import '@wangleiddex/hydro-sdk-charts/dist/style.css';

<TradeChart
  theme="dark" // or light
  data={testData}
  granularityStr="1d"
  priceDecimals={4}
  styles={{ upColor: '#00d99f' }}
  clickCallback={result => {
    console.log('result: ', result);
  }}
  clickGranularity={result => {
    console.log('result: ', result);
  }}
/>
```

TradeChart Props

```
interface Styles {
  background?: string;
  upColor?: string;
  downColor?: string;
  axisColor?: string;
  barColor?: string;
}

interface I18nItems {
  overlay?: string;
  line?: string;
  candle?: string;
  oneDay?: string;
  oneHour?: string;
  fiveMinutes?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
}

interface Props {
  data: any;
  granularityStr: string; // "1d", "1h", "5m"
  priceDecimals: number;
  theme?: string;
  styles?: Styles;
  i18n?: I18nItems;
  clickCallback?: any;
  handleLoadMore?: any;
  clickGranularity?: string;
  defaultChart?: string; // 'candle', 'line'
  // start and end in the data list for current view
  start?: number;
  end?: number;
  xTickFormat?: any;
}
```

### DeepChart Example

![DeepChart-dark](./assets/images/DeepChart-dark.png)

Data format example [DeepChart test data](https://github.com/HydroProtocol/hydro-sdk-charts/blob/master/assets/js/DeepChartTestData.js)

```
import { DeepChart } from '@wangleiddex/hydro-sdk-charts';

<DeepChart
  theme="dark" // or light
  asks={bids}
  bids={asks}
  baseToken="HOT"
  quoteToken="DAI"
  styles={{ bidColor: '#00d99f' }}
  clickCallback={result => {
    console.log('result: ', result);
  }}
/>
```

DeepChart Props:

```
interface Styles {
  titleColor?: string;
  axisLabelColor?: string;
  axisColor?: string;
  borderColor?: string;
  rowBackgroundColor?: string;
  containerBackgroundColor?: string;
  askColor?: string;
  askColorArea?: string;
  bidColor?: string;
  bidColorArea?: string;
  fontFamily?: string;
}

interface I18nItems {
  midMarketPrice?: string;
  price?: string;
  cost?: string;
  sell?: string;
  buy?: string;
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
```
