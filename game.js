// game.js - Основная логика игры

class GameManager {
    constructor() {
        this.currentState = {
            user: null,
            currentRoom: null,
            gameScreen: 'auth', // auth, lobby, game, results
            playerName: 'Игрок',
            isHost: false,
            roomCode: null
        };
        
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
            this.createAccount();
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
    }
    
    // Быстрый старт (гостевой режим)
    quickStart() {
        this.currentState.user = Database.createUser(
            this.currentState.playerName,
            null // email = null для гостя
        );
        
        this.showScreen('room');
        showNotification('Гостевой режим', 'Создайте комнату или присоединитесь к существующей', '#ffaa00');
    }
    
    // Создание аккаунта
    createAccount() {
        const name = this.currentState.playerName;
        const email = prompt('Введите email (необязательно):', '');
        
        this.currentState.user = Database.createUser(name, email);
        
        this.showScreen('room');
        showNotification('Аккаунт создан!', 'Ваша статистика будет сохранена', '#00ff9d');
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
        
        const room = Database.createRoom(roomCode, hostName, hostId);
        
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
        const roomCode = document.getElementById('joinCodeInput').value.trim().toUpperCase();
        const playerName = this.currentState.playerName;
        const playerId = this.currentState.user ? this.currentState.user.id : null;
        
        if (roomCode.length !== 6) {
            showNotification('Ошибка', 'Код комнаты должен содержать 6 символов', '#ff5555');
            return;
        }
        
        const room = Database.findRoomByCode(roomCode);
        
        if (!room) {
            showNotification('Ошибка', 'Комната не найдена', '#ff5555');
            return;
        }
        
        if (room.players.length >= room.maxPlayers) {
            showNotification('Ошибка', 'В комнате нет свободных мест', '#ff5555');
            return;
        }
        
        const player = Database.addPlayerToRoom(roomCode, playerName, playerId);
        
        if (player) {
            this.currentState.currentRoom = room;
            this.currentState.roomCode = roomCode;
            this.currentState.isHost = false;
            
            this.showRoomCode(roomCode);
            Database.addRecentRoom(roomCode);
            
            showNotification('Успех!', `Вы присоединились к комнате ${roomCode}`, '#00ff9d');
        } else {
            showNotification('Ошибка', 'Не удалось присоединиться', '#ff5555');
        }
    }
    
    // Показать код комнаты
    showRoomCode(roomCode) {
        document.getElementById('roomCode').textContent = roomCode;
        this.showScreen('code');
        this.updatePlayerList();
        
        // Показываем кнопку "Начать игру" только для хоста
        document.getElementById('startGameBtn').style.display = 
            this.currentState.isHost ? 'block' : 'none';
        
        // Обновляем список игроков каждые 5 секунд
        this.playerListInterval = setInterval(() => {
            this.updatePlayerList();
        }, 5000);
    }
    
    // Обновление списка игроков
    updatePlayerList() {
        if (!this.currentState.roomCode) return;
        
        const room = Database.findRoomByCode(this.currentState.roomCode);
        if (room) {
            const playerCount = room.players.length;
            document.getElementById('playerCount').textContent = `Игроков: ${playerCount}/8`;
            
            // Если хост и есть минимум 2 игрока, показываем кнопку "Начать игру"
            if (this.currentState.isHost && playerCount >= 2) {
                document.getElementById('startGameBtn').style.display = 'block';
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
            Database.removePlayerFromRoom(
                this.currentState.roomCode, 
                this.currentState.user.id
            );
        }
        
        clearInterval(this.playerListInterval);
        this.currentState.currentRoom = null;
        this.currentState.roomCode = null;
        this.currentState.isHost = false;
        
        this.showScreen('room');
        showNotification('Выход', 'Вы покинули комнату', '#00f3ff');
    }
    
    // Копирование кода комнаты
    copyRoomCode() {
        const code = document.getElementById('roomCode').textContent;
        navigator.clipboard.writeText(code).then(() => {
            showNotification('Скопировано!', 'Код комнаты скопирован', '#00ff9d');
        }).catch(err => {
            showNotification('Ошибка', 'Не удалось скопировать код', '#ff5555');
        });
    }
    
    // Поделиться кодом
    shareRoomCode() {
        const code = document.getElementById('roomCode').textContent;
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
        const recentRooms = Database.getRecentRooms();
        const roomsList = document.getElementById('roomsList');
        
        if (recentRooms.length === 0) {
            roomsList.innerHTML = '<div class="room-item"><span class="room-info">Нет недавних комнат</span></div>';
            return;
        }
        
        roomsList.innerHTML = recentRooms.map(room => `
            <div class="room-item">
                <div>
                    <div class="room-code">${room.code}</div>
                    <div class="room-info">${room.players.length} игроков • Создана: ${new Date(room.createdAt).toLocaleTimeString()}</div>
                </div>
                <button class="join-room-btn" onclick="game.joinRecentRoom('${room.code}')">
                    Присоединиться
                </button>
            </div>
        `).join('');
    }
    
    // Присоединение к недавней комнате
    joinRecentRoom(roomCode) {
        document.getElementById('joinCodeInput').value = roomCode;
        this.joinRoom();
    }
    
    // Переключение экранов
    showScreen(screen) {
        const screens = ['auth', 'room', 'code', 'game'];
        
        screens.forEach(s => {
            document.getElementById(s + 'Container').style.display = 'none';
        });
        
        document.getElementById(screen + 'Container').style.display = 'block';
        
        if (screen === 'room') {
            this.updateRecentRooms();
        }
        
        this.currentState.gameScreen = screen;
    }
}

// Функция для показа уведомлений
function showNotification(title, text, color = '#00f3ff') {
    const notification = document.getElementById('notification');
    const titleEl = document.getElementById('notificationTitle');
    const textEl = document.getElementById('notificationText');
    
    if (!notification || !titleEl || !textEl) {
        console.log('Notification:', title, '-', text);
        return;
    }
    
    titleEl.textContent = title;
    textEl.textContent = text;
    notification.style.borderColor = color;
    notification.style.display = 'block';
    
    // Анимация появления
    notification.style.animation = 'none';
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out';
    }, 10);
    
    // Автоматическое скрытие
    setTimeout(() => {
        notification.style.display = 'none';
    }, 4000);
}

// Создаем глобальный экземпляр менеджера игры
const game = new GameManager();

// Экспортируем для использования в других файлах
if (typeof window !== 'undefined') {
    window.game = game;
    window.showNotification = showNotification;
    window.Database = Database; // Экспортируем базу данных
}

console.log('Game Manager инициализирован');
