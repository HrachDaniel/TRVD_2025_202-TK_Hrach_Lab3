const express = require('express');
const mustacheExpress = require('mustache-express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const appRoutes = require('./routes/appRoutes');

const app = express(); 

const mustache = mustacheExpress();
mustache.locals = mustache.locals || {};
mustache.locals.isAdmin = function() {
    return this.session && this.session.user && this.session.user.role === 'admin';
};

app.engine('html', mustache); 
const port = 3002;
const MONGO_URI = 'mongodb://localhost:27017/libraryDB';

mongoose.connect(MONGO_URI)
    .then(() => console.log('Успішне підключення до MongoDB'))
    .catch(err => console.error('Помилка підключення до MongoDB:', err));

app.use(session({
    secret: 'a-very-strong-secret-key-that-is-hard-to-guess', 
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI })
}));

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/', appRoutes);
app.listen(port, () => {
    console.log(`Сервер успішно запущено на http://localhost:${port}`);
});