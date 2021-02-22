import './index.css';
import nameGenerator from './name-generator';
import isDef from './is-def';
import {findRenderedComponentWithType} from "react-dom/test-utils";


// Store/retrieve the name in/from a cookie.
const cookies = document.cookie.split(';');
const roomList = document.getElementById('room-list');
const messages = document.querySelector('#messages');

let line;
let room = roomList.value;
let color = getRandomColor();

function getColor() {
    return color;
}


let wsname = cookies.find(function (c) {
    if (c.match(/wsname/) !== null) return true;
    return false;
});
if (isDef(wsname)) {
    wsname = wsname.split('=')[1];
} else {
    wsname = nameGenerator();
    document.cookie = "wsname=" + encodeURIComponent(wsname);
}
// Set the name in the header
document.querySelector('header>p').textContent = decodeURIComponent(wsname);

// Create a WebSocket connection to the server
const ws = new WebSocket("ws://" + window.location.host + "/socket");

// We get notified once connected to the server
ws.onopen = (event) => {
    console.log("We are connected.");
};

ws.onmessage = (event) => {
    let message = JSON.parse(event.data);
    switch (message.type) {
        case 'message':
            console.log("message");
            line = document.createElement('li');
            line.textContent = message.data;
            messages.appendChild(line);
            break;
        case 'newRoom':
            console.log("create room");
            let newOption = document.createElement('option');
            newOption.appendChild(document.createTextNode('Room ' + message.roomId));
            newOption.value = message.roomId;
            roomList.appendChild(newOption);
            break;
        case 'drawing':
            if (message.roomId === room) {
                console.log("dessin du server");
                ctx.lineCap = "round";
                const {x, moveX, y, moveY, color} = message.data.content;
                ctx.strokeStyle = decodeURIComponent(color);
                ctx.beginPath();
                ctx.moveTo(x - moveX, y - moveY);
                ctx.lineTo(x, y);
                ctx.stroke();
                ctx.closePath();
            }
            break;
        case 'clearRoom':
            console.log("clear room");
            if (message.roomId === room) {
                resetCanvas();
            }
            break;
        case 'changeRoom':
            console.log("change room");
            roomList.value = message.roomId;
            changeRoom();
            break;
    }


};

function sendMessage(event) {
    event.preventDefault();
    event.stopPropagation();
    if (sendInput.value !== '') {
        // Send data through the WebSocket
        ws.send(JSON.stringify({type: 'message', data: sendInput.value}));
        sendInput.value = '';
    }
}

function createRoom() {
    ws.send(JSON.stringify({type: 'createRoom'}));
}

function clearRoom() {
    ws.send(JSON.stringify({
        type: 'clearRoom',
        roomId: room
    }));
}

function sendDrawing(event) {
    if (room === 'anyRoom') {
        return;
    }
    if (event.buttons !== 1) {
        return;
    }
    const xScale = 1000 / canvas.getBoundingClientRect().width;
    const yScale = 1000 / canvas.getBoundingClientRect().height;
    const data = {
        content: {
            x: event.offsetX * xScale,
            y: event.offsetY * yScale,
            moveX: event.movementX * xScale,
            moveY: event.movementY * yScale,
            color: getColor()
        }
    };
    ctx.lineCap = "round";
    const {x, moveX, y, moveY, color} = data.content;
    ctx.strokeStyle = decodeURIComponent(color);
    ctx.beginPath();
    ctx.moveTo(x - moveX, y - moveY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.closePath();
    console.log("dessin en local");
    ws.send(JSON.stringify({
        type: 'drawing',
        data: data,
        roomId: room
    }));
}

function getRandomColor() {
    return '#' + Math.floor(Math.random()*16777215).toString(16);
}

function changeRoom() {
    room = roomList.value;
    resetCanvas();
    ws.send(JSON.stringify({
        type: 'getDrawing',
        roomId: room
    }));
}

function resetCanvas() {
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.fillRect(0, 0, 1000, 1000);
}

const canvas = document.querySelector('canvas');
const sendForm = document.querySelector('form');
const sendInput = document.querySelector('form input');
const clearRoomButton = document.getElementById('clearRoom');
const createRoomButton = document.getElementById('createRoom');

sendForm.addEventListener('submit', sendMessage, true);
sendForm.addEventListener('blur', sendMessage, true);
clearRoomButton.addEventListener('click', clearRoom);
createRoomButton.addEventListener('click', createRoom);
roomList.addEventListener('change', changeRoom, true);
canvas.addEventListener("mousemove", sendDrawing, true);

let ctx = canvas.getContext("2d");
resetCanvas();

