export function createDummyTrack(image){
    let width = 640;
    let height = 480;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    const img = new Image();
    img.src = image ?? '/img/wizard_cat.png';
    img.onload = () => {
        const maxWidth = width;
        const maxHeight = height;
        let ImgWidth = img.width;
        let ImgHeight = img.height;

        if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;

            if (ImgWidth > maxWidth) {
                ImgWidth = maxWidth;
                ImgHeight = ImgWidth / aspectRatio;
            }
            if (ImgHeight > maxHeight) {
                ImgHeight = maxHeight;
                ImgWidth = ImgHeight * aspectRatio;
            }
        }
        ctx.drawImage(img, ((canvas.width / 2) - (ImgWidth / 2)), ((canvas.height / 2) - (ImgHeight / 2)), ImgWidth, ImgHeight);
    }

    const stream = canvas.captureStream();
    let track = stream.getVideoTracks()[0];
    track.dummy = true;
    return track;
}

export function toggleIcons(options){
    const {video,audio} = options;
    if(video !== undefined){
        const cameraIcon = document.getElementById("camera");
		cameraIcon.querySelector("span").textContent = video ? "Turn off camera" : "Turn on camera";
		cameraIcon.querySelector("iconify-icon").setAttribute("icon", video ? "foundation:video" : "mdi:video-off");
    }
    if(audio !== undefined){
        const muteIcon = document.getElementById("mute");
		muteIcon.querySelector("span").textContent = audio ? "Mute" : "unmute";
		muteIcon.querySelector("iconify-icon").setAttribute("icon", audio ? "octicon:unmute-16" : "mdi:volume-off");
    }
}