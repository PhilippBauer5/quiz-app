export default function TrueFalsePlayerView({ room, questions, playerData }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
      <p className="text-4xl mb-4">🤔</p>
      <h2 className="text-xl font-semibold mb-2">Wahr und Lüge</h2>
      <p className="text-gray-400">
        Dieser Spielmodus ist noch in Entwicklung.
      </p>
    </div>
  );
}
