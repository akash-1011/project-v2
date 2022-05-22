import React from 'react'
import './MeetingInfo.css'
import {FaWindowClose, FaCopy} from "react-icons/fa"

function MeetingInfo({setMeetInfoPopUp, url}) {
  return (
    <div className="meeting-info-block">
      <div className="meeting-header">
        <h3>Your meeting's ready</h3>
        <FaWindowClose className="icon" onClick={()=>{setMeetInfoPopUp(false)}}/>
      </div>
      <p className="info-text">
        Share this meeting link with others you want in the meeting
      </p>
      <div className="meet-link">
        <span>{url}</span>
        <FaCopy className="icon" onClick={() => navigator.clipboard.writeText(url)} />
      </div>
    </div>
  )
}

export default MeetingInfo