import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createSchema, createYoga } from 'graphql-yoga';
import { resolvers } from './schema/resolvers';
import { createContext } from './context';

const typeDefs = readFileSync(
  join(__dirname, 'schema', 'schema.graphql'),
  'utf-8'
);

const schema = createSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({
  schema,
  context: createContext,
  graphqlEndpoint: '/graphql',
});

const server = createServer(yoga);

const PORT = 4000;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/graphql`);
});