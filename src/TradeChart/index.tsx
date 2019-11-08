import React, { PureComponent } from 'react';
import { format } from 'd3-format';
import { timeFormat } from 'd3-time-format';
import { curveMonotoneX } from 'd3-shape';
import { ChartCanvas, Chart } from 'react-financial-charts';
import { BarSeries, CandlestickSeries, AreaSeries, LineSeries } from 'react-financial-charts/lib/series';
import { XAxis, YAxis } from 'react-financial-charts/lib/axes';
import {
  EdgeIndicator,
  CrossHairCursor,
  CurrentCoordinate,
  MouseCoordinateX,
  MouseCoordinateY
} from 'react-financial-charts/lib/coordinates';
import { discontinuousTimeScaleProvider } from 'react-financial-charts/lib/scale';
import { last } from 'react-financial-charts/lib/utils';
import { ema } from 'react-financial-charts/lib/indicator';
import { MovingAverageTooltip, OHLCTooltip } from 'react-financial-charts/lib/tooltip';
import { ClickCallback } from 'react-financial-charts/lib/interactive';
import Select from '../Select';
import { themeDark, themeLight } from '../variables/variables';
import { withDeviceRatio } from "react-financial-charts/lib/utils";
import {withSize} from './withSize'

// one candle width is 18px * 0.5
const CANDLE_WIDTH_AND_GAP = 18;

interface Styles {
  background?: string;
  upColor?: string;
  downColor?: string;
  axisColor?: string;
  barColor?: string;
}

interface CustomEdge {
  price: number;
  color: string;
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
  priceDecimals: number;
  theme?: string;
  styles?: Styles;
  i18n?: I18nItems;
  customEdge?: CustomEdge;
  clickCallback?: any;
  handleLoadMore?: any;
  clickGranularity?: any;
  granularityStr?: string;
  defaultChart?: string;
  start?: number;
  end?: number;
  xTickFormat?: any;
  // do'nt need pass manually
  width: any;
  ratio: any;
  height: any;
  setChartRef?: any;
}

class TradeChart extends PureComponent<Props, any> {
  private interval: number | undefined;
  private chartRef: any;

  constructor(props) {
    super(props);

    const isShowEMA12LocalStorage = window.localStorage.getItem('isShowEMA12');
    const isShowEMA26LocalStorage = window.localStorage.getItem('isShowEMA26');
    const isShowEMA12 = isShowEMA12LocalStorage === null ? false : isShowEMA12LocalStorage === 'true';
    const isShowEMA26 = isShowEMA26LocalStorage === null ? false : isShowEMA26LocalStorage === 'true';
    const granularityStr = window.localStorage.getItem('granularityStr') || '1d';
    const chart = window.localStorage.getItem('chart');

    this.chartRef = React.createRef();

    this.state = {
      chart,
      granularityStr,
      isShowEMA12,
      isShowEMA26
    };
  }

  public getVariables() {
    const { theme } = this.props;
    return theme === 'light' ? themeLight : themeDark;
  }

  public componentWillUnmount() {
    if (this.interval) {
      window.clearInterval(this.interval);
    }
  }

  public handleLoadMore(start, end) {
    const { handleLoadMore } = this.props;
    if (!handleLoadMore) {
      return;
    }

    start = Math.ceil(start);
    if (start === end) {
      return;
    }
    // this.loadLeft(start, end);
    handleLoadMore({ start, end });
  }

  public fixData(data) {
    const fd: any = []; // fixedData
    const granularityNum = this.generateParams(this.props.granularityStr || this.state.granularityStr).granularityNum;
    for (let i = 0; i < data.length; i++) {
      data[i].open = parseFloat(data[i].open);
      data[i].high = parseFloat(data[i].high);
      data[i].low = parseFloat(data[i].low);
      data[i].close = parseFloat(data[i].close);
      data[i].volume = parseFloat(data[i].volume);
      let scale = Math.ceil((data[i].time || data[i].date) / 1000 / granularityNum);
      let gap = i === 0 ? -1 : scale - fd[fd.length - 1].date;
      if (i === 0 || gap === 1) {
        fd.push({
          date: scale,
          open: data[i].open,
          high: data[i].high,
          low: data[i].low,
          close: data[i].close,
          volume: data[i].volume
        });
        continue;
      }
      let lastFd = fd[fd.length - 1];
      if (gap === 0) {
        let volume: any = lastFd.volume + data[i].volume;
        if (
          lastFd.open === data[i].open &&
          lastFd.high === data[i].high &&
          lastFd.low === data[i].low &&
          lastFd.close === data[i].close &&
          lastFd.volume === data[i].volume
        ) {
          volume = lastFd.volume;
        }
        fd[fd.length - 1] = {
          date: scale,
          open: lastFd.open,
          high: Math.max(lastFd.high, data[i].high),
          low: Math.min(lastFd.low, data[i].low),
          close: data[i].close,
          volume
        };
      } else if (gap > 1) {
        for (let j = 1; j < gap; j++) {
          fd.push({
            date: lastFd.date + j,
            open: lastFd.close,
            high: lastFd.close,
            low: lastFd.close,
            close: lastFd.close,
            volume: 0
          });
        }
        fd.push({
          date: scale,
          open: data[i].open,
          high: data[i].high,
          low: data[i].low,
          close: data[i].close,
          volume: data[i].volume
        });
      }
    }
    for (let i = 0; i < fd.length; i++) {
      fd[i].date = new Date(fd[i].date * 1000 * granularityNum);
    }
    return fd;
  }

