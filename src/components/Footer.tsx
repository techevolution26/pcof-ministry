export default function Footer() {
    return (
        <footer className="border-t border-green-100 bg-white py-8 text-center">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                        © PCOF {new Date().getFullYear()} — Pentecostal Church One Faith Ministry
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Built with</span>
                        <span className="text-red-500">❤️</span>
                        <span>by</span>
                        <a
                            href="https://techresolute.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-600 hover:text-sky-700 font-medium transition-colors"
                        >
                            Tech Resolute
                        </a>
                    </div>

                    <div className="flex gap-4">
                        <a
                            href="/contact"
                            className="text-sm text-gray-600 hover:text-sky-600 transition-colors"
                        >
                            Contact
                        </a>
                        <a
                            href="/privacy"
                            className="text-sm text-gray-600 hover:text-sky-600 transition-colors"
                        >
                            Privacy
                        </a>
                        <a
                            href="/terms"
                            className="text-sm text-gray-600 hover:text-sky-600 transition-colors"
                        >
                            Terms
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}