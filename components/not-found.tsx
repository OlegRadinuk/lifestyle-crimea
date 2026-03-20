export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0B2A35] to-[#051015]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#139AB6] mb-4">404</h1>
        <p className="text-white text-lg mb-8">Страница не найдена</p>
        <a 
          href="/" 
          className="inline-block px-6 py-3 bg-[#139AB6] text-white rounded-full hover:bg-[#0f7f96] transition-colors"
        >
          Вернуться на главную
        </a>
      </div>
    </div>
  );
}