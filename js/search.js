(function () {
  var CONCEPTS = [
    { name: "analytic", aliases: ["analytic", "closed form", "formula", "black scholes", "black 76", "baw", "bs2002"] },
    { name: "tree", aliases: ["tree", "binomial", "trinomial", "lattice", "combinatorial"] },
    { name: "fft", aliases: ["fft", "fourier"] },
    { name: "pde", aliases: ["pde", "finite difference", "crank nicolson", "numerical"] },
    { name: "monte-carlo", aliases: ["monte carlo", "simulation", "simulated"] },
    { name: "qmc", aliases: ["qmc", "quasi monte carlo", "halton"] },
    { name: "mlmc", aliases: ["mlmc", "multilevel monte carlo"] },
    { name: "calibration", aliases: ["calibration", "calibrate", "garch", "ngarch", "cusum"] },
    { name: "risk", aliases: ["risk", "counterparty", "exposure", "pfe", "ee", "basel"] },
    { name: "credit", aliases: ["credit", "cds", "hazard", "default"] },
    { name: "rates", aliases: ["interest rate", "rate", "rates", "bond", "swap", "swaption", "caplet", "coupon", "hull white", "bdt"] },
    { name: "volatility", aliases: ["volatility", "vol", "greeks", "skew", "garch"] },
    { name: "vanilla", aliases: ["vanilla", "plain"] },
    { name: "american", aliases: ["american", "early exercise"] },
    { name: "asian", aliases: ["asian", "average"] },
    { name: "barrier", aliases: ["barrier", "knock out", "knockout", "up and out", "down and out"] },
    { name: "bermudan", aliases: ["bermudan"] },
    { name: "lookback", aliases: ["lookback"] },
    { name: "rainbow", aliases: ["rainbow", "basket", "minimum"] },
    { name: "exchange", aliases: ["exchange", "margrabe"] },
    { name: "compound", aliases: ["compound"] },
    { name: "autocallable", aliases: ["autocallable", "structured note"] },
    { name: "jump", aliases: ["jump", "jump diffusion", "merton", "double exponential", "nig", "normal inverse gaussian"] }
  ];

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^\s+|\s+$/g, "");
  }

  function unique(items) {
    var seen = {};
    var result = [];
    var i;

    for (i = 0; i < items.length; i += 1) {
      if (!items[i] || seen[items[i]]) {
        continue;
      }
      seen[items[i]] = true;
      result.push(items[i]);
    }

    return result;
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function splitTokens(query) {
    var tokens = normalize(query).split(" ");
    var filtered = [];
    var i;

    for (i = 0; i < tokens.length; i += 1) {
      if (tokens[i].length > 1) {
        filtered.push(tokens[i]);
      }
    }

    return unique(filtered);
  }

  function collectConcepts(text) {
    var haystack = " " + normalize(text) + " ";
    var matches = [];
    var i;
    var j;
    var alias;

    for (i = 0; i < CONCEPTS.length; i += 1) {
      for (j = 0; j < CONCEPTS[i].aliases.length; j += 1) {
        alias = " " + normalize(CONCEPTS[i].aliases[j]) + " ";
        if (alias !== "  " && haystack.indexOf(alias) !== -1) {
          matches.push(CONCEPTS[i].name);
          break;
        }
      }
    }

    return unique(matches);
  }

  function prepareIndex(data) {
    var prepared = [];
    var i;
    var item;
    var text;

    for (i = 0; i < data.length; i += 1) {
      item = data[i];
      text = [
        item.title,
        item.summary,
        item.section,
        item.url,
        (item.keywords || []).join(" ")
      ].join(" ");

      prepared.push({
        url: item.url,
        title: item.title,
        section: item.section || "",
        summary: item.summary || "",
        keywords: item.keywords || [],
        text: text,
        textNorm: normalize(text),
        titleNorm: normalize(item.title),
        summaryNorm: normalize(item.summary),
        tokens: splitTokens(text),
        titleTokens: splitTokens(item.title),
        concepts: collectConcepts(text)
      });
    }

    return prepared;
  }

  function scorePage(page, query, queryTokens, queryConcepts) {
    var phrase = normalize(query);
    var score = 0;
    var tokenMatches = 0;
    var vectorMatches = [];
    var i;

    if (phrase && page.titleNorm.indexOf(phrase) !== -1) {
      score += 20;
    }
    if (phrase && page.summaryNorm.indexOf(phrase) !== -1) {
      score += 14;
    }
    if (phrase && page.textNorm.indexOf(phrase) !== -1) {
      score += 8;
    }

    for (i = 0; i < queryTokens.length; i += 1) {
      if (page.titleTokens.indexOf(queryTokens[i]) !== -1) {
        score += 6;
        tokenMatches += 1;
      } else if (page.tokens.indexOf(queryTokens[i]) !== -1) {
        score += 3;
        tokenMatches += 1;
      }
    }

    for (i = 0; i < queryConcepts.length; i += 1) {
      if (page.concepts.indexOf(queryConcepts[i]) !== -1) {
        score += 7;
        vectorMatches.push(queryConcepts[i]);
      }
    }

    if (queryTokens.length && tokenMatches === queryTokens.length) {
      score += 4;
    }
    if (vectorMatches.length && tokenMatches) {
      score += 3;
    }

    return {
      score: score,
      vectorMatches: vectorMatches
    };
  }

  function renderTags(tags, className) {
    var i;
    var parts = [];

    for (i = 0; i < tags.length; i += 1) {
      parts.push('<span class="' + className + '">' + escapeHtml(tags[i]) + "</span>");
    }

    return parts.join("");
  }

  function renderResult(result) {
    var meta = [];

    if (result.section) {
      meta.push('<span class="search-section">' + escapeHtml(result.section) + "</span>");
    }
    meta.push(renderTags(result.keywords.slice(0, 3), "search-keyword"));
    if (result.vectorMatches.length) {
      meta.push(renderTags(result.vectorMatches, "search-concept"));
    }

    return (
      '<article class="search-result">' +
        '<h3><a href="' + escapeHtml(result.url) + '">' + escapeHtml(result.title) + "</a></h3>" +
        (result.summary ? "<p>" + escapeHtml(result.summary) + "</p>" : "") +
        '<div class="search-meta">' + meta.join("") + "</div>" +
      "</article>"
    );
  }

  function renderSuggestions() {
    return [
      "american option",
      "asian option",
      "swaption",
      "credit risk",
      "mlmc",
      "calibration"
    ].map(function (suggestion) {
      return '<a class="search-suggestion" href="search.html?q=' + encodeURIComponent(suggestion) + '">' + escapeHtml(suggestion) + "</a>";
    }).join("");
  }

  function safeDecode(value) {
    try {
      return decodeURIComponent(value.replace(/\+/g, " "));
    } catch (error) {
      return "";
    }
  }

  function readQueryParameter() {
    var match = window.location.search.match(/[?&]q=([^&]+)/);
    return match ? safeDecode(match[1]) : "";
  }

  function initSearchPage() {
    var form = document.getElementById("quantcalc-search-page-form");
    var input = document.getElementById("quantcalc-search-page-input");
    var status = document.getElementById("quantcalc-search-status");
    var resultsNode = document.getElementById("quantcalc-search-results");
    var index = prepareIndex(window.quantcalcSearchIndex || []);

    if (!form || !input || !status || !resultsNode) {
      return;
    }

    function update(query) {
      var queryTokens = splitTokens(query);
      var queryConcepts = collectConcepts(query);
      var results = [];
      var scored;
      var i;

      input.value = query;

      if (!normalize(query)) {
        status.innerHTML = "Search the site by product, method, or intent.";
        resultsNode.innerHTML = '<div class="search-empty">' +
          "<p>Try exact text like <strong>swaption</strong> or broader intent like <strong>interest rate calibration</strong>.</p>" +
          '<div class="search-suggestions">' + renderSuggestions() + "</div>" +
        "</div>";
        return;
      }

      for (i = 0; i < index.length; i += 1) {
        scored = scorePage(index[i], query, queryTokens, queryConcepts);
        if (scored.score > 0) {
          results.push({
            url: index[i].url,
            title: index[i].title,
            section: index[i].section,
            summary: index[i].summary,
            keywords: index[i].keywords,
            vectorMatches: scored.vectorMatches,
            score: scored.score
          });
        }
      }

      results.sort(function (left, right) {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        if (left.title === right.title) {
          return 0;
        }
        return left.title < right.title ? -1 : 1;
      });

      status.innerHTML = "Found " + results.length + ' result' + (results.length === 1 ? "" : "s") + ' for <strong>' + escapeHtml(query) + "</strong>.";

      if (!results.length) {
        resultsNode.innerHTML = '<div class="search-empty">' +
          "<p>No direct matches yet. Try a different product name, pricing method, or risk term.</p>" +
          '<div class="search-suggestions">' + renderSuggestions() + "</div>" +
        "</div>";
        return;
      }

      resultsNode.innerHTML = results.slice(0, 24).map(renderResult).join("");
    }

    form.addEventListener("submit", function (event) {
      var query = input.value.replace(/^\s+|\s+$/g, "");
      event.preventDefault();
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", "search.html" + (query ? "?q=" + encodeURIComponent(query) : ""));
      }
      update(query);
    });

    update(readQueryParameter());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSearchPage);
  } else {
    initSearchPage();
  }
}());
