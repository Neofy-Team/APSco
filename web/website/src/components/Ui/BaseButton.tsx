
type baseButtonProps = {
    title: string,
    className: string,
}

export default function BaseButton(
    {
        title,
        className,
    }: baseButtonProps
) {
    return (
        <button className={`rounded-[.2rem] cursor-pointer ${className}`}>
            {title}
        </button>
    )
}
