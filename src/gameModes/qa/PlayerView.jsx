// QA PlayerView — Placeholder
// The existing PlayerScreen already implements full QA logic.
// This component is here for registry completeness and future extraction.
export default function QAPlayerView({ room, questions, playerData }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
      <p className="text-gray-400">
        Klassisch Frage & Antwort – Spieler-Ansicht
      </p>
    </div>
  );
}
