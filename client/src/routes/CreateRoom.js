import React from "react";
import { v1 as uuid } from "uuid";
import './CreateRoom.css'
// import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
// import KeyboardRoundedIcon from '@mui/icons-material/KeyboardRounded';
import { FaKeyboard, FaVideo } from 'react-icons/fa';
import { useState } from "react";

const CreateRoom = (props) => {

    const [value,setValue] = useState('');

    function create() {
        const id = uuid();
        props.history.push(`/room/${id}#init`);
    }

    function linkClick() {
        props.history.push(`/room/${value}`);
    }

    return (
    <div className='createroom'>
      <div className='body'>
        <div className='left'>
          <div className='content'>
            <h2>Fast, reliable and secure conferencing</h2>
            <p>
              Create opportunities, Hold incredible events, 
              share knowledge, build and grow your community
            </p>
            <div className='action-btn'>
              <button className='btn black' onClick={create}>
                <FaVideo className='icon-block' />
                Start conference
              </button>
              <div className='input-block'>
                <div className='input-section'>
                  <FaKeyboard className='icon-block' />
                  <input placeholder='Enter a link' onChange={e => setValue(e.target.value)}/>
                </div>
                <button className='btn no-bg' onClick={linkClick}>Join</button>
              </div>
            </div>
          </div>
        </div>
        <div className='right'>
          <div className='content'>
            <img src='https://energyresourcing.com/wp-content/uploads/2020/04/look-your-best-on-video-call.jpg' alt=""/>
          </div>
        </div>
      </div>
    </div>
    );
}

export default CreateRoom;