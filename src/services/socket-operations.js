import { io } from 'socket.io-client';
import logger from '../utils/logger.js';
import config from '../config/app.js';

export default class SocketOperations {
    constructor(query){
        this.socket = io(config.socket_url,{query});
        this.room = query.room;
    }

    initializeListeners(){
        this.socket.on("connected",() => {
            logger.info("Socket: successfuly joined room:" + this.room);
        });
    }
}