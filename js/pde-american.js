(function () {
  var FIELDS = ['spot', 'strike', 'maturity', 'rate', 'yield', 'volatility', 'spaceSteps', 'timeSteps'];
  var DEFAULTS = { spot: 100, strike: 100, maturity: 1, rate: 0.05, yield: 0, volatility: 0.2, spaceSteps: 400, timeSteps: 200 };

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

  // Solves the Black-Scholes PDE in x = ln S on a uniform grid with Crank-Nicolson time stepping.
  // Rannacher start-up (fully implicit half steps) damps oscillations from the payoff kink.
  // American exercise is enforced with projected SOR (PSOR); European uses the Thomas algorithm.
  function solvePDE(p, isCall, american) {
    var M = p.spaceSteps + (p.spaceSteps % 2), N = p.timeSteps;
    var sigma = p.volatility, r = p.rate, q = p.yield, K = p.strike, T = p.maturity;
    var mu = r - q - 0.5 * sigma * sigma;
    var half = 5 * sigma * Math.sqrt(T) + Math.abs(mu) * T;
    var x0 = Math.log(p.spot), dx = 2 * half / M;
    var S = new Float64Array(M + 1), pay = new Float64Array(M + 1), V = new Float64Array(M + 1);
    var i, n;
    for (i = 0; i <= M; i++) {
      S[i] = Math.exp(x0 - half + i * dx);
      pay[i] = isCall ? Math.max(S[i] - K, 0) : Math.max(K - S[i], 0);
      V[i] = pay[i];
    }
    var a = 0.5 * sigma * sigma / (dx * dx);
    var lo = a - mu / (2 * dx), di = -2 * a - r, up = a + mu / (2 * dx);
    var dt = T / N;
    var steps = [];
    for (n = 0; n < 2; n++) { steps.push({ dt: dt / 2, theta: 1 }); steps.push({ dt: dt / 2, theta: 1 }); }
    for (n = 2; n < N; n++) { steps.push({ dt: dt, theta: 0.5 }); }
    var tau = 0, iterTotal = 0, iterSteps = 0;
    var rhs = new Float64Array(M + 1), W = new Float64Array(M + 1);
    var cp = new Float64Array(M + 1), dp = new Float64Array(M + 1);

    function boundary(index, t) {
      if (american) { return pay[index]; }
      var s = S[index], df = Math.exp(-r * t), dq = Math.exp(-q * t);
      return isCall ? Math.max(s * dq - K * df, 0) : Math.max(K * df - s * dq, 0);
    }

    for (n = 0; n < steps.length; n++) {
      var h = steps[n].dt, th = steps[n].theta;
      tau += h;
      var A = -th * h * lo, B = 1 - th * h * di, C = -th * h * up;
      var e = (1 - th) * h;
      for (i = 1; i < M; i++) {
        rhs[i] = V[i] + e * (lo * V[i - 1] + di * V[i] + up * V[i + 1]);
      }
      W[0] = boundary(0, tau); W[M] = boundary(M, tau);
      rhs[1] -= A * W[0]; rhs[M - 1] -= C * W[M];
      if (!american) {
        cp[1] = C / B; dp[1] = rhs[1] / B;
        for (i = 2; i < M; i++) {
          var m = B - A * cp[i - 1];
          cp[i] = C / m; dp[i] = (rhs[i] - A * dp[i - 1]) / m;
        }
        W[M - 1] = dp[M - 1];
        for (i = M - 2; i >= 1; i--) { W[i] = dp[i] - cp[i] * W[i + 1]; }
      } else {
        var omega = 1.3, it = 0, err;
        for (i = 1; i < M; i++) { W[i] = Math.max(V[i], pay[i]); }
        do {
          err = 0;
          for (i = 1; i < M; i++) {
            var y = (rhs[i] - A * W[i - 1] - C * W[i + 1]) / B;
            var nv = Math.max(pay[i], W[i] + omega * (y - W[i]));
            var d = nv - W[i];
            err += d * d;
            W[i] = nv;
          }
          it++;
        } while (err > 1e-18 && it < 10000);
        iterTotal += it; iterSteps++;
      }
      for (i = 0; i <= M; i++) { V[i] = W[i]; }
    }

    var c = M / 2;
    var vx = (V[c + 1] - V[c - 1]) / (2 * dx);
    var vxx = (V[c + 1] - 2 * V[c] + V[c - 1]) / (dx * dx);
    var boundaryS = null;
    if (american) {
      // Critical price: the exercise region is where the value equals the payoff.
      for (i = 0; i <= M; i++) {
        var ex = Math.abs(V[i] - pay[i]) < 1e-10 && pay[i] > 0;
        if (isCall && ex) { boundaryS = S[i]; break; }
        if (!isCall && ex) { boundaryS = S[i]; }
      }
    }
    return {
      price: V[c],
      delta: vx / p.spot,
      gamma: (vxx - vx) / (p.spot * p.spot),
      avgIterations: iterSteps ? iterTotal / iterSteps : 0,
      exerciseBoundary: boundaryS
    };
  }

  function priceAmericanPDE(p, isCall) {
    var am = solvePDE(p, isCall, true);
    var eu = solvePDE(p, isCall, false);
    var immediate = isCall ? Math.max(p.spot - p.strike, 0) : Math.max(p.strike - p.spot, 0);
    return {
      price: Math.max(am.price, immediate),
      delta: am.delta,
      gamma: am.gamma,
      europeanPDE: eu.price,
      avgIterations: am.avgIterations,
      exerciseBoundary: am.exerciseBoundary,
      immediate: immediate
    };
  }

  function format(x, digits) { return x !== null && isFinite(x) ? x.toFixed(digits === undefined ? 4 : digits) : 'n/a'; }

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
    out.spaceSteps = Math.floor(out.spaceSteps); out.timeSteps = Math.floor(out.timeSteps);
    if (out.spaceSteps < 20 || out.spaceSteps > 4000) { throw new Error('Space steps must be between 20 and 4,000.'); }
    if (out.timeSteps < 4 || out.timeSteps > 4000) { throw new Error('Time steps must be between 4 and 4,000.'); }
    return out;
  }

  var OUTPUTS = ['price', 'delta', 'gamma', 'european', 'bs', 'premium', 'intrinsic', 'boundary', 'iterations'];

  function init() {
    var form = document.getElementById('pde-form');
    if (!form) { return; }
    var err = document.getElementById('pde-error');

    function calculate() {
      err.textContent = '';
      try {
        var p = readInputs(form);
        var isCall = form.elements.optionType.value === 'call';
        var res = priceAmericanPDE(p, isCall);
        var bs = bsPrice(p.spot, p.strike, p.maturity, p.rate, p.yield, p.volatility, isCall);
        form.elements.price.value = format(res.price);
        form.elements.delta.value = format(res.delta);
        form.elements.gamma.value = format(res.gamma, 6);
        form.elements.european.value = format(res.europeanPDE);
        form.elements.bs.value = format(bs);
        form.elements.premium.value = format(res.price - res.europeanPDE);
        form.elements.intrinsic.value = format(res.immediate);
        form.elements.boundary.value = format(res.exerciseBoundary, 2);
        form.elements.iterations.value = format(res.avgIterations, 1);
      } catch (e) {
        err.textContent = e.message;
      }
    }

    document.getElementById('pde-calculate').addEventListener('click', calculate);
    document.getElementById('pde-reset').addEventListener('click', function () {
      form.reset();
      var i;
      for (i = 0; i < FIELDS.length; i++) { form.elements[FIELDS[i]].value = DEFAULTS[FIELDS[i]]; }
      OUTPUTS.forEach(function (n) { form.elements[n].value = ''; });
      err.textContent = '';
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); calculate(); });
  }

  if (typeof window !== 'undefined') {
    window.quantcalcPDEAmerican = { priceAmericanPDE: priceAmericanPDE, bsPrice: bsPrice };
    document.addEventListener('DOMContentLoaded', init);
  }
  if (typeof module !== 'undefined') { module.exports = { priceAmericanPDE: priceAmericanPDE, bsPrice: bsPrice }; }
}());
