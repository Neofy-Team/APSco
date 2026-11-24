import { Box, CircleCheck, Factory, Lightbulb } from "lucide-react"

const processSteps = [
    {
        number: "01",
        title: "Ideas & design",
        description: "Understanding needs",
        Icon: Lightbulb,
    },
    {
        number: "02",
        title: "Manufacturing",
        description: "Bringing designs to life",
        Icon: Factory,
    },
    {
        number: "03",
        title: "Product review",
        description: "Checking the details",
        Icon: CircleCheck,
    },
    {
        number: "04",
        title: "Sales & supply",
        description: "Direct from the maker",
        Icon: Box,
    },
]

export default function HomeProcessSection() {
    return (
        <section
            id="our-process"
            aria-labelledby="home-process-title"
            className="grid gap-y-5 bg-[#1c2d34] px-5 py-6 text-primary
                       lg:grid-cols-[minmax(0,70fr)_minmax(0,30fr)] lg:gap-x-[4.2%]
                       lg:px-[2.8%] lg:py-[clamp(.55rem,.95vw,1.25rem)]"
        >
            <div className="lg:col-start-2 lg:row-start-1">
                <p className="text-sm leading-tight font-bold text-accent lg:text-end lg:text-[clamp(.85rem,1.37vw,1.5rem)]">
                    04 / How products come to life
                </p>
                <h2
                    id="home-process-title"
                    className="mt-2 text-[clamp(1.85rem,5.5vw,2.75rem)] leading-[1.02]
                               font-extrabold tracking-tight lg:mt-[.5vw]
                               lg:text-[clamp(1.95rem,3.28vw,3.9rem)]"
                >
                    <span className="block">From an idea</span>
                    <span className="block">to everyday life.</span>
                </h2>
            </div>

            <ol className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-4
                           lg:col-start-1 lg:row-start-1 lg:self-end
                           lg:border-e lg:border-primary-50 lg:pe-[.9vw] lg:pb-[.65vw]">
                {processSteps.map(({ number, title, description, Icon }) => (
                    <li
                        key={number}
                        className="relative min-w-0 text-center md:after:absolute md:after:start-[84%]
                                   md:after:top-[.95em] md:after:h-px md:after:w-[42%]
                                   md:after:bg-primary-50 md:last:after:hidden"
                    >
                        <div className="flex items-center justify-center gap-3 lg:gap-[1.45vw]">
                            <Icon
                                aria-hidden="true"
                                className="size-[clamp(1.5rem,2.65vw,2.95rem)]"
                                strokeWidth={1.4}
                            />
                            <span
                                aria-hidden="true"
                                className="rounded-sm bg-accent px-[.5em] py-[.2em] text-xs
                                           leading-tight font-extrabold text-b
                                           lg:text-[clamp(.75rem,1.1vw,1.15rem)]"
                            >
                                {number}
                            </span>
                        </div>
                        <h3 className="mt-1.5 text-sm leading-tight font-bold lg:text-[clamp(.85rem,1.35vw,1.45rem)]">
                            {title}
                        </h3>
                        <p className="mt-0.5 text-xs leading-tight lg:text-[clamp(.75rem,1.18vw,1.3rem)]">
                            {description}
                        </p>
                    </li>
                ))}
            </ol>
        </section>
    )
}
