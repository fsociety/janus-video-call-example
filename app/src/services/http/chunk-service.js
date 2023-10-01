import axios from 'axios';
import appConfig from '../../config/app.js';

export default class ChunkService {
    constructor(){
        /**
         * @type {Array[Blob]}
         */
        this.chunks = [];
    }

    getBlobs(){
        return this.chunks;
    }

    appendBlobs(blob){
        this.chunks.push(blob);
    }

    static async sendChunk(blob){
        const formData = new FormData();
        formData.append("blob", blob);
        const result = await axios.post(
            `${appConfig.api_url}/record/video-chunk`,
            formData,
            {
            headers: { "Content-Type": "multipart/form-data" }
            }
        );
        console.log("chunk sent", result);
    }
}