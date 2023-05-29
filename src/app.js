import './scss/style.scss';
import './js/script.js';
import Settings from './js/settings.js';
import Janus from './js/janus.js';
import JanusUtil from './utils/janus-utils.js';

let currentUrl = new URL(window.location.href);
let room = Number(currentUrl.searchParams.get("room"));
let janus,sfuVideoRoom,myId,myStream,myPvtid;
let feeds = [];
let useCamera = true;
let username = "user-"+Janus.randomString(12);
const opaqueId = "videoroom-"+Janus.randomString(12);
const doSimulcast = currentUrl.searchParams.get("simulcast");
const doSvc = currentUrl.searchParams.get("svc");
const acodec = currentUrl.searchParams.get("acodec");
const vcodec = currentUrl.searchParams.get("vcodec");
const doDtx = currentUrl.searchParams.get("dtx");
const subscriber_mode = currentUrl.searchParams.get("subscriber-mode");
const use_msid = currentUrl.searchParams.get("msid");

const janusUtil = new JanusUtil({
    room,
    username,
    doSimulcast,
    doSvc,
    acodec,
    vcodec,
    vcodec,
    doDtx,
    subscriber_mode,
    use_msid,
    opaqueId
});

document.addEventListener("DOMContentLoaded",() => {
    initializeJanus();
    documentReady();
});

