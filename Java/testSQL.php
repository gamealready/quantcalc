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

  $Host = "mysql5.000webhost.com"; 
  $User = "a7582719_pai"; 
  $Pass = "yllatisthe1"; 
  $Database = "a7582719_yllat"; 
  if(!($DBLinkID = mysql_connect($Host, $User, $Pass))) { 
    echo "�L�kMySQL�s����Ʈw�I"; 
    exit(); 
  } 
   
$db_selected = mysql_select_db($Database, $DBLinkID); 

//mysql_query("CREATE TABLE t1(id INT NOT NULL AUTO_INCREMENT, 
//PRIMARY KEY(id),name VARCHAR(8))", $DBLinkID)or die(mysql_error()); 
mysql_query("insert into t1 values(6,'ivan')", $DBLinkID);
$data=mysql_query ("select * from t1", $DBLinkID);
$a=mysql_fetch_array($data);
echo $a[0];
mysql_close($DBLinkID);

?>
</body>

</html>
