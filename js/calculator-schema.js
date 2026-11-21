(function () {
  function normalizeWhitespace(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function findCanonicalLink() {
    return document.querySelector('link[rel="canonical"]');
  }

  function findMetaDescription() {
    var meta = document.querySelector('meta[name="description"]');
    return meta && meta.content ? normalizeWhitespace(meta.content) : "";
  }

  function findHeadingText() {
    var heading = document.querySelector("h1");
    return heading ? normalizeWhitespace(heading.textContent) : "";
  }

  function findSummaryText() {
    var articleParagraphs = document.querySelectorAll(".article p");
    var i;
    var text;

    for (i = 0; i < articleParagraphs.length; i += 1) {
      text = normalizeWhitespace(articleParagraphs[i].textContent);
      if (text) {
        return text;
      }
    }

    return "";
  }

  function buildDescription(title) {
    return findMetaDescription() || findSummaryText() || ((title || "QuantCalc calculator") + " with interactive mathematical computations.");
  }

  function currentPageUrl() {
    return window.location.protocol + "//" + window.location.host + window.location.pathname;
  }

  function findHeadElement() {
    return document.head || document.getElementsByTagName("head")[0] || null;
  }

  var SITE = "https://www.quantcalc.net/";
  var HUB_PAGES = ["pricing.html", "calibration.html", "risk.html", "Stock.html", "InterestRate.html", "Credit.html", "MonteCarlo.html", "Tree.html", "NPDE.html", "FFT.html", "AnalyticSolution.html", "paper.html", "about.html", "contact.html", "FAQ.html", "hedging.html", "arbi.html", "search.html", "index.html"];
  var ARTICLE_PAGES = ["MLMC.html", "DuanGARCH.html", "CUSUM.html"];
  var PARENTS = {"MLMC_pricer_lookback.html":["Stock Options","Stock.html"],"MLMC_pricer.html":["Stock Options","Stock.html"],"QMC.html":["Stock Options","Stock.html"],"BS_American.html":["Stock Options","Stock.html"],"barone-adesi-whaley-american-option-pricer.html":["Stock Options","Stock.html"],"BermudanFFTjd.html":["Stock Options","Stock.html"],"AsianFFTnig.html":["Stock Options","Stock.html"],"AsianFFTde.html":["Stock Options","Stock.html"],"AsianFFTjd.html":["Stock Options","Stock.html"],"DiscreteBarrierTriTree.html":["Stock Options","Stock.html"],"DiscreteBarrierMC.html":["Stock Options","Stock.html"],"CVTreeAmericanPut.html":["Stock Options","Stock.html"],"LinearTimeTreeVanillaPut.html":["Stock Options","Stock.html"],"TreeVanillaPut.html":["Stock Options","Stock.html"],"BarrierFFT.html":["Stock Options","Stock.html"],"BermudanFFT.html":["Stock Options","Stock.html"],"ImpliedVolatility.html":["Stock Options","Stock.html"],"ExchangeQMC.html":["Stock Options","Stock.html"],"CompoundFFT.html":["Stock Options","Stock.html"],"RainbowQMC.html":["Stock Options","Stock.html"],"FFTAsian.html":["Stock Options","Stock.html"],"DGA.html":["Stock Options","Stock.html"],"BarrierCN.html":["Stock Options","Stock.html"],"black-scholes-calculator.html":["Stock Options","Stock.html"],"MC_asian.html":["Stock Options","Stock.html"],"MC_lookback.html":["Stock Options","Stock.html"],"BDTBond.html":["Interest Rate Derivatives","InterestRate.html"],"BDTSwaption.html":["Interest Rate Derivatives","InterestRate.html"],"BDTCali.html":["Interest Rate Derivatives","InterestRate.html"],"BS76Caplet.html":["Interest Rate Derivatives","InterestRate.html"],"HullWhiteZCB.html":["Interest Rate Derivatives","InterestRate.html"],"HullWhiteZBC.html":["Interest Rate Derivatives","InterestRate.html"],"HullWhiteRS.html":["Interest Rate Derivatives","InterestRate.html"],"BK_ZCB.html":["Interest Rate Derivatives","InterestRate.html"],"CDS_FromHazard.html":["Credit Derivatives","Credit.html"],"EEandPFENormal.html":["Credit Derivatives","Credit.html"],"EEandPFEforSwap.html":["Credit Derivatives","Credit.html"],"CDS.html":["Credit Derivatives","Credit.html"],"DefaultProbability.html":["Credit Derivatives","Credit.html"],"GARCH.html":["Calibration","calibration.html"],"DuanGARCH.html":["Calibration","calibration.html"],"SSR.html":["Calibration","calibration.html"],"hedging.html":["Risk Management","risk.html"]};
  var CATEGORY_PARENTS = {"Stock.html":["Pricing","pricing.html"],"InterestRate.html":["Pricing","pricing.html"],"Credit.html":["Pricing","pricing.html"],"MonteCarlo.html":["Pricing","pricing.html"],"Tree.html":["Pricing","pricing.html"],"NPDE.html":["Pricing","pricing.html"],"FFT.html":["Pricing","pricing.html"],"AnalyticSolution.html":["Pricing","pricing.html"]};

  function currentPageName() {
    var parts = window.location.pathname.split("/");
    return parts[parts.length - 1] || "index.html";
  }

  function appendJsonLd(id, schema) {
    var head = findHeadElement();
    var script;

    if (!head || document.getElementById(id)) {
      return;
    }

    script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    script.text = JSON.stringify(schema);
    head.appendChild(script);
  }

  function canonicalUrl() {
    var node = findCanonicalLink();
    return node && node.href ? node.href : currentPageUrl();
  }

  function pageTitle() {
    return findHeadingText() || normalizeWhitespace(document.title) || "QuantCalc";
  }

  function injectBreadcrumbSchema() {
    var page = currentPageName();
    var trail = [["Home", SITE]];
    var parent = PARENTS[page] || CATEGORY_PARENTS[page];
    var grandparent;

    if (page === "index.html") {
      return;
    }

    if (PARENTS[page]) {
      grandparent = ["Pricing", "pricing.html"];
      if (parent[1] === "calibration.html" || parent[1] === "risk.html") {
        grandparent = null;
      }
      if (grandparent) {
        trail.push([grandparent[0], SITE + grandparent[1]]);
      }
    }
    if (parent) {
      trail.push([parent[0], SITE + parent[1]]);
    }
    trail.push([pageTitle(), canonicalUrl()]);

    appendJsonLd("quantcalc-breadcrumb-schema", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": trail.map(function (item, index) {
        return {"@type": "ListItem", "position": index + 1, "name": item[0], "item": item[1]};
      })
    });
  }

  function injectPageSchema() {
    var title = normalizeWhitespace(document.title) || findHeadingText() || "QuantCalc Calculator";
    var page = currentPageName();
    var url = canonicalUrl();

    if (HUB_PAGES.indexOf(page) !== -1) {
      return;
    }

    if (ARTICLE_PAGES.indexOf(page) !== -1) {
      appendJsonLd("quantcalc-article-schema", {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": pageTitle(),
        "description": buildDescription(title),
        "mainEntityOfPage": url,
        "author": {"@type": "Person", "name": "Gary Pai"},
        "publisher": {"@type": "Organization", "name": "QuantCalc", "url": SITE}
      });
      return;
    }

    appendJsonLd("quantcalc-softwareapplication-schema", {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": title,
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Any",
      "url": url,
      "description": buildDescription(title),
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    });
  }

  function injectSchemas() {
    injectPageSchema();
    injectBreadcrumbSchema();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectSchemas);
  } else {
    injectSchemas();
  }
}());
