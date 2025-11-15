const mongoose = require('mongoose');
const bookCollectionSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true, 
        unique: true 
    },
    description: { 
        type: String 
    },
    coverImage: { 
        type: String 
    }
});

const BookCollection = mongoose.model('BookCollection', bookCollectionSchema);
module.exports = BookCollection;