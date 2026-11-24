import type { ReactNode } from "react"

type baseButtonProps = {
    title: string,
    className: string,
    disabled?: boolean,
    icon?: ReactNode,
}

export default function BaseButton(
    {
        title,
        className,
        disabled,
        icon,
    }: baseButtonProps
) {
    return (
        <button
            type="button"
            disabled={disabled}
            className={`rounded-[.2rem] cursor-pointer disabled:cursor-default ${className}`}
        >
            {title}
            {icon}
        </button>
    )
}
