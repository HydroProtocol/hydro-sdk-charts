"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundRect = (ctx, x, y, width, height, radius, fill, stroke) => {
    if (typeof stroke === 'undefined') {
        stroke = true;
    }
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    }
    else {
        const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (let side in defaultRadius) {
            if (defaultRadius[side]) {
                radius[side] = radius[side] || defaultRadius[side];
            }
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
};
exports.cubicEaseOut = (t, b, c, d) => {
    return c * ((t = t / d - 1) * t * t + 1) + b;
};
exports.toRGBA = function (color) {
    if (color[0] === '#') {
        color = color.slice(1);
    }
    return [parseInt(color.slice(0, 2), 16), parseInt(color.slice(2, 4), 16), parseInt(color.slice(4), 16), 1];
};
exports.rgbaEaseOut = (from, to, past, total) => {
    const r = exports.cubicEaseOut(past, from[0], to[0] - from[0], total);
    const g = exports.cubicEaseOut(past, from[1], to[1] - from[1], total);
    const b = exports.cubicEaseOut(past, from[2], to[2] - from[2], total);
    const a = exports.cubicEaseOut(past, from[3], to[3] - from[3], total);
    return [r, g, b, a];
};
//# sourceMappingURL=canvasUtils.js.map