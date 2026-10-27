const express = require('express');
const app = express();

const graph = {
    width: 800,
    height: 600,

    grid: {
        show: true,
        step: 1
    },

    scale: 40,

    limits: {
        xMin: -10,
        xMax: 10,
        yMin: -10,
        yMax: 10
    }
};

app.get('/', function(request, response) {
    response.send(
        '<h1>Генератор графиков</h1>\n' +
        '<a href="/graph_parameters"> Посмотреть настройки</a>'
    );
});

app.get('/graph_parameters', function(request, response) {
    response.json(graph);
});

app.listen(3000, function() {
    console.log('Сервер работает.');
});