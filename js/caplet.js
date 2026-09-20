// JavaScript Document




	function Calculate()
	{
	var Principal=eval(document.isForm.isPrincipal.value);
	var Tk=eval(document.isForm.isTk.value);
	var Tk_1=eval(document.isForm.isTk_1.value);
	var DiscFactor=eval(document.isForm.isDiscFactor.value);
	var Forward=eval(document.isForm.isForward.value);
	var Strike=eval(document.isForm.isStrike.value);
	var Vol=eval(document.isForm.isVol.value);
	var ComPeriod=Tk_1-Tk;
	var D1=(Math.log(Forward/Strike)+Vol*Vol*Tk*0.5)/(Vol*Math.sqrt(Tk));;
	var D2=D1-Vol*Math.sqrt(Tk);;


    document.isForm.isCapletPrice.value=Principal*ComPeriod*DiscFactor*(Forward*NormalCDF(D1)-Strike*NormalCDF(D2));  
   
	}
 	function Reset()
        {
                document.isForm.isPrincipal.value="1000000";
                document.isForm.isTk.value="1";
                document.isForm.isTk_1.value="2";
                document.isForm.isDiscFactor.value="0.9";
                document.isForm.isForward.value="0.08";
                document.isForm.isStrike.value="0.07";
                document.isForm.isVol.value="0.2";

        }
       	function NormalCDF(x)
        {
		var L;
        var K;
        var w;
		/* absolute error  < 7.5e-8 */   
	    var a1 = 0.31938153; 
        var a2 = -0.356563782;
        var a3 = 1.781477937;
		var a4 = -1.821255978;
        var a5 = 1.330274429;
		L = Math.abs(x);
		K = 1.0 / (1.0 + 0.2316419 * L);
		w = 1.0 - 1.0 / Math.sqrt(2 * Math.PI) * Math.exp(-L *L / 2) * (K*(a1 + K *(a2 +K*( a3 +K*(a4+a5*K)))));
		if (x < 0 )
		{     
			  w= 1.0 - w;
		}   
		return (w);
        }

(function () {
  function safeDecode(value) {
    try {
      return decodeURIComponent(value.replace(/\+/g, " "));
    } catch (error) {
      return "";
    }
  }

  function injectSearchStyles() {
    if (document.getElementById("quantcalc-search-styles")) {
      return;
    }

    var style = document.createElement("style");
    style.id = "quantcalc-search-styles";
    style.type = "text/css";
    style.appendChild(document.createTextNode(
      ".searchform{margin-bottom:20px;}" +
      ".quantcalc-search-widget{display:flex;gap:8px;align-items:center;background:#ffffff;border:1px solid #dbe3f0;border-radius:10px;padding:10px;box-shadow:0 4px 14px rgba(0,0,0,0.05);}" +
      ".quantcalc-search-input{flex:1;min-width:0;padding:10px 12px;border:1px solid #c8d4e3;border-radius:8px;font:normal 14px/1.4 Arial,Helvetica,sans-serif;color:#1f2937;}" +
      ".quantcalc-search-input:focus{outline:none;border-color:#39a0ed;box-shadow:0 0 0 3px rgba(57,160,237,0.15);}" +
      ".quantcalc-search-button{padding:10px 14px;border:none;border-radius:8px;background:#39a0ed;color:#fff;font:600 14px/1 Arial,Helvetica,sans-serif;cursor:pointer;}" +
      ".quantcalc-search-button:hover{background:#2287d4;}" +
      ".quantcalc-search-hint{margin-top:8px;font:normal 12px/1.4 Arial,Helvetica,sans-serif;color:#5b6575;}" +
      ".quantcalc-search-hint a{color:#2287d4;text-decoration:none;}" +
      ".quantcalc-search-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}"
    ));
    document.getElementsByTagName("head")[0].appendChild(style);
  }

  function currentQuery() {
    var match = window.location.search.match(/[?&]q=([^&]+)/);
    return match ? safeDecode(match[1]) : "";
  }

  function injectSearchForm() {
    var containers = document.getElementsByClassName("searchform");
    var i;
    var value = currentQuery()
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    if (!containers.length) {
      return;
    }

    injectSearchStyles();

    for (i = 0; i < containers.length; i += 1) {
      if (containers[i].getAttribute("data-search-ready") === "true") {
        continue;
      }

      containers[i].innerHTML =
        '<form class="quantcalc-search-widget" action="search.html" method="get">' +
          '<label class="quantcalc-search-sr-only" for="quantcalc-search-input-' + i + '">Search QuantCalc</label>' +
          '<input id="quantcalc-search-input-' + i + '" class="quantcalc-search-input" type="search" name="q" value="' + value + '" placeholder="Search calculators, models, or methods" aria-label="Search QuantCalc" />' +
          '<button class="quantcalc-search-button" type="submit">Search</button>' +
        "</form>" +
        '<div class="quantcalc-search-hint"><a href="search.html">Browse all search results</a></div>';
      containers[i].setAttribute("data-search-ready", "true");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectSearchForm);
  } else {
    injectSearchForm();
  }
}());
