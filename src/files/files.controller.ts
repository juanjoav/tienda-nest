import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { diskStorage } from 'multer';
import { fileFilter, fileNamer } from './helpers';




@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) { }

  @Post('product')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: fileFilter,
   // limits: {
      //fileSize: 1024 * 1024 * 5,
   // }
   storage: diskStorage({
    destination: './static/products',
    filename: fileNamer
   })
  }))
  uploadProductFile(
    @UploadedFile() file: Express.Multer.File) {
    //console.log(file);

    console.log({fileInController: file});
    if (!file) {
      throw new BadRequestException('File is empty');
    }

    return {fileName: file.originalname};
  }

}
