// game.js - Основная логика игры

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
    
    // Автоматически скрыть через 5 секунд
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

class GameManager {
    constructor() {
        this.currentState = {
            user: null,
            currentRoom: null,
            gameScreen: 'auth', // auth, room, code, menu, profile, settings
            playerName: 'Игрок',
            isHost: false,
            roomCode: null
        };
        
        this.playerListInterval = null;
        this.roomsUpdateInterval = null;
        
        // Загружаем пользователя из localStorage
        this.loadSavedUser();
        this.initializeEventListeners();
        this.loadUserPreferences();
    }
    
    // Загрузка сохраненного пользователя
    loadSavedUser() {
        try {
            const savedName = localStorage.getItem('quiz_player_name');
            if (savedName) {
                this.currentState.playerName = savedName;
            }
            
            const lastUserId = localStorage.getItem('last_user_id');
            if (lastUserId && Database) {
                const user = Database.findUserById(lastUserId);
                if (user) {
                    this.currentState.user = user;
                    this.currentState.playerName = user.username;
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
    
    // Сохранение имени игрока
    savePlayerName() {
        const nameInput = document.getElementById('playerNameInput');
        if (nameInput) {
            const name = nameInput.value.trim();
            if (name) {
                this.currentState.playerName = name;
                localStorage.setItem('quiz_player_name', name);
            }
        }
    }
    
    // Инициализация обработчиков событий
    initializeEventListeners() {
        // Быстрый старт
        const quickStartBtn = document.getElementById('quickStartBtn');
        if (quickStartBtn) {
            quickStartBtn.addEventListener('click', () => {
                this.savePlayerName();
                this.quickStart();
            });
        }
        
        // Создание аккаунта
        const createAccountBtn = document.getElementById('createAccountBtn');
        if (createAccountBtn) {
            createAccountBtn.addEventListener('click', () => {
                this.savePlayerName();
                this.toggleAccountMode();
            });
        }
        
        // Вход в аккаунт
        const loginAccountBtn = document.getElementById('loginAccountBtn');
        if (loginAccountBtn) {
            loginAccountBtn.addEventListener('click', () => {
                this.savePlayerName();
                this.loginAccount();
            });
        }
        
        // Переключение видимости пароля
        const togglePasswordBtn = document.getElementById('togglePassword');
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', () => {
                this.togglePasswordVisibility();
            });
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
            createRoomBtn.addEventListener('click', () => {
                this.createRoom();
            });
        }
        
        // Присоединение к комнате
        const joinRoomBtn = document.getElementById('joinRoomBtn');
        if (joinRoomBtn) {
            joinRoomBtn.addEventListener('click', () => {
                this.joinRoom();
            });
        }
        
        // Начать игру
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => {
                this.startGame();
            });
        }
        
        // Покинуть комнату
        const leaveRoomBtn = document.getElementById('leaveRoomBtn');
        if (leaveRoomBtn) {
            leaveRoomBtn.addEventListener('click', () => {
                this.leaveRoom();
            });
        }
        
        // Копировать код
        const copyCodeBtn = document.getElementById('copyCodeBtn');
        if (copyCodeBtn) {
            copyCodeBtn.addEventListener('click', () => {
                this.copyRoomCode();
            });
        }
        
