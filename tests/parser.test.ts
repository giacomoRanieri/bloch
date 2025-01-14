import { complex, cos, pi, sin, sqrt } from 'mathjs';
import { evaluate } from '../src/parser';

describe('latex parser', function () {
  [
    {
      expr: '',
      expectation: null,
    },
    {
      expr: '2+3',
      expectation: 5,
    },
    {
      expr: '10/5',
      expectation: 2,
    },
    {
      expr: '15/(3+2)',
      expectation: 3,
    },
    {
      expr: '(15+5)/(3+2)',
      expectation: 4,
    },
    {
      expr: '(2+2)*3',
      expectation: 12,
    },
    {
      expr: '2^3',
      expectation: 8,
    },
    {
      expr: '-2',
      expectation: -2,
    },
    {
      expr: '2^-(2+1)',
      expectation: 0.125,
    },
    {
      expr: '-(2+1)',
      expectation: -3,
    },
    {
      expr: '-{2+1}',
      expectation: -3,
    },
    {
      expr: '+(2+1)',
      expectation: 3,
    },
    {
      expr: '+{2+1}',
      expectation: 3,
    },
    {
      expr: '2^-1',
      expectation: 0.5,
    },
    {
      expr: '2^+1',
      expectation: 2,
    },
    {
      expr: '2^(3+4+5)',
      expectation: 4096,
    },
    {
      expr: '2^{3+4+5}',
      expectation: 4096,
    },
    {
      expr: 'i',
      expectation: complex(0, 1),
    },
    {
      expr: '2i',
      expectation: complex(0, 2),
    },
    {
      expr: 'i2',
      expectation: complex(0, 2),
    },
    {
      expr: 'e^{i*pi}',
      expectation: -1,
    },
    {
      expr: 'e^{i*pi/2}',
      expectation: complex(0, 1),
    },
    {
      expr: 'e^{i*pi*3/2}',
      expectation: complex(0, -1),
    },
    {
      expr: 'e^{i*(pi+pi/2)}',
      expectation: complex(0, -1),
    },
    {
      expr: '-e^{i*(pi+pi/2)}',
      expectation: complex(0, 1),
    },
    {
      expr: '1-e^{i*(pi+pi/2)}',
      expectation: complex(1, 1),
    },
    {
      expr: 'cos(0)',
      expectation: 1,
    },
    {
      expr: 'cos(pi)',
      expectation: -1,
    },
    {
      expr: 'cos pi',
      expectation: cos(pi),
    },
    {
      expr: 'cos                      pi',
      expectation: cos(pi),
    },
    {
      expr: 'cos pi/2',
      expectation: cos(pi) / 2,
    },
    {
      expr: 'cos(pi+pi/2)',
      expectation: cos(pi + pi / 2),
    },
    {
      expr: 'sin(0)',
      expectation: 0,
    },
    {
      expr: 'sin(pi/2)',
      expectation: sin(pi / 2),
    },
    {
      expr: 'sin(pi)',
      expectation: 0,
    },
    {
      expr: 'floor(3.3)',
      expectation: 3,
    },
    {
      expr: 'ceil(9.9)',
      expectation: 10,
    },
    {
      expr: '2ceil(9.9)',
      expectation: 20,
    },
    {
      expr: 'floor(3.3)/ceil(9.9)',
      expectation: 3 / 10,
    },
    {
      expr: 'sqrt(1/2)',
      expectation: sqrt(1 / 2),
    },
    {
      expr: '-sqrt(1/2)',
      expectation: -sqrt(1 / 2),
    },
    {
      expr: 'sqrt(e^(i*pi/2))',
      expectation: complex(0.7071067811865476, 0.7071067811865476),
    },
  ].forEach((testCase) => {
    it(`evaluates expression ${testCase.expr}`, function () {
      expect(evaluate(testCase.expr)).toEqualComplex(testCase.expectation);
    });
  });

  [
    {
      expr: '2x',
      x: 3,
      expectation: 6,
    },
    {
      expr: '2x',
      x: 4,
      expectation: 8,
    },
  ].forEach((testCase) => {
    it(`evaluates expression with variable ${testCase.expr}`, function () {
      expect(evaluate(testCase.expr, testCase.x)).toBe(testCase.expectation);
    });
  });
});

describe('latex parser focus on i', function () {
  [
    { expr: 'i', expectation: complex(0, 1) },

    { expr: 'i * -1', expectation: complex(0, -1) },
    { expr: 'i * (-1)', expectation: complex(0, -1) },
    { expr: '-i * 1', expectation: complex(0, -1) },
    { expr: '(-i) * 1', expectation: complex(0, -1) },
    { expr: '1 * -i', expectation: complex(0, -1) },
    { expr: '1 * (-i)', expectation: complex(0, -1) },
    { expr: '-1 * i', expectation: complex(0, -1) },

    { expr: '-1 * i', expectation: complex(0, -1) },

    { expr: '-i * -1', expectation: complex(0, 1) },
    { expr: '-1 * -i', expectation: complex(0, 1) },
    { expr: 'i * 1', expectation: complex(0, 1) },
    { expr: '1 * i', expectation: complex(0, 1) },
  ].forEach((testCase) => {
    it(`evaluates expression with i: ${testCase.expr}`, function () {
      // console.log('expr: ', evaluate(testCase.expr), ' \t expect: ', testCase.expectation);
      expect(evaluate(testCase.expr)).toEqualComplex(testCase.expectation);
    });
  });
});
