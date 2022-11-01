process.env.NODE_ENV === "test"

const Book = require("../models/book");
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testBook;

// Set up before each test - add sample book data

beforeEach(async () => {
    const result = await db.query(
        `INSERT INTO books (
            isbn,
            amazon_url,
            author,
            language,
            pages,
            publisher,
            title,
            year
        ) VALUES (
            '0123456789', 'amazon-url.com', 'Test Author', 'English', 100, 'Test Publisher', 'Test Title', 2000
        ) RETURNING isbn, amazon_url, author, language, pages, publisher, title, year`
    )
    testBook = result.rows[0]
});


// Tear down after each test - delete any data created by the server

afterEach(async () => {
    await db.query(`DELETE FROM books`)
});


// After all tests run, end connection to the test database
afterAll(async () => {
    await db.end()
});

/** GET all books - returns `{books: [book, ...]}` */
describe("GET /books", () => {
    test("Get a list with all existing books", async () => {
        const res = await request(app).get('/books')
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ books: [testBook] });
    })
})

/** GET /books/[iban] - returns data about one book: `{book: book} */
describe("GET /books/:isbn", () => {
    test("Get's a single book by book isbn", async () => {
        const res = await request(app).get(`/books/${testBook.isbn}`)
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ book: testBook });
    });
    test("Responds with 404 for invalid book isbn", async () => {
        const res = await request(app).get(`/books/xyz`)
        expect(res.statusCode).toBe(404);
    });
})

/** POST /books/ - create book from data;
 * return data about new book: `{book: book}` */
describe("POST /books", () => {
    test("Creates a single book and adds to db", async () => {
        const res = await request(app).post('/books').send({
            isbn: '9999999999',
            amazon_url: 'amazon- url.com',
            author: 'Test Author',
            language: 'english',
            pages: 100,
            publisher: 'Test Publisher',
            title: 'Test Title',
            year: 2000
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.book).toHaveProperty("isbn");
    });
    test("Prevents book from being added if book data doesn't follow schema", async () => {
        const res = await request(app).post('/books').send({
            isbn: 9999999999,
            amazon_url: 'amazon- url.com',
            author: 'Test Author',
            language: 'english',
            pages: 100,
            title: 'Test Title',
            year: 2000
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toEqual({
                "message": [
                    "instance requires property \"publisher\"",
                    "instance.isbn is not of a type(s) string"
                ], "status": 400
        })
    })
})

/** PUT /books/[isbn] - retrieve book by isbn and update from data;
 * return data about updated book: `{book: book}` 
 * Return 404 if book not found
*/
describe("PUT /books/:isbn", () => {
    test("Updates a single book", async () => {
        const res = await request(app).put(`/books/${testBook.isbn}`).send({
            amazon_url: 'amazon-url.com',
            author: 'Test Author',
            language: 'english',
            pages: 150,
            publisher: 'Test Publisher',
            title: 'Updated Test Book',
            year: 2000
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.book.title).toBe("Updated Test Book");
        expect(res.body.book.pages).toBe(150);
    });
    test("Prevents updating a book with invalid data", async () => {
        const res = await request(app).put(`/books/${testBook.isbn}`).send({
            amazon_url: 'amazon-url.com',
            author: 'Test Author',
            language: 'english',
            pages: '150',
            publisher: 'Test Publisher',
            title: 'Updated Test Book',
            year: 2000
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toEqual({
            "message": [
                "instance.pages is not of a type(s) integer"
            ], "status": 400
        });
    });
    test("Responds with 404 if book isbn cannot be found", async () => {
        const res = await request(app).get(`/books/xyz`)
        expect(res.statusCode).toBe(404);
    });
})

/** DELETE /books/[isbn] - delete book,
 *  return `{message: "Book deleted"}` */
describe("DELETE /books/:isbn", () => {
    test("Deletes a single book", async () => {
        const res = await request(app).delete(`/books/${testBook.isbn}`);
        const allBooks = await request(app).get('/books');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ message: "Book deleted" })
        expect(allBooks.body.books).toEqual([]);
    })
})
