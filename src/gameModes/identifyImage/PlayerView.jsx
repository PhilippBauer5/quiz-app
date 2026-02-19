// IdentifyImage PlayerView — Placeholder
// The default QA player flow in PlayerScreen already renders image_path.
// This component is here for registry completeness and future extraction.
export default function IdentifyImagePlayerView({
  room,
  question,
  playerData,
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
      <p className="text-gray-400">Wer oder was ist das? – Spieler-Ansicht</p>
    </div>
  );
}
