import { Link } from 'react-router-dom';
import { PenLine, Users, Plus, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  PageTransition,
  ScaleOnHover,
  FadeIn,
} from '../components/ui/Animations';

const cards = [
  {
    to: '/quiz/create',
    title: 'Quiz erstellen',
    description: 'Erstelle ein neues Quiz mit eigenen Fragen und Antworten.',
    icon: PenLine,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    to: '/room/join',
    title: 'Raum beitreten',
    description: 'Tritt einem laufenden Quiz-Raum mit einem Code bei.',
    icon: Users,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    to: '/room/create',
    title: 'Raum erstellen',
    description: 'Wähle ein Quiz und starte eine neue Session als Host.',
    icon: Plus,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
];

export default function HomePage() {
  return (
    <PageTransition>
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Willkommen bei der Quiz-App
        </h1>
        <p className="text-gray-400">Was möchtest du tun?</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card, i) => (
          <FadeIn key={card.to} delay={i * 0.08} className="h-full">
            <ScaleOnHover className="h-full">
              <Link to={card.to} className="block h-full">
                <Card className="h-full hover:border-gray-600 transition-colors">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className={`rounded-lg ${card.bg} p-3 w-fit mb-4`}>
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                    <h2 className="text-base font-semibold mb-1">
                      {card.title}
                    </h2>
                    <p className="text-sm text-gray-400 mb-4 flex-1">
                      {card.description}
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm text-blue-400 font-medium">
                      Starten <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </ScaleOnHover>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={0.3}>
        <div className="mt-8 text-center">
          <Link to="/quizzes">
            <Button variant="ghost" size="sm">
              Alle Quizzes anzeigen
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </FadeIn>
    </PageTransition>
  );
}
