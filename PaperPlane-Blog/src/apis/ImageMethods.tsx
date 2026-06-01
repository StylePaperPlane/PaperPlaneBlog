import http from "./axios.tsx";

function getImageList(folderName?: string){
    return http({
        url: '/api/protect/images',
        method: 'GET',
        params: { folderName }
    })
}

function delImages(keysToDelete: string[]){
    return http({
        url: '/api/protect/delImg',
        method: 'DELETE',
        data: keysToDelete
    })
}

function uploadImages(formData: FormData){
    return http({
        url: "/api/protect/upload",
        data: formData,
        method: 'POST',
    })
}

function getImageFolders(){
    return http({
        url: '/api/protect/imageFolders',
        method: 'GET'
    })
}

function createImageFolder(folderName: string){
    return http({
        url: '/api/protect/imageFolders',
        method: 'POST',
        params: { folderName }
    })
}

function moveImagesToFolder(imageUrls: string[], folderName: string){
    return http({
        url: '/api/protect/images/folder',
        method: 'PUT',
        data: {
            imageUrls,
            folderName
        }
    })
}

export {getImageList,delImages,uploadImages,getImageFolders,createImageFolder,moveImagesToFolder}
