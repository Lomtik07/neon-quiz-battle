// game.js - Основная логика игры (исправленная версия)

// Глобальные переменные
let game = null;
let Database = window.Database;

// Функция для показа уведомлений
function showNotification(title, text, color) {
    const notification = document.getElementById('notification');
    const titleEl = document.getElementById('notificationTitle');
    const textEl = document.getElementById('notificationText');
    
    if (!notification || !titleEl || !textEl) return;
    
    titleEl.textContent = title;
    textEl.textContent = text;
    notification.style.borderColor = color;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Основной класс GameManager
class GameManager {
    constructor() {
        console.log('Инициализация GameManager...');
        this.currentState = {
            user: null,
            currentRoom: null,
            gameScreen: 'auth',
            playerName: 'Игрок',
            isHost: false,
            roomCode: null
        };
        
        this.playerListInterval = null;
        this.roomsUpdateInterval = null;
        
        // Загружаем пользователя
        this.loadSavedUser();
        
        // Инициализируем обработчики сразу
        this.init();
    }
    
    // Основная инициализация
    init() {
        console.log('Начало инициализации...');
        
        // Сначала загружаем предпочтения
        this.loadUserPreferences();
        
        // Затем инициализируем обработчики
        this.initializeEventListeners();
        
        // Показываем экран в зависимости от состояния
        setTimeout(() => {
            if (this.currentState.user && !this.currentState.user.isGuest) {
                this.showMainMenu();
            } else {
                this.showScreen('auth');
            }
            console.log('GameManager инициализирован');
        }, 100);
    }
    
    // Загрузка сохраненного пользователя
    loadSavedUser() {
        try {
            const savedName = localStorage.getItem('quiz_player_name');
            if (savedName) {
                this.currentState.playerName = savedName;
            }
            
            const lastUserId = localStorage.getItem('last_user_id');
            if (lastUserId && Database && Database.data && Database.data.users) {
                const user = Database.findUserById(lastUserId);
                if (user) {
                    this.currentState.user = user;
                    this.currentState.playerName = user.username;
                    console.log('Пользователь загружен:', user.username);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
        }
    }
    
    // Загрузка предпочтений пользователя
    loadUserPreferences() {
        try {
            const nameInput = document.getElementById('playerNameInput');
            if (nameInput && this.currentState.playerName) {
                nameInput.value = this.currentState.playerName;
            }
        } catch (error) {
            console.error('Ошибка загрузки предпочтений:', error);
        }
    }
    
    // Инициализация обработчиков событий
    initializeEventListeners() {
        console.log('Инициализация обработчиков...');
        
        // Убедимся что DOM полностью загружен
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }
    
    // Настройка обработчиков событий
    setupEventListeners() {
        console.log('Настройка обработчиков событий...');
        
        // Быстрый старт
        this.setupButton('quickStartBtn', () => this.quickStart());
        
        // Создание аккаунта
        this.setupButton('createAccountBtn', () => this.toggleAccountMode());
        
        // Вход в аккаунт
        this.setupButton('loginAccountBtn', () => this.loginAccount());
        
        // Переключение видимости пароля
        this.setupButton('togglePassword', () => this.togglePasswordVisibility());
        
        // Проверка сложности пароля
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                this.checkPasswordStrength(e.target.value);
            });
        }
        
        // Создание комнаты
        this.setupButton('createRoomBtn', () => this.createRoom());
        
        // Присоединение к комнате
        this.setupButton('joinRoomBtn', () => this.joinRoom());
        
        // Начать игру
        this.setupButton('startGameBtn', () => this.startGame());
        
        // Покинуть комнату
        this.setupButton('leaveRoomBtn', () => this.leaveRoom());
        
        // Копировать код
        this.setupButton('copyCodeBtn', () => this.copyRoomCode());
        
        // Поделиться кодом
        this.setupButton('shareCodeBtn', () => this.shareRoomCode());
        
        // Enter для присоединения
        const joinCodeInput = document.getElementById('joinCodeInput');
        if (joinCodeInput) {
            joinCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.joinRoom();
                }
            });
        }
        
        // Кнопки боковой панели
        this.setupButton('profileBtn', () => this.showScreen('profile'));
        this.setupButton('settingsBtn', () => this.showScreen('settings'));
        this.setupButton('logoutBtn', () => this.logout());
        
        // Мои опросы
        this.setupButton('myQuizzesBtn', () => {
            if (window.quizManager) {
                window.quizManager.showMyQuizzes();
            } else {
                showNotification('Информация', 'Функция будет доступна после полной загрузки', '#00f3ff');
            }
        });
        
        // Настройка обработчиков меню
        this.setupMenuHandlers();
        
        console.log('Обработчики настроены');
    }
    
    // Универсальная функция настройки кнопок
    setupButton(buttonId, handler) {
        const button = document.getElementById(buttonId);
        if (button) {
            // Удаляем старые обработчики
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Добавляем новый обработчик
            newButton.addEventListener('click', handler);
            return newButton;
        }
        return null;
    }
    
    // Настройка обработчиков меню
    setupMenuHandlers() {
        // Обработчики для карточек меню
        document.addEventListener('click', (e) => {
            const menuCard = e.target.closest('.menu-card');
            if (menuCard) {
                e.preventDefault();
                const title = menuCard.querySelector('.menu-title')?.textContent.trim();
                
                switch(title) {
                    case 'ИГРАТЬ':
                        this.showScreen('room');
                        break;
                    case 'ПРОФИЛЬ':
                        this.showScreen('profile');
                        break;
                    case 'СОЗДАТЬ ВИКТОРИНУ':
                        if (window.quizManager) {
                            window.quizManager.showCreateQuiz();
                        } else {
                            showNotification('Информация', 'Создание викторин скоро будет доступно', '#00f3ff');
                        }
                        break;
                    case 'ТАБЛИЦА ЛИДЕРОВ':
                        this.showLeaderboard();
                        break;
                    case 'МОИ ВИКТОРИНЫ':
                        if (window.quizManager) {
                            window.quizManager.showMyQuizzes();
                        } else {
                            showNotification('Информация', 'Мои викторины скоро будут доступны', '#00f3ff');
                        }
                        break;
                    case 'НАСТРОЙКИ':
                        this.showScreen('settings');
                        break;
                }
            }
        });
        
        // Кнопка назад в профиле
        const backBtn = document.querySelector('.btn[onclick*="game.showScreen"]');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showScreen('menu');
            });
        }
        
        // Кнопка сохранения настроек
        const saveSettingsBtn = document.querySelector('.btn[onclick*="game.saveSettings"]');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }
    }
    
    // Быстрый старт (гостевой режим)
    quickStart() {
        console.log('Быстрый старт...');
        
        // Получаем имя игрока
        const nameInput = document.getElementById('playerNameInput');
        if (!nameInput) {
            showNotification('Ошибка', 'Поле имени не найдено', '#ff5555');
            return;
        }
        
        const name = nameInput.value.trim();
        if (!name) {
            showNotification('Ошибка', 'Введите имя игрока', '#ff5555');
            return;
        }
        
        this.currentState.playerName = name;
        localStorage.setItem('quiz_player_name', name);
        
        const guestUser = {
            id: 'guest_' + Date.now(),
            username: name,
            isGuest: true,
            avatar: name.charAt(0).toUpperCase(),
            stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                totalScore: 0,
                averageScore: 0,
                bestScore: 0,
                winRate: 0
            }
        };
        
        this.currentState.user = guestUser;
        this.showMainMenu();
        
        showNotification('Гостевой режим', 'Для сохранения статистики создайте аккаунт', '#ffaa00');
    }
    
    // Переключение режима аккаунта
    toggleAccountMode() {
        console.log('Переключение режима аккаунта...');
        const createBtn = document.getElementById('createAccountBtn');
        const loginBtn = document.getElementById('loginAccountBtn');
        const emailGroup = document.getElementById('emailGroup');
        
        if (!createBtn) return;
        
        if (createBtn.textContent.includes('СОЗДАТЬ')) {
            // Переключаемся на режим создания аккаунта
            createBtn.innerHTML = '<i class="fas fa-check"></i> ПОДТВЕРДИТЬ';
            createBtn.classList.remove('btn-secondary');
            createBtn.classList.add('btn-primary');
            
            if (loginBtn) {
                loginBtn.style.display = 'block';
                loginBtn.classList.remove('btn-secondary');
                loginBtn.classList.add('btn-primary');
            }
            if (emailGroup) emailGroup.style.display = 'block';
        } else {
            // Создаем аккаунт
            this.createAccount();
        }
    }
    
    // Создание аккаунта
    createAccount() {
        console.log('Создание аккаунта...');
        
        // Получаем данные из формы
        const nameInput = document.getElementById('playerNameInput');
        const passwordInput = document.getElementById('passwordInput');
        const emailInput = document.getElementById('emailInput');
        
        if (!nameInput || !passwordInput) {
            showNotification('Ошибка', 'Форма не найдена', '#ff5555');
            return;
        }
        
        const name = nameInput.value.trim();
        const password = passwordInput.value;
        const email = emailInput ? emailInput.value.trim() : '';
        
        // Валидация
        if (!name) {
            showNotification('Ошибка', 'Введите имя игрока', '#ff5555');
            return;
        }
        
        if (!password || password.length < 6) {
            showNotification('Ошибка', 'Пароль должен содержать минимум 6 символов', '#ff5555');
            return;
        }
        
        // Проверяем, существует ли пользователь
        let existingUser = null;
        if (Database && Database.data && Database.data.users) {
            existingUser = Database.data.users.find(u => u.username === name);
        }
        
        if (existingUser) {
            showNotification('Ошибка', 'Пользователь с таким именем уже существует', '#ff5555');
            return;
        }
        
        // Создаем пользователя
        const user = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            username: name,
            password: password,
            email: email || null,
            createdAt: new Date().toISOString(),
            isGuest: false,
            avatar: name.charAt(0).toUpperCase(),
            stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                totalScore: 0,
                averageScore: 0,
                bestScore: 0,
                winRate: 0
            }
        };
        
        if (Database) {
            if (!Database.data.users) Database.data.users = [];
            Database.data.users.push(user);
            Database.save();
        }
        
        this.currentState.user = user;
        this.currentState.playerName = name;
        localStorage.setItem('last_user_id', user.id);
        localStorage.setItem('quiz_player_name', name);
        
        this.showMainMenu();
        showNotification('Аккаунт создан!', 'Ваша статистика будет сохранена', '#00ff9d');
        
        // Сбрасываем форму
        this.resetAuthForm();
    }
    
    // Вход в аккаунт
    loginAccount() {
        console.log('Вход в аккаунт...');
        
        const passwordInput = document.getElementById('passwordInput');
        if (!passwordInput) return;
        
        const nameInput = document.getElementById('playerNameInput');
        if (!nameInput) return;
        
        const password = passwordInput.value;
        const name = nameInput.value.trim();
        
        if (!name) {
            showNotification('Ошибка', 'Введите имя игрока', '#ff5555');
            return;
        }
        
        if (!password || password.length < 6) {
            showNotification('Ошибка', 'Пароль должен содержать минимум 6 символов', '#ff5555');
            return;
        }
        
        // Ищем пользователя в базе данных
        let user = null;
        if (Database && Database.data && Database.data.users) {
            user = Database.data.users.find(u => 
                u.username === name && u.password === password
            );
        }
        
        if (user) {
            this.currentState.user = user;
            this.currentState.playerName = user.username;
            localStorage.setItem('last_user_id', user.id);
            localStorage.setItem('quiz_player_name', user.username);
            
            this.showMainMenu();
            showNotification('Успешный вход!', `Добро пожаловать, ${name}!`, '#00ff9d');
        } else {
            showNotification('Ошибка', 'Неверное имя пользователя или пароль', '#ff5555');
        }
    }
    
    // Переключение видимости пароля
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('passwordInput');
        const toggleBtn = document.getElementById('togglePassword');
        
        if (!passwordInput || !toggleBtn) return;
        
        const toggleIcon = toggleBtn.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            if (toggleIcon) toggleIcon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            if (toggleIcon) toggleIcon.className = 'fas fa-eye';
        }
    }
    
    // Проверка сложности пароля
    checkPasswordStrength(password) {
        const strengthDiv = document.getElementById('passwordStrength');
        if (!strengthDiv) return;
        
        if (!password) {
            strengthDiv.className = 'password-strength';
            return;
        }
        
        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        if (strength <= 2) {
            strengthDiv.textContent = 'Слабый пароль';
            strengthDiv.className = 'password-strength weak';
        } else if (strength <= 4) {
            strengthDiv.textContent = 'Средний пароль';
            strengthDiv.className = 'password-strength medium';
        } else {
            strengthDiv.textContent = 'Сильный пароль';
            strengthDiv.className = 'password-strength strong';
        }
    }
    
    // Сброс формы авторизации
    resetAuthForm() {
        const createBtn = document.getElementById('createAccountBtn');
        const loginBtn = document.getElementById('loginAccountBtn');
        const emailGroup = document.getElementById('emailGroup');
        const passwordInput = document.getElementById('passwordInput');
        const emailInput = document.getElementById('emailInput');
        const strengthDiv = document.getElementById('passwordStrength');
        
        if (createBtn) {
            createBtn.innerHTML = '<i class="fas fa-user-plus"></i> СОЗДАТЬ АККАУНТ';
            createBtn.classList.remove('btn-primary');
            createBtn.classList.add('btn-secondary');
        }
        if (loginBtn) {
            loginBtn.style.display = 'none';
            loginBtn.classList.remove('btn-primary');
            loginBtn.classList.add('btn-secondary');
        }
        if (emailGroup) emailGroup.style.display = 'none';
        if (passwordInput) passwordInput.value = '';
        if (emailInput) emailInput.value = '';
        if (strengthDiv) strengthDiv.className = 'password-strength';
    }
    
    // Показать главное меню
    showMainMenu() {
        console.log('Показать главное меню');
        this.showScreen('menu');
        this.updateProfileInfo();
        
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.style.display = 'block';
    }
    
    // Обновление информации профиля
    updateProfileInfo() {
        if (!this.currentState.user) return;
        
        const user = this.currentState.user;
        
        // Аватар
        const avatar = document.getElementById('userAvatar');
        if (avatar) {
            avatar.textContent = user.avatar || user.username.charAt(0).toUpperCase();
        }
        
        // Имя
        const displayName = document.getElementById('userDisplayName');
        if (displayName) {
            displayName.textContent = user.username;
        }
        
        // Email
        const emailEl = document.getElementById('userEmail');
        if (emailEl) {
            emailEl.textContent = user.email || (user.isGuest ? 'Гостевой аккаунт' : '');
            emailEl.style.color = user.isGuest ? '#ffaa00' : '#aaa';
        }
        
        // Статистика
        const stats = user.stats || {};
        
        // Обновляем все элементы статистики
        const elements = {
            'gamesPlayed': stats.gamesPlayed || 0,
            'gamesWon': stats.gamesWon || 0,
            'totalScore': stats.totalScore || 0,
            'statGamesPlayed': stats.gamesPlayed || 0,
            'statGamesWon': stats.gamesWon || 0,
            'statTotalScore': stats.totalScore || 0,
            'statAverageScore': stats.averageScore || 0,
            'statBestScore': stats.bestScore || 0,
            'statWinRate': (stats.winRate || 0) + '%'
        };
        
        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        }
    }
    
    // Выход из системы
    logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            this.currentState.user = null;
            localStorage.removeItem('last_user_id');
            this.showScreen('auth');
            
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.style.display = 'none';
            
            this.resetAuthForm();
            showNotification('Выход', 'Вы вышли из системы', '#00f3ff');
        }
    }
    
    // Генератор кода комнаты
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    
    // Создание комнаты
    createRoom() {
        console.log('Создание комнаты...');
        
        const roomCode = this.generateRoomCode();
        const hostName = this.currentState.playerName;
        const hostId = this.currentState.user ? this.currentState.user.id : null;
        
        let room = null;
        if (Database) {
            room = Database.createRoom(roomCode, hostName, hostId);
        } else {
            // Fallback
            room = {
                code: roomCode,
                hostId: hostId,
                hostName: hostName,
                players: [{
                    id: hostId || 'guest_' + Date.now(),
                    name: hostName,
                    avatar: hostName.charAt(0).toUpperCase(),
                    isHost: true,
                    score: 0,
                    ready: false
                }],
                maxPlayers: 8,
                gameState: 'waiting',
                theme: 'general',
                currentQuestion: 0,
                createdAt: Date.now(),
                lastActivity: Date.now()
            };
        }
        
        if (room) {
            this.currentState.currentRoom = room;
            this.currentState.roomCode = roomCode;
            this.currentState.isHost = true;
            
            this.showRoomCode(roomCode);
            this.updateRecentRooms();
            
            showNotification('Комната создана!', `Код: ${roomCode}`, '#00ff9d');
            
            // Инициализируем realtime manager если нужно
            if (window.realtimeManager) {
                window.realtimeManager.startRoomUpdates(roomCode);
            }
        } else {
            showNotification('Ошибка', 'Не удалось создать комнату', '#ff5555');
        }
    }
    
    // Присоединение к комнате
    joinRoom() {
        console.log('Присоединение к комнате...');
        
        const joinCodeInput = document.getElementById('joinCodeInput');
        if (!joinCodeInput) return;
        
        const roomCode = joinCodeInput.value.trim().toUpperCase();
        const playerName = this.currentState.playerName;
        const playerId = this.currentState.user ? this.currentState.user.id : null;
        
        if (roomCode.length !== 6) {
            showNotification('Ошибка', 'Код комнаты должен содержать 6 символов', '#ff5555');
            return;
        }
        
        let room = null;
        if (Database) {
            room = Database.findRoomByCode(roomCode);
        }
        
        if (!room) {
            showNotification('Ошибка', 'Комната не найдена', '#ff5555');
            return;
        }
        
        if (room.players && room.players.length >= room.maxPlayers) {
            showNotification('Ошибка', 'В комнате нет свободных мест', '#ff5555');
            return;
        }
        
        let player = null;
        if (Database) {
            player = Database.addPlayerToRoom(roomCode, playerName, playerId);
        } else {
            // Fallback
            player = {
                id: playerId || 'guest_' + Date.now(),
                name: playerName,
                avatar: playerName.charAt(0).toUpperCase(),
                isHost: false,
                score: 0,
                ready: false
            };
            if (!room.players) room.players = [];
            room.players.push(player);
        }
        
        if (player) {
            this.currentState.currentRoom = room;
            this.currentState.roomCode = roomCode;
            this.currentState.isHost = false;
            
            this.showRoomCode(roomCode);
            if (Database) Database.addRecentRoom(roomCode);
            
            showNotification('Успех!', `Вы присоединились к комнате ${roomCode}`, '#00ff9d');
            
            // Инициализируем realtime manager если нужно
            if (window.realtimeManager) {
                window.realtimeManager.startRoomUpdates(roomCode);
            }
        } else {
            showNotification('Ошибка', 'Не удалось присоединиться', '#ff5555');
        }
    }
    
    // Показать код комнаты
    showRoomCode(roomCode) {
        const roomCodeElement = document.getElementById('roomCode');
        if (roomCodeElement) {
            roomCodeElement.textContent = roomCode;
        }
        
        this.showScreen('code');
        this.updatePlayerList();
        
        // Показываем кнопку "Начать игру" только для хоста
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
            startGameBtn.style.display = this.currentState.isHost ? 'block' : 'none';
        }
        
        // Обновляем список игроков
        if (this.playerListInterval) {
            clearInterval(this.playerListInterval);
        }
        
        this.playerListInterval = setInterval(() => {
            this.updatePlayerList();
        }, 3000);
        
        // Обновляем сразу
        this.updatePlayerList();
    }
    
    // Обновление списка игроков
    updatePlayerList() {
        if (!this.currentState.roomCode) return;
        
        let room = null;
        if (Database) {
            room = Database.findRoomByCode(this.currentState.roomCode);
        } else {
            room = this.currentState.currentRoom;
        }
        
        if (room) {
            const playerCount = room.players ? room.players.length : 1;
            const playerCountElement = document.getElementById('playerCount');
            if (playerCountElement) {
                playerCountElement.textContent = `Игроков: ${playerCount}/8`;
            }
            
            // Обновляем список игроков
            const playersList = document.getElementById('playersList');
            if (playersList) {
                playersList.innerHTML = '';
                room.players.forEach(player => {
                    const playerEl = document.createElement('div');
                    playerEl.className = 'player-item';
                    playerEl.innerHTML = `
                        <div class="player-avatar">${player.avatar || player.name.charAt(0).toUpperCase()}</div>
                        <div class="player-name">
                            ${player.name} ${player.isHost ? '👑' : ''}
                            ${player.id === this.currentState.user?.id ? ' (Вы)' : ''}
                        </div>
                    `;
                    playersList.appendChild(playerEl);
                });
            }
            
            // Если хост и есть минимум 2 игрока, показываем кнопку "Начать игру"
            const startGameBtn = document.getElementById('startGameBtn');
            if (this.currentState.isHost && playerCount >= 2 && startGameBtn) {
                startGameBtn.style.display = 'block';
            }
        }
    }
    
    // Начать игру
    startGame() {
        if (!this.currentState.isHost) return;
        
        showNotification('Игра начинается!', 'Подготовьтесь к первому вопросу', '#00ff9d');
        
        // Временная заглушка
        setTimeout(() => {
            showNotification('В разработке', 'Игровой процесс в разработке', '#ffaa00');
        }, 2000);
    }
    
    // Покинуть комнату
    leaveRoom() {
        if (this.currentState.roomCode && this.currentState.user) {
            if (Database) {
                Database.removePlayerFromRoom(
                    this.currentState.roomCode, 
                    this.currentState.user.id
                );
            }
        }
        
        if (this.playerListInterval) {
            clearInterval(this.playerListInterval);
            this.playerListInterval = null;
        }
        
        // Останавливаем realtime обновления
        if (window.realtimeManager) {
            window.realtimeManager.stopUpdates();
        }
        
        this.currentState.currentRoom = null;
        this.currentState.roomCode = null;
        this.currentState.isHost = false;
        
        this.showScreen('room');
        showNotification('Выход', 'Вы покинули комнату', '#00f3ff');
    }
    
    // Копирование кода комнаты
    copyRoomCode() {
        const roomCodeElement = document.getElementById('roomCode');
        if (!roomCodeElement) return;
        
        const code = roomCodeElement.textContent;
        navigator.clipboard.writeText(code).then(() => {
            showNotification('Скопировано!', 'Код комнаты скопирован', '#00ff9d');
        }).catch(err => {
            showNotification('Ошибка', 'Не удалось скопировать код', '#ff5555');
        });
    }
    
    // Поделиться кодом
    shareRoomCode() {
        const roomCodeElement = document.getElementById('roomCode');
        if (!roomCodeElement) return;
        
        const code = roomCodeElement.textContent;
        const text = `Присоединяйтесь к игре в Neon Quiz Battle! Код комнаты: ${code}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Neon Quiz Battle',
                text: text,
                url: window.location.href
            }).catch(err => {
                this.copyRoomCode();
            });
        } else {
            this.copyRoomCode();
        }
    }
    
    // Обновление списка недавних комнат
    updateRecentRooms() {
        const roomsList = document.getElementById('roomsList');
        if (!roomsList) return;
        
        let recentRooms = [];
        if (Database) {
            recentRooms = Database.getRecentRooms();
        }
        
        if (recentRooms.length === 0) {
            roomsList.innerHTML = '<div class="room-item"><span class="room-info">Нет недавних комнат</span></div>';
            return;
        }
        
        roomsList.innerHTML = '';
        recentRooms.forEach(room => {
            const playerCount = room.players ? room.players.length : 0;
            const maxPlayers = room.maxPlayers || 8;
            
            const roomItem = document.createElement('div');
            roomItem.className = 'room-item';
            roomItem.innerHTML = `
                <div>
                    <div class="room-code">${room.code}</div>
                    <div class="room-info">
                        Создатель: ${room.hostName} | Игроков: ${playerCount}/${maxPlayers}
                    </div>
                </div>
                <button class="btn join-room-btn" data-room="${room.code}">
                    <i class="fas fa-sign-in-alt"></i> ПРИСОЕДИНИТЬСЯ
                </button>
            `;
            
            roomsList.appendChild(roomItem);
            
            // Добавляем обработчик для этой кнопки
            const joinBtn = roomItem.querySelector('.join-room-btn');
            if (joinBtn) {
                joinBtn.addEventListener('click', () => {
                    this.joinExistingRoom(room.code);
                });
            }
        });
    }
    
    // Присоединение к существующей комнате
    joinExistingRoom(roomCode) {
        // Устанавливаем код в поле ввода
        const joinCodeInput = document.getElementById('joinCodeInput');
        if (joinCodeInput) {
            joinCodeInput.value = roomCode;
        }
        
        // Вызываем joinRoom
        this.joinRoom();
    }
    
    // Обновление списка доступных комнат
    updateAvailableRooms() {
        const roomsList = document.getElementById('roomsList');
        if (!roomsList) return;
        
        let availableRooms = [];
        if (Database && Database.data && Database.data.rooms) {
            availableRooms = Database.data.rooms.filter(room => 
                room.gameState === 'waiting' && 
                room.players && 
                room.players.length < room.maxPlayers
            );
        }
        
        if (availableRooms.length === 0) {
            roomsList.innerHTML = `
                <div class="room-item">
                    <span class="room-info">Нет доступных комнат. Создайте свою!</span>
                </div>
            `;
            return;
        }
        
        roomsList.innerHTML = '';
        availableRooms.forEach(room => {
            const playerCount = room.players ? room.players.length : 0;
            const maxPlayers = room.maxPlayers || 8;
            
            const roomItem = document.createElement('div');
            roomItem.className = 'room-item';
            roomItem.innerHTML = `
                <div>
                    <div class="room-code">${room.code}</div>
                    <div class="room-info">
                        Создатель: ${room.hostName} | Игроков: ${playerCount}/${maxPlayers}
                    </div>
                </div>
                <button class="btn join-room-btn" data-room="${room.code}">
                    <i class="fas fa-sign-in-alt"></i> ВОЙТИ
                </button>
            `;
            
            roomsList.appendChild(roomItem);
            
            // Добавляем обработчик для этой кнопки
            const joinBtn = roomItem.querySelector('.join-room-btn');
            if (joinBtn) {
                joinBtn.addEventListener('click', () => {
                    this.joinExistingRoom(room.code);
                });
            }
        });
    }
    
    // Показать таблицу лидеров
    showLeaderboard() {
        showNotification('В разработке', 'Таблица лидеров скоро будет доступна!', '#ffaa00');
    }
    
    // Показать настройки
    showSettings() {
        this.showScreen('settings');
    }
    
    // Сохранить настройки
    saveSettings() {
        showNotification('Настройки сохранены', 'Ваши настройки были успешно сохранены', '#00ff9d');
        setTimeout(() => {
            this.showScreen('menu');
        }, 1000);
    }
    
    // Сменить имя пользователя
    changeUsername() {
        const modal = document.getElementById('usernameModal');
        if (modal) {
            modal.style.display = 'flex';
            const newUsernameInput = document.getElementById('newUsername');
            if (newUsernameInput) {
                newUsernameInput.value = this.currentState.playerName;
                newUsernameInput.focus();
            }
        }
    }
    
    // Сохранить имя пользователя
    saveUsername() {
        const newUsernameInput = document.getElementById('newUsername');
        if (!newUsernameInput) return;
        
        const newUsername = newUsernameInput.value.trim();
        if (!newUsername || newUsername.length < 2) {
            showNotification('Ошибка', 'Имя должно содержать минимум 2 символа', '#ff5555');
            return;
        }
        
        this.currentState.playerName = newUsername;
        this.currentState.user.username = newUsername;
        
        // Сохраняем в localStorage
        localStorage.setItem('quiz_player_name', newUsername);
        
        // Обновляем в базе данных
        if (Database && this.currentState.user.id) {
            Database.updateUser(this.currentState.user.id, { username: newUsername });
        }
        
        // Обновляем UI
        this.updateProfileInfo();
        
        // Скрываем модальное окно
        this.hideModal('usernameModal');
        
        showNotification('Успех', 'Имя изменено', '#00ff9d');
    }
    
    // Сменить аватар
    changeAvatar() {
        const modal = document.getElementById('avatarModal');
        if (modal) {
            modal.style.display = 'flex';
            this.loadAvatarOptions();
        }
    }
    
    // Загрузить варианты аватаров
    loadAvatarOptions() {
        const avatarGrid = document.getElementById('avatarGrid');
        if (!avatarGrid) return;
        
        const avatars = ['😀', '😎', '🤓', '😊', '😍', '🥳', '🤖', '👻', '🐱', '🐶', '🐼', '🦊'];
        
        avatarGrid.innerHTML = '';
        avatars.forEach(avatar => {
            const avatarOption = document.createElement('div');
            avatarOption.className = 'avatar-option';
            if (this.currentState.user?.avatar === avatar) {
                avatarOption.classList.add('selected');
            }
            avatarOption.textContent = avatar;
            avatarOption.dataset.avatar = avatar;
            
            avatarOption.addEventListener('click', () => {
                this.selectAvatar(avatar);
            });
            
            avatarGrid.appendChild(avatarOption);
        });
    }
    
    // Выбрать аватар
    selectAvatar(avatar) {
        this.currentState.user.avatar = avatar;
        
        // Сохраняем в базе данных
        if (Database && this.currentState.user.id) {
            Database.updateUser(this.currentState.user.id, { avatar: avatar });
        }
        
        // Обновляем UI
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            userAvatar.textContent = avatar;
        }
        
        // Показываем выбранный аватар
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.avatar === avatar) {
                option.classList.add('selected');
            }
        });
        
        showNotification('Успех', 'Аватар изменен', '#00ff9d');
    }
    
    // Скрыть модальное окно
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    // Показать экран
    showScreen(screen) {
        console.log('Показать экран:', screen);
        
        // Список всех контейнеров
        const containers = [
            'authContainer', 
            'roomContainer', 
            'codeContainer',
            'profileContainer',
            'menuContainer',
            'settingsContainer'
        ];
        
        // Скрываем все контейнеры
        containers.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });
        
        // Останавливаем интервалы если не на экране комнат
        if (screen !== 'room' && screen !== 'code') {
            if (this.playerListInterval) {
                clearInterval(this.playerListInterval);
                this.playerListInterval = null;
            }
            if (this.roomsUpdateInterval) {
                clearInterval(this.roomsUpdateInterval);
                this.roomsUpdateInterval = null;
            }
        }
        
        // Показываем нужный контейнер
        let containerId = '';
        switch(screen) {
            case 'auth': containerId = 'authContainer'; break;
            case 'room': containerId = 'roomContainer'; break;
            case 'code': containerId = 'codeContainer'; break;
            case 'profile': containerId = 'profileContainer'; break;
            case 'menu': containerId = 'menuContainer'; break;
            case 'settings': containerId = 'settingsContainer'; break;
            default: containerId = 'authContainer';
        }
        
        const container = document.getElementById(containerId);
        if (container) {
            container.style.display = 'block';
        }
        
        this.currentState.gameScreen = screen;
        
        // Обновляем данные на экране
        if (screen === 'room') {
            this.updateAvailableRooms();
            this.updateRecentRooms();
            
            // Запускаем обновление комнат
            if (this.roomsUpdateInterval) {
                clearInterval(this.roomsUpdateInterval);
            }
            this.roomsUpdateInterval = setInterval(() => {
                this.updateAvailableRooms();
                this.updateRecentRooms();
            }, 5000);
        } else if (screen === 'profile') {
            this.updateProfileInfo();
        } else if (screen === 'menu') {
            this.updateProfileInfo();
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, создаем GameManager...');
    
    // Скрываем загрузчик
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
    
    // Показываем основной контейнер
    const mainContainer = document.getElementById('mainContainer');
    if (mainContainer) {
        mainContainer.style.display = 'block';
    }
    
    // Создаем экземпляр GameManager
    try {
        game = new GameManager();
        window.game = game;
        console.log('GameManager создан успешно');
    } catch (error) {
        console.error('Ошибка создания GameManager:', error);
        
        // Показываем экран авторизации в любом случае
        const authContainer = document.getElementById('authContainer');
        if (authContainer) {
            authContainer.style.display = 'block';
        }
        
        // Простые обработчики для кнопок
        const quickStartBtn = document.getElementById('quickStartBtn');
        if (quickStartBtn) {
            quickStartBtn.addEventListener('click', () => {
                alert('Игра временно недоступна. Попробуйте перезагрузить страницу.');
            });
        }
    }
});

// Обработка ошибок загрузки
window.addEventListener('error', (e) => {
    console.error('Ошибка загрузки:', e);
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
    
    const authContainer = document.getElementById('authContainer');
    if (authContainer) {
        authContainer.style.display = 'block';
    }
});
