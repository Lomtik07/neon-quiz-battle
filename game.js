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
        for (
