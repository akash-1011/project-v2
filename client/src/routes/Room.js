import React, { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import AceEditor from "react-ace";
import { ReactSketchCanvas } from 'react-sketch-canvas';
import 'ace-builds/webpack-resolver'
import 'ace-builds/src-noconflict/mode-c_cpp'
import 'ace-builds/src-noconflict/mode-javascript';
import "codemirror/lib/codemirror.css"
import "codemirror/theme/material-ocean.css"
import "codemirror/theme/ayu-dark.css"
import "codemirror/keymap/sublime"
import "codemirror/mode/javascript/javascript"
import "codemirror/mode/python/python"
import CodeMirror from "codemirror";
import axios from "axios";
import CallPageFooter from "./CallPageFooter";
import MeetingInfo from "./MeetingInfo";
import Messenger from "./Messenger";
import Alert from "./Alert";
import "./Room.css"
import { useStateValue } from './../StateProvider';

const colors = ["red","green","black","yellow","blue"];
const availableLanguages = ["cpp","py","js","java"];

const Room = (props) => {
    const userVideo = useRef();
    const partnerVideo = useRef();
    const peerRef = useRef();
    const socketRef = useRef();
    const otherUser = useRef();
    const userStream = useRef();
    const [accepted, setAccepted] = useState(false);
    const [language, setLanguage] = useState(availableLanguages[0]);
    const [output, setOutput] = useState('');
    const [meetInfoPopUp, setMeetInfoPopUp] = useState(true);
    const [isMessenger, setIsMessenger] = useState(false)
    const [isAudio, setIsAudio] = useState(true);
    const [messageAlert, setMessageAlert] = useState({})
    const canvasRef = useRef(null);
    const [selectedColor, setSelectedColor] = useState(colors[0]);
    const [mouseDown, setMouseDown] = useState(false)

    const [{messageList}, dispatch] = useStateValue();
    
    const id = props.match.params.roomID;
    
    const isAdmin = window.location.hash === "#init" ? true : false;
    const url = `${window.location.origin}${window.location.pathname}`;
    
    const defaultText = {
        cpp : "#include<stdio.h>\nint main(){ \n    printf(\"Hello World\");\n    return 0;\n}",
        java: "class Main {\r\n    public static void main(String args[]) {\r\n        System.out.println(\"Hello World!\");\r\n    }\r\n}",
        py: "print(\"Hello World\")",
        js: "console.log(\"Hello World\")"    
    }
    const [code, setCode] = useState(defaultText.cpp);

    useEffect(() => {

      socketRef.current = io("http://localhost:8000", {
          transports: ["websocket"]
        });

      const editor = CodeMirror.fromTextArea(document.getElementById("codemirror"),{
        lineNumbers: true,
        keyMap: "sublime",
        theme: "material-ocean",
        mode: "javascript"
      })

      const editor_output = CodeMirror.fromTextArea(document.getElementById("codemirror_output"),{
        lineNumbers: false,
        keyMap: "sublime",
        theme: "ayu-dark",
        mode: "javascript"
      })
      
      editor.on("change", (ins,change) => {
        const {origin} = change
        if(origin !== "setValue") {
          setCode(ins.getValue());
          const code = ins.getValue();
          const payload = {code,language,id}
          socketRef.current.emit('CODE_CHANGED', payload)
        }
      })

      editor_output.setValue("Run the Code!");
      
      navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(stream => {
            userVideo.current.srcObject = stream;
            userStream.current = stream;

            socketRef.current.emit("join room", id);

            socketRef.current.on('other user', userID => {
                callUser(userID);
                otherUser.current = userID;
            });

            socketRef.current.on("user joined", userID => {
                otherUser.current = userID;
            });

            socketRef.current.on("offer", handleRecieveCall);

            socketRef.current.on("answer", handleAnswer);

            socketRef.current.on("ice-candidate", handleNewICECandidateMsg);

          });

          socketRef.current.on("muting you", payload => {
            var partnerVideo = document.getElementsByClassName("partner-video")
            partnerVideo.muted = payload.value;
          })

          socketRef.current.on("unmuting you", payload => {
            var partnerVideo = document.getElementsByClassName("partner-video")
            partnerVideo.muted = payload.value;
          })
          
          socketRef.current.on("receive code", payload => {
              editor.setValue(payload.code)
              setCode(payload.code)
              setLanguage(payload.language)
          })

          socketRef.current.on("receive output", payload => {
            console.log(payload)
            setOutput(payload)
            editor_output.setValue(payload)
          })

          socketRef.current.on("receive msg", payload => {
            dispatch({
              type:"ADD_TO_MESSAGELIST",
              payload: {
                user: "other",
                msg: payload.msg
              }
            })
            setMessageAlert(payload)
        })

        socketRef.current.on("receive change language", payload => {
          setLanguage(payload.lang)
          switch(payload.lang){
            case "cpp":
              editor.setValue(defaultText.cpp)
              break;
            case "js":
              editor.setValue(defaultText.js)
              break;
            case "java":
              editor.setValue(defaultText.java)
              break;
            case "py":
              editor.setValue(defaultText.py)
              break;
            default:
              break;
          }
          setLanguage(payload.lang)
        })

        socketRef.current.on("receive board", (data) => {
          canvasRef.current.loadPaths(data)
        })

        socketRef.current.on("user left", () => {
            setAccepted(false);
        })

        return () => {
        }
    }, []);

    function callUser(userID) {
        peerRef.current = createPeer(userID);
        userStream.current.getTracks().forEach(track => peerRef.current.addTrack(track, userStream.current));
    }

    function createPeer(userID) {
        const peer = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.stunprotocol.org"
                },
                {
                    urls: 'turn:numb.viagenie.ca',
                    credential: 'muazkh',
                    username: 'webrtc@live.com'
                },
            ]
        });

        peer.onicecandidate = handleICECandidateEvent;
        peer.ontrack = handleTrackEvent;
        peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID);

        return peer;
    }

    function handleNegotiationNeededEvent(userID) {
        peerRef.current.createOffer().then(offer => {
            return peerRef.current.setLocalDescription(offer);
        }).then(() => {
            const payload = {
                target: userID,
                caller: socketRef.current.id,
                sdp: peerRef.current.localDescription
            };
            socketRef.current.emit("offer", payload);
        }).catch(e => console.log(e));
    }

    function handleRecieveCall(incoming) {
        peerRef.current = createPeer();
        const desc = new RTCSessionDescription(incoming.sdp);
        peerRef.current.setRemoteDescription(desc).then(() => {
            userStream.current.getTracks().forEach(track => peerRef.current.addTrack(track, userStream.current));
        }).then(() => {
            return peerRef.current.createAnswer();
        }).then(answer => {
            return peerRef.current.setLocalDescription(answer);
        }).then(() => {
            const payload = {
                target: incoming.caller,
                caller: socketRef.current.id,
                sdp: peerRef.current.localDescription
            }
            socketRef.current.emit("answer", payload);
        })
    }

    function handleAnswer(message) {
        const desc = new RTCSessionDescription(message.sdp);
        peerRef.current.setRemoteDescription(desc).catch(e => console.log(e));
    }

    function handleICECandidateEvent(e) {
        if (e.candidate) {
            const payload = {
                target: otherUser.current,
                candidate: e.candidate,
            }
            socketRef.current.emit("ice-candidate", payload);
        }
    }

    function handleNewICECandidateMsg(incoming) {
        const candidate = new RTCIceCandidate(incoming);

        peerRef.current.addIceCandidate(candidate)
            .catch(e => console.log(e));
    }

    function handleTrackEvent(e) {
        setAccepted(true)
        partnerVideo.current.srcObject = e.streams[0];
    };

      const handleCodeSubmit = async () => {
        try {
          const editor_output = CodeMirror.fromTextArea(document.getElementById("codemirror_output"),{
            lineNumbers: false,
            keyMap: "sublime",
            theme: "ayu-dark",
            mode: "javascript"
          })
          editor_output.setValue("")
          const payload = {language,code}
          const {data} = await axios.post("http://localhost:9000/run",payload);
          var result = data.output;
          setOutput(result)
          editor_output.setValue(result)
          socketRef.current.emit("send output",result,id)
          try {
            const filepath = data.filepath
            await axios.post("http://localhost:9000/delete",{filepath})
          } catch (error) {
            console.log(error)
          }
        } catch({response}) {
          console.log(response)
          if(response?.message == "Network Error"){
            const editor_output = CodeMirror.fromTextArea(document.getElementById("codemirror_output"),{
              lineNumbers: false,
              keyMap: "sublime",
              theme: "ayu-dark",
              mode: "javascript"
            })
            editor_output.setValue("Could Not Execute")
            setOutput("Could Not Execute")
            socketRef.current.emit("send output","Could Not Execute",id)
          } else {
            const editor_output = CodeMirror.fromTextArea(document.getElementById("codemirror_output"),{
              lineNumbers: false,
              keyMap: "sublime",
              theme: "ayu-dark",
              mode: "javascript"
            })
            const errMsg = response.data?.error?.stderr;
            setOutput(errMsg)
            socketRef.current.emit("send output",errMsg,id)
            editor_output.setValue(response.data?.error?.stderr)
          }
        }
      }

      const changeLang = (e) => {
        setLanguage(e.target.value)
        const editor = CodeMirror.fromTextArea(document.getElementById("codemirror"),{
          lineNumbers: true,
          keyMap: "sublime",
          theme: "material-ocean",
          mode: "javascript"
        })
        setLanguage(e.target.value)
        switch(e.target.value) {
          case "cpp": 
            setCode(defaultText.cpp)
            editor.setValue(defaultText.cpp)
            break;
          case "js":
            setCode(defaultText.js)
            editor.setValue(defaultText.js)
            break;
          case "java":
            setCode(defaultText.java)
            editor.setValue(defaultText.java)
            break;
          case "py":
            setCode(defaultText.py)
            editor.setValue(defaultText.py)
            break;
          default:
            break;
        }
        socketRef.current.emit("language changed",{lang: e.target.value,id})
      }

      const onChange = newVal => {
        console.log(newVal.target.value)
          setCode(newVal);
          const payload = {code,language,id}
          socketRef.current.emit('CODE_CHANGED', payload)
      }

      const toggleAudio = (value) => {
        setIsAudio(value);
        var myVideo = document.getElementsByClassName("user-video")
        if(value === false) {
          myVideo.muted = true
          socketRef.current.emit("mute me", {value,id})
        } else {
          myVideo.muted = false
          socketRef.current.emit("unmute me", {value,id})
        }
      }

      const disconnectCall = () => {
        props.history.push("/");
        window.location.reload();
      };

      const sendMsg = (msg) => {
        const payload = {
          user: "you",
          msg: msg,
        }
        socketRef.current.emit('send msg', payload,id)
        dispatch({
          type:"ADD_TO_MESSAGELIST",
          payload: payload
        })
      }

      const boardChange = () => {
        if(mouseDown) {
          canvasRef.current.exportPaths().then(data => {
            console.log(mouseDown , data[0].paths[data[0].paths.length - 1])
            socketRef.current.emit("send board",data,id)
          })
        }
      }

    return (
        <div className='callpage'>
            <div className='video-container'>
                <video className="user-video" ref={userVideo} autoPlay playsInline />
                {accepted ? <video className="partner-video" ref={partnerVideo} autoPlay playsInline /> : null}
            </div>
            <div className='left-callpage'>
                <div className='editor'>
                    <div className='editor-menu'>
                        <label htmlFor="language">Language:</label>
                        <select onChange={changeLang} name="language" className="lang" value={language}>
                            {
                              availableLanguages.map(
                                lang => <option key={lang} value={lang}>{lang}</option>
                                )
                            }
                        </select>
                        <button className='btn-run' onClick={handleCodeSubmit} >Run</button>
                    </div>
                    <textarea id="codemirror" className="ace_editor" value={code} onChange={onChange}/>
                </div>
                <div className='output'>
                  <textarea id="codemirror_output" className="ace_editor" value={output}/>
                </div>
            </div>
            <div className='right-callpage' onMouseDown={() => {setMouseDown(true)}} onMouseUp={() => {setMouseDown(false)}}>
              <ReactSketchCanvas ref={canvasRef} onChange={(e) => {boardChange(e)}}/>
            </div>
            <CallPageFooter isAudio={isAudio} isMessenger={isMessenger} setIsMessenger={setIsMessenger} messageAlert={messageAlert}
              setMessageAlert={setMessageAlert} isAdmin={isAdmin} meetInfoPopUp={meetInfoPopUp} setMeetInfoPopUp={setMeetInfoPopUp} toggleAudio={toggleAudio} disconnectCall={disconnectCall}/>
            { isAdmin && meetInfoPopUp && <MeetingInfo setMeetInfoPopUp={setMeetInfoPopUp} url={url}/> }
            {isMessenger ? <Messenger setIsMessenger={setIsMessenger} sendMsg={sendMsg} messageList={messageList}/> : null }
            {Object.keys(messageAlert).length > 0 ? (<Alert messageAlert={messageAlert} setMessageAlert={setMessageAlert}/>) : null}
        </div>
      );
  };

export default Room;