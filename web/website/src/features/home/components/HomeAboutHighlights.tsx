import { Box, Lightbulb, Settings } from "lucide-react"

const highlights = [
    {
        title: "Creative thinking",
        description: "Ideas with purpose",
        Icon: Box,
        iconColor: "text-accent",
    },
    {
        title: "Precision manufacturing",
        description: "Turning ideas into products",
        Icon: Settings,
        iconColor: "text-primary",
    },
    {
        title: "Direct access",
        description: "Products from the maker",
        Icon: Lightbulb,
        iconColor: "text-accent",
    },
]

export default function HomeAboutHighlights() {
    return (
        <ul className="mt-4 grid md:grid-cols-3 lg:mt-[clamp(1rem,2vw,2.5rem)]">
            {highlights.map(({ title, description, Icon, iconColor }) => (
                <li
                    key={title}
                    className="flex items-start gap-3 border-t border-primary-50/70 py-3
                               first:border-t-0 md:justify-center md:border-s md:border-t-0
                               md:px-3 md:py-0 md:first:border-s-0 lg:gap-[1.35vw] lg:ps-[2vw]"
                >
                    <div className="min-w-0">
                        <h3 className="text-base leading-tight font-bold lg:text-[clamp(1rem,1.65vw,1.78rem)]">
                            {title}
                        </h3>
                        <p className="mt-0.5 text-sm leading-tight lg:text-[clamp(.8rem,1.3vw,1.35rem)]">
                            {description}
                        </p>
                    </div>
                    <Icon
                        aria-hidden="true"
                        strokeWidth={1.5}
                        className={`mt-0.5 size-[clamp(1.4rem,2.35vw,2.65rem)] shrink-0 ${iconColor}`}
                    />
                </li>
            ))}
        </ul>
    )
}
