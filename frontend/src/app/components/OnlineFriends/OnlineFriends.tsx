"use client"

import { AppDispatch } from "@/app/store";
import { Conversation, ConversationSideBarContainer, ConversationSideBarItem, HeaderOnlineUsers, OflineStyling, OnlineStyling } from "@/app/utils/styles";
import { useDispatch, useSelector } from "react-redux";
import {useContext, useEffect, useState} from "react"
import { FriendsTypes, UsersTypes } from "@/app/utils/types";
import { fetchUsersThunk } from "@/app/store/usersSlice";
import {  socketContext } from "@/app/utils/context/socketContext";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { MenuButton, MenuButton2 } from "../Buttons";
import { fetchBlockFriendThunk } from "@/app/store/blockSlice";
import { useRouter } from "next/navigation";
import { fetchGetAllFriendsThunk } from "@/app/store/friendsSlice";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fetchConversationUserThunk } from "@/app/store/conversationSlice";
import { fetchMessagesThunk } from "@/app/store/messageSlice";
import { fetchSendRequestPLay } from "@/app/store/requestSlice";

const OnlineFriends = () =>{
  const ToastError = (message: any) => {
    toast.error(message, {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const ToastSuccess = (message: any) => {
    toast.success(message, {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const router = useRouter();
    const [online, setOnlineFriends] = useState<UsersTypes[]>([]);
    const dispatch = useDispatch<AppDispatch>();
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const { updateChannel, channel } = useContext(socketContext);


      const handleMenuClick = (friendId: string) => {
        setOpenMenuId(openMenuId === friendId ? null : friendId);
    };
    const { users, Userstatus, Usererror } = useSelector((state:any) => state.users);
    const { friends, status, error } = useSelector((state:any) => state.friends);
    useEffect(() => {
      dispatch(fetchUsersThunk());
      dispatch(fetchGetAllFriendsThunk());
    }, [dispatch]);

    const handlleBloque = async (id: string) => {
      
      try {
        const res = await dispatch(fetchBlockFriendThunk(id));
        if (res.payload && typeof res.payload === 'object') {
        const responseData = res.payload as { data?: { response?: { message?: string } } };
        const message = responseData.data?.response?.message;
        if (message) {
          ToastSuccess(message);
  
        }else {
          const responseData = res.payload as {message?: string};
          const message = responseData.message;
          if(message)
          ToastError(message);
        }
      }
    
      } catch (error) {
        
        ToastError("Failed to block this friend. Please try again.");
    
      }
    };

   
    const isUserOnline = (friend: FriendsTypes) => {
      const user = users.find((user : any) => user.id === friend.id);
    
      return user && user.status === 'online';
    };

    return (
        <div className="text-black  my-10 h-[calc(100%-200px)] overflow-auto ">
         <ToastContainer />
        <Conversation>

				<ConversationSideBarContainer>
					{friends.map(function(elem : FriendsTypes){
            function handleClick()
						{
							router.push(`/dashboard/${elem.id}`)
						}
            const handleSendMessage = async () =>
            {

                  dispatch(fetchConversationUserThunk(elem.display_name))
                    .unwrap()
                    .then(({data}) => {
                      updateChannel(data);
                      dispatch(fetchMessagesThunk(data.id));

                  }).catch((err)=>{
                      console.log(err);
                  }
                );

            }
            const handlePLayingRequest = async(display_name : string) =>{
              try { 
                const response= await dispatch(fetchSendRequestPLay(display_name));
                if (response.payload && response.payload.message) {
                  const errorMessage = response.payload.message;
                  ToastError(`Error: ${errorMessage}`);
                } else {
                  ToastSuccess("Friend request sent successfully");
    
                }
              } catch (err: any) {
                ToastError(`Error: ${err.message || 'An unexpected error occurred'}!`);
    
              }

            }
						return(
							<ConversationSideBarItem key={elem.id}>
              <div className="flex">
								<Image src={elem.avatar_url} className="h-14 w-14 rounded-[50%] bg-black " alt="Description of the image" width={60}   height={60} />
                {isUserOnline(elem)  ? <OnlineStyling/> : <OflineStyling/>}
              </div>
					 			<span  className="ConversationName">{elem.username} {elem.display_name}</span>
				         <div className="absolute right-5 p-4">
				          <FontAwesomeIcon icon={faEllipsis} className={`text-black transform cursor-pointer text-2xl duration-500 ease-in-out hover:text-[--pink-color] lg:text-3xl }`}
					          onClick={() => handleMenuClick(elem.id)}
				          />
      
                {openMenuId === elem.id &&
                <div className={`absolute  top-[-120px] left-2 h-[120px]  w-[200px] flex-col items-center justify-center gap-1 rounded-[15px] border-2 border-solid border-[#000000] bg-white font-['Whitney_Semibold'] `}>
					        <button className={`bg-[#d9d9d9] text-black h-[35px] w-[197px] rounded-[15px] hover:bg-[rgba(0,0,0,.2)]`} onClick={()=> handleClick()}>see profile</button>
                  <button className={`bg-[#d9d9d9] text-black h-[35px] w-[197px] rounded-[15px] hover:bg-[rgba(0,0,0,.2)]`} onClick={()=> handlePLayingRequest(elem.display_name)}>Invite to play</button>
					        <button className={` bg-[#d9d9d9] text-black h-[35px] w-[197px] rounded-[15px] hover:bg-[rgba(0,0,0,.2)]`} onClick={()=> handleSendMessage() }>send message</button>
                  <button className={` bg-[#EA7F87] text-black h-[35px] w-[197px] rounded-[15px] hover:bg-[rgba(0,0,0,.2)]`} value="Bloque" onClick={()=> handlleBloque(elem.id)}>Bloque</button>

				        </div>}
            </div>               
                   
							</ConversationSideBarItem>
								
						)
					}) }
				</ConversationSideBarContainer>
			</Conversation>
        </div>
           
    )
}

export default OnlineFriends;