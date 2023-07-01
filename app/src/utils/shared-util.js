import SocketOperations from '../services/socket-operations.js';
import Janus from './../js/janus.js';

let room = Number(sessionStorage.getItem("room"));
let username = sessionStorage.getItem("username") || "user-"+Janus.randomString(12);
const params = {
    room,
    username
}

const SharedUtil = {
    params,
    socketOperations: new SocketOperations({
        room:room,
        username: username
    })
}

export default SharedUtil;