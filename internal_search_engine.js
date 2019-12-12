const neo4j = require('neo4j-driver').v1;
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const cors = require('cors')
const history = require('connect-history-api-fallback');

// Custom modules
const credentials = require('../common/credentials');
const misc = require('../common/misc');

var app_port = 8086;

var app = express();
var http_server = http.Server(app);

// Express configuration
app.use(bodyParser.json());
app.use(history());
app.use(express.static(path.join(__dirname, 'dist')));
app.use(cors({
  origin: misc.cors_origins,
  credentials: true,
}));

// Neo4J config
var driver = neo4j.driver(
  'bolt://localhost',
  neo4j.auth.basic(credentials.neo4j.username, credentials.neo4j.password)
)



app.post('/search', function(req, res) {

  if('query' in req.body){

    // Neo4J init
    const session = driver.session();

    const resultPromise = session.run(`
      // Match all nodes
      MATCH (n)

      // Make a list of the keys of each node
      // Additionally, filter out fields that should not be searched
      WITH [key IN KEYS(n) WHERE NOT key IN {exceptions}] AS keys, n

      // Unwinding
      UNWIND keys as key


      // Filter nodes by looking for properties
      WITH key, n
      WHERE toLower(toString(n[key])) CONTAINS toLower({query})

      RETURN DISTINCT n
      LIMIT 200
      `,{
        query: req.body.query,
        exceptions: [
          'password_hashed'
        ]
      });

    resultPromise.then(result => {
      session.close();
      res.send(result.records);
    });
  }
  else {
    res.status(400).send("No query");
  }
});



app.post('/search_legacy', function(req, res) {

  if('query' in req.body){

    // Neo4J init
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
