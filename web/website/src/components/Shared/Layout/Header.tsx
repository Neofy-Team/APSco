import BaseButton from "@/components/Ui/BaseButton"
import Link from "next/link"

export default function Header() {

    const Links = [
        { id: 1, title: "Categories", href: "/" },
        { id: 2, title: "What we do", href: "/" },
        { id: 3, title: "About us", href: "/about-us" },
        { id: 4, title: "Contact", href: "/contact-us" },
    ]

    return (
        <div className='flex items-center justify-between p-5 border-b-2 border-primary-60 bg-bg'>

            <div className="flex items-center gap-x-2">
                <span className="w-5 h-5 bg-accent rounded-[.2rem]" />

                <h2 className="font-extrabold text-d2xl">APSco</h2>
                <h4>COMPANY</h4>
            </div>


            <ul className="flex items-center justify-center gap-x-8 flex-1">
                {Links.map(link => (
                    <Link href={link.href} key={link.id} className="font-bold">
                        {link.title}
                    </Link>
                ))}
            </ul>

            <div className="flex items-center gap-x-5 font-bold">
                <BaseButton title="View Products" className="bg-accent-shades-10 text-b p-2"/>

                <p><span className="text-accent-shades-10">EN</span> / FA</p>
            </div>

        </div>
    )
}
