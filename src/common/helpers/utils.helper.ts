// THE GLOBAL RETURNER
export const response = (statusCode: number, message: string, result?: any) => {
    return {
        statusCode: statusCode,
        message: message,
        result: result ?? null
    }
}
/**
 * THIS ACTUALLY CONVERT THE STRING ISO DATE TO UTC DATE
 */
export class DateUtil {
    static toUTCDate(dateString: string): Date {
        const date = new Date(dateString)
        return new Date(
            Date.UTC(
                date.getUTCFullYear(),
                date.getUTCMonth(),
                date.getUTCDate(),
                date.getUTCHours(),
                date.getUTCMinutes(),
                date.getUTCSeconds(),
                date.getUTCMilliseconds()
            )
        )
    }
}
// Utility function for sleep
export const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))
