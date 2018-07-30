const express = require('express');
const expressGraphQL =require('express-graphql');
var cors = require('cors');

// module imports
const schema = require('./schema/schema');

const app = express();
app.use(cors());

app.use('/graphql' , expressGraphQL({
  schema,
  graphiql:true
}));

app.listen(4000, ()=>{
  console.log('server started at localhost:4000');
});