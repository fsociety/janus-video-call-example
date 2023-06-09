import './scss/lobby.scss';
import { createDummyTrack } from './utils/helpers.js';

let constraints = {
    video:true,
    audio:true
}

document.addEventListener("DOMContentLoaded",deviceReady);

function deviceReady(){
    //Get user media and permissions when DOM Content is ready
    getUserMedia(constraints);

    document.getElementById("mute").addEventListener("click",(e) => {
        e.currentTarget.classList.toggle("active");
        constraints.audio = !constraints.audio;
        e.currentTarget.querySelector("iconify-icon").setAttribute("icon", constraints.audio ? "octicon:unmute-24" : "octicon:mute-16")
    })

    document.getElementById("camera").addEventListener("click",(e) => {
        e.currentTarget.classList.toggle("active");
        constraints.video = !constraints.video;
        e.currentTarget.querySelector("iconify-icon").setAttribute("icon", constraints.video ? "ic:baseline-camera-alt" : "bxs:camera-off");
        toggleTrackForLocalVideo(constraints.video);
    })
}

function toggleTrackForLocalVideo(video){
    let videoEl = document.getElementById("local-video");
    const dummyTrack = createDummyTrack();
    if(video){
        getUserMedia({video:true});
    }else{
        videoEl.srcObject.getVideoTracks().forEach(track => {
            videoEl.srcObject.removeTrack(track);
        });
        videoEl.srcObject.addTrack(dummyTrack);
    }
    
}

async function getUserMedia(constraints){
    try{
        let stream = await window.navigator.mediaDevices.getUserMedia(constraints);
        document.getElementById("local-video").srcObject = stream;
    } catch (e){
        console.log(e);
    }
}

document.getElementById("settings-form").addEventListener("submit",(e) => {
    e.preventDefault();
    try {
        const form = new FormData(e.target);
        for (const [key, value] of form.entries()) {
            sessionStorage.setItem(key, value);
        }
        //and finally add constraints to session
        sessionStorage.setItem("constraints", JSON.stringify(constraints));
        //redirect to app
        window.location.href = "/";
    } catch (error) {
        console.log(error);
    }
});