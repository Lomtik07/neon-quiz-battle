// db.js - Локальная база данных на LocalStorage

class LocalDatabase {
    constructor() {
        this.key = 'neon_quiz_battle_data';
        this.data = {
            users: [],
            rooms: [],
            quizzes: [],
            statistics: {},
            settings: {},
            recentRooms: []
        };
        
        this.load();
    }
    
    // Загрузка данных из LocalStorage
    load() {
        try {
            const saved = localStorage.getItem(this.key);
            if (saved) {
                this.data = JSON.parse(saved);
                console.log('Данные загружены из LocalStorage');
            } else {
                this.createDefaultUsers();
                this.createDefaultQuizzes();
            }
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.createDefaultUsers();
            this.createDefaultQuizzes();
            this.save();
        }
    }
    
    // Создание тестовых пользователей
    createDefaultUsers() {
        this.data.users = [
            {
                id: 'user_1',
                username: 'Админ',
                password: 'admin123',
                email: 'admin@quiz.com',
                createdAt: new Date().toISOString(),
                isGuest: false,
                avatar: 'A',
                stats: {
                    gamesPlayed: 15,
                    gamesWon: 10,
                    totalScore: 1250,
                    averageScore: 83,
                    bestScore: 150,
                    winRate: 67
                }
            },
            {
                id: 'user_2',
                username: 'Игрок',
                password: 'player123',
                email: 'player@quiz.com',
                createdAt: new Date().toISOString(),
                isGuest: false,
                avatar: 'И',
                stats: {
                    gamesPlayed: 8,
                    gamesWon: 3,
                    totalScore: 650,
                    averageScore: 81,
                    bestScore: 120,
                    winRate: 38
                }
            }
        ];
    }
    
    // Создание тестовых викторин
    createDefaultQuizzes() {
        this.data.quizzes = [
            {
                id: 'quiz_1',
                title: 'Общая викторина',
                description: 'Вопросы на разные темы',
                category: 'general',
                difficulty: 'medium',
                createdBy: 'user_1',
                createdAt: new Date().toISOString(),
                questions: [
                    {
                        id: 'q1',
                        question: 'Сколько планет в Солнечной системе?',
                        answers: [
                            { text: '7', correct: false },
                            { text: '8', correct: true },
                            { text: '9', correct: false },
                            { text: '10', correct: false }
                        ],
                        timeLimit: 20
                    },
                    {
                        id: 'q2',
                        question: 'Какой газ составляет большую часть атмосферы Земли?',
                        answers: [
                            { text: 'Кислород', correct: false },
                            { text: 'Азот', correct: true },
                            { text: 'Углекислый газ', correct: false },
                            { text: 'Водород', correct: false }
                        ],
                        timeLimit: 20
                    }
                ],
                isPublic: true
            },
            {
                id: 'quiz_2',
                title: 'Научная викторина',
                description: 'Вопросы по науке',
                category: 'science',
                difficulty: 'hard',
                createdBy: 'user_1',
                createdAt: new Date().toISOString(),
                questions: [
                    {
                        id: 'q1',
                        question: 'Какой химический элемент имеет символ Au?',
                        answers: [
                            { text: 'Серебро', correct: false },
                            { text: 'Золото', correct: true },
                            { text: 'Алюминий', correct: false },
                            { text: 'Аргон', correct: false }
                        ],
                        timeLimit: 15
                    }
                ],
                isPublic: true
            }
        ];
    }
    
    // Сохранение данных в LocalStorage
    save() {
        try {
            localStorage.setItem(this.key, JSON.stringify(this.data));
            console.log('Данные сохранены в LocalStorage');
        } catch (error) {
            console.error('Ошибка сохранения данных:', error);
        }
    }
    
