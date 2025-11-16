const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    _id: Number,
    title: { type: String, required: true },
    author: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Author',
        required: true 
    },
    bookSeries: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BookCollection'
    },
    genre: { type: String },
    image: { type: String, required: true },
    tags: [String],
    release: String,
    score: { type: String, required: true },
    description: { type: String },

    isNaeUpdate: { type: Boolean, default: false },
    isBeingRead: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },  
    isPopular: { type: Boolean, default: false }
});

const Book = mongoose.model('Book', bookSchema);
module.exports = Book;