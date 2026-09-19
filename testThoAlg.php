<html>

<head>  <!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-N0YL0FX070"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-N0YL0FX070');
</script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1337506067911632"
  crossorigin="anonymous"></script>

<title></title>

</head>

<body>
<?
include "ClassSpline.php";
      $n=3;
      $a=array(0,1,1,0);
      $b=array(2,2,2,0);
      $c=array(1,1,0,0);
      $v=array(0,1,2,3);
      $x=array(8,8,8,8);
      $S=new Spline;
      $x=$S->ThomasAlgSolveMatrix($n, $a, $b, $c, $v);
      $x[0]=$b[1]
      +$b[2];
      echo $x[0]."<br>";
      echo $x[1]."<br>";
      echo $x[2]."<br>";
      
?>
</body>

</html>
