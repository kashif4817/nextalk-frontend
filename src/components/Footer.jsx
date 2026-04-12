export default function Footer() {
  return (
    <footer className="border-t border-stone-200/60 bg-white/50 px-4 sm:px-6 lg:px-8 py-3.5 shrink-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-400">
        <p>&copy; 2024 LUXE Premium Store. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-stone-600 transition-colors">Privacy</a>
          <a href="#" className="hover:text-stone-600 transition-colors">Terms</a>
          <a href="#" className="hover:text-stone-600 transition-colors">Support</a>
        </div>
      </div>
    </footer>
  );
}
