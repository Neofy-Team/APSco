import HomeAboutSection from "./components/HomeAboutSection"
import HomeContactSection from "./components/HomeContactSection"
import HomeFeaturedProduct from "./components/HomeFeaturedProduct"
import HomeHero from "./components/HomeHero"
import HomeProcessSection from "./components/HomeProcessSection"
import HomeProductsSection from "./components/HomeProductsSection"

export default function HomePage() {
    return (
        <main className="-mx-5">
            <HomeHero />
            <HomeAboutSection />
            <HomeProductsSection />
            <HomeFeaturedProduct />
            <HomeProcessSection />
            <HomeContactSection />
        </main>
    )
}
