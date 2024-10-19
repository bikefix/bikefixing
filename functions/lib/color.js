"use strict";
let h2rs = {};
const colors = {
    "Aquamarine": "#7fffd4",
    "Beige": "#f5f5dc",
    "Black": "#000000",
    "Blue": "#0000ff",
    "Brown": "#a52a2a",
    "Burgundy": "#800020",
    "Coffee": "#6f4e37",
    "Gold": "#ffd700",
    "Green": "#00ff00",
    "Light Grey": "#d3d3d3",
    "Dark Grey": "#333333",
    "Ivory": "#fffff0",
    "Lemon": "#fff700",
    "Mauve": "#e0b0ff",
    "Orange": "#ffa500",
    "Pink": "#ffc0cb",
    "Plum": "#dda0dd",
    "Purple": "#800080",
    "Red": "#ff0000",
    "Rust": "#b7410e",
    "Silver": "#c0c0c0",
    "Turquoise": "#30d5c8",
    "Violet": "#ee82ee",
    "White": "#ffffff",
    "Yellow": "#ffff00",
};
function color(hex, color_map) {
    color_map = color_map || colors;
    var rgb = h2r(hex);
    var min = Infinity;
    var closest = null;
    for (var color in color_map) {
        var rgb2 = h2r(color_map[color]);
        // distance formula
        var dist = Math.pow((rgb.r - rgb2.r) * .299, 2)
            + Math.pow((rgb.g - rgb2.g) * .587, 2)
            + Math.pow((rgb.b - rgb2.b) * .114, 2);
        if (dist <= min) {
            closest = color;
            min = dist;
        }
    }
    return closest;
}
function h2r(hex) {
    hex = '#' == hex[0] ? hex.slice(1) : hex;
    if (h2rs[hex])
        return h2rs[hex];
    var int = parseInt(hex, 16);
    var r = (int >> 16) & 255;
    var g = (int >> 8) & 255;
    var b = int & 255;
    return h2rs[hex] = { r: r, g: g, b: b };
}
module.exports = color;
//# sourceMappingURL=color.js.map