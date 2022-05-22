import React from 'react'
import './Alert.css'
import {FaWindowClose} from "react-icons/fa"

function Alert({messageAlert,setMessageAlert}) {
  return (
    <div className="message-alert-popup">
      <div className="alert-header">
        <FaWindowClose className="icon" onClick={() => {setMessageAlert({})}}/>
        <h3>other</h3>
      </div>
      <p className="alert-msg">{messageAlert?.msg}</p>
    </div>
  )
}

export default Alert