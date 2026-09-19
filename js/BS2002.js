// --- START Bjerksund-Stensland 2002 (BS2002) Implementation ---
//import {cdfN} from "./lib";
//import {M} from "./lib";
 /**
 * Cumulative Normal Distribution Function (CDF) $\Phi(x)$.
 * Renamed from N to cdfN to prevent declaration conflicts.
 */
function cdfN(x){
    const a1 = 0.319381530, a2 = -0.356563782, a3 = 1.781477937, a4 = -1.821255978, a5 = 1.330274429;
      const p = 0.2316419;
      const sign = (x >= 0) ? 1 : -1;
      const absX = Math.abs(x);
      const t = 1.0 / (1.0 + p * absX);
      const z = 1.0 / Math.sqrt(2.0 * Math.PI) * Math.exp(-0.5 * absX * absX);
      const y = 1.0 - z * (a1 * t + a2 * t * t + a3 * Math.pow(t, 3) + a4 * Math.pow(t, 4) + a5 * Math.pow(t, 5));
      return sign === 1 ? y : 1.0 - y;
  };
  
  
  /**
   * Standard Normal Probability Density Function (N'(x) or phi(x))
   * @param {number} x The z-score.
   * @returns {number} The probability density.
   */
function N_prime(x) {
      return Math.exp(-0.5 * x * x) / Math.sqrt(2.0 * Math.PI);
  }


  // Sign function for Bivariate Normal Cumulative Distribution Function
function sign(a) {
    if (a<0)
        return -1.0;
    else if (a>0)
        return 1.0;
    else
        return 0.0;
}
// Support function for Bivariate Normal Cumulative Distribution Function
function f(x, y, aprime, bprime,  rho) {
r = aprime * (2.0 * x - aprime) + bprime * (2.0 * y - bprime) + 2.0 * rho * (x - aprime) * (y - bprime);
return Math.exp(r);
}
  /**
   * Bivariate Normal Cumulative Distribution Function (M(a, b, rho)
   * Implements the Haug 1997 approximation.
   * also adapt from vinegarhill-datalabs C++ code
   * @param {number} a The first upper limit.
   * @param {number} b The second upper limit.
   * @param {number} rho The correlation coefficient.
   * @returns {number} The cumulative bivariate probability.
   */
  // third version of M
