import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import { fetchNotificationThunk } from '../store/notificationSlice';
import { NotificationTypes } from '../utils/types';
import { Conversation, ConversationSideBarContainer, ConversationSideBarItem } from '../utils/styles';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck,faXmark } from "@fortawesome/free-solid-svg-icons";


const NotificationComponent = () => {

    const dispatch = useDispatch<AppDispatch>();
    const { notification, status, error } = useSelector((state:any) => state.notification);

    console.log("notification", notification);
    useEffect(() => {
        dispatch(fetchNotificationThunk());
      }, [dispatch]);

      return (
        <div className='absolute  rounded-2xl p-3 top-15 right-5 z-50 bg-[#fff] w-[500px] h-[500px] overflow-auto no-scrollbar'>
            <div className='  justify-between  py-1 bg-white     items-center gap-1 my-3'>
                <h1 className='text-black text-2xl pl-2 pb-3'>Notification</h1>
                {notification.map(function(elem: NotificationTypes) {
                    return (
                        <div className='bg-white p-2 flex items-center my-2 hover:bg-[#F2F3FD] rounded-[20px]' key={elem.id}>
                            <div className='mr-5'>
                            <div className="relative w-16 h-16 rounded-full hover:bg-red-700 bg-gradient-to-r from-purple-400 via-blue-500 to-red-400 ">
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-gray-200 rounded-full border-2 border-white">
                                <Image
                                    src={elem.image_content} // You need to provide a valid source for the Image component
                                    className="h-14 w-14 rounded-[50%] bg-black"
                                    alt="Description of the image"
                                    width={60}
                                    height={60}
                                />
                            </div>
                            
                            </div>
                            </div>
                            <div>
                                <span className="text-black font-mono ">{elem.content}</span>
                            </div>
                            {/* <div className=" absolute right-5 p-4 "> */}

                            {/* <FontAwesomeIcon icon={faCheck}  className="text-black  transform cursor-pointer text-2xl duration-500 ease-in-out hover:text-[--pink-color] lg:text-3xl" />
                            <FontAwesomeIcon icon={faXmark} className="text-black ml-4 transform cursor-pointer text-2xl duration-500 ease-in-out hover:text-[--pink-color] lg:text-3xl" /> */}
                        {/* </div> */}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default NotificationComponent
