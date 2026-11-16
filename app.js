const express = require('express');
const app = express();
const math = require('mathjs');
const canvas = require('canvas');

class Graph {
    constructor(){
            this.primitives = [];

            this.nextNumber = 1;

            this.width = 850;
            this.height = 850;

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

    convertX(x){
        return this.width / 2 + x * this.scale;
    }

    convertY(y){
        return this.height / 2 - y * this.scale;
    }

    drawGrid(ctx){
        if (!this.grid.show){
            return;
        }
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 1;
        for (let x = this.limits.xMin; x <= this.limits.xMax; x += this.grid.step){
            const px = this.convertX(x);
            ctx.beginPath();
            ctx.moveTo(px, 0);
            ctx.lineTo(px, this.height);
            ctx.stroke();
        }
        for (let y = this.limits.yMin; y <= this.limits.yMax; y += this.grid.step){
            const py = this.convertY(y);
            ctx.beginPath();
            ctx.moveTo(0, py);
            ctx.lineTo(this.width, py);
            ctx.stroke();
        }
    }

    drawAxes(ctx){
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, this.convertY(0));
        ctx.lineTo(this.width, this.convertY(0));
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.convertX(0), 0);
        ctx.lineTo(this.convertX(0), this.height);
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        for (let x = this.limits.xMin; x <= this.limits.xMax; x += this.grid.step){
            if (x !== 0){
                ctx.fillText(x, this.convertX(x), this.convertY(0) + 18);
            }
        }
        for (let y = this.limits.yMin; y <= this.limits.yMax; y += this.grid.step){
            if (y !== 0){
                ctx.fillText(y, this.convertX(0) - 12 , this.convertY(y) + 4);
            }
        }
        ctx.fillText('0', this.convertX(0) - 12, this.convertY(0) + 18);
        ctx.fillText('X', this.width - 5, this.convertY(0) - 5);
        ctx.fillText('Y', this.convertX(0) + 12, 10);

    }

    drawPrimitives(ctx){
        if (this.primitives.length === 0){
            console.log("Примитивы отсутствуют");
        }
        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#000000';
        ctx.lineWidth = 2;
        for (const primitive of this.primitives){
            const x = this.convertX(primitive.x);
            const y = this.convertY(primitive.y);
            switch(primitive.type){
                case "p":
                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case "l":
                    const secondP = this.primitives.find(p => p.id === primitive.link);
                    if (secondP && secondP.id > primitive.id){
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(this.convertX(secondP.x), this.convertY(secondP.y));
                        ctx.stroke();
                    }
                    break;
                case "f":
                    const nextP = this.primitives.find(p => p.id === primitive.link);
                    if (nextP && nextP.id > primitive.id){
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(this.convertX(nextP.x), this.convertY(nextP.y));
                        ctx.stroke();
                    }
                    break;
                default:
                    break;
            }
        }
    }

    drawGraph(){
        const myCanvas = canvas.createCanvas(this.width, this.height);
        const ctx = myCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, this.width, this.height);
        this.drawGrid(ctx);
        this.drawAxes(ctx);
        this.drawPrimitives(ctx);
        return myCanvas.toBuffer('image/png');
    }
}

const graph = new Graph();

app.get('/', function(request, response) {
    response.send(
        '<h1>Генератор графиков</h1>\n' +
        '<a href="/graph_parameters"> Посмотреть настройки</a>\n' +
        '<a href="/graph_primitives"> Посмотреть примитивы</a>\n' +
        '<a href="/graph_image"> Посмотреть график</a>\n'
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

app.get('/graph_image', function(request, response) {
    const image = graph.drawGraph();
    response.setHeader('Content-Type', 'image/png');
    response.send(image);
});


app.listen(3000, function() {
    console.log('Сервер работает.');
});