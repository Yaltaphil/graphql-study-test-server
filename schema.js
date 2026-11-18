export const typeDefs = `#graphql
  type Author {
    id: ID!
    name: String!
    books: [Book]   # обратная связь: у автора список книг
  }

  type Book {
    id: ID!
    title: String!
    author: Author   # было author: String — стало объектом
  }

  type Query {
    books: [Book]
    authors: [Author]

     # поиск: можно по id, можно по названию (или по обоим сразу)
    book(id: ID, title: String): Book
    booksSearch(title: String): [Book]

    author(id: ID, name: String): Author
  }

  # Input-тип: каркас для аргументов мутации.
  # В отличие от обычных типов может быть ТОЛЬКО на входе (аргументы),
  # его нельзя вернуть в ответе.
  input AddBookInput {
    title: String!        # обязательно (!)
    authorId: ID!         # обязательный id автора из db.authors
  }

  type Mutation {
     deleteBook(id: ID!) : Book,
    addBook(input: AddBookInput!): Book!
    updateBook(input: UpdateBookInput!): Book
  }

  input UpdateBookInput {
    id: ID!          # кого меняем — обязательное поле
    title: String    # а вот эти поля опциональные:
    authorId: ID     # меняем только то, что передали
  }
`;
