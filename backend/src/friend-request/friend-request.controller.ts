/* eslint-disable prettier/prettier */
import { Body, Controller,  Post, Req, Res, UseGuards } from '@nestjs/common';
import { FriendRequestService } from './friend-request.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('friend-request')
@UseGuards(AuthGuard('jwt'))

export class FriendRequestController {
    constructor(private readonly friendshipService: FriendRequestService,
                private readonly jwtService: JwtService,
                private readonly prisma: PrismaService,){}


    @Post('send-request')
    async sendRequest(@Body() request: { display_name: string }, @Req() req, @Res() res) {
        try {
          const user = req.user;
          const returnvalue = await this.friendshipService.sendRequest(request.display_name, user.display_name);
          return res.status(200).json({ success: true, response: returnvalue });
        } catch (err) {
          return res.status(401).json({ success: false, message: err.message || 'An unexpected error occurred' });
        }
      }
      //send request to play
      @Post('send-request-play')
      async sendRequestPlay(@Body() request: { display_name : string}, @Req() req, @Res() res){
        try{
          const user = req.user;
          const returnValue = await this.friendshipService.sendRequestPlay(user.display_name, request.display_name, );
          return res.status(200).json({success: true, response: returnValue});

        }catch(err){
          return res.status(401).json({ success: false, message: err.message || 'An unexpected error occurred' });
        }

      }

      
    @Post('accept-request')
    async acceptRequest(@Body() request: {requestId: string}, @Req() req)
    {
        const user = req.user;
        return this.friendshipService.acceptFriendRequest(request.requestId, user);
    }


    @Post('refuse-request')
    async refuseRequest(@Body() request: {requestId : string}, @Req() req)
    {
        const user = req.user;
        return this.friendshipService.refuseFriendRequest(request.requestId, user); 
    }
    

    @Post('block-friend')
    async blockFriend(@Body() request: {friendIdToBlock: string}, @Req() req, @Res() res)
    {
      try{
        const user = req.user;
        this.friendshipService.deleteMessagesWithUser(user.id, request.friendIdToBlock);
        const returnvalue =  await this.friendshipService.block(request.friendIdToBlock, user.id);
        return res.status(200).json({ success: true, response: returnvalue });

      }catch (err) {
        return res.status(401).json({ success: false, message: err.message || 'An unexpected error occurred' });
      }


    }


    @Post('unblock-friend')
    async unblockFriend(@Body() request: {friendIdToUnblock: string}, @Req() req)
    {
        const user = req.user;
        return this.friendshipService.unblock(request.friendIdToUnblock, user.id);
    }

  

    
}