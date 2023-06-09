import Janus from "../js/janus.js";
import { createDummyTrack } from "./helpers.js";

class JanusUtil {
	constructor(payload, sfuVideoRoom, janus){
		this.room = payload.room;
		this.username = payload.username;
		this.doSimulcast = payload.doSimulcast;
		this.doSvc = payload.doSvc;
		this.acodec = payload.acodec;
		this.vcodec = payload.vcodec;
		this.doDtx = payload.doDtx;
		this.subscriber_mode = payload.subscriber_mode;
		this.use_msid = payload.use_msid;
		this.opaqueId = payload.opaqueId;
		this.sfuVideoRoom = sfuVideoRoom;
		this.janus = janus;
		this.bitrateTimer = {};
		this.isOurStreamPublished = true;
	}

	setVideoRoom(sfuVideoRoom){
		this.sfuVideoRoom = sfuVideoRoom;
	}

	setJanus(janus){
		this.janus = janus;
	}

	/**
	 * this method joins the sfu video room
	 */
	joinRoom() {
		let register = {
			request: "join",
			room: this.room,
			ptype: "publisher",
			display: this.username
		};
	
		const successCallback = () => {
			console.log('Successfully joined room, room: ' + this.room);
		}
	
		const errorCallback = () => {
			console.log("Can't join the room, Room: " + this.room);
		}
	
		this.sfuVideoRoom.send({ message: register, success: successCallback, error: errorCallback });
	}

	/**
	 * this creates room in janus
	 * @param {Object} payload 
	 */
	createRoom(payload) {
		let createRoomRequest = {
			request: 'create',
			room: this.room,
			description: payload.description || "",
			is_private: false
		};
		this.sfuVideoRoom.send({ message: createRoomRequest });
		console.log(payload.room + ' room created');
	}

