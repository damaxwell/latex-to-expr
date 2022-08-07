const latex_parser = require('./latex-mathjs-parser')

test("float", () => {
  input = "3.14"
  output = "number[3.14]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("variable", () => {
  input = "z"
  output = "variable[z]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("addition", () => {
  input = "z+9"
  output = "+[variable[z],number[9]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("multiplication", () => {
  input = "z*9"
  output = "*[variable[z],number[9]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("implicit multiplication", () => {
  input = "9z"
  output = "*[number[9],variable[z]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("distribute multiplication", () => {
  input = "z(x+9)"
  output = "*[variable[z],+[variable[x],number[9]]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("mixed distribute multiplication", () => {
  input = "z*(x+9)45y"
  output = "*[*[*[variable[z],+[variable[x],number[9]]],number[45]],variable[y]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("power", () => {
  input = "a^2"
  output = "^[variable[a],number[2]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("nested power", () => {
  input = "a^(2^3)"
  output = "^[variable[a],^[number[2],number[3]]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("implicit power times power", () => {
  input = "a^2 b^3"
  output = "*[^[variable[a],number[2]],^[variable[b],number[3]]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("sum of multiplication", () => {
  input = "ab + 9*z"
  output = "+[*[variable[a],variable[b]],*[number[9],variable[z]]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("greek variable", () => {
  input = "\\theta"
  output = "variable[θ]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("euler's zero", () => {
  input = "e^{\\pi i} + 1"
  output = "+[^[variable[e],*[variable[π],variable[i]]],number[1]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("sin(x)", () => {
  input = "\\sin(x)"
  output = "sin[variable[x]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("sin x ", () => {
  input = "\\sin x"
  output = "sin[variable[x]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("sin 3x^2 ", () => {
  input = "\\sin 3x^2"
  output = "sin[*[number[3],^[variable[x],number[2]]]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("sin 3x^2 +72", () => {
  input = "\\sin 3x^2 + 72"
  output = "+[sin[*[number[3],^[variable[x],number[2]]]],number[72]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("sin^2 x", () => {
  input = "\\sin^2 x"
  output = "^[sin[variable[x]],number[2]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("sin^2 x^3", () => {
  input = "\\sin^2 x^3"
  output = "^[sin[^[variable[x],number[3]]],number[2]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("sin^2 x + cos^2 x", () => {
  input = "\\sin ^2x+\\cos ^2x"
  output = "+[^[sin[variable[x]],number[2]],^[cos[variable[x]],number[2]]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("sqrt(x^2)", () => {
  input = "\\sqrt{x^2}"
  output = "sqrt[^[variable[x],number[2]]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("cube root of x^2", () => {
  input = "\\sqrt[3]{x^2}"
  output = "sqrt[number[3],^[variable[x],number[2]]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("log_10 x", () => {
  input = "\\log _{10}\\left(x\\right)"
  output = "log[number[10],variable[x]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("tan^{-1} x", () => {
  input = "\\tan ^{-1}x"
  output = "funcinv[tan[variable[x]]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("arctan x", () => {
  input = "\\arctan x"
  output = "arctan[variable[x]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("atan x", () => {
  input = "\\operatorname{atan}x"
  output = "atan[variable[x]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("sqrt{x}+9", () => {
  input = "\\sqrt{x}+9"
  output = "+[sqrt[variable[x]],number[9]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("\\sin(x)+9", () => {
  input = "\\sin(x)+9"
  output = "+[sin[variable[x]],number[9]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("-\\sin(x)", () => {
  input = "-\\sin(x)"
  output = "neg[sin[variable[x]]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

test("cos poly theta", () => {
  input = "\\cos(3\\theta^5 -2\\theta +1)*(15\\theta^4-2)"
  output = "*[cos[+[-[*[number[3],^[variable[θ],number[5]]],*[number[2],variable[θ]]],number[1]]],-[*[number[15],^[variable[θ],number[4]]],number[2]]]"
  p = new latex_parser.Parser(input)
  expect(p.parse().toString()).toBe(output);
});

