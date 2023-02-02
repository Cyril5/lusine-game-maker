export class Mathf {
    static getVarClassName() {
      return Mathf.name;
    }

    static degToRad(deg: number) {
        return deg * (Math.PI/180);
    }
}