// game.js - Основная логика игры

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
        this.initializeEventListeners();
        this.loadUserPreferences();
    }
    
    // Загрузка предпочтений пользователя
    loadUserPreferences() {
        const savedName = localStorage.getItem('quiz_player_name');
        if (savedName) {
            this.currentState.playerName = savedName;
            document.getElementById('playerNameInput').value = savedName;
        }
    }
    
    // Сохранение имени игрока
    savePlayerName() {
        const name = document.getElementById('playerNameInput').value.trim();
        if (name) {
            this.currentState.playerName = name;
            localStorage.setItem('quiz_player_name', name);
        }
    }
    
    // Инициализация обработчиков событий
    initializeEventListeners() {
        // Быстрый старт
        document.getElementById('quickStartBtn').addEventListener('click', () => {
            this.savePlayerName();
            this.quickStart();
        });
        
        // Создание аккаунта
        document.getElementById('createAccountBtn').addEventListener('click', () => {
            this.savePlayerName();
            this.toggleAccountMode();
        });
        
        // Вход в аккаунт
        document.getElementById('loginAccountBtn').addEventListener('click', () => {
            this.savePlayerName();
            this.loginAccount();
        });
        
        // Переключение видимости пароля
        document.getElementById('togglePassword').addEventListener('click', () => {
            this.togglePasswordVisibility();
        });
        
        // Проверка сложности пароля
        document.getElementById('passwordInput').addEventListener('input', (e) => {
            this.checkPasswordStrength(e.target.value);
        });
        
        // Создание комнаты
        document.getElementById('createRoomBtn').addEventListener('click', () => {
            this.createRoom();
        });
        
        // Присоединение к комнате
        document.getElementById('joinRoomBtn').addEventListener('click', () => {
            this.joinRoom();
        });
        
        // Начать игру
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        // Покинуть комнату
        document.getElementById('leaveRoomBtn').addEventListener('click', () => {
            this.leaveRoom();
        });
        
        // Копировать код
        document.getElementById('copyCodeBtn').addEventListener('click', () => {
            this.copyRoomCode();
        });
        
        // Поделиться кодом
        document.getElementById('shareCodeBtn').addEventListener('click', () => {
            this.shareRoomCode();
        });
        
        // Enter для присоединения
        document.getElementById('joinCodeInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinRoom();
            }
        });
        
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
    }
    
    // Переключение режима аккаунта
    toggleAccountMode() {
        const createBtn = document.getElementById('createAccountBtn');
        const loginBtn = document.getElementById('loginAccountBtn');
        const emailGroup = document.getElementById('emailGroup');
        
        if (createBtn && createBtn.textContent.includes('СОЗДАТЬ')) {
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
                averageScore: 0
            }
        };
        
        this.currentState.user = guestUser;
        this.showMainMenu();
        
        showNotification('Гостевой режим', 'Для сохранения статистики создайте аккаунт', '#ffaa00');
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
        const roomsList = document.getElementById('roomsList');
        if (!roomsList) return;
        
        let recentRooms = [];
        if (Database) {
            recentRooms = Database.getRecentRooms();
        }
        
        if (recentRooms.length === 0) {
            roomsList.innerHTML = '<div class="room-item"><span class="room-info">Нет недавних комнат</span></div>';
            return;
