const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Book = require('../models/book');
const Author = require('../models/author');
const BookCollection = require('../models/bookCollection');
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next(); 
    }
    res.redirect('/login');
};

router.get('/register', (req, res) => {
    res.render('register.html');
});

router.post('/register', async (req, res) => {
    try {
        const { login, email, password, age, gender } = req.body;
        console.log('Отримано дані з форми:', req.body);

        const userExists = await User.findOne({ $or: [{ email: email }, { login: login }] });
        
        if (userExists) {
            console.log('Користувач вже існує. Реєстрацію скасовано.');
            return res.status(400).send('Користувач з таким email або логіном вже існує.');
        }

        console.log('Спроба зберегти нового користувача в MongoDB...');
        const user = new User({ login, email, password, age, gender });
        await user.save(); 
        console.log('✅ Користувача успішно збережено в MongoDB!');
        
        res.redirect('/login');

    } catch (error) {
        console.error('❌ ПОМИЛКА ПРИ ЗБЕРЕЖЕННІ В MONGODB:', error);
        res.status(500).send('Не вдалося зареєструвати користувача.');
    }
});

router.get('/login', (req, res) => {
    res.render('login.html');
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            req.session.user = {
                id: user._id,
                login: user.login,
                role: user.role
            };
            res.redirect('/home');
        } else {
            return res.status(401).send('Неправильний email або пароль.');
        }
    } catch (error) {
        console.error('Помилка входу:', error);
        res.status(500).send('Помилка сервера під час входу.');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/home');
        }
        res.clearCookie('connect.sid'); 
        res.redirect('/');
    });
});

router.get('/', async (req, res) => {
    try {
        const newUpdates = await Book.find({ isNewUpdate: true })
            .populate('author').limit(12);
        
        const beingRead = await Book.find({ isBeingRead: true })
            .populate('author').limit(3);
            
        const trending = await Book.find({ isTrending: true })
            .populate('author').limit(3);
            
        const popular = await Book.find({ isPopular: true })
            .populate('author').limit(3);

        res.render('index.html', { 
            newUpdates: newUpdates,
            beingRead: beingRead,
            trending: trending,
            popular: popular
        });

    } catch (error) {
        console.error('Помилка завантаження книг для головної сторінки:', error);
        res.status(500).send('Не вдалося завантажити книги.');
    }
});

router.get('/home', isAuthenticated, async (req, res) => {
    try {
        const newUpdates = await Book.find({ isNewUpdate: true })
            .populate('author').limit(12);
        
        const beingRead = await Book.find({ isBeingRead: true })
            .populate('author').limit(3);
            
        const trending = await Book.find({ isTrending: true })
            .populate('author').limit(3);
            
        const popular = await Book.find({ isPopular: true })
            .populate('author').limit(3);

        res.render('home.html', { 
            newUpdates: newUpdates,
            beingRead: beingRead,
            trending: trending,
            popular: popular
        });

    } catch (error) {
        console.error('Помилка завантаження книг для головної сторінки:', error);
        res.status(500).send('Не вдалося завантажити книги.');
    }
});

router.get(['/catalog', '/home/catalog'], async (req, res) => {
    try {
        const books = await Book.find({})
            .populate('author')
            .populate('bookSeries');
        const template = req.path.includes('/home') ? 'home.catalog.html' : 'catalog.html';
        res.render(template, { books });
    } catch (error) {
        res.status(500).send('Не вдалося завантажити каталог.');
    }
});

router.get(['/preview/:id', '/home/preview/:id'], async (req, res) => {
    try {
        const bookId = parseInt(req.params.id, 10);
        const book = await Book.findOne({ _id: bookId }) 
            .populate('author')  
            .populate('bookSeries'); 
        
        if (book) {
            const template = req.path.includes('/home') ? 'home.preview.html' : 'preview.html';
            return res.render(template, { book });
        } else {
            return res.status(404).send('Книгу не знайдено.');
        }

        const similarBooks = await Book.find({
            genre: book.genre,
            _id: { $ne: book._id } 
        }).limit(5);
        const template = req.path.includes('/home') ? 'home.preview.html' : 'preview.html';
        res.render(template, { book: book, similarBooks: similarBooks });

    } catch (error) {
        console.error("Помилка на маршруті preview:", error);
        return res.status(500).send('Невірний ID книги або помилка сервера.');
    }
});

router.get('/author/:id', async (req, res) => {
    try {
        const author = await Author.findById(req.params.id);
        if (!author) {
            return res.status(404).send('Автора не знайдено.');
        }
        const books = await Book.find({ author: req.params.id }).populate('bookSeries');
        
        res.render('author.html', { author: author, books: books });
    } catch (error) {
        res.status(500).send('Помилка завантаження сторінки автора.');
    }
});

router.get('/collection/:id', async (req, res) => {
    try {
        const collection = await BookCollection.findById(req.params.id);
        if (!collection) {
            return res.status(404).send('Колекцію не знайдено.');
        }
        const books = await Book.find({ bookSeries: req.params.id }).populate('author');
        
        res.render('collection.html', { collection: collection, books: books });
    } catch (error) {
        res.status(500).send('Помилка завантаження сторінки колекції.');
    }
});

router.get('/savage', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id).populate({
            path: 'savedBooks',
            populate: [
                { path: 'author' },
                { path: 'bookSeries' }
            ]
        });

        if (!user) {
            return res.status(404).send('Користувача не знайдено.');
        }

        res.render('savage.html', { books: user.savedBooks });

    } catch (error) {
        console.error("Помилка завантаження збережених книг:", error);
        res.status(500).send('Не вдалося завантажити збережені книги.');
    }
});

router.post('/save-book', isAuthenticated, async (req, res) => {
    try {
        const bookIdToSave = req.body.id; 
        await User.findByIdAndUpdate(req.session.user.id, {
            $addToSet: { savedBooks: bookIdToSave }
        });
        res.json({ success: true, message: 'Книгу успішно додано до збереженого!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Не вдалося зберегти книгу.' });
    }
});

router.delete('/saved/delete/:id', isAuthenticated, async (req, res) => {
    try {
        const bookIdToDelete = req.params.id;
        await User.findByIdAndUpdate(req.session.user.id, {
            $pull: { savedBooks: bookIdToDelete }
        });
        res.json({ success: true, message: 'Книгу було успішно вилучено.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Не вдалося вилучити книгу.' });
    }
});

router.get('/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        const results = await Book.find({ title: { $regex: query, $options: 'i' } })
            .populate('author');
        res.json(results);
    } catch (error) {
        res.status(500).json([]);
    }
});


module.exports = router;