  public generateParams(granularityStr: string, from: number | null = null, to: number | null = null) {
    let granularityNum: number;
    to = to || Math.floor(new Date().getTime() / 1000);
    switch (granularityStr) {
      case '5m':
        granularityNum = 60 * 5;
        from = from || to - 60 * 60 * 24 * 7; // 12 * 24 * 7 = 2016 points, from 7 days ago
        break;
      case '1h':
        granularityNum = 60 * 60;
        from = from || to - 60 * 60 * 24 * 30; // 24 * 30 = 720 points, from 30 days ago
        break;
      case '1d':
        granularityNum = 60 * 60 * 24;
        from = from || to - 60 * 60 * 24 * 365; // 365 points, from 365 days ago
        break;
      default:
        granularityNum = 60 * 60 * 24;
        from = from || to - 60 * 60 * 24 * 365; // 365 points, from 365 days ago
        break;
    }

    return {
      from,
      to,
      granularityNum
    };
  }

  public fitLengthToShow() {
    const { width } = this.props;
    // ChartCanvas margin right 50;
    return Math.ceil((width - 50) / CANDLE_WIDTH_AND_GAP);
  }

  public selectEMA(value) {
    if (value === 'ema12') {
      this.setState({ isShowEMA12: !this.state.isShowEMA12 });
      window.localStorage.setItem('isShowEMA12', `${!this.state.isShowEMA12}`);
    } else if (value === 'ema26') {
      this.setState({ isShowEMA26: !this.state.isShowEMA26 });
      window.localStorage.setItem('isShowEMA26', `${!this.state.isShowEMA26}`);
    }
  }

  public changeScroll() {
    let style = document.body.style.overflow;
    document.body.style.overflow = style === 'hidden' ? 'auto' : 'hidden';
  }

  public getXExtents() {
    return this.chartRef.current.getDataInfo().xScale.domain();
  }

  public componentDidMount() {
    if (this.props.setChartRef) {
      this.props.setChartRef(this.chartRef);
    }
  }

