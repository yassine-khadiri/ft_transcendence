"use client";
import {
	Conversation,
	ConversationSideBarContainer,
	ConversationSideBarItem,
} from "@/app/utils/styles";
import {
	ConversationTypes,
	User,
	UsersType,
	UsersTypes,
	messageTypes,
} from "@/app/utils/types";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { FC, useState, useEffect, useContext } from "react";
import "./style.css";
import {
	getAuthUser,
	getConversation,
	getUnreadMessages,
} from "@/app/utils/api";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store";
import {
	fetchConversationThunk,
	fetchDeleteConversation,
} from "@/app/store/conversationSlice";
import { formatRelative } from "date-fns";
import { IoMdAdd } from "react-icons/io";
import CreateConversationModal from "../modals/CreateConversationModal";
import { socketContext } from "@/app/utils/context/socketContext";
import { fetchMessagesThunk } from "@/app/store/messageSlice";
import { fetchAuthUser } from "@/app/store/AuthSlice";
import { fetchMessagesUnreadThunk } from "@/app/store/UnreadMessages";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faEllipsis } from "@fortawesome/free-solid-svg-icons";
import {
	fetchBlockFriendThunk,
	fetchDebloqueUserThunk,
} from "@/app/store/blockSlice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ChatComponnent = () => {
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

	const socket = useContext(socketContext).socket;
	const router = useRouter();
	const [show, setShow] = useState<any>(false);
	const { updateChannel, channel } = useContext(socketContext);
	const [oldId, setOldId] = useState(null);
	const { Userdata} = useContext(socketContext);

	const dispatch = useDispatch<AppDispatch>();
	const [unreadConversations, setUnreadConversations] = useState<Set<string>>(
		new Set(),
	);
	const { conversations, status, error } = useSelector(
		(state: any) => state.conversations,
	);
	const { UsersAuth, statusUsers, errorUsers } = useSelector(
		(state: any) => state.UsersAuth,
	);
	const { messagesUnread, statusmessagesUnread, errormessagesUnread } =
		useSelector((state: any) => state.messagesUnread);
	const [openMenuId, setOpenMenuId] = useState<string | null>(null);
	const handleMenuClick = (conversationId: string) => {
		setOpenMenuId(openMenuId === conversationId ? null : conversationId);
	};
	useEffect(() => {
		
		dispatch(fetchConversationThunk());
		dispatch(fetchAuthUser());
	}, [dispatch]);

	const handleDebloque = async (conversation: ConversationTypes) => {
		const user = getDisplayUser(conversation);

		try {
			await dispatch(fetchDebloqueUserThunk(user.id));
			ToastSuccess("You have Deblocked this friend successfully");
		} catch (error) {
			ToastError("Failed to Deblock the friend. Please try again.");
		}
	};

	const getDisplayUser = (conversation: ConversationTypes) => {
		let user;
		const userId = UsersAuth?.display_name;

		if (conversation.sender.display_name !== userId) {
			user = conversation.sender;
		} else {
			user = conversation.recipient;
		}

		const truncatedDisplayName =
			user.display_name.length > 10
				? `${user.display_name.substring(0, 10)}...`
				: user.display_name;

		return {
			...user,
			display_name: truncatedDisplayName,
		};
	};

	const getDisplayLastMessage = (conversation: ConversationTypes) => {
		let lastMessage = conversation.lastMessage;

		if (lastMessage == null) {
			return null;
		} else {
			// Limit the displayed characters to 10
			const truncatedContent =
				lastMessage.content.length > 10
					? `${lastMessage.content.substring(0, 10)}...`
					: lastMessage.content;

			return truncatedContent;
		}
	};

	const isUnread = (conversationId: string) => {
		return unreadConversations.has(`${conversationId}`);
	};

	const markConversationAsRead = (conversationId: string) => {
		const updatedUnreadConversations = new Set(unreadConversations);
		updatedUnreadConversations.delete(`${conversationId}`);
		setUnreadConversations(updatedUnreadConversations);
	};
	const handlleBloque = async (conversation: ConversationTypes) => {
		const user = getDisplayUser(conversation);
		try {
			const res = await dispatch(fetchBlockFriendThunk(user.id));
			if (res.payload && typeof res.payload === "object") {
				const responseData = res.payload as {
					data?: { response?: { message?: string } };
				};
				const message = responseData.data?.response?.message;
				if (message) {
					ToastSuccess(message);
				} else {
					const responseData = res.payload as { message?: string };
					const message = responseData.message;
					if (message) ToastError(message);
				}
			}
		} catch (error) {
			ToastError("Failed to block this friend. Please try again.");
		}
	};

	const countUnread = async (id: string) => {
		const count = await dispatch(fetchMessagesUnreadThunk(id));
		return count;
	};
	const deleteConversation = async (conversation: ConversationTypes) => {
		try {
			await dispatch(fetchDeleteConversation(conversation.id));
			ToastSuccess("You are deleting this conversation successfully");
		} catch (error) {
			ToastError("Failed to delete the conversation. Please try again.");
		}
	};
	return (
		<>
			{/* Conditionally render CreateConversationModal if show is true */}
			{show && <CreateConversationModal setShow={setShow} />}

			{/* Conditionally render conversations if show is false */}
			{!show && (
				<div className="my-10 h-[calc(100%-200px)] overflow-auto text-black ">
					{/* Header Section */}
					<div className="flex gap-px border-2 border-solid p-2 px-20">
						<h1 className="p-2 text-lg font-bold text-blue-500">
							Private Messages
						</h1>
						<button
							onClick={() => setShow(!show)}
							className="absolute right-5 rounded-full bg-[#fc7785] p-4"
						>
							<IoMdAdd className="text-white" />
						</button>
					</div>

					{/* Conversations Section */}
					<div className="p-2">
						{conversations && conversations.map((elem: ConversationTypes) => {
							const unreadCount = messagesUnread[elem.id] || 0;

							// Function to handle clicking on a conversation
							function handleClick() {
								updateChannel(elem);
								dispatch(fetchMessagesThunk(elem.id));
								markConversationAsRead(elem.id);
							}

							// Function to handle clicking on a user
							function handleClickUser() 
							{
								let user : User;
								if(elem.recipientId === Userdata?.id)
									user = elem.sender;
								else
									user = elem.recipient;

								router.push(`/dashboard/${user.id}`);
							}

							return (
								<div
									key={elem.id}
									className={`flex cursor-pointer items-start justify-between rounded-lg px-2 py-3 hover:bg-[#F2F3FD]`}
								>
									{/* User Information Section */}
									<div
										onClick={handleClick}
										className="flex items-center justify-start"
										key={elem.id}
									>
										<Image
											src={getDisplayUser(elem)?.avatar_url}
											className="h-10 w-10 rounded-[50%] bg-black min-[1750px]:h-12 min-[1750px]:w-12"
											alt="Description of the image"
											width={60}
											height={50}
										/>
										<div className="ml-4">
											<span className="ConversationName">
												{" "}
												{getDisplayUser(elem)?.display_name}
											</span>
											<span className="h-5 overflow-hidden text-sm font-light text-gray-400">
												{getDisplayLastMessage(elem)}
											</span>
										</div>
									</div>

									{/* Dropdown Menu Section */}
									<div className="absolute right-5 p-4">
										<FontAwesomeIcon
											icon={faEllipsis}
											className={`text-1xl transform cursor-pointer text-black duration-500 ease-in-out hover:text-[--pink-color] lg:text-3xl`}
											onClick={() => handleMenuClick(elem.id)}
										/>

										{openMenuId === elem.id && (
											<div
												className={`absolute -top-[115px] right-3 z-10 w-[200px] flex-col items-center justify-evenly rounded-[15px] border-2 border-solid border-[#000000] bg-white p-2 font-['Whitney_Semibold'] `}
											>
												<button
													className={`my-1 h-[30px] w-full rounded-[15px] bg-[#d9d9d9] text-black hover:bg-[rgba(0,0,0,.2)]`}
													onClick={() => handleClickUser()}
												>
													View profile
												</button>
												<button
													className={`my-1 h-[30px] w-full rounded-[15px] bg-[#d9d9d9] text-black hover:bg-[rgba(0,0,0,.2)]`}
													onClick={() => deleteConversation(elem)}
												>
													Delete Chat
												</button>
												<button
													className={`my-1 h-[30px] w-full rounded-[15px] bg-[#EA7F87] text-black hover:bg-[rgba(0,0,0,.2)]`}
													value="Bloque"
													onClick={() => handlleBloque(elem)}
												>
													Bloque
												</button>
											</div>
										)}
									</div>

									{/* Timestamp Section */}
									<div className="text-black">
										{new Date(elem.createdAt).toLocaleTimeString()}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</>
	);
};

export default ChatComponnent;
