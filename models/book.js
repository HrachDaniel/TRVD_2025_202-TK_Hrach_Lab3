const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    genre: { type: String },
    image: { type: String, required: true },
    tags: [String] ,
    release: { type: String },
    score: { type: String, required: true },
    description: { type: String }
});

const Book = mongoose.model('Book', bookSchema);
module.exports = Book;