  public render() {
    const { width, ratio, height, clickCallback, priceDecimals, xTickFormat } = this.props;

    const ema26 = ema()
      .id(0)
      .options({ windowSize: 26 })
      .merge((d, c) => {
        d.ema26 = c;
      })
      .accessor(d => d.ema26);

    const ema12 = ema()
      .id(1)
      .options({ windowSize: 12 })
      .merge((d, c) => {
        d.ema12 = c;
      })
      .accessor(d => d.ema12);

    const xScaleProvider = discontinuousTimeScaleProvider.inputDateAccessor(d => d.date);
    let fixedData = this.fixData(this.props.data);
    if (fixedData.length === 0) {
      const elem = {
        date: new Date(),
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        volume: 0
      };
      fixedData = [elem, elem];
    } else if (fixedData.length === 1) {
      fixedData = [
        fixedData[0],
        {
          date: fixedData[0].date,
          open: fixedData[0].close,
          high: fixedData[0].close,
          low: fixedData[0].close,
          close: fixedData[0].close,
          volume: 0
        }
      ];
    }
    const calculatedData = ema12(ema26(fixedData));
    const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(calculatedData);

    const dataLen = data.length;
    const fitLen = this.fitLengthToShow();
    let xExtents = [dataLen - 1, dataLen - 1 - fitLen + 1];
    if (fitLen < dataLen) {
      const start = this.props.start || xAccessor(last(data));
      const end = this.props.end || xAccessor(data[Math.max(0, dataLen - fitLen)]);
      xExtents = [start, end];
    }

    // selection height is 48
    const chartHeight = height - 48;

    const MovingAverageTooltipOptions: any = [];
    if (this.state.isShowEMA26) {
      MovingAverageTooltipOptions.push({
        yAccessor: ema26.accessor(),
        type: ema26.type(),
        stroke: ema26.stroke(),
        windowSize: ema26.options().windowSize
      });
    }
    if (this.state.isShowEMA12) {
      MovingAverageTooltipOptions.push({
        yAccessor: ema12.accessor(),
        type: ema12.type(),
        stroke: ema12.stroke(),
        windowSize: ema12.options().windowSize
      });
    }

    let maxHigh = 0;
    for (let i = 0; i < fixedData.length; i++) {
      if (fixedData[i].high > maxHigh) {
        maxHigh = fixedData[i].high;
      }
    }
    const priceLen = Math.floor(maxHigh).toString().length + priceDecimals;
    const marginRight = priceLen > 5 ? priceLen * 9 : 50;

    const variables = this.getVariables();
    const { styles, customEdge } = this.props;
    const background = (styles && styles.background) || variables.backgroundContainer;
    const upColor = (styles && styles.upColor) || variables.green;
    const downColor = (styles && styles.downColor) || variables.red;
    const axisColor = (styles && styles.axisColor) || variables.secondColor;
    const barColor = (styles && styles.barColor) || variables.chartBarColor;

    return (
      <div
        onMouseEnter={() => this.changeScroll()}
        onMouseLeave={() => this.changeScroll()}
        style={{ height: '100%', position: 'relative', background }}
        className="hydro-sdk-TradeChart flex-column">
        {this.renderSelections()}
        {!(this.state.loading && this.state.data.length === 0) && (
          <ChartCanvas
            ref={this.chartRef}
            height={chartHeight}
            ratio={ratio}
            width={width}
            margin={{ left: 0, right: marginRight, top: 10, bottom: 30 }}
            type={'svg'}
            seriesName="MSFT"
            data={data}
            xScale={this.state.xScale || xScale}
            xAccessor={this.state.xAccessor || xAccessor}
            displayXAccessor={this.state.displayXAccessor || displayXAccessor}
            onLoadMore={(start, end) => this.handleLoadMore(start, end)}
            pointsPerPxThreshold={2}
            minPointsPerPxThreshold={1 / 50}
            xExtents={xExtents}>
            <Chart
              id={2}
              height={chartHeight * 0.3}
              width={width}
              yExtents={d => d.volume}
              origin={(w, h) => [0, h - chartHeight * 0.3]}>
              <XAxis
                axisAt="bottom"
                orient="bottom"
                tickLabelFill={axisColor}
                tickStroke={axisColor}
                stroke="none"
                ticks={Math.ceil((width - marginRight) / 160)}
                tickFormat={xTickFormat}
              />
              <MouseCoordinateX at="bottom" orient="bottom" displayFormat={timeFormat('%Y-%m-%d')} />
              <BarSeries yAccessor={d => d.volume} fill={barColor} widthRatio={0.4} opacity={1} />
            </Chart>
            <Chart
              id={1}
              yExtents={[d => [d.high, d.low], ema26.accessor(), ema12.accessor()]}
              height={chartHeight * 0.8}
              width={width}
              padding={{ left: 0, right: 0, top: 1, bottom: 1 }}>
              <ClickCallback
                onClick={(moreProps, e) => {
                  const { mouseXY, chartConfig, currentItem } = moreProps;
                  const result = {
                    candleData: currentItem,
                    clickedPrice: chartConfig.yScale.invert(mouseXY[1]).toString()
                  };
                  // console.log(result);
                  if (clickCallback) {
                    clickCallback(result);
                  }
                }}
              />
              <YAxis
                axisAt="right"
                orient="right"
                ticks={5}
                tickLabelFill={axisColor}
                tickStroke={axisColor}
                stroke="none"
                tickFormat={format(`.${priceDecimals}f`)}
              />
              {(this.state.chart || this.props.defaultChart) === 'candle' ? (
                <CandlestickSeries
                  widthRatio={0.5}
                  opacity={1}
                  candleStrokeWidth={1}
                  stroke={d => (d.close > d.open ? upColor : downColor)}
                  wickStroke={d => (d.close > d.open ? upColor : downColor)}
                  fill={d => (d.close > d.open ? 'none' : downColor)}
                />
              ) : (
                <AreaSeries
                  yAccessor={d => d.close}
                  strokeWidth={2}
                  stroke={upColor}
                  fill="url(#LineGradient)"
                  interpolation={curveMonotoneX}
                />
              )}
              {this.state.isShowEMA26 && <LineSeries yAccessor={ema26.accessor()} stroke={ema26.stroke()} />}
              {this.state.isShowEMA12 && <LineSeries yAccessor={ema12.accessor()} stroke={ema12.stroke()} />}
              {this.state.isShowEMA26 && <CurrentCoordinate yAccessor={ema26.accessor()} fill={ema26.stroke()} />}
              {this.state.isShowEMA12 && <CurrentCoordinate yAccessor={ema12.accessor()} fill={ema12.stroke()} />}
              <MovingAverageTooltip
                origin={[15, 8]}
                textFill={axisColor}
                options={MovingAverageTooltipOptions}
                displayFormat={format(`.${priceDecimals}f`)}
                width={priceDecimals > 5 ? 65 + 6 * (priceDecimals - 5) : 65}
              />
              <defs>
                <linearGradient id="LineGradient" x1="0" y1="100%" x2="0" y2="0%">
                  <stop offset="0%" stopColor={upColor} stopOpacity={0} />
                  <stop offset="50%" stopColor={upColor} stopOpacity={0.1} />
                  <stop offset="100%" stopColor={upColor} stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <EdgeIndicator
                itemType="last"
                orient="right"
                edgeAt="right"
                yAccessor={d => d.close}
                fill={d => (d.close > d.open ? upColor : downColor)}
                lineStroke={d => (d.close > d.open ? upColor : downColor)}
                strokeWidth={0}
                displayFormat={format(`.${priceDecimals}f`)}
                rectWidth={priceLen > 5 ? priceLen * 9 : 50}
              />
              {customEdge && customEdge.price && !isNaN(customEdge.price) && isFinite(customEdge.price) ? (
                <EdgeIndicator
                  itemType="first"
                  orient="right"
                  edgeAt="right"
                  yAccessor={d => customEdge.price}
                  fill={d => customEdge.color}
                  lineStroke={d => customEdge.color}
                  strokeWidth={0}
                  displayFormat={format(`.${priceDecimals}f`)}
                  rectWidth={priceLen > 5 ? priceLen * 9 : 50}
                />
              ) : null}
              <MouseCoordinateY
                at="right"
                orient="right"
                displayFormat={format(`.${priceDecimals}f`)}
                rectWidth={priceLen > 5 ? priceLen * 9 : 50}
              />
              <OHLCTooltip
                origin={[12, -2]}
                textFill={axisColor}
                labelFill={axisColor}
                ohlcFormat={v => format(`.${priceDecimals}f`)(v) + '  '}
                displayTexts={this.getOHLCDisplayTexts()}
                lastAsDefault={true}
              />
            </Chart>
            <CrossHairCursor stroke={axisColor} />
          </ChartCanvas>
        )}
      </div>
    );
  }

