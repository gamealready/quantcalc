/**
 * Autocallable note priced with multilevel Monte Carlo (MLMC).
 *
 * Contract (notional = initial price S0):
 *  - Observation dates t_i = i*T/nObs, nObs = max(1, round(4T)) (quarterly).
 *  - If S(t_i) >= K the note is called: pays S0*(1 + q*t_i), discounted from t_i.
 *  - If never called: pays S0 if the asset stayed at or above the protection
 *    barrier p on every time step, otherwise pays S(T). Discounted from T.
 */
function runAutocallPricer(S, K, T, s, r, q, L_max, p_barrier, N_base) {
    const M = 4;
    let totalPrice = 0;
    for (let L = 0; L <= L_max; L++) {
        let N_level = Math.floor(N_base / Math.pow(M, L));
        if (N_level < 1000) N_level = 1000;
        totalPrice += simulateAutocallLevel(L, S, K, T, s, r, q, p_barrier, N_level);
    }
    return totalPrice;
}

function simulateAutocallLevel(L, S0, K, T, sigma, r, q, barrier, N) {
    const M = 4;
    const nObs = Math.max(1, Math.round(4 * T));

    const randomNormal = () => {
        const u = 1 - Math.random(), v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    // path[j] is the price after step j+1; obs dates fall every `stride` steps.
    const getPayoff = (path, stride) => {
        let breached = false;
        for (let j = 0; j < path.length; j++) {
            if (path[j] < barrier) breached = true;
            if ((j + 1) % stride === 0) {
                const i = (j + 1) / stride;
                if (path[j] >= K) {
                    const t = i * T / nObs;
                    return Math.exp(-r * t) * S0 * (1 + q * t);
                }
            }
        }
        const ST = path[path.length - 1];
        return Math.exp(-r * T) * (breached ? ST : S0);
    };

    const simulate = (nStepsPerObs, dz) => {
        const n = nObs * nStepsPerObs;
        const dt = T / n;
        const path = new Array(n);
        let x = S0;
        for (let j = 0; j < n; j++) {
            x *= Math.exp((r - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * dz[j]);
            path[j] = x;
        }
        return path;
    };

    let sum = 0;
    const fine = Math.pow(M, L);
    for (let i = 0; i < N; i++) {
        const nf = nObs * fine;
        const dzF = new Array(nf);
        for (let j = 0; j < nf; j++) dzF[j] = randomNormal();
        const pathF = simulate(fine, dzF);
        if (L === 0) {
            sum += getPayoff(pathF, fine);
        } else {
            // Coarse path sums M fine normals per coarse step (same Brownian motion).
            const coarse = fine / M;
            const nc = nObs * coarse;
            const dzC = new Array(nc);
            for (let j = 0; j < nc; j++) {
                let a = 0;
                for (let k = 0; k < M; k++) a += dzF[j * M + k];
                dzC[j] = a / Math.sqrt(M);
            }
            const pathC = simulate(coarse, dzC);
            sum += getPayoff(pathF, fine) - getPayoff(pathC, coarse);
        }
    }
    return sum / N;
}
