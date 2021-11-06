const { ApolloServer } = require("apollo-server");
const mongoose = require("mongoose"); //For connecting to Mongo DB

const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");
const { MONGODB } = require("./config");




const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({req}) => ({req})
});
//connect to mongoose server
mongoose
  .connect(MONGODB, { useNewUrlParser: true })
  .then(() => {
    console.log("Connected to MongoDB");
    return server.listen({ port: 8000 });
  })
  .then((res) => {
    console.log(`Server is running on port ${res.url}`);
  });
