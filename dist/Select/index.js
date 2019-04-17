import React, { PureComponent } from 'react';
import './style.css';
export default class Select extends PureComponent {
    constructor(props) {
        super(props);
        this.tryFoldListener = e => {
            if (this.container && !this.container.contains(e.target)) {
                this.setState({ unfolded: false });
            }
        };
        this.switchFold = () => {
            this.setState({
                unfolded: !this.state.unfolded
            });
        };
        this.setContainer = ref => {
            if (!ref) {
                return;
            }
            this.container = ref;
        };
        this.renderOption = option => {
            return option.component ? option.component : option.text;
        };
        this.id = Math.random().toString();
        this.state = {
            unfolded: false
        };
    }
    componentDidMount() {
        window.document.addEventListener('mouseup', this.tryFoldListener);
    }
    componentWillUnmount() {
        window.document.removeEventListener('mouseup', this.tryFoldListener);
    }
    getDropdownDirection() {
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
    renderDropdown() {
        const { options, onSelect, size } = this.props;
        const items = [];
        for (let option of options) {
            if (option.hidden) {
                continue;
            }
            items.push(React.createElement("div", { key: option.value, className: `item ${size === 'small' ? 'small' : ''} ${option.disabled ? 'disabled' : ''}`, onClick: e => {
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
                } }, this.renderOption(option)));
        }
        const dropdownClassNames = ['dropdown'];
        const direction = this.getDropdownDirection();
        if (direction === 'down') {
            dropdownClassNames.push('down');
        }
        else if (direction === 'up') {
            dropdownClassNames.push('up');
        }
        return React.createElement("div", { className: dropdownClassNames.join(' ') }, items);
    }
    renderSelected() {
        let selectOption;
        const { options, selected, formatSelect, noCaret, blank, size } = this.props;
        for (let option of options) {
            if (selected === option.value) {
                selectOption = option;
            }
        }
        return (React.createElement("div", { className: `selected ${size === 'small' ? 'small' : ''}`, onClick: this.switchFold },
            selectOption ? (formatSelect ? formatSelect(selectOption) : this.renderOption(selectOption)) : blank,
            noCaret ? null : this.renderCaret()));
    }
    renderCaret() {
        return React.createElement("div", { className: `caret ${this.props.size === 'small' ? 'small' : ''}` });
    }
    render() {
        const { unfolded } = this.state;
        const classNames = ['select'];
        if (unfolded) {
            classNames.push('unfolded');
        }
        return (React.createElement("div", { className: classNames.join(' '), id: this.id, ref: this.setContainer },
            this.renderSelected(),
            this.renderDropdown()));
    }
}
//# sourceMappingURL=index.js.map