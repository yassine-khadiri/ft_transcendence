/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Param,  Post, Put, Req,  UnauthorizedException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthenticatedGuard } from 'src/auth/guards/GlobalGuard';
import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { whichWithAuthenticated } from './utils/auth-utils';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Controller('user')
export class UserController {

    constructor(private readonly userService:UserService, 
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        ){}

    @Get('info')
    @UseGuards(AuthGuard("jwt"))
    async grabMyInfos(@Req() req) {
      
      const user = req.user
      console.log("user",user)
      return {
        username: user.username,
        email : user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
      };
    }

    @Get('finduser/:username')
    @UseGuards(AuthGuard("jwt"))
    findUser(@Param('username')username:string)
    {
        console.log("user")
        return this.userService.findUser(username);
    }

    @Post('changedisplayname')
    @UseGuards(AuthGuard("jwt"))
    async displayedName(@Body() request:{newDisplayName: string}, @Req() req ){

      try {

        const user = req.user
        // console.log(user.email)
        const updated = this.userService.changeDisplayedName(user.email, request.newDisplayName);
        return updated;
      }catch(error){
        throw new Error('Failed to update the displayed name');
      }
    }

    @Put('changeusername')
    @UseGuards(AuthenticatedGuard)
    async changeUserName(@Body() request: {newUserName : string}, @Req() req){

      try {

        const user = req.user

        const updated = this.userService.changeUserName(user.email, request.newUserName);
        return updated;
      }catch(error){
        throw new Error('Failed to update the username');
      }
    }


    @Post('changeAvatar')
    @UseGuards(AuthGuard("jwt"))
    @UseInterceptors(FileInterceptor('file', {
      storage: diskStorage({
        destination: 'src/uploads',
        filename: (req , file, cb) => {
          const name: string = file.originalname.split(".")[0];
          const fileExtension: string = file.originalname.split(".")[1];
          const newFileName : string = name.split(" ").join("_") + "_" + Date.now() + "." + fileExtension;

            cb(null, newFileName);

        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(null , false)
        }
          cb(null, true);
      },
      limits: {
        fileSize: 1024 * 1024, // still don't know why this don't work !!!!!!!!! figure it out !
      },
    }))
    clearchangeAvatar(@UploadedFile() file: Express.Multer.File)
    {
      try {
        const user = await whichWithAuthenticated(req, this.jwtService, this.prisma);
        const imagePath = file.path;
        // console.log("here is the image path :   " + imagePath);
        const updatedAvatar = this.userService._changeAvatar(user.email, imagePath);
        return updatedAvatar;
      } catch (error) {
        throw new Error('Failed to update the Avatar');
      }
    }

    @Get('my-friends')
    @UseGuards(AuthGuard("jwt"))
    async listFriends(@Req() req)
    {
      const user = req.user
      return await this.userService.listFriends(user.id);
    }

    @Get('pending-requests')
    @UseGuards(AuthGuard("jwt"))
    async pendingRequests(@Req() req)
    {
      const user = req.user
      return await this.userService.pendingRequests(user.id);
    }

    @Get('blocked-friends')
    @UseGuards(AuthGuard("jwt"))
    async blockedFriends(@Req() req)
    {     
      const user = req.user
      return await this.userService.blockedFriends(user.id);
    }
    @Get('All-users')
    @UseGuards(AuthGuard("jwt"))
    async allUsers(@Req() req)
    {
      const user = req.user
      return await this.userService.allUsers(user.id);
    }
    @Post('search')
    async searchUsers(@Body() request: {displayName : string}) {
      const test = this.userService.findByDisplayNameSearching(request.displayName);
      return test;
  }
    
}

