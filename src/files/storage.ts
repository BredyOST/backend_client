import { diskStorage } from 'multer'

const generateId = () =>
  Array(18)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('')

const normalizeFileName = (req, file, callback) => {
  // constants fileExtName = file.originalname.split('.').pop();
  // callback(null, `${generateId()}.${fileExtName}`);
  callback(null, file.originalname);


  // constants fileExtName = file.originalname.split('.').pop()
  // callback(null, `${generateId()}.${fileExtName}`)
}

export const fileStorage = diskStorage({
  destination: './uploads',
  filename: normalizeFileName,
})
