import React, { PureComponent } from 'react';

export interface Option {
  value: any;
  text?: string;
  component?: any;
  onSelect?: any;
  hidden?: boolean;
  disabled?: boolean;
}

interface Props {
  options: Option[];
  selected: any;
  onSelect?: any;
  noCaret?: boolean;
  blank?: any;
  formatSelect?: any;
  size?: any;
  theme?: any;
}

interface State {
  unfolded: boolean;
}

export default class Select extends PureComponent<Props, State> {
  private id: string;
  private container: any;

  constructor(props) {
    super(props);
    this.id = Math.random().toString();

    this.state = {
      unfolded: false
    };
  }

  private tryFoldListener = e => {
    if (this.container && !this.container.contains(e.target)) {
      this.setState({ unfolded: false });
    }
  };

  public componentDidMount() {
    window.document.addEventListener('mouseup', this.tryFoldListener);
  }

  public componentWillUnmount() {
    window.document.removeEventListener('mouseup', this.tryFoldListener);
  }

  private switchFold = () => {
    this.setState({
      unfolded: !this.state.unfolded
    });
  };

  private setContainer = ref => {
    if (!ref) {
      return;
    }

    this.container = ref;
  };

  private getDropdownDirection(): string {
    if (!this.container) {
      return 'down';
    }

    const topDistance = elem => {
      let location = 0;
      if (elem.offsetParent) {
        do {
          location += elem.offsetTop;
          elem = elem.offsetParent;
        } while (elem);
      }
      return location >= 0 ? location : 0;
    };

    const bottomDistance = window.innerHeight - topDistance(this.container) - this.container.offsetHeight;

    return bottomDistance < 200 ? 'up' : 'down';
  }

  private renderDropdown() {
    const { options, onSelect, size } = this.props;
    const items: JSX.Element[] = [];

    for (let option of options) {
      if (option.hidden) {
        continue;
      }

      items.push(
        <div
          key={option.value}
          className={`item ${size === 'small' ? 'small' : ''} ${option.disabled ? 'disabled' : ''}`}
          onClick={e => {
            if (option.disabled) {
              return;
            }

            if (onSelect) {
              onSelect(option, e);
            }
            if (option.onSelect) {
              option.onSelect(option, e);
            }
            this.setState({ unfolded: false });
          }}>
          {this.renderOption(option)}
        </div>
      );
    }

    const dropdownClassNames = ['dropdown'];
    const direction = this.getDropdownDirection();

    if (direction === 'down') {
      dropdownClassNames.push('down');
    } else if (direction === 'up') {
      dropdownClassNames.push('up');
    }

    return <div className={dropdownClassNames.join(' ')}>{items}</div>;
  }

  private renderOption = option => {
    return option.component ? option.component : option.text;
  };

  private renderSelected() {
    let selectOption;
    const { options, selected, formatSelect, noCaret, blank, size } = this.props;

    for (let option of options) {
      if (selected === option.value) {
        selectOption = option;
      }
    }

    return (
      <div className={`selected ${size === 'small' ? 'small' : ''}`} onClick={this.switchFold}>
        {selectOption ? (formatSelect ? formatSelect(selectOption) : this.renderOption(selectOption)) : blank}
        {noCaret ? null : this.renderCaret()}
      </div>
    );
  }

  private renderCaret() {
    return <div className={`caret ${this.props.size === 'small' ? 'small' : ''}`} />;
  }

  public render() {
    const { unfolded } = this.state;
    const classNames = ['select'];

    if (unfolded) {
      classNames.push('unfolded');
    }

    const { theme } = this.props;
    if (theme === 'light') {
      classNames.push('light');
    } else {
      classNames.push('dark');
    }

    return (
      <div className={classNames.join(' ')} id={this.id} ref={this.setContainer}>
        {this.renderSelected()}
        {this.renderDropdown()}
      </div>
    );
  }
}
