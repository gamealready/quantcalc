/**
 * THE CORE PRICER
 * Accepts direct arguments to allow for easy benchmarking.
 */
function runPricer(S,  T, s, r, L_max,  N_base) {
    let totalPrice = 0;
    
    // M is the refinement factor (Giles usually uses 2 or 4)
    const M = 4; 

    // Internal MLMC Loop
    for (let L = 0; L <= L_max; L++) {
        // Sample size N decreases as Level L increases to optimize cost
        // We use Math.pow(M, L) to scale samples inversely to path cost
        let N_level = Math.floor(N_base / Math.pow(M, L));
        
        // Ensure a minimum number of samples for statistical stability
        if (N_level < 1000) N_level = 1000;

        // Sum the expected value (L=0) or the correction (L>0)
        totalPrice += simulateMLMCLevel(L, S,  T, s, r, N_level);
    }

    return totalPrice;
}

/**
 * Level Simulation Logic
 * L: Current Level, N: Number of samples for this level
 */
function simulateMLMCLevel(L, S0, T, sigma, r, N) {
    const randomNormal = () => {
        let u = Math.random(), v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    // Payoff for Lookback Put: exp(-rT) * (Max_Price - Final_Price)
    const getPayoff = (path) => {
        let minS = Math.min(...path, S0); 
        let ST = path[path.length - 1];
        return Math.exp(-r * T) * (ST-minS);
    };

    const n0 = 2; // Initial steps at Level 0
    const M = 4;  // Refinement factor

    if (L === 0) {
        let sum = 0;
        let dt = T / n0;
        for (let i = 0; i < N; i++) {
            let S = S0, path = [];
            for (let j = 0; j < n0; j++) {
                S *= Math.exp((r - 0.5 * sigma**2) * dt + sigma * Math.sqrt(dt) * randomNormal());
                path.push(S);
            }
            sum += getPayoff(path);
        }
        return sum / N;
    } else {
        let sumDiff = 0;
        let Mc = n0 * Math.pow(M, L - 1); // Number of coarse steps
        let Mf = Mc * M;                  // Number of fine steps
        let dt_f = T / Mf;
        let dt_c = T / Mc;

        for (let i = 0; i < N; i++) {
            let Sf = S0, Sc = S0, pathF = [], pathC = [];
            for (let j = 0; j < Mc; j++) {
                let dW_coarse = 0;
                // Generate M fine steps and sum their Brownian increments for 1 coarse step
                for (let k = 0; k < M; k++) {
                    let dz = randomNormal();
                    let dW_fine = Math.sqrt(dt_f) * dz;
                    Sf *= Math.exp((r - 0.5 * sigma**2) * dt_f + sigma * dW_fine);
                    pathF.push(Sf);
                    dW_coarse += dW_fine;
                }
                // Coarse path uses the same total Brownian motion as the M fine steps
                Sc *= Math.exp((r - 0.5 * sigma**2) * dt_c + sigma * dW_coarse);
                pathC.push(Sc);
            }
            // The result for L > 0 is the difference (Correction)
            sumDiff += (getPayoff(pathF) - getPayoff(pathC));
        }
        return sumDiff / N;
    }
}