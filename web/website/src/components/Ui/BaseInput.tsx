
type baseInputProps = {
    placeHolder : string,
}

export default function BaseInput({placeHolder} : baseInputProps) {
    return (
        <input type="text" placeholder={placeHolder}/>
    )
}
