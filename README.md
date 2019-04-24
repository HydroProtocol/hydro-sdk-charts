# hydro-sdk-charts

**WIP:** this project is under very active development, and it is not ready for production usage. This warnning will be removed when it is reliable.

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

```
<TradeChart
  theme="dark" // or light
  data={testData}
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

interface Props {
  data: any;
  currentMarket: any;
  theme?: any;
  styles?: Styles;
  clickCallback?: any;
  handleLoadMore?: any;
  clickGranularity?: any;
  start?: any;
  end?: any;
}
```

### DeepChart Example

![DeepChart-dark](./assets/images/DeepChart-dark.png)

Data format example [TradeChart test data](https://github.com/HydroProtocol/hydro-sdk-charts/blob/master/assets/js/DeepChartTestData.js)

```
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
  rowBackgroundColor?: string;
  containerBackgroundColor?: string;
  askColor?: string;
  askColorArea?: string;
  bidColor?: string;
  bidColorArea?: string;
}

interface Props {
  bids: any;
  asks: any;
  baseToken: any;
  quoteToken: any;
  theme?: any;
  styles?: Styles;
  priceDecimals?: any;
  amountDecimals?: any;
  clickCallback?: any;
}
```