function initializeJanus() {
    Janus.init({debug: "all", callback: () => {

        //check webrtc support
        if(!Janus.isWebrtcSupported()) {
            alert("No WebRTC support... ");
            return;
        }

        janus = new Janus({
            server: Settings.server,
			iceServers: Settings.iceServers,
            success: () => {
                janusUtil.setJanus(janus);
                janus.attach({
                    plugin: "janus.plugin.videoroom",
					opaqueId: opaqueId,
                    success: async function(pluginHandle) {
                        sfuVideoRoom = pluginHandle;
                        janusUtil.setVideoRoom(sfuVideoRoom);
                        Janus.log("Plugin attached! (" + sfuVideoRoom.getPlugin() + ", id=" + sfuVideoRoom.getId() + ")");
                        Janus.log("  -- This is a publisher/manager");
                        
                        try {
                            const exist = await janusUtil.checkVideoRoomExist();
                            if (exist === false) {
                                janusUtil.createRoom({
                                    description: "example room " + room
                                })
                            } else {
                                console.log("The room has already been created. joining the room...");
                            }
                        } catch (error) {
                            console.log(error);
                        } finally {
                            janusUtil.joinRoom();
                        }

                        document.getElementById("destroy").onclick = () => {janus.destroy()};
                    },
                    error: function(error) {
                        Janus.error("  -- Error attaching plugin...", error);
                        console.log("  -- Error attaching plugin...", error);
                    },
                    consentDialog: function(on) {
                        Janus.debug("Consent dialog should be " + (on ? "on" : "off") + " now");
                        console.log("Consent dialog should be " + (on ? "on" : "off") + " now");
                    },
                    iceState: function(state) {
                        Janus.log("ICE state changed to " + state);
                    },
                    mediaState: function(medium, on, mid) {
                        Janus.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium + " (mid=" + mid + ")");
                    },
                    webrtcState: function(on) {
                        Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
                        console.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
                        if(!on)
                            return;
                        
                        
                       //we can change bitrate
                       //sfuVideoRoom.send({ message: { request: "configure", bitrate: bitrate }});
                    },
                    slowLink: function(uplink, lost, mid) {
                        Janus.warn("Janus reports problems " + (uplink ? "sending" : "receiving") +
                            " packets on mid " + mid + " (" + lost + " lost packets)");
                        console.log("Janus reports problems " + (uplink ? "sending" : "receiving") +
                        " packets on mid " + mid + " (" + lost + " lost packets)");
                    },
                    onmessage: async function(msg, jsep) {
                        Janus.debug(" ::: Got a message (publisher) :::", msg);
                        console.log(" ::: Got a message (publisher) :::", msg);
                        let event = msg["videoroom"];
                        Janus.debug("Event: " + event);
                        if(event) {
                            if(event === "joined") {
                                // Publisher/manager created, negotiate WebRTC and attach to existing feeds, if any
                                myId = msg["id"];
                                myPvtid = msg["private_id"];
                                Janus.log("Successfully joined room " + msg["room"] + " with ID " + myId);
                                if(!subscriber_mode)
                                    janusUtil.publishOwnFeed({useAudio:true, useVideo:true});
                                
                                // Any new feed to attach to?
                                if(msg["publishers"]) {
                                    var list = msg["publishers"];
                                    Janus.debug("Got a list of available publishers/feeds:", list);
                                    for(var f in list) {
                                        var id = list[f]["id"];
                                        var display = list[f]["display"];
                                        var audio = list[f]["audio_codec"];
                                        var video = list[f]["video_codec"];
                                        Janus.debug("  >> [" + id + "] " + display + " (audio: " + audio + ", video: " + video + ")");
                                        let remoteFeed = await janusUtil.newRemoteFeed({myPvtid, id, display, audio, video});
                                        feeds.push(remoteFeed);
                                    }
                                }
                            } else if(event === "destroyed") {
                                // The room has been destroyed
                                Janus.warn("The room has been destroyed!");
                                console.log("The room has been destroyed!");
                            } else if(event === "event") {
                                // Any new feed to attach to?
                                if(msg["publishers"]) {
                                    var list = msg["publishers"];
                                    Janus.debug("Got a list of available publishers/feeds:", list);
                                    console.log("Got a list of available publishers/feeds:", list);
                                    for(var f in list) {
                                        var id = list[f]["id"];
                                        var display = list[f]["display"];
                                        var audio = list[f]["audio_codec"];
                                        var video = list[f]["video_codec"];
                                        Janus.debug("  >> [" + id + "] " + display + " (audio: " + audio + ", video: " + video + ")");
                                        let remoteFeed = await janusUtil.newRemoteFeed({myPvtid, id, display, audio, video});
                                        feeds.push(remoteFeed);
                                    }
                                } else if(msg["leaving"]) {
                                    // One of the publishers has gone away?
                                    var leaving = msg["leaving"];
                                    Janus.log("Publisher left: " + leaving);
                                    let remoteFeed = feeds.find(rf => rf.rfid === Number(leaving));
                                    if(remoteFeed) {
                                        Janus.debug("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
                                        //TODO: remove video or hide
                                        if(feeds.indexOf(remoteFeed) !== -1) feeds.splice(feeds.indexOf(remoteFeed),1);
                                        remoteFeed.detach();
                                    }
                                } else if(msg["unpublished"]) {
                                    // One of the publishers has unpublished?
                                    var unpublished = msg["unpublished"];
                                    Janus.log("Publisher left: " + unpublished);
                                    if(unpublished === 'ok') {
                                        // That's us
                                        sfuVideoRoom.hangup();
                                        return;
                                    }
                                    let remoteFeed = feeds.find(rf => rf.rfid === Number(unpublished));
                                    if(remoteFeed) {
                                        Janus.debug("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
                                        //TODO: remove video or hide
                                        if(feeds.indexOf(remoteFeed) !== -1) feeds.splice(feeds.indexOf(remoteFeed),1);
                                        remoteFeed.detach();
                                    }
                                } else if(msg["error"]) {
                                    if(msg["error_code"] === 426) {
                                        // This is a "no such room" error: give a more meaningful description
                                        console.log(
                                            "<p>Apparently room <code>" + room + "</code> (the one this demo uses as a test room) " +
                                            "does not exist...</p><p>Do you have an updated <code>janus.plugin.videoroom.jcfg</code> " +
                                            "configuration file? If not, make sure you copy the details of room <code>" + room + "</code> " +
                                            "from that sample in your current configuration file, then restart Janus and try again."
                                        );
                                    } else {
                                        console.log(msg["error"]);
                                    }
                                }
                            }
                        }
                        if(jsep) {
                            Janus.debug("Handling SDP as well...", jsep);
                            console.log("Handling SDP as well...", jsep);
                            sfuVideoRoom.handleRemoteJsep({ jsep: jsep });
                            // Check if any of the media we wanted to publish has
                            // been rejected (e.g., wrong or unsupported codec)
                            var audio = msg["audio_codec"];
                            if(myStream && myStream.getAudioTracks() && myStream.getAudioTracks().length > 0 && !audio) {
                                // Audio has been rejected
                                toastr.warning("Our audio stream has been rejected, viewers won't hear us");
                            }
                            var video = msg["video_codec"];
                            if(myStream && myStream.getVideoTracks() && myStream.getVideoTracks().length > 0 && !video) {
                                // Video has been rejected
                                console.log("Our video stream has been rejected, viewers won't see us");
                                // Hide the webcam video
                                //TODO: hide camera
                            }
                        }
                    },
                    onlocalstream: function(stream) {
                        Janus.debug(" ::: Got a local stream :::", stream);
                        console.log(" ::: Got a local stream :::", stream);
                        myStream = stream;
                        Janus.attachMediaStream(document.getElementById("local-video"), stream);
                        if(sfuVideoRoom.webrtcStuff.pc.iceConnectionState !== "completed" &&
                        sfuVideoRoom.webrtcStuff.pc.iceConnectionState !== "connected") {
                            console.log("Publishing...");
                        }
                        var videoTracks = stream.getVideoTracks();
                        if(!videoTracks || videoTracks.length === 0) {
                            // No webcam
                            //TODO: append no webcam alert
                        }
                    },
                    onremotestream: function(stream) {
                        // The publisher stream is sendonly, we don't expect anything here
                    },
                    oncleanup: function() {
                        Janus.log(" ::: Got a cleanup notification: we are unpublished now :::");
                        console.log(" ::: Got a cleanup notification: we are unpublished now :::");
                        myStream = null;
                    }
                });
            },
            error: (error) => {
                Janus.error(error);
                console.log(error);
            },
            destroyed: () => {
                console.log("destroyed");
                //window.location.reload();
            }
        });

    }});
};
function documentReady(){
    document.querySelector(".meeting-actions #mute").addEventListener("click",() => {
        janusUtil.toggleMute();
    });
    document.querySelector(".meeting-actions #unpublish").addEventListener("click",() => {
        janusUtil.togglePublish();
    });
    document.querySelector(".meeting-actions #camera").addEventListener("click",() => {
        /**
         * we can create new offer with publishOwnFeed()
         * janusUtil.publishOwnFeed({useAudio: true, useVideo: false})
         */
        const successCallback = () => {
            janusUtil.mutateLocalStream(useCamera);
            const toggleCameraEl = document.getElementById("camera");
            toggleCameraEl.querySelector("span").textContent = useCamera ? "Turn off camera" : "Turn on camera";
		    toggleCameraEl.querySelector("iconify-icon").setAttribute("icon", useCamera ? "foundation:video" : "mdi:video-off");
        }

        const errorCallback = (err) => {
            console.log("error while changing the camera state", err);
        }
        useCamera = !useCamera;
        const request = { request: "configure", video: useCamera };
        janusUtil.sfuVideoRoom.send({ message: request, success: successCallback, error: errorCallback });
        
    });
}