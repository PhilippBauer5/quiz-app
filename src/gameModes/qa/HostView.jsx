// QA HostView — Placeholder
// The existing HostScreen already implements full QA logic.
// This component is here for registry completeness and future extraction.
export default function QAHostView({ room, questions, players }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
      <p className="text-gray-400">Klassisch Frage & Antwort – Host-Ansicht</p>
    </div>
  );
}