function M(a, b,rho)
  {
  
      pi = 3.14159265359;
      if ((a <= 0.0) && (b <= 0.0) && (rho <= 0.0))
      {
          aprime = a / Math.sqrt(2.0 * (1.0 - rho * rho));
          bprime = b / Math.sqrt(2.0 * (1 - rho * rho));
          A=[ 0.3253030, 0.4211071, 0.1334425, 0.006374323 ];
          B=[ 0.1337764, 0.6243247, 1.3425378, 2.2626645 ];
          sum = 0.0;
          for (let i = 0; i < 4; i++)
              for (let j = 0; j < 4; j++)
                  sum = sum + A[i] * A[j] * f(B[i], B[j], aprime, bprime, rho);
          sum = sum * (Math.sqrt(1.0 - rho * rho) / pi);
          return sum;
      }
      else if (a * b * rho <= 0.0)
      {
          if ((a <= 0.0) && (b >= 0.0) && (rho >= 0.0))
              return cdfN(a) - M(a, -1.0 * b, -1.0 * rho);
          else if ((a >= 0.0) && (b <= 0.0) && (rho >= 0.0))
              return cdfN(b) - M(-1.0 * a, b, -1.0 * rho);
          else if ((a >= 0.0) && (b >= 0.0) && (rho <= 0.0))
              return cdfN(a) + cdfN(b) - 1.0 + M(-1 * a, -1 * b, rho);
      }
      else if (a * b * rho >= 0.0)
      {
          denum = Math.sqrt(a*a - 2.0 * rho * a * b + b * b);
          rho1 = ((rho * a - b) * sign(a)) / denum;
          rho2 = ((rho * b - a) * sign(b)) / denum;
          delta = (1.0 - sign(a) * sign(b)) / 4.0;
          return M(a, 0.0, rho1) +
              M(b, 0.0, rho2) - delta;
      }
  } 
  
  
  
  /**
   * Black-Scholes d1 and d2 calculation.
   */
  const calculate_d = (S, K, T, r, b, sigma) => {
      if (T === 0 || sigma === 0) {
          return { d1: 0, d2: 0 };
      }
      const sigma_sqrt_T = sigma * Math.sqrt(T);
      // b is the cost of carry used in the Black-Scholes formula (r-q)
      const d1 = (Math.log(S / K) + (b + (sigma * sigma) / 2) * T) / sigma_sqrt_T;
      const d2 = d1 - sigma_sqrt_T;
      return { d1, d2 };
  };
  
  
  
  
  
  /**
   * Calculates the Perpetual American Option exponent $\beta$.
   */
  const calculateBeta = (r, b, sigma) => {
      if (sigma <0.001) {
          sigma=0.001;
      }
      const sigmaSq = sigma * sigma;
      const B = b / sigmaSq;
      const R = r / sigmaSq;
      const term1 = 0.5 - B;
      const term2 = Math.sqrt(term1 * term1 + 2 * R);
      return term1 + term2;
  };
  
  /**
   * BS 2002 $h$ function used to define boundaries $I_1$ and $I_2$.
   * Checked
   */
  const calculate_h = (K, T_eff, b, sigma, I_inf,r) => {
      //if (I_inf <= K) return 0;
      
      // h_x = -[b*tau_x + 2*sigma*sqrt(tau_x)] * K^2 / ((I_inf - K) * I_inf)
      
      //B_0 in the paper
      const I_0=Math.max(K,r*K/(r-b));
      const timeTerm = b * T_eff + 2 * sigma * Math.sqrt(T_eff);
      const fractionTerm = (K * K) / ((I_inf - I_0) * I_0);
      return -timeTerm * fractionTerm;
  };
  
  /**
   * Black-Scholes price C_BS using a generic strike $K'$.
   */
  const calculateBSPrice = (S, K_prime, T_eff, r, b, sigma) => {
      const { d1, d2 } = calculate_d(S, K_prime, T_eff, r, b, sigma);
      // C_BS = S * exp((b-r)T) * cdfN(d1) - K' * exp(-rT) * cdfN(d2)
      return S * Math.exp((b - r) * T_eff) * cdfN(d1) - K_prime * Math.exp(-r * T_eff) * cdfN(d2);
  };
  
  /**
   * Alpha
   */
   const calculateAlpha = (X,K,beta) => {
  
      return (X-K)*Math.pow(X,-beta);
  };
  
  /**
   * Early exercise bounary, X(T) in paper
   */
   const EX = (T, B_0, B_inf,b,r, sigma,K) => {
    return B_0+(B_inf-B_0)*(1-Math.exp(calculate_h(K, T, b, sigma, B_inf,r) ));
  };
  // --- 1. Internal Definition of the Specialized Phi Function (φ) ---
  // $\varphi(S,T | \gamma, H, X)$
  // This function is defined using the $\lambda$ and $\kappa$ parameters.
  const calculatePhi = (S, T, gamma, H, X_phi, sigma, r, b) => {
    // Check for division by zero or log of non-positive number
    if (sigma === 0 || T <= 0 || S <= 0 || H <= 0 || X_phi <= 0) {
        return 0; 
    }
  
    // Calculate intermediate parameters $\lambda$ and $\kappa$
    const lambda = -r + gamma * b + 0.5 * gamma * (gamma - 1) * sigma * sigma;
    const kappa = (2 * b) / (sigma * sigma) + (2 * gamma - 1);
    const sigmaRootT = sigma * Math.sqrt(T);
  
    // Numerator of the argument d1/d2: $b + (\gamma - \frac{1}{2})\sigma^2$
    const numeratorBase = b + (gamma - 0.5) * sigma * sigma;
  
    // Argument for the first N(d) term
    const d1_arg = -(Math.log(S / H) + numeratorBase * T) / sigmaRootT;
    const N_d1 = cdfN(d1_arg);
  
    // Argument for the second N(d) term
    const d2_arg = -(Math.log((X_phi * X_phi) / (S * H)) + numeratorBase * T) / sigmaRootT;
    const N_d2 = cdfN(d2_arg);
  
    // $e^{\lambda T} S^{\gamma}$
    const factor = Math.exp(lambda * T) * Math.pow(S, gamma);
  
    // $(X/S)^{\kappa}$
    const ratioPower = Math.pow(X_phi / S, kappa);
  
    // The full phi equation
    const phiResult = factor * (N_d1 - ratioPower * N_d2);
  
    return phiResult;
  };
  
  /**
   * Calculates the option price c_bar (c̄) based on the provided complex formula.
   *
   * @param {number} S - Current stock price.
   * @param {number} K - Option strike price.
   * @param {number} T - Time to expiration (in years).
   * @param {number} X - A parameter specific to the underlying model (e.g., jump intensity).
   * @param {function(number): number} alphaFunc - Function that calculates alpha(X).
   * @param {number} betaVal - The value of the model parameter beta (β).
   * @param {function(number, number, number, number, number): number} phiFunc - Specialized function: phi(S, T | p, X_numerator, X_denominator).
   * @returns {number} The calculated option price c_bar.
   */
   function calculateCBar(S, K, T, sigma,r,b) {
      // 1. Calculate constant and power terms
      const B_0=Math.max(K,r*K/(r-b));
      const betaVal = calculateBeta(r,b,sigma);
      beta_1=betaVal-1;
      if(Math.abs(beta_1)<0.0001){beta_1=0.0001;}
      const B_inf=betaVal*K/(beta_1);
      const X = EX(T,B_0,B_inf,b,r,sigma,K);
      if(S>=X){return S-K;}
      const alphaX = calculateAlpha(X,K,betaVal);
      const SToBeta = Math.pow(S, betaVal); // $S^{\beta}$
  
      // 2. Define the inputs for the phi function
      // The phi function in the formula is $\varphi(S;T | p, A, B)$, where 'A' is the
      // argument in the numerator position and 'B' is the argument in the denominator position.
      
      // We map the arguments from the original formula:
      // Original: $\varphi(S;T | p, X_1, X_2)$
      // JS Call: phiFunc(S, T, p, X1, X2)
  
      // 3. Calculate each of the six terms
  
      // Term 1: $\alpha(X)S^{\beta}$
      const term1 = alphaX==0.0 ? 0.0:alphaX * SToBeta;
  
      // Term 2: $-\alpha(X)\varphi(S;T|\beta, X, X)$
      const term2 = alphaX==0.0 ? 0.0:-alphaX * calculatePhi(S, T, betaVal, X, X, sigma, r, b);
  
      // Term 3: $+\varphi(S;T|1, X, X)$
      const term3 = calculatePhi(S, T, 1, X, X, sigma, r, b);
  
      // Term 4: $-\varphi(S;T|1, K, X)$
      // Note: K replaces S in the 'numerator' argument spot here.
      const term4 = -calculatePhi(S, T, 1, K, X, sigma, r, b);
  
      // Term 5: $-K\varphi(S;T|0, X, X)$
      const term5 = -K * calculatePhi(S, T, 0, X, X, sigma, r, b);
  
      // Term 6: $+K\varphi(S;T|0, K, X)$
      // Note: K replaces S in the 'numerator' argument spot here.
      const term6 = K * calculatePhi(S, T, 0, K, X, sigma, r, b);
  
      // 4. Combine all terms
      const cBar = term1 + term2 + term3 + term4 + term5 + term6;
  
      return cBar;
  }
  
  function calculatePBar(S, K, T, sigma,r,b) {
    return calculateCBar(K, S, T, sigma,r-b,-b);
  }
  
  function calculate_d1(S, x, t, sigma, b, gamma) {
      const numerator = Math.log(S / x) + (b + (gamma - 0.5) * sigma * sigma) * t;
      const denominator = sigma * Math.sqrt(t);
      return -numerator / denominator;
  }
  
  function calculate_d2(S, x, t, sigma, b, gamma, X) {
      return calculate_d1(X*X, S*x, t, sigma, b, gamma);
  }
  
  function calculate_d3(S, x, t, sigma, b, gamma) {
      const numerator = Math.log(S / x) - (b + (gamma - 0.5) * sigma * sigma) * t;
      const denominator = sigma * Math.sqrt(t);
      return -numerator / denominator;
  }
  
  
  function calculate_d4(S, x, t, sigma, b, gamma, X) {
      return calculate_d3(X*X, S*x, t, sigma, b, gamma);
  }
  /**
   * Implements the Ψ (Psi) expectation function based on the expansion provided in the image.
   * This function calculates the correlation terms and calls the d_i/D_i functions.
   * M is still a placeholder (bivariate_normal_cdf).
   *
   * Formula Structure (from image):
   * Ψ = exp(λT)S^γ * { M(d1, D1; √t/T) - (X/S)^κ * M(d2, D2; √t/T) }
   * - { (x/S)^γ * M(d3, D3; -√t/T) + (X/x)^κ * M(d4, D4; -√t/T) }
   *
   * @param {number} S Stock price.
   * @param {number} T Time to maturity.
   * @param {number} H Barrier (or early exercise boundary estimate, assumed to be 'x' for D_i terms).
   * @param {number} X Strike price.
   * @param {number} t Current time (or time for first correlation component, often 0).
   * @param {number} gamma_used The gamma value to be used in the d_i/D_i calculations (0 or 1 from c̄).
   * @param {number} lambda Approximation parameter (used in the exponent).
   * @param {number} kappa Approximation parameter (used in the power terms).
   * @param {number} sigma Volatility.
   * @param {number} r Risk-free rate.
   * @param {number} q Dividend yield.
   * @returns {number|null} The calculated Ψ result or null if the M placeholder is hit.
   */
   function calculate_Psi(
      S, T, gamma_used, H, X, x_boundary, t,
      sigma, r, q
  ) {
      const b= r-q;
      const lambda = -r + gamma_used * b + 0.5 * gamma_used * (gamma_used - 1) * sigma * sigma;
      const kappa = (2 * b) / (sigma * sigma) + (2 * gamma_used - 1);
      // Input validation
      if (T <= 0 || sigma <= 0 || S <= 0 || X <= 0 || H <= 0 || t < 0) {
          console.error("Invalid input for Psi calculation (T, sigma, S, X, or H must be positive, t must be non-negative).");
          return null;
      }    
  
      // Calculate d_i terms (using t)
      const d1 = calculate_d1(S, x_boundary, t, sigma, r-q, gamma_used);
      const d2 = calculate_d2(S, x_boundary, t, sigma, r-q, gamma_used, X); 
      const d3 = calculate_d3(S, x_boundary, t, sigma, r-q, gamma_used);
      const d4 = calculate_d4(S, x_boundary, t, sigma, r-q, gamma_used, X);
  
      // Calculate D_i terms (using T and H)
      const D1 = calculate_d1(S, H, T, sigma, r-q, gamma_used);
      const D2 = calculate_d2(S, H, T, sigma, r-q, gamma_used, X); 
      // Note: D3/D4 require 'x' which is mapped to H (the barrier) here
      const D3 = calculate_d2(S, H, T, sigma, r-q, gamma_used,x_boundary);
      const D4 = calculate_d1(S*x_boundary*x_boundary, H*X*X, T, sigma, r-q, gamma_used); 
  
      // Correlation terms (rho)
      // The formulas use √t/T and -√t/T. If t=0, these are 0.
      const rho_t_pos = (T > 0 && t >= 0) ? Math.sqrt(t / T) : 0; 
      const rho_t_neg = -rho_t_pos;
  
      // --- Term A Calculation ---
      // A = { M(d1, D1; √t/T) - (X/S)^κ * M(d2, D2; √t/T) }
      const m1 = M(d1, D1, rho_t_pos);
      const m2 = M(d2, D2, rho_t_pos);
      
      // Check placeholders for M
      if (m1 === null || m2 === null) return null;
  
      const term_A = m1 - Math.pow(X / S, kappa) * m2;
  
      const factor_A = Math.exp(lambda * T) * Math.pow(S, gamma_used); // Use gamma_used for the S^gamma term
  
      // --- Term B Calculation ---
      // B = { (x/S)^γ * M(d3, D3; -√t/T) + (X/x)^κ * M(d4, D4; -√t/T) }
      const m3 = M(d3, D3, rho_t_neg);
      const m4 = M(d4, D4, rho_t_neg);
  
      // Check placeholders for M
      if (m3 === null || m4 === null) return null;
  
      // Use gamma_used for the exponent of (x/S)
      const term_B = -Math.pow(x_boundary / S, kappa) * m3 + Math.pow(x_boundary/X, kappa) * m4;
      
      // --- Final Psi Calculation ---
      // Ψ = (Factor_A * Term_A) - Term_B
      const Psi_result = factor_A * (term_A + term_B);
      
      return Psi_result;
  }
  
  // --- Main Option Valuation Function (c_bar_bar) ---
  
  function calculate_c_bar_bar(S,K,T,sigma, r, q ) {
      const b = r-q;
      const t=0.5*(Math.sqrt(5.0)-1.0)*T;
      const B_0=Math.max(K,r*K/(r-b));
      const beta = calculateBeta(r,b,sigma);
      beta_1=beta-1;
      if(Math.abs(beta_1)<0.0001){beta_1=0.0001;}
      const B_inf=beta*K/(beta_1);
      const X = EX(T,B_0,B_inf,b,r,sigma,K);
      const x = EX(T-t,B_0,B_inf,b,r,sigma,K);
      const aX = calculateAlpha(X,K,beta);
      const ax = calculateAlpha(x,K,beta);
  
      if(S>=X){return S-K;}
      //calculatePhi = (S, T, gamma, H, X_phi, sigma, r, b)
      const term0 =  aX==0.0? 0.0 : aX * Math.pow(S, beta);
      const term1 = aX==0.0? 0.0:-aX * calculatePhi(S, t, beta, X, X, sigma, r, b);
      const term2 = calculatePhi(S, t, 1, X, X, sigma, r, b);
      const term3 = -calculatePhi(S, t, 1, x, X, sigma, r, b);
      const term4 = -K * calculatePhi(S, t, 0, X, X, sigma, r, b);
      const term5 = K * calculatePhi(S, t, 0, x, X, sigma, r, b);
      const term6 = ax==0.0? 0.0 : ax * calculatePhi(S, t, beta, x, X, sigma, r, b);
  
      //calculate_Psi(S, T, gamma_used, H, X, x_boundary, t,lambda, kappa,sigma, r, q)
      const term7 = ax==0.0 ? 0.0 : -ax * calculate_Psi(S, T, beta, x, X, x, t,sigma, r, q);
      const term8 = calculate_Psi(S, T, 1, x, X, x, t,sigma, r, q);
      const term9 = -calculate_Psi(S, T, 1, K, X, x, t,sigma, r, q);
      const term10 = -K*calculate_Psi(S, T, 0, x, X, x, t,sigma, r, q);
      const term11 = K*calculate_Psi(S, T, 0, K, X, x, t,sigma, r, q);
  
      // If any component is a placeholder (returns null), the final result cannot be computed.
      const resultComponents = [term0, term1, term2, term3, term4, term5, term6, term7, term8, term9, term10, term11];
      if (resultComponents.some(c => c === null)) {
          console.error("Option price calculation failed: One or more placeholder functions returned null.");
          return null; // Return null if the calculation cannot be completed.
      }
  
      const c_bar_bar = term0 + term1 + term2 + term3 + term4 + term5 + term6 + term7 + term8 + term9 + term10 + term11;
  
      return c_bar_bar;
  }
  
  function calculate_p_bar_bar(S, K, T, sigma,r,q) {
    return calculate_c_bar_bar(K, S, T, sigma,q,r);
  }
  /**
   * The core Bjerksund-Stensland 2002 Call Option Price.
   */
  const bs2002CallPrice = (S, K, T, s, r, q)=> {    
        if(T<0.000001){T=0.000001;}
        if(s<0.03){s=0.03;}
        if(S<0.000001){S=0.000001;}
        if(K<0.000001){K=0.000001;}
        if(r>1.0){r=1.0;}
        if(q>1.0){q=1.0;}
        if(r<-1.0){r=-1.0;}
        if(q<-1.0){q=-1.0;}
        //BS's approximation doesn't allow q=0
        if(q<0.01 && q>=0.0){
        q=0.01;}
        if(q>-0.01 && q<0.0){
        q=-0.01;}
      price=2*calculate_c_bar_bar(S, K, T, s, r, q)-calculateCBar(S,K,T,s,r,r-q);
      price=Math.max(price,0);
      return price;
  };
  
  /**
   * Prices the American Put using the Put-Call Transformation (P(S, K, r, q) = C(K, S, q, r)).
   */
  const bs2002PutPrice = (S, K, T, s, r, q) => {
    if(T<0.000001){T=0.000001;}
    if(s<0.03){s=0.03;}
    if(S<0.000001){S=0.000001;}
    if(K<0.000001){K=0.000001;}
    if(r>1.0){r=1.0;}
    if(q>1.0){q=1.0;}
    if(r<-1.0){r=-1.0;}
    if(q<-1.0){q=-1.0;}
    //BS's approximation doesn't allow q=0 r=0
    if(r<0.01 && r>=0.0){
        r=0.01;}
    if(r>-0.01 && r<0.0){
        r=-0.01;}
    if(q<0.01 && q>=0.0){
      q=0.01;}
    if(q>-0.01 && q<0.0){
      q=-0.01;}
      price=2*calculate_p_bar_bar(S, K, T, s, r, q)-calculatePBar(S,K,T,s,r,r-q);
      price=Math.max(price,0);
      return price;
  };