import { GraphQLScalarType, Kind } from 'graphql';
import { folderResolvers } from './folder.resolvers.js';
import { bookmarkResolvers } from './bookmark.resolvers.js';

const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type represented as an ISO-8601 string',
  serialize(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      return new Date(value).toISOString();
    }
    throw new Error('GraphQL DateTime Scalar serializer expected a `Date` object or ISO string');
  },
  parseValue(value: unknown): Date {
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('GraphQL DateTime Scalar parser expected a valid date value');
      }
      return date;
    }
    throw new Error('GraphQL DateTime Scalar parser expected a string or number');
  },
  parseLiteral(ast): Date {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      const date = new Date(ast.value);
      if (isNaN(date.getTime())) {
        throw new Error('GraphQL DateTime Scalar literal parser expected a valid date string');
      }
      return date;
    }
    throw new Error('GraphQL DateTime Scalar literal parser expected a string or integer');
  },
});

export const resolvers = {
  DateTime: dateTimeScalar,
  Query: {
    ...folderResolvers.Query,
    ...bookmarkResolvers.Query,
  },
  Mutation: {
    ...folderResolvers.Mutation,
    ...bookmarkResolvers.Mutation,
  },
  Folder: {
    ...folderResolvers.Folder,
  },
  Bookmark: {
    ...bookmarkResolvers.Bookmark,
  },
};