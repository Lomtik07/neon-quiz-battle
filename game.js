// game.js - Основная логика игры

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
        
        // Инициализация
        this.init();
    }
    
    // Основная инициализация
    init() {
        // Загружаем пользователя
        this.loadSavedUser();
        
        // Инициализируем после загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            setTimeout(() => this.initialize(), 100);
        }
    }
    
    // Инициализация после DOM
    initialize() {
        console.log('Инициализация интерфейса...');
        
        // Настраиваем интерфейс
        this.loadUserPreferences();
        this.initializeEventListeners();
        this.updateNavBar();
        
        // Показываем нужный экран
        if (this.currentState.user) {
            this.showScreen('menu');
        } else {
            this.showScreen('auth');
        }
        
        // Скрываем загрузчик
        this.hideLoader();
        
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
    
    // Обновление навигационной панели
    updateNavBar() {
        const navbar = document.getElementById('navbar');
        const navUser = document.getElementById('navUser');
        const navUserName = document.getElementById('navUserName');
        const navUserAvatar = document.getElementById('navUserAvatar');
        
        if (this.currentState.user) {
            if (navbar) navbar.style.display = 'flex';
            if (navUserName) navUserName.textContent = this.currentState.user.username;
            if (navUserAvatar) {
                navUserAvatar.textContent = this.currentState.user.avatar || 
                                          this.currentState.user.username.charAt(0).toUpperCase();
            }
        } else {
            if (navbar) navbar.style.display = 'none';
        }
    }
    
    // Инициализация обработчиков событий
    initializeEventListeners() {
        console.log('Инициализация обработчиков...');
        
        // Авторизация
        this.setupButton('quickStartBtn', () => this.quickStart());
        this.setupButton('createAccountBtn', () => this.toggleAccountMode());
        this.setupButton('loginAccountBtn', () => this.loginAccount());
        this.setupButton('togglePassword', () => this.togglePasswordVisibility());
        
        // Пароль
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                this.checkPasswordStrength(e.target.value);
            });
        }
        
        // Комнаты
        this.setupButton('createRoomBtn', () => this.createRoom());
        this.setupButton('joinRoomBtn', () => this.joinRoom());
        this.setupButton('startGameBtn', () => this.startGame());
        this.setupButton('leaveRoomBtn', () => this.leaveRoom());
        this.setupButton('copyCodeBtn', () => this.copyRoomCode());
        this.setupButton('shareCodeBtn', () => this.shareRoomCode());
        
        // Enter для присоединения
        const joinCodeInput = document.getElementById('joinCodeInput');
        if (joinCodeInput) {
            joinCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.joinRoom();
            });
        }
        
        // Настройки игры
        const gameType = document.getElementById('gameType');
        if (gameType) {
            gameType.addEventListener('change', (e) => {
                this.updateGameType(e.target.value);
            });
        }
        
        console.log('Обработчики настроены');
    }
    
    // Настройка кнопки
    setupButton(buttonId, handler) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', handler);
        }
    }
    
    // Быстрый старт
    quickStart() {
        const nameInput = document.getElementById('playerNameInput');
        if (!nameInput) return;
        
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
            stats: { gamesPlayed: 0, gamesWon: 0, totalScore: 0, averageScore: 0, bestScore: 0, winRate: 0 }
        };
        
        this.currentState.user = guestUser;
        this.updateNavBar();
        this.showScreen('menu');
        
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
            createBtn.classList.remove('btn-secondary');
            createBtn.classList.add('btn-primary');
            
            if (loginBtn) {
                loginBtn.style.display = 'block';
                loginBtn.classList.remove('btn-secondary');
                loginBtn.classList.add('btn-primary');
            }
            if (emailGroup) emailGroup.style.display = 'block';
        } else {
            this.createAccount();
        }
    }
    
    // Создание аккаунта
    createAccount() {
        const nameInput = document.getElementById('playerNameInput');
        const passwordInput = document.getElementById('passwordInput');
        const emailInput = document.getElementById('emailInput');
        
        if (!nameInput || !passwordInput) return;
        
        const name = nameInput.value.trim();
        const password = passwordInput.value;
        const email = emailInput ? emailInput.value.trim() : '';
        
        if (!name) {
            showNotification('Ошибка', 'Введите имя игрока', '#ff5555');
            return;
        }
        
        if (!password || password.length < 6) {
            showNotification('Ошибка', 'Пароль должен содержать минимум 6 символов', '#ff5555');
            return;
        }
        
        // Проверяем существование пользователя
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
            id: 'user_' + Date.now(),
            username: name,
            password: password,
            email: email || null,
            createdAt: new Date().toISOString(),
            isGuest: false,
            avatar: name.charAt(0).toUpperCase(),
            stats: { gamesPlayed: 0, gamesWon: 0, totalScore: 0, averageScore: 0, bestScore: 0, winRate: 0 }
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
        
        this.updateNavBar();
        this.showScreen('menu');
        showNotification('Аккаунт создан!', 'Ваша статистика будет сохранена', '#00ff9d');
        
        this.resetAuthForm();
    }
    
    // Вход в аккаунт
    loginAccount() {
        const passwordInput = document.getElementById('passwordInput');
        const nameInput = document.getElementById('playerNameInput');
        
        if (!passwordInput || !nameInput) return;
        
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
        
        // Ищем пользователя
        let user = null;
        if (Database && Database.data && Database.data.users) {
            user = Database.data.users.find(u => u.username === name && u.password === password);
        }
        
        if (user) {
            this.currentState.user = user;
            this.currentState.playerName = user.username;
            localStorage.setItem('last_user_id', user.id);
            localStorage.setItem('quiz_player_name', user.username);
            
            this.updateNavBar();
            this.showScreen('menu');
            showNotification('Успешный вход!', `Добро пожаловать, ${name}!`, '#00ff9d');
        } else {
            showNotification('Ошибка', 'Неверное имя пользователя или пароль', '#ff5555');
        }
    }
    
    // Обновление типа игры
    updateGameType(type) {
        const contentSelectLabel = document.getElementById('contentSelectLabel');
        const contentSelect = document.getElementById('contentSelect');
        
        if (contentSelectLabel && contentSelect) {
            if (type === 'quiz') {
                contentSelectLabel.innerHTML = '<i class="fas fa-list"></i> Выберите викторину:';
                contentSelect.innerHTML = `
                    <option value="random">Случайная викторина</option>
                    <option value="my">Мои викторины</option>
                    <option value="public">Публичные викторины</option>
                `;
            } else {
                contentSelectLabel.innerHTML = '<i class="fas fa-poll"></i> Выберите опрос:';
                contentSelect.innerHTML = `
                    <option value="my">Мои опросы</option>
                    <option value="public">Публичные опросы</option>
                `;
            }
        }
    }
    
    // Создание комнаты
    createRoom() {
        const roomCode = this.generateRoomCode();
        const hostName = this.currentState.playerName;
        const hostId = this.currentState.user ? this.currentState.user.id : null;
        
        let room = null;
        if (Database) {
            room = Database.createRoom(roomCode, hostName, hostId);
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
        
        // Кнопка начала игры
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
            startGameBtn.style.display = this.currentState.isHost ? 'block' : 'none';
        }
        
        // Обновление списка игроков
        if (this.playerListInterval) {
            clearInterval(this.playerListInterval);
        }
        
        this.playerListInterval = setInterval(() => {
            this.updatePlayerList();
        }, 3000);
        
        this.updatePlayerList();
    }
    
    // Обновление списка игроков
    updatePlayerList() {
        if (!this.currentState.roomCode) return;
        
        let room = null;
        if (Database) {
            room = Database.findRoomByCode(this.currentState.roomCode);
        }
        
        if (room) {
            const playerCount = room.players ? room.players.length : 1;
            const playerCountElement = document.getElementById('playerCount');
            if (playerCountElement) {
                playerCountElement.textContent = `Игроков: ${playerCount}/8`;
            }
            
            // Список игроков
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
            
            // Кнопка начала игры
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
        
        setTimeout(() => {
            showNotification('В разработке', 'Игровой процесс в разработке', '#ffaa00');
        }, 2000);
    }
    
    // Покинуть комнату
    leaveRoom() {
        if (this.currentState.roomCode && this.currentState.user) {
            if (Database) {
                Database.removePlayerFromRoom(this.currentState.roomCode, this.currentState.user.id);
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
            roomsList.innerHTML = '<div class="room-item"><span class="room-info">Нет доступных комнат</span></div>';
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
            
            const joinBtn = roomItem.querySelector('.join-room-btn');
            if (joinBtn) {
                joinBtn.addEventListener('click', () => {
                    this.joinExistingRoom(room.code);
                });
            }
        });
    }
    
    // Показать профиль
    showProfile() {
        this.showScreen('profile');
        this.updateProfileInfo();
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
    
    // Выход из системы
    logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            this.currentState.user = null;
            localStorage.removeItem('last_user_id');
            this.updateNavBar();
            this.showScreen('auth');
            this.resetAuthForm();
            showNotification('Выход', 'Вы вышли из системы', '#00f3ff');
        }
    }
    
    // Смена имени
    changeUsername() {
        document.getElementById('usernameModal').style.display = 'flex';
        const newUsernameInput = document.getElementById('newUsername');
        if (newUsernameInput) {
            newUsernameInput.value = this.currentState.playerName;
            newUsernameInput.focus();
        }
    }
    
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
        
        localStorage.setItem('quiz_player_name', newUsername);
        
        if (Database && this.currentState.user.id) {
            Database.updateUser(this.currentState.user.id, { username: newUsername });
        }
        
        this.updateProfileInfo();
        this.updateNavBar();
        this.hideModal('usernameModal');
        
        showNotification('Успех', 'Имя изменено', '#00ff9d');
    }
    
    // Смена аватара
    changeAvatar() {
        document.getElementById('avatarModal').style.display = 'flex';
        this.loadAvatarOptions();
    }
    
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
    
    selectAvatar(avatar) {
        this.currentState.user.avatar = avatar;
        
        if (Database && this.currentState.user.id) {
            Database.updateUser(this.currentState.user.id, { avatar: avatar });
        }
        
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            userAvatar.textContent = avatar;
        }
        
        this.updateNavBar();
        
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
        
        // Скрываем все экраны
        const screens = ['authContainer', 'menuContainer', 'roomContainer', 'codeContainer', 'profileContainer', 'settingsContainer'];
        screens.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.remove('active');
                element.style.display = 'none';
            }
        });
        
        // Показываем нужный экран
        let screenId = '';
        switch(screen) {
            case 'auth': screenId = 'authContainer'; break;
            case 'menu': screenId = 'menuContainer'; break;
            case 'room': screenId = 'roomContainer'; break;
            case 'code': screenId = 'codeContainer'; break;
            case 'profile': screenId = 'profileContainer'; break;
            case 'settings': screenId = 'settingsContainer'; break;
            default: screenId = 'authContainer';
        }
        
        const screenElement = document.getElementById(screenId);
        if (screenElement) {
            screenElement.style.display = 'block';
            screenElement.classList.add('active');
        }
        
        this.currentState.gameScreen = screen;
        
        // Обновляем данные на экране
        if (screen === 'room') {
            this.updateAvailableRooms();
            this.updateRecentRooms();
            
            if (this.roomsUpdateInterval) {
                clearInterval(this.roomsUpdateInterval);
            }
            this.roomsUpdateInterval = setInterval(() => {
                this.updateAvailableRooms();
                this.updateRecentRooms();
            }, 5000);
        } else if (screen === 'profile') {
            this.updateProfileInfo();
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
    
    // Скрыть загрузчик
    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }
}

// Инициализация при загрузке
window.addEventListener('load', () => {
    console.log('Загрузка завершена...');
    
    // Создаем GameManager
    try {
        game = new GameManager();
        window.game = game;
        console.log('GameManager создан');
    } catch (error) {
        console.error('Ошибка создания GameManager:', error);
        
        // Показываем экран авторизации
        const authContainer = document.getElementById('authContainer');
        if (authContainer) {
            authContainer.style.display = 'block';
            authContainer.classList.add('active');
        }
        
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }
});
