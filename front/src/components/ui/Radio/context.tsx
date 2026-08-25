import { createContext } from 'react'

type RadioGroupContextProps = {
    vertical?: boolean
    name?: string
     
    value?: any
    color?: string
    disabled?: boolean
    radioGutter?: number
     
    onChange?: (nextValue: any, e: MouseEvent) => void
}

const RadioGroupContext = createContext<RadioGroupContextProps>({})

export const RadioGroupContextProvider = RadioGroupContext.Provider

export default RadioGroupContext
