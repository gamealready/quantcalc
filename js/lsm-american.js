(function () {
  var FIELDS = ['spot', 'strike', 'maturity', 'rate', 'yield', 'volatility', 'paths', 'steps', 'degree', 'seed'];
  var DEFAULTS = { spot: 100, strike: 100, maturity: 1, rate: 0.05, yield: 0, volatility: 0.2, paths: 20000, steps: 50, degree: 3, seed: 12345 };

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normalGenerator(rand) {
    return function () {
      var u = 0, v = rand();
      while (u === 0) { u = rand(); }
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
  }

  function normCdf(x) {
    var t = 1 / (1 + 0.2316419 * Math.abs(x));
    var d = 0.3989422804014327 * Math.exp(-x * x / 2);
    var p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return x >= 0 ? 1 - p : p;
  }

  function bsPrice(s, k, t, r, q, sigma, isCall) {
    var sd = sigma * Math.sqrt(t);
    var d1 = (Math.log(s / k) + (r - q + 0.5 * sigma * sigma) * t) / sd;
    var d2 = d1 - sd;
    var df = Math.exp(-r * t), dq = Math.exp(-q * t);
    return isCall ? s * dq * normCdf(d1) - k * df * normCdf(d2) : k * df * normCdf(-d2) - s * dq * normCdf(-d1);
  }

  // Solve A x = b by Gaussian elimination with partial pivoting; returns null if singular.
  function solve(A, b) {
    var n = b.length, i, j, k;
    for (i = 0; i < n; i++) {
      var p = i;
      for (j = i + 1; j < n; j++) { if (Math.abs(A[j][i]) > Math.abs(A[p][i])) { p = j; } }
      if (Math.abs(A[p][i]) < 1e-12) { return null; }
      var tr = A[i]; A[i] = A[p]; A[p] = tr;
      var tb = b[i]; b[i] = b[p]; b[p] = tb;
      for (j = i + 1; j < n; j++) {
        var f = A[j][i] / A[i][i];
        for (k = i; k < n; k++) { A[j][k] -= f * A[i][k]; }
        b[j] -= f * b[i];
      }
    }
    var x = new Array(n);
    for (i = n - 1; i >= 0; i--) {
      var s = b[i];
      for (j = i + 1; j < n; j++) { s -= A[i][j] * x[j]; }
      x[i] = s / A[i][i];
    }
    return x;
  }

  function priceLSM(p, isCall) {
    var n = p.paths, m = p.steps, dt = p.maturity / m, df = Math.exp(-p.rate * dt);
    var drift = (p.rate - p.yield - 0.5 * p.volatility * p.volatility) * dt;
    var diff = p.volatility * Math.sqrt(dt);
    var gauss = normalGenerator(mulberry32(p.seed));
    var S = new Array(m + 1), t, i, d;
    for (t = 0; t <= m; t++) { S[t] = new Float64Array(n); }
    for (i = 0; i < n; i++) { S[0][i] = p.spot; }
    // Antithetic pairs
    for (t = 1; t <= m; t++) {
      for (i = 0; i < n; i += 2) {
        var z = gauss();
        S[t][i] = S[t - 1][i] * Math.exp(drift + diff * z);
        if (i + 1 < n) { S[t][i + 1] = S[t - 1][i + 1] * Math.exp(drift - diff * z); }
      }
    }
    function payoff(x) { return Math.max(isCall ? x - p.strike : p.strike - x, 0); }

    var cash = new Float64Array(n);       // discounted-to-current-step continuation cash flow
    var stopStep = new Int32Array(n);
    for (i = 0; i < n; i++) { cash[i] = payoff(S[m][i]); stopStep[i] = m; }

    var nb = p.degree + 1;
    for (t = m - 1; t >= 1; t--) {
      var idx = [];
      for (i = 0; i < n; i++) {
        cash[i] *= df;
        if (payoff(S[t][i]) > 0) { idx.push(i); }
      }
      if (idx.length <= nb) { continue; }
      var A = [], b = [], r, c;
      for (r = 0; r < nb; r++) { A.push(new Array(nb).fill(0)); b.push(0); }
      var basis = new Array(nb);
      for (var a = 0; a < idx.length; a++) {
        var x = S[t][idx[a]] / p.strike;
        basis[0] = 1;
        for (d = 1; d < nb; d++) { basis[d] = basis[d - 1] * x; }
        for (r = 0; r < nb; r++) {
          b[r] += basis[r] * cash[idx[a]];
          for (c = 0; c < nb; c++) { A[r][c] += basis[r] * basis[c]; }
        }
      }
      var coef = solve(A, b);
      if (!coef) { continue; }
      for (var a2 = 0; a2 < idx.length; a2++) {
        var j = idx[a2], xv = S[t][j] / p.strike, pw = 1, cont = 0;
        for (d = 0; d < nb; d++) { cont += coef[d] * pw; pw *= xv; }
        var ex = payoff(S[t][j]);
        if (ex > cont) { cash[j] = ex; stopStep[j] = t; }
      }
    }

    var sum = 0, sumSq = 0, eurSum = 0, eurSumSq = 0, early = 0;
    var eurDf = Math.exp(-p.rate * p.maturity);
    for (i = 0; i < n; i++) {
      var v = cash[i] * df;
      sum += v; sumSq += v * v;
      var e = payoff(S[m][i]) * eurDf;
      eurSum += e; eurSumSq += e * e;
      if (stopStep[i] < m) { early++; }
    }
    var mean = sum / n, eur = eurSum / n;
    var sd = Math.sqrt(Math.max(sumSq / n - mean * mean, 0));
    // Exercise at time 0 is also allowed.
    var immediate = payoff(p.spot);
    var price = Math.max(mean, immediate);
    return {
      price: price,
      stderr: sd / Math.sqrt(n),
      european: eur,
      earlyFraction: early / n,
      immediate: immediate
    };
  }

  function format(x, digits) { return isFinite(x) ? x.toFixed(digits === undefined ? 4 : digits) : ''; }

  function readInputs(form) {
    var out = {}, i;
    for (i = 0; i < FIELDS.length; i++) {
      var el = form.elements[FIELDS[i]];
      var v = parseFloat(el.value);
      if (!isFinite(v)) { throw new Error('Enter a valid number for ' + el.getAttribute('data-label') + '.'); }
      out[FIELDS[i]] = v;
    }
    if (out.spot <= 0 || out.strike <= 0) { throw new Error('Spot and strike must be positive.'); }
    if (out.maturity <= 0) { throw new Error('Maturity must be positive.'); }
    if (out.volatility <= 0) { throw new Error('Volatility must be positive.'); }
    out.paths = Math.floor(out.paths); out.steps = Math.floor(out.steps);
    out.degree = Math.floor(out.degree); out.seed = Math.floor(out.seed);
    if (out.paths < 100 || out.paths > 200000) { throw new Error('Paths must be between 100 and 200,000.'); }
    if (out.steps < 2 || out.steps > 500) { throw new Error('Exercise steps must be between 2 and 500.'); }
    if (out.paths * (out.steps + 1) > 12000000) { throw new Error('Paths × steps is too large for the browser; reduce one of them.'); }
    if (out.degree < 1 || out.degree > 6) { throw new Error('Polynomial degree must be between 1 and 6.'); }
    return out;
  }

  function init() {
    var form = document.getElementById('lsm-form');
    if (!form) { return; }
    var err = document.getElementById('lsm-error');

    function calculate() {
      err.textContent = '';
      try {
        var p = readInputs(form);
        var isCall = form.elements.optionType.value === 'call';
        var res = priceLSM(p, isCall);
        var bs = bsPrice(p.spot, p.strike, p.maturity, p.rate, p.yield, p.volatility, isCall);
        form.elements.price.value = format(res.price);
        form.elements.stderr.value = format(res.stderr);
        form.elements.ci.value = '[' + format(res.price - 1.96 * res.stderr) + ', ' + format(res.price + 1.96 * res.stderr) + ']';
        form.elements.european.value = format(bs);
        form.elements.premium.value = format(res.price - bs);
        form.elements.intrinsic.value = format(res.immediate);
        form.elements.early.value = format(100 * res.earlyFraction, 2) + '%';
      } catch (e) {
        err.textContent = e.message;
      }
    }

    document.getElementById('lsm-calculate').addEventListener('click', calculate);
    document.getElementById('lsm-reset').addEventListener('click', function () {
      form.reset();
      var i;
      for (i = 0; i < FIELDS.length; i++) { form.elements[FIELDS[i]].value = DEFAULTS[FIELDS[i]]; }
      ['price', 'stderr', 'ci', 'european', 'premium', 'intrinsic', 'early'].forEach(function (n) { form.elements[n].value = ''; });
      err.textContent = '';
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); calculate(); });
  }

  if (typeof window !== 'undefined') {
    window.quantcalcLSM = { priceLSM: priceLSM, bsPrice: bsPrice };
    document.addEventListener('DOMContentLoaded', init);
  }
  if (typeof module !== 'undefined') { module.exports = { priceLSM: priceLSM, bsPrice: bsPrice }; }
}());
