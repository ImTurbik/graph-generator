const express = require('express');
const app = express();
const math = require('mathjs');

class Graph {
    constructor(){
            this.primitives = [];

            this.nextNumber = 1;

            this.width = 800;
            this.height = 600;

            this.grid = {
                show: true,
                step: 1
            };

            this.scale = 40;

            this.limits = {
                xMin: -10,
                xMax: 10,
                yMin: -10,
                yMax: 10
        }
    }

    createPoint(x, y){
        this.primitives.push({x: x, y: y, id: this.nextNumber, link: 0, type: "p"});
        this.nextNumber += 1;
    }

    createLine(x1, y1, x2, y2){
        if (x1 === x2 && y1 === y2){
            return;
        }
        this.primitives.push({x: x1, y: y1, id: this.nextNumber, link: this.nextNumber + 1, type: "l"});
        this.primitives.push({x: x2, y: y2, id: this.nextNumber + 1, link: this.nextNumber, type: "l"});
        this.nextNumber += 2;
    }

    createFunction(str){
        const compiled = math.parse(str).compile();
        const first = this.nextNumber;
        for (let x = this.limits.xMin; x <= this.limits.xMax; x += this.grid.step){
            this.primitives.push({x: x, y: compiled.evaluate({x: x}), id: this.nextNumber, link: this.nextNumber + 1, type: "f"});
            this.nextNumber += 1;
        }
        if (this.nextNumber > first){
            this.primitives[this.primitives.length - 1].link = first;
        }
    }

    deletePoint(id){
        const primitive = this.primitives.findIndex(p => p.id === id);
        if (primitive !== -1){
            const deleteP = this.primitives[primitive];
            switch(deleteP.type){
                case "p":
                    this.primitives.splice(primitive, 1);
                    break;
                case "l":
                    this.primitives.splice(primitive, 1);
                    const el = this.primitives.findIndex(p => p.id === deleteP.link);
                    if (el !== -1){
                        this.primitives.splice(el, 1);
                    }
                    else {
                        break;
                    }
                    break;
                case "f":
                    let nextP = deleteP;
                    while(true){
                        let linkP = nextP.link;
                        let el = this.primitives.findIndex(p => p.id === nextP.id);
                        if (el !== -1){
                            this.primitives.splice(el, 1);
                        }
                        else {
                            break;
                        }
                        if (linkP === id){
                            break;
                        }
                        nextP = this.primitives.find(p => p.id === linkP);
                        if (!nextP){
                            break;
                        }
                    }
                break;
                default:
                    return false;
                }
                return true;
            }
        else {
            return false;
        }
    }
}

const graph = new Graph();

app.get('/', function(request, response) {
    response.send(
        '<h1>Генератор графиков</h1>\n' +
        '<a href="/graph_parameters"> Посмотреть настройки</a>'
    );
});

app.get('/graph_parameters', function(request, response) {
    response.json(graph);
});

app.get('/graph_primitives', function(request, response) {
    response.json(graph.primitives);
});

app.get('/graph_primitives/points', function(request, response) {
    const points = graph.primitives.filter(p => p.type === "p");
    response.json(points);
});

app.get('/graph_primitives/lines', function(request, response) {
    const lines = graph.primitives.filter(p => p.type === "l");
    response.json(lines);
});

app.get('/graph_primitives/functions', function(request, response) {
    const functions = graph.primitives.filter(p => p.type === "f");
    response.json(functions);
});

app.listen(3000, function() {
    console.log('Сервер работает.');
});