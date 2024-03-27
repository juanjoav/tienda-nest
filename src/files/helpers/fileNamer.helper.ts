import { v4 as uuid } from 'uuid';

export const fileNamer = (req: Express.Request, file: Express.Multer.File, callback: Function) => {

   // console.log('fileFilter', file);
   if (!file) return callback(new Error('File is empty'), false);

   const fileExtension = file.mimetype.split('/')[1];
   console.log("🚀 ~ fileNamer ~ fileExtension:", fileExtension)
   
   const filename = `${uuid()}.${fileExtension}`;
   callback(null, filename);
};