import React, { useState } from 'react'
import './Messenger.css'
import {FaAngleDoubleRight, FaWindowClose} from "react-icons/fa"

function Messenger({ setIsMessenger, sendMsg, messageList }) {
  const [msg, setMsg] = useState("");

  const handleChangeMsg = (e) => {
    setMsg(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMsg(msg);
      setMsg("");
    }
  };

  const handleSendMsg = () => {
    sendMsg(msg);
    setMsg("");
  }

  return (
    <div className='messenger-container'>
      <div className='messenger-header'>
        <h3>Messenger</h3>
        <FaWindowClose className="icon" onClick={() => {setIsMessenger(false)}}/>
      </div>
      <div className='chat-section'>
        {messageList.map((item) => (
          <div key={item.time} className='chat-block'>
            <div className='sender'>
              {item.user}
            </div>
            <p className='msg'>
              {item.msg}
            </p>
          </div>
        ))}
      </div>
      <div className='send-msg-section'>
        <input placeholder='Send a message' value={msg} onChange={(e) => {handleChangeMsg(e)}} onKeyDown={e => {handleKeyDown(e)}}/>
        <FaAngleDoubleRight className='icon' onClick={handleSendMsg}/>
      </div>
    </div>
  )
}

export default Messenger