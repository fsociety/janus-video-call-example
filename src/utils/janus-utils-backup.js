import Janus from "../js/janus.js";
/**
 * this method joins the sfu video room
 * @param {Object} sfuVideoRoom 
 * @param {Object} payload 
 */
export const joinRoom = (sfuVideoRoom, payload) => {
    let register = {
        request: "join",
        room: payload.room,
        ptype: "publisher",
        display: payload.username
    };

    const successCallback = () => {
        console.log('Successfully joined room, room: ' + payload.room);
    }

    const errorCallback = () => {
        console.log("Can't join the room, Room: " + payload.room);
    }

    sfuVideoRoom.send({ message: register, success: successCallback, error: errorCallback });
}

/**
 * this creates room in janus
 * @param {Object} sfuVideoRoom 
 * @param {Object} payload 
 */
export const createRoom = (sfuVideoRoom, payload) => {
    let createRoomRequest = {
        request: 'create',
        room: payload.room,
        description: payload.description || "",
        is_private: false
    };
    sfuVideoRoom.send({ message: createRoomRequest });
    console.log(payload.room + ' room created');
};


/**
 * checks the room before creating it
 * @param {Object} sfuVideoRoom 
 * @param {Number} room 
 * @returns {Promise}
 */
export const checkVideoRoomExist = (sfuVideoRoom, room) => {
    return new Promise((resolve, reject) => {
        let request = {
            request: 'exists',
            room: room
        };
        const successCallback = res => {
            if (res.videoroom === 'success') {
                resolve(res.exists);
            } else {
                reject();
            }
        };
        const errorCallback = err => {
            reject(err);
        };
        sfuVideoRoom.send({ message: request, success: successCallback, error: errorCallback });
    });
};

/**
 * 
 * @param {Object} sfuVideoRoom 
 * @param {Object} payload 
 */
export const publishOwnFeed = (sfuVideoRoom, payload) => {
	// Publish our stream
	const {useAudio, doDtx, vcodec, doSimulcast, doSvc, acodec} = payload;
	// We want sendonly audio and video (uncomment the data track
	// too if you want to publish via datachannels as well)
	let tracks = [];
	if(useAudio)
		tracks.push({ type: 'audio', capture: true, recv: false });
	tracks.push({ type: 'video', capture: true, recv: false,
		// We may need to enable simulcast or SVC on the video track
		simulcast: doSimulcast,
		// We only support SVC for VP9 and (still WIP) AV1
		svc: ((vcodec === 'vp9' || vcodec === 'av1') && doSvc) ? doSvc : null
	});
	//~ tracks.push({ type: 'data' });

	sfuVideoRoom.createOffer(
		{
			tracks: tracks,
			customizeSdp: function(jsep) {
				// If DTX is enabled, munge the SDP
				if(doDtx) {
					jsep.sdp = jsep.sdp
						.replace("useinbandfec=1", "useinbandfec=1;usedtx=1")
				}
			},
			success: function(jsep) {
				Janus.debug("Got publisher SDP!", jsep);
				let publish = { request: "configure", audio: useAudio, video: true };
				// You can force a specific codec to use when publishing by using the
				// audiocodec and videocodec properties, for instance:
				// 		publish["audiocodec"] = "opus"
				// to force Opus as the audio codec to use, or:
				// 		publish["videocodec"] = "vp9"
				// to force VP9 as the videocodec to use. In both case, though, forcing
				// a codec will only work if: (1) the codec is actually in the SDP (and
				// so the browser supports it), and (2) the codec is in the list of
				// allowed codecs in a room. With respect to the point (2) above,
				// refer to the text in janus.plugin.videoroom.jcfg for more details.
				// We allow people to specify a codec via query string, for demo purposes
				if(acodec)
					publish["audiocodec"] = acodec;
				if(vcodec)
					publish["videocodec"] = vcodec;
				sfuVideoRoom.send({ message: publish, jsep: jsep });
			},
			error: function(error) {
				Janus.error("WebRTC error:", error);
				console.log("WebRTC error:", error);
			}
		});
}