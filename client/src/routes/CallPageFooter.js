import React from 'react'
import './CallPageFooter.css'
import { FaFacebookMessenger, FaMicrophoneSlash, FaPhoneSlash, FaShareAlt } from 'react-icons/fa';

function CallPageFooter({isAudio,isAdmin,meetInfoPopUp,setMeetInfoPopUp,toggleAudio,disconnectCall,isMessenger,setIsMessenger,messageAlert,setMessageAlert}) {
  const handleShowMeetingInfo = () => {
    setMeetInfoPopUp(!meetInfoPopUp)
  }

  return (
    <div className='callpagefooter'>
      <div className='left-callfooter' onClick={handleShowMeetingInfo}>
        <FaShareAlt className='icon-callfooter'/>
        <p>Share meeting link</p>
      </div>
      <div className='middle-callfooter' onClick={disconnectCall}>
        <FaPhoneSlash className='icon-callfooter red-bg'/>
        <p>End call</p>
      </div>
      <div className='right-callfooter'>
        <FaMicrophoneSlash className={`icon-callfooter ${!isAudio ? "red-bg" : null}`} onClick={() => {toggleAudio(!isAudio)}}/>
        <FaFacebookMessenger onClick={() => {
          setIsMessenger(true);
          setMessageAlert({});
        }} className={`icon-callfooter ${!isMessenger && messageAlert.alert ? "green-bg" : null}`}/>
      </div>
    </div>
  )
}

export default CallPageFooter