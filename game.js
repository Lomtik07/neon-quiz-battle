// game.js - Основная логика игры (оптимизированная)

// Глобальные переменные
let game = null;
let Database = window.Database;

// Функция для показа уведомлений (дублируем для надежности)
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
        
        // Инициализируем обработчики после полной загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            setTimeout(() => this.initialize(), 100);
        }
    }
    
    // Основная инициализация
    initialize() {
        console.log('Начало инициализации...');
        this.loadUserPreferences();
        this.initializeEventListeners();
        
        // Показываем экран в зависимости от состояния
        if (this.currentState.user) {
            setTimeout(() => this.showMainMenu(), 100);
        } else {
            setTimeout(() => this.showScreen('auth'), 100);
        }
        
        console.log('GameManager инициализирован');
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
        const nameInput = document.getElementById('playerNameInput');
        if (nameInput && this.currentState.playerName) {
            nameInput.value = this.currentState.playerName;
        }
    }
    
    // Инициализация обработчиков событий
    initializeEventListeners() {
        console.log('Инициализация обработчиков...');
        
        // Быстрый старт
        const quickStartBtn = document.getElementById('quickStartBtn');
        if (quickStartBtn) {
            quickStartBtn.addEventListener('click', () => this.quickStart());
        }
        
        // Создание аккаунта
        const createAccountBtn = document.getElementById('createAccountBtn');
        if (createAccountBtn) {
            createAccountBtn.addEventListener('click', () => this.toggleAccountMode());
        }
        
        // Вход в аккаунт
        const loginAccountBtn = document.getElementById('loginAccountBtn');
        if (loginAccountBtn) {
            loginAccountBtn.addEventListener('click', () => this.loginAccount());
        }
        
        // Переключение видимости пароля
        const togglePasswordBtn = document.getElementById('togglePassword');
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', () => this.togglePasswordVisibility());
        }
        
        // Проверка сложности пароля
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                this.checkPasswordStrength(e.target.value);
            });
        }
        
        // Создание комнаты
        const createRoomBtn = document.getElementById('createRoomBtn');
        if (createRoomBtn) {
            createRoomBtn.addEventListener('click', () => this.createRoom());
        }
        
        // Присоединение к комнате
        const joinRoomBtn = document.getElementById('joinRoomBtn');
        if (joinRoomBtn) {
            joinRoomBtn.addEventListener('click', () => this.joinRoom());
        }
        
        // Начать игру
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => this.startGame());
        }
        
        // Покинуть комнату
        const leaveRoomBtn = document.getElementById('leaveRoomBtn');
        if (leaveRoomBtn) {
            leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        }
        
        // Копировать код
        const copyCodeBtn = document.getElementById('copyCodeBtn');
        if (copyCodeBtn) {
            copyCodeBtn.addEventListener('click', () => this.copyRoomCode());
        }
        
        // Поделиться кодом
        const shareCodeBtn = document.getElementById('shareCodeBtn');
        if (shareCodeBtn) {
            shareCodeBtn.addEventListener('click', () => this.shareRoomCode());
        }
        
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
        const profileBtn = document.getElementById('profileBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (profileBtn) {
            profileBtn.addEventListener('click', () => this.showScreen('profile'));
        }
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showScreen('settings'));
        }
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Мои опросы
        const myQuizzesBtn = document.getElementById('myQuizzesBtn');
        if (myQuizzesBtn) {
            myQuizzesBtn.addEventListener('click', () => {
                showNotification('Информация', 'Функция будет доступна после загрузки Quiz Manager', '#00f3ff');
            });
        }
        
        // Меню
        this.setupMenuHandlers();
        
        console.log('Обработчики инициализированы');
    }
    
    // Настройка обработчиков меню
    setupMenuHandlers() {
        const menuCards = document.querySelectorAll('.menu-card');
        menuCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const title = card.querySelector('.menu-title')?.textContent.trim();
                
                switch(title) {
                    case 'ИГРАТЬ':
                        this.showScreen('room');
                        break;
                    case 'ПРОФИЛЬ':
                        this.showScreen('profile');
                        break;
                    case 'СОЗДАТЬ ВИКТОРИНУ':
                        showNotification('Информация', 'Создание викторин скоро будет доступно', '#00f3ff');
                        break;
                    case 'ТАБЛИЦА ЛИДЕРОВ':
                        this.showLeaderboard();
                        break;
                    case 'МОИ ВИКТОРИНЫ':
                        showNotification('Информация', 'Мои викторины скоро будут доступны', '#00f3ff');
                        break;
                    case 'НАСТРОЙКИ':
                        this.showScreen('settings');
                        break;
                }
            });
        });
    }
    
    // Сохранение имени игрока
    savePlayerName() {
        const nameInput = document.getElementById('playerNameInput');
        if (nameInput) {
            const name = nameInput.value.trim();
            if (name) {
                this.currentState.playerName = name;
                localStorage.setItem('quiz_player_name', name);
                return true;
            }
        }
        return false;
    }
    
    // Быстрый старт (гостевой режим)
    quickStart() {
        if (!this.savePlayerName()) {
            showNotification('Ошибка', 'Введите имя игрока', '#ff5555');
            return;
        }
        
        const guestUser = {
            id: 'guest_' + Date.now(),
            username: this.currentState.playerName,
            isGuest: true,
            avatar: this.currentState.playerName.charAt(0).toUpperCase(),
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
        const createBtn = document.getElementById('createAccountBtn');
        const loginBtn = document.getElementById('loginAccountBtn');
        const emailGroup = document.getElementById('emailGroup');
        
        if (!createBtn) return;
        
        if (createBtn.textContent.includes('СОЗДАТЬ')) {
            createBtn.innerHTML = '<i class="fas fa-check"></i> ПОДТВЕРДИТЬ';
            if (loginBtn) loginBtn.style.display = 'block';
            if (emailGroup) emailGroup.style.display = 'block';
        } else {
            this.createAccount();
        }
    }
    
    // Создание аккаунта
    createAccount() {
        if (!this.savePlayerName()) {
            showNotification('Ошибка', 'Введите имя игрока', '#ff5555');
            return;
        }
        
        const passwordInput = document.getElementById('passwordInput');
        const emailInput = document.getElementById('emailInput');
        
        if (!passwordInput) return;
        
        const password = passwordInput.value;
        const email = emailInput ? emailInput.value : '';
        
        if (!password || password.length < 6) {
            showNotification('Ошибка', 'Пароль должен содержать минимум 6 символов', '#ff5555');
            return;
        }
        
        // Проверяем, существует ли пользователь
        let existingUser = null;
        if (Database && Database.data && Database.data.users) {
            existingUser = Database.data.users.find(u => u.username === this.currentState.playerName);
        }
        
        if (existingUser) {
            showNotification('Ошибка', 'Пользователь с таким именем уже существует', '#ff5555');
            return;
        }
        
        // Создаем пользователя
        const user = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            username: this.currentState.playerName,
            password: password,
            email: email || null,
            createdAt: new Date().toISOString(),
            isGuest: false,
            avatar: this.currentState.playerName.charAt(0).toUpperCase(),
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
        localStorage.setItem('last_user_id', user.id);
        this.showMainMenu();
        
        showNotification('Аккаунт создан!', 'Ваша статистика будет сохранена', '#00ff9d');
        this.resetAuthForm();
    }
    
    // Вход в аккаунт
    loginAccount() {
        if (!this.savePlayerName()) {
            showNotification('Ошибка', 'Введите имя игрока', '#ff5555');
            return;
        }
        
        const passwordInput = document.getElementById('passwordInput');
        if (!passwordInput) return;
        
        const password = passwordInput.value;
        const name = this.currentState.playerName;
        
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
            localStorage.setItem('last_user_id', user.id);
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
        
        if (createBtn) createBtn.innerHTML = '<i class="fas fa-user-plus"></i> СОЗДАТЬ АККАУНТ';
        if (loginBtn) loginBtn.style.display = 'none';
        if (emailGroup) emailGroup.style.display = 'none';
        if (passwordInput) passwordInput.value = '';
        if (emailInput) emailInput.value = '';
        if (strengthDiv) strengthDiv.className = 'password-strength';
    }
    
    // Показать главное меню
    showMainMenu() {
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
        document.getElementById('gamesPlayed').textContent = stats.gamesPlayed || 0;
        document.getElementById('gamesWon').textContent = stats.gamesWon || 0;
        document.getElementById('totalScore').textContent = stats.totalScore || 0;
        document.getElementById('statGamesPlayed').textContent = stats.gamesPlayed || 0;
        document.getElementById('statGamesWon').textContent = stats.gamesWon || 0;
        document.getElementById('statTotalScore').textContent = stats.totalScore || 0;
        document.getElementById('statAverageScore').textContent = stats.averageScore || 0;
        document.getElementById('statBestScore').textContent = stats.bestScore || 0;
        document.getElementById('statWinRate').textContent = (stats.winRate || 0) + '%';
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
        } else {
            showNotification('Ошибка', 'Не удалось создать комнату', '#ff5555');
        }
    }
    
    // Присоединение к комнате
    joinRoom() {
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
                        <div class="player-avatar">${player.avatar}</div>
                        <div class="player-name">${player.name} ${player.isHost ? '👑' : ''}</div>
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
        });
        
        // Добавляем обработчики для кнопок
        document.querySelectorAll('.join-room-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const roomCode = e.target.closest('button').dataset.room;
                this.joinExistingRoom(roomCode);
            });
        });
    }
    
    // Присоединение к существующей комнате
    joinExistingRoom(roomCode) {
        this.joinRoomWithCode(roomCode);
    }
    
    joinRoomWithCode(roomCode) {
        const joinCodeInput = document.getElementById('joinCodeInput');
        if (joinCodeInput) {
            joinCodeInput.value = roomCode;
        }
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
        });
        
        // Добавляем обработчики для кнопок входа
        document.querySelectorAll('.join-room-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const roomCode = e.target.closest('button').dataset.room;
                this.joinExistingRoom(roomCode);
            });
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
        document.getElementById('usernameModal').style.display = 'flex';
        const newUsernameInput = document.getElementById('newUsername');
        if (newUsernameInput) {
            newUsernameInput.value = this.currentState.playerName;
            newUsernameInput.focus();
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
        document.getElementById('avatarModal').style.display = 'flex';
        this.loadAvatarOptions();
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
        document.getElementById(modalId).style.display = 'none';
    }
    
    // Показать экран
    showScreen(screen) {
        // Скрываем все контейнеры
        const containers = [
            'authContainer', 
            'roomContainer', 
            'codeContainer',
            'profileContainer',
            'menuContainer',
            'settingsContainer'
        ];
        
        containers.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
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

// Инициализация при полной загрузке
window.addEventListener('load', () => {
    console.log('Загрузка завершена, инициализация GameManager...');
    
    // Скрываем загрузчик
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
    
    // Создаем экземпляр GameManager
    game = new GameManager();
    window.game = game;
    
    console.log('Neon Quiz Battle готов!');
});
