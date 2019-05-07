var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
import React, { PureComponent } from 'react';
import './light.css';
import './dark.css';
var Select = /** @class */ (function (_super) {
    __extends(Select, _super);
    function Select(props) {
        var _this = _super.call(this, props) || this;
        _this.tryFoldListener = function (e) {
            if (_this.container && !_this.container.contains(e.target)) {
                _this.setState({ unfolded: false });
            }
        };
        _this.switchFold = function () {
            _this.setState({
                unfolded: !_this.state.unfolded
            });
        };
        _this.setContainer = function (ref) {
            if (!ref) {
                return;
            }
            _this.container = ref;
        };
        _this.renderOption = function (option) {
            return option.component ? option.component : option.text;
        };
        _this.id = Math.random().toString();
        _this.state = {
            unfolded: false
        };
        return _this;
    }
    Select.prototype.componentDidMount = function () {
        window.document.addEventListener('mouseup', this.tryFoldListener);
    };
    Select.prototype.componentWillUnmount = function () {
        window.document.removeEventListener('mouseup', this.tryFoldListener);
    };
    Select.prototype.getDropdownDirection = function () {
        if (!this.container) {
            return 'down';
        }
        var topDistance = function (elem) {
            var location = 0;
            if (elem.offsetParent) {
                do {
                    location += elem.offsetTop;
                    elem = elem.offsetParent;
                } while (elem);
            }
            return location >= 0 ? location : 0;
        };
        var bottomDistance = window.innerHeight - topDistance(this.container) - this.container.offsetHeight;
        return bottomDistance < 200 ? 'up' : 'down';
    };
    Select.prototype.renderDropdown = function () {
        var _this = this;
        var e_1, _a;
        var _b = this.props, options = _b.options, onSelect = _b.onSelect, size = _b.size;
        var items = [];
        var _loop_1 = function (option) {
            if (option.hidden) {
                return "continue";
            }
            items.push(React.createElement("div", { key: option.value, className: "item " + (size === 'small' ? 'small' : '') + " " + (option.disabled ? 'disabled' : ''), onClick: function (e) {
                    if (option.disabled) {
                        return;
                    }
                    if (onSelect) {
                        onSelect(option, e);
                    }
                    if (option.onSelect) {
                        option.onSelect(option, e);
                    }
                    _this.setState({ unfolded: false });
                } }, this_1.renderOption(option)));
        };
        var this_1 = this;
        try {
            for (var options_1 = __values(options), options_1_1 = options_1.next(); !options_1_1.done; options_1_1 = options_1.next()) {
                var option = options_1_1.value;
                _loop_1(option);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (options_1_1 && !options_1_1.done && (_a = options_1.return)) _a.call(options_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var dropdownClassNames = ['dropdown'];
        var direction = this.getDropdownDirection();
        if (direction === 'down') {
            dropdownClassNames.push('down');
        }
        else if (direction === 'up') {
            dropdownClassNames.push('up');
        }
        return React.createElement("div", { className: dropdownClassNames.join(' ') }, items);
    };
    Select.prototype.renderSelected = function () {
        var e_2, _a;
        var selectOption;
        var _b = this.props, options = _b.options, selected = _b.selected, formatSelect = _b.formatSelect, noCaret = _b.noCaret, blank = _b.blank, size = _b.size;
        try {
            for (var options_2 = __values(options), options_2_1 = options_2.next(); !options_2_1.done; options_2_1 = options_2.next()) {
                var option = options_2_1.value;
                if (selected === option.value) {
                    selectOption = option;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (options_2_1 && !options_2_1.done && (_a = options_2.return)) _a.call(options_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return (React.createElement("div", { className: "selected " + (size === 'small' ? 'small' : ''), onClick: this.switchFold },
            selectOption ? (formatSelect ? formatSelect(selectOption) : this.renderOption(selectOption)) : blank,
            noCaret ? null : this.renderCaret()));
    };
    Select.prototype.renderCaret = function () {
        return React.createElement("div", { className: "caret " + (this.props.size === 'small' ? 'small' : '') });
    };
    Select.prototype.render = function () {
        var unfolded = this.state.unfolded;
        var classNames = ['select'];
        if (unfolded) {
            classNames.push('unfolded');
        }
        var theme = this.props.theme;
        if (theme === 'light') {
            classNames.push('light');
        }
        else {
            classNames.push('dark');
        }
        return (React.createElement("div", { className: classNames.join(' '), id: this.id, ref: this.setContainer },
            this.renderSelected(),
            this.renderDropdown()));
    };
    return Select;
}(PureComponent));
export default Select;
//# sourceMappingURL=index.js.map