	/**
	 * checks the room before creating it
	 * @returns {Promise}
	 */
	checkVideoRoomExist() {
		return new Promise((resolve, reject) => {
			let request = {
				request: 'exists',
				room: this.room
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
			this.sfuVideoRoom.send({ message: request, success: successCallback, error: errorCallback });
		});
	}

	/**
	 * Publish your own feed
	 * @param {Object} payload 
	 */
	publishOwnFeed(payload) {
		// Publish our stream
		const { sfuVideoRoom, doDtx, vcodec, doSimulcast, doSvc, acodec } = this;
		const { useAudio, useVideo } = payload;

		//making some changes on icons based on camera and microphone
		//TODO: get constrains inside of janus-util class
		const cameraIcon = document.getElementById("camera");
		const muteIcon = document.getElementById("mute");
		cameraIcon.querySelector("iconify-icon").setAttribute("icon", useVideo ? "foundation:video" : "mdi:video-off");
		muteIcon.querySelector("iconify-icon").setAttribute("icon", useAudio ? "octicon:unmute-16" : "mdi:volume-off");

		sfuVideoRoom.createOffer(
			{
				// Add data:true here if you want to publish datachannels as well
				media: { audioRecv: false, videoRecv: false,  audioSend: useAudio, videoSend: useVideo },
				simulcast: doSimulcast,
				customizeSdp: function(jsep) {
					// If DTX is enabled, munge the SDP
					if(doDtx) {
						jsep.sdp = jsep.sdp
							.replace("useinbandfec=1", "useinbandfec=1;usedtx=1")
					}
				},
				success: function(jsep) {
					Janus.debug("Got publisher SDP!", jsep);
					let publish = { request: "configure", audio: useAudio, video: useVideo };
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

	newRemoteFeed(payload){
		return new Promise((resolve, reject) => {
			// A new feed has been published, create a new plugin handle and attach to it as a subscriber
			let remoteFeed;
			const self = this;
			const { room } = self;
			const { myPvtid, id, display, audio, video } = payload;
			this.janus.attach(
				{
					plugin: "janus.plugin.videoroom",
					opaqueId: this.opaqueId,
					success: function(pluginHandle) {
						remoteFeed = pluginHandle;
						remoteFeed.simulcastStarted = false;
						Janus.log("Plugin attached! (" + remoteFeed.getPlugin() + ", id=" + remoteFeed.getId() + ")");
						Janus.log("  -- This is a subscriber");
						console.log("Plugin attached! (" + remoteFeed.getPlugin() + ", id=" + remoteFeed.getId() + ")");
						console.log("  -- This is a subscriber");
						// We wait for the plugin to send us an offer
						var subscribe = {
							request: "join",
							room: room,
							ptype: "subscriber",
							feed: id,
							private_id: myPvtid
						};
						// In case you don't want to receive audio, video or data, even if the
						// publisher is sending them, set the 'offer_audio', 'offer_video' or
						// 'offer_data' properties to false (they're true by default), e.g.:
						// 		subscribe["offer_video"] = false;
						// For example, if the publisher is VP8 and this is Safari, let's avoid video
						if(Janus.webRTCAdapter.browserDetails.browser === "safari" &&
								(video === "vp9" || (video === "vp8" && !Janus.safariVp8))) {
							if(video) video = video.toUpperCase();
							console.warn("Publisher is using " + video + ", but Safari doesn't support it: disabling video");
							subscribe["offer_video"] = false;
						}
						remoteFeed.videoCodec = video;
						remoteFeed.send({ message: subscribe });
					},
					error: function(error) {
						Janus.error("  -- Error attaching plugin...", error);
						console.error("Error attaching plugin... " + error);
						reject(error);
					},
					onmessage: function(msg, jsep) {
						Janus.debug(" ::: Got a message (subscriber) :::", msg);
						console.log(" ::: Got a message (subscriber) :::", msg);
						var event = msg["videoroom"];
						Janus.debug("Event: " + event);
						console.log("Event: " + event);
						if(msg["error"]) {
							console.error(msg["error"]);
						} else if(event) {
							if(event === "attached") {
								// Subscriber created and attached
								remoteFeed.rfid = msg["id"];
								remoteFeed.rfdisplay = msg["display"];
								Janus.log("Successfully attached to feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") in room " + msg["room"]);
								console.log("Successfully attached to feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") in room " + msg["room"]);
								resolve(remoteFeed);
							} else if(event === "event") {
								// Check if we got a simulcast-related event from this publisher
								var substream = msg["substream"];
								var temporal = msg["temporal"];
								/*
								if((substream !== null && substream !== undefined) || (temporal !== null && temporal !== undefined)) {
									if(!remoteFeed.simulcastStarted) {
										remoteFeed.simulcastStarted = true;
										// Add some new buttons
										addSimulcastButtons(remoteFeed.rfindex, remoteFeed.videoCodec === "vp8");
									}
									// We just received notice that there's been a switch, update the buttons
									updateSimulcastButtons(remoteFeed.rfindex, substream, temporal);
								}
								*/
							} else {
								// What has just happened?
							}
						}
						if(jsep) {
							Janus.debug("Handling SDP as well...", jsep);
							console.log("Handling SDP as well...", jsep);
							var stereo = (jsep.sdp.indexOf("stereo=1") !== -1);
							// Answer and attach
							remoteFeed.createAnswer(
								{
									jsep: jsep,
									// Add data:true here if you want to subscribe to datachannels as well
									// (obviously only works if the publisher offered them in the first place)
									media: { audioSend: false, videoSend: false },	// We want recvonly audio/video
									customizeSdp: function(jsep) {
										if(stereo && jsep.sdp.indexOf("stereo=1") == -1) {
											// Make sure that our offer contains stereo too
											jsep.sdp = jsep.sdp.replace("useinbandfec=1", "useinbandfec=1;stereo=1");
										}
									},
									success: function(jsep) {
										Janus.debug("Got SDP!", jsep);
										var body = { request: "start", room: room };
										remoteFeed.send({ message: body, jsep: jsep });
									},
									error: function(error) {
										Janus.error("WebRTC error:", error);
										console.error("WebRTC error... " + error.message);
									}
								});
						}
					},
					iceState: function(state) {
						Janus.log("ICE state of this WebRTC PeerConnection (feed #" + remoteFeed.rfindex + ") changed to " + state);
						console.log("ICE state of this WebRTC PeerConnection (feed #" + remoteFeed.rfindex + ") changed to " + state);
					},
					webrtcState: function(on) {
						Janus.log("Janus says this WebRTC PeerConnection (feed #" + remoteFeed.rfindex + ") is " + (on ? "up" : "down") + " now");
						console.log("Janus says this WebRTC PeerConnection (feed #" + remoteFeed.rfindex + ") is " + (on ? "up" : "down") + " now");
					},
					onlocalstream: function(stream) {
						// The subscriber stream is recvonly, we don't expect anything here
					},
					onremotestream: function(stream) {
						Janus.debug("Remote feed #" + remoteFeed.rfid + ", stream:", stream);
						console.log("Remote feed #" + remoteFeed.rfid + ", stream:", stream);
						//if the stream changes
						if(document.querySelector(`.participant#rf-${remoteFeed.rfid}`)){
							/**
							 * we can use videoElement.srcObject instead of stream
							 * let videoElement = document.querySelector(`.participant#rf-${remoteFeed.rfid} video`);
							 */
							if(stream.getVideoTracks().length === 0){
								stream.addTrack(createDummyTrack());
							}else{
								let tracks = Object.values(stream.getVideoTracks());
								//alternatively we can use track => track instanceof CanvasCaptureMediaStreamTrack
								let canvasTrack = tracks.find(track => track.dummy);
								if(canvasTrack) stream.removeTrack(canvasTrack);
							}
							return;
						};

						//TODO: Janus.webRTCAdapter.browserDetails.browser === "firefox" use setTimeout if firefox doesn't show res.

						let { 
							videoContainer, 
							videoEl, 
							bitrate,
							icons 
						} = self.createParticipantElement(remoteFeed.rfid);
						Janus.attachMediaStream(videoEl, stream);
						document.querySelector(".meeting-container").appendChild(videoContainer);
						var videoTracks = stream.getVideoTracks();
						if(!videoTracks || videoTracks.length === 0) {
							// No remote video
							videoEl.style.display = "none";
							let noVideo = document.createElement("div");
							noVideo.className = "no-video";
							noVideo.textContent = "No Remote Video";
							videoContainer.appendChild(noVideo);
						} else {
							videoEl.style.display = "block";
							videoContainer.querySelector(".no-video")?.remove();
						}
						icons.info.querySelector(".username").innerHTML = remoteFeed.rfdisplay
						// show bitrate and current resolution
						if(Janus.webRTCAdapter.browserDetails.browser === "chrome" || Janus.webRTCAdapter.browserDetails.browser === "firefox" ||
								Janus.webRTCAdapter.browserDetails.browser === "safari") {
							self.bitrateTimer[remoteFeed.rfid] = setInterval(function() {
								//show current resolution
								icons.info.querySelector(".curres").innerHTML = `${videoEl.videoWidth}x${videoEl.videoHeight}`;
								// show bitrate
								bitrate.innerHTML = `Bitrate: ${remoteFeed.getBitrate()}`;
							}, 1000);
						}
					},
					oncleanup: function() {
						Janus.log(" ::: Got a cleanup notification (remote feed " + id + ") :::");
						console.log(" ::: Got a cleanup notification (remote feed " + id + ") :::");
						//clear bitrate and curres timer
						if(self.bitrateTimer[remoteFeed.rfid])
							clearInterval(self.bitrateTimer[remoteFeed.rfid]);
						delete self.bitrateTimer[remoteFeed.rfindex];
						//remove remote video
						if(document.querySelector(`.participant#rf-${remoteFeed.rfid}`)){
							document.querySelector(`.participant#rf-${remoteFeed.rfid}`).remove();
						}
						//remoteFeed.simulcastStarted = false;
					}
				});
			});
	}

	createParticipantElement(rfid){
		let videoContainer = document.createElement("div");
		let videoEl = document.createElement("video");
		let overlay = document.createElement("div");
		let icons = document.createElement("div");
		let bitrate = document.createElement("div");

		overlay.className = "overlay";
		icons.className = "icons";
		videoContainer.className = "participant";
		bitrate.className = "bitrate";
		videoContainer.id = "rf-" + rfid;
		videoEl.autoplay = true;

		/** icons */
		let mute = document.createElement("div");
		mute.addEventListener("click",() => this.toggleRemoteMute(rfid))
		mute.className = "icon md mute";
		mute.innerHTML = `
		<iconify-icon icon="octicon:unmute-16"></iconify-icon>
		<span>Mute</span>
		`;
		let info = document.createElement("div");
		info.className = "icon md lg-description";
		info.innerHTML = `
		<iconify-icon icon="material-symbols:info-outline"></iconify-icon>
		<span>
		<p><strong>#Curres: </strong><i class="curres"></i></p>
		<p><strong><i class="username"></i></strong></p>
		</span>
		`;
		/** end of icons */

		icons.append(mute,info);
		overlay.append(icons, bitrate);
		videoContainer.append(videoEl, overlay);

		return {
			videoContainer,
			videoEl,
			bitrate,
			icons: {
				mute,
				info
			}
		}
	}

	toggleRemoteMute(rfid){
		let remoteVideo = document.querySelector(`#rf-${rfid} video`);
		let muteEl = document.querySelector(`#rf-${rfid} .mute`);
		console.log((remoteVideo.muted ? "unmuting" : "muting") + "local video")
		remoteVideo.muted = !remoteVideo.muted;
		muteEl.querySelector("span").textContent = remoteVideo.muted ? "unmute" : "Mute";
		muteEl.querySelector("iconify-icon").setAttribute("icon", remoteVideo.muted ? "mdi:volume-off" : "octicon:unmute-16");
	}

	toggleMute(){
		const muteEl = document.querySelector(".meeting-actions #mute");
		let muted = this.sfuVideoRoom.isAudioMuted();
		Janus.log((muted ? "Unmuting" : "Muting") + " local stream...");
		if(muted)
			this.sfuVideoRoom.unmuteAudio();
		else
			this.sfuVideoRoom.muteAudio();
		muted = this.sfuVideoRoom.isAudioMuted();
		
		muteEl.querySelector("span").textContent = muted ? "unmute" : "Mute";
		muteEl.querySelector("iconify-icon").setAttribute("icon", muted ? "mdi:volume-off" : "octicon:unmute-16");
	}

	togglePublish() {
		const publishEl = document.querySelector(".meeting-actions #unpublish");
		if(this.isOurStreamPublished){
			// Unpublish our stream
			var unpublish = { request: "unpublish" };
			this.sfuVideoRoom.send({ message: unpublish });
			this.isOurStreamPublished = false;
			let noVideo = document.createElement("div");
			noVideo.className = "no-video";
			noVideo.textContent = "Unpublished your stream";
			document.querySelector(".participant#local").appendChild(noVideo);
		}else{
			this.publishOwnFeed({useAudio:true});
			document.querySelector(".participant#local .no-video")?.remove();
			this.isOurStreamPublished = true;
		}

		publishEl.querySelector("span").textContent = this.isOurStreamPublished ? "Unpublish" : "Publish";
		publishEl
		.querySelector("iconify-icon")
		.setAttribute("icon", this.isOurStreamPublished ? "material-symbols:publish" : "material-symbols:unpublished");
	}

	mutateLocalStream(useVideo){
		const self = this;
		let localVideoEl = document.getElementById("local-video");
		let videoTracks = Object.values(localVideoEl.srcObject.getVideoTracks());
		videoTracks.forEach(videoTrack => localVideoEl.srcObject.removeTrack(videoTrack));

		if(useVideo){
			navigator.getUserMedia({ video: true }, (stream) => {
				const [track] = stream.getVideoTracks();
				localVideoEl.srcObject.addTrack(track);
			});
		} else {
			localVideoEl.srcObject.addTrack(createDummyTrack());
		}
	}
}

export default JanusUtil;