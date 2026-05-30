import {UploadFile} from 'antd';

const ImageCompression = async (file: File | UploadFile) => {
    if (file instanceof File) {
        return file;
    }

    return (file.originFileObj || file) as unknown as File;
};

export default ImageCompression;
