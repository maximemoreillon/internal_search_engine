const neo4j = require('neo4j-driver').v1;
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');


var app_port = 8086;

var app = express();
var http_server = http.Server(app);

// Express configuration
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));


// Neo4J config
const neo4j_config = {
  uri: "bolt://172.16.98.151:7687",
  username: "neo4j",
  password: "poketenashi"
}





app.get('/', function(req, res) {
  res.render('index');
});

app.get('/search', function(req, res) {

  if(req.query.query){
    // Neo4J init
    const driver = neo4j.driver(neo4j_config.uri, neo4j.auth.basic(neo4j_config.username, neo4j_config.password));
    const session = driver.session();

    var statement = `
      MATCH (a)
      WITH DISTINCT keys(a) AS k
      UNWIND k AS b
      WITH DISTINCT b AS distinct_keys
      MATCH (n)
      WHERE toLower(n[distinct_keys]) CONTAINS toLower($query_string)
      RETURN DISTINCT n
      LIMIT 200
      `;

    var parameters = {query_string: req.query.query}

    const resultPromise = session.run(statement,parameters);

    resultPromise.then(result => {
      session.close();
      res.render('search_result',{records: result.records, query: req.query.query});
      driver.close();
    });
  }
  else {
    res.render('search_result',{records: []});
  }
});


app.get('/show_relationships', function(req, res) {


  // Neo4J init
  const driver = neo4j.driver(neo4j_config.uri, neo4j.auth.basic(neo4j_config.username, neo4j_config.password));
  const session = driver.session();

  var statement = `
    MATCH (a)-[r]-(b)
    WHERE ID(a) = toInt($query)
    RETURN a, r, b
    LIMIT 200
    `;

  var parameters = {query: req.query.id}

  const resultPromise = session.run(statement,parameters);

  resultPromise.then(result => {
    session.close();
    res.render('show_relationships',{records: result.records, query: req.query.id});
    driver.close();
  });
});

// Start server
http_server.listen(app_port, function(){
  console.log(`listening on *:${app_port}`);
});
