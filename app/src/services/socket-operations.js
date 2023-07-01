import { io } from 'socket.io-client';
import logger from '../utils/logger.js';
import config from '../config/app.js';
import toastr from 'toastr';
import { chatMessages, setChatStateNotification, userConnectNotification } from '../components/chat.js';

export default class SocketOperations {
    constructor(query){
        this.socket = io(config.socket_url,{query});
        this.room = query.room;
    }

    initializeListeners(){
        //this prints a log when we are connected to socket.
        this.socket.on('connect', () => {
            logger.info("Socket: successfuly joined room:" + this.room);
        });

        /**
         * this listener works when a user is connected.
         * @param {Object} options
         * @param {number} options.room
         * @param {string} options.socket_id
         * @param {string} options.username
         */
        this.socket.on("connected",(options) => {
            userConnectNotification({
                online:true,
                ...options
            });
        });

        
        /**
         * listen for any user constraints changes.
         * @param {Object} options
         * @param {number} options.rfid
         * @param {string} options.kind - possible values: "audio" | "video"
         * @param {Object} options.constraints
         * @param {boolean} options.constraints.video
         * @param {boolean} options.constraints.audio
         */
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

        /**
         * listen for chat messages that are sent
         * @param {Object} options
         * @param {string} options.username
         * @param {string} options.message 
         */
        this.socket.on("chat_messages", (options) => {
            try {
                chatMessages(options);
                setChatStateNotification({
                    isTyping: false,
                    username: options.username
                });
            } catch (error) {
                logger.error(error);
            }
        })

        /**
         * @param {Object} options
         * @param {string} options.username
         * @param {boolean} options.isTyping
         */
        this.socket.on("chat_typing_notification",(options) => {
            try {
                setChatStateNotification(options);
            } catch (error) {
                logger.error(error);
            }
        })

        /**
         * listen if the user is disconnected
         * @param {Object} options
         * @param {string} options.username
         */
        this.socket.on("user_disconnected", (options) => {
            try {
                userConnectNotification({
                    online:false,
                    ...options
                });
            } catch (error) {
                logger.error(error);
            }
        });
    }

    /**
     * this method sends an event to socket when constraints change
     * @param {Object} options
     * @param {number} options.rfid
     * @param {string} options.kind - possible values: "audio" | "video"
     * @param {Object} options.constraints
     * @param {boolean} options.constraints.video
     * @param {boolean} options.constraints.audio
     */
    sendConstraintsChangeEvent(options){
        this.socket.emit("onchange_constraints",options);
    }

    /**
     * send message to socket
     * @param {Object} options
     * @param {string} options.message 
     */
    sendChatMessage(options){
        this.socket.emit("chat_message",options);
    }

    /**
     * send "is user typing" event to the socket
     * @param {Object} options
     * @param {boolean} options.isTyping
     */
    sendChatTypingNotification(options){
        this.socket.emit("chat_typing_notification",options);
    }
}