 
export default function requiredFieldValidation(
    value: any,
    message: string,
): string {
    let validationMessage = ''
    if (!value) {
        validationMessage = message || 'Required'
    }
    return validationMessage
}
