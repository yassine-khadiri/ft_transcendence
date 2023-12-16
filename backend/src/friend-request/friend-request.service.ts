/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException,HttpStatus,HttpException } from '@nestjs/common';
import { User } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class FriendRequestService {
    constructor(private readonly prisma: PrismaService,  private readonly eventEmitter: EventEmitter2){}
    async allMyFriends(id : string)
    {
        const user = await this.prisma.user.findFirst({where: {id: id}});
        if(!user)
        {
            throw new HttpException('User Not Found !', HttpStatus.BAD_REQUEST)
        }

    }
    async sendRequest(friendDisplay_name: string, _Display_name:string){

        const user = await this.prisma.user.findFirst({where: {display_name: _Display_name}});
        const _friendDisplay_name = await this.prisma.user.findFirst({where: {display_name: friendDisplay_name}});
        
        if(!user || !_friendDisplay_name)
        {
            throw new HttpException('User Not Found !', HttpStatus.BAD_REQUEST)

        }
        if(friendDisplay_name === _Display_name)
        {
            throw new HttpException('You cant send request to your self!', HttpStatus.BAD_REQUEST)
        }


        const requestAlreadySent = await this.prisma.friend.findFirst(
            {
                where: {
                    OR: [
                        { user_id: user.id, friend_id: _friendDisplay_name.id, status: "PENDING"},
                        {user_id: _friendDisplay_name.id, friend_id: user.id , status: "PENDING" },
                      ],
            }});

        if(requestAlreadySent)
        {
            throw new HttpException('Request Already Sent !', HttpStatus.BAD_REQUEST)
        }
        const alrighdyfriend = await this.prisma.friend.findFirst(
            {
                where: {
                    OR: [
                        { user_id: user.id, friend_id: _friendDisplay_name.id, status: "ACCEPTED"},
                        {user_id: _friendDisplay_name.id, friend_id: user.id , status: "ACCEPTED" },
                      ],
            }});

        if(alrighdyfriend)
        {
            throw new HttpException('You are alrighdy Friends !', HttpStatus.BAD_REQUEST)
        }
        const BlockedFriends = await this.prisma.friend.findFirst(
        {
                where: {
                    OR: [
                        { user_id: user.id, friend_id: _friendDisplay_name.id, status: "BLOCKED"},
                        {user_id: _friendDisplay_name.id, friend_id: user.id , status: "BLOCKED" },
                      ],
            }});

        if(BlockedFriends)
        {
            throw new HttpException('You cant send request because you blocked each other', HttpStatus.BAD_REQUEST)
        }
        

         const friendData = await this.prisma.friend.create({
            data: {
                user_id: user.id,
                friend_id: _friendDisplay_name.id,
                status: 'PENDING',
                created_at: new Date()
            },
            include :{
                user : true,
                friends : true,
            }
        
        });

        this.eventEmitter.emit('request.created', {
            friendData
          });
    
   
        return {message: 'Friend request sent successfully'};
    }

    //send request to play 
    async sendRequestPlay(senderDisplay_name: string, recipientDisplay_name ){
        const user = await this.prisma.user.findFirst({where: {display_name: senderDisplay_name}});
        const recipientUser = await this.prisma.user.findFirst({where: {display_name: recipientDisplay_name}});
        
        if(!user || !recipientUser)
        {
            throw new HttpException('User Not Found!', HttpStatus.BAD_REQUEST)
        }
        if(senderDisplay_name === recipientDisplay_name)
        {
            throw new HttpException('You cant send request to your self!', HttpStatus.BAD_REQUEST)
        }

        const requestAlreadySent = await this.prisma.requestPlay.findFirst(
        {
                where: {
                    OR: [
                        { senderId: user.id, recipientId: recipientUser.id, status: "PENDING"},
                        {senderId: recipientUser.id,recipientId: user.id , status: "PENDING" },
                      ],
                }
        });

        if(requestAlreadySent)
        {
            throw new HttpException('Request Already Sent !', HttpStatus.BAD_REQUEST)
        }
        const alrighdyfriend = await this.prisma.friend.findFirst(
            {
                where: {
                    OR: [
                        { user_id: user.id, friend_id: recipientUser.id, status: "ACCEPTED"},
                        {user_id: recipientUser.id, friend_id: user.id , status: "ACCEPTED" },
                      ],
            }});

        if(!alrighdyfriend)
        {
            throw new HttpException('This is not your friend,  you cant play with !', HttpStatus.BAD_REQUEST)
        }
        const BlockedFriends = await this.prisma.friend.findFirst(
            {
                where: {
                    OR: [
                        { user_id: user.id, friend_id: recipientUser.id, status: "BLOCKED"},
                        {user_id: recipientUser.id, friend_id: user.id , status: "BLOCKED" },
                      ],
            }});

        if(BlockedFriends)
        {
            throw new HttpException('You cant send request because you blocked each other', HttpStatus.BAD_REQUEST)
        }
        const requestToPlay = await this.prisma.requestPlay.create({
            data: {
                senderId: user.id,
                recipientId: recipientUser.id,
                status: 'PENDING',
            },
            include :{
                Sender : true,
                recipient : true,
            }
        
        });
        this.eventEmitter.emit('requestPlay.created', {
            requestToPlay
          });
    
   
        return {message: 'Request to play sent successfully'};


    }
    // accepted request to play
    async acceptRequestToPlay(requestId: string, userId: string){
        const req_play = await this.prisma.requestPlay.findFirst({
            where: {
                id : requestId
            },
            include: {
                Sender : true,
                recipient: true,
            }
        })
        if(!req_play)
            throw new UnauthorizedException ("the request doesn't exist");
        if(req_play.senderId != userId)
            throw new UnauthorizedException ("You are not the person who send this request");
        await this.prisma.friend.update({where: {id: requestId}, data: {status: 'ACCEPTED'}});

    }


    async acceptFriendRequest(requestId: string, user : User){
        const req = await this.prisma.friend.findUnique({
            where: {
                id: requestId
            },
            include :{
                user : true,
                friends : true,
            }

        
        })
        if(!req)
            throw new UnauthorizedException ("the request doesn't exist");

        if(req.friend_id !== user.id)
            throw new UnauthorizedException("have you ever seeing someone is accepting friend request the he send hhhhhh");
       

        await this.prisma.friend.update({where: {id: requestId}, data: {status: 'ACCEPTED'}});
        
        this.eventEmitter.emit('requestAccept.created', {
           req
          });
        
        return {message: 'Friend request accepted'};
    }

    async refuseFriendRequest(requestId: string, user: User) {
        const req = await this.prisma.friend.findUnique({ where: { id: requestId } });
    
        if (!req) {
            throw new UnauthorizedException("The request doesn't exist");
        }
    
        if (req.friend_id !== user.id) {
            throw new UnauthorizedException("You are not authorized to refuse this friend request");
        }
    
        await this.prisma.friend.delete({ where: { id: requestId } });

        this.eventEmitter.emit('requestRefuse.created', {
            RefuseruserId: req.friend_id,
          });
    
        return { message: 'Friend request refused and deleted from the database' };
    }

    async block(friendId: string, userId: string){

        const checkBlock = await this.prisma.friend.findFirst({
            where: {
                OR: [
                    { user_id: userId, friend_id: friendId, status: 'BLOCKED' },
                    { user_id: friendId, friend_id: userId, status: 'BLOCKED' },
                ]

            }

        })


        if(checkBlock)
        {
            throw new HttpException("Alrighdy blocked", HttpStatus.BAD_REQUEST)

        }

        const friendship = await this.prisma.friend.findFirst({
            where: {
                OR: [
                    { user_id: userId, friend_id: friendId, status: 'ACCEPTED' },
                    { user_id: friendId, friend_id: userId, status: 'ACCEPTED' },
                ]
            }
        });

        if(!friendship)
            throw new HttpException("Friendship doesn't exist to block this user", HttpStatus.BAD_REQUEST)


            
        await this.prisma.friend.update({where: {id: friendship.id}, data: {
            status: 'BLOCKED',
            user_id : friendId, friend_id: userId
        
        }});


        const chatParticipents = await this.prisma.chatParticipents.findFirst({
            where: {
              OR: [
                { senderId: userId, recipientId: friendId },
                { senderId: friendId, recipientId: userId },
              ],
            },
            include: {
                sender: {
                  select: {
                    id: true,
                    username: true,
                    display_name: true,
                    avatar_url: true,
                  },
                },
                recipient: {
                  select: {
                    id: true,
                    username: true,
                    display_name: true,
                    avatar_url: true,
                  },
                },
              },
            });
         
        this.eventEmitter.emit('requestBlock.created', {
            chatParticipents
          });
        

        return {message: "Blocked succefully"}
    }

    async unblock(friendId: string, userId: string){

        const friendship = await this.prisma.friend.findFirst({
            where: {
                OR: [
                    { user_id: userId, friend_id: friendId, status: 'BLOCKED' },
                    { user_id: friendId, friend_id: userId, status: 'BLOCKED' },
                ]
            }
        });
    
        if(!friendship)
            throw new UnauthorizedException("Friendship doesn't exist or is not blocked by the user.");
    
        
        if (friendship.friend_id !== userId) {
            throw new UnauthorizedException("You don't have permission to unblock this user.");
        }
    
        await this.prisma.friend.update({where: {id: friendship.id}, data: {status: 'ACCEPTED'}});

        const chatParticipents = await this.prisma.chatParticipents.findFirst({
            where: {
              OR: [
                { senderId: userId, recipientId: friendId },
                { senderId: friendId, recipientId: userId },
              ],
            },
            include: {
                sender: {
                  select: {
                    id: true,
                    username: true,
                    display_name: true,
                    avatar_url: true,
                  },
                },
                recipient: {
                  select: {
                    id: true,
                    username: true,
                    display_name: true,
                    avatar_url: true,
                  },
                },
              },
            });
         
        this.eventEmitter.emit('requestDebloque.created', {
            chatParticipents
          });
        
        return {message: "Unblocked"}
    }
    
    async deleteMessagesWithUser(userId : string, blockedUserId : string){
        await this.prisma.message.deleteMany({
            where: {
                  participents: {
                      OR: [
                        { senderId: userId, recipientId: blockedUserId },
                        { senderId: blockedUserId, recipientId: userId },
                      ],
                  },
              
            },
          });

    }
    
}