    // Пользователи
    createUser(username, email = null, password = null) {
        const user = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            username: username,
            email: email,
            password: password,
            createdAt: new Date().toISOString(),
            isGuest: password === null,
            avatar: username.charAt(0).toUpperCase(),
            stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                totalScore: 0,
                averageScore: 0,
                bestScore: 0,
                winRate: 0
            }
        };
        
        this.data.users.push(user);
        this.save();
        return user;
    }
    
    findUserById(userId) {
        return this.data.users.find(user => user.id === userId);
    }
    
    findUserByCredentials(username, password) {
        return this.data.users.find(user => 
            user.username === username && user.password === password
        );
    }
    
    updateUser(userId, updates) {
        const userIndex = this.data.users.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
            this.data.users[userIndex] = {
                ...this.data.users[userIndex],
                ...updates
            };
            this.save();
            return this.data.users[userIndex];
        }
        return null;
    }
    
    // Комнаты
    createRoom(roomCode, hostName, hostId = null, quizId = null, timeLimit = 20) {
        const room = {
            id: 'room_' + Date.now(),
            code: roomCode,
            hostId: hostId,
            hostName: hostName,
            players: [{
                id: hostId || 'guest_' + Date.now(),
                name: hostName,
                avatar: hostName.charAt(0).toUpperCase(),
                isHost: true,
                score: 0,
                ready: false,
                currentAnswer: null,
                answered: false
            }],
            maxPlayers: 8,
            gameState: 'waiting', // waiting, playing, finished
            quizId: quizId,
            currentQuestion: 0,
            timeLimit: parseInt(timeLimit) || 20,
            questionStartTime: null,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            results: []
        };
        
        this.data.rooms.push(room);
        this.addRecentRoom(roomCode);
        this.save();
        return room;
    }
    
    findRoomByCode(roomCode) {
        return this.data.rooms.find(room => room.code === roomCode);
    }
    
    findRoomById(roomId) {
        return this.data.rooms.find(room => room.id === roomId);
    }
    
    updateRoom(roomCode, updates) {
        const roomIndex = this.data.rooms.findIndex(room => room.code === roomCode);
        if (roomIndex !== -1) {
            this.data.rooms[roomIndex] = {
                ...this.data.rooms[roomIndex],
                ...updates,
                lastActivity: Date.now()
            };
            this.save();
            return this.data.rooms[roomIndex];
        }
        return null;
    }
    
    deleteRoom(roomCode) {
        const roomIndex = this.data.rooms.findIndex(room => room.code === roomCode);
        if (roomIndex !== -1) {
            this.data.rooms.splice(roomIndex, 1);
            this.save();
            return true;
        }
        return false;
    }
    
    // Игроки в комнатах
    addPlayerToRoom(roomCode, playerName, playerId = null, avatar = null) {
        const room = this.findRoomByCode(roomCode);
        if (!room || room.players.length >= room.maxPlayers) {
            return null;
        }
        
        const player = {
            id: playerId || 'guest_' + Date.now(),
            name: playerName,
            avatar: avatar || playerName.charAt(0).toUpperCase(),
            isHost: false,
            score: 0,
            ready: false,
            currentAnswer: null,
            answered: false
        };
        
        room.players.push(player);
        this.updateRoom(roomCode, { players: room.players });
        return player;
    }
    
    removePlayerFromRoom(roomCode, playerId) {
        const room = this.findRoomByCode(roomCode);
        if (room) {
            room.players = room.players.filter(p => p.id !== playerId);
            this.updateRoom(roomCode, { players: room.players });
            
            // Если комната пустая, удаляем её
            if (room.players.length === 0) {
                this.deleteRoom(roomCode);
            }
        }
    }
    
    updatePlayerScore(roomCode, playerId, score) {
        const room = this.findRoomByCode(roomCode);
        if (room) {
            const player = room.players.find(p => p.id === playerId);
            if (player) {
                player.score = score;
                this.updateRoom(roomCode, { players: room.players });
            }
        }
    }
    
    // Недавние комнаты
    addRecentRoom(roomCode) {
        // Удаляем старую запись, если она уже есть
        this.data.recentRooms = this.data.recentRooms.filter(code => code !== roomCode);
        
        // Добавляем новую в начало
        this.data.recentRooms.unshift(roomCode);
        
        // Ограничиваем количество
        if (this.data.recentRooms.length > 5) {
            this.data.recentRooms = this.data.recentRooms.slice(0, 5);
        }
        
        this.save();
    }
    
    getRecentRooms() {
        return this.data.recentRooms
            .map(code => this.findRoomByCode(code))
            .filter(room => room !== undefined)
            .slice(0, 5);
    }
    
    // Викторины
    createQuiz(quizData) {
        const quiz = {
            id: 'quiz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            ...quizData,
            createdAt: new Date().toISOString(),
            plays: 0,
            rating: 0
        };
        
        this.data.quizzes.push(quiz);
        this.save();
        return quiz;
    }
    
    findQuizById(quizId) {
        return this.data.quizzes.find(quiz => quiz.id === quizId);
    }
    
    findQuizzesByUser(userId) {
        return this.data.quizzes.filter(quiz => quiz.createdBy === userId);
    }
    
    findPublicQuizzes(category = null) {
        let quizzes = this.data.quizzes.filter(quiz => quiz.isPublic);
        if (category && category !== 'all') {
            quizzes = quizzes.filter(quiz => quiz.category === category);
        }
        return quizzes;
    }
    
    updateQuiz(quizId, updates) {
        const quizIndex = this.data.quizzes.findIndex(quiz => quiz.id === quizId);
        if (quizIndex !== -1) {
            this.data.quizzes[quizIndex] = {
                ...this.data.quizzes[quizIndex],
                ...updates
            };
            this.save();
            return this.data.quizzes[quizIndex];
        }
        return null;
    }
    
    deleteQuiz(quizId) {
        const quizIndex = this.data.quizzes.findIndex(quiz => quiz.id === quizId);
        if (quizIndex !== -1) {
            this.data.quizzes.splice(quizIndex, 1);
            this.save();
            return true;
        }
        return false;
    }
    
    // Статистика
    updateUserStats(userId, gameResult) {
        const user = this.findUserById(userId);
        if (user) {
            user.stats.gamesPlayed++;
            user.stats.totalScore += gameResult.score || 0;
            
            if (gameResult.won) {
                user.stats.gamesWon++;
            }
            
            if (gameResult.score > user.stats.bestScore) {
                user.stats.bestScore = gameResult.score;
            }
            
            user.stats.averageScore = Math.round(user.stats.totalScore / user.stats.gamesPlayed);
            user.stats.winRate = Math.round((user.stats.gamesWon / user.stats.gamesPlayed) * 100);
            
            this.save();
        }
    }
    
    // Настройки
    saveSettings(userId, settings) {
        if (!this.data.settings[userId]) {
            this.data.settings[userId] = {};
        }
        
        this.data.settings[userId] = {
            ...this.data.settings[userId],
            ...settings
        };
        
        this.save();
        return this.data.settings[userId];
    }
    
    getSettings(userId) {
        return this.data.settings[userId] || {
            soundEnabled: true,
            musicEnabled: true,
            theme: 'dark',
            language: 'ru'
        };
    }
    
    // Таблица лидеров
    getLeaderboard(limit = 10) {
        return this.data.users
            .filter(user => !user.isGuest)
            .sort((a, b) => b.stats.totalScore - a.stats.totalScore)
            .slice(0, limit)
            .map(user => ({
                username: user.username,
                avatar: user.avatar,
                stats: user.stats
            }));
    }
    
    // Очистка старых данных
    cleanupOldRooms(maxAgeHours = 24) {
        const now = Date.now();
        const maxAge = maxAgeHours * 60 * 60 * 1000;
        
        this.data.rooms = this.data.rooms.filter(room => {
            return (now - room.lastActivity) < maxAge;
        });
        
        this.save();
        console.log(`Очищены старые комнаты (старше ${maxAgeHours} часов)`);
    }
    
    // Экспорт/импорт
    exportData() {
        return JSON.stringify(this.data, null, 2);
    }
    
    importData(jsonString) {
        try {
            const newData = JSON.parse(jsonString);
            this.data = newData;
            this.save();
            console.log('Данные успешно импортированы');
            return true;
        } catch (error) {
            console.error('Ошибка импорта данных:', error);
            return false;
        }
    }
    
    // Сброс данных (только для тестирования)
    reset() {
        this.data = {
            users: [],
            rooms: [],
            quizzes: [],
            statistics: {},
            settings: {},
            recentRooms: []
        };
        
        localStorage.removeItem(this.key);
        console.log('Все данные сброшены');
    }
}

// Создаем глобальный экземпляр базы данных
const Database = new LocalDatabase();

// Автоматическая очистка старых комнат при загрузке
Database.cleanupOldRooms(1); // Удаляем комнаты старше 1 часа

// Экспортируем для использования в других файлах
if (typeof window !== 'undefined') {
    window.Database = Database;
}

console.log('Локальная база данных инициализирована');
