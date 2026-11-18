import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import db from "./_db.js";
import { typeDefs } from "./schema.js";
import { GraphQLError } from "graphql";

export const resolvers = {
  Query: {
    books: () => db.books,

    authors: () => db.authors,

    book: (_, args) => {
      if (args.id) return db.books.find((b) => b.id === Number(args.id));
      if (args.title) return db.books.find((b) => b.title === args.title);
      return null;
    },

    booksSearch: (_, { title }) => db.books.filter((b) => b.title.toLowerCase().includes(title.toLowerCase())),

    author: (_, args) => {
      if (args.id) return db.authors.find((a) => a.id === Number(args.id));
      if (args.name) return db.authors.find((a) => a.name === args.name);
      return null;
    },
  },

  Book: {
    author: (book) => db.authors.find((a) => a.id === book.authorId),
  },

  Author: {
    books: (author) => db.books.filter((b) => b.authorId === author.id),
  },

  Mutation: {
    deleteBook: (_, { id }) => {
      const index = db.books.findIndex((b) => b.id === Number(id));
      if (index === -1) return null;

      const deleted = db.books[index];
      db.books.splice(index, 1); // ← мутация массива, а не переприсваивание
      return deleted;
    },

    addBook: (_, { input }) => {
      // 1. Валидация: автор должен существовать
      const authorExists = db.authors.some((a) => a.id === Number(input.authorId));
      if (!authorExists) {
        throw new GraphQLError(`Автор с id ${input.authorId} не найден`, {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // 2. Генерируем id: максимальный существующий + 1
      const newBook = {
        id: Math.max(...db.books.map((b) => b.id)) + 1,
        title: input.title,
        authorId: Number(input.authorId),
      };

      // 3. Пушим на месте — помнишь про read-only модуль: не переприсваиваем!
      db.books.push(newBook);

      // 4. Возвращаем созданный объект — GraphQL сам разрулит поле author
      return newBook;
    },

    updateBook: (_, { input }) => {
      // 1. Находим книгу — обновлять нечего, если её нет
      const book = db.books.find((b) => b.id === Number(input.id));
      if (!book) {
        throw new GraphQLError(`Книга с id ${input.id} не найдена`, {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // 2. Валидация автора, если его меняют
      if (input.authorId !== undefined) {
        const authorExists = db.authors.some((a) => a.id === Number(input.authorId));
        if (!authorExists) {
          throw new GraphQLError(`Автор с id ${input.authorId} не найден`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
        book.authorId = Number(input.authorId);
      }

      // 3. Меняем только переданные поля (частичный апдейт)
      if (input.title !== undefined) {
        book.title = input.title;
      }

      // 4. Возвращаем обновлённый объект
      return book;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

startStandaloneServer(server, { listen: { port: 4000 } }).then(() =>
  console.log("🚀 Сервер на http://localhost:4000/"),
);
