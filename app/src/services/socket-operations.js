import { io } from 'socket.io-client';
import logger from '../utils/logger.js';
import config from '../config/app.js';
import toastr from 'toastr';

export default class SocketOperations {
    constructor(query){
        this.socket = io(config.socket_url,{query});
        this.room = query.room;
    }

    initializeListeners(){
        this.socket.on("connected",() => {
            logger.info("Socket: successfuly joined room:" + this.room);
        });

        this.socket.on("onchange_constraints",(options) => {
            const remoteVideo = document.getElementById("rf-"+options.rfid);
            logger.info(`Remote User changed constraints: ${JSON.stringify(options.constraints)}, rfid: ${options.rfid}`);
            options.constraints.audio && !options.constraints.video ? 
            remoteVideo.classList.add("only-audio") :
            remoteVideo.classList.remove("only-audio");
            
            switch (options.kind) {
                case "video":
                    toastr.info(`Remote user: ${options.constraints.video ? "unmuted" : "muted"} video, rfid: ${options.rfid}`);
                    break;
                case "audio":
                    toastr.info(`Remote user: ${options.constraints.audio ? "unmuted" : "muted"} sound, rfid: ${options.rfid}`);
                    break;
                default:
                    logger.error("No such kind");
                    break;
            }
        })
    }

    /**
     * this method sends an event to socket when constraints change
     * @param {Object} options
     * @param {number} options.rfid
     * @param {string} options.kind
     * @param {Object} options.constraints
     * @param {boolean} options.constraints.video
     * @param {boolean} options.constraints.audio
     */
    sendConstraintsChangeEvent(options){
        this.socket.emit("onchange_constraints",options);
    }
}