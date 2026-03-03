export default function AppLogo() {
    return (
        <>
            {/* Collapsed only: circular CH icon — hidden when sidebar is expanded */}
            <div
                className="size-8 shrink-0 hidden group-data-[collapsible=icon]:block"
                role="img"
                aria-label="Chan Traders Hub"
                style={{
                    backgroundImage: 'url(/logo/Admin.svg)',
                    backgroundSize: 'auto 32px',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'left center',
                }}
            />

            {/* Expanded: full "CHAN TRADERS HUB" wordmark */}
            <div className="ml-1 flex items-center group-data-[collapsible=icon]:hidden">
                <img src="/logo/Admin.svg" alt="Chan Traders Hub" className="h-7 w-auto" />
            </div>
        </>
    );
}
