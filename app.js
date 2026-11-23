const express = require('express');
const app = express();
const math = require('mathjs');
const canvas = require('canvas');

const shiftAxis = 20;
const shiftId = 8;

class Graph {
    constructor(){
            this.primitives = [];

            this.nextNumber = 1;

            this.width = 800;
            this.height = 800;

            this.grid = {
                show: true,
                step: 1
            };

            this.limits = {
                xMin: -10,
                xMax: 10,
                yMin: -10,
                yMax: 10
            }

            this.scaleX = this.width / (this.limits.xMax - this.limits.xMin);
            this.scaleY = this.height / (this.limits.yMax - this.limits.yMin);
    }

    roundingNumber(num){
        return Math.round(num * 100) / 100;
    }

    createPoint(x, y){
        this.primitives.push({x: this.roundingNumber(x), y: this.roundingNumber(y), id: this.nextNumber, link: 0, type: "p"});
        this.nextNumber += 1;
    }

    createLine(x1, y1, x2, y2){
        if (x1 === x2 && y1 === y2){
            return;
        }
        this.primitives.push({x: this.roundingNumber(x1), y: this.roundingNumber(y1), id: this.nextNumber, link: this.nextNumber + 1, type: "l"});
        this.primitives.push({x: this.roundingNumber(x2), y: this.roundingNumber(y2), id: this.nextNumber + 1, link: this.nextNumber, type: "l"});
        this.nextNumber += 2;
    }

    createFunction(str){
        const compiled = math.parse(str).compile();
        const first = this.nextNumber;
        for (let x = this.limits.xMin; x <= this.limits.xMax; x += this.grid.step){
            this.primitives.push({x: this.roundingNumber(x), y: this.roundingNumber(compiled.evaluate({x: x})), id: this.nextNumber, link: this.nextNumber + 1, type: "f"});
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
                    } else {
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
                        } else {
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
            } else {
            return false;
        }
    }

    convertX(x){
        return (x - this.limits.xMin) * this.scaleX;
    }

    convertY(y){
        return this.height - (y - this.limits.yMin) * this.scaleY;
    }

    drawGridAxes(ctx){
        const xAxis = this.convertX(0);
        const yAxis = this.convertY(0);

        if (!this.grid.show){
            return;
        }

        ctx.beginPath();
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 1;
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        for (let i = 0; i <= this.width; i += this.scaleX * this.grid.step){
            ctx.moveTo(i, 0);
            ctx.lineTo(i, this.height);
            ctx.fillStyle = '#000000';
            const vx = this.roundingNumber(this.limits.xMin + i / this.scaleX);
            if (Number.isInteger(vx)){
                ctx.fillText(vx, i, yAxis);
            }
        }
        for (let i = 0; i <= this.height; i += this.scaleY * this.grid.step){
            ctx.moveTo(0, i);
            ctx.lineTo(this.width, i);
            ctx.fillStyle = '#000000';
            const vy = this.roundingNumber(this.limits.yMin + (this.height - i) / this.scaleY);
            if (Number.isInteger(vy)){
                ctx.fillText(vy, xAxis, i);
            }
        }

        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;

        ctx.moveTo(xAxis, 0);
        ctx.lineTo(xAxis, this.height);
        ctx.fillStyle = '#000000';
        ctx.fillText('y', xAxis - shiftAxis, 0);
        ctx.moveTo(0, yAxis);
        ctx.lineTo(this.width, yAxis);
        ctx.fillStyle = '#000000';
        ctx.fillText('x', this.width - shiftAxis, yAxis - shiftAxis);

        ctx.stroke();
        ctx.closePath();
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
            if (primitive.type !== 'f' || primitive.id % 10 === 0 || this.grid.step >= 0.5){
            ctx.beginPath();
            ctx.fillStyle = '#000000';
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ff0000';
            ctx.font = '10px Arial';
            ctx.fillText(primitive.id, x + shiftId, y - shiftId);
            }
        }
    }

    drawGraph(){
        const myCanvas = canvas.createCanvas(this.width, this.height);
        const ctx = myCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, this.width, this.height);
        this.drawGridAxes(ctx);
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