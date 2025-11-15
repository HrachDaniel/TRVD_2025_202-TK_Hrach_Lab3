document.addEventListener('DOMContentLoaded', function() {

    // --- 1. ЛОГІКА БІЧНОЇ ПАНЕЛІ (SIDEBAR) ПРОФІЛЮ ---
    
    const profileLink = document.getElementById('profile-link');
    const profileSidebar = document.getElementById('profile-sidebar');
    const sidebarClose = document.getElementById('sidebar-close');

    if (profileLink && profileSidebar) {
        profileLink.addEventListener('click', function(event) {
            event.preventDefault();
            profileSidebar.classList.toggle('open');
        });
    }

    if (sidebarClose && profileSidebar) {
        sidebarClose.addEventListener('click', function() {
            profileSidebar.classList.remove('open');
        });
    }

    // --- 2. ЛОГІКА ПЕРЕМИКАЧА ТЕМ (DARK MODE) ---
    
    const themeToggle = document.getElementById('theme-toggle');

    if (themeToggle) {
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.checked = true;
        }

        themeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-theme');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // --- 3. ЛОГІКА МОДАЛЬНОГО ВІКНА ПОШУКУ (В ХЕДЕРІ) ---
    
    const searchLink = document.getElementById('search-link');
    const searchModal = document.getElementById('search-modal');
    const searchInput = document.getElementById('main-search-input');
    const resultsContainer = document.getElementById('search-results-container');

    if (searchLink && searchModal) {
        searchLink.addEventListener('click', function(event) {
            event.preventDefault();
            searchModal.style.display = (searchModal.style.display === 'block') ? 'none' : 'block';
        });

        document.addEventListener('click', function(event) {
            if (searchModal.style.display === 'block' && 
                !searchModal.contains(event.target) && 
                !searchLink.contains(event.target)) {
                searchModal.style.display = 'none';
            }
        });
    }

    if (searchInput && resultsContainer) {
        searchInput.addEventListener('keyup', function() {
            const query = this.value.trim();

            if (query === '') {
                resultsContainer.innerHTML = '';
                return;
            }

            fetch(`/search?q=${query}`)
                .then(response => response.json())
                .then(books => {
                    resultsContainer.innerHTML = ''; 
                    
                    const isHomePage = window.location.pathname.includes('/home');
                    const previewPath = isHomePage ? '/home/preview' : '/preview';

                    books.forEach(book => {
                        const bookElement = document.createElement('a');
                        bookElement.href = `${previewPath}/${book._id}`;
                        bookElement.classList.add('search-result-item');
                        bookElement.innerHTML = `
                            <img src="${book.image}" alt="${book.title}" class="search-result-image">
                            <span class="search-result-title">${book.title}</span>
                        `;
                        resultsContainer.appendChild(bookElement);
                    });
                })
                .catch(error => console.error('Помилка пошуку:', error));
        });
    }

    // --- 4. ЛОГІКА ПОШУКУ НА СТОРІНКАХ КАТАЛОГУ ---
    
    const catalogSearchInput = document.querySelector('.catalog-main .search-input');
    const catalogGrid = document.querySelector('.catalog-grid-page');
    let initialCatalogContent = ''; 

    if (catalogSearchInput && catalogGrid) {
        initialCatalogContent = catalogGrid.innerHTML;

        catalogSearchInput.addEventListener('keyup', function() {
            const query = this.value.trim();

            if (query === '') {
                catalogGrid.innerHTML = initialCatalogContent;
                return;
            }

            fetch(`/search?q=${query}`)
                .then(response => response.json())
                .then(books => {
                    catalogGrid.innerHTML = '';
                    
                    if (books.length === 0) {
                        catalogGrid.innerHTML = '<p>За вашим запитом нічого не знайдено.</p>';
                        return;
                    }

                    const isHomePage = window.location.pathname.includes('/home');
                    const previewPath = isHomePage ? '/home/preview' : '/preview';

                    books.forEach(book => {
                        const bookElement = document.createElement('a');
                        bookElement.href = `${previewPath}/${book._id}`;
                        bookElement.classList.add('manga-card');
                        bookElement.innerHTML = `
                            <img src="${book.image}" alt="${book.title}">
                            <div class="manga-card-info">
                                <h4>${book.title}</h4>
                                <p>${book.genre}</p>
                            </div>
                        `;
                        catalogGrid.appendChild(bookElement);
                    });
                })
                .catch(error => console.error('Помилка пошуку в каталозі:', error));
        });
    }

    // --- 5. ЛОГІКА ДОДАВАННЯ КНИГИ ДО ЗБЕРЕЖЕНОГО (ЗІ СТОРІНОК PREVIEW) ---
    
    const saveButton = document.getElementById('save-button');

    if (saveButton) {
        saveButton.addEventListener('click', function() {
            const bookId = this.dataset.bookId;
            
            fetch('/save-book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: bookId })
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
            })
            .catch(error => {
                console.error('Помилка збереження:', error);
                alert('Не вдалося зберегти книгу.');
            });
        });
    }

    // --- 6. ЛОГІКА ВИДАЛЕННЯ КНИГ ТА КОНТЕКСТНОГО МЕНЮ (НА СТОРІНЦІ SAVAGE) ---
    
    const savedContainer = document.getElementById('saved-container');
    const contextMenu = document.getElementById('custom-context-menu');
    const contextMenuDeleteBtn = document.getElementById('context-menu-delete-btn');

    if (savedContainer && contextMenu && contextMenuDeleteBtn) {

        function deleteBook(bookId) {
            fetch(`/saved/delete/${bookId}`, {
                method: 'DELETE',
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    location.reload(); 
                } else {
                    alert('Помилка: ' + data.message);
                }
            })
            .catch(error => console.error('Помилка видалення:', error));
        }

        savedContainer.addEventListener('contextmenu', function(event) {
            const card = event.target.closest('.manga-card');
            if (card) {
                event.preventDefault();

                const bookDataElement = card.querySelector('[data-book-id]');
                if (!bookDataElement) return;
                
                const bookId = bookDataElement.dataset.bookId;
                contextMenuDeleteBtn.dataset.bookId = bookId;

                const cardRect = card.getBoundingClientRect();
                const topPosition = cardRect.top + cardRect.height / 2 + window.scrollY;
                const leftPosition = cardRect.left + cardRect.width / 2 + window.scrollX;
                
                contextMenu.style.top = `${topPosition}px`;
                contextMenu.style.left = `${leftPosition}px`;
                contextMenu.style.display = 'block';
            }
        });

        document.addEventListener('click', function(event) {

            if (event.target.classList.contains('btn-remove')) {
                const bookId = event.target.dataset.bookId;
                if (confirm('Ви впевнені, що хочете вилучити цю книгу?')) {
                    deleteBook(bookId);
                }
            }

            if (event.target.id === 'context-menu-delete-btn') {
                const bookId = event.target.dataset.bookId;
                if (confirm('Ви впевнені, що хочете вилучити цю книгу?')) {
                    deleteBook(bookId);
                }
            }
            
            if (contextMenu.style.display === 'block' && !contextMenu.contains(event.target)) {
                contextMenu.style.display = 'none';
            }
        });
    }

});