        // Поделиться кодом
        const shareCodeBtn = document.getElementById('shareCodeBtn');
        if (shareCodeBtn) {
            shareCodeBtn.addEventListener('click', () => {
                this.shareRoomCode();
            });
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
            profileBtn.addEventListener('click', () => {
                this.showScreen('profile');
            });
        }
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showScreen('settings');
            });
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
        
        // Обработчики для меню
        this.setupMenuHandlers();
    }
    
    // Настройка обработчиков меню
    setupMenuHandlers() {
        // Меню на главном экране
        document.addEventListener('click', (e) => {
            const target = e.target.closest('.menu-card');
            if (!target) return;
            
            e.preventDefault();
            
            // Находим текст в меню-тайтле
            const titleElement = target.querySelector('.menu-title');
            if (!titleElement) return;
            
            const title = titleElement.textContent.trim();
            
            switch(title) {
                case 'ИГРАТЬ':
                case 'Быстрая игра':
                    this.showScreen('room');
                    break;
                case 'ПРОФИЛЬ':
                    this.showScreen('profile');
                    break;
                case 'СОЗДАТЬ ОПРОС':
                case 'Создать опрос':
                    this.createQuiz();
                    break;
                case 'ТАБЛИЦА ЛИДЕРОВ':
                case 'Статистика':
                    this.showLeaderboard();
                    break;
                case 'ДРУЗЬЯ':
                case 'Друзья':
                    this.showFriends();
                    break;
                case 'НАСТРОЙКИ':
                    this.showScreen('settings');
                    break;
            }
        });
        
        // Кнопка назад в профиле
        const backBtn = document.querySelector('.btn[onclick*="game.showScreen"]');
        if (backBtn) {
            const oldOnClick = backBtn.getAttribute('onclick');
            backBtn.removeAttribute('onclick');
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showScreen('menu');
            });
        }
        
        // Кнопка сохранения в настройках
        const saveSettingsBtn = document.querySelector('.btn[onclick*="game.showScreen(\'menu\')"]');
        if (saveSettingsBtn) {
            const oldOnClick = saveSettingsBtn.getAttribute('onclick');
            saveSettingsBtn.removeAttribute('onclick');
            saveSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }
    }
    
    // Переключение режима аккаунта
    toggleAccountMode() {
        const createBtn = document.getElementById('createAccountBtn');
        const loginBtn = document.getElementById('loginAccountBtn');
        const emailGroup = document.getElementById('emailGroup');
        
        if (!createBtn) return;
        
        if (createBtn.textContent.includes('СОЗДАТЬ')) {
            // Переключаемся на режим создания аккаунта
            createBtn.innerHTML = '<i class="fas fa-check"></i> ПОДТВЕРДИТЬ';
            if (loginBtn) loginBtn.style.display = 'block';
            if (emailGroup) emailGroup.style.display = 'block';
        } else {
            // Создаем аккаунт
            this.createAccount();
        }
    }
    
    // Вход в аккаунт
    loginAccount() {
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
            this.hideLoader();
            this.showMainMenu();
            showNotification('Успешный вход!', `Добро пожаловать, ${name}!`, '#00ff9d');
        } else {
            showNotification('Ошибка', 'Неверное имя пользователя или пароль', '#ff5555');
        }
    }
    
    // Создание аккаунта с паролем
    createAccount() {
        const name = this.currentState.playerName;
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
            existingUser = Database.data.users.find(u => u.username === name);
        }
        
        if (existingUser) {
            showNotification('Ошибка', 'Пользователь с таким именем уже существует', '#ff5555');
            return;
        }
        
        // Создаем пользователя с паролем
        const user = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            username: name,
            password: password,
            email: email || null,
            createdAt: new Date().toISOString(),
            isGuest: false,
            stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                totalScore: 0,
                averageScore: 0,
                bestScore: 0
            }
        };
        
        if (Database) {
            if (!Database.data.users) Database.data.users = [];
            Database.data.users.push(user);
            Database.save();
        }
        
        this.currentState.user = user;
        localStorage.setItem('last_user_id', user.id);
        this.hideLoader();
        this.showMainMenu();
        
        showNotification('Аккаунт создан!', 'Ваша статистика будет сохранена', '#00ff9d');
        
        // Сбрасываем форму
        this.resetAuthForm();
    }
    
    // Быстрый старт (гостевой режим)
    quickStart() {
        this.hideLoader();
        
        const guestUser = {
            id: 'guest_' + Date.now(),
            username: this.currentState.playerName,
            isGuest: true,
            stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                totalScore: 0,
                averageScore: 0,
                bestScore: 0
            }
        };
        
        this.currentState.user = guestUser;
        this.showMainMenu();
        
        showNotification('Гостевой режим', 'Для сохранения статистики создайте аккаунт', '#ffaa00');
    }
    
    // Показать главное меню
    showMainMenu() {
        this.hideLoader();
        this.showScreen('menu');
        this.updateProfileInfo();
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.style.display = 'block';
        
        // Запускаем обновление списка комнат
        this.startRoomsUpdate();
    }
    
    // Обновление информации профиля
    updateProfileInfo() {
        if (!this.currentState.user) return;
        
        const user = this.currentState.user;
        
        // Аватар
        const avatar = document.getElementById('userAvatar');
        if (avatar) {
            avatar.textContent = user.username.charAt(0).toUpperCase();
        }
        
        // Имя
        const displayName = document.getElementById('userDisplayName');
        if (displayName) {
            displayName.textContent = user.username;
        }
        
        // Email
        const emailEl = document.getElementById('userEmail');
        if (emailEl) {
            emailEl.textContent = user.email || 'Гостевой аккаунт';
            emailEl.style.color = user.isGuest ? '#ffaa00' : '#aaa';
        }
        
        // Статистика
        const gamesPlayed = document.getElementById('gamesPlayed');
        const gamesWon = document.getElementById('gamesWon');
        const totalScore = document.getElementById('totalScore');
        
        if (gamesPlayed) gamesPlayed.textContent = user.stats?.gamesPlayed || 0;
        if (gamesWon) gamesWon.textContent = user.stats?.gamesWon || 0;
        if (totalScore) totalScore.textContent = user.stats?.totalScore || 0;
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
        
        // Проверки
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
    
    // Показать загрузчик
    showLoader() {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'flex';
    }
    
    // Скрыть загрузчик
    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
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
            // Fallback если Database не доступен
            room = {
                code: roomCode,
                hostId: hostId,
                hostName: hostName,
                players: [{
                    id: hostId || 'guest_' + Date.now(),
                    name: hostName,
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
        
        // Обновляем список игроков каждые 5 секунд
        if (this.playerListInterval) {
            clearInterval(this.playerListInterval);
        }
        
        this.playerListInterval = setInterval(() => {
            this.updatePlayerList();
        }, 5000);
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
        
        // Здесь будет логика начала игры
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
                this.copyRoomCode(); // Fallback
            });
        } else {
            this.copyRoomCode();
        }
    }
    
    // Обновление списка недавних комнат
    updateRecentRooms() {
        const recentRoomsContainer = document.querySelector('.recent-rooms');
        if (!recentRoomsContainer) return;
        
        let recentRooms = [];
        if (Database) {
            recentRooms = Database.getRecentRooms();
        }
        
        const roomsList = recentRoomsContainer.querySelector('#roomsList');
        if (!roomsList) return;
        
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
        setTimeout(() => {
            document.querySelectorAll('.join-room-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const roomCode = e.target.closest('button').dataset.room;
                    this.joinExistingRoom(roomCode);
                });
            });
        }, 100);
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
                    <span class="room-code">-</span>
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
                        Создатель: ${room.hostName} | Игроков: ${playerCount}/${maxPlayers} | Тема: ${room.theme}
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
    
    // Присоединение к существующей комнате
    joinExistingRoom(roomCode) {
        if (!roomCode) return;
        
        const playerName = this.currentState.playerName;
        const playerId = this.currentState.user ? this.currentState.user.id : null;
        
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
    
    // Запуск обновления списка комнат
    startRoomsUpdate() {
        if (this.roomsUpdateInterval) {
            clearInterval(this.roomsUpdateInterval);
        }
        
        this.roomsUpdateInterval = setInterval(() => {
            if (this.currentState.gameScreen === 'room') {
                this.updateAvailableRooms();
                this.updateRecentRooms();
            }
        }, 5000);
    }
    
    // Создание викторины
    createQuiz() {
        showNotification('В разработке', 'Создание собственных опросов скоро будет доступно!', '#ffaa00');
    }
    
    // Показать статистику
    showStats() {
        this.showScreen('profile');
    }
    
    // Показать друзей
    showFriends() {
        showNotification('В разработке', 'Система друзей скоро будет доступна!', '#ffaa00');
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
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle && this.currentState.user && Database) {
            const settings = {
                soundEnabled: soundToggle.checked
            };
            Database.saveSettings(this.currentState.user.id, settings);
            showNotification('Настройки сохранены', 'Ваши настройки были успешно сохранены', '#00ff9d');
        }
        this.showScreen('menu');
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
        
        // Останавливаем обновление комнат если не на экране комнат
        if (screen !== 'room' && this.roomsUpdateInterval) {
            clearInterval(this.roomsUpdateInterval);
            this.roomsUpdateInterval = null;
        }
        
        // Показываем нужный контейнер
        const containerId = screen === 'room' ? 'roomContainer' : 
                           screen === 'code' ? 'codeContainer' :
                           screen === 'profile' ? 'profileContainer' :
                           screen === 'menu' ? 'menuContainer' :
                           screen === 'settings' ? 'settingsContainer' :
                           'authContainer';
        
        const container = document.getElementById(containerId);
        if (container) {
            container.style.display = 'block';
        }
        
        this.currentState.gameScreen = screen;
        
        // Обновляем данные на экране
        if (screen === 'room') {
            this.updateAvailableRooms();
            this.updateRecentRooms();
            this.startRoomsUpdate();
        } else if (screen === 'profile') {
            this.updateProfileInfo();
        } else if (screen === 'menu') {
            this.updateProfileInfo();
        }
    }
}

// Создаем глобальный экземпляр GameManager
const game = new GameManager();

// Скрываем загрузчик при полной загрузке страницы
window.addEventListener('load', () => {
    game.hideLoader();
    
    // Если есть сохраненный пользователь, показываем главное меню
    if (game.currentState.user) {
        game.showMainMenu();
    }
    
    console.log('Neon Quiz Battle инициализирован!');
});

// Добавляем обработчики для ошибок загрузки
window.addEventListener('error', (e) => {
    console.error('Ошибка загрузки:', e);
    game.hideLoader();
    showNotification('Ошибка', 'Произошла ошибка при загрузке игры', '#ff5555');
});
