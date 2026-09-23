import Header from '@/components/template/Header'
import HeaderTools from '@/components/template/HeaderTools'
import MobileNav from '@/components/template/MobileNav'
import StackedSideNav from '@/components/template/StackedSideNav'
import View from '@/views'

const HeaderActionsStart = () => {
    return (
        <>
            <MobileNav />
        </>
    )
}

const StackedSideLayout = () => {
    return (
        <div className="app-layout-stacked-side flex flex-auto flex-col">
            <div className="flex flex-auto min-w-0">
                <StackedSideNav />
                <div className="flex flex-col flex-auto min-h-screen min-w-0 relative w-full bg-[#F5F7F9] dark:bg-gray-900">
                    <Header
                        className="border-b border-gray-100 dark:border-gray-700"
                        headerStart={<HeaderActionsStart />}
                        headerEnd={<HeaderTools />}
                    />
                    <div className="h-full flex flex-auto flex-col">
                        <View />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StackedSideLayout
