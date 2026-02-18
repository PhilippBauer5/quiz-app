import { Link } from 'react-router-dom';

const cards = [
  {
    to: '/quiz/create',
    title: 'Quiz erstellen',
    description: 'Erstelle ein neues Quiz mit eigenen Fragen.',
    icon: '✏️',
  },
  {
    to: '/room/join',
    title: 'Raum beitreten',
    description: 'Tritt einem laufenden Quiz-Raum bei.',
    icon: '🎮',
  },
  {
    to: '/room/create',
    title: 'Raum erstellen',
    description: 'Wähle ein Quiz und starte als Host.',
    icon: '🏠',
  },
];

export default function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Willkommen</h1>
      <p className="text-gray-400 mb-8">Was möchtest du tun?</p>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="block rounded-xl border border-gray-800 bg-gray-900 p-6 hover:border-blue-500 hover:bg-gray-800 transition-all"
          >
            <div className="text-3xl mb-3">{card.icon}</div>
            <h2 className="text-lg font-semibold mb-1">{card.title}</h2>
            <p className="text-sm text-gray-400">{card.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Link
          to="/quizzes"
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Alle Quizzes anzeigen →
        </Link>
      </div>
    </div>
  );
}
