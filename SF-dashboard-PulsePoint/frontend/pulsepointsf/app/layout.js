// Import Google Fonts for consistent typography across the application
import { Geist, Geist_Mono } from "next/font/google";
// Import global CSS styles that apply to all pages
import "./globals.css";

// Configure primary sans-serif font (Geist) for body text and UI elements
const geistSans = Geist({
  variable: "--font-geist-sans", // CSS custom property for font family
  subsets: ["latin"],            // Load only Latin character subset for performance
});

// Configure monospace font (Geist Mono) for code blocks and technical content
const geistMono = Geist_Mono({
  variable: "--font-geist-mono", // CSS custom property for monospace font
  subsets: ["latin"],            // Load only Latin character subset for performance
});

// Next.js metadata object for SEO and browser tab information
export const metadata = {
  title: "PulsePoint SF - 3D Dashboard",           // Browser tab title
  description: "3D interactive map dashboard for San Francisco data visualization", // Meta description for SEO
  keywords: "San Francisco, 3D map, dashboard, data visualization, deck.gl", // SEO keywords
  viewport: "width=device-width, initial-scale=1", // Responsive viewport settings
};

/**
 * Root Layout Component - Wraps all pages in the Next.js application
 *
 * This layout provides:
 * - HTML document structure with proper language attribute
 * - Font loading and CSS custom property setup
 * - Global styling foundation
 * - Consistent layout wrapper for all pages
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content to render inside layout
 * @returns {JSX.Element} Complete HTML document structure
 */
export default function RootLayout({ children }) {
  return (
    // HTML root element with language attribute for accessibility and SEO
    <html lang="en">
      <body
        // Apply both font CSS custom properties to body for global font availability
        className={`${geistSans.variable} ${geistMono.variable}`}
        // Prevent flash of unstyled content and ensure smooth font loading
        style={{ fontFamily: 'var(--font-geist-sans)' }}
      >
        {/* Render the specific page content passed as children */}
        {children}
      </body>
    </html>
  );
}
