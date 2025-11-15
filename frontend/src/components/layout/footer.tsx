import Link from "next/link";

export function Footer() {
  const productLinks = [
    { label: "Markets", href: "#markets" },
    { label: "Leaderboard", href: "#" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#" },
  ];

  const resourceLinks = [
    { label: "Documentation", href: "#" },
    { label: "Whitepaper", href: "#" },
    { label: "Smart Contracts", href: "#" },
    { label: "API", href: "#" },
  ];

  const communityLinks = [
    { label: "Twitter", href: "#" },
    { label: "Discord", href: "#" },
    { label: "Telegram", href: "#" },
    { label: "GitHub", href: "#" },
  ];

  return (
    <footer className="border-t border-[#334155] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-xl font-bold">PROPHET</span>
            </div>
            <p className="text-sm text-gray-400">
              Predict anything. Earn everything.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {communityLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#334155] flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>&copy; 2024 Prophet. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-white">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
