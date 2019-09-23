const neo4j = require('neo4j-driver').v1;
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const cors = require('cors')


var app_port = 8086;

var app = express();
var http_server = http.Server(app);

// Express configuration
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors({
  origin: [
    'http://172.16.98.151:8083',
    'http://172.16.98.151',
    'http://mike.jtekt',
    'http://mike.jtekt:8083',
  ],
  credentials: true,
}));

// Neo4J config
const neo4j_config = {
  uri: "bolt://172.16.98.151:7687",
  username: "neo4j",
  password: "poketenashi"
}


app.post('/search', function(req, res) {

  if('query' in req.body){

    // Neo4J init
    const driver = neo4j.driver(neo4j_config.uri, neo4j.auth.basic(neo4j_config.username, neo4j_config.password));
    const session = driver.session();

    var statement = `
      MATCH (a)

      // Can't rmemeber why two times WITH DISTINCT
      WITH DISTINCT keys(a) AS k
      UNWIND k AS b
      WITH DISTINCT b AS distinct_keys
      WHERE NOT distinct_keys="password_hashed"

      MATCH (n)
      WHERE toLower(toString(n[distinct_keys])) CONTAINS toLower($query_string)
      RETURN DISTINCT n
      LIMIT 200
      `;

    var parameters = {query_string: req.body.query}

    const resultPromise = session.run(statement,parameters);

    resultPromise.then(result => {
      session.close();
      driver.close();
      res.send(result.records);
    });
  }
  else {
    res.status(400).send("No query");
  }
});

app.post('/find_related_nodes', function(req, res) {

  if('id' in req.body){
    // Neo4J init
    const driver = neo4j.driver(neo4j_config.uri, neo4j.auth.basic(neo4j_config.username, neo4j_config.password));
    const session = driver.session();

    var statement = `
      MATCH (a)-[r]-(b)
      WHERE ID(a) = toInt($query)
      RETURN a, r, b
      LIMIT 200
      `;

    var parameters = {query: req.body.id}

    const resultPromise = session.run(statement,parameters);

    resultPromise.then(result => {
      session.close();
      driver.close();
      res.send(result.records);
    });
  }
  else {
    res.status(400).send("no id")
  }



});


// Start server
http_server.listen(app_port, function(){
  console.log(`listening on *:${app_port}`);
});
