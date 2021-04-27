const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const cors = require('cors')
const dotenv = require('dotenv')

const driver = require('./neo4j_driver.js')

var app_port = process.env.APP_PORT || 80

var app = express()
var http_server = http.Server(app)

// Express configuration
app.use(bodyParser.json())
app.use(cors())

console.log(`Neo4J search engine`)

// slightly dangerous
const nodes_filter = process.env.NODES
  ?.split(',')
  .map(node => `node:${node}`)
  .join(' OR ')

const properties = process.env.PROPERTIES?.split(',') || []

app.get('/', (req, res) => {
  res.send({
    application_name: 'Neo4J search engine',
    author: 'Maxime MOREILLON',
    neo4j_url: process.env.NEO4J_URL || 'undefined',
    nodes: process.env.NODES || 'Undefined',
    properties: properties,
  })
})

app.get('/nodes', (req, res) => {

  const {query} = req.query
  if(!query) return res.status(400).send("No query")

  console.log(`[Neo4J] Searching for ${query}`)

  // Neo4J init
  const session = driver.session();
  session.run(`
    // Match all nodes
    MATCH (node)

    // Filter node labels
    WHERE ${nodes_filter}

    // Make a list of the keys of each node
    // Additionally, filter out fields that should not be searched
    WITH [key IN KEYS(node) WHERE key IN $properties] AS keys, node

    // Unwinding
    UNWIND keys as key

    // Filter nodes by looking for properties
    WITH key, node
    WHERE toLower(toString(node[key])) CONTAINS toLower({query})

    RETURN DISTINCT node
    LIMIT 200
    `,{
      query,
      properties,
    })
  .then( ({records}) => {
    console.log(`[Neo4J] Found ${records.length} matching nodes`)
    res.send(records.map(record => record.get('node')))
   })
  .catch(error => {
    console.log(error)
    res.status(400).send(error)
   })
  .finally( () => { session.close() })

});


app.get('/nodes/:node_id/related_nodes', function(req, res) {

  const {node_id} = req.params

  if(!node_id) return res.status(400).send(`node_id not specified`)

  const session = driver.session()

  const statement = `
    MATCH (a)-[relationship]-(node)

    // Filters
    WHERE ID(a) = toInteger($node_id)
      AND (${nodes_filter})

    RETURN a, relationship, node
    LIMIT 200
    `;

  const parameters = {node_id}

  session.run(statement,parameters)
  .then( ({records}) => {
    console.log(`[Neo4J] Queried nodes related to node ${node_id}`)
    const related_nodes = records.map(record => {
      return {
        ...record.get('node'),
        relationship: record.get('relationship')
      }
    })
    res.send(related_nodes)
   })
  .catch(error => {
    console.log(error)
    res.status(500).send(error)
  })
  .finally(() => {session.close()})


});


// Start server
http_server.listen(app_port, () => { console.log(`[Express] Listening on *:${app_port}`) })