  public renderSelections() {
    return (
      <div className="chartSelection">
        <div className="selection1">
          <Select
            size={'small'}
            theme={this.props.theme}
            options={this.getGranularityOptions()}
            selected={this.state.granularityStr}
            onSelect={option => {
              const { clickGranularity } = this.props;
              this.setState({ granularityStr: option.value });
              if (clickGranularity) {
                clickGranularity({ value: option.value });
              }
              window.localStorage.setItem('granularityStr', option.value);
            }}
          />
        </div>
        <div className="selection2">
          <Select
            size={'small'}
            theme={this.props.theme}
            options={this.getChartOptions()}
            selected={this.state.chart || this.props.defaultChart}
            onSelect={option => {
              this.setState({ chart: option.value });
              window.localStorage.setItem('chart', option.value);
            }}
          />
        </div>
        <div className="selection3">
          <Select
            size={'small'}
            theme={this.props.theme}
            options={this.getOverlayOptions()}
            selected={'overlay'}
            onSelect={option => this.selectEMA(option.value)}
          />
        </div>
      </div>
    );
  }

  private getGranularityOptions() {
    const i18n = this.props.i18n || {};

    const granularityOptions = [
      {
        value: '5m',
        text: i18n.fiveMinutes || '5m'
      },
      {
        value: '1h',
        text: i18n.oneHour || '1h'
      },
      {
        value: '1d',
        text: i18n.oneDay || '1d'
      }
    ];

    return granularityOptions;
  }

  private getChartOptions() {
    const i18n = this.props.i18n || {};

    const chartOptions = [
      {
        value: 'candle',
        text: i18n.candle || 'Candle'
      },
      {
        value: 'line',
        text: i18n.line || 'Line'
      }
    ];

    return chartOptions;
  }

  private getOverlayOptions() {
    const i18n = this.props.i18n || {};

    const overlayOptions = [
      {
        hidden: true,
        value: 'overlay',
        text: i18n.overlay || 'Overlay'
      },
      {
        value: 'ema12',
        text: 'EMA12'
      },
      {
        value: 'ema26',
        text: 'EMA26'
      }
    ];

    return overlayOptions;
  }

  private getOHLCDisplayTexts() {
    const i18n = this.props.i18n || {};

    // https://github.com/rrag/react-financial-charts/blob/master/src/lib/tooltip/OHLCTooltip.js#L96
    const displayTexts = {
      d: 'Date: ',
      o: ` ${i18n.open || 'O'}: `,
      h: ` ${i18n.high || 'H'}: `,
      l: ` ${i18n.low || 'L'}: `,
      c: ` ${i18n.close || 'C'}: `,
      v: ` ${i18n.volume || 'Vol'}: `,
      na: 'n/a'
    };

    return displayTexts;
  }
}

export default withSize()(withDeviceRatio()(TradeChart));
