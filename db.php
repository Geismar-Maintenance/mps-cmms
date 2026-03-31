<?php
// Neon Connection String
$host = "ep-restless-art-aejfppri-pooler.c-2.us-east-2.aws.neon.tech";
$port = "5432";
$dbname = "neondb";
$user = "neondb_owner";
$password = "npg_ncgay0x2DYkA";

$conn_string = "host=$host port=$port dbname=$dbname user=$user password=$password sslmode=require";
$dbconn = pg_connect($conn_string);

if(!$dbconn) {
    die("Error : Unable to open database\n");
}
?>