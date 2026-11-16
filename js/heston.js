(function () {
  var DEFAULTS = {
    spot: 100,
    strike: 100,
    maturity: 1,
    rate: 0.03,
    yield: 0,
    variance: 0.04,
    longRunVariance: 0.04,
    meanReversion: 2,
    volOfVol: 0.5,
    correlation: -0.7
  };
  var INTEGRATION_STEPS = 2048;
  var INTEGRATION_LIMIT = 120;
  var STRIKE_RATIOS = [0.8, 0.9, 0.95, 1, 1.05, 1.1, 1.2];

  function complex(re, im) {
    return { re: re, im: im };
  }

  function add(a, b) {
    return complex(a.re + b.re, a.im + b.im);
  }

  function subtract(a, b) {
    return complex(a.re - b.re, a.im - b.im);
  }

  function multiply(a, b) {
    return complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  }

  function divide(a, b) {
    var denominator = b.re * b.re + b.im * b.im;
    return complex(
      (a.re * b.re + a.im * b.im) / denominator,
      (a.im * b.re - a.re * b.im) / denominator
    );
  }

  function scale(a, factor) {
    return complex(a.re * factor, a.im * factor);
  }

  function exponential(a) {
    var magnitude = Math.exp(a.re);
    return complex(magnitude * Math.cos(a.im), magnitude * Math.sin(a.im));
  }

  function logarithm(a) {
    return complex(Math.log(Math.sqrt(a.re * a.re + a.im * a.im)), Math.atan2(a.im, a.re));
  }

  function squareRoot(a) {
    var magnitude = Math.sqrt(a.re * a.re + a.im * a.im);
    var re = Math.sqrt(Math.max(0, (magnitude + a.re) / 2));
    var im = Math.sqrt(Math.max(0, (magnitude - a.re) / 2));
    return complex(re, a.im < 0 ? -im : im);
  }

  function characteristicFunction(u, params) {
    var iu = complex(-u.im, u.re);
    var uSquared = multiply(u, u);
    var b = subtract(
      complex(params.meanReversion, 0),
      scale(iu, params.correlation * params.volOfVol)
    );
    var d = squareRoot(add(
      multiply(b, b),
      scale(add(uSquared, iu), params.volOfVol * params.volOfVol)
    ));
    var g = divide(subtract(b, d), add(b, d));
    var decay = exponential(scale(d, -params.maturity));
    var gDecay = multiply(g, decay);
    var logRatio = logarithm(divide(
      subtract(complex(1, 0), gDecay),
      subtract(complex(1, 0), g)
    ));
    var drift = params.rate - params.yield;
    var c = add(
      scale(iu, Math.log(params.spot) + drift * params.maturity),
      scale(subtract(
        scale(subtract(b, d), params.maturity),
        scale(logRatio, 2)
      ), params.meanReversion * params.longRunVariance /
        (params.volOfVol * params.volOfVol))
    );
    var dTerm = multiply(
      divide(subtract(b, d), complex(params.volOfVol * params.volOfVol, 0)),
      divide(subtract(complex(1, 0), decay), subtract(complex(1, 0), gDecay))
    );
    return exponential(add(c, scale(dTerm, params.variance)));
  }

  function probabilityIntegrand(u, params, logStrike, shareMeasure, shareNormalizer) {
    var argument = shareMeasure ? complex(u, -1) : complex(u, 0);
    var value = characteristicFunction(argument, params);
    if (shareMeasure) {
      value = divide(value, shareNormalizer);
    }
    value = multiply(complex(Math.cos(u * logStrike), -Math.sin(u * logStrike)), value);
    return value.im / u;
  }

  function probability(params, strike, shareMeasure, shareNormalizer) {
    var step = INTEGRATION_LIMIT / INTEGRATION_STEPS;
    var logStrike = Math.log(strike);
    var sum = probabilityIntegrand(1e-7, params, logStrike, shareMeasure, shareNormalizer);
    var i;
    for (i = 1; i < INTEGRATION_STEPS; i += 1) {
      sum += (i % 2 === 0 ? 2 : 4) * probabilityIntegrand(
        i * step, params, logStrike, shareMeasure, shareNormalizer
      );
    }
    sum += probabilityIntegrand(
      INTEGRATION_LIMIT, params, logStrike, shareMeasure, shareNormalizer
    );
    return 0.5 + (sum * step / 3) / Math.PI;
  }

  function normalCdf(x) {
    var absoluteX = Math.abs(x);
    var t = 1 / (1 + 0.2316419 * absoluteX);
    var density = 0.3989422804014327 * Math.exp(-0.5 * absoluteX * absoluteX);
    var probability = 1 - density * t * (
      0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429)))
    );
    return x < 0 ? 1 - probability : probability;
  }

  function blackScholesCall(spot, strike, maturity, rate, yieldRate, volatility) {
    var discountedSpot = spot * Math.exp(-yieldRate * maturity);
    var discountedStrike = strike * Math.exp(-rate * maturity);
    var standardDeviation = volatility * Math.sqrt(maturity);
    if (standardDeviation < 1e-12) {
      return Math.max(discountedSpot - discountedStrike, 0);
    }
    var d1 = (Math.log(spot / strike) + (rate - yieldRate +
      0.5 * volatility * volatility) * maturity) / standardDeviation;
    var d2 = d1 - standardDeviation;
    return discountedSpot * normalCdf(d1) - discountedStrike * normalCdf(d2);
  }

  function expectedAverageVariance(params) {
    return params.longRunVariance + (params.variance - params.longRunVariance) *
      (1 - Math.exp(-params.meanReversion * params.maturity)) /
      (params.meanReversion * params.maturity);
  }

  function hestonCall(params, strike) {
    var averageVariance = expectedAverageVariance(params);
    if (params.volOfVol < 1e-8) {
      return blackScholesCall(
        params.spot, strike, params.maturity, params.rate, params.yield,
        Math.sqrt(Math.max(0, averageVariance))
      );
    }
    var shareNormalizer = characteristicFunction(complex(0, -1), params);
    var p1 = probability(params, strike, true, shareNormalizer);
    var p2 = probability(params, strike, false, shareNormalizer);
    p1 = Math.max(0, Math.min(1, p1));
    p2 = Math.max(0, Math.min(1, p2));
    var call = params.spot * Math.exp(-params.yield * params.maturity) * p1 -
      strike * Math.exp(-params.rate * params.maturity) * p2;
    var lowerBound = Math.max(
      params.spot * Math.exp(-params.yield * params.maturity) -
        strike * Math.exp(-params.rate * params.maturity),
      0
    );
    var upperBound = params.spot * Math.exp(-params.yield * params.maturity);
    return Math.max(lowerBound, Math.min(upperBound, call));
  }

  function impliedVolatility(price, params, strike) {
    var lowerBound = Math.max(
      params.spot * Math.exp(-params.yield * params.maturity) -
        strike * Math.exp(-params.rate * params.maturity),
      0
    );
    var upperBound = params.spot * Math.exp(-params.yield * params.maturity);
    if (price <= lowerBound + 1e-10) {
      return 0;
    }
    if (price >= upperBound) {
      return NaN;
    }
    var low = 0;
    var high = 5;
    var middle;
    var i;
    for (i = 0; i < 80; i += 1) {
      middle = (low + high) / 2;
      if (blackScholesCall(
        params.spot, strike, params.maturity, params.rate, params.yield, middle
      ) < price) {
        low = middle;
      } else {
        high = middle;
      }
    }
    return (low + high) / 2;
  }

  function readParams(form) {
    var names = Object.keys(DEFAULTS);
    var params = {};
    for (var i = 0; i < names.length; i += 1) {
      var name = names[i];
      var value = Number(form.elements[name].value);
      if (form.elements[name].value.trim() === "" || !isFinite(value)) {
        throw new Error("Enter a valid number for " + form.elements[name].getAttribute("data-label") + ".");
      }
      params[name] = value;
    }
    if (params.spot <= 0 || params.strike <= 0 || params.maturity <= 0) {
      throw new Error("Spot, strike, and maturity must be positive.");
    }
    if (params.variance < 0 || params.longRunVariance < 0 ||
        params.meanReversion <= 0 || params.volOfVol < 0 ||
        params.correlation <= -1 || params.correlation >= 1) {
      throw new Error("Variances and volatility of volatility cannot be negative; mean reversion must be positive; correlation must be between -1 and 1.");
    }
    return params;
  }

  function format(value, decimals) {
    return isFinite(value) ? value.toFixed(decimals) : "—";
  }

  function setValue(form, name, value) {
    form.elements[name].value = value;
  }

  function appendSmileRow(body, ratio, params, benchmarkVolatility) {
    var strike = params.spot * ratio;
    var call = hestonCall(params, strike);
    var row = document.createElement("tr");
    var values = [
      ratio.toFixed(2) + "×",
      format(strike, 2),
      format(call, 4),
      format(impliedVolatility(call, params, strike) * 100, 2) + "%",
      format(blackScholesCall(
        params.spot, strike, params.maturity, params.rate, params.yield, benchmarkVolatility
      ), 4)
    ];
    for (var i = 0; i < values.length; i += 1) {
      var cell = document.createElement("td");
      cell.textContent = values[i];
      row.appendChild(cell);
    }
    body.appendChild(row);
  }

  function calculateHeston(form) {
    var error = document.getElementById("heston-error");
    error.textContent = "";
    try {
      var params = readParams(form);
      var call = hestonCall(params, params.strike);
      var put = call - params.spot * Math.exp(-params.yield * params.maturity) +
        params.strike * Math.exp(-params.rate * params.maturity);
      var benchmarkVolatility = Math.sqrt(Math.max(0, expectedAverageVariance(params)));
      var implied = impliedVolatility(call, params, params.strike);
      setValue(form, "callPrice", format(call, 6));
      setValue(form, "putPrice", format(put, 6));
      setValue(form, "benchmarkVolatility", format(benchmarkVolatility * 100, 2) + "%");
      setValue(form, "impliedVolatility", format(implied * 100, 2) + "%");

      var body = document.getElementById("heston-smile-results");
      body.textContent = "";
      for (var i = 0; i < STRIKE_RATIOS.length; i += 1) {
        appendSmileRow(body, STRIKE_RATIOS[i], params, benchmarkVolatility);
      }
    } catch (exception) {
      error.textContent = exception.message;
    }
  }

  function resetHeston() {
    var form = document.forms.hestonForm;
    Object.keys(DEFAULTS).forEach(function (name) {
      form.elements[name].value = DEFAULTS[name];
    });
    calculateHeston(form);
  }

  window.calculateHeston = calculateHeston;
  window.resetHeston = resetHeston;
  document.addEventListener("DOMContentLoaded", function () {
    var form = document.forms.hestonForm;
    document.getElementById("heston-calculate").addEventListener("click", function () {
      calculateHeston(form);
    });
    document.getElementById("heston-reset").addEventListener("click", resetHeston);
    calculateHeston(form);
  });
}());
