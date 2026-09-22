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

  function injectSoftwareApplicationSchema() {
    var title = normalizeWhitespace(document.title) || findHeadingText() || "QuantCalc Calculator";
    var canonicalNode;
    var script;
    var schema;

    if (document.getElementById("quantcalc-softwareapplication-schema")) {
      return;
    }

    canonicalNode = findCanonicalLink();
    schema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": title,
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Any",
      "url": canonicalNode && canonicalNode.href ? canonicalNode.href : currentPageUrl(),
      "description": buildDescription(title),
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    };

    script = document.createElement("script");
    script.id = "quantcalc-softwareapplication-schema";
    script.type = "application/ld+json";
    script.text = JSON.stringify(schema);
    document.getElementsByTagName("head")[0].appendChild(script);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectSoftwareApplicationSchema);
  } else {
    injectSoftwareApplicationSchema();
  }
}());
