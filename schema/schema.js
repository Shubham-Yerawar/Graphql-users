// schema is what tells GraphQL exactly what our data looks like.

const graphql = require('graphql');
const _ = require('lodash');
const axios = require('axios');

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull
} = graphql;


// some hardcoded data here 
// const users = [
//   { id: "23", firstName: "Bill", age: 20 },
//   { id: "34", firstName: "John", age: 17 }
// ];

//NOTE: order of declaring type is important here.

// To overcome the problem of circular dependency (classic JS problem),
// GraphQL devs have made use of JS closures to make a work around.


/**
 * Schema
 * 1. defines the shape of your data
 * 2. relationship between the data
 */

const CompanyType = new GraphQLObjectType({
  name: 'Company',
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    users: {
      type: new GraphQLList(UserType),
      resolve(parentValue, args) {
        // console.log('parentValue:', parentValue);
        const url = `http://localhost:3000/companies/${parentValue.id}/users`;
        let result = axios.get(url).then(response => response.data);
        return result;
      }
    }
  })
});

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt },
    company: {
      type: CompanyType,
      resolve(parentValue, args) {
        // console.log('parentValue:', parentValue);
        // console.log('args:', args);
        const url = `http://localhost:3000/companies/${parentValue.companyId}`;
        // let result = axios.get(url).then(response => response.data);
        const result = axios.get(url).then(response => {
          // console.log('result', response.data);
          return response.data;
        });
        return result;
      }
    }
  })
});


// entry point for our application data graph
// fields will have all the type of queries that can be performed on this app graph
const query = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    users:{
      type: new GraphQLList(UserType),
      resolve(parentValue,args){
        const url = `http://localhost:3000/users`;
        return axios.get(url).then(response => response.data);
      }
    },
    user: {
      type: UserType, // return type
      args: { id: { type: GraphQLString } }, // required args with their types
      resolve(parentValue, args) {
        // logic to fetch our data

        // find and return the data from hardCoded data above
        // return _.find(users, { id: args.id });

        // make an external api call which return promise 
        // graphql resolve will automatically reolve the promise for us
        const url = `http://localhost:3000/users/${args.id}`;

        // since axios wraps the result in {data:{ our result }} 
        // we need to explicitly unwrap it before sending it to graphql
        const result = axios.get(url).then(response => {
          // console.log('result', response.data);
          return response.data;
        });

        return result;

      }
    },
    company: {
      type: CompanyType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        const url = `http://localhost:3000/companies/${args.id}`;
        let result = axios.get(url).then(response => response.data);
        return result;
      }
    }
  }
});

const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addUser: {
      type: UserType,
      args: {
        firstName: { type: new GraphQLNonNull(GraphQLString) }, // making the fields required
        age: { type: new GraphQLNonNull(GraphQLInt) }, // making the fields required
        companyId: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve(parentValue, { firstName , age, companyId }) {
        // business logic
        // make a post request to our api
        const url = `http://localhost:3000/users`;
        let result = axios.post(url,{firstName,age,companyId}).then(response => response.data);
        return result;
      }
    },
    deleteUser:{
      type: UserType,
      args:{
        id: {type: new GraphQLNonNull(GraphQLString) }
      },
      resolve(parentValue,{id}){
        return axios.delete(`http://localhost:3000/users/${id}`).then(response => response.data);
      }
    },
    editUser:{
      type:UserType,
      args:{
        id: {type: new GraphQLNonNull(GraphQLString) },
        firstName: { type: GraphQLString }, 
        age: { type: GraphQLInt},
        companyId: { type: GraphQLString }
      },
      resolve(parentValue,{id,firstName,age,companyId}){
        return axios.patch(`http://localhost:3000/users/${id}`,{firstName,age,companyId})
          .then(response => response.data);
      }
    },
    addCompany:{
      type: CompanyType,
      args:{
        name: { type: GraphQLString },
        description : { type: GraphQLString}
      },
      resolve(parentvalue, {name,description}){
        return axios.post(`http://localhost:3000/companies`,{name,description})
          .then(response => {
            // console.log(response.data);
           return response.data
          });
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query,
  mutation
});