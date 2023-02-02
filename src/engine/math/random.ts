export class Random {
    static pickElementFromArray(array: string | any[]) {
        return array[Math.floor(Math.random() * array.length)];
    }
}