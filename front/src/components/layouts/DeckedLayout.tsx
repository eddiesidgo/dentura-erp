import Header from '@/components/template/Header'
import HeaderTools from '@/components/template/HeaderTools'
import HeaderLogo from '@/components/template/HeaderLogo'
import SecondaryHeader from '@/components/template/SecondaryHeader'
import MobileNav from '@/components/template/MobileNav'
import View from '@/views'

const HeaderActionsStart = () => {
    return (
        <>
            <HeaderLogo />
            <MobileNav />
        </>
    )
}

const DeckedLayout = () => {
    return (
        <div className="app-layout-simple flex flex-auto flex-col min-h-screen">
            <div className="flex flex-auto min-w-0">
                <div className="flex flex-col flex-auto min-h-screen min-w-0 relative w-full bg-[#F5F7F9] dark:bg-gray-900">
                    <Header
                        container
                        className="border-b border-gray-100 dark:border-gray-700"
                        headerStart={<HeaderActionsStart />}
                        headerEnd={<HeaderTools />}
                    />
                    <SecondaryHeader contained />
                    <View pageContainerType="contained" />
                </div>
            </div>
        </div>
    )
}

export default DeckedLayout
