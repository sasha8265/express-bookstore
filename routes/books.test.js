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
            '0123456789', 'amazon-url.com', 'Test Author', 'English', 100, 'Test Publisher', 2000
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