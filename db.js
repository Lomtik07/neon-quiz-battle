// В существующий db.js добавьте:

// В конструкторе:
this.data = {
    users: [],
    rooms: [],
    quizzes: [],
    polls: [], // ← ДОБАВИТЬ ЭТО
    recentRooms: []
};

// В createDemoData() добавьте тестовые опросы:
this.data.polls = [
    {
        id: 'poll_1',
        title: 'Любимый жанр игр',
        description: 'Какой жанр игр вам нравится больше всего?',
        category: 'entertainment',
        questions: [{
            id: 'q1',
            question: 'Какой жанр игр вам нравится больше всего?',
            options: [
                { text: 'Шутеры', votes: 0 },
                { text: 'РПГ', votes: 0 },
                { text: 'Стратегии', votes: 0 },
                { text: 'Гонки', votes: 0 },
                { text: 'Пазлы', votes: 0 }
            ],
            multipleChoice: true,
            showResults: true
        }],
        createdBy: 'user_1',
        isPublic: true,
        createdAt: new Date().toISOString()
    }
];

// Добавьте методы для работы с опросами:

// Поиск опросов пользователя
findPollsByUser(userId) {
    return this.data.polls.filter(poll => poll.createdBy === userId);
}

// Поиск публичных опросов
findPublicPolls(category = null) {
    let polls = this.data.polls.filter(poll => poll.isPublic);
    if (category && category !== 'all') {
        polls = polls.filter(poll => poll.category === category);
    }
    return polls;
}

// Поиск опроса по ID
findPollById(pollId) {
    return this.data.polls.find(poll => poll.id === pollId);
}
