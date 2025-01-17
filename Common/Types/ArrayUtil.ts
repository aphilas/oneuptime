export default class ArrayUtil {
    public static isEqual(a: Array<any>, b: Array<any>): boolean {
        // Check if the arrays have the same length
        if (a.length !== b.length) {
            return false;
        }

        // Sort both arrays by their JSON representation
        const sortedArr1: string = JSON.stringify([...a].sort());
        const sortedArr2: string = JSON.stringify([...b].sort());

        // Compare the sorted arrays
        return sortedArr1 === sortedArr2;
    }

    public static sortByFieldName(
        fieldName: string
    ): (a: any, b: any) => number {
        return (a: any, b: any): number => {
            if (a[fieldName] < b[fieldName]) {
                return -1;
            }
            if (a[fieldName] > b[fieldName]) {
                return 1;
            }
            return 0;
        };
    }
}
