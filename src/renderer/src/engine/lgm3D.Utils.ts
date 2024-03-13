export default class Utils {

    static convertImgToBase64URL(imageData,type: 'png' | 'jpeg') : string {
        
        // const base64Image = Buffer.from(imageData).toString('base64');
        // return `data:image/${type};base64,${base64Image}`;

        const blob = new Blob([imageData],{type:"image/png"});
        return URL.createObjectURL(blob);
    }
}