# hydro-sdk-charts

The hydro-sdk-charts including trade chart and deep chart.

## Installation

The package can be installed via NPM:

```
npm install react-calendar-card --save
```

## Usage

TradeChart

```
<TradeChart
  theme="light"
  data={testData}
  styles={{ upColor: 'blue' }}
  clickCallback={result => {
    console.log('result: ', result);
  }}
  clickGranularity={result => {
    console.log('result: ', result);
  }}
/>
```

DeepChart

```
<DeepChart
  baseToken="HOT"
  quoteToken="dai"
  asks={this.props.asks.toArray().map(priceLevel => {
    return {
      price: priceLevel[0].toString(),
      amount: priceLevel[1].toString()
    };
  })}
  bids={this.props.bids.toArray().map(priceLevel => {
    return {
      price: priceLevel[0].toString(),
      amount: priceLevel[1].toString()
    };
  })}
  theme="light"
  clickCallback={result => {
    console.log('result: ', result);
  }}
/>
```
