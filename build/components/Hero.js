"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Hero;

var _react = require("@linaria/react");

var _react2 = _interopRequireDefault(require("react"));

var _utils = require("../styles/utils");

var _Container = _interopRequireDefault(require("./Container"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Hero() {
  return /*#__PURE__*/_react2.default.createElement(HeroContainer, null, /*#__PURE__*/_react2.default.createElement(_Container.default, null, /*#__PURE__*/_react2.default.createElement(Row, null, /*#__PURE__*/_react2.default.createElement(LeftColumn, null, /*#__PURE__*/_react2.default.createElement(Heading, null, "Zero-Runtime CSS in JS"), /*#__PURE__*/_react2.default.createElement(Description, null, "Write CSS in JS and get real CSS files during build. Use dynamic prop based styles with the React bindings and have them transpiled to CSS variables automatically. Great productivity with source maps and linting support."), /*#__PURE__*/_react2.default.createElement(Button, {
    as: "a",
    href: "https://github.com/callstack/linaria#installation"
  }, "Get Started")), /*#__PURE__*/_react2.default.createElement(RightColumn, null, /*#__PURE__*/_react2.default.createElement(CodeSample, {
    alt: "Linaria code sample",
    src: "/dist/be092871bdfd15ff77ba28246459a73a.png"
  })))));
}

const HeroContainer = /*#__PURE__*/(0, _react.styled)("main")({
  name: "HeroContainer",
  class: "h1rolopv"
});
const Row = /*#__PURE__*/(0, _react.styled)("div")({
  name: "Row",
  class: "r13wc1tf"
});
const LeftColumn = /*#__PURE__*/(0, _react.styled)("div")({
  name: "LeftColumn",
  class: "l146m3r4"
});
const RightColumn = /*#__PURE__*/(0, _react.styled)("div")({
  name: "RightColumn",
  class: "r1oacsu2"
});
const Heading = /*#__PURE__*/(0, _react.styled)("h1")({
  name: "Heading",
  class: "hfjre8y"
});
const Description = /*#__PURE__*/(0, _react.styled)("p")({
  name: "Description",
  class: "d1jprizp"
});
const Button = /*#__PURE__*/(0, _react.styled)("button")({
  name: "Button",
  class: "b199eznj"
});
const CodeSample = /*#__PURE__*/(0, _react.styled)("img")({
  name: "CodeSample",
  class: "c19oj5n"
});