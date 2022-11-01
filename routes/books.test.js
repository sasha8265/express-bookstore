process.env.NODE_ENV === "test"

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